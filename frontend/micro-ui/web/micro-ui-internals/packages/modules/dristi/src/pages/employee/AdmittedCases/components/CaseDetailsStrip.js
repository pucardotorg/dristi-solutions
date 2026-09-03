import React from "react";
import { isLPRCase } from "../../../../Utils";

const delayCondonationStylsMain = {
  padding: "6px 8px",
  borderRadius: "999px",
  backgroundColor: "#E9A7AA",
};

const delayCondonationTextStyle = {
  margin: "0px",
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "16.41px",
  color: "#231F20",
};

const highlightedNumberStyle = {
  fontWeight: 700,
  color: "black",
};

// Only one case number is highlighted in the strip. Highest priority available wins:
// LPR -> court case number (ST) -> CMP -> filing number.
const getHighlightedNumberType = (caseDetails) => {
  if (isLPRCase(caseDetails) && caseDetails?.lprNumber) return "LPR";
  if (caseDetails?.courtCaseNumber) return "COURT_CASE";
  if (caseDetails?.cmpNumber) return "CMP";
  return "FILING";
};

const CaseDetailsStrip = ({ t, caseDetails, advocateName, delayCondonationData, isDelayApplicationCompleted, isDelayApplicationPending }) => {
  const highlightedNumberType = getHighlightedNumberType(caseDetails);
  return (
    <div className="admitted-case-details" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
      <div className="case-details-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {caseDetails?.cmpNumber && (
          <React.Fragment>
            <div className="sub-details-text" style={highlightedNumberType === "CMP" ? highlightedNumberStyle : {}}>
              {caseDetails?.cmpNumber}
            </div>
            <hr className="vertical-line" />
          </React.Fragment>
        )}
        {caseDetails?.courtCaseNumber && caseDetails?.courtCaseNumber?.includes("ST/") && (
          <React.Fragment>
            <div className="sub-details-text" style={highlightedNumberType === "COURT_CASE" ? highlightedNumberStyle : {}}>
              {caseDetails?.courtCaseNumber}
            </div>
            <hr className="vertical-line" />
          </React.Fragment>
        )}
        {isLPRCase(caseDetails) ? (
          <React.Fragment>
            <div className="sub-details-text" style={highlightedNumberType === "LPR" ? highlightedNumberStyle : {}}>
              {caseDetails?.lprNumber}
            </div>
            <hr className="vertical-line" />
          </React.Fragment>
        ) : (
          caseDetails?.courtCaseNumber &&
          !caseDetails?.courtCaseNumber?.includes("ST/") && (
            <React.Fragment>
              <div className="sub-details-text" style={highlightedNumberType === "COURT_CASE" ? highlightedNumberStyle : {}}>
                {caseDetails?.courtCaseNumber}
              </div>
              <hr className="vertical-line" />
            </React.Fragment>
          )
        )}
        {(caseDetails?.courtCaseNumber || caseDetails?.cmpNumber) && (
          <React.Fragment>
            {" "}
            <div className="sub-details-text" style={highlightedNumberType === "FILING" ? highlightedNumberStyle : {}}>
              {t(caseDetails?.filingNumber)}
            </div>{" "}
            <hr className="vertical-line" />
          </React.Fragment>
        )}
        <div className="sub-details-text">Stage: {isLPRCase(caseDetails) ? t("CS_LPR") : t(caseDetails?.stage)}</div>
        {(Array.isArray(caseDetails?.secondaryStage) ? caseDetails?.secondaryStage?.length > 0 : caseDetails?.secondaryStage) && (
          <React.Fragment>
            <hr className="vertical-line" />
            <div className="sub-details-text">
              Secondary Stage:{" "}
              {(Array.isArray(caseDetails?.secondaryStage) ? caseDetails?.secondaryStage : [caseDetails?.secondaryStage]).map((stage, index) => (
                <React.Fragment key={`${stage}-${index}`}>
                  {index > 0 ? ", " : ""}
                  {t(stage)}
                </React.Fragment>
              ))}
            </div>
          </React.Fragment>
        )}
        {caseDetails?.outcome && (
          <React.Fragment>
            <hr className="vertical-line" />
            <div className="sub-details-text">{t(caseDetails?.outcome)}</div>
          </React.Fragment>
        )}
        <hr className="vertical-line" />
        <div className="sub-details-text">Code: {caseDetails?.accessCode}</div>
        <hr className="vertical-line" />
        {advocateName && <div className="sub-details-text">{advocateName}</div>}
        {delayCondonationData?.delayCondonationType?.code === "NO" && !isDelayApplicationCompleted && (
          <div className="delay-condonation-chip" style={delayCondonationStylsMain}>
            <p style={delayCondonationTextStyle}>
              {(delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" &&
                ["PENDING_REGISTRATION", "UNDER_SCRUTINY", "PENDING_PAYMENT"]?.includes(caseDetails?.status)) ||
              (delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" && isDelayApplicationPending) ||
              isDelayApplicationPending
                ? t("DELAY_CONDONATION_FILED")
                : t("DELAY_CONDONATION_NOT_FILED")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDetailsStrip;
