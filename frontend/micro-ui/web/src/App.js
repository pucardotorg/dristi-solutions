import React from "react";
import { initLibraries } from "@egovernments/digit-ui-libraries";
import {
  DigitUI,
  initCoreComponents,
} from "@egovernments/digit-ui-module-core";
import { UICustomizations } from "./Customisations/UICustomizations";
import setupRequestInterceptor from "@egovernments/digit-ui-module-core/src/Utils/requestInterceptor";
import apiMonitor from "@egovernments/digit-ui-module-core/src/Utils/apiMonitor";
import "dristi-ui-css/dist/index.min.css";
import ApiMonitorPanel from "@egovernments/digit-ui-module-core/src/Utils/ApiMonitorPanel.js";

window.contextPath = window?.globalConfigs?.getConfig("CONTEXT_PATH") || "ui";

const enabledModules = [
  "DRISTI",
  "Submissions",
  "Orders",
  "Hearings",
  "Cases",
  "Home",
];

const moduleReducers = (initData) => ({
  initData,
});

const initDigitUI = async () => {
  window.Digit.ComponentRegistryService.setupRegistry({});
  setupRequestInterceptor();
  initCoreComponents();

  // Dynamically import all domain modules in parallel
  // webpack will create separate chunks for each module
  const [dristi, orders, hearings, cases, submissions, home] = await Promise.all([
    import("@egovernments/digit-ui-module-dristi"),
    import("@egovernments/digit-ui-module-orders"),
    import("@egovernments/digit-ui-module-hearings"),
    import("@egovernments/digit-ui-module-cases"),
    import("@egovernments/digit-ui-module-submissions"),
    import("@egovernments/digit-ui-module-home"),
  ]);

  dristi.initDRISTIComponents();
  orders.initOrdersComponents();
  hearings.initHearingsComponents();
  cases.initCasesComponents();
  submissions.initSubmissionsComponents();
  home.initHomeComponents();

  // Initialize API monitoring after all components are initialized
  apiMonitor.init();
};

initLibraries().then(() => {
  initDigitUI();
});

function App() {
  const stateCode =
    window?.globalConfigs.getConfig("STATE_LEVEL_TENANT_ID") || "kl";
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const roles = userInfo?.roles;
  const assignedRoles = roles?.map((role) => role?.code);
  const hasViewApiMonitorAccess = assignedRoles?.includes("VIEW_API_MONITOR");
  if (!stateCode) {
    return <h1>stateCode is not defined</h1>;
  }
  return (
    <>
      <DigitUI
        stateCode={stateCode}
        enabledModules={enabledModules}
        moduleReducers={moduleReducers}
        // defaultLanding="employee"
      />
      {hasViewApiMonitorAccess && <ApiMonitorPanel />}
    </>
  );
}

export default App;
