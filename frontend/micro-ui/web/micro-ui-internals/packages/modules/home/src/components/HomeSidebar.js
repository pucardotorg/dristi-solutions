// frontend/micro-ui/web/micro-ui-internals/packages/modules/home/src/components/Sidebar.js

import React from "react";
import CustomAccordion from "./HomeAccordian";

const HomeSidebar = () => {
  return (
    <div style={{ width: 260, background: "#fafbfc", borderRight: "1px solid #eee", minHeight: "100vh" }}>
      <div style={{ padding: "16px 16px 0 16px", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center" }}>
        Hearings
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
          35
        </span>
      </div>

      <CustomAccordion title="Actions" count={35} defaultOpen>
        <SidebarItem label="Register Cases" count={5} />
        <SidebarItem label="Review Process" count={5} />
        <SidebarItem label="View Applications" count={5} />
        <SidebarItem label="Schedule Hearing" count={5} />
      </CustomAccordion>

      <CustomAccordion title="Sign">
        <SidebarItem label="Orders" />
        <SidebarItem label="Process" />
        <SidebarItem label="A-Dairy" />
      </CustomAccordion>

      <div style={{ padding: "10px 16px", fontWeight: 600 }}>Bulk Reschedule</div>
    </div>
  );
};

const SidebarItem = ({ label, count }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "8px 0",
      fontSize: 15,
      color: "#333",
      cursor: "pointer",
    }}
  >
    <span style={{ flex: 1 }}>{label}</span>
    {typeof count === "number" && (
      <span
        style={{
          background: "#ffe6cc",
          color: "#ff6666",
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

export default HomeSidebar;
