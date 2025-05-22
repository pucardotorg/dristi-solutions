import React, { useState } from "react";
import HomeHeader from "../../components/HomeHeader";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { paymentTabInboxConfig } from "@egovernments/digit-ui-module-dristi/src/pages/employee/Payment/paymentInboxConfig";
import { mainHomeScreenConfig } from "../../configs/MainHomeScreenConfig";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const MainHomeScreen = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState(mainHomeScreenConfig?.TabSearchConfig?.[0]);

  const [tabData, setTabData] = useState(
    mainHomeScreenConfig?.TabSearchConfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: index === 0 ? true : false,
    }))
  );

  return (
    <React.Fragment>
      <HomeHeader t={t} />
      <div className="main-home-screen" style={{ display: "flex", borderTop: "1px #e8e8e8 solid", width: "100vw" }}>
        <HomeSidebar />
        <div className="inbox-search-wrapper" style={{ width: "100%", padding: "20px 30px" }}>
          <InboxSearchComposer customStyle={sectionsParentStyle} configs={config}></InboxSearchComposer>{" "}
        </div>
      </div>
    </React.Fragment>
  );
};

export default MainHomeScreen;
