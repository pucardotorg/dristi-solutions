import React from "react";

const sharedStyle = {
  fontSize: 16,
  fontWeight: 400,
  display: "flex",
  alignItems: "center",
  color: "#77787B",
  cursor: "pointer",
  padding: "10px 16px 10px 32px",
  background: "#F9FAFB",
  borderTop: "1px solid #E6E6E6",
};

const SidebarItem = ({ t, label, count, active, onClick, href }) => {
  const style = {
    ...sharedStyle,
    // borderLeft: active ? "4px solid #f47738" : "none",
    background: active ? "#E8E8E8" : "#F9FAFB",
    textDecoration: "none",
  };
  console.log(active, label);

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
