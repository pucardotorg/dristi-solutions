import React, { useMemo, useState } from "react";
import { TextInput } from "@egovernments/digit-ui-react-components";
import { FileUploader } from "react-drag-drop-files";
import RenderFileCard from "./RenderFileCard";
import { ReactComponent as DeleteFileIcon } from "../images/delete.svg";

import { UploadIcon } from "@egovernments/digit-ui-react-components";
import { CustomAddIcon } from "../icons/svgIndex";
import Button from "./Button";
import { CaseWorkflowState } from "../Utils/caseWorkflow";
import { DRISTIService } from "../services";
import { getAuthorizedUuid, getFilingType, sanitizeData } from "../Utils";
import { EXTENSION_TO_MIME } from "../Utils/constants";

function SelectUploadDocWithName({ t, config, formData = {}, onSelect, setError, errors, clearErrors }) {
  const [documentData, setDocumentData] = useState(formData?.[config.key] ? formData?.[config.key] : []);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { caseId } = window?.Digit.Hooks.useQueryParams();
  const userInfo = Digit.UserService.getUser()?.info;
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);

  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          label: "label",
          type: "text",
          name: "docName",
          validation: {
            pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
            errMsg: "CORE_COMMON_DOCUMENT_NAME_INVALID",
            title: "",
            patternType: "Name",
            isRequired: true,
          },
          isMandatory: true,
        },
        {
          isMandatory: true,
          name: "document",
          documentHeader: "header",
          type: "DragDropComponent",
          maxFileSize: 10,
          maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
          fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
          isMultipleUpload: false,
        },
      ],
    [config?.populators?.inputs]
  );

  const dragDropJSX = (
    <div className="drag-drop-container-desktop">
      <UploadIcon />
      <p className="drag-drop-text">
        {t("WBH_DRAG_DROP")} <text className="browse-text">{t("WBH_BULK_BROWSE_FILES")}</text>
      </p>
    </div>
  );

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "CaseFiling"), [filingTypeData?.FilingType]);

  const handleFileChange = (file, input, index) => {
    // MIME type validation
    if (file?.type && input?.fileTypes?.length) {
      const allowedMimes = input.fileTypes.flatMap((ext) => EXTENSION_TO_MIME[ext.toLowerCase()] || []);
      if (allowedMimes.length && !allowedMimes.includes(file.type)) {
        setError(`${config.key}_${index}`, { message: t("NOT_SUPPORTED_FILE_TYPE") });
        return;
      }
    }
    // File size validation
    const maxFileSize = input?.maxFileSize * 1024 * 1024;
    if (file?.size > maxFileSize) {
      setError(`${config.key}_${index}`, { message: `${t("CS_YOUR_FILE_EXCEEDED_THE")} ${input?.maxFileSize}${t("CS_COMMON_LIMIT_MB")}` });
      return;
    }
    let currentDocumentDataCopy = structuredClone(documentData);
    let currentDataObj = currentDocumentDataCopy[index];
    currentDataObj.document = [file];
    currentDocumentDataCopy.splice(index, 1, currentDataObj);
    setDocumentData(currentDocumentDataCopy);
    onSelect(config.key, currentDocumentDataCopy);
  };

  const handleDeleteFile = (index) => {
    if (clearErrors) clearErrors(`${config.key}_${index}`);
    let currentDocumentDataCopy = structuredClone(documentData);
    let currentDataObj = currentDocumentDataCopy[index];
    currentDataObj.document = [];
    currentDocumentDataCopy.splice(index, 1, currentDataObj);
    setDocumentData(currentDocumentDataCopy);
    onSelect(config.key, currentDocumentDataCopy);
  };

  const fileValidator = (file, input) => {
    if (file?.fileStore) return null;
    const maxFileSize = input?.maxFileSize * 1024 * 1024;
    if (file.length > 0) {
      if (file[0]?.type && input?.fileTypes?.length) {
        const allowedMimes = input.fileTypes.flatMap((ext) => EXTENSION_TO_MIME[ext.toLowerCase()] || []);
        if (allowedMimes.length && !allowedMimes.includes(file[0].type)) {
          return t("NOT_SUPPORTED_FILE_TYPE");
        }
      }

      return file[0].size > maxFileSize ? t(input?.maxFileErrorMessage) : null;
    } else return null;
  };

  const handleAddDocument = () => {
    const documentDataCopy = structuredClone(documentData);
    const dataObject = {
      docName: "",
      document: [],
    };
    documentDataCopy.push(dataObject);
    setDocumentData(documentDataCopy);
    onSelect(config.key, documentDataCopy);
  };

  const handleDeleteDocument = async (index) => {
    let currentDocumentDataCopy = structuredClone(documentData);
    if (currentDocumentDataCopy?.[index].document?.[0]?.artifactId)
      await DRISTIService.createEvidence({
        artifact: {
          artifactType: "DOCUMENTARY",
          sourceType: "COMPLAINANT",
          caseId: caseId,
          filingNumber: config?.filingNumber,
          tenantId,
          asUser: authorizedUuid,
          artifactId: currentDocumentDataCopy?.[index].document?.[0]?.artifactId,
          comments: [],
          filingType: filingType,
          workflow: {
            action: "ABANDON",
          },
        },
      });
    currentDocumentDataCopy.splice(index, 1);
    setDocumentData(currentDocumentDataCopy);
    onSelect(config.key, currentDocumentDataCopy);
  };

  const handleOnTextChange = (value, input, index) => {
    let currentDocumentDataCopy = structuredClone(documentData);
    let currentDataObj = currentDocumentDataCopy[index];
    currentDataObj[input.name] = value;
    currentDocumentDataCopy.splice(index, 1, currentDataObj);
    setDocumentData(currentDocumentDataCopy);
    onSelect(config.key, currentDocumentDataCopy);
  };

  return (
    <div className="file-uploader-with-name">
      {documentData.length > 0 &&
        documentData.map((data, index) => {
          return (
            <div key={index} className="file-uploader-with-name-sub">
              <div className="file-uploader-with-name-header">
                <h1>{`${t("DOCUMENT_NUMBER_HEADING")} ${index + 1}`}</h1>

                {!config?.disable && (["DRAFT_IN_PROGRESS", "CASE_REASSIGNED"]?.includes(config?.state) || index >= config?.doclength) && (
                  <span
                    onClick={() => {
                      if (!config?.disable && (["DRAFT_IN_PROGRESS", "CASE_REASSIGNED"]?.includes(config?.state) || index >= config?.doclength)) {
                        clearErrors(`${config?.key}_${index}`);
                        handleDeleteDocument(index);
                      }
                    }}
                    style={{
                      cursor: config?.disable ? "not-allowed" : "pointer",
                      opacity: config?.disable ? 0.5 : 1,
                    }}
                  >
                    <DeleteFileIcon />
                  </span>
                )}
              </div>
              <div className="drag-drop-visible-main-with-custom-name">
                {inputs.map((input) => {
                  let currentValue = data && data[input.name];
                  if (input.type === "text") {
                    return (
                      <div className="file-name-field">
                        <h1>{t("DOCUMENT_NAME_TITLE")}</h1>
                        <TextInput
                          className="field desktop-w-full"
                          key={input?.name}
                          value={currentValue}
                          onChange={(e) => {
                            const val = sanitizeData(e.target.value);
                            handleOnTextChange(val, input, index);
                          }}
                          disable={input?.isDisabled || (index < config?.doclength ? true : config?.disable)}
                          defaultValue={undefined}
                          {...input?.validation}
                        />
                      </div>
                    );
                  } else {
                    let fileErrors = fileValidator(currentValue, input);
                    const showFileUploader = currentValue.length ? input?.isMultipleUpload : true;
                    return (
                      <div className="drag-drop-visible-main">
                        <div className="drag-drop-heading-main">
                          <div className="drag-drop-heading">
                            <span>
                              <h2 className="card-label document-header">{t(input?.documentHeader)}</h2>
                            </span>
                          </div>
                        </div>
                        {currentValue.length > 0 && (
                          <RenderFileCard
                            fileData={currentValue[0]}
                            handleChange={(data) => {
                              clearErrors(`${config.key}_${index}`);
                              handleFileChange(data, input, index);
                            }}
                            handleDeleteFile={() => handleDeleteFile(index)}
                            t={t}
                            uploadErrorInfo={fileErrors}
                            input={input}
                            disableUploadDelete={index < config?.doclength ? true : config?.disable}
                            configKey={`${config?.key}_${index}`}
                            setError={setError}
                          />
                        )}
                        {showFileUploader && (
                          <div className={`file-uploader-div-main ${showFileUploader ? "show-file-uploader" : ""}`}>
                            <FileUploader
                              handleChange={(data) => {
                                clearErrors(`${config.key}_${index}`);
                                handleFileChange(data, input, index);
                              }}
                              name="file"
                              types={input?.fileTypes}
                              children={dragDropJSX}
                              key={input?.name}
                              // disabled={config?.disable}
                              onTypeError={(file) => {
                                setError(`${config.key}_${index}`, { message: t("CS_INVALID_FILE_TYPE") });
                              }}
                            />
                            <div className="upload-guidelines-div">{input.uploadGuidelines && <p>{t(input.uploadGuidelines)}</p>}</div>
                          </div>
                        )}
                        {errors?.[`${config.key}_${index}`] && (
                          <span className="alert-error">
                            {t(errors?.[`${config.key}_${index}`]?.msg || errors?.[`${config.key}_${index}`].message || "CORE_REQUIRED_FIELD_ERROR")}
                          </span>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        })}
      <Button
        // isDisabled={config?.disable || (config?.state && config?.state !== CaseWorkflowState.DRAFT_IN_PROGRESS)}
        variation="secondary"
        onButtonClick={handleAddDocument}
        className="add-new-document"
        icon={<CustomAddIcon />}
        label={t("ADD_DOCUMENT")}
        labelClassName="add-new-document-label"
      />
      {/* {<span onClick={handleAddDocument}> + {t("ADD_DOCUMENT")}</span>} */}
    </div>
  );
}

export default SelectUploadDocWithName;
