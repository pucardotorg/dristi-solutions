import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { InboxSearchComposer, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { InfoCircleIcon, AdvocateProfileChevronIcon, ManageOfficeCloseIcon } from "../../../icons/svgIndex";
import { assignCasesConfig } from "./assignCasesConfig";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "0.5rem",
};

const REDIRECT_DELAY_MS = 400;



const ManageOfficeMember = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const member = location?.state?.member || {};
  const advocateInfo = location?.state?.advocateInfo || {};
  const isNewMember = location?.state?.isNewMember || false;
  const tenantId = window?.Digit?.ULBService?.getCurrentTenantId();

  // Fallback advocateInfo when navigated directly or when advocateInfo.advocateId is missing (e.g. rare race from ManageOffice)
  const effectiveAdvocateInfo = useMemo(() => {
    const userInfo = window?.Digit?.UserService?.getUser()?.info;
    const officeAdvocateUserUuid = advocateInfo?.officeAdvocateUserUuid || userInfo?.uuid;
    const advocateId =
      advocateInfo?.advocateId != null ? advocateInfo.advocateId : member?.officeAdvocateId != null ? member.officeAdvocateId : member?.advocateId;
    if (officeAdvocateUserUuid && advocateId) {
      return { officeAdvocateUserUuid, advocateId };
    }
    return {
      officeAdvocateUserUuid,
      advocateId: advocateId || advocateInfo?.advocateId,
    };
  }, [advocateInfo, member?.officeAdvocateId, member?.advocateId]);

  const [allowCaseCreate, setAllowCaseCreate] = useState(member?.allowCaseCreate !== false ? "Yes" : "No");
  const [addToNewCasesAuto, setAddToNewCasesAuto] = useState(member?.addNewCasesAutomatically !== false ? "Yes" : "No");
  const [selectedCasesCount, setSelectedCasesCount] = useState(0);
  const [casesRefreshKey, setCasesRefreshKey] = useState(0);
  const [caseSelectionDiff, setCaseSelectionDiff] = useState({ addCaseIds: [], removeCaseIds: [] });
  const [accessType, setAccessType] = useState(member?.accessType || "ALL_CASES");
  const initialAccessType = useRef(member?.accessType || "ALL_CASES");
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [showUpdateAccessModal, setShowUpdateAccessModal] = useState(false);
  const [showAddMemberConfirmModal, setShowAddMemberConfirmModal] = useState(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
  const [toast, setToast] = useState(null);
  const redirectTimeoutRef = useRef(null);

  // Auto-close toast after 5 seconds (same pattern as ManageOffice)
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const memberName = member?.memberName || t("MANAGE_OFFICE_MEMBER_NAME_PLACEHOLDER");
  const clerkLabel = t("CLERK");
  const designation =
    member?.memberType === "ADVOCATE_CLERK"
      ? clerkLabel
      : member?.memberType === "ADVOCATE"
      ? t("ASSISTANT_ADVOCATE")
      : member?.memberType || "—";
  const mobileNumber = member?.memberMobileNumber
    ? `+91 ${(member.memberMobileNumber + "").replace(/\D/g, "").slice(0, 5)} ${(member.memberMobileNumber + "").replace(/\D/g, "").slice(5)}`
    : "—";
  const emailId = member?.memberEmail || "—";

  const assignCasesConfigWithTenant = useMemo(() => assignCasesConfig({ member, advocateInfo: effectiveAdvocateInfo }), [
    member,
    effectiveAdvocateInfo,
  ]);

  const yesNoOptions = useMemo(
    () => [
      { code: "Yes", name: t("YES") },
      { code: "No", name: t("NO") },
    ],
    [t]
  );

  const selectedAllowCaseCreateOption = useMemo(
    () => yesNoOptions.find((opt) => opt.code === allowCaseCreate) || yesNoOptions[0],
    [yesNoOptions, allowCaseCreate]
  );

  const selectedAddToNewCasesOption = useMemo(
    () => yesNoOptions.find((opt) => opt.code === addToNewCasesAuto) || yesNoOptions[0],
    [yesNoOptions, addToNewCasesAuto]
  );

  

  const syncSelectedCasesCount = React.useCallback(() => {
    const container = document.querySelector(".manage-office-member-inbox");
    if (!container) {
      setSelectedCasesCount(0);
      return;
    }

    const tbody = container.querySelector("tbody");
    const rowCheckboxes = tbody ? tbody.querySelectorAll('input[type="checkbox"][data-case-id]') : [];

    let checkedCount = 0;
    rowCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        checkedCount += 1;
      }
    });

    setSelectedCasesCount(checkedCount);

    // Sync header "Select All" checkbox state: checked only when all rows are selected
    const headerCheckbox = container.querySelector('input[type="checkbox"][data-header-checkbox="true"]');
    if (headerCheckbox) {
      const total = rowCheckboxes.length;
      headerCheckbox.checked = total > 0 && checkedCount === total;
    }
  }, []);

  // Select-all and row checkboxes for Assign Cases table (same pattern as sign process tab)
  useEffect(() => {
    let isHeaderControlledClick = false;
    const container = document.querySelector(".manage-office-member-inbox");

    const handleHeaderCheckboxClick = (e) => {
      e.stopPropagation();
      const headerCheckbox = e.target;
      const shouldBeChecked = headerCheckbox.checked;
      const tableBody = container?.querySelector("tbody");
      if (tableBody) {
        const allRows = tableBody.querySelectorAll("tr");
        const checkboxesToClick = [];
        allRows.forEach((row) => {
          const rowCheckbox = row.querySelector('input[type="checkbox"]');
          if (rowCheckbox && rowCheckbox.checked !== shouldBeChecked) {
            checkboxesToClick.push(rowCheckbox);
          }
        });
        if (checkboxesToClick.length > 0) {
          isHeaderControlledClick = true;
          checkboxesToClick.forEach((checkbox) => checkbox.click());
          setTimeout(() => {
            isHeaderControlledClick = false;
            syncSelectedCasesCount();
          }, 250);
        }
      }
    };

    const handleRowCheckboxClick = () => {
      if (!isHeaderControlledClick) {
        const headerCheckbox = container?.querySelector('input[type="checkbox"][data-header-checkbox="true"]');
        if (headerCheckbox && headerCheckbox.checked) {
          headerCheckbox.checked = false;
        }
      }
    };

    const injectHeaderCheckbox = () => {
      const tableHeaders = container?.querySelectorAll('th, [role="columnheader"]') || [];
      let selectHeader = null;
      for (let i = 0; i < tableHeaders.length; i++) {
        const header = tableHeaders[i];
        const headerText = header.textContent?.trim() || "";
        if (i === 0 || headerText === "" || headerText.toLowerCase().includes("select")) {
          selectHeader = header;
          break;
        }
      }
      if (selectHeader) {
        const existingCheckbox = selectHeader.querySelector('input[type="checkbox"]');
        if (!existingCheckbox) {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "custom-checkbox header-checkbox";
          checkbox.style.cssText = "cursor: pointer; width: 20px; height: 20px;";
          checkbox.setAttribute("data-header-checkbox", "true");
          checkbox.addEventListener("click", handleHeaderCheckboxClick);
          checkbox.addEventListener("change", syncSelectedCasesCount);
          selectHeader.innerHTML = "";
          selectHeader.appendChild(checkbox);
        } else if (!existingCheckbox.hasAttribute("data-header-checkbox")) {
          existingCheckbox.setAttribute("data-header-checkbox", "true");
          existingCheckbox.addEventListener("click", handleHeaderCheckboxClick);
          existingCheckbox.addEventListener("change", syncSelectedCasesCount);
        }
      }
    };

    const attachRowCheckboxHandlers = () => {
      const tableBody = container?.querySelector("tbody");
      if (tableBody) {
        tableBody.querySelectorAll("tr").forEach((row) => {
          const rowCheckbox = row.querySelector('input[type="checkbox"]');
          if (rowCheckbox && !rowCheckbox.hasAttribute("data-row-handler-attached")) {
            rowCheckbox.setAttribute("data-row-handler-attached", "true");
            rowCheckbox.addEventListener("click", handleRowCheckboxClick);
            rowCheckbox.addEventListener("change", syncSelectedCasesCount);
          }
        });
      }
    };

    const runSync = () => {
      injectHeaderCheckbox();
      attachRowCheckboxHandlers();
      syncSelectedCasesCount();
    };
    runSync();
    const timeoutId = setTimeout(runSync, 100);

    let observerTimer = null;
    const observer = new MutationObserver(() => {
      if (observerTimer) clearTimeout(observerTimer);
      observerTimer = setTimeout(() => {
        injectHeaderCheckbox();
        attachRowCheckboxHandlers();
        syncSelectedCasesCount();
      }, 10);
    });
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }
    return () => {
      clearTimeout(timeoutId);
      if (observerTimer) clearTimeout(observerTimer);
      observer.disconnect();
    };
  }, [syncSelectedCasesCount, accessType, casesRefreshKey]);

  const handleGoBack = () => {
    history.push(`/${window?.contextPath}/citizen/dristi/home/manage-office`);
  };

  const handleRemoveMemberClick = () => {
    setShowRemoveMemberModal(true);
  };

  const handleCloseRemoveModal = () => {
    setShowRemoveMemberModal(false);
  };

  const handleConfirmRemoveMember = async () => {
    if (!member?.id) {
      setToast({ label: t("REMOVE_MEMBER_ERROR"), type: "error" });
      return;
    }
    setIsRemovingMember(true);
    try {
      const leavePayload = {
        id: member?.id,
        tenantId: tenantId,
        officeAdvocateId: effectiveAdvocateInfo?.advocateId,
        memberType: member?.memberType,
        memberId: member?.memberId,
        memberUserUuid: member?.memberUserUuid,
        officeAdvocateUserUuid: member?.officeAdvocateUserUuid,
      };
      const response = await window?.Digit?.DRISTIService?.leaveOffice({ leaveOffice: leavePayload }, { tenantId });
      if (response) {
        setToast({ label: t("MEMBER_REMOVED_SUCCESS"), type: "success" });
        setShowRemoveMemberModal(false);
        handleGoBack();
      }
    } catch (error) {
      console.error("Error removing member:", error);
      setToast({ label: t("REMOVE_MEMBER_ERROR"), type: "error" });
    } finally {
      setIsRemovingMember(false);
    }
  };

  

  const getCaseSelectionDiff = () => {
    const container = document.querySelector(".manage-office-member-inbox");
    const tbody = container ? container.querySelector("tbody") : null;
    const addCaseIds = [];
    const removeCaseIds = [];

    if (tbody) {
      const rowCheckboxes = tbody.querySelectorAll('input[type="checkbox"][data-case-id]');
      rowCheckboxes.forEach((checkbox) => {
        const caseId = checkbox.getAttribute("data-case-id");
        if (!caseId) return;
        const initialActive = checkbox.getAttribute("data-initial-active") === "true";
        const currentlyChecked = checkbox.checked;
        if (!initialActive && currentlyChecked) {
          addCaseIds.push(caseId);
        } else if (initialActive && !currentlyChecked) {
          removeCaseIds.push(caseId);
        }
      });
    }

    return { addCaseIds, removeCaseIds };
  };

  const handleUpdateAccessClick = () => {
    let currentDiff = { addCaseIds: [], removeCaseIds: [] };
    if (accessType === "SPECIFIC_CASES") {
      currentDiff = getCaseSelectionDiff();
      setCaseSelectionDiff(currentDiff);
    } else {
      setCaseSelectionDiff(currentDiff);
    }

    if (isNewMember) {
      setShowAddMemberConfirmModal(true);
    } else {
      const accessTypeChanged = accessType !== initialAccessType.current;
      const hasCaseDiff = currentDiff.addCaseIds.length > 0 || currentDiff.removeCaseIds.length > 0;

      if (!accessTypeChanged && !hasCaseDiff) {
        setToast({ label: t("NO_CHANGES_TO_UPDATE"), type: "error" });
        return;
      }
      setShowUpdateAccessModal(true);
    }
  };

  const handleCloseUpdateAccessModal = () => {
    setShowUpdateAccessModal(false);
    setCaseSelectionDiff({ addCaseIds: [], removeCaseIds: [] });
  };

  const handleCloseAddMemberConfirmModal = () => {
    setShowAddMemberConfirmModal(false);
    setCaseSelectionDiff({ addCaseIds: [], removeCaseIds: [] });
  };

  const handleConfirmUpdateAccess = async (directDiff) => {
    if (!member?.memberId || !effectiveAdvocateInfo?.advocateId) {
      setToast({ label: t("UPDATE_ACCESS_ERROR"), type: "error" });
      return;
    }

    const diffToUse = (directDiff && !directDiff.nativeEvent) ? directDiff : caseSelectionDiff;
    const { addCaseIds = [], removeCaseIds = [] } = diffToUse || { addCaseIds: [], removeCaseIds: [] };

    const userInfo = window?.Digit?.UserService?.getUser()?.info || {};
    const officeAdvocateName = member?.officeAdvocateName || userInfo?.name || "";

    setIsUpdatingAccess(true);
    let newMemberId = null;
    try {
      if (isNewMember) {
        const response = await window?.Digit?.DRISTIService?.addOfficeMember(
          {
            addMember: {
              tenantId: tenantId,
              officeAdvocateId: effectiveAdvocateInfo?.advocateId,
              officeAdvocateName: officeAdvocateName,
              memberType: member?.memberType || "ADVOCATE_CLERK",
              memberId: member?.memberId,
              memberName: member?.memberName || memberName,
              memberMobileNumber: member?.memberMobileNumber,
              memberEmail: member?.memberEmail || "",
              accessType: accessType,
              allowCaseCreate: true,
              addNewCasesAutomatically: accessType === "ALL_CASES",
            },
          },
          { tenantId }
        );
        if (!response) {
          throw new Error("Add member failed");
        }
        
        newMemberId = response?.addMember?.id || response?.officeMembers?.[0]?.id || response?.members?.[0]?.id || response?.officeMember?.id || null;
        
        // Fallback search to find the ID if not cleanly available in standard DIGIT response wrapper keys
        if (!newMemberId) {
          try {
            const searchRes = await window?.Digit?.DRISTIService?.searchOfficeMember(
              {
                searchCriteria: {
                  tenantId,
                  officeAdvocateId: effectiveAdvocateInfo?.advocateId,
                  memberId: member?.memberId,
                }
              },
              { tenantId }
            );
            if (searchRes?.officeMembers?.length > 0) {
              const createdMemberRow = searchRes.officeMembers.find(m => m.memberId === member?.memberId && m.isActive !== false);
              if (createdMemberRow) {
                newMemberId = createdMemberRow.id;
              }
            }
          } catch (e) {
            console.error("Failed to fetch new member id after creation:", e);
          }
        }

      } else {
        const response = await window?.Digit?.DRISTIService?.customApiService("/advocate-office-management/v1/_updateMemberAccess", {
          updateMemberAccess: {
            tenantId,
            officeAdvocateId: effectiveAdvocateInfo?.advocateId,
            memberId: member?.memberId,
            addNewCasesAutomatically: accessType === "ALL_CASES",
            accessType: accessType,
            allowCaseCreate: true,
          },
          pagination: { limit: 10, offSet: 0 },
        }, { tenantId });
        if (!response) {
          throw new Error("Update access failed");
        }
      }

      // Process specific cases if needed
      if ((accessType === "SPECIFIC_CASES" && (addCaseIds.length > 0 || removeCaseIds.length > 0)) || (!isNewMember && (addCaseIds.length > 0 || removeCaseIds.length > 0))) {
        const body = {
          processCaseMember: {
            tenantId,
            memberUserUuid: member?.memberUserUuid,
            officeAdvocateUserUuid: effectiveAdvocateInfo?.officeAdvocateUserUuid,
            officeAdvocateId: effectiveAdvocateInfo?.advocateId,
            memberId: member?.memberId,
            officeAdvocateName,
            memberType: member?.memberType || "ADVOCATE",
            memberName: member?.memberName || memberName,
            addCaseIds,
            removeCaseIds,
          },
          pagination: { limit: 10, offSet: 0 },
        };
        await window?.Digit?.DRISTIService?.customApiService("/advocate-office-management/v1/_processCaseMember", body, { tenantId });
      }

      setToast({ label: isNewMember ? t("MEMBER_ADDED_SUCCESSFULLY") : t("UPDATE_ACCESS_SUCCESS"), type: "success" });
      setShowUpdateAccessModal(false);
      setShowAddMemberConfirmModal(false);
      initialAccessType.current = accessType;

      setCaseSelectionDiff({ addCaseIds: [], removeCaseIds: [] });
      const container = document.querySelector(".manage-office-member-inbox");
      if (container) {
        const tbody = container.querySelector("tbody");
        if (tbody) {
          const rowCheckboxes = tbody.querySelectorAll('input[type="checkbox"][data-case-id]');
          rowCheckboxes.forEach((checkbox) => {
            const currentlyChecked = checkbox.checked;
            checkbox.setAttribute("data-initial-active", currentlyChecked ? "true" : "false");
          });
        }
      }
      syncSelectedCasesCount();
      const currentState = history.location?.state || {};
      const newMemberData = {
        ...(currentState.member || member),
        accessType: accessType,
      };

      if (isNewMember && newMemberId) {
        newMemberData.id = newMemberId;
      }
      
      // If we just added a new member, the memberId wasn't previously available to the table.
      // The API addOfficeMember response theoretically returns the ID, but the component relies on 
      // the existing member.memberId being passed in. It may require setting the newly generated ID 
      // if it wasn't there before (or if it relies on individualId). Since `member.memberId` is mapped from the search response, 
      // it should already exist. Incrementing the key forces InboxSearchComposer to remount & fetch cases.
      setCasesRefreshKey((prev) => prev + 1);

      if (isNewMember) {
        // Let the success toast render briefly, then replace to avoid keeping create-flow in history stack.
        redirectTimeoutRef.current = window.setTimeout(() => {
          history.replace(`/${window?.contextPath}/citizen/dristi/home/manage-office`);
        }, REDIRECT_DELAY_MS);
        return;
      }

      history.replace(history.location?.pathname || window.location.pathname, {
        ...currentState,
        isNewMember: false,
        member: newMemberData,
      });
    } catch (error) {
      console.error("Error saving member access logic:", error);
      setToast({ label: isNewMember ? t("MEMBER_ADD_ERROR") : t("UPDATE_ACCESS_ERROR"), type: "error" });
    } finally {
      setIsUpdatingAccess(false);
    }
  };

  const handleAccessTypeChange = (option) => {
    const newType = option?.code || "ALL_CASES";
    setAccessType(newType);
    if (newType === "ALL_CASES") {
      setAddToNewCasesAuto("Yes");
    } else {
      setAddToNewCasesAuto("No");
    }
  };

  return (
    <div className="manage-office-member-page">
      <style>{`
        .manage-case-access-radio-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 24px;
          padding: 24px;
          background: #F7F5F3;
          border-radius: 4px;
          margin-bottom: 24px;
        }
        .manage-case-access-label {
          font-family: "Inter", sans-serif;
          font-weight: 400;
          font-size: 16px;
          line-height: 1.5em;
          color: #334155;
        }
        .manage-case-access-radio-group {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 5px 0;
        }
        .manage-case-access-radio {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: "Inter", sans-serif;
          font-weight: 400;
          font-size: 14px;
          line-height: 1.43em;
          color: #334155;
        }
        .manage-case-access-radio input[type="radio"] {
          appearance: none;
          -webkit-appearance: none;
          background-color: #fff;
          margin: 0;
          font: inherit;
          color: #007E7E;
          width: 16px;
          height: 16px;
          border: 1px solid #CBD5E1;
          border-radius: 50%;
          display: grid;
          place-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .manage-case-access-radio input[type="radio"]::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transform: scale(0);
          transition: 120ms transform ease-in-out;
          box-shadow: inset 1em 1em #007E7E;
          background-color: #007E7E;
        }
        .manage-case-access-radio input[type="radio"]:checked {
          border: 1px solid #007E7E;
        }
        .manage-case-access-radio input[type="radio"]:checked::before {
          transform: scale(1);
        }
        .manage-case-access-info-banner {
          margin-bottom: 16px;
        }
        .assign-cases-subtitle {
          font-family: "Roboto", sans-serif;
          font-weight: 700;
          font-size: 24px;
          color: #231f20;
          margin-top: 12px;
          margin-bottom: 16px;
        }
      `}</style>
      <div className="manage-office-member-scrollable">
        <h1 className="manage-office-member-title">{t("MANAGE_OFFICE_MEMBER")}</h1>

        <div className="manage-office-member-content-row">
          <div className="manage-office-member-field">
            <span className="manage-office-member-field__label">{t("CS_NAME")}</span>
            <span className="manage-office-member-field__value">{memberName}</span>
          </div>
          <div className="manage-office-member-field">
            <span className="manage-office-member-field__label">{t("DESIGNATION")}</span>
            <span className="manage-office-member-field__value">{designation}</span>
          </div>
          <div className="manage-office-member-field">
            <span className="manage-office-member-field__label">{t("MOBILE_NUMBER")}</span>
            <span className="manage-office-member-field__value">{mobileNumber}</span>
          </div>
          <div className="manage-office-member-field">
            <span className="manage-office-member-field__label">{t("EMAIL")}</span>
            <span className="manage-office-member-field__value">{emailId}</span>
          </div>
          
          {!isNewMember && (
            <button
              type="button"
              onClick={handleRemoveMemberClick}
              style={{
                backgroundColor: "#BB2C2F",
                color: "#FFFFFF",
                borderRadius: "6px",
                padding: "8px 24px",
                fontFamily: "Roboto",
                fontWeight: "700",
                fontSize: "16px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "40px",
                width: "fit-content",
                marginLeft: "auto",
                alignSelf: "center"
              }}
            >
              {t("REMOVE_MEMBER")}
            </button>
          )}
        </div>

        <div className="manage-office-member-info-banner">
          <span className="manage-office-member-info-icon" aria-hidden>
            <InfoCircleIcon />
          </span>
          <span>
            {t("MANAGE_OFFICE_MEMBER_ACCESS_INFO")}
          </span>
        </div>

        <div className="assign-cases-section">
          <h2 className="assign-cases-section-title">{t("MANAGE_CASE_ACCESS")}</h2>
          
          <div className="manage-case-access-radio-container">
            <span className="manage-case-access-label">{t("CASE_ACCESS_TYPE")}</span>
            <div className="manage-case-access-radio-group">
              <label className="manage-case-access-radio">
                <input 
                  type="radio" 
                  name="accessType" 
                  value="ALL_CASES"
                  checked={accessType === "ALL_CASES"}
                  onChange={() => handleAccessTypeChange({code: "ALL_CASES"})}
                />
                <span className="radio-label">{t("ALL_CASES")}</span>
              </label>
              <label className="manage-case-access-radio">
                <input 
                  type="radio" 
                  name="accessType" 
                  value="SPECIFIC_CASES"
                  checked={accessType === "SPECIFIC_CASES"}
                  onChange={() => handleAccessTypeChange({code: "SPECIFIC_CASES"})}
                />
                <span className="radio-label">{t("SPECIFIC_CASES")}</span>
              </label>
            </div>
          </div>

          {accessType === "ALL_CASES" && (
            <div className="manage-office-member-info-banner manage-case-access-info-banner">
              <span className="manage-office-member-info-icon" aria-hidden>
                <InfoCircleIcon />
              </span>
              <span>
                {t("MANAGE_CASE_ACCESS_INFO")}
              </span>
            </div>
          )}

          {accessType === "SPECIFIC_CASES" && (
            <div className={`inbox-search-wrapper manage-office-member-inbox`}>
              <h3 className="assign-cases-subtitle">
                {t(assignCasesConfigWithTenant?.label)}
              </h3>
              <InboxSearchComposer key={casesRefreshKey} customStyle={sectionsParentStyle} configs={assignCasesConfigWithTenant} showTab={false} />
            </div>
          )}
        </div>
      </div>

      <footer className="manage-office-member-footer">
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          {selectedCasesCount > 0 && (
            <div
              className="bulk-info-text assign-cases-selected-banner"
              style={{
                boxSizing: "border-box",
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 12,
                minWidth: 206,
                height: 40,
                whiteSpace: "nowrap",
                background: "#FFFFFF",
                border: "0.4px solid #E2E8F0",
                borderRadius: 4,
                color: "#0A0A0A",
                fontFamily: "Roboto, sans-serif",
                fontStyle: "normal",
                fontWeight: 400,
                fontSize: 16,
                lineHeight: "19px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block", flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10" stroke="#1D7AEA" strokeWidth="1.2" fill="#EFF6FF" />
                <path d="M12 10.5v6" stroke="#1D7AEA" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="12" cy="7.5" r="1" fill="#1D7AEA" />
              </svg>
              <span style={{ whiteSpace: "nowrap" }}>
                {selectedCasesCount} {selectedCasesCount === 1 ? t("CASE_SELECTED") : t("CASES_SELECTED")}
              </span>
            </div>
          )}
        </div>
        <button type="button" onClick={handleGoBack} className="manage-office-btn manage-office-btn--secondary">
          {t("GO_BACK")}
        </button>
        <button
          type="button"
          onClick={handleUpdateAccessClick}
          className={`manage-office-btn manage-office-btn--primary`}
        >
          {isNewMember ? (t("ADD_MEMBER")) : (t("UPDATE_ACCESS"))}
        </button>
      </footer>

      {/* Full-page loader when updating access type directly (not via modal) */}
      {isUpdatingAccess && !showUpdateAccessModal && (
        <div className="manage-office-modal-overlay">
          <div className="manage-office-modal-loader">
            <Loader />
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal - same as ManageOffice */}
      {showRemoveMemberModal && (
        <div className="manage-office-modal-overlay" onClick={handleCloseRemoveModal}>
          <div className="manage-office-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-office-modal__header">
              <h2 className="manage-office-modal__title">{t("REMOVE_MEMBER")}</h2>
              <button onClick={handleCloseRemoveModal} className="manage-office-modal__close">
                <ManageOfficeCloseIcon />
              </button>
            </div>

            {isRemovingMember ? (
              <div className="manage-office-modal-loader">
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                <p className="manage-office-remove-text">
                  {t("CONFIRM_REMOVE_MEMBER_MESSAGE")}
                </p>

                <div className="manage-office-modal__footer">
                  <button onClick={handleCloseRemoveModal} className="manage-office-btn manage-office-btn--secondary">
                    {t("CANCEL")}
                  </button>
                  <button onClick={handleConfirmRemoveMember} className="manage-office-btn manage-office-btn--danger">
                    {t("REMOVE_MEMBER")}
                  </button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {/* Update Access Confirmation Modal */}
      {showUpdateAccessModal && (
        <div className="manage-office-modal-overlay" onClick={handleCloseUpdateAccessModal}>
          <div className="manage-office-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-office-modal__header">
              <h2 className="manage-office-modal__title">{t("SAVE_CHANGES")}</h2>
              <button onClick={handleCloseUpdateAccessModal} className="manage-office-modal__close">
                <ManageOfficeCloseIcon />
              </button>
            </div>

            {isUpdatingAccess ? (
              <div className="manage-office-modal-loader">
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                <p className="manage-office-remove-text">
                  {t("UPDATE_ACCESS_CONFIRM_MESSAGE")}
                </p>

                <div className="manage-office-modal__footer">
                  <button onClick={handleGoBack} className="manage-office-btn manage-office-btn--secondary">
                    {t("GO_BACK")}
                  </button>
                  <button onClick={() => handleConfirmUpdateAccess()} className="manage-office-btn manage-office-btn--primary">
                    {t("UPDATE_ACCESS")}
                  </button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {/* Add Member Confirmation Modal */}
      {showAddMemberConfirmModal && (
        <div className="manage-office-modal-overlay" onClick={handleCloseAddMemberConfirmModal}>
          <div className="manage-office-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-office-modal__header">
              <h2 className="manage-office-modal__title">{t("ADD_MEMBER")}</h2>
              <button onClick={handleCloseAddMemberConfirmModal} className="manage-office-modal__close">
                <ManageOfficeCloseIcon />
              </button>
            </div>

            {isUpdatingAccess ? (
              <div className="manage-office-modal-loader">
                <Loader />
              </div>
            ) : (
              <React.Fragment>
                <p className="manage-office-remove-text">
                  {t("CONFIRM_ADD_MEMBER_MESSAGE")}
                </p>

                <div className="manage-office-modal__footer">
                  <button onClick={handleCloseAddMemberConfirmModal} className="manage-office-btn manage-office-btn--secondary">
                    {t("GO_BACK")}
                  </button>
                  <button onClick={() => handleConfirmUpdateAccess()} className="manage-office-btn manage-office-btn--primary">
                    {t("CONFIRM")}
                  </button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {toast && <Toast label={toast?.label} onClose={() => setToast(null)} error={toast?.type === "error"} isDleteBtn={true} />}
    </div>
  );
};

export default ManageOfficeMember;
