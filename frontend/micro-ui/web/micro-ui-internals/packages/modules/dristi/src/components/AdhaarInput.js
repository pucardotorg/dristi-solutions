import PropTypes from "prop-types";
import React, { useEffect, useMemo, useRef, useState } from "react";

function splitStringIntoChunks(numberString) {
  const chunks = [];
  for (let i = 0; i < numberString.length; i += 4) {
    chunks.push(numberString.slice(i, i + 4));
  }
  while (chunks.length < 3) {
    chunks.push("");
  }
  return chunks;
}

const AadhaarInput = (props) => {
  const { formData = {}, onSelect, config } = props;

  const [boxCount, setboxCount] = useState(() => {
    const slice = formData?.[config.key]?.aadharNumber;
    if (slice) {
      return splitStringIntoChunks(slice);
    }
    return ["", "", ""];
  });
  const [focusedInput, setFocusedInput] = useState(null);
  const inputRef0 = useRef(null);
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const inputRefs = useMemo(() => [inputRef0, inputRef1, inputRef2], []);
  const inputs = useMemo(() => config?.populators?.inputs ?? [], [config?.populators?.inputs]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutside = !inputRefs.some((ref) => ref.current?.contains(event.target));
      if (clickedOutside && focusedInput !== null) {
        inputRefs[focusedInput].current?.focus();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [focusedInput, inputRefs]);

  const setValue = (value, input) => {
    const slice = formData?.[config.key] ?? {};
    if (Array.isArray(input)) {
      onSelect(config.key, {
        ...slice,
        ...input.reduce((res, curr) => {
          res[curr] = value[curr];
          return res;
        }, {}),
      });
    } else {
      onSelect(config.key, { ...slice, [input]: value });
    }
  };

  const handleChange = (key, value, index) => {
    const newInputs = [...boxCount];
    newInputs[index] = value;

    if (value.length === 4 && index < 2) {
      focusNextInput(index + 1);
    }
    setboxCount(newInputs);
    const fullValue = newInputs.join("");
    setValue(fullValue, key);
  };

  const handleFocus = (index) => {
    setFocusedInput(index);
  };

  const focusNextInput = (index) => {
    if (index < inputRefs.length) {
      inputRefs[index].current?.focus();
    }
  };

  const handleKeyUp = (index, e) => {
    if (e.key === "Backspace" && index > 0 && boxCount[index] === "") {
      focusPreviousInput(index - 1);
    }
  };

  const focusPreviousInput = (index) => {
    if (index >= 0) {
      inputRefs[index].current?.focus();
    }
  };

  return (
    <React.Fragment>
      {inputs.map((input) => {
        return (
          <div className="input-otp-wrap" key={input.name}>
            {boxCount.map((value, index) => (
              <input
                key={`${input.name}-aadhaar-${index}`}
                ref={inputRefs[index]}
                type="text"
                maxLength={4}
                aria-label={`Aadhaar number segment ${index + 1} of 3`}
                onInput={(e) => {
                  const next = e.target.value.replaceAll(/\D/g, "");
                  if (next !== e.target.value) {
                    e.target.value = next;
                  }
                }}
                value={value}
                onChange={(e) => handleChange(input.name, e.target.value, index)}
                onFocus={() => handleFocus(index)}
                onKeyUp={(e) => handleKeyUp(index, e)}
                className="input-otp"
              />
            ))}
          </div>
        );
      })}
    </React.Fragment>
  );
};

const adhaarInputConfigPropType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  populators: PropTypes.shape({
    inputs: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
      })
    ),
  }),
});

AadhaarInput.propTypes = {
  formData: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  config: adhaarInputConfigPropType.isRequired,
};

export default AadhaarInput;
