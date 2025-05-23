import React from "react";

const SideBarTitle = ({ t, title, count, active, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 20,
        fontWeight: 700,
        padding: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        color: "#0A0A0A",
        borderBottom: "1px solid #E6E6E6",
      }}
    >
      {t(title)}
      {count && (
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            background: "#FFF6E8",
            color: "#9E400A",
            borderRadius: 12,
            padding: "2px 8px",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
};

export default SideBarTitle;
