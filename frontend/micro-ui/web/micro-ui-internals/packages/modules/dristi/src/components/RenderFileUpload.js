import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { CloseIcon, FileIcon } from "../icons/svgIndex";
import useDownloadCasePdf from "../hooks/dristi/useDownloadCasePdf";

function RenderFileUpload({ handleDeleteFile, fileData, index, disableUploadDelete = false, displayName, fileStoreId }) {
  const [file, setFile] = useState(null);
  const digit = globalThis.Digit ?? window.Digit;
  const tenantId = digit?.ULBService?.getCurrentTenantId();
  const { downloadPdf } = useDownloadCasePdf();
  useEffect(() => {
    if (fileData?.fileStore) {
      const draftFile = new File(["draft content"], fileData.documentName || "Unnamed File", {
        type: fileData.documentType || "application/octet-stream",
      });
      setFile(draftFile);
    }
  }, [fileData]);

  return (
    <div className={`uploaded-file-div-main upload-${fileData?.uploadErrorInfo ? "error" : "successful"}`} style={{ padding: "10px" }}>
      <div className={`uploaded-file-div-sub ${fileData?.uploadErrorInfo ? "error" : ""}`}>
        <div className="uploaded-file-div-icon-area">
          <div className="uploaded-file-icon">
            <button type="button" onClick={() => downloadPdf(tenantId, fileStoreId?.fileStoreId)}>
              <FileIcon />
            </button>
          </div>
          <span style={{ margin: "2px", color: "#505A5F", fontSize: "14px" }}>
            {displayName || (fileData?.fileStore ? file?.name : fileData?.name) || "Unnamed File"}
          </span>
        </div>
        <div className="reupload-or-delete-div">
          <button
            type="button"
            style={{
              padding: "0",
              cursor: disableUploadDelete ? "not-allowed" : "pointer",
              opacity: disableUploadDelete ? 0.5 : 1,
              background: "none",
              border: "none",
            }}
            disabled={disableUploadDelete}
            onClick={() => {
              if (!disableUploadDelete) {
                handleDeleteFile(index);
              }
            }}
            className="delete-button"
            aria-label="Delete file"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

RenderFileUpload.propTypes = {
  handleDeleteFile: PropTypes.func.isRequired,
  fileData: PropTypes.object,
  index: PropTypes.number,
  disableUploadDelete: PropTypes.bool,
  displayName: PropTypes.string,
  fileStoreId: PropTypes.shape({
    fileStoreId: PropTypes.string,
  }),
  t: PropTypes.func,
};

export default RenderFileUpload;
