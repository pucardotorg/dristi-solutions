import { CloseSvg } from "@egovernments/digit-ui-components";
import PropTypes from "prop-types";
import React from "react";

export const CloseBtn = ({ onClick, backgroundColor, style, className, isMobileView: _omitMobileFlag, "aria-label": ariaLabel }) => {
  const activate = (e) => onClick?.(e);
  return (
    <button
      type="button"
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(e);
        }
      }}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        border: "none",
        background: "transparent",
        ...(backgroundColor && { backgroundColor }),
        ...style,
      }}
      className={className}
      aria-label={ariaLabel || "Close"}
    >
      <CloseSvg />
    </button>
  );
};

CloseBtn.propTypes = {
  "aria-label": PropTypes.string,
  backgroundColor: PropTypes.string,
  className: PropTypes.string,
  isMobileView: PropTypes.bool,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export const Heading = ({ className, label, style }) => {
  return (
    <h1 className={className || "heading-m"} style={style}>
      {label}
    </h1>
  );
};

Heading.propTypes = {
  className: PropTypes.string,
  label: PropTypes.node.isRequired,
  style: PropTypes.object,
};
