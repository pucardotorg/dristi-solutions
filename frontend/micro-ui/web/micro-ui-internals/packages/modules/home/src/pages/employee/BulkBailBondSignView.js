import { ActionBar, Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState, useRef, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { bulkBailBondSignConfig } from "../../configs/BulkBailBondSignConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import axios from "axios";
import { BailBondSignModal } from "./BailBondSignModal";
import qs from "qs";
import { HomeService } from "../../hooks/services";
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

function BulkBailBondSignView() {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const searchComposerRef = useRef(null);

  const [bulkSignList, setBulkSignList] = useState(null);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [selectedBailBond, setSelectedBailBond] = useState(
    sessionStorage.getItem("bulkBailBondSignSelectedItem") ? JSON.parse(sessionStorage.getItem("bulkBailBondSignSelectedItem")) : null
  );
  const [showBulkSignModal, setShowBulkSignModal] = useState(sessionStorage.getItem("bulkBailBondSignSelectedItem") ? true : false);
  const [bailBondPaginationData, setBailBondPaginationData] = useState({});

  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (isJudge || isTypist || isBenchClerk) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
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
              } else if (column.label === "CASE_NAME_AND_NUMBER") {
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
              caseTitle: sessionStorage.getItem("bulkBailBondSignCaseTitle") || "",
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
        const response = await axios.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseXml(data, "status") !== "failed") {
          responses.push({
            orderNumber: bailBond?.bailId,
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
              placeholder: "Signature",
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
            );
            console.log(updatedBailBondResponse, "updatedBailBondResponse", updatedBailBondResponse?.bails?.length);

            // history.replace(homePath, {
            //   bulkSignSuccess: {
            //     show: true,
            //     bailBondCount: updatedBailBondResponse?.bailBond?.length,
            //   },
            // });
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
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          {/* bulk-esign-order-view */}
          <div className={""} style={{ width: "100%", maxHeight: "calc(-250px + 100vh)", overflowY: "auto" }}>
            {MemoInboxSearchComposer}
          </div>
          {isJudge && (
            <ActionBar className={"e-filing-action-bar"} style={{ justifyContent: "space-between" }}>
              <div style={{ width: "fit-content", display: "flex", gap: 20 }}>
                <SubmitBar
                  label={t("SIGN_SELECTED_BAIL_BONDS")}
                  submit="submit"
                  disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
                  onSubmit={() => setShowBulkSignConfirmModal(true)}
                />
              </div>
            </ActionBar>
          )}
        </React.Fragment>
      )}
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
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
}

export default BulkBailBondSignView;
