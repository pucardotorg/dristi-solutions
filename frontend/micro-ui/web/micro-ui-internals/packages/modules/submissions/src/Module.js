import { Loader } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useRouteMatch } from "react-router-dom";
import { default as EmployeeApp } from "./pages/employee";
import SubmissionsCard from "./components/SubmissionsCard";
import BailBondSignaturePage from "./pages/employee/BailBondSignaturePage";
import BailBondLoginPage from "./pages/employee/BailBondLoginPage";
import BailBondLinkExpiredPage from "./pages/employee/BailBondExpirePage";
import { overrideHooks, updateCustomConfigs } from "./utils";
import WitnessDepositionLoginPage from "./pages/employee/WitnessDepositionLoginPage";
import WitnessDepositionSignaturePage from "./pages/employee/WitnessDepositionSignaturePage";
import DigitizedDocumentLoginPage from "./pages/employee/DigitizedDocumentLoginPage";
import DigitizedDocumentsSignaturePage from "./pages/employee/DigitizedDocumentsSignaturePage";
import { submissionService } from "./hooks/services";

export const SubmissionsModule = ({ stateCode, userType, tenants }) => {
  const { path, url } = useRouteMatch();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const moduleCode = ["submissions", "common", "workflow"];
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({
    stateCode,
    moduleCode,
    language,
  });

  if (isLoading) {
    return <Loader />;
  }
  return <EmployeeApp path={path} stateCode={stateCode} userType={userType} tenants={tenants} />;
};

const componentsToRegister = {
  SubmissionsModule,
  SubmissionsCard,
  BailBondSignaturePage,
  BailBondLoginPage,
  BailBondLinkExpiredPage,
  WitnessDepositionLoginPage,
  WitnessDepositionSignaturePage,
  DigitizedDocumentLoginPage,
  DigitizedDocumentsSignaturePage,
  submissionService,
};

export const initSubmissionsComponents = () => {
  overrideHooks();
  updateCustomConfigs();
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
