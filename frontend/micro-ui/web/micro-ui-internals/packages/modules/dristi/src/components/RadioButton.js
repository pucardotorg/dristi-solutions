import React from "react";
import PropTypes from "prop-types";
import isEqual from "lodash/isEqual";
import { useTranslation } from "react-i18next";
import { Card, CardSubHeader, CardText } from "@egovernments/digit-ui-react-components";

const RadioButtons = (props) => {
  const { t } = useTranslation();
  const { selectedOption: selected, onSelect, options, optionsKey, isDependent, isPTFlow, disabled, name, inputRef, isRejected, inputStyle, style } =
    props;

  function selectOption(value) {
    onSelect(value);
  }

  return (
    <div style={style} className={`radio-wrap ${props?.additionalWrapperClass ?? ""}`}>
      {options?.map((option, ind) => {
        if (!optionsKey || isDependent) {
          return null;
        }
        const optionKey = option?.[optionsKey] ?? option?.code ?? ind;
        const isChecked = Boolean((isPTFlow && selected?.code === option.code) || isEqual(selected, option));
        return (
          <Card
            key={String(optionKey)}
            style={{
              ...style,
            }}
          >
            <div className="card-button-wrap">
              <span className="radio-btn-wrap" style={isRejected ? { pointerEvents: "none" } : {}}>
                <input
                  className="radio-btn"
                  type="radio"
                  value={option}
                  checked={isChecked}
                  onChange={() => selectOption(option)}
                  disabled={disabled}
                  name={name}
                  ref={inputRef}
                />
                <span className="radio-btn-checkmark" />
              </span>
              <div className="button-label-main">
                <CardSubHeader
                  style={{
                    marginLeft: "10px",
                    fontSize: "24px",
                    ...inputStyle,
                  }}
                >
                  {t(option[optionsKey])}
                </CardSubHeader>
                <CardText
                  style={{
                    marginLeft: "10px",
                    fontSize: "16px",
                    ...inputStyle,
                  }}
                >
                  {t(option.subText)}
                </CardText>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

RadioButtons.propTypes = {
  selectedOption: PropTypes.any,
  onSelect: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.any),
  optionsKey: PropTypes.string,
  style: PropTypes.any,
  additionalWrapperClass: PropTypes.string,
  disabled: PropTypes.bool,
  isPTFlow: PropTypes.bool,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  isRejected: PropTypes.any,
  isDependent: PropTypes.bool,
  inputStyle: PropTypes.object,
  name: PropTypes.string,
};

RadioButtons.defaultProps = {
  additionalWrapperClass: "",
};

export default RadioButtons;
