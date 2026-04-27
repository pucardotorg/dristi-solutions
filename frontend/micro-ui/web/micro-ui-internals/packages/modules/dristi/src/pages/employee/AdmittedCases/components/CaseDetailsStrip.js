import React from "react";

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

const CaseDetailsStrip = ({ 
  t, 
  caseDetails, 
  advocateName, 
  delayCondonationData, 
  isDelayApplicationCompleted, 
  isDelayApplicationPending 
}) => {
  return (
    <div className="admitted-case-details" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
      <div className="case-details-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {caseDetails?.cmpNumber && (
          <React.Fragment>
            <div className="sub-details-text">{caseDetails?.cmpNumber}</div>
            <hr className="vertical-line" />
          </React.Fragment>
        )}
        {caseDetails?.courtCaseNumber && caseDetails?.courtCaseNumber?.includes("ST/") && (
          <React.Fragment>
            <div className="sub-details-text">{caseDetails?.courtCaseNumber}</div>
            <hr className="vertical-line" />
          </React.Fragment>
        )}
        {caseDetails?.isLPRCase ? (
          <React.Fragment>
            <div className="sub-details-text">{caseDetails?.lprNumber}</div>
            <hr className="vertical-line" />
          </React.Fragment>
        ) : (
          caseDetails?.courtCaseNumber &&
          !caseDetails?.courtCaseNumber?.includes("ST/") && (
            <React.Fragment>
              <div className="sub-details-text">{caseDetails?.courtCaseNumber}</div>
              <hr className="vertical-line" />
            </React.Fragment>
          )
        )}
        {(caseDetails?.courtCaseNumber || caseDetails?.cmpNumber) && (
          <React.Fragment>
            {" "}
            <div className="sub-details-text">{t(caseDetails?.filingNumber)}</div> <hr className="vertical-line" />
          </React.Fragment>
        )}
        <div className="sub-details-text">{t(caseDetails?.substage)}</div>
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
