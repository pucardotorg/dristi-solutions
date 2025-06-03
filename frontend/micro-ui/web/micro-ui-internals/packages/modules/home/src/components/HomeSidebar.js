import React, { useState } from "react";
import HomeAccordian from "./HomeAccordian";
import SideBarTitle from "./SideBarTitle";
import SidebarItem from "./SideBarItem";
import BulkReschedule from "../../../hearings/src/pages/employee/BulkReschedule";

const HomeSidebar = ({ t, onTabChange, activeTab, options, isOptionsLoading, hearingCount = 0, pendingTaskCount }) => {
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
              count={pendingTaskCount[key] || 0}
              active={activeTab === key}
              onClick={() => onTabChange("PENDING_TASKS_TAB", key, options[key].func)}
            />
          ))}
      </HomeAccordian>

      <HomeAccordian title={t("CS_HOME_SIGN")} defaultOpen>
        <SidebarItem t={t} label="CS_HOME_ORDERS" href={`/${window.contextPath}/employee/home/bulk-esign-order`} />
        <SidebarItem t={t} label="CS_HOME_PROCESS" href={`/${window.contextPath}/employee/orders/Summons&Notice`} />
        <SidebarItem t={t} label="CS_HOME_A_DAIRY" href={`/${window.contextPath}/employee/home/dashboard/adiary`} />
      </HomeAccordian>

      <SideBarTitle t={t} title="CS_HOME_BULK_RESCHEDULE" onClick={() => setStepper((prev) => prev + 1)} />

      <BulkReschedule stepper={stepper} setStepper={setStepper} selectedSlot={[]} />
    </div>
  );
};

export default HomeSidebar;
