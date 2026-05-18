import { InboxSearchComposer } from "@egovernments/digit-ui-module-core";
import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { bulkWitnessDepositionSignConfig } from "../../configs/BulkWitnessDepositionSignConfig";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { WitnessDepositionSignModal } from "./WitnessDepositionSignModal";
import qs from "qs";
import { HomeService } from "../../hooks/services";
import { numberToWords } from "@egovernments/digit-ui-module-orders/src/utils";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";
import {
  BulkSignConfirmModal,
  BulkSignLoadingOverlay,
  BulkSignSubmitBar,
  BulkSignSuccessModal,
  bulkSignSectionsParentStyle,
  parseSignedXml,
} from "./shared/bulkSignViewShared";

function BulkWitnessDepositionView({ setShowToast = () => {} }) {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const userInfo = Digit.UserService.getUser()?.info;
  const [bulkSignList, setBulkSignList] = useState(null);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
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

  const { data: designationData } = Digit.Hooks.useCustomMDMS(tenantId, "common-masters", [{ name: "Designation" }]);
  const judgeDesignation = useMemo(
    () => designationData?.["common-masters"]?.Designation?.find((d) => d.code === "JUDICIAL_MAGISTRATE")?.name || "",
    [designationData]
  );
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

  const witnessDepositionModalInfo = {
    header: `${t("YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_WITNESS_DEPOSITION")} ${numberToWords(successCount)} ${t("ISSUE_WITNESS_DEPOSITION")} `,
    caseInfo: [
      {
        key: t("WITNESS_DEPOSITION_ISSUE_DATE"),
        value: DateUtils.getFormattedDate(new Date(), "DD-MM-YYYY", "/"),
        copyData: false,
      },
    ],
  };

  const fetchResponseFromXmlRequest = async (witnessDepositionRequestList) => {
    const responses = [];

    const requests = witnessDepositionRequestList?.map(async (deposition) => {
      try {
        const formData = qs.stringify({ response: deposition?.request });
        const response = await axiosInstance.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseSignedXml(data, "status") !== "failed") {
          responses.push({
            artifactNumber: deposition?.artifactNumber,
            signedArtifactData: parseSignedXml(data, "data"),
            isWitnessDeposition: true,
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            artifactNumber: deposition?.artifactNumber,
            signedArtifactData: parseSignedXml(data, "data"),
            isWitnessDeposition: true,
            signed: false,
            errorMsg: parseSignedXml(data, "error"),
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
              placeholder: judgeDesignation,
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
              setShowToast({ label: t("WITNESS_DEPOSITION_BULK_SIGN_SUCCESS_MSG"), error: false });
            });
          });
        }
      }
    } catch (error) {
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setToast({
        error: true,
        label: error?.message ? error?.message : t("ERROR_WITNESS_DEPOSITION_BULK_SIGN_MSG"),
        errorId,
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
        customStyle={bulkSignSectionsParentStyle}
      />
    );
  }, [config, counter]);

  return (
    <React.Fragment>
      <BulkSignLoadingOverlay show={isLoading} />
      <React.Fragment>
        <div className={"bulk-esign-order-view select"}>
          <div className="header">{t("BULK_WITNESS_DEPOSITION_SIGN")}</div>
          {MemoInboxSearchComposer}
        </div>
        <BulkSignSubmitBar
          show={hasEvidenceEsignAccess}
          label={t("SIGN_SELECTED_WITNESS_DEPOSITIONS")}
          disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
          onSubmit={() => setShowBulkSignConfirmModal(true)}
        />
      </React.Fragment>
      <BulkSignConfirmModal
        open={showBulkSignConfirmModal}
        onCancel={() => setShowBulkSignConfirmModal(false)}
        onConfirm={() => handleBulkSign()}
        t={t}
        confirmText="CONFIRM_BULK_WITNESS_DEPOSITION_SIGN_TEXT"
      />
      {showBulkSignModal && (
        <WitnessDepositionSignModal
          selectedWitnessDeposition={selectedWitnessDeposition}
          setShowBulkSignModal={setShowBulkSignModal}
          witnessDepositionPaginationData={witnessDepositionPaginationData}
          setCounter={setCounter}
          setShowToast={setToast}
        />
      )}
      <BulkSignSuccessModal
        open={showBulkSignSuccessModal}
        onClose={() => {
          setShowBulkSignSuccessModal(false);
          setCounter((prev) => parseInt(prev) + 1);
        }}
        modalInfo={witnessDepositionModalInfo}
        t={t}
      />
      {toast && (
        <CustomToast
          error={toast?.error}
          label={toast?.label}
          errorId={toast?.errorId}
          onClose={() => setToast(null)}
          duration={toast?.errorId ? 7000 : 5000}
        />
      )}
    </React.Fragment>
  );
}

export default BulkWitnessDepositionView;
