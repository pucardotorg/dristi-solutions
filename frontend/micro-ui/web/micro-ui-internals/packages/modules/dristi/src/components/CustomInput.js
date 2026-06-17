import { Button, CardLabel, RemoveableTag, TextInput } from "@egovernments/digit-ui-react-components";
import React from "react";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";

function CustomInput({ onChange, value, isDisabled, componentInFront, config, _defaultValues = {}, canAdd, handleAdd, handleRemove, chipList, t }) {
  const { register, watch, errors, handleSubmit } = useForm({
    defaultValues: _defaultValues,
  });
  const isDisable = isDisabled ? true : config.canDisable && Object.keys(errors).filter((i) => errors[i]).length;
  const inputs = config?.inputs;

  return inputs.map((input) => {
    return (
      <div key={input.name} style={{ width: "100%" }}>
        <CardLabel>{t(input.label)}</CardLabel>
        <div style={{ display: "flex", justifyContent: "left", gap: "20px" }}>
          <div style={{ display: "flex", width: "100%" }}>
            {componentInFront ? <span className="citizen-card-input citizen-card-input--front">{componentInFront}</span> : null}
            <TextInput
              value={"99999"}
              prefix={""}
              name={input.name}
              minlength={input?.validation?.minLength}
              maxlength={input?.validation?.maxLength}
              validation={input?.validation}
              ValidationRequired={input?.validation}
              title={input?.validation?.title}
              disable={input?.disable ? input?.disable : false}
              inputRef={register(input?.validation)}
              isMandatory={errors[input?.name]}
            />
          </div>
          <Button
            label={t("CS_ADD")}
            style={{ alignItems: "center" }}
            isDisabled={!canAdd}
            onButtonClick={() => {
              handleAdd(value);
            }}
          />
        </div>
        {chipList?.length > 0 ? (
          <div className="tag-container" style={{ width: "100%" }}>
            {chipList?.length > 0 &&
              chipList?.map((chipValue) => {
                return (
                  <RemoveableTag
                    extraStyles={{
                      closeIconStyles: { fill: "#3D3C3C" },
                      tagStyles: { background: "#E8E8E8", textAlign: "center" },
                      textStyles: { display: "flex", alignItems: "center" },
                    }}
                    key={chipValue}
                    text={chipValue}
                    onClick={() => {
                      handleRemove(chipValue);
                    }}
                  />
                );
              })}
          </div>
        ) : null}
      </div>
    );
  });
}

CustomInput.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.any,
  isDisabled: PropTypes.bool,
  componentInFront: PropTypes.node,
  config: PropTypes.shape({
    canDisable: PropTypes.bool,
    inputs: PropTypes.array,
    key: PropTypes.string,
  }),
  _defaultValues: PropTypes.object,
  canAdd: PropTypes.bool,
  handleAdd: PropTypes.func,
  handleRemove: PropTypes.func,
  chipList: PropTypes.array,
  t: PropTypes.func,
};

export default CustomInput;
