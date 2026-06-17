import { Loader } from "@egovernments/digit-ui-react-components";
import React from "react";
import PropTypes from "prop-types";
import { useRouteMatch } from "react-router-dom";
import { default as EmployeeApp } from "./pages/employee";
import CasesCard from "./components/CasesCard";
import { overrideHooks, updateCustomConfigs } from "./utils";
import JoinCaseHome from "./pages/employee/JoinCaseHome";
import JoinCasePayment from "./pages/employee/joinCaseComponent/JoinCasePayment";

export const CasesModule = ({ stateCode, userType, tenants }) => {
  const { path } = useRouteMatch();
  const moduleCode = ["case", "common", "workflow"];
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading } = Digit.Services.useStore({
    stateCode,
    moduleCode,
    language,
  });

  if (isLoading) {
    return <Loader />;
  }
  return <EmployeeApp path={path} stateCode={stateCode} userType={userType} tenants={tenants} />;
};

CasesModule.propTypes = {
  stateCode: PropTypes.string,
  tenants: PropTypes.arrayOf(PropTypes.object),
  userType: PropTypes.string,
};

const componentsToRegister = {
  CasesModule,
  CasesCard,
  JoinCaseHome,
  JoinCasePayment,
};

export const initCasesComponents = () => {
  overrideHooks();
  updateCustomConfigs();
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
