import React from "react";

const SideBarTitle = ({ t, title, count, active, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "16px 16px 8px 16px",
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        color: "#0B0C0C",
        fontWeight: 600,
        // color: active ? "#0B0C0C" : "#505A5F",
        // borderLeft: active ? "4px solid #f47738" : "none",
        // paddingLeft: active ? "12px" : "16px",
        // fontWeight: active ? 600 : 400,
      }}
    >
      {t(title)}
      {count && (
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
};

export default SideBarTitle;
