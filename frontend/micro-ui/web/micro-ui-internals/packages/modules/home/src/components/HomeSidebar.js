import React, { useState } from "react";
import HomeAccordian from "./HomeAccordian";
import SideBarTitle from "./SideBarTitle";
import SidebarItem from "./SideBarItem";
import BulkReschedule from "../../../hearings/src/pages/employee/BulkReschedule";
import { HomeService } from "../hooks/services";

const HomeSidebar = ({ t, onTabChange, activeTab, options, isOptionsLoading, hearingCount = 0, pendingTaskCount, showToast = () => {} }) => {
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

      <HomeAccordian title={t("PENDING_TASKS_TAB")} defaultOpen>
        {!isOptionsLoading &&
          Object.keys(options).map((key, index) => (
            <SidebarItem
              t={t}
              key={index}
              label={options[key].name}
              count={pendingTaskCount[key] || 0}
              active={activeTab === key}
              onClick={() => onTabChange("PENDING_TASKS_TAB", key)}
            />
          ))}
      </HomeAccordian>

      <HomeAccordian title={t("CS_HOME_SIGN")} defaultOpen>
        <SidebarItem
          t={t}
          label="CS_HOME_ORDERS"
          href={`/${window.contextPath}/employee/home/bulk-esign-order`}
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
              window.location.href = `/${window.contextPath}/employee/home/bulk-esign-order`;
            } else {
              showToast("error", t("NO_BULK_SIGN_ORDERS"), 5000);
            }
          }}
        />
        <SidebarItem t={t} label="CS_HOME_PROCESS" href={`/${window.contextPath}/employee/orders/Summons&Notice`} />
        <SidebarItem t={t} label="CS_HOME_A_DAIRY" href={`/${window.contextPath}/employee/home/dashboard/adiary`} />
        {/* <SidebarItem
          t={t}
          label="BULK_BAIL_BOND_SIGN"
          active={activeTab === "BULK_BAIL_BOND_SIGN"}
          onClick={() => onTabChange("BULK_BAIL_BOND_SIGN")}
        /> */}

        />
        <SidebarItem
          t={t}
          label="BULK_WITNESS_DEPOSITION_SIGN"
          active={activeTab === "BULK_WITNESS_DEPOSITION_SIGN"}
          onClick={() => onTabChange("BULK_WITNESS_DEPOSITION_SIGN")}
        />
        <SidebarItem t={t} label="BULK_EVIDENCE_SIGN" active={activeTab === "BULK_EVIDENCE_SIGN"} onClick={() => onTabChange("BULK_EVIDENCE_SIGN")} />
      </HomeAccordian>

      <SideBarTitle t={t} title="CS_HOME_BULK_RESCHEDULE" onClick={() => setStepper((prev) => prev + 1)} />

      <BulkReschedule stepper={stepper} setStepper={setStepper} selectedSlot={[]} />
    </div>
  );
};

export default HomeSidebar;
