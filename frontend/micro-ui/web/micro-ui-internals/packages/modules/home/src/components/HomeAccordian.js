import { CustomArrowDownIcon, CustomArrowUpIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import React, { useState } from "react";

const HomeAccordian = ({ title, count, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ paddingTop: 20 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          padding: "4px 0px",
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          color: "#3D3C3C",
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
        <span style={{ marginLeft: 8 }}>{open ? <CustomArrowUpIcon /> : <CustomArrowDownIcon />}</span>
      </div>
      {open && children}
    </div>
  );
};

export default HomeAccordian;
