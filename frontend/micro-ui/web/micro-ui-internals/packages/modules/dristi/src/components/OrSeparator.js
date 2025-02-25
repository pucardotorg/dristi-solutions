import React from 'react'

const OrSeparator = ({ t, config, onSelect, formData = {}, errors, setError, clearErrors }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
      <div style={{ flexGrow: 1, height: "1px", backgroundColor: "#ccc" }}></div>
      <span style={{ margin: "0 5px", color: "#666", fontWeight: "bold" }}>{t(config?.sublabel)}</span>
      <div style={{ flexGrow: 1, height: "1px", backgroundColor: "#ccc" }}></div>
    </div>
  );
};

export default OrSeparator;
  