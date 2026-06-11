import PropTypes from "prop-types";
import React, { useMemo } from "react";
import { FactCheckIcon, FactCrossIcon } from "../icons/svgIndex";

export const Evidence = ({
  rowData,
  colData,
  value = "",
  showAsHeading = false,
  t,
  userRoles,
  isBail = false,
  isDigitilization = false,
}) => {
  const getDate = (v) => {
    const date = new Date(v);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const docObj = useMemo(
    () => [
      {
        status: rowData.workflow?.action,
        details: {
          applicationType: rowData?.artifactType,
          applicationSentOn: getDate(Number.parseInt(rowData?.auditdetails?.createdTime, 10)),
          sender: rowData?.owner,
          additionalDetails: rowData?.additionalDetails,
          applicationId: rowData?.id,
          auditDetails: rowData?.auditDetails,
        },
        applicationContent: {
          tenantId: rowData?.tenantId,
          fileStoreId: rowData?.file?.fileStore,
          id: rowData?.file?.id,
          documentType: rowData?.file?.documentType,
          documentUid: rowData?.file?.documentUid,
          additionalDetails: rowData?.file?.additionalDetails,
        },
        comments: rowData?.comments,
        artifactList: rowData,
        isBail,
        isDigitilization,
      },
    ],
    [rowData, isBail, isDigitilization]
  );

  const tooltipId = `mark-unmark-tooltip-${rowData?.artifactNumber}`;

  const onActivate = () => {
    colData?.clickFunc(docObj);
  };

  const iconSpanStyle = { cursor: "pointer" };
  let innerContent;
  if (showAsHeading) {
    innerContent = (
      <div style={{ textDecoration: "underline", cursor: "pointer" }}>{t(value)}</div>
    );
  } else if (rowData?.isEvidence) {
    innerContent = (
      <span data-tip data-for={tooltipId} style={iconSpanStyle}>
        <FactCrossIcon />
      </span>
    );
  } else {
    innerContent = (
      <span data-tip data-for={tooltipId} style={iconSpanStyle}>
        <FactCheckIcon />
      </span>
    );
  }

  return (
    <button
      type="button"
      className="fack-check-icon"
      onClick={onActivate}
      style={{
        border: "none",
        background: "none",
        padding: 0,
        margin: 0,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        textAlign: "inherit",
        display: "block",
      }}
    >
      {innerContent}
    </button>
  );
};

const filePropType = PropTypes.shape({
  fileStore: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  documentType: PropTypes.string,
  documentUid: PropTypes.string,
  additionalDetails: PropTypes.object,
});

Evidence.propTypes = {
  rowData: PropTypes.shape({
    workflow: PropTypes.shape({ action: PropTypes.string }),
    artifactType: PropTypes.string,
    auditdetails: PropTypes.shape({ createdTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
    auditDetails: PropTypes.object,
    owner: PropTypes.any,
    additionalDetails: PropTypes.object,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tenantId: PropTypes.string,
    file: filePropType,
    comments: PropTypes.any,
    artifactNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isEvidence: PropTypes.bool,
  }).isRequired,
  colData: PropTypes.shape({
    clickFunc: PropTypes.func,
  }),
  value: PropTypes.string,
  showAsHeading: PropTypes.bool,
  t: PropTypes.func.isRequired,
  userRoles: PropTypes.array,
  isBail: PropTypes.bool,
  isDigitilization: PropTypes.bool,
};
