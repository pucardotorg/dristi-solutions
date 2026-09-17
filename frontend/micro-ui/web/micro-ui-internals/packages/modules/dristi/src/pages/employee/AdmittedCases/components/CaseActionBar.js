import React from "react";
import { Button as ActionButton } from "@egovernments/digit-ui-components";
import { Menu } from "@egovernments/digit-ui-react-components";
import { CustomThreeDots, RightArrow } from "../../../../icons/svgIndex";
import Button from "../../../../components/Button";
import { DateUtils } from "../../../../Utils";

const CaseActionBar = ({
  t,
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
  caseDetails,
  showJoinCase,
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
}) => {
  return (
    <div className="make-submission-action" style={{ display: "flex", gap: 20, justifyContent: "space-between", alignItems: "center" }}>
      {(showMakeSubmission || isCitizen) && (
        <div className="evidence-header-wrapper">
          <div className="evidence-hearing-header" style={{ background: "transparent", padding: "0px" }}>
            <div className="evidence-actions" style={{ ...(isTabDisabled ? { pointerEvents: "none" } : {}) }}>
              {showMakeSubmission && (
                <React.Fragment>
                  <ActionButton
                    variation={"primary"}
                    label={t("CS_CASE_MAKE_FILINGS")}
                    icon={showMenu ? "ExpandLess" : "ExpandMore"}
                    isSuffix={true}
                    onClick={handleTakeAction}
                    className={"take-action-btn-class"}
                  ></ActionButton>
                  {showMenu && (
                    <Menu
                      t={t}
                      optionKey={"label"}
                      localeKeyPrefix={"CS_CASE"}
                      options={citizenActionOptions}
                      onSelect={(option) => handleCitizenAction(option)}
                    ></Menu>
                  )}
                </React.Fragment>
              )}

              <div
                onClick={() => {
                  setShowCitizenMenu((prev) => !prev);
                  if (showMenu) {
                    setShowMenu(false);
                  }
                }}
                style={{ cursor: "pointer", height: "40px" }}
              >
                <CustomThreeDots />
                {showCitizenMenu && (
                  <Menu
                    options={["MANAGE_CASE_ACCESS", "DOWNLOAD_CASE_FILE", "SHOW_TIMELINE"]}
                    t={t}
                    localeKeyPrefix={"CS_CASE"}
                    onSelect={(option) => {
                      if (option === "MANAGE_CASE_ACCESS") {
                        setShowJoinCase(true);
                        setShowCitizenMenu(false);
                      } else if (option === "DOWNLOAD_CASE_FILE") {
                        setShowDownloadCasePdfModal(true);
                      } else if (option === "SHOW_TIMELINE") {
                        setShowAllStagesModal(true);
                      }
                    }}
                  ></Menu>
                )}
                <JoinCaseHome
                  setShowJoinCase={setShowJoinCase}
                  showJoinCase={showJoinCase}
                  type={"external"}
                  data={{ caseDetails: caseDetails }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {showTakeAction && (
        <div className="judge-action-block" style={{ display: "flex", gap: "20px" }}>
          {
            <div className="evidence-header-wrapper">
              <div className="evidence-hearing-header" style={{ background: "transparent", padding: "0px" }}>
                <div className="evidence-actions" style={{ ...(isTabDisabled ? { pointerEvents: "none" } : {}) }}>
                  {currentInProgressHearing ? (
                    <React.Fragment>
                      <Button
                        variation={"outlined"}
                        label={t("CS_CASE_VIEW_CALENDAR")}
                        onButtonClick={() => handleEmployeeAction({ value: "VIEW_CALENDAR" })}
                        style={{ boxShadow: "none" }}
                      ></Button>
                      {!hasHearingPriorityView && userRoles?.includes("ORDER_CREATOR") && (
                        <Button
                          variation={"outlined"}
                          label={t("CS_CASE_GENERATE_ORDER")}
                          onButtonClick={() => handleEmployeeAction({ value: "GENERATE_ORDER" })}
                          style={{ boxShadow: "none" }}
                        ></Button>
                      )}
                      {hasHearingPriorityView && hasHearingEditAccess && (
                        <Button
                          variation={"outlined"}
                          label={t("CS_CASE_PASS_OVER")}
                          onButtonClick={() => handleEmployeeAction({ value: "PASS_OVER_START_NEXT_HEARING" })}
                          style={{
                            boxShadow: "none",
                            border: "1px solid rgb(187, 44, 47)",
                            color: "rgb(187, 44, 47)",
                          }}
                          isDisabled={apiCalled}
                        ></Button>
                      )}
                      {(hasHearingPriorityView || (isJudge && !hideNextHearingButton)) && hasHearingEditAccess && (
                        <Button
                          variation={"primary"}
                          isDisabled={apiCalled}
                          label={t(hasHearingPriorityView ? "CS_CASE_END_START_NEXT_HEARING" : "CS_CASE_NEXT_HEARING")}
                          subLabel={
                            hasHearingPriorityView
                              ? null
                              : `(${DateUtils.getFormattedDate(new Date(parseInt(homeNextHearingFilter?.homeFilterDate)))
                                  .split("-")
                                  .join("/")})`
                          }
                          children={hasHearingPriorityView ? null : <RightArrow />}
                          isSuffix={true}
                          onButtonClick={() =>
                            handleEmployeeAction({
                              value: hasHearingPriorityView ? "CS_CASE_END_START_NEXT_HEARING" : "NEXT_HEARING",
                            })
                          }
                          style={{
                            boxShadow: "none",
                            ...(hasHearingPriorityView ? { backgroundColor: "#007e7e", border: "none" } : {}),
                          }}
                          textStyles={{ fontSize: "16px", marginLeft: "10px" }}
                          subTextStyles={{ fontSize: "14px", marginLeft: "10px" }}
                        ></Button>
                      )}
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      {!hasHearingPriorityView && !hideNextHearingButton && (
                        <Button
                          variation={"primary"}
                          label={t("CS_CASE_NEXT_HEARING")}
                          subLabel={`(${DateUtils.getFormattedDate(new Date(parseInt(homeNextHearingFilter?.homeFilterDate)))
                            .split("-")
                            .join("/")})`}
                          children={<RightArrow />}
                          isSuffix={true}
                          onButtonClick={() =>
                            handleEmployeeAction({
                              value: "NEXT_HEARING",
                            })
                          }
                          style={{
                            boxShadow: "none",
                          }}
                          textStyles={{ fontSize: "16px", marginLeft: "10px" }}
                          subTextStyles={{ fontSize: "14px", marginLeft: "10px" }}
                        />
                      )}
                      <ActionButton
                        variation={"primary"}
                        label={t("TAKE_ACTION_LABEL")}
                        icon={showMenu ? "ExpandLess" : "ExpandMore"}
                        isSuffix={true}
                        onClick={handleTakeAction}
                        className={"take-action-btn-class"}
                      ></ActionButton>
                      {showMenu && (
                        <Menu
                          textStyles={{ cursor: "pointer" }}
                          options={allowedTakeActionOptions}
                          onSelect={(option) => handleSelect(option)}
                        ></Menu>
                      )}
                    </React.Fragment>
                  )}
                </div>
              </div>
            </div>
          }
          <div className="evidence-header-wrapper">
            <div className="evidence-hearing-header" style={{ background: "transparent", padding: "0px" }}>
              <div className="evidence-actions">
                <div
                  className="custom-icon-wrapper"
                  onClick={() => {
                    setShowOtherMenu((prev) => !prev);
                    setShowMenu(false);
                  }}
                >
                  <CustomThreeDots />
                  {showOtherMenu && (
                    <Menu
                      t={t}
                      localeKeyPrefix={"CS_CASE"}
                      options={allowedEmployeeActionOptions}
                      optionKey={"label"}
                      onSelect={handleEmployeeAction}
                    ></Menu>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseActionBar;
