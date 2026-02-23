import React from "react";
import { initLibraries } from "@egovernments/digit-ui-libraries";
import {
  DigitUI,
  initCoreComponents,
} from "@egovernments/digit-ui-module-core";
import { UICustomizations } from "./Customisations/UICustomizations";
import { initDRISTIComponents } from "@egovernments/digit-ui-module-dristi";
import { initOrdersComponents } from "@egovernments/digit-ui-module-orders";
import { initSubmissionsComponents } from "@egovernments/digit-ui-module-submissions";
import { initHearingsComponents } from "@egovernments/digit-ui-module-hearings";
import { initCasesComponents } from "@egovernments/digit-ui-module-cases";
import { initHomeComponents } from "@egovernments/digit-ui-module-home";
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

const initDigitUI = () => {
  window.Digit.ComponentRegistryService.setupRegistry({});
  setupRequestInterceptor();
  initCoreComponents();
  initDRISTIComponents();
  initOrdersComponents();
  initHearingsComponents();
  initCasesComponents();
  initSubmissionsComponents();
  initHomeComponents();

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
