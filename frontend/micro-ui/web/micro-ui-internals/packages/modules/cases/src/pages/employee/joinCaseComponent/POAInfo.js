import { ButtonSelector, FormComposerV2 } from "@egovernments/digit-ui-react-components";
import React, { useRef, useState } from "react";
import { poaApplicationConfig } from "../../../configs/poaApplicationConfig";
import isEqual from "lodash/isEqual";
import { useEffect } from "react";
import { runComprehensiveSanitizer } from "@egovernments/digit-ui-module-dristi/src/Utils";

const fieldStyle = { marginRight: 0, width: "100%" };

const POAInfo = ({ t, poaJoinedParties, setIsDisabled, onProceed, goBack, isApiCalled, isDisabled, setFormData, formdata }) => {
  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors) => {
    runComprehensiveSanitizer({ formData, setValue });
    if (!isEqual(formData, formdata)) {
      setFormData(formData);
    }
  };

  useEffect(() => {
    setIsDisabled(!formdata?.prayer);
  }, [formdata?.prayer, setIsDisabled]);

  return (
    <React.Fragment>
      <div style={{ marginBottom: "1rem", padding: "1.5rem 0 0 2rem" }}>{t("Names of Litigants for whom Power of Attorney is being claimed")}</div>
      <ul style={{ paddingLeft: "4.5rem", listStyleType: "disc", listStylePosition: "outside" }}>
        {poaJoinedParties?.map((poaParty, index) => (
          <li key={index}>{poaParty?.fullName}</li>
        ))}
      </ul>
      <div className="litigant-verification">
        <FormComposerV2
          config={poaApplicationConfig}
          fieldStyle={fieldStyle}
          className={"multi-litigant-composer"}
          onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors) =>
            onFormValueChange(setValue, formData, formState, reset, setError, clearErrors)
          }
          defaultValues={formdata}
        />
      </div>
      <div className={"multi-litigant-composer-footer"} style={{ display: "flex", flexDirection: "row-reverse" }}>
        <div className={"multi-litigant-composer-footer-right"}>
          <ButtonSelector theme={"border"} textStyles={{ margin: 0 }} label={t("JOIN_CASE_BACK_TEXT")} onSubmit={goBack} />
          <ButtonSelector
            textStyles={{ margin: 0 }}
            label={t("PROCEED_TEXT")}
            onSubmit={() => {
              onProceed(poaJoinedParties);
            }}
            isDisabled={isDisabled || isApiCalled}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default POAInfo;
