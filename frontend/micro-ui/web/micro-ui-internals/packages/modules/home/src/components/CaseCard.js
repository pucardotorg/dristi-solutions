import React from "react";
import { useTranslation } from "react-i18next";
import { DateUtils, isLPRCase } from "@egovernments/digit-ui-module-dristi/src/Utils";

const ScaleOfJusticeIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="30" y="4" width="4" height="52" rx="2" fill="#BBBBBD" />
    <rect x="16" y="4" width="32" height="4" rx="2" fill="#BBBBBD" />
    <line x1="32" y1="8" x2="12" y2="28" stroke="#BBBBBD" strokeWidth="2" />
    <ellipse cx="12" cy="32" rx="10" ry="4" fill="#D6D5D4" stroke="#BBBBBD" strokeWidth="1.5" />
    <line x1="32" y1="8" x2="52" y2="28" stroke="#BBBBBD" strokeWidth="2" />
    <ellipse cx="52" cy="32" rx="10" ry="4" fill="#D6D5D4" stroke="#BBBBBD" strokeWidth="1.5" />
    <rect x="22" y="54" width="20" height="4" rx="2" fill="#BBBBBD" />
  </svg>
);

function computePendency(filingDate) {
  if (!filingDate) return { days: null, bucket: "low" };
  const ms = new Date(filingDate).getTime();
  if (isNaN(ms)) return { days: null, bucket: "low" };
  const days = Math.floor((Date.now() - ms) / 86400000);
  return { days, bucket: days >= 180 ? "high" : days >= 30 ? "medium" : "low" };
}

const CaseCard = ({ caseItem, onClick }) => {
  const { t } = useTranslation();

  const { days, bucket } = computePendency(caseItem?.filingDate);

  const displayNumber =
    (isLPRCase(caseItem) ? caseItem?.lprNumber : caseItem?.courtCaseNumber) ||
    caseItem?.cmpNumber ||
    caseItem?.filingNumber ||
    "—";

  const caseTitle = caseItem?.caseTitle
    ? caseItem.caseTitle.trim().endsWith("vs")
      ? `${caseItem.caseTitle} _______`
      : caseItem.caseTitle
    : t("CASE_UNTITLED");

  const stageLabel = isLPRCase(caseItem) ? t("Long Pending Register") : t(caseItem?.stage || "") || "—";

  const secondaryStages = Array.isArray(caseItem?.secondaryStage)
    ? caseItem.secondaryStage.filter(Boolean).map((s) => t(s)).join(", ")
    : caseItem?.secondaryStage
    ? t(caseItem.secondaryStage)
    : null;

  const filingDateFormatted = caseItem?.filingDate
    ? DateUtils.getFormattedDate(new Date(caseItem.filingDate))
    : "—";

  return (
    <div
      className={`case-card case-card--${bucket}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="case-card__top-row">
        <span className="case-card__type-badge">NIA S138</span>
        {days !== null && (
          <span className={`case-card__pendency-badge case-card__pendency-badge--${bucket}`}>{days}d</span>
        )}
      </div>

      <div className="case-card__icon">
        <ScaleOfJusticeIcon />
      </div>

      <div className="case-card__title" title={caseTitle}>
        {caseTitle}
      </div>

      <div className="case-card__number">{displayNumber}</div>

      <div className="case-card__stage-row">
        <span className="case-card__stage">{stageLabel}</span>
        {secondaryStages && <span className="case-card__secondary-stage">&nbsp;· {secondaryStages}</span>}
      </div>

      <div className="case-card__date">
        <span className="case-card__date-label">{t("CS_FILING_DATE")}:&nbsp;</span>
        {filingDateFormatted}
      </div>
    </div>
  );
};

export default CaseCard;
