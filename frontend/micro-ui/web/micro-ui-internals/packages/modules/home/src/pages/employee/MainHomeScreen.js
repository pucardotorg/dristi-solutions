import React, { useMemo, useState, useEffect } from "react";
import HomeHeader from "../../components/HomeHeader";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { labelToConfigMapping } from "../../configs/MainHomeScreenConfig";
import { homeHearingsConfig } from "../../configs/HearingsConfig";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const MainHomeScreen = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState(homeHearingsConfig);
  const [activeTab, setActiveTab] = useState("HEARINGS_TAB");
  const [updateCounter, setUpdateCounter] = useState(0);

  // Force a re-render of the InboxSearchComposer when config changes
  useEffect(() => {
    setUpdateCounter((prev) => prev + 1);
  }, [config]);

  // Create a new config object to ensure reference changes
  const modifiedConfig = useMemo(() => {
    return { ...config };
  }, [config]);

  const handleTabChange = (title, label) => {
    let updatedConfig = labelToConfigMapping?.find((config) => config?.label === title)?.config;
    if (label) {
      setActiveTab(label);
      updatedConfig = {
        ...updatedConfig,
        apiDetails: {
          ...updatedConfig.apiDetails,
          requestBody: {
            ...updatedConfig.apiDetails.requestBody,
            criteria: {
              ...updatedConfig.apiDetails.requestBody.criteria,
              hearingType: "APPLICATION_REVIEW",
            },
          },
        },
      };
    } else {
      setActiveTab(title);
    }
    setConfig(updatedConfig);
  };

  return (
    <React.Fragment>
      <HomeHeader t={t} />
      <div className="main-home-screen" style={{ display: "flex", borderTop: "1px #e8e8e8 solid", width: "100vw" }}>
        <HomeSidebar t={t} onTabChange={handleTabChange} activeTab={activeTab} />
        <div className="inbox-search-wrapper" style={{ width: "100%", padding: "20px 30px" }}>
          <InboxSearchComposer key={`${activeTab}-${updateCounter}`} customStyle={sectionsParentStyle} configs={modifiedConfig}></InboxSearchComposer>{" "}
        </div>
      </div>
    </React.Fragment>
  );
};

export default MainHomeScreen;
