import PropTypes from "prop-types";
import React from "react";
import { Redirect, Route, Switch, useLocation, useRouteMatch } from "react-router-dom";

import ChangePassword from "../pages/employee/ChangePassword/index";
import ForgotPassword from "../pages/employee/ForgotPassword/index";
import { AppHome } from "./Home";

const getTenants = (codes, tenants) => {
  return tenants.filter((tenant) => codes?.map?.((item) => item.code).includes(tenant.code));
};

export const AppModules = ({ stateCode, userType, modules, appTenants, additionalComponent }) => {
  const location = useLocation();

  const user = Digit.UserService.getUser();

  if (!user || !user?.access_token || !user?.info) {
    return <Redirect to={{ pathname: `/${window?.contextPath}/employee/user/login`, state: { from: location.pathname + location.search } }} />;
  }

  const appRoutes = modules.map(({ code, tenants }) => {
    const Module = Digit.ComponentRegistryService.getComponent(`${code}Module`);
    return Module ? (
      <Route key={code} path={`${path}/${code.toLowerCase()}`}>
        <Module stateCode={stateCode} moduleCode={code} userType={userType} tenants={getTenants(tenants, appTenants)} />
      </Route>
    ) : (
      <Route key={code} path={`${path}/${code.toLowerCase()}`}>
        <Redirect to={`/${window?.contextPath}/employee/user/error?type=notfound&module=${code}`} />
      </Route>
    );
  });

  return (
    <div className="ground-container">
      <Switch>
        {appRoutes}
        <Route path={`${path}/login`}>
          <Redirect to={{ pathname: `/${window?.contextPath}/employee/user/login`, state: { from: location.pathname + location.search } }} />
        </Route>
        <Route path={`${path}/forgot-password`}>
          <ForgotPassword />
        </Route>
        <Route path={`${path}/change-password`}>
          <ChangePassword />
        </Route>
        <Route>
          <AppHome userType={userType} modules={modules} additionalComponent={additionalComponent} />
        </Route>
      </Switch>
    </div>
  );
};

AppModules.propTypes = {
  stateCode: PropTypes.string,
  userType: PropTypes.string,
  modules: PropTypes.arrayOf(PropTypes.any),
  appTenants: PropTypes.arrayOf(PropTypes.any),
  additionalComponent: PropTypes.arrayOf(PropTypes.any),
};
