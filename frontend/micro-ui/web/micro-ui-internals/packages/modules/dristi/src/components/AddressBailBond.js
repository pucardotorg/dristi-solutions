import { CardLabel, CardLabelError, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React, { useMemo } from "react";
import { formatAddress, sanitizeData } from "../Utils";

const AddressBailBond = ({
  t,
  config,
  onSelect,
  formData = {},
  errors,
  formState,
  control,
  watch,
  register,
  setError,
  clearErrors,
  formDisbalityCount,
}) => {
  const { inputs } = useMemo(() => {
    const finalInputs = config?.populators?.inputs ? [...config.populators.inputs] : [];

    return {
      inputs: finalInputs,
    };
  }, [config?.populators?.inputs]);

  const setValue2 = (value, input) => {
    onSelect(config.key, { ...formData, [input]: value }, { shouldValidate: true });
  };

  const checkIfNotValidated = (currentValue, input) => {
    const isEmpty = /^\s*$/.test(currentValue);
    const isNotValid = isEmpty || !currentValue.match(window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern); // NOSONAR — Digit APIs are attached to window
    return isNotValid;
  };
  return (
    <div>
      {config?.withoutLabel && (
        <CardLabel className="card-label-smaller" style={{ paddingBottom: "10px" }}>
          {t(config?.label)}
        </CardLabel>
      )}
      {inputs?.map((input) => {
        let currentValue = formData?.[input?.name] || "";
        return (
          <React.Fragment key={input.name}>
            {errors?.[input.name] && <CardLabelError>{t(input.error)}</CardLabelError>}
            <LabelFieldPair>
              <CardLabel className="card-label-smaller">
                {t(input.label)}
                <span style={{ color: "rgb(119, 120, 123)" }}>{input?.showOptional && ` ${t("CS_IS_OPTIONAL")}`}</span>
              </CardLabel>
              <div className={`field ${input.inputFieldClassName}`}>
                <TextInput
                  t={t}
                  className="field desktop-w-full"
                  key={input?.key}
                  name={input.name}
                  value={formData?.[input?.name] || ""}
                  onChange={(e) => {
                    let value = sanitizeData(e.target.value);
                    if (input?.isFormatRequired) {
                      value = formatAddress(value);
                    }
                    if (input?.validation?.maxlength && value.length > input?.validation?.maxlength) {
                      return;
                    }
                    setValue2(value, input.name);
                  }}
                  disable={input?.isDisabled || formDisbalityCount}
                  isRequired={input?.validation?.isRequired}
                  pattern={input?.validation?.pattern}
                  errMsg={input?.validation?.errMsg}
                  maxlength={input?.validation?.maxLength}
                  minlength={input?.validation?.minLength}
                  title={input?.validation?.title}
                />
                {currentValue && currentValue.length > 0 && input.validation && checkIfNotValidated(currentValue, input) && (
                  <CardLabelError style={{ width: "100%", marginTop: "-15px", fontSize: "16px", marginBottom: "12px", color: "#FF0000" }}>
                    <span style={{ color: "#FF0000" }}> {t(input.validation?.errMsg || "CORE_COMMON_INVALID")}</span>
                  </CardLabelError>
                )}
                {errors[input?.name] && (
                  <CardLabelError>
                    <span style={{ color: "#ff0000" }}>{t(errors[input?.name]?.message)}</span>
                  </CardLabelError>
                )}
              </div>
            </LabelFieldPair>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const bailBondInputPropType = PropTypes.shape({
  name: PropTypes.string,
  key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  error: PropTypes.string,
  showOptional: PropTypes.bool,
  inputFieldClassName: PropTypes.string,
  isFormatRequired: PropTypes.bool,
  isDisabled: PropTypes.bool,
  validation: PropTypes.object,
});

const bailBondConfigPropType = PropTypes.shape({
  key: PropTypes.string,
  label: PropTypes.string,
  withoutLabel: PropTypes.bool,
  populators: PropTypes.shape({
    inputs: PropTypes.arrayOf(bailBondInputPropType),
  }),
});

AddressBailBond.propTypes = {
  t: PropTypes.func.isRequired,
  config: bailBondConfigPropType.isRequired,
  onSelect: PropTypes.func.isRequired,
  formData: PropTypes.object,
  errors: PropTypes.object,
  formState: PropTypes.object,
  control: PropTypes.any,
  watch: PropTypes.any,
  register: PropTypes.any,
  setError: PropTypes.func,
  clearErrors: PropTypes.func,
  formDisbalityCount: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
};

export default AddressBailBond;
