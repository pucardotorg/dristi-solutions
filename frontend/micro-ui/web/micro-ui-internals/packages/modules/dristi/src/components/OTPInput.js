import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";

const SingleInput = ({ isFocus, onChange, onFocus, value, inputStyle, ...rest }) => {
  const inputRef = useRef();
  useEffect(() => {
    if (isFocus) {
      inputRef.current.focus();
    }
  }, [isFocus]);

  return (
    <input
      style={{ width: "70px", margin: "0px", ...(inputStyle ?? {}) }}
      className="input-otp"
      maxLength={1}
      onChange={onChange}
      onFocus={onFocus}
      ref={inputRef}
      value={value ?? ""}
      {...rest}
      type="text"
      pattern="[0-9]*"
      onInput={(e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
      }}
    />
  );
};

SingleInput.propTypes = {
  isFocus: PropTypes.bool,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  inputStyle: PropTypes.object,
};

const OTPInput = ({ length, inputStyle, otpInputStyles, ...props }) => {
  const [activeInput, setActiveInput] = useState(0);

  const isInputValueValid = (otpChar) => {
    return typeof otpChar === "string" && otpChar.trim().length === 1;
  };

  const changeCodeAtFocus = (otpChar) => {
    const { onChange } = props;
    const otp = getOtpValue();
    otp[activeInput] = otpChar[0] ?? "";
    const otpValue = otp.join("");
    onChange(otpValue);
  };

  const focusNextInput = () => {
    setActiveInput((idx) => {
      if (!length) return 0;
      return Math.min(idx + 1, length - 1);
    });
  };

  const focusPrevInput = () => {
    setActiveInput((idx) => Math.max(idx - 1, 0));
  };

  const getOtpValue = () =>
    props.value === undefined || props.value === null ? [] : props.value.toString().split("");

  const handleKeyDown = (event) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      changeCodeAtFocus("");
      focusPrevInput();
    }
  };

  function inputChange(event) {
    const { value } = event.target;
    changeCodeAtFocus(value);
    if (isInputValueValid(value)) {
      focusNextInput();
    }
  }

  const OTPStack = [];
  const otp = getOtpValue();
  for (let i = 0; i < length; i++) {
    OTPStack.push(
      <SingleInput
        inputStyle={inputStyle}
        key={`otp-slot-${i}`}
        isFocus={activeInput === i}
        onChange={inputChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          setActiveInput(i);
          e.target.select();
        }}
        value={otp[i]}
      />
    );
  }

  return (
    <div style={{ backgroundColor: "none", ...otpInputStyles }} className="input-otp-wrap">
      {OTPStack}
    </div>
  );
};

OTPInput.propTypes = {
  length: PropTypes.number,
  inputStyle: PropTypes.object,
  otpInputStyles: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

OTPInput.defaultProps = {
  length: 0,
};

export default OTPInput;
