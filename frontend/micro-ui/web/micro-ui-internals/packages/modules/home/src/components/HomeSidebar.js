import React, { useState } from "react";
import HomeAccordian from "./HomeAccordian";
import SideBarTitle from "./SideBarTitle";
import SidebarItem from "./SideBarItem";
import BulkReschedule from "../../../hearings/src/pages/employee/BulkReschedule";

const HomeSidebar = ({ t, onTabChange, activeTab, options, isOptionsLoading, hearingCount = 0 }) => {
  const [stepper, setStepper] = useState(0);
  return (
    <div style={{ width: 280, background: "#fafbfc", borderRight: "1px solid #eee" }}>
      <SideBarTitle
        t={t}
        title="HEARINGS_TAB"
        count={hearingCount}
        onClick={() => onTabChange("HEARINGS_TAB")}
        active={activeTab === "HEARINGS_TAB"}
      />

      <HomeAccordian title={t("PENDING_TASKS_TAB")}>
        {!isOptionsLoading &&
          Object.keys(options).map((key, index) => (
            <SidebarItem
              t={t}
              key={index}
              label={options[key].name}
              count={options[key].count || 0}
              active={activeTab === options[key].name}
              onClick={() => onTabChange("PENDING_TASKS_TAB", key, options[key].func)}
            />
          ))}
      </HomeAccordian>

      <HomeAccordian title={t("CS_HOME_SIGN")}>
        <SidebarItem t={t} label="CS_HOME_ORDERS" onClick={() => window.open(`/${window.contextPath}/employee/home/bulk-esign-order`, "_blank")} />
        <SidebarItem t={t} label="CS_HOME_PROCESS" onClick={() => window.open(`/${window.contextPath}/employee/orders/Summons&Notice`, "_blank")} />
        <SidebarItem t={t} label="CS_HOME_A_DAIRY" onClick={() => window.open(`/${window.contextPath}/employee/home/dashboard/adiary`, "_blank")} />
      </HomeAccordian>

      <SideBarTitle t={t} title="CS_HOME_BULK_RESCHEDULE" onClick={() => setStepper((prev) => prev + 1)} />

      <BulkReschedule stepper={stepper} setStepper={setStepper} selectedSlot={[]} />
    </div>
  );
};

export default HomeSidebar;
