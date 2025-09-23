import React from "react";
import HomeAccordian from "./HomeAccordian";
import SidebarItem from "./SideBarItem";
import { HomeService } from "../hooks/services";
import HomeHeader from "./HomeHeader";

const HomeSidebar = ({
  t,
  onTabChange,
  activeTab,
  options,
  isOptionsLoading,
  applicationOptions,
  hearingCount = 0,
  pendingTaskCount,
  showToast = () => {},
}) => {
  return (
    <div className="home-sidebar">
      <HomeHeader t={t} />
      <HomeAccordian title={t("HEARINGS_TAB")} defaultOpen>
        <SidebarItem
          t={t}
          label={"TOTAL_HEARINGS_TAB"}
          // count={hearingCount}
          active={activeTab === "TOTAL_HEARINGS_TAB"}
          onClick={() => onTabChange("TOTAL_HEARINGS_TAB")}
        />
        <SidebarItem
          t={t}
          label={"CS_HOME_BULK_RESCHEDULE"}
          // count={hearingCount}
          active={activeTab === "CS_HOME_BULK_RESCHEDULE"}
          onClick={() => onTabChange("CS_HOME_BULK_RESCHEDULE")}
        />
      </HomeAccordian>

      <HomeAccordian title={t("PENDING_TASKS_TAB")} defaultOpen>
        {!isOptionsLoading &&
          Object.keys(options).map(
            (key, index) =>
              (key === "SCRUTINISE_CASES" || pendingTaskCount[key] > 0) && (
                <SidebarItem
                  t={t}
                  key={index}
                  label={options[key].name}
                  count={pendingTaskCount[key]}
                  active={activeTab === key}
                  onClick={() => onTabChange("PENDING_TASKS_TAB", key)}
                />
              )
          )}
      </HomeAccordian>

      <HomeAccordian title={t("REVIEW_APPLICATIONS_TAB")} defaultOpen>
        {!isOptionsLoading &&
          Object.keys(applicationOptions).map(
            (key, index) =>
              pendingTaskCount[key] > 0 && (
                <SidebarItem
                  t={t}
                  key={index}
                  label={applicationOptions[key].name}
                  count={pendingTaskCount[key]}
                  active={activeTab === key}
                  onClick={() => onTabChange("REVIEW_APPLICATIONS_TAB", key)}
                />
              )
          )}
      </HomeAccordian>

      <HomeAccordian title={t("CS_HOME_SIGN")} defaultOpen>
        <SidebarItem
          t={t}
          label="CS_HOME_ORDERS"
          active={activeTab === "CS_HOME_ORDERS"}
          onClick={async (e) => {
            e.preventDefault();
            let shouldProceed = true;
            const payload = {
              inbox: {
                processSearchCriteria: {
                  businessService: ["notification"],
                  moduleName: "Transformer service",
                  tenantId: Digit.ULBService.getCurrentTenantId(),
                },
                moduleSearchCriteria: {
                  entityType: "Order",
                  tenantId: Digit.ULBService.getCurrentTenantId(),
                  status: "PENDING_BULK_E-SIGN",
                  courtId: localStorage.getItem("courtId"),
                },
                tenantId: Digit.ULBService.getCurrentTenantId(),
                limit: 300,
                offset: 0,
              },
            };

            try {
              const res = await HomeService.InboxSearch(payload, { tenantId: "kl" });
              shouldProceed = res?.totalCount > 0;
            } catch (err) {
              showToast("error", t("ISSUE_IN_FETCHING"), 5000);
              shouldProceed = false;
              return;
            }
            if (shouldProceed) {
              onTabChange("CS_HOME_ORDERS");
            } else {
              showToast("error", t("NO_BULK_SIGN_ORDERS"), 5000);
            }
          }}
        />
        <SidebarItem t={t} label="CS_HOME_PROCESS" href={`/${window.contextPath}/employee/orders/Summons&Notice`} />
        <SidebarItem t={t} label="CS_HOME_A_DAIRY" active={activeTab === "CS_HOME_A_DAIRY"} onClick={() => onTabChange("CS_HOME_A_DAIRY")} />
        <SidebarItem
          t={t}
          label="BULK_BAIL_BOND_SIGN"
          active={activeTab === "BULK_BAIL_BOND_SIGN"}
          onClick={() => onTabChange("BULK_BAIL_BOND_SIGN")}
        />
        <SidebarItem
          t={t}
          label="BULK_WITNESS_DEPOSITION_SIGN"
          active={activeTab === "BULK_WITNESS_DEPOSITION_SIGN"}
          onClick={() => onTabChange("BULK_WITNESS_DEPOSITION_SIGN")}
        />
        <SidebarItem t={t} label="BULK_EVIDENCE_SIGN" active={activeTab === "BULK_EVIDENCE_SIGN"} onClick={() => onTabChange("BULK_EVIDENCE_SIGN")} />
      </HomeAccordian>
    </div>
  );
};

export default HomeSidebar;
