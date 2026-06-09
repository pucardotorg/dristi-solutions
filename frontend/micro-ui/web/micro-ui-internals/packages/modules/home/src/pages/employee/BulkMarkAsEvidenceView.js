import { ActionBar, Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { bulkMarkAsEvidenceConfig } from "../../configs/BulkMarkAsEvidenceConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import MarkAsEvidence from "@egovernments/digit-ui-module-dristi/src/pages/employee/AdmittedCases/MarkAsEvidence";
import { HomeService } from "../../hooks/services";
import { numberToWords } from "@egovernments/digit-ui-module-orders/src/utils";
import { Banner } from "@egovernments/digit-ui-react-components";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import qs from "qs";

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

function BulkMarkAsEvidenceView({ showToast = () => {} }) {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const [bulkSignList, setBulkSignList] = useState(null);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(
    sessionStorage.getItem("markAsEvidenceSelectedItem") ? JSON.parse(sessionStorage.getItem("markAsEvidenceSelectedItem")) : null
  );
  const [showMakeAsEvidenceModal, setShowMakeAsEvidenceModal] = useState(sessionStorage.getItem("markAsEvidenceSelectedItem") ? true : false);
  const [showBulkEvidenceSuccessModal, setShowBulkEvidenceSuccessModal] = useState(false);
  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const [successCount, setSuccessCount] = useState(0);
  const hasEvidenceEsignAccess = useMemo(() => roles?.some((role) => role.code === "EVIDENCE_ESIGN"), [roles]);
  const [needConfigRefresh, setNeedConfigRefresh] = useState(false);
  const [counter, setCounter] = useState(0);
  const [paginatedData, setEvidencePaginationData] = useState({});

  const config = useMemo(() => {
    return {
      ...bulkMarkAsEvidenceConfig,
      sections: {
        ...bulkMarkAsEvidenceConfig.sections,
        searchResult: {
          ...bulkMarkAsEvidenceConfig.sections.searchResult,
          uiConfig: {
            ...bulkMarkAsEvidenceConfig.sections.searchResult.uiConfig,
            columns: bulkMarkAsEvidenceConfig.sections.searchResult.uiConfig.columns.map((column) => {
              if (column.label === "SELECT") {
                return {
                  ...column,
                  updateOrderFunc: (data, checked) => {
                    setBulkSignList((prev) => {
                      return prev?.map((item, i) => {
                        if (item?.businessObject?.artifactDetails?.artifactNumber !== data?.businessObject?.artifactDetails?.artifactNumber)
                          return item;

                        return {
                          ...item,
                          isSelected: checked,
                        };
                      });
                    });
                  },
                };
              } else if (column.label === "CASE_TITLE") {
                return {
                  ...column,
                  clickFunc: (evidence) => {
                    setSelectedEvidence(evidence);
                    setShowMakeAsEvidenceModal(true);
                  },
                };
              } else {
                return column;
              }
            }),
          },
        },
        search: {
          ...bulkMarkAsEvidenceConfig.sections.search,
          uiConfig: {
            ...bulkMarkAsEvidenceConfig.sections.search.uiConfig,
            defaultValues: {
              ...bulkMarkAsEvidenceConfig.sections.search.uiConfig.defaultValues,
              tenantId: tenantId,
              caseTitle: sessionStorage.getItem("bulkMarkAsEvidenceCaseTitle") ? sessionStorage.getItem("bulkMarkAsEvidenceCaseTitle") : "",
            },
          },
        },
      },
      additionalDetails: {
        setbulkEvidenceList: setBulkSignList,
        setNeedConfigRefresh: setNeedConfigRefresh,
        setMarkAsEvidencePaginationData: setEvidencePaginationData,
      },
    };
  }, [needConfigRefresh, tenantId]);

  const closeToast = useCallback(() => {
    setShowErrorToast(null);
  }, []);

  const evidenceModalInfo = {
    // header: `${t("YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_EVIDENCE")} ${numberToWords(successCount)} ${t("ISSUE_EVIDENCES")} `,

    header: `${t("YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_EVIDENCE")}`,
    caseInfo: [
      // {
      //   key: t("EVIDENCE_ISSUE_DATE"),
      //   value: getFormattedDate(),
      //   copyData: false,
      // },
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

  const fetchResponseFromXmlRequest = async (MarkAsEvidenceRequestList) => {
    const responses = [];

    const requests = MarkAsEvidenceRequestList?.map(async (MarkAsEvidence) => {
      try {
        // URL encoding the XML request
        const formData = qs.stringify({ response: MarkAsEvidence?.request });
        const response = await axiosInstance.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseXml(data, "status") !== "failed") {
          responses.push({
            artifactNumber: MarkAsEvidence?.artifactNumber,
            signedArtifactData: parseXml(data, "data"),
            isWitnessDeposition: false,
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            artifactNumber: MarkAsEvidence?.artifactNumber,
            signedArtifactData: parseXml(data, "data"),
            isWitnessDeposition: false,
            signed: false,
            errorMsg: parseXml(data, "error"),
            tenantId: tenantId,
          });
        }
      } catch (error) {
        console.error(`Error fetching MarkAsEvidence ${MarkAsEvidence?.artifactNumber}:`, error?.message);
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
          ?.map((evidence) => {
            return {
              fileStoreId: evidence?.businessObject?.artifactDetails?.seal?.fileStore,
              artifactNumber: evidence?.businessObject?.artifactDetails?.artifactNumber,
              placeholder: "Judge/Magistrate",
              tenantId: tenantId,
            };
          });

        if (selectedBulkSignList?.length > 0) {
          const response = await HomeService.getEvidencesToSign(
            {
              criteria: selectedBulkSignList,
            },
            {}
          );
          await fetchResponseFromXmlRequest(response?.artifactList).then(async (responseArray) => {
            await HomeService.updateSignedEvidences(
              {
                signedArtifacts: responseArray,
              },
              {}
            ).then((response) => {
              setShowBulkSignConfirmModal(false);
              setShowBulkEvidenceSuccessModal(true);
              setSuccessCount(response?.artifactList?.length);
              // showToast("success", t("EVIDENCE_BULK_SIGN_SUCCESS_MSG"));
            });
          });
        }
      }
    } catch (error) {
      setShowErrorToast({
        error: true,
        label: error?.message ? error?.message : t("ERROR_EVIDENCE_BULK_SIGN_MSG"),
      });
      setShowBulkSignConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  }, [bulkSignList, tenantId, userInfo, showToast, t]);

  const MemoInboxSearchComposer = useMemo(() => {
    return (
      <InboxSearchComposer
        key={`evidence${counter}`}
        pageSizeLimit={sessionStorage.getItem("bulkMarkAsEvidencelimit") || 10}
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
          <div className="header">{t("BULK_EVIDENCE_SIGN")}</div>
          {MemoInboxSearchComposer}
        </div>
        {hasEvidenceEsignAccess && (
          <div className="bulk-submit-bar">
            <SubmitBar
              label={t("SIGN_SELECTED_EVIDENCE")}
              submit="submit"
              disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
              onSubmit={() => setShowBulkSignConfirmModal(true)}
            />
          </div>
        )}
      </React.Fragment>

      {showBulkSignConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_ESIGN")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignConfirmModal(false)} />}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => setShowBulkSignConfirmModal(false)}
          actionSaveLabel={t("PROCEED_TO_E_SIGN")}
          actionSaveOnSubmit={() => handleBulkSign()}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_EVIDENCE_SIGN_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showMakeAsEvidenceModal && (
        <MarkAsEvidence
          t={t}
          isEvidenceLoading={isLoading}
          setShowMakeAsEvidenceModal={setShowMakeAsEvidenceModal}
          evidenceDetailsObj={selectedEvidence?.businessObject?.artifactDetails}
          paginatedData={paginatedData}
          setDocumentCounter={setCounter}
          showToast={showToast}
        />
      )}
      {showBulkEvidenceSuccessModal && (
        <Modal
          actionSaveLabel={t("BULK_SUCCESS_CLOSE")}
          actionSaveOnSubmit={() => {
            setShowBulkEvidenceSuccessModal(false);
            setCounter((prev) => parseInt(prev) + 1);
          }}
          className={"orders-issue-bulk-success-modal"}
        >
          <div>
            <Banner
              whichSvg={"tick"}
              successful={true}
              message={evidenceModalInfo?.header}
              headerStyles={{ fontSize: "32px" }}
              style={{ minWidth: "100%" }}
            ></Banner>
            {/* {
              <CustomCopyTextDiv
                t={t}
                keyStyle={{ margin: "8px 0px" }}
                valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
                data={evidenceModalInfo?.caseInfo}
              />
            } */}
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
}

export default BulkMarkAsEvidenceView;
