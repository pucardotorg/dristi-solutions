import { ActionBar, Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { bulkWitnessDepositionSignConfig } from "../../configs/BulkWitnessDepositionSignConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { WitnessDepositionSignModal } from "./WitnessDepositionSignModal";
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

function BulkWitnessDepositionView({ showToast = () => {} }) {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const [bulkSignList, setBulkSignList] = useState(null);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [selectedWitnessDeposition, setSelectedWitnessDeposition] = useState(
    sessionStorage.getItem("bulkWitnessDepositionSignSelectedItem")
      ? JSON.parse(sessionStorage.getItem("bulkWitnessDepositionSignSelectedItem"))
      : null
  );
  const [showBulkSignModal, setShowBulkSignModal] = useState(sessionStorage.getItem("bulkWitnessDepositionSignSelectedItem") ? true : false);
  const [witnessDepositionPaginationData, setWitnessDepositionPaginationData] = useState({});
  const [showBulkSignSuccessModal, setShowBulkSignSuccessModal] = useState(false);
  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const [successCount, setSuccessCount] = useState(0);
  const hasEvidenceEsignAccess = useMemo(() => roles?.some((role) => role.code === "EVIDENCE_ESIGN"), [roles]);
  const [needConfigRefresh, setNeedConfigRefresh] = useState(false);
  const [counter, setCounter] = useState(0);
  const config = useMemo(() => {
    const setWitnessDepositionFunc = async (deposition) => {
      setShowBulkSignModal(true);
      setSelectedWitnessDeposition(deposition);
    };

    const updateWitnessDepositionFunc = async (Data, checked) => {
      setBulkSignList((prev) => {
        return prev?.map((item, i) => {
          if (item?.businessObject?.artifactDetails?.artifactNumber !== Data?.businessObject?.artifactDetails?.artifactNumber) return item;

          return {
            ...item,
            isSelected: checked,
          };
        });
      });
    };
    return {
      ...bulkWitnessDepositionSignConfig,
      sections: {
        ...bulkWitnessDepositionSignConfig.sections,
        searchResult: {
          ...bulkWitnessDepositionSignConfig.sections.searchResult,
          uiConfig: {
            ...bulkWitnessDepositionSignConfig.sections.searchResult.uiConfig,
            columns: bulkWitnessDepositionSignConfig.sections.searchResult.uiConfig.columns.map((column) => {
              if (column.label === "SELECT") {
                return {
                  ...column,
                  updateOrderFunc: updateWitnessDepositionFunc,
                };
              } else if (column.label === "CASE_TITLE") {
                return {
                  ...column,
                  clickFunc: setWitnessDepositionFunc,
                };
              } else {
                return column;
              }
            }),
          },
        },
        search: {
          ...bulkWitnessDepositionSignConfig.sections.search,
          uiConfig: {
            ...bulkWitnessDepositionSignConfig.sections.search.uiConfig,
            defaultValues: {
              ...bulkWitnessDepositionSignConfig.sections.search.uiConfig.defaultValues,
              tenantId: tenantId,
              caseTitle: sessionStorage.getItem("bulkWitnessDepositionSignCaseTitle")
                ? sessionStorage.getItem("bulkWitnessDepositionSignCaseTitle")
                : "",
            },
          },
        },
      },
      additionalDetails: {
        setbulkWitnessDepositionSignList: setBulkSignList,
        setWitnessDepositionPaginationData: setWitnessDepositionPaginationData,
        setNeedConfigRefresh: setNeedConfigRefresh,
      },
    };
  }, [needConfigRefresh]);

  const closeToast = useCallback(() => {
    setShowErrorToast(null);
  }, []);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const getFormattedDate = () => {
    const currentDate = new Date();
    const year = String(currentDate.getFullYear());
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  const witnessDepositionModalInfo = {
    header: `${t("YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_WITNESS_DEPOSITION")} ${numberToWords(successCount)} ${t("ISSUE_WITNESS_DEPOSITION")} `, //NEED TO CHANGE COUNT
    caseInfo: [
      {
        key: t("WITNESS_DEPOSITION_ISSUE_DATE"),
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

  const fetchResponseFromXmlRequest = async (witnessDepositionRequestList) => {
    const responses = [];

    const requests = witnessDepositionRequestList?.map(async (deposition) => {
      try {
        // URL encoding the XML request
        const formData = qs.stringify({ response: deposition?.request });
        const response = await axiosInstance.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseXml(data, "status") !== "failed") {
          responses.push({
            artifactNumber: deposition?.artifactNumber,
            signedArtifactData: parseXml(data, "data"),
            isWitnessDeposition: true,
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            artifactNumber: deposition?.artifactNumber,
            signedArtifactData: parseXml(data, "data"),
            isWitnessDeposition: true,
            signed: false,
            errorMsg: parseXml(data, "error"),
            tenantId: tenantId,
          });
        }
      } catch (error) {
        console.error(`Error fetching witness deposition ${deposition?.artifactNumber}:`, error?.message);
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
          ?.map((deposition) => {
            return {
              fileStoreId: deposition?.businessObject?.artifactDetails?.file?.fileStore,
              artifactNumber: deposition?.businessObject?.artifactDetails?.artifactNumber,
              placeholder: "Judicial Magistrate of First Class",
              tenantId: tenantId,
            };
          });

        if (selectedBulkSignList?.length > 0) {
          const response = await HomeService.getWitnessDepositionsToSign(
            {
              criteria: selectedBulkSignList,
            },
            {}
          );
          await fetchResponseFromXmlRequest(response?.artifactList).then(async (responseArray) => {
            await HomeService.updateSignedWitnessDepositions(
              {
                signedArtifacts: responseArray,
              },
              {}
            ).then((response) => {
              setShowBulkSignConfirmModal(false);
              setShowBulkSignSuccessModal(true);
              setSuccessCount(response?.artifacts?.length);
              showToast("success", t("WITNESS_DEPOSITION_BULK_SIGN_SUCCESS_MSG"));
            });
          });
        }
      }
    } catch (error) {
      setShowErrorToast({
        error: true,
        label: error?.message ? error?.message : t("ERROR_WITNESS_DEPOSITION_BULK_SIGN_MSG"),
      });
      setShowBulkSignConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  }, [bulkSignList, tenantId, courtId, bulkSignUrl, t]);

  const MemoInboxSearchComposer = useMemo(() => {
    return (
      <InboxSearchComposer
        key={`witness-deposition-${counter}`}
        pageSizeLimit={sessionStorage.getItem("bulkWitnessDepositionSignlimit") || 10}
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
          <div className="header">{t("BULK_WITNESS_DEPOSITION_SIGN")}</div>
          {MemoInboxSearchComposer}
        </div>
        {hasEvidenceEsignAccess && (
          <div className="bulk-submit-bar">
            <SubmitBar
              label={t("SIGN_SELECTED_WITNESS_DEPOSITIONS")}
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
              <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_WITNESS_DEPOSITION_SIGN_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showBulkSignModal && (
        <WitnessDepositionSignModal
          selectedWitnessDeposition={selectedWitnessDeposition}
          setShowBulkSignModal={setShowBulkSignModal}
          witnessDepositionPaginationData={witnessDepositionPaginationData}
          setCounter={setCounter}
          setShowErrorToast={setShowErrorToast}
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
              message={witnessDepositionModalInfo?.header}
              headerStyles={{ fontSize: "32px" }}
              style={{ minWidth: "100%" }}
            ></Banner>
            {
              <CustomCopyTextDiv
                t={t}
                keyStyle={{ margin: "8px 0px" }}
                valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
                data={witnessDepositionModalInfo?.caseInfo}
              />
            }
          </div>
        </Modal>
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
}

export default BulkWitnessDepositionView;
