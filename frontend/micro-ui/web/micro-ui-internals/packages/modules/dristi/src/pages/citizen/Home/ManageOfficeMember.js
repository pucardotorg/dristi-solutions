import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { assignCasesConfig } from "./assignCasesConfig";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const ManageOfficeMember = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const member = location?.state?.member || {};
  const tenantId = window?.Digit?.ULBService?.getCurrentTenantId();

  const [allowCaseCreate, setAllowCaseCreate] = useState(member?.allowCaseCreate !== false ? "Yes" : "No");
  const [addToNewCasesAuto, setAddToNewCasesAuto] = useState(member?.addNewCasesAutomatically !== false ? "Yes" : "No");

  const memberName = member?.memberName || t("MANAGE_OFFICE_MEMBER_NAME_PLACEHOLDER") || "—";
  const designation = member?.memberType === "ADVOCATE_CLERK" ? (t("CLERK") || "Clerk") : member?.memberType === "ADVOCATE" ? (t("ADVOCATE") || "Advocate") : member?.memberType || "—";
  const mobileNumber = member?.memberMobileNumber ? `+91 ${(member.memberMobileNumber + "").replace(/\D/g, "").slice(0, 5)} ${(member.memberMobileNumber + "").replace(/\D/g, "").slice(5)}` : "—";

  const assignCasesConfigWithTenant = useMemo(() => assignCasesConfig(), []);

  const handleGoBack = () => {
    history.push(`/${window?.contextPath}/citizen/dristi/home/manage-office`);
  };

  const handleRemoveMember = () => {
    // TODO: wire remove member API
    handleGoBack();
  };

  const handleUpdateAccess = () => {
    // TODO: wire update access API
    handleGoBack();
  };

  return (
    <div className="manage-office-member-page">
      <h1 className="manage-office-member-title">{t("MANAGE_OFFICE_MEMBER") || "Manage Office Member"}</h1>

      <div className="manage-office-member-content-row">
        <div className="manage-office-member-details">
          <div className="manage-office-member-detail-item">
            <span className="manage-office-member-detail-label">{t("CS_NAME") || "Name"}</span>
            <span className="manage-office-member-detail-value">{memberName}</span>
          </div>
          <div className="manage-office-member-detail-item">
            <span className="manage-office-member-detail-label">{t("DESIGNATION") || "Designation"}</span>
            <span className="manage-office-member-detail-value">{designation}</span>
          </div>
          <div className="manage-office-member-detail-item">
            <span className="manage-office-member-detail-label">{t("MOBILE_NUMBER") || "Mobile number"}</span>
            <span className="manage-office-member-detail-value">{mobileNumber}</span>
          </div>
        </div>

        <div className="manage-office-member-options">
          <div className="manage-office-member-option">
            <label className="manage-office-member-option-label">{t("ALLOW_MEMBER_TO_FILE_NEW_CASES") || "Allow member to file new cases?"}</label>
            <select
              value={allowCaseCreate}
              onChange={(e) => setAllowCaseCreate(e.target.value)}
              className="manage-office-member-select"
            >
              <option value="Yes">{t("YES") || "Yes"}</option>
              <option value="No">{t("NO") || "No"}</option>
            </select>
          </div>
          <div className="manage-office-member-option">
            <label className="manage-office-member-option-label">{t("ADD_MEMBER_TO_NEW_CASES_AUTO") || "Add member to new cases automatically?"}</label>
            <select
              value={addToNewCasesAuto}
              onChange={(e) => setAddToNewCasesAuto(e.target.value)}
              className="manage-office-member-select"
            >
              <option value="Yes">{t("YES") || "Yes"}</option>
              <option value="No">{t("NO") || "No"}</option>
            </select>
          </div>
          <button type="button" onClick={handleRemoveMember} className="manage-office-member-remove-btn">
            {t("REMOVE_MEMBER") || "Remove Member"}
          </button>
        </div>
      </div>

      <div className="manage-office-member-info-banner">
        <span className="manage-office-member-info-icon" aria-hidden>ℹ</span>
        <span>
          {t("MANAGE_OFFICE_MEMBER_ACCESS_INFO") ||
            "The member will have complete access to all documents and details in the cases assigned to them. Please keep in mind the privacy and security of case data before sharing access."}
        </span>
      </div>

      <div className="assign-cases-section">
        <h2 className="assign-cases-section-title">{t(assignCasesConfigWithTenant?.label) || "Assign Cases"}</h2>
        <div className="inbox-search-wrapper manage-office-member-inbox">
          <InboxSearchComposer
            customStyle={sectionsParentStyle}
            configs={assignCasesConfigWithTenant}
            showTab={false}
          />
        </div>
      </div>

      <div className="manage-office-member-footer">
        <button type="button" onClick={handleGoBack} className="manage-office-btn manage-office-btn--secondary">
          {t("GO_BACK") || "Go Back"}
        </button>
        <button type="button" onClick={handleUpdateAccess} className="manage-office-btn manage-office-btn--primary">
          {t("UPDATE_ACCESS") || "Update Access"}
        </button>
      </div>
    </div>
  );
};

export default ManageOfficeMember;
