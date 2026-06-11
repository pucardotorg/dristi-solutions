import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { loginConfig as defaultLoginConfig } from "./config";
import LoginComponent from "./login";

const EmployeeLogin = ({ tenantsData, isTenantsDataLoading }) => {
  const { t } = useTranslation();
  const { path } = useRouteMatch();
  const [loginConfig, setloginConfig] = useState(defaultLoginConfig);

  const { data: mdmsData, isLoading } = Digit.Hooks.useCommonMDMS(Digit.ULBService.getStateId(), "commonUiConfig", ["LoginConfig"], {
    select: (data) => ({
      config: data?.commonUiConfig?.LoginConfig,
    }),
    retry: false,
  });

  useEffect(() => {
    if (isLoading === false && mdmsData?.config) {
      setloginConfig(mdmsData?.config);
    }
  }, [mdmsData, isLoading]);

  const loginParams = useMemo(() =>
    loginConfig.map(
      (step) => {
        const texts = {};
        for (const key in step.texts) {
          texts[key] = t(step.texts[key]);
        }
        return { ...step, texts };
      },
      [loginConfig]
    )
  );

  return (
    <Switch>
      <Route path={`${path}`} exact>
        <LoginComponent config={loginParams[0]} t={t} tenantsData={tenantsData} isTenantsDataLoading={isTenantsDataLoading} />
      </Route>
    </Switch>
  );
};

EmployeeLogin.propTypes = {
  tenantsData: PropTypes.array,
  isTenantsDataLoading: PropTypes.bool,
};

export default EmployeeLogin;
