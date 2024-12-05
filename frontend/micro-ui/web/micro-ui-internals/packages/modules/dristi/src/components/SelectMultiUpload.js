import React, { useMemo } from "react";
import { FileUploader } from "react-drag-drop-files";
import { UploadIcon } from "../icons/svgIndex";
import DocViewerWrapper from "../pages/employee/docViewerWrapper";

const SelectMultiUpload = ({ t, config, onSelect, formData = {}, errors }) => {
  const inputs = useMemo(() => config?.populators?.inputs || [{ name: "documents", disableMultipleUpload: false }], [config?.populators?.inputs]);

  const dragDropJSX = (
    <div className="drag-drop-container">
      <UploadIcon />
      <p className="drag-drop-text">
        {t("WBH_DRAG_DROP")} <text className="browse-text">{t("WBH_BULK_BROWSE_FILES")}</text>
      </p>
    </div>
  );

  function setValue(value, input) {
    if (Array.isArray(input)) {
      onSelect(config.key, {
        ...formData[config.key],
        ...input.reduce((res, curr) => {
          res[curr] = value[curr];
          return res;
        }, {}),
      });
    } else onSelect(config.key, { ...formData[config.key], [input]: value });
  }

  function handleAddFiles(data, input, currentValue) {
    const upadatedDocuments = [...currentValue, data];
    setValue(upadatedDocuments, input?.name);
  }

  return inputs?.map((input) => {
    const currentValue = formData?.[config.key]?.[input?.name] || [];

    return (
      <div className={`file-uploader-div-main show-file-uploader select-UploadFiles`}>
        <div className="file-uploader">
          <FileUploader
            disabled={config?.disable}
            handleChange={(data) => handleAddFiles(data, input, currentValue)}
            name="file"
            types={input?.fileTypes}
            children={dragDropJSX}
            key={input?.name}
          />
        </div>
        <div className="upload-guidelines-div">
          {" "}
          <p>{t(input?.uploadGuidelines)}</p>
        </div>
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            display: "flex",
            gap: "10px",
          }}
        >
          {currentValue?.map((file) => (
            <DocViewerWrapper
              selectedDocs={[file]}
              showDownloadOption={false}
              docViewerCardClassName="doc-viewer-card-style"
              style={{ flexShrink: 0 }}
            />
          ))}
        </div>
      </div>
    );
  });
};

export default SelectMultiUpload;
