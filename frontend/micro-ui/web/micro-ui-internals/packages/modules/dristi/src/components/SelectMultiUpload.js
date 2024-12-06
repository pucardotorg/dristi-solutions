import React, { useMemo } from "react";
import { FileUploader } from "react-drag-drop-files";
import { UploadIcon } from "../icons/svgIndex";
import DocViewerWrapper from "../pages/employee/docViewerWrapper";
import { CardLabelError, TextInput } from "@egovernments/digit-ui-react-components";

const SelectMultiUpload = ({ t, config, onSelect, formData = {}, errors, setError, clearErrors }) => {
  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          name: "uploadedDocs",
          isMandatory: true,
          fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
          uploadGuidelines: "UPLOAD_DOC_50",
          maxFileSize: 50,
          maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
        },
      ],
    [config?.populators?.inputs]
  );

  const dragDropJSX = (
    <div
      style={{
        border: "1px solid #007E7E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 8px",
        cursor: "pointer",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#007E7E",
        height: "40px",
        gap: "4px",
        widht: "100%",
      }}
    >
      <UploadIcon
        style={{
          width: "16px",
          height: "16px",
          marginRight: "4px",
          color: "#007E7E",
        }}
      />
      <span style={{ color: "#007E7E", fontWeight: 600 }}>Upload More</span>
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
      <React.Fragment>
        <style>
          {`
        .file-uploader .text-input.text-input-width {
          max-width: calc(100% - 138px)
        }
        .file-uploader input[type="file"]{
          width :100%
        }
        label{
          width : "122px"
        }
        `}
        </style>
        <div className={`file-uploader-div-main show-file-uploader select-UploadFiles`}>
          {input.textAreaHeader && (
            <h1 className={`custom-text-area-header ${input?.headerClassName}`} style={{ margin: "0px 0px 8px", ...input.textAreaStyle }}>
              {t(input?.textAreaHeader)}
            </h1>
          )}
          <div className="file-uploader" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <TextInput
              disable={true}
              value={currentValue?.length > 0 ? `${currentValue?.length} Documents(s) Selected` : "No Document(s) Selected"}
              style={{
                border: "1px solid black",
                fontSize: "14px",
                color: "#888",
                margin: "0px",
              }}
            />
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
              <div key={file.id}>
                <DocViewerWrapper
                  selectedDocs={[file]}
                  showDownloadOption={false}
                  docViewerCardClassName="doc-viewer-card-style"
                  style={{ flexShrink: 0 }}
                />
                <p style={{ marginTop: "10px", fontSize: "14px", color: "#888" }}>{file.name}</p>
              </div>
            ))}
          </div>
          {errors[input.name] && (
            <CardLabelError style={{ width: "70%", marginLeft: "30%", fontSize: "12px" }}>
              {errors[input.name]?.message ? errors[input.name]?.message : t(errors[input.name]) || t(input.error)}
            </CardLabelError>
          )}
        </div>
      </React.Fragment>
    );
  });
};

export default SelectMultiUpload;
