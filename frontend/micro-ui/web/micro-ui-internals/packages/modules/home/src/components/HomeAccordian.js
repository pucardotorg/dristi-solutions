import { CustomArrowDownIcon, CustomArrowUpIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import React, { useState } from "react";

const HomeAccordian = ({ title, count, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: "1px solid #E6E6E6" }}>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          padding: 16,
          background: "#F9FAFB",
          // background: open ? "#f7f7f7" : "#fff",
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span style={{ flex: 1 }}>{title}</span>
        {typeof count === "number" && (
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
        {open ? <CustomArrowUpIcon /> : <CustomArrowDownIcon />}
      </div>
      {open && children}
    </div>
  );
};

export default HomeAccordian;
