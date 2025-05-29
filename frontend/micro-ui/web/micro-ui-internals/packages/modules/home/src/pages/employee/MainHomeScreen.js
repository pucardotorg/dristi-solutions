import React, { useMemo, useState, useEffect } from "react";
import HomeHeader from "../../components/HomeHeader";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { labelToConfigMapping } from "../../configs/MainHomeScreenConfig";
import { homeHearingsConfig } from "../../configs/HearingsConfig";
import HomeHearingsTab from "./HomeHearingsTab";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const MainHomeScreen = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("HEARINGS_TAB");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [hearingCount, setHearingCount] = useState(0);
  const [config, setConfig] = useState({ ...homeHearingsConfig, additionalDetails: { setCount: setHearingCount } });
  const [registerCount, setRegisterCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);

  // Force a re-render of the InboxSearchComposer when config changes
  useEffect(() => {
    setUpdateCounter((prev) => prev + 1);
  }, [config]);

  // Create a new config object to ensure reference changes
  const modifiedConfig = useMemo(() => {
    return { ...config };
  }, [config]);

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
  const handleTabChange = (title, label, func) => {
    let updatedConfig = labelToConfigMapping?.find((config) => config?.label === title)?.config;
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
      updatedConfig = { ...updatedConfig, additionalDetails: { setCount: setHearingCount } };
    }
    setConfig(updatedConfig);
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
        />
        {activeTab === "HEARINGS_TAB" ? (
          <div style={{ width: "100%" }}>
            <HomeHearingsTab setHearingCount={setHearingCount} />
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
