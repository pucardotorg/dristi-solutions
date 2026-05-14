import { CardHeader, CardLabelError, CardText, CheckBox, LabelFieldPair } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";

const CustomCheckBoxCard = ({ t, config, onSelect, formData = {}, errors, label }) => {
  const inputs = useMemo(() => config?.populators?.inputs, [config?.populators?.inputs]);
  const [value, setValue] = useState([]);

  function setFormValue(val, name, input) {
    onSelect(config.key, val);
  }

  return (
    <div className="custom-checkbox-card">
      {inputs?.map((input) => {
        return (
          <React.Fragment key={input.name}>
            <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <CardHeader style={{ fontSize: "30px" }} className="card-label-smaller">
                {t(input.label)}
              </CardHeader>

              <CardText style={{ fontWeight: 200, width: "70%", textAlign: "center" }} className="card-label-smaller">
                {t(input.subLabel)}
              </CardText>

              <div className="field multi-select-checkbox-wrapper">
                {input?.options?.map((option) => (
                  <CheckBox
                    onChange={(e) => {
                      let tempData = value;
                      const isFound = value?.some((val) => val?.code === option?.code);
                      if (isFound) tempData = value?.filter((val) => val?.code !== option?.code);
                      else tempData.push(option);
                      setFormValue(tempData, input?.name);
                      setValue(tempData);
                    }}
                    key={option.code}
                    value={value?.find((val) => val?.code === option?.code)}
                    checked={value?.find((val) => val?.code === option?.code)}
                    label={t(option?.name)}
                  />
                ))}
                {errors[input.name] && (
                  <CardLabelError>
                    {errors[input.name]?.message ? errors[input.name]?.message : t(errors[input.name]) || t(input.error)}
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

CustomCheckBoxCard.propTypes = {
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

export default CustomCheckBoxCard;
