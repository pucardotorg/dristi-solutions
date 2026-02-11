import { Loader } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useRouteMatch } from "react-router-dom";
import { default as EmployeeApp } from "./pages/employee";
import { overrideHooks, updateCustomConfigs } from "./utils";
import HomeCard from "./components/HomeCard";
import CustomDateRangePicker from "./components/CustomDateRangePicker";

export const HomeModule = ({ stateCode, userType, tenants }) => {
  const { path, url } = useRouteMatch();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const moduleCode = ["home", "common", "workflow", "orders"];
  const language = Digit.StoreData.getCurrentLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const result = urlParams.get("result");
  const fileStoreId = urlParams.get("filestoreId");
  const { isLoading, data: store } = Digit.Services.useStore({
    stateCode,
    moduleCode,
    language,
    modulePrefix: "dristi",
  });

  if (isLoading) {
    return <Loader />;
  }
  return <EmployeeApp path={path} stateCode={stateCode} userType={userType} tenants={tenants} result={result} fileStoreId={fileStoreId} />;
};

const componentsToRegister = {
  HomeModule,
  HomeCard,
  CustomDateRangePicker,
};

export const initHomeComponents = () => {
  overrideHooks();
  updateCustomConfigs();
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
