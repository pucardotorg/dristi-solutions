import React, { useMemo } from "react";
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
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const assignedRoles = useMemo(() => roles?.map((role) => role?.code), [roles]);
  const hasViewTodaysHearingsAccess = useMemo(() => assignedRoles?.includes("VIEW_TODAYS_HEARINGS"), [assignedRoles]);
  const hasViewScheduleHearingsAccess = useMemo(() => assignedRoles?.includes("VIEW_SCHEDULE_HEARING_HOME"), [assignedRoles]);
  const hasViewBulkRescheduleHearingsAccess = useMemo(() => assignedRoles?.includes("VIEW_BULK_RESCHEDULE_HEARINGS"), [assignedRoles]);
  const hasViewSignOrdersAccess = useMemo(() => assignedRoles?.includes("VIEW_SIGN_ORDERS"), [assignedRoles]);
  const hasViewSignProcessAccess = useMemo(
    () =>
      ["VIEW_PROCESS_SUMMONS", "VIEW_PROCESS_WARRANT", "VIEW_PROCESS_NOTICE", "VIEW_PROCESS_PROCLAMATION", "VIEW_PROCESS_ATTACHMENT"].some((role) =>
        assignedRoles?.includes(role)
      ),
    [assignedRoles]
  );
  const hasViewSignBailBondAccess = useMemo(() => assignedRoles?.includes("VIEW_SIGN_BAIL_BOND"), [assignedRoles]);
  const hasViewSignWitnessDepositionAccess = useMemo(() => assignedRoles?.includes("VIEW_WITNESS_DEPOSITION"), [assignedRoles]);
  const hasViewSignEvidenceAccess = useMemo(() => assignedRoles?.includes("VIEW_SIGN_EVIDENCE"), [assignedRoles]);
  const hasViewSignADiaryAccess = useMemo(() => assignedRoles?.includes("DIARY_VIEWER"), [assignedRoles]);
  const hasViewSignFormsAccess = useMemo(() => assignedRoles?.includes("VIEW_SIGN_FORMS"), [assignedRoles]);

  return (
    <div className="home-sidebar">
      <HomeHeader t={t} userInfo={userInfo} roles={roles} activeTab={activeTab} onTabChange={onTabChange} />
      {(hasViewTodaysHearingsAccess || hasViewBulkRescheduleHearingsAccess || hasViewScheduleHearingsAccess) && (
        <HomeAccordian title={t("HEARINGS_TAB")} defaultOpen>
          {hasViewTodaysHearingsAccess && (
            <SidebarItem
              t={t}
              label={"TOTAL_HEARINGS_TAB"}
              // count={hearingCount}
              active={activeTab === "TOTAL_HEARINGS_TAB"}
              onClick={() => onTabChange("TOTAL_HEARINGS_TAB")}
            />
          )}
          {hasViewScheduleHearingsAccess && (
            <SidebarItem
              t={t}
              label={"CS_HOME_SCHEDULE_HEARING"}
              active={activeTab === "CS_HOME_SCHEDULE_HEARING"}
              onClick={() => onTabChange("CS_HOME_SCHEDULE_HEARING")}
            />
          )}
          {hasViewBulkRescheduleHearingsAccess && (
            <SidebarItem
              t={t}
              label={"CS_HOME_BULK_RESCHEDULE"}
              // count={hearingCount}
              active={activeTab === "CS_HOME_BULK_RESCHEDULE"}
              onClick={() => onTabChange("CS_HOME_BULK_RESCHEDULE")}
            />
          )}
        </HomeAccordian>
      )}

      {Object?.keys(options)?.length > 0 && (
        <HomeAccordian title={t("PENDING_TASKS_TAB")} defaultOpen>
          {!isOptionsLoading &&
            Object?.keys(options)?.map((key, index) => {
              return (
                <SidebarItem
                  t={t}
                  key={index}
                  label={options[key]?.name}
                  count={pendingTaskCount[key]}
                  active={activeTab === key}
                  onClick={() => onTabChange("PENDING_TASKS_TAB", key)}
                />
              );
            })}
        </HomeAccordian>
      )}

      {Object?.keys(applicationOptions)?.length > 0 && (
        <HomeAccordian title={t("REVIEW_APPLICATIONS_TAB")} defaultOpen>
          {!isOptionsLoading &&
            Object?.keys(applicationOptions)?.map((key, index) => (
              <SidebarItem
                t={t}
                key={index}
                label={applicationOptions[key]?.name}
                count={pendingTaskCount[key]}
                active={activeTab === key}
                onClick={() => onTabChange("REVIEW_APPLICATIONS_TAB", key)}
              />
            ))}
        </HomeAccordian>
      )}

      {(hasViewSignOrdersAccess ||
        hasViewSignProcessAccess ||
        hasViewSignBailBondAccess ||
        hasViewSignWitnessDepositionAccess ||
        hasViewSignEvidenceAccess ||
        hasViewSignADiaryAccess) && (
        <HomeAccordian title={t("CS_HOME_SIGN")} defaultOpen>
          {hasViewSignFormsAccess && (
            <SidebarItem
              t={t}
              label="CS_HOME_SIGN_FORMS"
              active={activeTab === "CS_HOME_SIGN_FORMS"}
              onClick={() => onTabChange("CS_HOME_SIGN_FORMS")}
            />
          )}
          {hasViewSignOrdersAccess && (
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
          )}
          {hasViewSignProcessAccess && (
            <SidebarItem t={t} label="CS_HOME_PROCESS" active={activeTab === "CS_HOME_PROCESS"} onClick={() => onTabChange("CS_HOME_PROCESS")} />
          )}
          {hasViewSignBailBondAccess && (
            <SidebarItem
              t={t}
              label="BULK_BAIL_BOND_SIGN"
              active={activeTab === "BULK_BAIL_BOND_SIGN"}
              onClick={() => onTabChange("BULK_BAIL_BOND_SIGN")}
            />
          )}
          {hasViewSignWitnessDepositionAccess && (
            <SidebarItem
              t={t}
              label="BULK_WITNESS_DEPOSITION_SIGN"
              active={activeTab === "BULK_WITNESS_DEPOSITION_SIGN"}
              onClick={() => onTabChange("BULK_WITNESS_DEPOSITION_SIGN")}
            />
          )}
          {hasViewSignEvidenceAccess && (
            <SidebarItem
              t={t}
              label="BULK_EVIDENCE_SIGN"
              active={activeTab === "BULK_EVIDENCE_SIGN"}
              onClick={() => onTabChange("BULK_EVIDENCE_SIGN")}
            />
          )}
          {hasViewSignADiaryAccess && (
            <SidebarItem t={t} label="CS_HOME_A_DAIRY" active={activeTab === "CS_HOME_A_DAIRY"} onClick={() => onTabChange("CS_HOME_A_DAIRY")} />
          )}
        </HomeAccordian>
      )}
    </div>
  );
};

export default HomeSidebar;
