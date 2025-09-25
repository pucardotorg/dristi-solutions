import React, { useState, useEffect, useMemo } from "react";
import { InboxSearchComposer, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { TabSearchConfig } from "./../../configs/E-PostTrackingConfig";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";

const EpostTrackingPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState({});
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const [showErrorToast, setShowErrorToast] = useState(null);
  const userName = useMemo(() => {
    const userInfo = Digit.UserService.getUser()?.info || {};
    return userInfo?.name || "";
  }, []);

  const [tabData, setTabData] = useState(
    TabSearchConfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: index === 0 ? true : false,
    }))
  );

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setActiveTabIndex(n);
  };

  // TODO: need to search way to optimise this
  const { data: epostUserData, isLoading: isEpostUserDataLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Epost",
    [{ name: "PostalHubAndUserName" }],
    {
      select: (data) => {
        return data?.Epost?.PostalHubAndUserName || [];
      },
    }
  );

  const district = useMemo(() => {
    if (!userName) return "";
    const user = epostUserData?.find((user) => user?.userName === userName);
    return user?.postHubName || "";
  }, [epostUserData, userName]);

  const handleDownloadDocument = async (row) => {
    // TODO : need to check with backend team regarding fileStoreId
    const { fileStoreId, processNumber } = row;
    if (fileStoreId) {
      try {
        await downloadPdf(tenantId, fileStoreId, processNumber);
        setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_SUCCESS"), error: false });
      } catch (error) {
        setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_ERROR"), error: true });
      }
    } else {
      setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_ERROR"), error: true });
    }
  };

  const handlePrintAddressLabel = (row) => {
    console.log("row", row);
    // TODO: need to implement
  };

  const handleActionItems = (history, column, row, item) => {
    setSelectedRowData({});
    setShowUpdateStatusModal(false);
    switch (item.id) {
      case "print_document":
        handleDownloadDocument(row);
        break;
      case "print_address_label":
        handlePrintAddressLabel(row);
        break;
      case "update_status":
        setShowUpdateStatusModal(true);
        setSelectedRowData(row);
        break;
      default:
        break;
    }
  };

  const config = useMemo(() => {
    const baseConfig = TabSearchConfig?.[activeTabIndex];
    if (!baseConfig) return null;

    return {
      ...baseConfig,
      sections: {
        ...baseConfig.sections,
        searchResult: {
          ...baseConfig.sections.searchResult,
          uiConfig: {
            ...baseConfig.sections.searchResult.uiConfig,
            columns: baseConfig?.sections?.searchResult?.uiConfig?.columns?.map((column) => {
              return column.label === "CS_ACTIONS"
                ? {
                    ...column,
                    clickFunc: handleActionItems,
                  }
                : column;
            }),
          },
        },
      },
    };
  }, [activeTabIndex]);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  if (isEpostUserDataLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div style={{ borderTop: "1px #e8e8e8 solid", width: "100vw", padding: "24px", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div style={{ fontWeight: 700, fontSize: "2rem" }}>{`${t("HUB_CO_ORDINATOR")}, ${district}`}</div>
        <div>
          <InboxSearchComposer
            key={`e-post-track-${activeTabIndex}`}
            configs={config}
            showTab={true}
            tabData={tabData}
            onTabChange={onTabChange}
          ></InboxSearchComposer>
        </div>
        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default EpostTrackingPage;
