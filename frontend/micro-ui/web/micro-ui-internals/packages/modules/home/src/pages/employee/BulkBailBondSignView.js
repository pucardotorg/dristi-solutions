import { Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { bulkBailBondSignConfig } from "../../configs/BulkBailBondSignConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { BailBondSignModal } from "./BailBondSignModal";
import qs from "qs";
import { HomeService } from "../../hooks/services";
import { numberToWords } from "@egovernments/digit-ui-module-orders/src/utils";
import { Banner } from "@egovernments/digit-ui-react-components";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
const parseXml = (xmlString, tagName) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const element = xmlDoc.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : null;
};
const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

function BulkBailBondSignView({ showToast = () => {} }) {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const userInfo = Digit.UserService.getUser()?.info;
  const [bulkSignList, setBulkSignList] = useState(null);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [selectedBailBond, setSelectedBailBond] = useState(
    sessionStorage.getItem("bulkBailBondSignSelectedItem") ? JSON.parse(sessionStorage.getItem("bulkBailBondSignSelectedItem")) : null
  );
  const [showBulkSignModal, setShowBulkSignModal] = useState(sessionStorage.getItem("bulkBailBondSignSelectedItem") ? true : false);
  const [bailBondPaginationData, setBailBondPaginationData] = useState({});
  const [showBulkSignSuccessModal, setShowBulkSignSuccessModal] = useState(false);
  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const [successCount, setSuccessCount] = useState(0);
  const hasBailBondEsignAccess = useMemo(() => roles?.some((role) => role.code === "BAIL_BOND_ESIGN"), [roles]);
  const [needConfigRefresh, setNeedConfigRefresh] = useState(false);
  const [counter, setCounter] = useState(0);
  const config = useMemo(() => {
    const setBailBondFunc = async (bailbond) => {
      setShowBulkSignModal(true);
      setSelectedBailBond(bailbond);
    };

    const updateBailBondFunc = async (Data, checked) => {
      setBulkSignList((prev) => {
        return prev?.map((item, i) => {
          if (item?.businessObject?.bailDetails?.bailId !== Data?.businessObject?.bailDetails?.bailId) return item;

          return {
            ...item,
            isSelected: checked,
          };
        });
      });
    };
    return {
      ...bulkBailBondSignConfig,
      sections: {
        ...bulkBailBondSignConfig.sections,
        searchResult: {
          ...bulkBailBondSignConfig.sections.searchResult,
          uiConfig: {
            ...bulkBailBondSignConfig.sections.searchResult.uiConfig,
            columns: bulkBailBondSignConfig.sections.searchResult.uiConfig.columns.map((column) => {
              if (column.label === "SELECT") {
                return {
                  ...column,
                  updateOrderFunc: updateBailBondFunc,
                };
              } else if (column.label === "CASE_TITLE") {
                return {
                  ...column,
                  clickFunc: setBailBondFunc,
                };
              } else {
                return column;
              }
            }),
          },
        },
        search: {
          ...bulkBailBondSignConfig.sections.search,
          uiConfig: {
            ...bulkBailBondSignConfig.sections.search.uiConfig,
            defaultValues: {
              ...bulkBailBondSignConfig.sections.search.uiConfig.defaultValues,
              tenantId: tenantId,
              caseTitle: sessionStorage.getItem("bulkBailBondSignCaseTitle") ? sessionStorage.getItem("bulkBailBondSignCaseTitle") : "",
            },
          },
        },
      },
      additionalDetails: {
        setbulkBailBondSignList: setBulkSignList,
        setBailBondPaginationData: setBailBondPaginationData,
        setNeedConfigRefresh: setNeedConfigRefresh,
      },
    };
  }, [needConfigRefresh]);

  const closeToast = useCallback(() => {
    setShowErrorToast(null);
  }, []);

  const getFormattedDate = () => {
    const currentDate = new Date();
    const year = String(currentDate.getFullYear());
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  const bailBondModalInfo = {
    header: `${t("YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_BAIL_BOND")} ${numberToWords(successCount)} ${t("ISSUE_BAIL_BONDS")} `, //NEED TO CHANGE COUNT
    caseInfo: [
      {
        key: t("BAIL_BOND_ISSUE_DATE"),
        value: getFormattedDate(),
        copyData: false,
      },
    ],
  };

  const Heading = useCallback((props) => <span className="heading-m">{props.label}</span>, []);

  const CloseBtn = useCallback(
    (props) => (
      <div onClick={props.onClick}>
        <span className="icon-circle">
          <CloseSvg />
        </span>{" "}
      </div>
    ),
    []
  );

  const fetchResponseFromXmlRequest = async (bailBondRequestList) => {
    const responses = [];

    const requests = bailBondRequestList?.map(async (bailBond) => {
      try {
        // URL encoding the XML request
        const formData = qs.stringify({ response: bailBond?.request });
        const response = await axiosInstance.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseXml(data, "status") !== "failed") {
          responses.push({
            bailId: bailBond?.bailId,
            signedBailData: parseXml(data, "data"),
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            bailId: bailBond?.bailId,
            signedBailData: parseXml(data, "data"),
            signed: false,
            errorMsg: parseXml(data, "error"),
            tenantId: tenantId,
          });
        }
      } catch (error) {
        console.error(`Error fetching bailBond ${bailBond?.bailId}:`, error?.message);
      }
    });

    await Promise.allSettled(requests);
    return responses;
  };

  const handleBulkSign = useCallback(async () => {
    try {
      setIsLoading(true);

      if (bulkSignList && bulkSignList.length > 0) {
        const selectedBulkSignList = bulkSignList
          ?.filter((item) => item?.isSelected)
          ?.map((bailbond) => {
            return {
              fileStoreId: bailbond?.businessObject?.bailDetails?.documents?.find((doc) => doc.documentType === "SIGNED")?.fileStore,
              bailId: bailbond?.businessObject?.bailDetails?.bailId,
              placeholder: "Magistrate Signature",
              tenantId: tenantId,
            };
          });

        if (selectedBulkSignList?.length > 0) {
          const response = await HomeService.getBailBondsToSign(
            {
              criteria: selectedBulkSignList,
            },
            {}
          );
          await fetchResponseFromXmlRequest(response?.bailList).then(async (responseArray) => {
            const updatedBailBondResponse = await HomeService.updateSignedBailBonds(
              {
                signedBails: responseArray,
              },
              {}
            ).then((response) => {
              setShowBulkSignConfirmModal(false);
              setShowBulkSignSuccessModal(true);
              setSuccessCount(response?.bails?.length);
              showToast("success", t("BAIL_BULK_SIGN_SUCCESS_MSG"));
            });
          });
        }
      }
    } catch (error) {
      setShowErrorToast({
        error: true,
        label: error?.message ? error?.message : t("ERROR_BAIL_BULK_SIGN_MSG"),
      });
      setShowBulkSignConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  }, [bulkSignList, tenantId, courtId, bulkSignUrl, t]);

  const MemoInboxSearchComposer = useMemo(() => {
    return (
      <InboxSearchComposer
        key={`bailbond${counter}`}
        pageSizeLimit={sessionStorage.getItem("bulkBailBondSignlimit") || 10}
        configs={config}
        customStyle={sectionsParentStyle}
      />
    );
  }, [config, counter]);

  return (
    <React.Fragment>
      {isLoading && (
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
      <React.Fragment>
        {/* bulk-esign-order-view */}
        <div className={"bulk-esign-order-view select"}>
          <div className="header">{t("BULK_BAIL_BOND_SIGN")}</div>
          {MemoInboxSearchComposer}
        </div>
        {hasBailBondEsignAccess && (
          <div className="bulk-submit-bar">
            <SubmitBar
              label={t("SIGN_SELECTED_BAIL_BONDS")}
              submit="submit"
              disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
              onSubmit={() => setShowBulkSignConfirmModal(true)}
            />
          </div>
        )}
      </React.Fragment>

      {showBulkSignConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_SIGN")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignConfirmModal(false)} />}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => setShowBulkSignConfirmModal(false)}
          actionSaveLabel={t("CS_BULK_SIGN_AND_PUBLISH")}
          actionSaveOnSubmit={() => handleBulkSign()}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_BAIL_BOND_SIGN_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showBulkSignModal && (
        <BailBondSignModal
          selectedBailBond={selectedBailBond}
          setShowBulkSignModal={setShowBulkSignModal}
          bailBondPaginationData={bailBondPaginationData}
          setCounter={setCounter}
        />
      )}
      {showBulkSignSuccessModal && (
        <Modal
          actionSaveLabel={t("BULK_SUCCESS_CLOSE")}
          actionSaveOnSubmit={() => {
            setShowBulkSignSuccessModal(false);
            setCounter((prev) => parseInt(prev) + 1);
          }}
          className={"orders-issue-bulk-success-modal"}
        >
          <div>
            <Banner
              whichSvg={"tick"}
              successful={true}
              message={bailBondModalInfo?.header}
              headerStyles={{ fontSize: "32px" }}
              style={{ minWidth: "100%" }}
            ></Banner>
            {
              <CustomCopyTextDiv
                t={t}
                keyStyle={{ margin: "8px 0px" }}
                valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
                data={bailBondModalInfo?.caseInfo}
              />
            }
          </div>
        </Modal>
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
}

export default BulkBailBondSignView;
