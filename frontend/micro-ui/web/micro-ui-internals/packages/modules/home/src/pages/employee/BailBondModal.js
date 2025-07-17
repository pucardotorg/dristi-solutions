import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useHistory } from "react-router-dom";
import { Loader, CloseSvg } from "@egovernments/digit-ui-react-components";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { Urls } from "../../hooks";

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const formatDate = (date) => {
  if (!date) return "";
  const convertedDate = new Date(date);
  return convertedDate.toLocaleDateString();
};

const BailBondModal = ({ row, setShowBailModal = () => {}, setUpdateCounter }) => {
  const queryStrings = Digit.Hooks.useQueryParams();

  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const [loader, setLoader] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [showBailConfirmationModal, setShowBailConfirmationModal] = useState(false);
  const [isDocviewOpened, setIsDocViewOpened] = useState(false);
  const [bailBondsLoading, setBailBondsLoading] = useState(false);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role?.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role?.code === "TYPIST_ROLE"), [roles]);
  const today = new Date();
  const OrderWorkflowAction = Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {};
  const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};
  const orderType = "WARRANT";
  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const filingNumber = row?.filingNumber || queryStrings?.filingNumber;
  const caseId = row?.caseId || queryStrings?.caseId;
  const caseTitle = row?.caseTitle || queryStrings?.caseTitle;
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");

  console.log(queryStrings, "queryStrings");

  const userType = useMemo(() => {
    if (!userInfo) return "employee";
    return userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }, [userInfo]);

  useEffect(() => {
    if (!isJudge && !isBenchClerk && !isTypist) {
      history.push(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, [isJudge, isBenchClerk, userType, history, isTypist]);

  const [selectedBailBondFilestoreid, setSelectedBailBondFilestoreid] = useState("");
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  console.log(row, "bond");

  const [bailBonds, setBailBonds] = useState([]);
  console.log(row);
  const courtId = localStorage.getItem("courtId");
  const formatAdvocateNames = (advocateNames) => {
    if (advocateNames.length > 0) {
      return `${advocateNames[0]}${
        advocateNames.length === 2 ? " + 1 Other" : advocateNames.length > 2 ? ` + ${advocateNames.length - 1} others` : ""
      }`;
    }
    return "";
  };

  useEffect(() => {
    const getBailBonds = async () => {
      setBailBondsLoading(true);
      try {
        const bailBonds = await DRISTIService.customApiService(Urls.bailBondSearch, {
          criteria: {
            tenantId: tenantId,
            // courtId: courtId,
            filingNumber: filingNumber,
            fuzzySearch: true,
          },
          pagination: {
            limit: 100,
            offSet: 0,
            sortBy: "startDate",
            order: "ASC",
          },
        });
        const caseDetails = await DRISTIService.caseDetailSearchService(
          {
            criteria: {
              filingNumber: filingNumber,
              ...(courtId && { courtId }),
            },
            tenantId,
          },
          {}
        );
        const individualIdAdvocateNameMapping = {};
        caseDetails?.cases?.representatives?.forEach((element) => {
          if (element?.additionalDetails?.advocateName) {
            element?.representing?.forEach((rep) => {
              individualIdAdvocateNameMapping[rep?.additionalDetails?.uuid] = [
                ...(individualIdAdvocateNameMapping[rep?.additionalDetails?.uuid] || []),
                element?.additionalDetails?.advocateName,
              ];
            });
          }
        });

        Object.keys(individualIdAdvocateNameMapping).forEach((key) => {
          const advocateNames = individualIdAdvocateNameMapping[key];
          const formattedAdvocateName = formatAdvocateNames(advocateNames);
          individualIdAdvocateNameMapping[key] = formattedAdvocateName;
        });

        const filteredBailBonds = bailBonds?.bails?.filter(
          (bond) => bond?.status === "COMPLETED" || bond?.status === "VOID" || bond?.status === "PENDING_REVIEW"
        );
        const formattedBailBonds = filteredBailBonds?.map((bond, index) => ({
          name: `${t("BAIL_BOND")} ${index + 1}`,
          advocate: individualIdAdvocateNameMapping[bond?.litigantId] || "",
          litigantName: bond?.litigantName,
          date: formatDate(bond?.auditDetails?.createdTime),
          bailId: bond?.bailId,
          fileStoreId: bond?.documents?.find((doc) => doc?.documentType === "SIGNED")?.fileStore,
        }));
        setBailBonds(formattedBailBonds);
      } catch (e) {
        console.log(e);
      } finally {
        setBailBondsLoading(false);
      }
    };

    getBailBonds();
  }, [courtId, filingNumber, t, tenantId]);

  const createOrder = async () => {
    const reqbody = {
      order: {
        createdDate: null,
        tenantId,
        // cnrNumber,
        filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: orderType,
        orderCategory: "INTERMEDIATE",
        orderType,
        status: "",
        isActive: true,
        workflow: {
          action: OrderWorkflowAction.SAVE_DRAFT,
          comments: "Creating order",
          assignes: null,
          rating: null,
          documents: [{}],
        },
        additionalDetails: {
          formdata: {
            orderType: {
              code: "WARRANT",
              name: "ORDER_TYPE_WARRANT",
              type: "WARRANT",
              isactive: true,
            },
            "Order Type": {
              code: "WARRANT",
              name: "ORDER_TYPE_WARRANT",
              type: "WARRANT",
              isactive: true,
            },
          },
        },
        documents: [],
      },
    };
    setLoader(true);
    try {
      const res = await ordersService.createOrder(reqbody, { tenantId });
      //need to check
      if (queryStrings?.filingNumber) {
        history.replace(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
      }
      history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
      setShowBailModal(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoader(false);
    }
    return;
  };

  const closePendingTask = async () => {
    try {
      setLoader(true);
      await DRISTIService.customApiService(Urls.pendingTask, {
        pendingTask: {
          name: t("CS_COMMON_BAIL_BOND"),
          entityType: "bail bond",
          referenceId: `MANUAL_BAIL_BOND_${filingNumber}`,
          status: "completed",
          assignedTo: [],
          assignedRole: ["JUDGE_ROLE", "BENCH_CLERK"],
          filingNumber,
          isCompleted: true,
          caseId: caseId,
          caseTitle: caseTitle,
          additionalDetails: {},
          tenantId,
        },
      }).then((res) => {
        if (queryStrings?.filingNumber) {
          setTimeout(() => {
            history.goBack();
          }, 1000);
        } else {
          setTimeout(() => {
            setLoader(false);
            setShowBailConfirmationModal(false);
            setShowBailModal(false);
            if (setUpdateCounter) setUpdateCounter((prev) => prev + 1);
          }, 1000);
        }
      });
    } catch (error) {
      console.error("Error in closePendingTask:", error);
      setLoader(false);
    } finally {
    }
  };

  return (
    <React.Fragment>
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "10001",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      {!showBailConfirmationModal && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                if (queryStrings?.filingNumber) {
                  history.goBack();
                } else setShowBailModal(false);
              }}
            />
          }
          actionSaveLabel={t("Close Task")}
          actionSaveOnSubmit={() => {
            setShowBailConfirmationModal(true);
          }}
          style={{ width: "50%" }}
          actionCancelStyle={{ width: "50%" }}
          actionCancelLabel={t("Issue Warrant")}
          actionCancelOnSubmit={() => {
            createOrder();
          }}
          isDisabled={loader || bailBondsLoading}
          isCustomButtonDisabled={loader || bailBondsLoading}
          isBackButtonDisabled={loader || bailBondsLoading}
          formId="modal-action"
          headerBarMain={<Heading label={t("View Bail Bonds")} />}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
          popupModuleActionBarStyles={{ padding: "0 8px 8px 8px" }}
        >
          <div>
            {bailBondsLoading ? (
              <Loader />
            ) : Array.isArray(bailBonds) && bailBonds.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "24px",
                  gap: "20px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  fontFamily: "Roboto",
                }}
              >
                {bailBonds.map((bond, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      margin: "8px 0",
                      width: "100%",
                      height: "147px",
                      justifyContent: "space-between",
                      padding: "16px 24px",
                      backgroundColor: "#ECF3FD66",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <span style={{ fontWeight: "700", fontSize: "16px" }}>{bond?.name}</span>
                      </div>
                      <div>
                        {" "}
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>{t("CHOOSE_COMPLAINANT")} :</span> {bond?.litigantName}
                      </div>
                      <div>
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>{t("ADVOCATE")} : </span>
                        {bond?.advocate}
                      </div>
                      <div>
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>{t("DATE")} :</span> {bond?.date}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <button
                        style={{
                          backgroundColor: "transparent",
                          fontWeight: "500",
                          color: "#0A5757",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          fontSize: "16px",
                          fontFamily: "Roboto",
                        }}
                        onClick={() => {
                          setIsDocViewOpened(true);
                          setSelectedBailBondFilestoreid(bond?.fileStoreId);
                        }}
                      >
                        {t("VIEW")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  padding: "24px",
                  gap: "20px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  fontFamily: "Roboto",
                }}
              >
                <span style={{ fontSize: "16px" }}>{t("NO_BAIL_BONDS")} </span>
              </div>
            )}
          </div>{" "}
        </Modal>
      )}
      {isDocviewOpened && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setIsDocViewOpened(false);
              }}
            />
          }
          style={{ width: "50%" }}
          formId="modal-action"
          headerBarMain={true}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
          popupModuleActionBarStyles={{ padding: "0 8px 8px 8px" }}
        >
          <DocViewerWrapper
            key={"fdsfdsf"}
            fileStoreId={selectedBailBondFilestoreid}
            tenantId={"kl"}
            docWidth="100%"
            docHeight="70vh"
            showDownloadOption={false}
          />
        </Modal>
      )}
      {showBailConfirmationModal && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowBailConfirmationModal(false);
              }}
            />
          }
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={() => {
            closePendingTask();
          }}
          isDisabled={loader}
          isCustomButtonDisabled={loader}
          isBackButtonDisabled={loader}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => {
            showToast("error", t("ISSUE_IN_FETCHING"), 5000);
            setShowBailConfirmationModal(false);
          }}
          formId="modal-action"
          headerBarMain={<Heading label={t("Confirm Closure")} />}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
          popupModuleActionBarStyles={{ padding: "0 8px 8px 8px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              padding: "24px",
              gap: "20px",
              maxHeight: "360px",
              overflowY: "auto",
              fontFamily: "Roboto",
              borderBottom: "1px solid #E8E8E8",
            }}
          >
            <span style={{ fontSize: "16px" }}>{t("CONFIRM_BAIL_BOND_CLOSURE")}</span>
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default BailBondModal;
