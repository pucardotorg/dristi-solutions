import React, { useState, useEffect, useMemo, useCallback } from "react";
import { InboxSearchComposer, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { TabSearchConfig } from "./../../configs/E-PostTrackingConfig";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";
import Inboxheader from "../../components/InboxComposerHeader.js/Inboxheader";
import SubmitBar from "../../components/SubmitBar";
import EpostUpdateStatus from "./EpostUpdateStatus";
import { updateEpostStatusPendingConfig, updateEpostStatusConfig } from "../../configs/EpostFormConfigs";
import { EpostService } from "../../hooks/services";
import { downloadFile, getEpochRangeFromDateIST, getEpochRangeFromMonthIST } from "../../utils";
import Axios from "axios";
import { Urls } from "../../hooks/services/Urls";
import { _getDate, _toEpoch, _getStatus } from "../../utils";

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
    bookingDate: _getDate(),
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
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const accessToken = window.localStorage.getItem("token");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
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
    return (epostStatusDropDown || [])?.slice()?.reverse();
  }, [epostStatusDropDown]);

  const intermediateStatuses = useMemo(() => epostStatusDropDownData.filter((item) => item?.statustype === "INTERMEDIATE"), [
    epostStatusDropDownData,
  ]);

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
        const month = searchFormData?.[activeTabIndex]?.monthReports || new Date().toISOString().slice(0, 7);
        const speedPostId = searchFormData?.[activeTabIndex]?.speedPostId;
        const { start: bookingDateStartTime, end: bookingDateEndTime } = getEpochRangeFromMonthIST(month);
        const payload = {
          ePostTrackerSearchCriteria: {
            bookingDateStartTime: bookingDateStartTime || "",
            bookingDateEndTime: bookingDateEndTime || "",
            speedPostId: speedPostId || "",
            postalHub: postalHub,
            pagination: {},
          },
        };
        const response = await Axios.post(
          Urls.Epost.EpostReportDownload,
          {
            RequestInfo: {
              authToken: accessToken,
              userInfo: userInfo,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Rainmaker",
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
      }
      finally{
        setLoading(false);
      }
    } else {
      // TODO: Need to Check
      try {
        setLoading(true);
        const speedPostId = searchFormData?.[activeTabIndex]?.speedPostId;
        const payload = {
          ePostTrackerSearchCriteria: {
            speedPostId: speedPostId || "",
            deliveryStatusList: ["NOT_UPDATED"],
            postalHub: postalHub,
            pagination: {},
          },
        };
        const response = await Axios.post(
          Urls.Epost.EpostReportDownload,
          {
            RequestInfo: {
              authToken: accessToken,
              userInfo: userInfo,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Rainmaker",
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
      }
      finally {
        setLoading(false);
      }
    }
  };

  const getSearchRequestBody = (activeTabIndex, searchFormData, baseConfig) => {
    const currentForm = searchFormData[activeTabIndex] || {};
    const epostStausList = intermediateStatuses?.flatMap((data) => data?.code) || [];
    const currentStatus = currentForm?.deliveryStatusList?.code !== "ALL" ? [currentForm?.deliveryStatusList?.code] : epostStausList;
    const { start: bookingDateStartTime, end: bookingDateEndTime } = currentForm?.bookingDate
      ? getEpochRangeFromDateIST(currentForm?.bookingDate)
      : getEpochRangeFromMonthIST(currentForm?.monthReports);
    return {
      ...baseConfig.apiDetails.requestBody.ePostTrackerSearchCriteria,
      isDataRequired: true,
      speedPostId: currentForm?.speedPostId || "",
      deliveryStatusList: activeTabIndex === 1 ? currentStatus : activeTabIndex === 0 ? ["NOT_UPDATED"] : [],
      bookingDateStartTime: bookingDateStartTime || "",
      bookingDateEndTime: bookingDateEndTime || "",
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
                    options: [{ id: 0, code: "ALL", name: "All" }, ...intermediateStatuses],
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
              component: ({ t, formData, setValue }) => {
                return (
                  <SubmitBar
                    label={t(activeTabIndex === 0 ? "DOWNLOAD_LIST" : "DOWNLOAD_REPORTS")}
                    submit="submit"
                    style={{ width: activeTabIndex === 0 ? "150px" : "175px" }}
                    onSubmit={() => handleDownloadList(activeTabIndex, loggedInUser?.postHubName)}
                    disabled={!hasResults}
                  />
                );
              },
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
  }, [activeTabIndex, searchFormData, hasResults, loggedInUser]);

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
    setSearchRefreshCounter((prev) => prev + 1);
  };

  const handleUpdateStatus = async (formData) => {
    try {
      const deliveryStatus = activeTabIndex === 0 ? "BOOKED" : formData?.status?.code;
      const updateStatusPayload = {
        EPostTracker: {
          ...selectedRowData,
          remarks: formData?.remarks?.text || "",
          ...(activeTabIndex === 0 &&
            formData?.bookingDate &&
            formData?.bookingDate !== selectedRowData?.bookingDate && {
              bookingDate: _toEpoch(formData?.bookingDate),
            }),
          ...(formData?.speedPostId && { speedPostId: formData?.speedPostId }),
          ...(deliveryStatus && { deliveryStatus: deliveryStatus }),
        },
      };
      await EpostService.EpostUpdate(updateStatusPayload, { tenantId });
      setShowUpdateStatusModal(false);
      setSelectedRowData({});
      setShowErrorToast({ label: t("Status Update Successfully"), error: false });
      setSearchRefreshCounter((prev) => prev + 1);
    } catch (error) {
      console.error("error while updating : ", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    }
  };

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

  if (!isEpostUser) {
    history.replace(homePath);
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
          headerLabel={"UPDATE_STATUS"}
          handleCancel={() => setShowUpdateStatusModal(false)}
          handleSubmit={handleUpdateStatus}
          defaultValue={getDefaultValue}
          modifiedFormConfig={modifiedFormConfig}
          saveLabel={"CONFIRM"}
          cancelLabel={"CS_COMMON_CANCEL"}
        />
      )}
    </React.Fragment>
  );
};

export default EpostTrackingPage;
