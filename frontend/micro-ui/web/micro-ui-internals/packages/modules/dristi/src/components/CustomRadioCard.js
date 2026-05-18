import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Loader, LabelFieldPair, CardLabelError, CardText, CardHeader } from "@egovernments/digit-ui-react-components";
import RadioButtons from "./RadioButton";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import get from "lodash/get";

const getShowDependentFields = (input, formData, config) => {
  if (input.isDependentOn && !formData?.[config.key]) {
    return false;
  }
  if (formData?.[config.key]?.[input.isDependentOn]) {
    return (
      formData?.[config.key] &&
      Array.isArray(input.dependentKey[input.isDependentOn]) &&
      input.dependentKey[input.isDependentOn].reduce((res, curr) => {
        if (!res) return res;
        res = formData[config.key][input.isDependentOn][curr];
        return res;
      }, true)
    );
  }
  return true;
};

const CustomRadioCard = ({ t, config, onSelect, formData = {}, errors, label }) => {
  const Digit = window.Digit || {};
  const history = useHistory();
  const inputs = useMemo(() => config?.populators?.inputs, [config?.populators?.inputs]);
  const [isRejected, setIsRejcted] = useState(history.location.state?.isRejected || "");
  function setValue(value, name, input) {
    onSelect(config.key, { ...formData[config.key], [name]: value });
  }
  const { data: idTypeData, isLoading } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "User Registration", [{ name: "IdType" }], {
    select: (data) => {
      return get(data, "User Registration.IdType", []).map((opt) => ({ ...opt }));
    },
  });
  if (isLoading) return <Loader />;
  return (
    <div>
      {inputs?.map((input) => {
        let currentValue = (formData && formData[config.key] && formData[config.key][input.name]) || "";
        const showDependentFields = getShowDependentFields(input, formData, config);
        return (
          <React.Fragment key={input.name}>
            {errors[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}

            {showDependentFields && (
              <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <CardHeader style={{ fontSize: "30px" }} className="card-label-smaller">
                  {t(input.label)}
                </CardHeader>

                <CardText style={{ fontWeight: 200 }} className="card-label-smaller">
                  {t(input.subLabel)}
                </CardText>

                <div className="field" style={{ width: "50%" }}>
                  <RadioButtons
                    style={{ display: "flex", justifyContent: "flex-start", gap: "3rem", ...input.styles }}
                    options={input?.options || idTypeData || []}
                    key={input.name}
                    optionsKey={input?.optionsKey}
                    value={formData?.[config.key]?.[input.name]}
                    onSelect={(e) => {
                      setValue(e, input.name, input);
                    }}
                    selectedOption={formData?.[config.key]?.[input.name]}
                    defaultValue={formData?.[config.key]?.[input.name]}
                    t={t}
                    errorStyle={errors?.[input.name]}
                    disabled={input?.disable}
                    isRejected={isRejected}
                  />

                  {currentValue &&
                    currentValue.length > 0 &&
                    !["documentUpload", "radioButton"].includes(input.type) &&
                    input.validation &&
                    !currentValue.match(Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern) && (
                      <CardLabelError style={{ width: "100%", marginTop: "-15px", fontSize: "16px", marginBottom: "12px" }}>
                        <span style={{ color: "#FF0000" }}> {t(input.validation?.errMsg || "CORE_COMMON_INVALID")}</span>
                      </CardLabelError>
                    )}
                </div>
              </LabelFieldPair>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

CustomRadioCard.propTypes = {
  t: PropTypes.func,
  config: PropTypes.shape({
    key: PropTypes.string,
    populators: PropTypes.shape({
      inputs: PropTypes.array,
    }),
  }),
  onSelect: PropTypes.func,
  formData: PropTypes.object,
  errors: PropTypes.object,
  label: PropTypes.string,
};

export default CustomRadioCard;
