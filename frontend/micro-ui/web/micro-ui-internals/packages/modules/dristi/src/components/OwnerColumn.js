import PropTypes from "prop-types";
import React from "react";
import { FactCheckIcon } from "../icons/svgIndex";
import { SubmissionWorkflowState } from "../Utils/submissionWorkflow";
import { DateUtils } from "../Utils";

export const OwnerColumn = ({ rowData, colData, value = "", showAsHeading = false, t }) => {
  const userInfo = Digit.UserService.getUser()?.info;
  const userRoles = userInfo?.roles?.map((role) => role.code) ?? [];
  const { getFormattedDate } = DateUtils;

  const defaultObj = {
    status: rowData?.status,
    details: {
      applicationType: rowData?.applicationType,
      applicationSentOn: getFormattedDate(Number.parseInt(rowData?.auditDetails?.createdTime, 10)),
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
  const docObj =
    rowData?.documents?.map((doc) => {
      return {
        status: rowData?.status,
        details: {
          applicationType: rowData?.applicationType,
          applicationSentOn: getFormattedDate(Number.parseInt(rowData?.auditDetails?.createdTime, 10)),
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
    <button
      type="button"
      className="fack-check-icon"
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      onClick={() => {
        if (showDoc) {
          colData?.clickFunc(docObj);
        }
      }}
    >
      {showAsHeading ? (
        <span
          style={{
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {t(value)}
        </span>
      ) : (
        showDoc && <FactCheckIcon />
      )}
    </button>
  );
};

OwnerColumn.propTypes = {
  colData: PropTypes.shape({
    clickFunc: PropTypes.func.isRequired,
  }).isRequired,
  rowData: PropTypes.shape({
    additionalDetails: PropTypes.any,
    applicationType: PropTypes.string,
    auditDetails: PropTypes.shape({
      createdTime: PropTypes.any,
    }),
    comment: PropTypes.arrayOf(PropTypes.any),
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        additionalDetails: PropTypes.any,
        documentType: PropTypes.any,
        documentUid: PropTypes.any,
        fileStore: PropTypes.any,
        id: PropTypes.any,
      })
    ),
    id: PropTypes.string,
    owner: PropTypes.any,
    referenceId: PropTypes.any,
    status: PropTypes.string,
    tenantId: PropTypes.string,
  }).isRequired,
  showAsHeading: PropTypes.bool,
  t: PropTypes.func.isRequired,
  value: PropTypes.string,
};

OwnerColumn.defaultProps = {
  showAsHeading: false,
  value: "",
};
