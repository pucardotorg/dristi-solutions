import React from "react";

const SidebarItem = ({ t, label, count, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      fontSize: 16,
      fontWeight: 400,
      display: "flex",
      alignItems: "center",
      color: "#77787B",
      cursor: "pointer",
      borderLeft: active ? "4px solid #f47738" : "none",
      padding: "10px 16px 10px 32px",
      background: "#F9FAFB",
      borderTop: "1px solid #E6E6E6",
    }}
  >
    <span style={{ flex: 1 }}>{t(label)}</span>
    {typeof count === "number" && (
      <span
        style={{
          fontSize: 14,
          fontWeight: 400,
          background: "#FCE8E8",
          color: "#BB2C2F",
          borderRadius: 12,
          padding: "2px 8px",
        }}
      >
        {count}
      </span>
    )}
  </div>
);

export default SidebarItem;
