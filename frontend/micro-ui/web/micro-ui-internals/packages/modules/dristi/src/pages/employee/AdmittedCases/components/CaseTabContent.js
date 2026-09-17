import React, { Fragment } from "react";
import Button from "../../../../components/Button";
import ExtraComponent from "../ExtraComponent";
import CaseBundleView from "../CaseBundleView";

const CaseTabContent = ({
  t,
  config,
  caseRelatedData,
  setUpdateCounter,
  openDraftModal,
  openSubmissionViewModal,
  showMakeSubmission,
  userRoles,
  isCitizen,
  setShowAddWitnessModal,
  handleSelect,
  handleMakeSubmission,
  handleSubmitDocuments,
  tabData,
  activeTab,
  documentsInboxSearch,
  inboxComposer,
  showActionBar,
  viewActionBar,
  MemoCaseOverview,
  memoisedCaseComplaintTab,
  caseDetails,
  tenantId,
  filingNumber,
}) => {
  return (
    <Fragment>
      {config?.label !== "Overview" && (
        <ExtraComponent
          caseData={caseRelatedData}
          setUpdateCounter={setUpdateCounter}
          tab={config?.label}
          setOrderModal={openDraftModal}
          openSubmissionsViewModal={openSubmissionViewModal}
        />
      )}
      {config?.label !== "Overview" && config?.label !== "caseFileOverview" && config?.label !== "Complaint" && config?.label !== "History" && (
        <div style={{ width: "100%", background: "white", padding: "10px", display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <div style={{ fontWeight: 700, fontSize: "24px", lineHeight: "28.8px" }}>{t(`All_${config?.label?.toUpperCase()}_TABLE_HEADER`)}</div>
          {(showMakeSubmission || userRoles?.includes("ALLOW_ADD_WITNESS")) && config?.label === "Parties" && (
            <Button
              label={userRoles.includes("CITIZEN") ? t("ADD_NEW_WITNESS") : t("CS_CASE_ADD_WITNESS")}
              variation={"secondary"}
              onButtonClick={() => setShowAddWitnessModal(true)}
              style={{ marginRight: "30px" }}
            />
          )}
          {userRoles?.includes("ORDER_CREATOR") && config?.label === "Submissions" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <div
                onClick={() => handleSelect(t("MANDATORY_SUBMISSIONS_RESPONSES"))}
                style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}
              >
                {t("REQUEST_DOCUMENTS_LINK")}
              </div>
            </div>
          )}
          {isCitizen && config?.label === "Submissions" && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {showMakeSubmission && (
                <div
                  onClick={handleMakeSubmission}
                  style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}
                >
                  {t("MAKE_APPLICATION")}
                </div>
              )}

              {showMakeSubmission && (
                <div
                  onClick={handleSubmitDocuments}
                  style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}
                >
                  {t("SUBMIT_DOCUMENTS")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!tabData?.filter((tab) => tab.label === "Overview")?.[0]?.active && !tabData?.filter((tab) => tab.label === "Complaint")?.[0]?.active && (
        <div
          className={`inbox-search-wrapper orders-tab-inbox-wrapper`}
          style={{
            paddingBottom: tabData?.find((tab) => tab.label === "caseFileOverview")?.active ? "0px" : showActionBar ? "60px" : undefined,
          }}
        >
          {activeTab === "Documents" ? documentsInboxSearch : inboxComposer}
        </div>
      )}
      {tabData?.filter((tab) => tab.label === "Overview")?.[0]?.active && (
        <div className="case-overview-wrapper" style={{ ...(viewActionBar ? { marginBottom: "60px" } : {}) }}>
          {MemoCaseOverview}
        </div>
      )}
      {tabData?.filter((tab) => tab.label === "Complaint")?.[0]?.active && <div className="view-case-file-wrapper">{memoisedCaseComplaintTab}</div>}
      {tabData?.filter((tab) => tab.label === "caseFileOverview")?.[0]?.active && (
        <div
          className="view-case-file-new-wrapper"
          style={{
            ...(showActionBar && { paddingBottom: "60px" }),
          }}
        >
          <CaseBundleView caseDetails={caseDetails} tenantId={tenantId} filingNumber={filingNumber} />
        </div>
      )}
    </Fragment>
  );
};

export default CaseTabContent;
