import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { CardLabel, TextInput, CardLabelError } from "@egovernments/digit-ui-react-components";
import MultiUploadWrapper from "./MultiUploadWrapper";
import DocViewerWrapper from "../pages/employee/docViewerWrapper";
import ImageModal from "./ImageModal";

const computeShowDependentFields = (input, formDataSlice) => {
  if (input?.isDependentOn && !formDataSlice) {
    return false;
  }
  const dependentBranch = Boolean(formDataSlice?.[input.isDependentOn]);
  if (!dependentBranch) {
    return true;
  }
  const depKeys = input.dependentKey?.[input.isDependentOn];
  if (!Array.isArray(depKeys)) {
    return false;
  }
  return depKeys.reduce((res, curr) => {
    if (!res) {
      return res;
    }
    return formDataSlice?.[input.isDependentOn]?.[curr];
  }, true);
};

const AdvocateDetailComponent = ({ t, config, onSelect, formData = {}, errors, clearErrors }) => {
  const [removeFile, setRemoveFile] = useState(undefined);
  const [showDoc, setShowDoc] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({});
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [fileStoreId, setFileStoreID] = useState(undefined);
  const [fileName, setFileName] = useState(undefined);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);
  const digit = window.Digit || {};
  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          label: "CS_LOCATION",
          type: "LocationSearch",
          name: "correspondenceCity",
        },
      ],
    [config?.populators?.inputs]
  );
  const onDocumentUpload = async (fileData, filename) => {
    try {
      const fileUploadRes = await digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
      return { file: fileUploadRes?.data, fileType: fileData.type, filename };
    } catch (error) {
      const errorCode = error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR";
      throw new Error(errorCode);
    }
  };
  const getExistingFileStoreId = (fileMeta = {}) => {
    const candidate = fileMeta?.fileStoreId?.fileStoreId || fileMeta?.fileStoreId || fileMeta?.fileStore;
    return typeof candidate === "string" && candidate.length > 5 ? candidate : null;
  };
  function setValue(value, name, input) {
    if (errors?.[name]) {
      clearErrors();
    }
    if (uploadErrors?.[name]) {
      setUploadErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (input?.clearFields && value) {
      const section = formData?.[config.key];
      if (input?.clearFieldsType && section) {
        Object.keys(input?.clearFields).forEach((ele) => {
          if (
            input.clearFieldsType != null &&
            ele in input.clearFieldsType &&
            input.clearFieldsType[ele] === "documentUpload" &&
            Array.isArray(section[ele]) &&
            section[ele]?.length > 0
          ) {
            const [fileData] = section[ele];
            setRemoveFile(fileData[1]);
          }
        });
      }
      onSelect(config.key, { ...(section || {}), [name]: value, ...input.clearFields }, { shouldValidate: true });
    } else onSelect(config.key, { ...(formData?.[config.key] || {}), [name]: value }, { shouldValidate: true });
  }
  function getFileStoreData(filesData, input) {
    const numberOfFiles = filesData.length;
    if (numberOfFiles > 0) {
      const selectedFile = filesData?.[0]?.[1] || {};
      const existingFileStoreId = getExistingFileStoreId(selectedFile);

      // MultiUploadWrapper emits state updates for parent-sync as well; avoid re-upload for already uploaded files.
      if (existingFileStoreId) {
        setFileName(filesData?.[0]?.[0]);
        setFileStoreID(existingFileStoreId);
        setShowDoc(true);
        setUploadErrors((prev) => ({ ...prev, [input.name]: null }));
        return;
      }

      onDocumentUpload(filesData[0][1]?.file, filesData[0][0])
        .then((document) => {
          const uploadedFileStoreId = document?.file?.files?.[0]?.fileStoreId;
          setFileName(filesData[0][0]);
          setFileStoreID(uploadedFileStoreId);
          setShowDoc(true);
          setUploadErrors((prev) => ({ ...prev, [input.name]: null }));
          const uploadedFileData = [
            [
              filesData[0][0],
              {
                ...(filesData[0][1] || {}),
                fileStoreId: { fileStoreId: uploadedFileStoreId },
                fileStore: uploadedFileStoreId,
              },
            ],
          ];
          setValue(uploadedFileData, input.name, input);
        })
        .catch((error) => {
          setShowDoc(false);
          setUploadErrors((prev) => ({ ...prev, [input.name]: error?.message || "CS_FILE_UPLOAD_ERROR" }));
          // Reset the field so mandatory validation blocks continue.
          setValue([], input.name, input);
        });
    } else {
      setShowDoc(false);
      setFileStoreID(null);
      setFileName(null);
      setUploadErrors((prev) => ({ ...prev, [input.name]: null }));
      setValue([], input.name, input);
    }
  }

  const handleImageModalOpen = (fileStoreId, fileName) => {
    setIsImageModalOpen(true);
    setImageInfo({ data: { fileStore: fileStoreId, fileName: fileName, docViewerStyle: { minWidth: "100%", height: "calc(100vh - 154px)" } } });
  };

  const handleImageModalClose = () => {
    setIsImageModalOpen(false);
  };

  const showDocument = useMemo(() => {
    return (
      <div onClick={() => handleImageModalOpen(fileStoreId, fileName)}>
        <div className="documentDetails_row_items" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <DocViewerWrapper fileStoreId={fileStoreId} tenantId={tenantId} displayFilename={fileName} />
        </div>
      </div>
    );
  }, [fileStoreId, tenantId, fileName]);

  return (
    <React.Fragment>
      {inputs?.map((input) => {
        const formSlice = formData?.[config.key];
        let currentValue = formSlice?.[input.name] || "";
        const showDependentFields = computeShowDependentFields(input, formSlice);
        if (!showDependentFields) {
          return null;
        }
        return (
          <React.Fragment key={String(input.name)}>
            <div className={`${input?.type}`} style={{ width: "100%" }}>
              {input?.type !== "infoBox" && (
                <CardLabel className="card-label-smaller" style={{ width: "100%", fontSize: "16px" }}>
                  {t(input.label)}
                </CardLabel>
              )}
              <div className="field" style={{ width: "100%" }}>
                {input?.type === "documentUpload" && (
                  <MultiUploadWrapper
                    t={t}
                    module="works"
                    tenantId={window?.Digit.ULBService.getCurrentTenantId()}
                    getFormState={(fileData) => getFileStoreData(fileData, input)}
                    showHintBelow={!!input?.showHintBelow}
                    setuploadedstate={formData?.[config.key]?.[input.name] || []}
                    allowedFileTypesRegex={input.allowedFileTypes}
                    allowedMaxSizeInMB={input.allowedMaxSizeInMB || "10"}
                    hintText={input.hintText}
                    maxFilesAllowed={input.maxFilesAllowed || "1"}
                    extraStyleName={{ padding: "0.5rem" }}
                    customClass={input?.customClass}
                    containerStyles={{ ...input?.containerStyles }}
                    requestSpecifcFileRemoval={removeFile}
                  />
                )}
                {input?.type === "text" && (
                  <TextInput
                    className="field desktop-w-full"
                    key={input.name}
                    value={formSlice?.[input.name]}
                    onChange={(e) => {
                      setValue(e.target.value, input.name, input);
                    }}
                    disable={input.isDisabled}
                    defaultValue={undefined}
                    isRequired={input.validation.isRequired}
                    pattern={input.validation.pattern}
                    errMsg={input.validation.errMsg}
                    maxlength={input.validation.maxlength}
                    minlength={input.validation.minlength}
                    style={{ minWidth: "500px" }}
                  />
                )}

                {currentValue &&
                  currentValue.length > 0 &&
                  !["documentUpload", "radioButton"].includes(input.type) &&
                  input.validation &&
                  !currentValue.match(window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern) && (
                    <CardLabelError style={{ width: "100%", marginTop: "5px", fontSize: "16px", marginBottom: "12px" }}>
                      <span style={{ color: "#FF0000" }}> {t(input.validation?.errMsg || "INVALID_BAR_REG_NUMBER")}</span>
                    </CardLabelError>
                  )}
              </div>
            </div>
            {errors[input.name] && (
              <CardLabelError style={{ color: "#FF0000", marginTop: "5px", fontSize: "14px" }}>
                {errors[input.name]?.message ? errors[input.name]?.message : t(errors[input.name]) || t(input.error)}
                {t(input.error)}
              </CardLabelError>
            )}
            {uploadErrors[input.name] && (
              <CardLabelError style={{ color: "#FF0000", marginTop: "5px", fontSize: "14px" }}>{t(uploadErrors[input.name])}</CardLabelError>
            )}
            {/* )} */}
          </React.Fragment>
        );
      })}
      {showDoc && showDocument}
      {isImageModalOpen && <ImageModal t={t} imageInfo={imageInfo} handleCloseModal={handleImageModalClose} headerBarMainStyle={{
        position: "sticky",
        top: "0",
        zIndex: 1000,
        backgroundColor: "grey",
      }} />}
    </React.Fragment>
  );
};

const advocateInputPopulatorPropType = PropTypes.shape({
  type: PropTypes.string,
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
  isDependentOn: PropTypes.string,
  dependentKey: PropTypes.object,
  clearFields: PropTypes.object,
  clearFieldsType: PropTypes.object,
  validation: PropTypes.object,
});

const advocateDetailConfigPropType = PropTypes.shape({
  key: PropTypes.string,
  populators: PropTypes.shape({
    inputs: PropTypes.arrayOf(advocateInputPopulatorPropType),
  }),
});

AdvocateDetailComponent.propTypes = {
  t: PropTypes.func.isRequired,
  config: advocateDetailConfigPropType.isRequired,
  onSelect: PropTypes.func.isRequired,
  formData: PropTypes.object,
  errors: PropTypes.object,
  clearErrors: PropTypes.func,
};

export default AdvocateDetailComponent;
