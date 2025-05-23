import React from "react";
import HomeAccordian from "./HomeAccordian";
import SideBarTitle from "./SideBarTitle";
import SidebarItem from "./SideBarItem";

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
        <SidebarItem t={t} label="CS_HOME_ORDERS" />
        <SidebarItem t={t} label="CS_HOME_PROCESS" />
        <SidebarItem t={t} label="CS_HOME_A_DAIRY" />
      </HomeAccordian>

      <SideBarTitle t={t} title="CS_HOME_BULK_RESCHEDULE" onClick={() => onTabChange("BULK_RESCHEDULE")} />
    </div>
  );
};

export default HomeSidebar;
