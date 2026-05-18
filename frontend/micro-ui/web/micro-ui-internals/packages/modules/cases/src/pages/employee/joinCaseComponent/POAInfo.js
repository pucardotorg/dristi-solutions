import PropTypes from "prop-types";
import { ButtonSelector } from "@egovernments/digit-ui-react-components";
import { FormComposerV2 } from "@egovernments/digit-ui-module-core";
import React from "react";
import { poaApplicationConfig } from "../../../configs/poaApplicationConfig";
import isEqual from "lodash/isEqual";
import { runComprehensiveSanitizer } from "@egovernments/digit-ui-module-dristi/src/Utils";

const fieldStyle = { marginRight: 0, width: "100%" };

const POAInfo = ({ t, poaJoinedParties, onProceed, goBack, isApiCalled, isDisabled, setFormData, formdata }) => {
  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors) => {
    runComprehensiveSanitizer({ formData, setValue });
    if (!isEqual(formData, formdata)) {
      setFormData(formData);
    }
  };

  return (
    <div className="poa-info-screen">
      <div style={{ marginBottom: "1rem", padding: "1.5rem 0 0 2rem" }}>{t("Names of Litigants for whom Power of Attorney is being claimed")}</div>
      <ul style={{ paddingLeft: "4.5rem", listStyleType: "disc", listStylePosition: "outside" }}>
        {poaJoinedParties?.map((poaParty, index) => (
          <li key={poaParty?.individualId ?? poaParty?.uuid ?? poaParty?.uniqueId ?? `poa-party-${index}`}>{poaParty?.fullName}</li>
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
    </div>
  );
};

POAInfo.propTypes = {
  t: PropTypes.func.isRequired,
  poaJoinedParties: PropTypes.array,
  onProceed: PropTypes.func.isRequired,
  goBack: PropTypes.func.isRequired,
  isApiCalled: PropTypes.bool,
  isDisabled: PropTypes.bool,
  setFormData: PropTypes.func.isRequired,
  formdata: PropTypes.object,
};

export default POAInfo;
