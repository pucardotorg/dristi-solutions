import { DateUtils } from "../../../../Utils";

// Helper function to get case info array for display
export const getCaseInfo = (caseDetails, caseCourtId, t) => {
  return [
    {
      key: "CASE_NUMBER",
      value: caseDetails?.filingNumber,
    },
    {
      key: "CASE_CATEGORY",
      value: caseDetails?.caseCategory,
    },
    {
      key: "CASE_TYPE",
      value: "NIA S138",
    },
    {
      key: "COURT_NAME",
      value: t(`COMMON_MASTERS_COURT_R00M_${caseCourtId}`),
    },
    {
      key: "SUBMITTED_ON",
      value: DateUtils.getFormattedDate(new Date(caseDetails?.filingDate)),
    },
  ];
};
