import React from "react";
import PropTypes from "prop-types";
import { InfoToolTipIcon, InfoIcon } from "../icons/svgIndex";

const CustomErrorTooltip = ({ message, showTooltip, icon }) => {
  if (!showTooltip) {
    return null;
  }

  return (
    <div className="custom-error-tooltip" style={{ position: "relative" }}>
      <span>{icon ? <InfoIcon /> : <InfoToolTipIcon />}</span>
      {message && (
        <div
          className="custom-error-tooltip-message"
          style={{
            ...(!message && { border: "none" }),
            position: "absolute",
            whiteSpace: "unset",
            width: "max-content",
            maxWidth: "25vw",
            top: "100%",
            left: "100%",
            bottom: "unset",
            right: "unset",
            backgroundColor: "white",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

CustomErrorTooltip.propTypes = {
  message: PropTypes.string,
  showTooltip: PropTypes.bool,
  icon: PropTypes.node,
};

export default CustomErrorTooltip;
