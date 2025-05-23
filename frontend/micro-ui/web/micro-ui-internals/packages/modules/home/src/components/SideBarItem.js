import React from "react";

const SidebarItem = ({ t, label, count, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      padding: "8px 0",
      fontSize: 15,
      color: active ? "#0B0C0C" : "#505A5F",
      cursor: "pointer",
      borderLeft: active ? "4px solid #f47738" : "none",
      paddingLeft: active ? "12px" : "16px",
      fontWeight: active ? 600 : 400,
    }}
  >
    <span style={{ flex: 1 }}>{t(label)}</span>
    {typeof count === "number" && (
      <span
        style={{
          background: "#ffe6cc",
          color: "#ff9900",
          borderRadius: "12px",
          padding: "2px 8px",
          fontSize: "12px",
          marginLeft: "8px",
        }}
      >
        {count}
      </span>
    )}
  </div>
);

export default SidebarItem;
