import { Button, ErrorIcon } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ReactComponent as DeleteFileIcon } from "../images/delete.svg";
import { FileUploader } from "react-drag-drop-files";
import { ReactComponent as UploadFileIcon } from "../images/upload.svg";
import { CloseIconWhite, FileIcon } from "../icons/svgIndex";
import ImageModal from "./ImageModal";

function RenderFileCard({
  handleChange,
  handleDeleteFile,
  fileData,
  t,
  input,
  index,
  uploadErrorInfo,
  isDisabled = false,
  disableUploadDelete = false,
  setError = () => {},
  configKey,
}) {
  const [file, setFile] = useState(null);
  const popupAnchor = useRef();
  const [showImageModal, setShowImageModal] = useState(false);
  const hasUploadError = Boolean(uploadErrorInfo);
  const previewAriaLabel = (() => {
    const raw = [fileData?.documentName, fileData?.fileName, fileData?.name].find(Boolean);
    if (raw === undefined || raw === null) {
      return "View document";
    }
    const s = String(raw).trim();
    return s.length > 0 ? s : "View document";
  })();

  useEffect(() => {
    if (fileData?.fileStore) {
      const draftFile = new File(["draft content"], fileData.documentName, {
        type: fileData.documentType,
      });
      setFile(draftFile);
    }
  }, [fileData]);

  const viewImageModal = useMemo(() => {
    return (
      <div>
        <ImageModal
          imageInfo={{
            data: {
              fileStore: fileData?.fileStore,
              fileName: fileData?.fileName,
              documentName: fileData?.documentName,
              docViewerStyle: { minWidth: "100%", height: "calc(100vh - 154px)" },
            },
          }}
          selectedDocs={[fileData]}
          t={t}
          anchorRef={popupAnchor}
          showFlag={!showImageModal}
          handleCloseModal={() => {
            if (showImageModal) {
              setShowImageModal(false);
            }
          }}
          isPrevScrutiny={false}
          disableScrutiny={false}
        />
      </div>
    );
  }, [fileData, showImageModal, t]);

  const errorClassSuffix = hasUploadError ? "error" : "";

  return (
    <div className={`uploaded-file-div-main upload-${hasUploadError ? "error" : "successful"}`}>
      <div className={`uploaded-file-div-sub ${errorClassSuffix}`.trim()}>
        <button
          type="button"
          className="uploaded-file-div-icon-area"
          ref={popupAnchor}
          aria-label={previewAriaLabel}
          onClick={() => setShowImageModal(true)}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "inherit", width: "100%" }}
        >
          <div className="uploaded-file-icon">
            <FileIcon />
          </div>
          <h3>{fileData?.fileStore ? file?.name : fileData?.name}</h3>
        </button>
        <div className="reupload-or-delete-div">
          <div>
            <FileUploader
              handleChange={(data) => {
                handleChange(data, input, index);
              }}
              name="file"
              types={input?.fileTypes}
              disabled={isDisabled}
              onTypeError={() => {
                setError(configKey, { message: t("CS_INVALID_FILE_TYPE") });
              }}
              key={`file ${index}`}
            >
              <Button
                isDisabled={disableUploadDelete}
                onButtonClick={() => {
                  if (isDisabled) handleChange(input, index);
                }}
                icon={
                  <div>
                    <UploadFileIcon />{" "}
                  </div>
                }
                className="reupload-button"
                label={t("CS_REUPLOAD")}
              />
            </FileUploader>
          </div>
          <Button
            isDisabled={disableUploadDelete}
            onButtonClick={() => {
              handleDeleteFile(input, index);
            }}
            key={`Delete-${input.name}`}
            icon={
              <div>
                <DeleteFileIcon />{" "}
              </div>
            }
            className="delete-button"
            label={t("CS_COMMON_DELETE")}
          />
        </div>
      </div>

      <div className="uploaded-file-div-sub-mobile">
        <img src="https://picsum.photos/200" alt="" className="image" />
        <button
          type="button"
          aria-label={t("CS_COMMON_DELETE")}
          className="close-button"
          onClick={() => {
            handleDeleteFile(input, index);
          }}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <CloseIconWhite />
        </button>
      </div>

      <div className="uploaded-file-div-sub-mobile">
        <img src="https://picsum.photos/200" alt="" className="image" />
        <button
          type="button"
          aria-label={t("CS_COMMON_DELETE")}
          className="close-button"
          onClick={() => {
            handleDeleteFile(input, index);
          }}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <CloseIconWhite />
        </button>
      </div>
      {hasUploadError && (
        <div className="upload-error-div-main">
          <div className="upload-error-icon-container">
            <ErrorIcon />
            <h2> {t("CS_UPLOAD_FAILED")}</h2>
          </div>
          <div className="upload-error-info-div">
            <h1>{uploadErrorInfo}</h1>
          </div>
        </div>
      )}
      {showImageModal ? viewImageModal : null}
    </div>
  );
}

RenderFileCard.propTypes = {
  configKey: PropTypes.string,
  disableUploadDelete: PropTypes.bool,
  fileData: PropTypes.shape({
    documentName: PropTypes.string,
    documentType: PropTypes.string,
    fileName: PropTypes.string,
    fileStore: PropTypes.any,
    name: PropTypes.string,
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
  handleDeleteFile: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  input: PropTypes.shape({
    fileTypes: PropTypes.arrayOf(PropTypes.string),
    name: PropTypes.string,
  }).isRequired,
  isDisabled: PropTypes.bool,
  setError: PropTypes.func,
  t: PropTypes.func.isRequired,
  uploadErrorInfo: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object]),
};

RenderFileCard.defaultProps = {
  disableUploadDelete: false,
  isDisabled: false,
  setError: () => {},
  uploadErrorInfo: null,
};

export default RenderFileCard;
