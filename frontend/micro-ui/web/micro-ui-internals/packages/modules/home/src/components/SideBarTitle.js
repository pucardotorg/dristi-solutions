import React from "react";

const SideBarTitle = ({ t, title, count = null, active, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: "4px 0px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        color: "#3D3C3C",
      }}
    >
      {t(title)}

      {count !== null && (
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
