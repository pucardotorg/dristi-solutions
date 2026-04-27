import React from "react";
import { Header, Loader } from "@egovernments/digit-ui-react-components";
import CaseActionBar from "./CaseActionBar";
import CaseDetailsStrip from "./CaseDetailsStrip";

const CaseHeader = ({
  t,
  caseApiLoading,
  isCaseFetching,
  caseDetails,
  showJoinCase,
  showMakeSubmission,
  isCitizen,
  showTakeAction,
  isTabDisabled,
  showMenu,
  showCitizenMenu,
  showOtherMenu,
  citizenActionOptions,
  allowedTakeActionOptions,
  allowedEmployeeActionOptions,
  currentInProgressHearing,
  hasHearingPriorityView,
  hasHearingEditAccess,
  userRoles,
  isJudge,
  hideNextHearingButton,
  apiCalled,
  homeNextHearingFilter,
  JoinCaseHome,
  advocateName,
  delayCondonationData,
  isDelayApplicationCompleted,
  isDelayApplicationPending,
  hasAnyRelevantOrderType,
  tabData,
  handleTakeAction,
  handleCitizenAction,
  handleEmployeeAction,
  handleSelect,
  setShowCitizenMenu,
  setShowMenu,
  setShowJoinCase,
  setShowDownloadCasePdfModal,
  setShowAllStagesModal,
  setShowOtherMenu,
  onTabChange,
  handleAllNoticeGeneratedForHearing,
}) => {
  return (
    <div
      className="admitted-case-header"
      style={{ position: showJoinCase ? "" : "", top: "72px", width: "100%", zIndex: 150, background: "white", gap: "0px" }}
    >
      <div className="admitted-case-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {caseApiLoading || isCaseFetching ? (
          <Loader />
        ) : caseDetails?.caseTitle ? (
          <Header styles={{ marginBottom: "0px" }}>{caseDetails?.caseTitle}</Header>
        ) : null}
        <CaseActionBar
          t={t}
          showMakeSubmission={showMakeSubmission}
          isCitizen={isCitizen}
          showTakeAction={showTakeAction}
          isTabDisabled={isTabDisabled}
          showMenu={showMenu}
          showCitizenMenu={showCitizenMenu}
          showOtherMenu={showOtherMenu}
          citizenActionOptions={citizenActionOptions}
          allowedTakeActionOptions={allowedTakeActionOptions}
          allowedEmployeeActionOptions={allowedEmployeeActionOptions}
          currentInProgressHearing={currentInProgressHearing}
          hasHearingPriorityView={hasHearingPriorityView}
          hasHearingEditAccess={hasHearingEditAccess}
          userRoles={userRoles}
          isJudge={isJudge}
          hideNextHearingButton={hideNextHearingButton}
          apiCalled={apiCalled}
          homeNextHearingFilter={homeNextHearingFilter}
          JoinCaseHome={JoinCaseHome}
          caseDetails={caseDetails}
          showJoinCase={showJoinCase}
          handleTakeAction={handleTakeAction}
          handleCitizenAction={handleCitizenAction}
          handleEmployeeAction={handleEmployeeAction}
          handleSelect={handleSelect}
          setShowCitizenMenu={setShowCitizenMenu}
          setShowMenu={setShowMenu}
          setShowJoinCase={setShowJoinCase}
          setShowDownloadCasePdfModal={setShowDownloadCasePdfModal}
          setShowAllStagesModal={setShowAllStagesModal}
          setShowOtherMenu={setShowOtherMenu}
        />
      </div>
      <CaseDetailsStrip
        t={t}
        caseDetails={caseDetails}
        advocateName={advocateName}
        delayCondonationData={delayCondonationData}
        isDelayApplicationCompleted={isDelayApplicationCompleted}
        isDelayApplicationPending={isDelayApplicationPending}
      />
      {hasAnyRelevantOrderType && isCitizen && (
        <div
          style={{
            backgroundColor: "#FFF6EA",
            padding: "8px 12px",
            borderRadius: "4px",
            display: "inline-block",
            fontSize: "14px",
            color: "#333",
            marginTop: "24px",
          }}
        >
          {t("VIEW_NOTICE_SUMMONS")}{" "}
          <span
            style={{
              color: "#007F80",
              fontWeight: "600",
              cursor: "pointer",
            }}
            className="click-here"
            onClick={handleAllNoticeGeneratedForHearing}
          >
            {t("NOTICE_CLICK_HERE")}
          </span>
        </div>
      )}
      <div className="search-tabs-container" style={{ marginTop: "24px" }}>
        <div>
          {tabData?.map((i, num) => (
            <button
              key={num}
              className={i?.active === true ? "search-tab-head-selected" : "search-tab-head"}
              onClick={() => {
                onTabChange(num, i);
              }}
              style={{ fontSize: "18px" }}
              disabled={["Complaint", "Overview"].includes(i?.label) ? false : isTabDisabled}
            >
              {t(i?.displayLabel)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaseHeader;
