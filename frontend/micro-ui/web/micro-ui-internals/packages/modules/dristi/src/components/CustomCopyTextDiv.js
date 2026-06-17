import React, { useState } from "react";
import PropTypes from "prop-types";
import { CardText } from "@egovernments/digit-ui-react-components";
import { CopyIcon } from "../icons/svgIndex";

const CustomCopyTextDiv = ({
  data,
  t,
  keyStyle,
  valueStyle,
  textWrapperStyle,
  cardStyle,
  subCardStyle,
  isCenter = false,
  isShowValue = true,
  customTextStyle,
}) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const dataCopy = (index, duration = 3000) => {
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, duration);
  };

  return (
    <div style={{ borderRadius: "10px", backgroundColor: "#F7F5F3", padding: "10px", width: "100%", ...cardStyle }}>
      {data.map(({ key, value, copyData = true, isLocalization = true, customText = "" }, index) => (
        <div key={key} style={{ display: "flex", marginBottom: "10px", ...subCardStyle }}>
          {!isCenter && (
            <div style={{ flex: 1, ...textWrapperStyle }}>
              <CardText className={"copy-key-text"} style={keyStyle}>
                {isLocalization ? t(key) : key}
              </CardText>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", paddingLeft: "10px" }}>
            {isShowValue && <CardText style={valueStyle}>{t(value)}</CardText>}
            {copyData && (
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "16px",
                  backgroundColor: "transparent",
                  ...(customTextStyle && customTextStyle),
                }}
                onClick={() => {
                  handleCopy(value);
                  dataCopy(index);
                }}
              >
                <CopyIcon />
                {copiedIndex === index ? "Copied" : `Copy ${customText}`}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

CustomCopyTextDiv.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      value: PropTypes.string,
      copyData: PropTypes.bool,
      isLocalization: PropTypes.bool,
      customText: PropTypes.string,
    })
  ),
  t: PropTypes.func,
  keyStyle: PropTypes.object,
  valueStyle: PropTypes.object,
  textWrapperStyle: PropTypes.object,
  cardStyle: PropTypes.object,
  subCardStyle: PropTypes.object,
  isCenter: PropTypes.bool,
  isShowValue: PropTypes.bool,
  customTextStyle: PropTypes.object,
};

export default CustomCopyTextDiv;
