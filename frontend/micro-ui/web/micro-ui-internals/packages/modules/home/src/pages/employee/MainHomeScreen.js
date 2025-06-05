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

  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTab, setActiveTab] = useState("HEARINGS_TAB");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [hearingCount, setHearingCount] = useState(0);
  const [config, setConfig] = useState(structuredClone(pendingTaskConfig));
  const [registerCount, setRegisterCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);
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
  };

  const fetchPendingTaskCounts = async () => {
    const { fromDate, toDate } = getTodayRange();
    const payload = {
      SearchCriteria: {
        moduleName: "Pending Tasks Service",
        tenantId: tenantId,
        limit: 10,
        offset: 0,
        moduleSearchCriteria: {
          screenType: ["home", "applicationCompositeOrder"],
          isCompleted: false,
          courtId: localStorage.getItem("courtId"),
        },
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
  };

  useEffect(() => {
    fetchPendingTaskCounts();
  }, []);

  const options = {
    REGISTRATION: {
      name: "Register Cases",
      count: registerCount,
      func: setRegisterCount,
    },
    REVIEW_PROCESS: {
      name: "Review Process",
      count: reviewCount,
      func: setReviewCount,
    },
    VIEW_APPLICATION: {
      name: "View Applications",
      count: applicationCount,
      func: setApplicationCount,
    },
    SCHEDULE_HEARING: {
      name: "Schedule Hearing",
      count: scheduleCount,
      func: setScheduleCount,
    },
  };

  const handleTabChange = (title, label, func) => {
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

  if (loader) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {loader ? (
        <Loader />
      ) : (
        <React.Fragment>
          {" "}
          <HomeHeader t={t} />
          <div
            className="main-home-screen"
            style={{ display: "flex", borderTop: "1px #e8e8e8 solid", width: "100vw", height: "calc(100vh - 252px)" }}
          >
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
                />
              </div>
            ) : (
              <div className="inbox-search-wrapper" style={{ width: "100%", maxHeight: "calc(100vh - 252px)", overflowY: "auto" }}>
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
      )}
    </React.Fragment>
  );
};

export default MainHomeScreen;
