import React from "react";
import ReactDOM from "react-dom";
import { initLibraries } from "@egovernments/digit-ui-libraries";
import { DigitUI, initCoreComponents } from "@egovernments/digit-ui-module-core";
import setupRequestInterceptor from "@egovernments/digit-ui-module-core/src/Utils/requestInterceptor";
import { initOrdersComponents } from "@egovernments/digit-ui-module-orders";
import { initSubmissionsComponents } from "@egovernments/digit-ui-module-submissions";
import { initHearingsComponents } from "@egovernments/digit-ui-module-hearings";
import { initCasesComponents } from "@egovernments/digit-ui-module-cases";
import { initDRISTIComponents } from "@egovernments/digit-ui-module-dristi";
import { initHomeComponents } from "@egovernments/digit-ui-module-home";

// import "@egovernments/dristi-ui-css";
import "dristi-ui-css";

import { UICustomizations } from "./UICustomizations";
import apiMonitor from "@egovernments/digit-ui-module-core/src/Utils/apiMonitor";
import ApiMonitorPanel from "@egovernments/digit-ui-module-core/src/Utils/ApiMonitorPanel.js";

var Digit = window.Digit || {};

const enabledModules = ["DRISTI", "Submissions", "Orders", "Hearings", "Cases", "Home"];

const initTokens = (stateCode) => {
  const userType = window.sessionStorage.getItem("userType") || process.env.REACT_APP_USER_TYPE || "CITIZEN";
  const token = window.localStorage.getItem("token") || process.env[`REACT_APP_${userType}_TOKEN`];

  const citizenInfo = window.localStorage.getItem("Citizen.user-info");

  const citizenTenantId = window.localStorage.getItem("Citizen.tenant-id") || stateCode;

  const employeeInfo = window.localStorage.getItem("Employee.user-info");
  const employeeTenantId = window.localStorage.getItem("Employee.tenant-id");

  const userTypeInfo = userType === "CITIZEN" || userType === "QACT" ? "citizen" : "employee";
  window.Digit.SessionStorage.set("user_type", userTypeInfo);
  window.Digit.SessionStorage.set("userType", userTypeInfo);

  if (userType !== "CITIZEN") {
    window.Digit.SessionStorage.set("User", {
      access_token: token,
      info: userType !== "CITIZEN" ? JSON.parse(employeeInfo) : citizenInfo,
    });
  } else {
    // if (!window.Digit.SessionStorage.get("User")?.extraRoleInfo) window.Digit.SessionStorage.set("User", { access_token: token, info: citizenInfo });
  }

  window.Digit.SessionStorage.set("Citizen.tenantId", citizenTenantId);

  if (employeeTenantId && employeeTenantId.length) window.Digit.SessionStorage.set("Employee.tenantId", employeeTenantId);
};

const initDigitUI = () => {
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const roles = userInfo?.roles;
  const assignedRoles = roles?.map((role) => role?.code);
  const hasViewApiMonitorAccess = assignedRoles?.includes("VIEW_API_MONITOR");
  window.contextPath = window?.globalConfigs?.getConfig("CONTEXT_PATH") || "ui";
  window.Digit.Customizations = {
    commonUiConfig: UICustomizations,
  };
  window?.Digit.ComponentRegistryService.setupRegistry({});
  setupRequestInterceptor();
  apiMonitor.init();
  initCoreComponents();
  initDRISTIComponents();
  initOrdersComponents();
  initHearingsComponents();
  initCasesComponents();
  initSubmissionsComponents();
  initHomeComponents();
  const moduleReducers = (initData) => ({});

  const stateCode = window?.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") || "pb";
  initTokens(stateCode);

  ReactDOM.render(
    <>
      <DigitUI stateCode={stateCode} enabledModules={enabledModules} defaultLanding="employee" moduleReducers={moduleReducers} />
      {hasViewApiMonitorAccess && <ApiMonitorPanel />}
    </>,
    document.getElementById("root")
  );
};

initLibraries().then(() => {
  initDigitUI();
});
