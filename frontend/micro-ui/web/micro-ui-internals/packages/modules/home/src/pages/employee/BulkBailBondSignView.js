import { InboxSearchComposer } from "@egovernments/digit-ui-module-core";
import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { bulkBailBondSignConfig } from "../../configs/BulkBailBondSignConfig";
import { BailBondSignModal } from "./BailBondSignModal";
import { HomeService } from "../../hooks/services";
import { numberToWords } from "@egovernments/digit-ui-module-orders/src/utils";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";
import {
  buildBulkSignedResponses,
  BulkSignConfirmModal,
  BulkSignLoadingOverlay,
  BulkSignSubmitBar,
  BulkSignSuccessModal,
  bulkSignSectionsParentStyle,
} from "./shared/bulkSignViewShared";

function BulkBailBondSignView({ setShowToast = () => {} }) {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const userInfo = Digit.UserService.getUser()?.info;
  const [bulkSignList, setBulkSignList] = useState(null);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
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

  const bailBondModalInfo = {
    header: `${t("YOU_HAVE_SUCCESSFULLY_ISSUED_BULK_BAIL_BOND")} ${numberToWords(successCount)} ${t("ISSUE_BAIL_BONDS")} `,
    caseInfo: [
      {
        key: t("BAIL_BOND_ISSUE_DATE"),
        value: DateUtils.getFormattedDate(new Date(), "DD-MM-YYYY", "/"),
        copyData: false,
      },
    ],
  };

  const fetchResponseFromXmlRequest = (bailBondRequestList) =>
    buildBulkSignedResponses({
      requestList: bailBondRequestList,
      bulkSignUrl,
      buildSuccessResponse: (signedData, bailBond) => ({
        bailId: bailBond?.bailId,
        signedBailData: signedData,
        signed: true,
        errorMsg: null,
        tenantId,
      }),
      buildFailureResponse: (signedData, errorMsg, bailBond) => ({
        bailId: bailBond?.bailId,
        signedBailData: signedData,
        signed: false,
        errorMsg,
        tenantId,
      }),
      logErrorLabel: "Error fetching bailBond",
      logErrorIdField: "bailId",
    });

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
            await HomeService.updateSignedBailBonds(
              {
                signedBails: responseArray,
              },
              {}
            ).then((response) => {
              setShowBulkSignConfirmModal(false);
              setShowBulkSignSuccessModal(true);
              setSuccessCount(response?.bails?.length);
              setShowToast({ error: false, label: t("BAIL_BULK_SIGN_SUCCESS_MSG") });
            });
          });
        }
      }
    } catch (error) {
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setToast({
        error: true,
        label: t("ERROR_BAIL_BULK_SIGN_MSG"),
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
        key={`bailbond${counter}`}
        pageSizeLimit={sessionStorage.getItem("bulkBailBondSignlimit") || 10}
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
          <div className="header">{t("BULK_BAIL_BOND_SIGN")}</div>
          {MemoInboxSearchComposer}
        </div>
        <BulkSignSubmitBar
          show={hasBailBondEsignAccess}
          label={t("SIGN_SELECTED_BAIL_BONDS")}
          disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
          onSubmit={() => setShowBulkSignConfirmModal(true)}
        />
      </React.Fragment>
      <BulkSignConfirmModal
        open={showBulkSignConfirmModal}
        onCancel={() => setShowBulkSignConfirmModal(false)}
        onConfirm={() => handleBulkSign()}
        t={t}
        confirmText="CONFIRM_BULK_BAIL_BOND_SIGN_TEXT"
      />
      {showBulkSignModal && (
        <BailBondSignModal
          selectedBailBond={selectedBailBond}
          setShowBulkSignModal={setShowBulkSignModal}
          bailBondPaginationData={bailBondPaginationData}
          setCounter={setCounter}
        />
      )}
      <BulkSignSuccessModal
        open={showBulkSignSuccessModal}
        onClose={() => {
          setShowBulkSignSuccessModal(false);
          setCounter((prev) => parseInt(prev) + 1);
        }}
        modalInfo={bailBondModalInfo}
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

export default BulkBailBondSignView;
