import React, { useState } from "react";
import HomeAccordian from "./HomeAccordian";
import SideBarTitle from "./SideBarTitle";
import SidebarItem from "./SideBarItem";
import BulkReschedule from "../../../hearings/src/pages/employee/BulkReschedule";

const HomeSidebar = ({ t, onTabChange, activeTab }) => {
  const { data: options, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "case",
    [{ name: "pendingTaskFilterText" }],
    {
      select: (data) => {
        return data?.case?.pendingTaskFilterText || [];
      },
    }
  );

  const [stepper, setStepper] = useState(0);

  return (
    <div style={{ width: 280, background: "#fafbfc", borderRight: "1px solid #eee", minHeight: "100vh" }}>
      <SideBarTitle
        t={t}
        title="HEARINGS_TAB"
        count={options?.length || 0}
        onClick={() => onTabChange("HEARINGS_TAB")}
        active={activeTab === "HEARINGS_TAB"}
      />

      <HomeAccordian title={t("PENDING_TASKS_TAB")} count={options?.length || 0}>
        {!isOptionsLoading &&
          options?.map((option, index) => (
            <SidebarItem
              t={t}
              key={index}
              label={option.name}
              count={option.count || 13}
              active={activeTab === option.name}
              onClick={() => onTabChange("PENDING_TASKS_TAB", option.name)}
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
