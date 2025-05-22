import React, { useState } from "react";

const HomeAccordian = ({ title, count, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: "1px solid #eee" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: "10px 16px",
          background: open ? "#f7f7f7" : "#fff",
          fontWeight: 600,
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span style={{ flex: 1 }}>{title}</span>
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
        <span style={{ marginLeft: 8 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ paddingLeft: 24 }}>{children}</div>}
    </div>
  );
};

export default HomeAccordian;
