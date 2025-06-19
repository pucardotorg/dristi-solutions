import React, { useMemo, useState, useEffect } from "react";
import HomeHeader from "../../components/HomeHeader";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import HomeHearingsTab from "./HomeHearingsTab";
import { pendingTaskConfig } from "../../configs/PendingTaskConfig";
import { HomeService } from "../../hooks/services";
import { Loader } from "@egovernments/digit-ui-react-components";
import { useHistory } from "react-router-dom";
import { Toast } from "@egovernments/digit-ui-react-components";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";

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

  const homeActiveTab = location?.state?.homeActiveTab || null;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTab, setActiveTab] = useState("HEARINGS_TAB");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [hearingCount, setHearingCount] = useState(0);
  const [config, setConfig] = useState(structuredClone(pendingTaskConfig));
  const [activeTabTitle, setActiveTabTitle] = useState("HEARINGS_TAB");
  const [pendingTaskCount, setPendingTaskCount] = useState({ REGISTRATION: 0, REVIEW_PROCESS: 0, VIEW_APPLICATION: 0, SCHEDULE_HEARING: 0 });
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const [loader, setLoader] = useState(false);
  const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false, currentHearing: {} });
  const [toastMsg, setToastMsg] = useState(null);

  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role?.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role?.code === "TYPIST_ROLE"), [roles]);
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
    if (!isJudge && !isBenchClerk && !isTypist) {
      history.push(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, [isJudge, isBenchClerk, userType, history, isTypist]);

  useEffect(() => {
    setUpdateCounter((prev) => prev + 1);
  }, [config]);

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

  const fetchHearingCount = async () => {
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
      setFilters({
        date: todayStr,
        status: "",
        purpose: "",
        caseQuery: "",
      });
    } catch (err) {
      showToast("error", t("ISSUE_IN_FETCHING"), 5000);
      console.log(err);
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
            assignedRole: [
              "DIARY_APPROVER",
              "HEARING_VIEWER",
              "WORKFLOW_ABANDON",
              "ORDER_ESIGN",
              "WORKFLOW_ADMIN",
              "APPLICATION_CREATOR",
              "DEPOSITION_PUBLISHER",
              "HEARING_APPROVER",
              "SUBMISSION_RESPONDER",
              "ORDER_VIEWER",
              "ORDER_REASSIGN",
              "CASE_EDITOR",
              "TASK_CREATOR",
              "APPLICATION_APPROVER",
              "DIARY_VIEWER",
              "EMPLOYEE",
              "ORDER_DELETE",
              "NOTIFICATION_APPROVER",
              "CASE_VIEWER",
              "TASK_EDITOR",
              "APPLICATION_REJECTOR",
              "HEARING_EDITOR",
              "DIARY_EDITOR",
              "ORDER_APPROVER",
              "NOTIFICATION_CREATOR",
              "HEARING_CREATOR",
              "EVIDENCE_CREATOR",
              "ORDER_CREATOR",
              "CALCULATION_VIEWER",
              "JUDGE_ROLE",
              "EVIDENCE_EDITOR",
              "CASE_APPROVER",
              "SUBMISSION_APPROVER",
              "TASK_VIEWER",
              "HEARING_SCHEDULER",
            ],
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
        },
      };
      let res = await HomeService.pendingTaskSearch(payload, { tenantId: tenantId });
      const reviwCount = res?.reviewProcessData?.count || 0;
      const applicationCount = res?.viewApplicationData?.count || 0;
      const scheduleCount = res?.scheduleHearingData?.count || 0;
      const registerCount = res?.registerCasesData?.count || 0;
      setPendingTaskCount({
        REGISTRATION: registerCount,
        REVIEW_PROCESS: reviwCount,
        VIEW_APPLICATION: applicationCount,
        SCHEDULE_HEARING: scheduleCount,
      });
    } catch (err) {
      showToast("error", t("ISSUE_IN_FETCHING"), 5000);
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPendingTaskCounts();
  }, []);

  const options = {
    REGISTRATION: {
      name: "Register Cases",
    },
    REVIEW_PROCESS: {
      name: "Review Process",
    },
    VIEW_APPLICATION: {
      name: "View Applications",
    },
    SCHEDULE_HEARING: {
      name: "Schedule Hearing",
    },
  };

  const handleTabChange = (title, label) => {
    if (title !== activeTabTitle) {
      if (activeTabTitle === "HEARINGS_TAB") {
        fetchHearingCount();
      } else {
        fetchPendingTaskCounts();
      }
    }
    let updatedConfig = { ...config };
    if (label) {
      setActiveTab(label);
      if (label === "REGISTRATION") {
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
        updatedConfig = {
          ...updatedConfig,
          additionalDetails: {
            setCount: setPendingTaskCount,
            activeTab: label,
          },
        };
      } else {
        updatedConfig.sections.search.uiConfig.fields = structuredClone(pendingTaskConfig?.sections?.search?.uiConfig?.fields);
        updatedConfig = {
          ...updatedConfig,
          additionalDetails: {
            setCount: setPendingTaskCount,
            activeTab: label,
          },
        };
      }
    } else {
      setActiveTab(title);
    }
    setConfig(updatedConfig);
    setActiveTabTitle(title);
  };

  const inboxSearchComposer = useMemo(
    () => (
      <InboxSearchComposer key={`${activeTab}-${updateCounter}`} customStyle={sectionsParentStyle} configs={modifiedConfig}></InboxSearchComposer>
    ),
    [activeTab, updateCounter, modifiedConfig]
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
      <HomeHeader t={t} />
      <div className="main-home-screen" style={{ display: "flex", width: "100vw", height: "calc(100vh - 173px)" }}>
        <HomeSidebar
          t={t}
          onTabChange={handleTabChange}
          activeTab={activeTab}
          options={options}
          isOptionsLoading={false}
          hearingCount={hearingCount}
          pendingTaskCount={pendingTaskCount}
          showToast={showToast}
        />
        {activeTab === "HEARINGS_TAB" ? (
          <div style={{ width: "100%" }}>
            <HomeHearingsTab
              t={t}
              setHearingCount={setHearingCount}
              setLoader={setLoader}
              setShowEndHearingModal={setShowEndHearingModal}
              showEndHearingModal={showEndHearingModal}
              setFilters={setFilters}
              filters={filters}
              showToast={showToast}
            />
          </div>
        ) : (
          <div className="inbox-search-wrapper" style={{ width: "100%", maxHeight: "calc(100vh - 173px)", overflowY: "auto" }}>
            {inboxSearchComposer}
          </div>
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
      </div>{" "}
    </React.Fragment>
  );
};

export default MainHomeScreen;
