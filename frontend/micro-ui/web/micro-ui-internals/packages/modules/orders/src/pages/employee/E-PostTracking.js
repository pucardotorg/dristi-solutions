import React, { useState, useEffect, useMemo } from "react";
import { InboxSearchComposer, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { TabSearchConfig } from "./../../configs/E-PostTrackingConfig";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";
import Inboxheader from "../../components/InboxComposerHeader.js/Inboxheader";
import SubmitBar from "../../components/SubmitBar";
import EpostUpdateStatus from "./EpostUpdateStatus";
import { updateEpostStatusPendingConfig, updateEpostStatusConfig } from "../../configs/EpostFormConfigs";

const defaultSearchValues = {
  pagination: { sortBy: "", order: "" },
  deliveryStatusList: {
    name: "All",
    code: "ALL",
  },
  speedPostId: "",
  bookingDate: "",
};

const EpostTrackingPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState({});
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchRefreshCounter, setSearchRefreshCounter] = useState(0);
  const userName = useMemo(() => {
    const userInfo = Digit.UserService.getUser()?.info || {};
    return userInfo?.name || "";
  }, []);

  const [searchFormData, setSearchFormData] = useState(TabSearchConfig.map(() => ({ ...defaultSearchValues })));

  const [tabData, setTabData] = useState(
    TabSearchConfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: index === 0,
    }))
  );

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n })));
    setActiveTabIndex(n);
  };

  const { data: epostUserData, isLoading: isEpostUserDataLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Epost",
    [{ name: "PostalHubAndUserName" }],
    { select: (data) => data?.Epost?.PostalHubAndUserName || [] }
  );

  const { data: epostStatusDropDown, isLoading: isEpostStatusDropDownLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Epost",
    [{ name: "status" }],
    { select: (data) => data?.Epost?.status || [] }
  );

  const district = useMemo(() => {
    if (!userName) return "";
    const user = epostUserData?.find((user) => user?.userName === userName);
    return user?.district || "";
  }, [epostUserData, userName]);

  const epostStatusDropDownData = useMemo(() => {
    return (epostStatusDropDown || [])?.slice()?.reverse();
  }, [epostStatusDropDown]);

  const handleDownloadDocument = async (row) => {
    const { fileStoreId, processNumber } = row;
    if (!fileStoreId) {
      setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_ERROR"), error: true });
      return;
    }
    try {
      setLoading(true);
      await downloadPdf(tenantId, fileStoreId, processNumber);
      setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_SUCCESS"), error: false });
    } catch (err) {
      setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_ERROR"), error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleActionItems = (history, column, row, item) => {
    setSelectedRowData({});
    setShowUpdateStatusModal(false);
    switch (item.id) {
      case "print_document":
        handleDownloadDocument(row);
        break;
      case "update_status":
        setShowUpdateStatusModal(true);
        setSelectedRowData(row);
        break;
      case "pencil_edit":
        setShowUpdateStatusModal(true);
        setSelectedRowData(row);
        break;
      default:
        break;
    }
  };

  const handleDownloadList = (activeIndex) => {
    if (activeIndex === 2) {
      // TODO: download Reports
      setShowErrorToast({ label: t("Reports Downloaded"), error: false });
    } else {
      // TODO: download List
      setShowErrorToast({ label: t("List Downloaded"), error: false });
    }
  };

  const getSearchRequestBody = (activeTabIndex, searchFormData, baseConfig) => {
    const currentForm = searchFormData[activeTabIndex] || {};
    const currentStatus = currentForm?.deliveryStatusList?.code !== "ALL" ? [currentForm?.deliveryStatusList?.code] : [];
    return {
      processNumber: currentForm?.speedPostId || "",
      deliveryStatusList: activeTabIndex === 1 ? currentStatus : [],
      pagination: {
        ...baseConfig.apiDetails.requestBody.ePostTrackerSearchCriteria.pagination,
        sortBy: currentForm?.pagination?.sortBy || "",
        order: currentForm?.pagination?.order || "",
      },
    };
  };

  const config = useMemo(() => {
    const baseConfig = TabSearchConfig?.[activeTabIndex];
    if (!baseConfig) return null;

    return {
      ...baseConfig,
      apiDetails: {
        ...baseConfig.apiDetails,
        requestBody: {
          ...baseConfig.apiDetails.requestBody,
          tenantId: Digit.ULBService.getCurrentTenantId(),
          ePostTrackerSearchCriteria: getSearchRequestBody(activeTabIndex, searchFormData, baseConfig),
        },
      },
      sections: {
        ...baseConfig.sections,
        search: {
          ...baseConfig.sections.search,
          uiConfig: {
            ...baseConfig.sections.search.uiConfig,
            fields: baseConfig.sections.search.uiConfig.fields?.map((field) => {
              if (field.key === "deliveryStatusList") {
                return {
                  ...field,
                  populators: {
                    ...field.populators,
                    options: [{ id: 0, code: "ALL", name: "All" }, ...epostStatusDropDownData],
                  },
                };
              }

              return field;
            }),
            defaultValues: {
              ...baseConfig.sections.search.uiConfig.defaultValues,
              ...searchFormData[activeTabIndex],
            },
          },
          ...(activeTabIndex !== 1 && {
            additionalCustomization: {
              component: ({ t, formData, setValue }) => (
                <SubmitBar
                  label={t(activeTabIndex === 0 ? "DOWNLOAD_LIST" : "DOWNLOAD_REPORTS")}
                  submit="submit"
                  style={{ width: activeTabIndex === 0 ? "150px" : "175px" }}
                  onSubmit={() => handleDownloadList(activeTabIndex)}
                />
              ),
              className: "custom-button-wrapper",
            },
          }),
        },
        searchResult: {
          ...baseConfig.sections.searchResult,
          uiConfig: {
            ...baseConfig.sections.searchResult.uiConfig,
            columns: baseConfig.sections.searchResult.uiConfig.columns.map((column) => {
              switch (column.label) {
                case "CS_ACTIONS":
                  return { ...column, clickFunc: handleActionItems };
                case "CS_ACTIONS_PENCIL":
                  return { ...column, clickFunc: handleActionItems };
                default:
                  return column;
              }
            }),
          },
        },
      },
    };
  }, [activeTabIndex, searchFormData]);

  const closeToast = () => setShowErrorToast(null);

  const onFormSubmit = (formData, isClear = false) => {
    setSearchFormData((prev) => {
      const newData = [...prev];
      newData[activeTabIndex] = isClear ? { ...defaultSearchValues } : { ...formData };
      return newData;
    });
    setSearchRefreshCounter((prev) => prev + 1);
  };

  const handleUpdateStatus = (formData) => {};

  const modifiedFormConfig = useMemo(() => {
    const baseConfig = activeTabIndex === 0 ? updateEpostStatusPendingConfig : updateEpostStatusConfig;

    return baseConfig.map((section) => ({
      ...section,
      body: section.body.map((field) =>
        field.key === "status"
          ? {
              ...field,
              populators: {
                ...field.populators,
                options: epostStatusDropDownData,
              },
            }
          : field
      ),
    }));
  }, [activeTabIndex, epostStatusDropDownData]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => setShowErrorToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  if (isEpostUserDataLoading || isEpostStatusDropDownLoading) return <Loader />;

  return (
    <React.Fragment>
      {loading && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: 10001,
            position: "fixed",
            top: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgb(234 234 245 / 50%)",
          }}
        >
          <Loader />
        </div>
      )}

      <div style={{ borderTop: "1px #e8e8e8 solid", width: "100vw", padding: "24px", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div style={{ fontWeight: 700, fontSize: "2rem" }}>{`${t("HUB_CO_ORDINATOR")}, ${district}`}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Inboxheader config={config} tabData={tabData} onTabChange={onTabChange} onFormSubmit={onFormSubmit} />
          <InboxSearchComposer
            key={`e-post-track-${activeTabIndex}-${searchRefreshCounter}`}
            configs={config}
            showTab={false}
            tabData={tabData}
            onTabChange={onTabChange}
          />
        </div>

        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn onClose={closeToast} />}
      </div>
      {showUpdateStatusModal && (
        <EpostUpdateStatus
          t={t}
          headerLabel={"Update Status"}
          handleCancel={() => setShowUpdateStatusModal(false)}
          handleSubmit={handleUpdateStatus}
          defaultValue={{}}
          modifiedFormConfig={modifiedFormConfig}
          saveLabel={"CONFIRM"}
          cancelLabel={"CS_COMMON_CANCEL"}
        />
      )}
    </React.Fragment>
  );
};

export default EpostTrackingPage;
