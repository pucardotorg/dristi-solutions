import React, { useState, useEffect, useMemo, useRef } from "react";
import { InboxSearchComposer, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { TabSearchConfig } from "./../../configs/E-PostTrackingConfig";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";
import Inboxheader from "../../components/InboxComposerHeader.js/Inboxheader";
import SubmitBar from "../../components/SubmitBar";
import EpostUpdateStatus from "./EpostUpdateStatus";
import { updateEpostStatusPendingConfig, updateEpostStatusConfig } from "../../configs/EpostFormConfigs";
import { EpostService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import { _getStatus, downloadFile } from "../../utils";
import EmptyTable from "../../components/InboxComposerHeader.js/EmptyTable";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";

const defaultSearchValues = {
  pagination: { sortBy: "", order: "" },
  deliveryStatusList: {
    name: "All",
    code: "ALL",
  },
  speedPostId: "",
  bookingDate: "",
  monthReports: "",
};

const convertToFormData = (t, obj, dropdownData) => {
  const bookingData = [null, 0]?.includes(obj?.bookingDate) ? null : obj?.bookingDate;
  const formdata = {
    statusDate: DateUtils.getFormattedDate(new Date(), "YYYY-MM-DD"),
    remarks: {
      text: obj?.remarks || "",
    },
    speedPostId: obj?.speedPostId || "",
    status: _getStatus(obj?.deliveryStatus, dropdownData),
  };

  return formdata;
};

const EpostTrackingPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const { getEpochRangeFromMonthIST, getEpochRangeFromDateIST } = DateUtils;
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const accessToken = window.localStorage.getItem("token");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [isClearing, setIsClearing] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [initialSearchPerformed, setInitialSearchPerformed] = useState({ 0: true, 1: true, 2: false });
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const setFormErrors = useRef({});
  const clearFormErrors = useRef({});
  const [selectedRowData, setSelectedRowData] = useState({});
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchRefreshCounter, setSearchRefreshCounter] = useState(0);
  const [hasResults, setHasResults] = useState(() => sessionStorage.getItem("epostSearchHasResults") === "true");
  const roles = Digit.UserService.getUser()?.info?.roles;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const userName = useMemo(() => {
    const userInfo = Digit.UserService.getUser()?.info || {};
    return userInfo?.name || "";
  }, []);

  const [searchFormData, setSearchFormData] = useState(
    TabSearchConfig.map((_, index) => {
      if (_.label === "CS_REPORTS") {
        return {
          ...defaultSearchValues,
          monthReports: new Date().toISOString().slice(0, 7),
        };
      }
      return { ...defaultSearchValues };
    })
  );

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
    setInitialSearchPerformed((prev) => ({
      ...prev,
      [activeTabIndex]: activeTabIndex === 2 ? false : true,
    }));
    setSearchFormData((prev) => {
      const newData = [...prev];
      newData[activeTabIndex] =
        activeTabIndex === 2
          ? {
              ...defaultSearchValues,
              monthReports: new Date().toISOString().slice(0, 7),
            }
          : { ...defaultSearchValues };

      return newData;
    });
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

  const loggedInUser = useMemo(() => {
    if (!userName) return "";
    return epostUserData?.find((user) => user?.userName === userName);
  }, [epostUserData, userName]);

  const epostStatusDropDownData = useMemo(() => {
    return (epostStatusDropDown || [])?.slice()?.sort((a, b) => a?.code?.localeCompare(b?.code));
  }, [epostStatusDropDown]);

  const intermediateStatuses = useMemo(() => epostStatusDropDownData.filter((item) => item?.statustype === "INTERMEDIATE"), [
    epostStatusDropDownData,
  ]);

  const terminalStatuses = useMemo(() => epostStatusDropDownData.filter((item) => item?.statustype === "TERMINAL"), [epostStatusDropDownData]);

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

  const handleDownloadList = async (activeIndex, postalHub) => {
    if (activeIndex === 2) {
      try {
        setLoading(true);
        const epostStausList = intermediateStatuses?.flatMap((data) => data?.code) || [];
        const terminalStatusesList = terminalStatuses?.flatMap((data) => data?.code) || [];
        const month = searchFormData?.[activeIndex]?.monthReports || new Date().toISOString().slice(0, 7);
        const speedPostId = searchFormData?.[activeIndex]?.speedPostId;
        const { start: bookingDateStartTime, end: bookingDateEndTime } = getEpochRangeFromMonthIST(month);
        const payload = {
          ePostTrackerSearchCriteria: {
            excelSheetType: "REPORTS_TAB",
            bookingDateStartTime: bookingDateStartTime || "",
            bookingDateEndTime: bookingDateEndTime || "",
            speedPostId: speedPostId || "",
            deliveryStatusList: [...epostStausList, ...terminalStatusesList],
            postalHub: postalHub,
            pagination: {},
          },
        };
        const response = await axiosInstance.post(
          Urls.Epost.EpostReportDownload,
          {
            RequestInfo: {
              authToken: accessToken,
              userInfo: userInfo,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Dristi",
            },
            ePostTrackerSearchCriteria: payload?.ePostTrackerSearchCriteria,
          },
          {
            params: {
              tenantId: tenantId,
            },
            responseType: "blob",
          }
        );
        const [yearStr, monthNumStr] = month.split("-");
        const monthNum = parseInt(monthNumStr, 10);
        const dateForMonth = new Date(yearStr, monthNum - 1);
        const monthName = dateForMonth.toLocaleString("en-US", { month: "long" });
        const filename = `${yearStr}_${monthName}_Epost_Report.xlsx`;
        downloadFile(response?.data, filename);
        setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_SUCCESS"), error: false });
      } catch (error) {
        setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      // TODO: Need to Check
      try {
        setLoading(true);
        const speedPostId = searchFormData?.[activeIndex]?.speedPostId;
        const payload = {
          ePostTrackerSearchCriteria: {
            excelSheetType: "PENDING_BOOKING_TAB",
            speedPostId: speedPostId || "",
            deliveryStatusList: ["NOT_UPDATED"],
            postalHub: postalHub,
            pagination: {},
          },
        };
        const response = await axiosInstance.post(
          Urls.Epost.EpostReportDownload,
          {
            RequestInfo: {
              authToken: accessToken,
              userInfo: userInfo,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Dristi",
            },
            ePostTrackerSearchCriteria: payload?.ePostTrackerSearchCriteria,
          },
          {
            params: {
              tenantId: tenantId,
            },
            responseType: "blob",
          }
        );

        const filename = `Epost_List.xlsx`;
        downloadFile(response?.data, filename);
        setShowErrorToast({ label: t("ES_COMMON_DOCUMENT_DOWNLOADED_SUCCESS"), error: false });
      } catch (error) {
        setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSearchRequestBody = (activeTabIndex, searchFormData, baseConfig) => {
    const currentForm = searchFormData[activeTabIndex] || {};
    const epostStausList = intermediateStatuses?.flatMap((data) => data?.code) || [];
    const terminalStatusesList = terminalStatuses?.flatMap((data) => data?.code) || [];
    const currentStatus = currentForm?.deliveryStatusList?.code !== "ALL" ? [currentForm?.deliveryStatusList?.code] : epostStausList;
    const { start: bookingDateStartTime, end: bookingDateEndTime } = currentForm?.bookingDate
      ? getEpochRangeFromDateIST(currentForm?.bookingDate)
      : getEpochRangeFromMonthIST(currentForm?.monthReports);
    return {
      ...baseConfig.apiDetails.requestBody.ePostTrackerSearchCriteria,
      isDataRequired: true,
      speedPostId: currentForm?.speedPostId || "",
      deliveryStatusList:
        activeTabIndex === 1 ? currentStatus : activeTabIndex === 0 ? ["NOT_UPDATED"] : [...epostStausList, ...terminalStatusesList],
      bookingDateStartTime: bookingDateStartTime || "",
      bookingDateEndTime: bookingDateEndTime || "",
      pagination: {
        ...baseConfig.apiDetails.requestBody.ePostTrackerSearchCriteria.pagination,
        sortBy: currentForm?.pagination?.sortBy || activeTabIndex !== 0 ? "bookingDate" : "receivedDate",
        orderBy: currentForm?.pagination?.orderBy || "asc",
      },
    };
  };

  const config = useMemo(() => {
    const baseConfig = TabSearchConfig?.[activeTabIndex];
    if (!baseConfig) return null;

    const defaultValues = {
      ...baseConfig.sections.search.uiConfig.defaultValues,
      ...searchFormData[activeTabIndex],
    };

    // Shared SubmitBar customization
    const submitBarCustomization =
      activeTabIndex !== 1
        ? {
            additionalCustomization: {
              component: ({ t, formData, setValue }) => (
                <SubmitBar
                  label={t(activeTabIndex === 0 ? "DOWNLOAD_LIST" : "DOWNLOAD_REPORTS")}
                  submit="submit"
                  style={{ width: activeTabIndex === 0 ? "150px" : "175px" }}
                  onSubmit={() => handleDownloadList(activeTabIndex, loggedInUser?.postHubName)}
                  disabled={activeTabIndex === 2 && !initialSearchPerformed?.[2] ? true : !hasResults}
                />
              ),
              className: "custom-button-wrapper",
            },
          }
        : {};

    // Initial load for tab 2: no API call
    if (activeTabIndex === 2 && !initialSearchPerformed?.[2]) {
      return {
        ...baseConfig,
        apiDetails: {},
        sections: {
          ...baseConfig.sections,
          search: {
            ...baseConfig.sections.search,
            uiConfig: {
              ...baseConfig.sections.search.uiConfig,
              defaultValues,
            },
            ...submitBarCustomization,
          },
          searchResult: {
            ...baseConfig.sections.searchResult,
            uiConfig: {
              ...baseConfig.sections.searchResult.uiConfig,
            },
          },
        },
      };
    }

    // Default case with API call
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
            fields: baseConfig.sections.search.uiConfig.fields?.map((field) =>
              field.key === "deliveryStatusList"
                ? {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [{ id: 0, code: "ALL", name: "All" }, ...intermediateStatuses],
                    },
                  }
                : field
            ),
            defaultValues,
          },
          ...submitBarCustomization,
        },
        searchResult: {
          ...baseConfig.sections.searchResult,
          uiConfig: {
            ...baseConfig.sections.searchResult.uiConfig,
            columns: baseConfig.sections.searchResult.uiConfig.columns.map((column) =>
              ["CS_ACTIONS", "CS_ACTIONS_PENCIL"].includes(column.label) ? { ...column, clickFunc: handleActionItems } : column
            ),
          },
        },
      },
    };
  }, [activeTabIndex, initialSearchPerformed, searchFormData, intermediateStatuses, hasResults, loggedInUser?.postHubName]);

  const closeToast = () => setShowErrorToast(null);

  const onFormSubmit = (formData, isClear = false) => {
    setSearchFormData((prev) => {
      const newData = [...prev];
      newData[activeTabIndex] = isClear
        ? activeTabIndex === 2
          ? {
              ...defaultSearchValues,
              monthReports: new Date().toISOString().slice(0, 7),
            }
          : { ...defaultSearchValues }
        : { ...formData };
      return newData;
    });
    // Mark that we've performed a search on this tab
    setInitialSearchPerformed((prev) => ({
      ...prev,
      [activeTabIndex]: activeTabIndex === 2 ? (isClear ? false : true) : true,
    }));

    if (isClear) {
      setIsClearing(true);
      setTimeout(() => setIsClearing(false), 100);
    }

    window.sessionStorage.setItem("epostSearchHasResults", "true");
    window.dispatchEvent(new Event("epostSearchHasResultsChanged"));
    setSearchRefreshCounter((prev) => prev + 1);
  };

  const handleUpdateStatus = async (formData) => {
    try {
      const { start: selectedStartDate, end: selectedEndDate } = getEpochRangeFromDateIST(formData?.statusDate);
      if (selectedRowData?.receivedDate > selectedEndDate) {
        setFormErrors?.current("statusDate", {
          message: `${t("DATE_STATUS_ERROR")} (${DateUtils.getFormattedDate(selectedRowData?.receivedDate)})`,
        });
        return;
      }
      const deliveryStatus = activeTabIndex === 0 ? "BOOKED" : formData?.status?.code;
      const updateStatusPayload = {
        EPostTracker: {
          ...selectedRowData,
          ...(formData?.speedPostId && { speedPostId: formData?.speedPostId }),
          ...(!selectedRowData?.bookingDate && { bookingDate: selectedEndDate }),
          ...(deliveryStatus && { deliveryStatus: deliveryStatus }),
          remarks: formData?.remarks?.text || "",
          statusUpdateDate: selectedEndDate,
        },
      };
      await EpostService.EpostUpdate(updateStatusPayload, { tenantId });
      setShowUpdateStatusModal(false);
      setSelectedRowData({});
      setShowErrorToast({ label: t("STATUS_UPDATE_SUCCESSFULLY"), error: false });
      setSearchRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error("error while updating : ", error);
      const errorCode = error?.response?.data?.Errors?.[0]?.code;
      const errorMsg = errorCode === "DUPLICATE_SPEED_POST_ID_ERROR" ? t("DUPLICATE_SPEED_POST_ID_ERROR") : t("SOMETHING_WENT_WRONG");

      if (errorCode === "DUPLICATE_SPEED_POST_ID_ERROR") {
        setFormErrors?.current("speedPostId", {
          message: `${t("DUPLICATE_SPEED_POST_ID_ERROR")}`,
        });
        return;
      }
      setShowErrorToast({ label: errorMsg, error: true });
    }
  };

  const modifiedFormConfig = useMemo(() => {
    const baseConfig = activeTabIndex === 0 ? updateEpostStatusPendingConfig : updateEpostStatusConfig;

    return baseConfig.map((section) => ({
      ...section,
      body: section.body.map((field) => {
        let updatedField = { ...field };

        if (updatedField.key === "status") {
          updatedField = {
            ...updatedField,
            populators: {
              ...updatedField.populators,
              options: epostStatusDropDownData,
            },
          };
        }

        const customValidationFn = updatedField?.populators?.validation?.customValidationFn;
        if (customValidationFn) {
          const customValidations = Digit?.Customizations?.[customValidationFn?.moduleName]?.[customValidationFn?.masterName];

          if (typeof customValidations === "function") {
            updatedField = {
              ...updatedField,
              populators: {
                ...updatedField.populators,
                validation: {
                  ...updatedField.populators.validation,
                  ...customValidations(),
                },
              },
            };
          }
        }

        if (updatedField?.key === "statusDate") {
          const today = new Date();
          const receivedDateEpoch = selectedRowData?.receivedDate;
          const receivedDate = receivedDateEpoch ? new Date(receivedDateEpoch) : null;
          const effectiveMinDate = receivedDate && receivedDate <= today ? receivedDate : today;

          updatedField = {
            ...updatedField,
            populators: {
              ...updatedField.populators,
              validation: {
                ...updatedField.populators?.validation,
                min: effectiveMinDate.toISOString().split("T")[0],
                max: today.toISOString().split("T")[0],
              },
            },
          };
        }
        return updatedField;
      }),
    }));
  }, [activeTabIndex, epostStatusDropDownData, selectedRowData]);

  const getDefaultValue = useMemo(() => {
    if (showUpdateStatusModal) {
      return convertToFormData(t, selectedRowData, epostStatusDropDownData);
    }
  }, [epostStatusDropDownData, selectedRowData, showUpdateStatusModal, t]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => setShowErrorToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    const handleStorageChange = () => {
      setHasResults(sessionStorage.getItem("epostSearchHasResults") === "true");
    };

    window.addEventListener("epostSearchHasResultsChanged", handleStorageChange);

    return () => {
      window.removeEventListener("epostSearchHasResultsChanged", handleStorageChange);
    };
  }, []);

  const isApiSuppressed = !config?.apiDetails || Object.keys(config.apiDetails).length === 0;

  const showCustomEmptyTable = isApiSuppressed || (initialSearchPerformed?.[activeTabIndex] && hasResults === false && !isClearing);

  useEffect(() => {
    if (activeTabIndex === 0 || activeTabIndex === 1) {
      const storedValue = sessionStorage.getItem("epostSearchHasResults");
      if (storedValue !== "true") {
        window.sessionStorage.setItem("epostSearchHasResults", "true");
        window.dispatchEvent(new Event("epostSearchHasResultsChanged"));
      }
    }
  }, [activeTabIndex]);

  if (!isEpostUser) {
    history.replace(homePath);
    return;
  }

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
        <div style={{ fontWeight: 700, fontSize: "2rem" }}>{`${t("HUB_CO_ORDINATOR")}, ${loggedInUser?.district}`}</div>
        <div style={{ display: "flex", flexDirection: "column" }} key={`e-post-${hasResults}-${searchRefreshCounter}-${showCustomEmptyTable}`}>
          <Inboxheader config={config} tabData={tabData} onTabChange={onTabChange} onFormSubmit={onFormSubmit} />
          {showCustomEmptyTable ? (
            <EmptyTable config={config} t={t} message={"NO_DATA_TO_DISPLAY"} subText={"PLEASE_REFINE_SEARCH"} />
          ) : (
            <InboxSearchComposer
              key={`e-post-track-${activeTabIndex}-${searchRefreshCounter}`}
              configs={config}
              showTab={false}
              tabData={tabData}
              onTabChange={onTabChange}
            />
          )}
        </div>
      </div>
      {showUpdateStatusModal && (
        <EpostUpdateStatus
          t={t}
          headerLabel={"UPDATE_STATUS"}
          handleCancel={() => setShowUpdateStatusModal(false)}
          handleSubmit={handleUpdateStatus}
          defaultValue={getDefaultValue}
          modifiedFormConfig={modifiedFormConfig}
          saveLabel={"CONFIRM"}
          cancelLabel={"CS_COMMON_CANCEL"}
          closeToast={closeToast}
          showErrorToast={showErrorToast}
          setFormErrors={setFormErrors}
          clearFormErrors={clearFormErrors}
        />
      )}
      {showErrorToast && !showUpdateStatusModal && (
        <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn onClose={closeToast} />
      )}
    </React.Fragment>
  );
};

export default EpostTrackingPage;
