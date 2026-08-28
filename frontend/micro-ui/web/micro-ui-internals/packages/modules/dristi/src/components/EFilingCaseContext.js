import React, { useContext } from "react";

/**
 * Exposes the case object the e-filing pages are currently working against.
 *
 * The case returned by the case search is only up to date while the case is
 * DRAFT_IN_PROGRESS. In CASE_REASSIGNED nothing is persisted until the review step -
 * every page accumulates its edits into `errorCaseDetails` in EFilingCases instead - so
 * components that need details captured on the earlier pages must read the copy handed
 * down here rather than fetching the case themselves.
 */
export const EFilingCaseContext = React.createContext({ caseDetails: null });

export const useEFilingCase = () => useContext(EFilingCaseContext);

export default EFilingCaseContext;
