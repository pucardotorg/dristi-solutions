import { FormComposerV2, LabelFieldPair, CardLabel, RadioButtons } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { registerRespondentConfig } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/Config/resgisterRespondentConfig";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";
import { useFieldArray } from "react-hook-form";

const RegisterRespondentForm = ({ accusedRegisterFormData, setAccusedRegisterFormData, error }) => {
  const setFormErrors = useRef(null);

  const [selected, setSelected] = useState({});
  const formConfig = useMemo(() => {
    return selected?.respondentType?.code === "REPRESENTATIVE" ? registerRespondentConfig?.companyConfig : registerRespondentConfig?.individualConfig;
  }, [selected?.respondentType?.code]);

  useEffect(() => {
    for (const key in error) {
      setFormErrors.current(key, error[key]);
    }
  }, [error]);

  return (
    <div className="register-respondent-form">
      <FormComposerV2
        key={`form-config-${selected?.respondentType?.code}`}
        config={formConfig}
        onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
          setFormErrors.current = setError;
          if (!isEqual(selected, formData)) {
            setSelected(formData);
            setAccusedRegisterFormData(formData);
          }
        }}
        defaultValues={accusedRegisterFormData}
        actionClassName="e-filing-action-bar"
        noBreakLine
      />
    </div>
  );
};

export default RegisterRespondentForm;
