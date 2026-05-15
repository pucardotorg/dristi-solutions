import PropTypes from "prop-types";
import React from "react";

export const RenderInstance = ({ value = "", t }) => {
  return (
    <div style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18.75px", color: "#0B0C0C" }}>{t(value)}</div>
  );
};

RenderInstance.propTypes = {
  value: PropTypes.string,
  t: PropTypes.func.isRequired,
};
