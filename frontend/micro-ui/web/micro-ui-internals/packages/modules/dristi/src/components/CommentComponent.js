import React from "react";
import PropTypes from "prop-types";
import { FileIcon } from "@egovernments/digit-ui-react-components";
import useDownloadCasePdf from "../hooks/dristi/useDownloadCasePdf";

function CommentComponent({ comment }) {
  const tenantId = window?.Digit?.ULBService?.getCurrentTenantId();
  const { downloadPdf } = useDownloadCasePdf();
  return (
    <div className="comment-body">
      <div className="name-logo">
        <div className="comment-avatar">
          <span>{comment?.author?.[0]}</span>
          <span>{comment?.additionalDetails?.author?.[0]}</span>
        </div>
      </div>
      <div className="comment-details">
        <h3 className="comment-header" style={{ marginTop: "5px" }}>
          {comment?.author}
          {comment?.additionalDetails?.author}
          <span className="times-stamp" style={{ color: "#77787B", marginLeft: "10px" }}>
            {comment?.timestamp} {comment?.additionalDetails?.timestamp}{" "}
          </span>
        </h3>
        <p className="comment-text">{comment?.text}</p>
        <p className="comment-text">{comment?.comment}</p>
        {comment?.additionalDetails?.commentDocumentId && (
          <button
            type="button"
            style={{
              border: "1px solid #bbbbbd",
              color: "#505A5F",
              display: "flex",
              alignItems: "center",
              padding: "10px",
              borderRadius: "5px",
              width: "300px",
              fontWeight: "bold",
              gap: "7px",
              marginTop: "10px",
              cursor: "pointer",
              background: "none",
            }}
            onClick={() => downloadPdf(tenantId, comment?.additionalDetails?.commentDocumentId)}
          >
            <FileIcon />
            <span style={{ fontWeight: "bold" }}>{comment?.additionalDetails?.commentDocumentName || "Attached File"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

CommentComponent.propTypes = {
  comment: PropTypes.shape({
    author: PropTypes.string,
    timestamp: PropTypes.string,
    text: PropTypes.string,
    comment: PropTypes.string,
    additionalDetails: PropTypes.shape({
      author: PropTypes.string,
      timestamp: PropTypes.string,
      commentDocumentId: PropTypes.string,
      commentDocumentName: PropTypes.string,
    }),
  }),
};

export default CommentComponent;
