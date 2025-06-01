import React, { useMemo, useState, useEffect } from "react";
import HomeHeader from "../../components/HomeHeader";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import HomeHearingsTab from "./HomeHearingsTab";
import { pendingTaskConfig } from "../../configs/PendingTaskConfig";
import { HomeService } from "../../hooks/services";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const MainHomeScreen = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [activeTab, setActiveTab] = useState("HEARINGS_TAB");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [hearingCount, setHearingCount] = useState(0);
  const [config, setConfig] = useState(pendingTaskConfig);
  const [registerCount, setRegisterCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [activeTabTitle, setActiveTabTitle] = useState("HEARINGS_TAB");
  const [pendingTaskCount, setPendingTaskCount] = useState({ REGISTRATION: 10, REVIEW_PROCESS: 0, VIEW_APPLICATION: 0, SCHEDULE_HEARING: 0 });

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

  // API call for hearing tab count
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

  // API call for pending tasks count
  const fetchPendingTaskCounts = async () => {
    const { fromDate } = getTodayRange();
    const payload = {
      SearchCriteria: {
        moduleName: "Pending Tasks Service",
        tenantId: tenantId,
        limit: 10,
        offset: 0,
        moduleSearchCriteria: {
          screenType: ["home", "applicationCompositeOrder"],
          isCompleted: false,
        },
        searchReviewProcess: {
          date: fromDate,
          isOnlyCountRequired: false,
          actionCategory: "Review Process",
        },
        searchViewApplication: {
          date: fromDate,
          isOnlyCountRequired: false,
          actionCategory: "View Application",
        },
        searchScheduleHearing: {
          date: fromDate,
          isOnlyCountRequired: true,
          actionCategory: "Schedule Hearing",
        },
        searchRegisterCases: {
          date: fromDate,
          isOnlyCountRequired: false,
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
      name: "Registrater Cases",
      count: registerCount,
      func: setRegisterCount,
    },
    REVIEW_PROCESS: {
      name: "Review Process",
      count: reviewCount,
      func: setReviewCount,
    },
    VIEW_APPLICATION: {
      name: "View Application",
      count: applicationCount,
      func: setApplicationCount,
    },
    SCHEDULE_HEARING: {
      name: "Schedule Hearing",
      count: scheduleCount,
      func: setScheduleCount,
    },
  };

  // When tab changes, update previous tab's count
  const handleTabChange = (title, label, func) => {
    if (title !== activeTabTitle) {
      if (activeTabTitle === "HEARINGS_TAB") {
        fetchHearingCount();
      } else {
        fetchPendingTaskCounts();
      }
    }
    let updatedConfig = config;
    if (label) {
      setActiveTab(label);
      updatedConfig = {
        ...updatedConfig,
        additionalDetails: {
          setCount: setPendingTaskCount,
          activeTab: label,
        },
      };
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
      <HomeHeader t={t} />
      <div className="main-home-screen" style={{ display: "flex", borderTop: "1px #e8e8e8 solid", width: "100vw", height: "calc(100vh - 252px)" }}>
        <HomeSidebar
          t={t}
          onTabChange={handleTabChange}
          activeTab={activeTab}
          options={options}
          isOptionsLoading={false}
          hearingCount={hearingCount}
          pendingTaskCount={pendingTaskCount}
        />
        {activeTab === "HEARINGS_TAB" ? (
          <div style={{ width: "100%" }}>
            <HomeHearingsTab t={t} setHearingCount={setHearingCount} />
          </div>
        ) : (
          <div className="inbox-search-wrapper" style={{ width: "100%" }}>
            {inboxSearchComposer}
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default MainHomeScreen;
