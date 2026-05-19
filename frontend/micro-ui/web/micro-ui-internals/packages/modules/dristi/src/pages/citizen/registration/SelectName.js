import { FormComposerV2 } from "@egovernments/digit-ui-module-core";
import React, { useMemo } from "react";
import { sanitizeRegistrationNameFieldsOnChange, useUserRegistrationSessionRestore } from "./shared/registrationFlowShared";

const SelectName = ({ config, t, onSubmit, isDisabled, params, history, value, isUserLoggedIn, pathOnRefresh, isLitigantPartialRegistered }) => {
  if (!params?.mobileNumber && !isUserLoggedIn) {
    history.push(`/${window?.contextPath}/citizen/dristi/home/login`);
  }

  useUserRegistrationSessionRestore({
    params,
    history,
    pathOnRefresh,
    shouldRestore: (p) => !p?.isSkip && !p?.email,
    effectDeps: [params?.address],
  });

  const onFormValueChange = (setValue, formData) => sanitizeRegistrationNameFieldsOnChange(setValue, formData);

  const modifiedFormConfig = useMemo(() => {
    const applyUiChanges = (config) => ({
      ...config,
      body: config?.body?.map((body) => {
        let tempBody = {
          ...body,
        };
        if (isLitigantPartialRegistered) {
          tempBody = {
            ...tempBody,
            disable: true,
          };
        }
        return tempBody;
      }),
    });

    return config?.map((config) => applyUiChanges(config));
  }, [config, isLitigantPartialRegistered]);

  return (
    <React.Fragment>
      <FormComposerV2
        key={params?.name?.firstName}
        config={modifiedFormConfig}
        t={t}
        noBoxShadow
        inline={false}
        label={t("CORE_COMMON_CONTINUE")}
        onSecondayActionClick={() => {}}
        onFormValueChange={onFormValueChange}
        onSubmit={(props) => onSubmit(props)}
        defaultValues={params?.name || {}}
        submitInForm
        className={"registration-select-name"}
      ></FormComposerV2>
    </React.Fragment>
  );
};

export default SelectName;
