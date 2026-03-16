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
  gap: "1rem",
};

const AccessTypeDropdown = ({ options = [], selected, onChange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (option) => {
    if (onChange) {
      onChange(option);
    }
    setOpen(false);
  };

  return (
    <div className="manage-office-member-access-type" ref={containerRef}>
      <button
        type="button"
        className={`manage-office-member-access-type__control${disabled ? " manage-office-member-access-type__control--disabled" : ""}`}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className="manage-office-member-access-type__value">{selected?.name || ""}</span>
        <span className="manage-office-member-access-type__arrow" aria-hidden="true">
          <AdvocateProfileChevronIcon />
        </span>
      </button>
      {open && (
        <div className="manage-office-member-access-type__menu">
          {options.map((option) => (
            <button
              key={option.code}
              type="button"
              className={`manage-office-member-access-type__option${
                option.code === selected?.code ? " manage-office-member-access-type__option--selected" : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ManageOfficeMember = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const member = location?.state?.member || {};
  const advocateInfo = location?.state?.advocateInfo || {};
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
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [showUpdateAccessModal, setShowUpdateAccessModal] = useState(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
  const [toast, setToast] = useState(null);

  // Auto-close toast after 5 seconds (same pattern as ManageOffice)
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const memberName = member?.memberName || t("MANAGE_OFFICE_MEMBER_NAME_PLACEHOLDER") || "—";
  const clerkLabel = (t("CLERK") || "Clerk").charAt(0).toUpperCase() + (t("CLERK") || "Clerk").slice(1).toLowerCase();
  const designation =
    member?.memberType === "ADVOCATE_CLERK"
      ? clerkLabel
      : member?.memberType === "ADVOCATE"
      ? t("ASSISTANT_ADVOCATE") || "Assistant Advocate"
      : member?.memberType || "—";
  const mobileNumber = member?.memberMobileNumber
    ? `+91 ${(member.memberMobileNumber + "").replace(/\D/g, "").slice(0, 5)} ${(member.memberMobileNumber + "").replace(/\D/g, "").slice(5)}`
    : "—";

  const assignCasesConfigWithTenant = useMemo(() => assignCasesConfig({ member, advocateInfo: effectiveAdvocateInfo }), [
    member,
    effectiveAdvocateInfo,
  ]);

  const accessTypeOptions = useMemo(
    () => [
      { code: "ALL_CASES", name: t("ALL_CASES") || "All Cases" },
      { code: "SPECIFIC_CASES", name: t("SPECIFIC_CASES") || "Specific Cases" },
    ],
    [t]
  );

  const yesNoOptions = useMemo(
    () => [
      { code: "Yes", name: t("YES") || "Yes" },
      { code: "No", name: t("NO") || "No" },
    ],
    [t]
  );

  const selectedAccessTypeOption = useMemo(() => accessTypeOptions.find((opt) => opt.code === accessType) || accessTypeOptions[0], [
    accessTypeOptions,
    accessType,
  ]);

  const selectedAllowCaseCreateOption = useMemo(
    () => yesNoOptions.find((opt) => opt.code === allowCaseCreate) || yesNoOptions[0],
    [yesNoOptions, allowCaseCreate]
  );

  const selectedAddToNewCasesOption = useMemo(
    () => yesNoOptions.find((opt) => opt.code === addToNewCasesAuto) || yesNoOptions[0],
    [yesNoOptions, addToNewCasesAuto]
  );

  // When access type is "All Cases", always keep "Add member to new cases" enabled and set to "Yes"
  useEffect(() => {
    if (accessType === "ALL_CASES" && addToNewCasesAuto !== "Yes") {
      setAddToNewCasesAuto("Yes");
    }
  }, [accessType, addToNewCasesAuto]);

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
      }, 300);
    });
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }
    return () => {
      clearTimeout(timeoutId);
      if (observerTimer) clearTimeout(observerTimer);
      observer.disconnect();
    };
  }, [syncSelectedCasesCount]);

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
      setToast({ label: t("REMOVE_MEMBER_ERROR") || "Failed to remove member. Please try again.", type: "error" });
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
        setToast({ label: t("MEMBER_REMOVED_SUCCESS") || "Member removed successfully", type: "success" });
        setShowRemoveMemberModal(false);
        handleGoBack();
      }
    } catch (error) {
      console.error("Error removing member:", error);
      setToast({ label: t("REMOVE_MEMBER_ERROR") || "Failed to remove member. Please try again.", type: "error" });
    } finally {
      setIsRemovingMember(false);
    }
  };

  const callUpdateMemberAccess = async (overrideAccessType, overrideAllowCaseCreate, overrideAddToNewCasesAuto) => {
    if (!member?.memberId || !effectiveAdvocateInfo?.advocateId) {
      setToast({ label: t("UPDATE_ACCESS_ERROR") || "Failed to update access. Please try again.", type: "error" });
      return false;
    }

    setIsUpdatingAccess(true);
    try {
      const effectiveAllowCaseCreate =
        typeof overrideAllowCaseCreate === "undefined" ? allowCaseCreate : overrideAllowCaseCreate;
      const effectiveAddToNewCasesAuto =
        typeof overrideAddToNewCasesAuto === "undefined" ? addToNewCasesAuto : overrideAddToNewCasesAuto;

      const allowCaseCreateFlag = effectiveAllowCaseCreate === "Yes";
      const addNewCasesAutomaticallyFlag = effectiveAddToNewCasesAuto === "Yes";
      const finalAccessType = overrideAccessType || accessType || member?.accessType || "ALL_CASES";

      const body = {
        updateMemberAccess: {
          tenantId,
          officeAdvocateId: effectiveAdvocateInfo?.advocateId,
          memberId: member?.memberId,
          addNewCasesAutomatically: addNewCasesAutomaticallyFlag,
          accessType: finalAccessType,
          allowCaseCreate: allowCaseCreateFlag,
        },
        pagination: {
          limit: 10,
          offSet: 0,
        },
      };

      const response = await window?.Digit?.DRISTIService?.customApiService("/advocate-office-management/v1/_updateMemberAccess", body, {
        tenantId,
      });

      if (response) {
        setToast({ label: t("UPDATE_ACCESS_SUCCESS") || "Access updated successfully", type: "success" });

        // Ensure future navigations (back/forward) see the updated accessType in location state
        const currentState = history.location?.state || {};
        history.replace(history.location?.pathname || window.location.pathname, {
          ...currentState,
          member: {
            ...(currentState.member || member),
            accessType: finalAccessType,
          },
        });

        setCasesRefreshKey((prev) => prev + 1);
        return true;
      }
    } catch (error) {
      console.error("Error updating member access:", error);
      setToast({ label: t("UPDATE_ACCESS_ERROR") || "Failed to update access. Please try again.", type: "error" });
      return false;
    } finally {
      setIsUpdatingAccess(false);
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
    const diff = getCaseSelectionDiff();
    const { addCaseIds, removeCaseIds } = diff;
    if (addCaseIds.length === 0 && removeCaseIds.length === 0) {
      setToast({
        label: t("NO_CASE_SELECTION") || "Please select at least one case to update access.",
        type: "error",
      });
      return;
    }
    setCaseSelectionDiff(diff);
    setShowUpdateAccessModal(true);
  };

  const handleCloseUpdateAccessModal = () => {
    setShowUpdateAccessModal(false);
    setCaseSelectionDiff({ addCaseIds: [], removeCaseIds: [] });
  };

  const handleConfirmUpdateAccess = async () => {
    if (!member?.memberId || !effectiveAdvocateInfo?.advocateId) {
      setToast({ label: t("UPDATE_ACCESS_ERROR") || "Failed to update access. Please try again.", type: "error" });
      return;
    }

    const { addCaseIds, removeCaseIds } = caseSelectionDiff || { addCaseIds: [], removeCaseIds: [] };
    if (addCaseIds.length === 0 && removeCaseIds.length === 0) {
      setToast({
        label: t("NO_CASE_SELECTION") || "Please select at least one case to update access.",
        type: "error",
      });
      setShowUpdateAccessModal(false);
      setCaseSelectionDiff({ addCaseIds: [], removeCaseIds: [] });
      return;
    }

    const userInfo = window?.Digit?.UserService?.getUser()?.info || {};
    const officeAdvocateName = member?.officeAdvocateName || userInfo?.name || "";

    setIsUpdatingAccess(true);
    try {
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
        pagination: {
          limit: 10,
          offSet: 0,
        },
      };

      const response = await window?.Digit?.DRISTIService?.customApiService("/advocate-office-management/v1/_processCaseMember", body, {
        tenantId,
      });

      if (response) {
        setToast({ label: t("UPDATE_ACCESS_SUCCESS") || "Access updated successfully", type: "success" });
        setShowUpdateAccessModal(false);

        // Reset the baseline selection so subsequent updates only consider
        // changes made after this successful update.
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

        // Re-sync header checkbox and selected count based on new baseline.
        syncSelectedCasesCount();
      }
    } catch (error) {
      console.error("Error processing case member:", error);
      setToast({ label: t("UPDATE_ACCESS_ERROR") || "Failed to update access. Please try again.", type: "error" });
    } finally {
      setIsUpdatingAccess(false);
    }

    // Previously used _updateMemberAccess (commented out):
    // const allowCaseCreateFlag = allowCaseCreate === "Yes";
    // const addNewCasesAutomaticallyFlag = addToNewCasesAuto === "Yes";
    // const accessType = assignmentStatus || member?.accessType || "ALL_CASES";
    // const response = await window?.Digit?.DRISTIService?.customApiService("/advocate-office-management/v1/_updateMemberAccess", { updateMemberAccess: { ... }, pagination }, { tenantId });
  };

  const handleAccessTypeChange = async (option) => {
    const newType = option?.code || "ALL_CASES";
    const enforcedAddToNewCases = newType === "ALL_CASES" ? "Yes" : addToNewCasesAuto;

    setAccessType(newType);
    if (newType === "ALL_CASES") {
      setAddToNewCasesAuto("Yes");
    }

    await callUpdateMemberAccess(newType, undefined, enforcedAddToNewCases);
  };

  const handleAllowCaseCreateChange = async (option) => {
    const prev = allowCaseCreate;
    const value = option?.code === "No" ? "No" : "Yes";
    setAllowCaseCreate(value);
    const success = await callUpdateMemberAccess(undefined, value, undefined);
    if (!success) {
      setAllowCaseCreate(prev);
    }
  };

  const handleAddToNewCasesAutoChange = async (option) => {
    if (accessType === "ALL_CASES") {
      return;
    }
    const prev = addToNewCasesAuto;
    const value = option?.code === "No" ? "No" : "Yes";
    setAddToNewCasesAuto(value);
    const success = await callUpdateMemberAccess(undefined, undefined, value);
    if (!success) {
      setAddToNewCasesAuto(prev);
    }
  };

  return (
    <div className="manage-office-member-page">
      <div className="manage-office-member-scrollable">
        <h1 className="manage-office-member-title">{t("MANAGE_OFFICE_MEMBER") || "Manage Office Member"}</h1>

        <div className="manage-office-member-content-row">
          <div className="manage-office-member-field">
            <span className="manage-office-member-field__label">{t("CS_NAME") || "Name"}</span>
            <span className="manage-office-member-field__value">{memberName}</span>
          </div>
          <div className="manage-office-member-field">
            <span className="manage-office-member-field__label">{t("DESIGNATION") || "Designation"}</span>
            <span className="manage-office-member-field__value">{designation}</span>
          </div>
          <div className="manage-office-member-field">
            <span className="manage-office-member-field__label">{t("MOBILE_NUMBER") || "Mobile number"}</span>
            <span className="manage-office-member-field__value">{mobileNumber}</span>
          </div>
          <div className="manage-office-member-field manage-office-member-field--wide">
            <span className="manage-office-member-field__label">{t("ACCESS_TYPE") || "Access Type"}</span>
            <AccessTypeDropdown options={accessTypeOptions} selected={selectedAccessTypeOption} onChange={handleAccessTypeChange} />
          </div>
          <div className="manage-office-member-field manage-office-member-field--wide">
            <span className="manage-office-member-field__label">{t("ALLOW_MEMBER_TO_FILE_NEW_CASES") || "Allow member to file new cases?"}</span>
            <AccessTypeDropdown
              options={yesNoOptions}
              selected={selectedAllowCaseCreateOption}
              onChange={handleAllowCaseCreateChange}
            />
          </div>
          <div className="manage-office-member-field manage-office-member-field--wide">
            <span className="manage-office-member-field__label">
              {t("ADD_MEMBER_TO_NEW_CASES_AUTO") || "Add member to new cases automatically?"}
            </span>
            <AccessTypeDropdown
              options={yesNoOptions}
              selected={selectedAddToNewCasesOption}
              onChange={handleAddToNewCasesAutoChange}
              disabled={accessType === "ALL_CASES"}
            />
          </div>
          <button type="button" onClick={handleRemoveMemberClick} className="manage-office-member-remove-btn">
            {t("REMOVE_MEMBER") || "Remove Member"}
          </button>
        </div>

        <div className="manage-office-member-info-banner">
          <span className="manage-office-member-info-icon" aria-hidden>
            <InfoCircleIcon />
          </span>
          <span>
            {t("MANAGE_OFFICE_MEMBER_ACCESS_INFO") ||
              "The member will have complete access to all documents and details in the cases assigned to them. Please keep in mind the privacy and security of case data before sharing access."}
          </span>
        </div>

        <div className="assign-cases-section">
          <h2 className="assign-cases-section-title">{t(assignCasesConfigWithTenant?.label) || "Assign Cases"}</h2>
          <div className={`inbox-search-wrapper manage-office-member-inbox${accessType === "ALL_CASES" ? " assign-cases-disabled" : ""}`}>
            <InboxSearchComposer key={casesRefreshKey} customStyle={sectionsParentStyle} configs={assignCasesConfigWithTenant} showTab={false} />
          </div>
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
                {selectedCasesCount} {selectedCasesCount === 1 ? t("CASE_SELECTED") || "case selected" : t("CASES_SELECTED") || "cases selected"}
              </span>
            </div>
          )}
        </div>
        <button type="button" onClick={handleGoBack} className="manage-office-btn manage-office-btn--secondary">
          {t("GO_BACK") || "Go Back"}
        </button>
        <button
          type="button"
          onClick={handleUpdateAccessClick}
          className={`manage-office-btn manage-office-btn--primary${accessType === "ALL_CASES" ? " manage-office-btn--disabled" : ""}`}
          disabled={accessType === "ALL_CASES"}
        >
          {t("UPDATE_ACCESS") || "Update Access"}
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
              <h2 className="manage-office-modal__title">{t("REMOVE_MEMBER") || "Remove Member"}</h2>
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
                  {t("CONFIRM_REMOVE_MEMBER_MESSAGE") || "Are you sure you want to remove this member from your office?"}
                </p>

                <div className="manage-office-modal__footer">
                  <button onClick={handleCloseRemoveModal} className="manage-office-btn manage-office-btn--secondary">
                    {t("CANCEL") || "Cancel"}
                  </button>
                  <button onClick={handleConfirmRemoveMember} className="manage-office-btn manage-office-btn--danger">
                    {t("REMOVE_MEMBER") || "Remove Member"}
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
              <h2 className="manage-office-modal__title">{t("SAVE_CHANGES") || "Save Changes"}</h2>
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
                  {t("UPDATE_ACCESS_CONFIRM_MESSAGE") || "The Advocate clerk’s access to cases will be modified as per changes."}
                </p>

                <div className="manage-office-modal__footer">
                  <button onClick={handleGoBack} className="manage-office-btn manage-office-btn--secondary">
                    {t("GO_BACK") || "Go Back"}
                  </button>
                  <button onClick={handleConfirmUpdateAccess} className="manage-office-btn manage-office-btn--primary">
                    {t("UPDATE_ACCESS") || "Update Access"}
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
