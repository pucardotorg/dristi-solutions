import React from "react";
import { FactCheckIcon } from "../icons/svgIndex";
import { SubmissionWorkflowState } from "../Utils/submissionWorkflow";
import { DateUtils } from "../Utils";

export const OwnerColumn = ({ rowData, colData, value = "", showAsHeading = false, t }) => {
  const userInfo = Digit.UserService.getUser()?.info;
  const userRoles = userInfo?.roles?.map((role) => role.code);
  const { getFormattedDate } = DateUtils;

  const defaultObj = {
    status: rowData?.status,
    details: {
      applicationType: rowData?.applicationType,
      applicationSentOn: getFormattedDate(parseInt(rowData?.auditDetails?.createdTime)),
      sender: rowData?.owner,
      additionalDetails: rowData?.additionalDetails,
      applicationId: rowData?.id,
      auditDetails: rowData?.auditDetails,
      referenceId: rowData?.referenceId,
    },
    applicationContent: null,
    comments: rowData?.comment || [],
    applicationList: rowData,
  };
  const docObj = rowData?.documents?.map((doc) => {
    return {
      status: rowData?.status,
      details: {
        applicationType: rowData?.applicationType,
        applicationSentOn: getFormattedDate(parseInt(rowData?.auditDetails?.createdTime)),
        sender: rowData?.owner,
        additionalDetails: rowData?.additionalDetails,
        applicationId: rowData?.id,
        auditDetails: rowData?.auditDetails,
        referenceId: rowData?.referenceId,
      },
      applicationContent: {
        tenantId: rowData?.tenantId,
        fileStoreId: doc.fileStore,
        id: doc.id,
        documentType: doc.documentType,
        documentUid: doc.documentUid,
        additionalDetails: doc.additionalDetails,
      },
      comments: rowData?.comment || [],
      applicationList: rowData,
    };
  }) || [defaultObj];

  const showDoc = userRoles.includes("JUDGE_ROLE")
    ? [
        SubmissionWorkflowState.PENDINGREVIEW,
        SubmissionWorkflowState.PENDINGAPPROVAL,
        SubmissionWorkflowState.COMPLETED,
        SubmissionWorkflowState.REJECTED,
        SubmissionWorkflowState.PENDINGRESPONSE,
        SubmissionWorkflowState.DOC_UPLOAD,
      ].includes(rowData?.status)
    : true;

  return (
    <React.Fragment>
      <div className="fack-check-icon" onClick={() => (showDoc ? colData?.clickFunc(docObj) : null)}>
        {showAsHeading ? (
          <div
            style={{
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t(value)}
          </div>
        ) : (
          showDoc && <FactCheckIcon />
        )}
      </div>
    </React.Fragment>
  );
};
