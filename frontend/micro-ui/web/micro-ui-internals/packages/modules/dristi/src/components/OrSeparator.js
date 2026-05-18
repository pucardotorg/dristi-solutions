import PropTypes from "prop-types";
import React from "react";

function OrSeparator(props) {
  const { t, config } = props;

  return (
    <div style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
      <div style={{ flexGrow: 1, height: "1px", backgroundColor: "#ccc" }}></div>
      <span style={{ margin: "0 5px", color: "#666", fontWeight: "bold" }}>{t(config?.sublabel)}</span>
      <div style={{ flexGrow: 1, height: "1px", backgroundColor: "#ccc" }}></div>
    </div>
  );
}

OrSeparator.propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.shape({
    sublabel: PropTypes.string,
  }),
  setError: PropTypes.func,
  clearErrors: PropTypes.func,
  onSelect: PropTypes.func,
  formData: PropTypes.object,
  errors: PropTypes.object,
};

export default OrSeparator;
