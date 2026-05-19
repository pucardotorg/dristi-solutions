/** Shared pending-task action builders for HomeConfig.js */

export const filingNumberParam = { key: "filingNumber", value: "filingNumber" };
export const caseIdParam = { key: "caseId", value: "id" };
export const applicationNumberParam = { key: "applicationNumber", value: "referenceId" };
export const orderNumberParam = { key: "orderNumber", value: "referenceId" };
export const referenceIdParam = { key: "referenceId", value: "referenceId" };
export const taskNumberParam = { key: "taskNumber", value: "referenceId" };

export const buildRedirectDetails = (url, params = []) => ({
  url,
  params,
});

export const buildPendingTaskAction = ({ actorName, actionName, redirectDetails, customFunction, additionalDetailsKeys }) => {
  const action = { actorName, actionName };
  if (redirectDetails) {
    action.redirectDetails = redirectDetails;
  }
  if (customFunction) {
    action.customFunction = customFunction;
  }
  if (additionalDetailsKeys) {
    action.additionalDetailsKeys = additionalDetailsKeys;
  }
  return action;
};

export const signComplaintRedirect = buildRedirectDetails("/dristi/home/file-case/sign-complaint", [filingNumberParam, caseIdParam]);

export const viewCaseRedirect = buildRedirectDetails("/dristi/home/view-case", [filingNumberParam, caseIdParam]);

export const fileCaseRedirect = buildRedirectDetails("/dristi/home/file-case/case", [caseIdParam]);

export const efilingPaymentBreakdownRedirect = buildRedirectDetails("/home/home-pending-task/e-filing-payment-breakdown");

export const generateOrderFilingRedirect = buildRedirectDetails("/orders/generate-order", [filingNumberParam]);

export const submissionsCreateApplicationRedirect = buildRedirectDetails("/submissions/submissions-create", [
  filingNumberParam,
  applicationNumberParam,
]);

export const submissionsCreateOrderRedirect = buildRedirectDetails("/submissions/submissions-create", [
  filingNumberParam,
  orderNumberParam,
]);

export const scheduleHearingRedirect = buildRedirectDetails("/home/home-pending-task/home-schedule-hearing", [filingNumberParam]);

export const scheduleHearingOptOutRedirect = buildRedirectDetails("/home/home-pending-task/home-schedule-hearing", [
  filingNumberParam,
  { key: "status", defaultValue: "OPTOUT" },
]);

export const admissionRedirect = buildRedirectDetails("/dristi/admission", [filingNumberParam, caseIdParam]);

export const litigantAdvocate = ["LITIGANT/ADVOCATE"];
export const judgeActor = ["JUDGE"];
export const fsoActor = ["FSO"];

export const buildSignComplaintPendingAction = (actionName = "E-Sign Pending") =>
  buildPendingTaskAction({
    actorName: litigantAdvocate,
    actionName,
    redirectDetails: signComplaintRedirect,
  });

export const buildSubmissionsCreateApplicationAction = ({
  actorName = litigantAdvocate,
  actionName,
  customFunction,
}) =>
  buildPendingTaskAction({
    actorName,
    actionName,
    redirectDetails: submissionsCreateApplicationRedirect,
    customFunction,
  });

export const buildSubmissionsCreateOrderAction = ({ actorName = litigantAdvocate, actionName, customFunction }) =>
  buildPendingTaskAction({
    actorName,
    actionName,
    redirectDetails: submissionsCreateOrderRedirect,
    customFunction,
  });

export const buildPaymentPendingModalAction = (url, actionName = "Show Summon-Warrant Status") =>
  buildPendingTaskAction({
    actorName: judgeActor,
    actionName,
    redirectDetails: buildRedirectDetails(url, [filingNumberParam, taskNumberParam]),
  });

export const buildMakePaymentPendingAction = (actionName = "Make Payment") =>
  buildPendingTaskAction({
    actorName: litigantAdvocate,
    actionName,
    redirectDetails: efilingPaymentBreakdownRedirect,
  });

export const buildViewCasePendingAction = (actionName) =>
  buildPendingTaskAction({
    actorName: judgeActor,
    actionName,
    redirectDetails: viewCaseRedirect,
  });

export const buildAdmissionPendingAction = (actionName) =>
  buildPendingTaskAction({
    actorName: judgeActor,
    actionName,
    redirectDetails: admissionRedirect,
  });

export const buildScheduleHearingPendingAction = (actionName, actorName = judgeActor, redirectDetails = scheduleHearingRedirect) =>
  buildPendingTaskAction({
    actorName,
    actionName,
    redirectDetails,
  });

export const buildGenerateOrderPendingAction = ({ actionName, customFunction, additionalDetailsKeys, params }) =>
  buildPendingTaskAction({
    actorName: judgeActor,
    actionName,
    customFunction,
    additionalDetailsKeys,
    redirectDetails: buildRedirectDetails("/orders/generate-order", params || [filingNumberParam]),
  });

export const underScrutinyRedirect = buildRedirectDetails("/dristi/case", [caseIdParam]);

export const buildUnderScrutinyPendingAction = () =>
  buildPendingTaskAction({
    actorName: fsoActor,
    actionName: "Case Filed and ready for FSO to review",
    redirectDetails: underScrutinyRedirect,
  });

export const buildCaseSentBackPendingAction = () =>
  buildPendingTaskAction({
    actorName: litigantAdvocate,
    actionName: "Case Sent Back for Edit",
    redirectDetails: fileCaseRedirect,
  });

export const buildVoluntarySubmissionCreateAction = ({ actionName, applicationTypeDefault }) =>
  buildPendingTaskAction({
    actorName: litigantAdvocate,
    actionName,
    redirectDetails: buildRedirectDetails("/submissions/submissions-create", [
      filingNumberParam,
      { key: "applicationType", defaultValue: applicationTypeDefault },
    ]),
  });
