import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import HomeHearingsTab from "./HomeHearingsTab";
import { pendingTaskConfig } from "../../configs/PendingTaskConfig";
import { HomeService } from "../../hooks/services";
import { useHistory } from "react-router-dom";
import { Loader, Toast, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import BulkBailBondSignView from "./BulkBailBondSignView";
import BailBondModal from "./BailBondModal";
import BulkWitnessDepositionView from "./BulkWitnessDepositionView";
import BulkMarkAsEvidenceView from "./BulkMarkAsEvidenceView";
import NewBulkRescheduleTab from "./NewBulkRescheduleTab";
import BulkESignView from "./BulkESignView";
import BulkSignADiaryView from "./BulkSignADiaryView";
import RegisterUsersHomeTab from "./RegisterUsersHomeTab";
import OfflinePaymentsHomeTab from "./OfflinePaymentsHomeTab";
import { scrutinyPendingTaskConfig } from "../../configs/ScrutinyPendingTaskConfig";
import ReviewSummonsNoticeAndWarrant from "@egovernments/digit-ui-module-orders/src/pages/employee/ReviewSummonsNoticeAndWarrant";
import HomeScheduleHearing from "./HomeScheduleHearing";
const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const MainHomeScreen = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const homeFilteredData = location?.state?.homeFilteredData;
  const initialActiveTab = sessionStorage.getItem("homeActiveTab") || location?.state?.homeActiveTab || "TOTAL_HEARINGS_TAB";
  const [homeActiveTab] = useState(initialActiveTab);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTab, setActiveTab] = useState(homeActiveTab);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [hearingCount, setHearingCount] = useState(0);
  const [config, setConfig] = useState(structuredClone(pendingTaskConfig));
  const [scrutinyConfig, setScrutinyConfig] = useState(structuredClone(scrutinyPendingTaskConfig[0]));
  const [tabData, setTabData] = useState(null);

  const [activeTabTitle, setActiveTabTitle] = useState(homeActiveTab);
  const [pendingTaskCount, setPendingTaskCount] = useState({
    REGISTER_USERS: 0,
    OFFLINE_PAYMENTS: 0,
    SCRUTINISE_CASES: 0,
    REGISTRATION: 0,
    REVIEW_PROCESS: 0,
    // VIEW_APPLICATION: 0,
    // SCHEDULE_HEARING: 0,
    BAIL_BOND_STATUS: 0,
    RESCHEDULE_APPLICATIONS: 0,
    DELAY_CONDONATION: 0,
    OTHERS: 0,
  });
  const [stepper, setStepper] = useState(0);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const [loader, setLoader] = useState(false);
  const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false, currentHearing: {} });
  const [toastMsg, setToastMsg] = useState(null);
  const [showBailBondModal, setShowBailBondModal] = useState(false);
  const [selectedBailBond, setSelectedBailBond] = useState(null);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const assignedRoles = useMemo(() => roles?.map((role) => role?.code), [roles]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  const hasViewRegisterUserAccess = useMemo(() => assignedRoles?.includes("ADVOCATE_APPROVER"), [assignedRoles]);
  const hasViewCollectOfflinePaymentsAccess = useMemo(() => assignedRoles?.includes("PAYMENT_COLLECTOR"), [assignedRoles]);
  const hasViewScrutinyCasesAccess = useMemo(() => assignedRoles?.includes("VIEW_SCRUTINY_CASES"), [assignedRoles]);
  const hasViewRegisterCasesAccess = useMemo(() => assignedRoles?.includes("VIEW_REGISTER_CASES"), [assignedRoles]);
  const hasViewReissueProcessAccess = useMemo(() => assignedRoles?.includes("VIEW_REISSUE_PROCESS"), [assignedRoles]);
  const hasViewReviewBailBondAccess = useMemo(() => assignedRoles?.includes("VIEW_REVIEW_BAIL_BOND"), [assignedRoles]);
  const hasViewDelayCondonationAccess = useMemo(() => assignedRoles?.includes("VIEW_DELAY_CONDONATION_APPLICATION"), [assignedRoles]);
  const hasViewReschedulApplicationAccess = useMemo(() => assignedRoles?.includes("VIEW_RESCHEDULE_APPLICATION"), [assignedRoles]);
  const hasViewOthers = useMemo(() => assignedRoles?.includes("VIEW_OTHERS_APPLICATION"), [assignedRoles]);
  const hasCaseReviewerAccess = useMemo(() => assignedRoles?.includes("CASE_REVIEWER"), [assignedRoles]);

  const today = new Date();

  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  const [filters, setFilters] = useState(
    homeFilteredData || {
      date: todayStr,
      status: "",
      purpose: "",
      caseQuery: "",
    }
  );
  const userType = useMemo(() => {
    if (!userInfo) return "employee";
    return userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }, [userInfo]);

  useEffect(() => {
    if (isEpostUser || userType === "citizen") {
      history.push(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    } else if (location?.state?.registerUsersTab) {
      setActiveTab("REGISTER_USERS");
    } else if (location?.state?.offlinePaymentsTab) {
      setActiveTab("OFFLINE_PAYMENTS");
    } else if (location?.state?.homeActiveTab === "CS_HOME_ORDERS") {
      setActiveTab("CS_HOME_ORDERS");
    }
    // sessionStorage.removeItem("homeActiveTab");
  }, [userType, history, isEpostUser, location]);

  useEffect(() => {
    setUpdateCounter((prev) => prev + 1);
  }, [config]);

  // useEffect(() => {
  //   if (activeTab !== homeActiveTab) {
  //     history.replace(location.pathname, {
  //       ...location.state,
  //       homeActiveTab: activeTab,
  //     });
  //   }
  // }, [activeTab, history, location.pathname, location.state, homeActiveTab]);

  const modifiedConfig = useMemo(() => {
    return { ...config };
  }, [config]);

  const getTodayRange = () => {
    const currentDate = new Date();
    const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0).getTime();
    const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999).getTime();
    return { fromDate, toDate };
  };
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  const fetchHearingCount = async (filters, activeTab) => {
    if (filters && activeTab === "TOTAL_HEARINGS_TAB" && filters.date) {
      try {
        let fromDate, toDate;
        if (filters.date) {
          const dateObj = new Date(filters.date);
          fromDate = new Date(dateObj.setHours(0, 0, 0, 0)).getTime();
          toDate = new Date(dateObj.setHours(23, 59, 59, 999)).getTime();
        } else {
        }
        const payload = {
          inbox: {
            processSearchCriteria: {
              businessService: ["hearing-default"],
              moduleName: "Hearing Service",
              tenantId: Digit.ULBService.getCurrentTenantId(),
            },
            moduleSearchCriteria: {
              tenantId: tenantId,
              courtId: localStorage.getItem("courtId"),
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: tenantId,
            limit: 300,
            offset: 0,
          },
        };
        if (filters?.status?.code) payload.inbox.moduleSearchCriteria.status = filters?.status?.code;
        if (filters?.purpose) payload.inbox.moduleSearchCriteria.hearingType = filters.purpose?.code;
        if (filters?.caseQuery) payload.inbox.moduleSearchCriteria.searchableFields = filters.caseQuery;

        const res = await HomeService.InboxSearch(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
        setHearingCount(res?.totalCount || 0);
      } catch (err) {
        showToast("error", t("ISSUE_IN_FETCHING"), 5000);
        console.error(err);
      }
    } else {
      const { fromDate, toDate } = getTodayRange();
      try {
        const payload = {
          inbox: {
            processSearchCriteria: {
              businessService: ["hearing-default"],
              moduleName: "Hearing Service",
              tenantId: tenantId,
            },
            moduleSearchCriteria: {
              tenantId: tenantId,
              courtId: localStorage.getItem("courtId"),
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: tenantId,
            limit: 300,
            offset: 0,
          },
        };
        const res = await HomeService.InboxSearch(payload, { tenantId: tenantId });
        setHearingCount(res?.totalCount || 0);
        // if (!filters) {
        setFilters({
          date: todayStr,
          status: "",
          purpose: "",
          caseQuery: "",
        });
        // }
      } catch (err) {
        showToast("error", t("ISSUE_IN_FETCHING"), 5000);
        console.error(err);
      }
    }
  };

  const fetchPendingTaskCounts = async () => {
    const { fromDate, toDate } = getTodayRange();
    try {
      const payload = {
        SearchCriteria: {
          moduleName: "Pending Tasks Service",
          tenantId: tenantId,
          moduleSearchCriteria: {
            screenType: ["home", "applicationCompositeOrder"],
            isCompleted: false,
            courtId: localStorage.getItem("courtId"),
            assignedRole: assignedRoles,
          },
          limit: 10,
          offset: 0,
          searchReviewProcess: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "Review Process",
          },
          searchViewApplication: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "View Application",
          },
          searchScheduleHearing: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "Schedule Hearing",
          },
          searchRegisterCases: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Register cases",
          },
          searchBailBonds: {
            date: toDate,
            isOnlyCountRequired: true,
            actionCategory: "Bail Bond",
          },
          searchScrutinyCases: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Scrutinise cases",
            status: ["UNDER_SCRUTINY", "CASE_REASSIGNED"],
          },
          searchRescheduleHearingsApplication: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Reschedule Applications",
          },
          searchDelayCondonationApplication: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Delay Condonation",
          },
          searchOtherApplications: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Others",
          },
          searchRegisterUsers: {
            date: null,
            isOnlyCountRequired: true,
          },
          searchOfflinePayments: {
            date: null,
            isOnlyCountRequired: true,
          },
        },
      };
      let res = await HomeService.pendingTaskSearch(payload, { tenantId: tenantId });
      const reviwCount = res?.reviewProcessData?.totalCount || 0;
      const registerCount = res?.registerCasesData?.totalCount || 0;
      const bailBondStatusCount = res?.bailBondData?.totalCount || 0;
      const scrutinyCasesCount = res?.scrutinyCasesData?.totalCount || 0;
      const rescheduleHearingsApplicationCount = res?.rescheduleHearingsData?.totalCount || 0;
      const delayCondonationApplicationCount = res?.delayCondonationApplicationData?.totalCount || 0;
      const otherApplicationsCount = res?.otherApplicationsData?.totalCount || 0;
      const registerUsersCount = res?.registerUsersData?.count || 0;
      const offlinePaymentsCount = res?.offlinePaymentsData?.count || 0;

      setPendingTaskCount({
        REGISTER_USERS: registerUsersCount,
        OFFLINE_PAYMENTS: offlinePaymentsCount,
        SCRUTINISE_CASES: scrutinyCasesCount,
        REGISTRATION: registerCount,
        REVIEW_PROCESS: reviwCount,
        BAIL_BOND_STATUS: bailBondStatusCount,
        RESCHEDULE_APPLICATIONS: rescheduleHearingsApplicationCount,
        DELAY_CONDONATION: delayCondonationApplicationCount,
        OTHERS: otherApplicationsCount,
      });
    } catch (err) {
      showToast("error", t("ISSUE_IN_FETCHING"), 5000);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingTaskCounts();
    fetchHearingCount(filters, activeTab);
  }, []);

  const options = {};
  if (hasViewRegisterUserAccess) {
    options.REGISTER_USERS = { name: "HOME_REGISTER_USERS" };
  }
  if (hasViewCollectOfflinePaymentsAccess) {
    options.OFFLINE_PAYMENTS = { name: "HOME_OFFLINE_PAYMENTS" };
  }
  if (hasViewScrutinyCasesAccess) {
    options.SCRUTINISE_CASES = { name: "HOME_SCRUTINISE_CASES" };
  }
  if (hasViewRegisterCasesAccess) {
    options.REGISTRATION = { name: "HOME_REGISTER_CASES" };
  }
  if (hasViewReissueProcessAccess) {
    options.REVIEW_PROCESS = { name: "HOME_REISSUE_PROCESS" };
  }
  if (hasViewReviewBailBondAccess) {
    options.BAIL_BOND_STATUS = { name: "HOME_BAIL_BONDS_STATUS" };
  }

  // VIEW_APPLICATION: {
  //   name: "View Applications",
  // },
  // SCHEDULE_HEARING: {
  //   name: "Schedule Hearing",
  // },

  const applicationOptions = {};
  if (hasViewReschedulApplicationAccess) {
    applicationOptions.RESCHEDULE_APPLICATIONS = { name: "HOME_RESCHEDULE_APPLICATIONS" };
  }
  if (hasViewDelayCondonationAccess) {
    applicationOptions.DELAY_CONDONATION = { name: "HOME_DELAY_CONDONATION_APPLICATIONS" };
  }
  if (hasViewOthers) {
    applicationOptions.OTHERS = { name: "HOME_OTHER_APPLICATIONS" };
  }

  useEffect(() => {
    let updatedConfig = structuredClone(pendingTaskConfig);
    const openBailBondModal = (row) => {
      setShowBailBondModal(true);
      setSelectedBailBond(row);
    };

    if (activeTab === "REGISTRATION") {
      updatedConfig.sections.search.uiConfig.fields = [
        {
          label: "CS_CASE_NAME_ADVOCATE",
          type: "text",
          key: "caseSearchText",
          isMandatory: false,
          disable: false,
          populators: {
            name: "caseSearchText",
            error: "BR_PATTERN_ERR_MSG",
            validation: {
              pattern: {},
              minlength: 2,
            },
          },
        },
      ];
    }

    if (["RESCHEDULE_APPLICATIONS", "DELAY_CONDONATION", "OTHERS"].includes(activeTab)) {
      updatedConfig.sections.search.uiConfig.fields = [
        {
          label: "STAGE",
          isMandatory: false,
          key: "stage",
          type: "dropdown",
          populators: {
            name: "stage",
            optionsKey: "code",
            mdmsConfig: {
              masterName: "SubStage",
              moduleName: "case",
              select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
            },
          },
        },
        {
          label: "CS_CASE_NAME_ADVOCATE",
          type: "text",
          key: "caseSearchText",
          isMandatory: false,
          disable: false,
          populators: {
            name: "caseSearchText",
            error: "BR_PATTERN_ERR_MSG",
            validation: {
              pattern: {},
              minlength: 2,
            },
          },
        },
      ];
    }

    if (activeTab === "OTHERS") {
      updatedConfig.sections.search.uiConfig.fields.push({
        label: "APPLICATION_TYPE",
        isMandatory: false,
        key: "referenceEntityType",
        type: "dropdown",
        populators: {
          name: "referenceEntityType",
          optionsKey: "name",
          mdmsConfig: {
            masterName: "ApplicationType",
            moduleName: "Application",
            select:
              "(data) => {return data['Application'].ApplicationType?.filter((item)=>![`RE_SCHEDULE`,`DELAY_CONDONATION`].includes(item.type))?.map((item) => {return { ...item, name: 'APPLICATION_TYPE_'+item.type };});}",
          },
        },
      });
    }

    updatedConfig = {
      ...updatedConfig,
      sections: {
        ...updatedConfig.sections,
        searchResult: {
          ...updatedConfig.sections.searchResult,
          uiConfig: {
            ...updatedConfig.sections.searchResult.uiConfig,
            columns: updatedConfig?.sections?.searchResult?.uiConfig?.columns
              ?.map((column) => {
                return column?.label === "PENDING_CASE_NAME"
                  ? {
                      ...column,
                      clickFunc: openBailBondModal,
                    }
                  : column;
              })
              ?.filter((column) => (activeTab !== "OTHERS" ? column?.label !== "APPLICATION_TYPE" : true)),
          },
        },
      },
      additionalDetails: {
        setCount: setPendingTaskCount,
        activeTab: activeTab,
        setShowBailBondModal: setShowBailBondModal,
        setSelectedBailBond: setSelectedBailBond,
      },
    };
    setConfig(updatedConfig);
  }, [activeTab]);

  const getTotalCountForTab = useCallback(
    async function (tabConfig) {
      const updatedTabData = await Promise.all(
        tabConfig?.map(async (configItem, index) => {
          const response = await HomeService.customApiService(configItem?.apiDetails?.serviceName, {
            SearchCriteria: {
              moduleName: "Pending Tasks Service",
              tenantId: tenantId,
              moduleSearchCriteria: {
                screenType: ["home", "applicationCompositeOrder"],
                isCompleted: false,
                courtId: localStorage.getItem("courtId"),
                assignedRole: assignedRoles,
              },
              searchScrutinyCases: {
                date: null,
                isOnlyCountRequired: true,
                actionCategory: "Scrutinise cases",
                status: configItem?.apiDetails?.requestBody?.SearchCriteria?.searchScrutinyCases?.status,
              },
              limit: 10,
              offset: 0,
            },
          });
          const totalCount = response?.scrutinyCasesData?.count;
          return {
            key: index,
            label: totalCount ? `${t(configItem.label)} (${totalCount})` : `${t(configItem.label)} (0)`,
            active: index === 0 ? true : false,
          };
        }) || []
      );
      setTabData(updatedTabData);
    },
    [tenantId, assignedRoles, t]
  );

  useEffect(() => {
    getTotalCountForTab(scrutinyPendingTaskConfig);
  }, [scrutinyPendingTaskConfig]);

  const handleTabChange = (title, label) => {
    if (title !== activeTabTitle) {
      if (activeTabTitle === "TOTAL_HEARINGS_TAB") {
        fetchHearingCount();
      } else {
        fetchPendingTaskCounts();
      }
    }
    setActiveTab(label || title);
    setActiveTabTitle(title);
    sessionStorage.removeItem("diaryDateFilter");
    sessionStorage.removeItem("adiaryStepper");
    sessionStorage.removeItem("adiarypdf");
  };

  const onInternalTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setScrutinyConfig(scrutinyPendingTaskConfig?.[n]);
  };

  const inboxSearchComposer = useMemo(
    () => (
      <InboxSearchComposer key={`${activeTab}-${updateCounter}`} customStyle={sectionsParentStyle} configs={modifiedConfig}></InboxSearchComposer>
    ),
    [activeTab, updateCounter, modifiedConfig]
  );

  const scrutinyInboxSearchComposer = useMemo(
    () =>
      tabData ? (
        <InboxSearchComposer
          key={`${activeTab}-${scrutinyConfig?.label}`}
          customStyle={sectionsParentStyle}
          configs={{
            ...scrutinyConfig,
            additionalDetails: {
              setCount: setPendingTaskCount,
              activeTab: activeTab,
              hasCaseReviewerAccess: hasCaseReviewerAccess,
            },
          }}
          showTab={true}
          tabData={tabData}
          onTabChange={onInternalTabChange}
        ></InboxSearchComposer>
      ) : (
        <Loader />
      ),
    [tabData, activeTab, scrutinyConfig, hasCaseReviewerAccess]
  );

  return (
    <React.Fragment>
      {" "}
      {loader && (
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
      <div className="main-home-screen">
        <HomeSidebar
          t={t}
          onTabChange={handleTabChange}
          activeTab={activeTab}
          options={options}
          isOptionsLoading={false}
          applicationOptions={applicationOptions}
          hearingCount={hearingCount}
          pendingTaskCount={pendingTaskCount}
          showToast={showToast}
        />
        {activeTab === "TOTAL_HEARINGS_TAB" ? (
          <div className="home-bulk-reschedule">
            <HomeHearingsTab
              t={t}
              setHearingCount={setHearingCount}
              setLoader={setLoader}
              setShowEndHearingModal={setShowEndHearingModal}
              showEndHearingModal={showEndHearingModal}
              setFilters={setFilters}
              filters={filters}
              showToast={showToast}
              hearingCount={hearingCount}
            />
          </div>
        ) : activeTab === "CS_HOME_SCHEDULE_HEARING" ? (
          <div className="home-bulk-sign">
            <HomeScheduleHearing />
          </div>
        ) : activeTab === "CS_HOME_BULK_RESCHEDULE" ? (
          <div className="home-bulk-reschedule">
            <NewBulkRescheduleTab stepper={stepper} setStepper={setStepper} selectedSlot={[]} />
          </div>
        ) : activeTab === "BULK_BAIL_BOND_SIGN" ? (
          <div className="home-bulk-sign">
            <BulkBailBondSignView showToast={showToast} />
          </div>
        ) : activeTab === "REGISTER_USERS" ? (
          <div className="home-bulk-sign">
            <RegisterUsersHomeTab />
          </div>
        ) : activeTab === "OFFLINE_PAYMENTS" ? (
          <div className="home-bulk-sign">
            <OfflinePaymentsHomeTab />
          </div>
        ) : activeTab === "CS_HOME_PROCESS" ? (
          <div className="home-bulk-sign">
            <ReviewSummonsNoticeAndWarrant />
          </div>
        ) : activeTab === "CS_HOME_A_DAIRY" ? (
          <div className="home-bulk-sign">
            <BulkSignADiaryView showToast={showToast} />
          </div>
        ) : activeTab === "BULK_EVIDENCE_SIGN" ? (
          <div className="home-bulk-sign">
            <BulkMarkAsEvidenceView showToast={showToast} />
          </div>
        ) : activeTab === "BULK_WITNESS_DEPOSITION_SIGN" ? (
          <div className="home-bulk-sign">
            <BulkWitnessDepositionView showToast={showToast} />
          </div>
        ) : activeTab === "CS_HOME_ORDERS" ? (
          <div className="home-bulk-sign">
            <BulkESignView />
          </div>
        ) : (
          // <div
          //   className="inbox-search-wrapper"
          //   style={{
          //     width: "100%",
          //     maxHeight: "calc(100vh - 90px)",
          //     overflowY: "auto",
          //     scrollbarWidth: "thin",
          //     scrollbarColor: "#c5c5c5 #f9fafb",
          //     padding: "26px",
          //   }}
          // >
          <div className={`bulk-esign-order-view`}>
            <div className="header">{t(options[activeTab]?.name || applicationOptions[activeTab]?.name)}</div>
            <div className="inbox-search-wrapper">{activeTab === "SCRUTINISE_CASES" ? scrutinyInboxSearchComposer : inboxSearchComposer}</div>
          </div>
          // </div>
        )}
        {showBailBondModal && (
          <BailBondModal
            t={t}
            showToast={showToast}
            setShowBailModal={setShowBailBondModal}
            row={selectedBailBond}
            setUpdateCounter={setUpdateCounter}
          />
        )}
        {toastMsg && (
          <Toast
            error={toastMsg.key === "error"}
            label={t(toastMsg.action)}
            onClose={() => setToastMsg(null)}
            isDleteBtn={true}
            style={{ maxWidth: "500px" }}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default MainHomeScreen;
