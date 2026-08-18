import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Redirect, Route, Switch, useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { FormComposer as FormComposerV2 } from "./FormComposerV2";

/**
 * FormComposerCitizen
 * Handles dynamic form rendering based on the given configuration.
 * Supports form navigation, session storage, and form submission.
 *
 * Used to render forms in citizen screens — mostly targeted for mobile views.
 */
const FormComposerCitizen = ({
  config: baseConfig,
  onSubmit: onFinalSubmit,
  onFormValueChange,
  nextStepLabel,
  submitLabel,
  baseRoute = "",
  sessionKey = "DEFAULT_CITIZEN_CREATE",
  submitInForm = true,
  fieldStyle = { marginRight: 0 },
}) => {
  const { pathname } = useLocation();
  const match = useRouteMatch();
  const { t } = useTranslation();
  const history = useHistory();

  const currentConfig = useMemo(
    () =>
      baseConfig.map((config) => {
        const newConfig = { ...config };
        const bodyConfigs = newConfig?.body?.filter((configs) => configs?.route);
        newConfig.body = bodyConfigs;
        return newConfig;
      }),
    [baseConfig]
  );

  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(sessionKey, {});
  const [nextStep, setNextStep] = useState(baseRoute);

  const onSubmit = async (data) => {
    setParams({ ...params, ...data });
    if (nextStep !== null) {
      history.push(`${match.path}/${nextStep}`);
    } else {
      onFinalSubmit({ ...params, ...data });
    }
  };

  const currentPath = useMemo(() => pathname.split("/").pop(), [pathname]);

  const currentRunningConfig = useMemo(
    () =>
      currentConfig
        .map((config) => {
          const newConfig = { ...config };
          const bodyConfigs = newConfig?.body?.filter((configs) => configs.route == currentPath);
          newConfig.body = bodyConfigs;
          return newConfig;
        })
        ?.filter((eachConfig) => eachConfig?.body?.length > 0),
    [currentConfig, currentPath]
  );

  useEffect(() => {
    return clearParams();
  }, []);

  useEffect(() => {
    setNextStep(currentRunningConfig?.[0]?.body?.[0]?.nextRoute);
  }, [currentRunningConfig]);

  return (
    <div>
      <Switch>
        <Route path={`${match.path}/${currentPath}`} key={""}>
          <FormComposerV2
            label={nextStep == null ? t(submitLabel) : t(nextStepLabel)}
            config={currentRunningConfig.map((config) => {
              return {
                ...config,
              };
            })}
            defaultValues={{ ...params }}
            submitInForm={submitInForm}
            onFormValueChange={onFormValueChange}
            onSubmit={(data) => onSubmit(data)}
            fieldStyle={fieldStyle}
          />
        </Route>

        <Route>
          <Redirect to={`${match.path}/${baseRoute}`} />
        </Route>
      </Switch>
    </div>
  );
};

export default FormComposerCitizen;
