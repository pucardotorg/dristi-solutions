import React from "react";

const sharedStyle = {
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  padding: "8px",
  background: "#F9FAFB",
};

const SidebarItem = ({ t, label, count, active, onClick, href }) => {
  const style = {
    ...sharedStyle,
    // borderLeft: active ? "4px solid #f47738" : "none",
    fontWeight: active ? 600 : 400,
    color: active ? "#231F20" : "#3D3C3C",
    background: active ? "#E8E8E8" : "#F9FAFB",
    borderRadius: active ? "4px" : "0px",
    textDecoration: "none",
  };

  const content = (
    <React.Fragment>
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
    </React.Fragment>
  );

  if (href) {
    return (
      <a href={href} style={style} tabIndex={0} aria-label={t(label)} target={undefined} rel="noopener noreferrer" onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <div onClick={onClick} style={style}>
      {content}
    </div>
  );
};

export default SidebarItem;
