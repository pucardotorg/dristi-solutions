import React, { useEffect, useReducer, useState } from "react";
import PropTypes from "prop-types";
import UploadFile from "./UploadFile";
import isEqual from "lodash/isEqual";
import { EXTENSION_TO_MIME } from "../Utils/constants";

const displayError = ({ t, error, name }, customErrorMsg) => (
  <span style={{ display: "flex", flexDirection: "column" }}>
    <div className="validation-error">{customErrorMsg ? t(customErrorMsg) : error}</div>
    <div className="validation-error" style={{ marginTop: 0 }}></div>
  </span>
);

const fileValidationStatus = (file, regex, maxSize, t, notSupportedError, maxFileErrorMessage) => {
  const updatedRegex = typeof regex === "string" ? new RegExp(regex.replace("/i", "").replace("/(.*?)", "(.*?)")) : regex;
  const fileNameParts = file?.name.split(".");
  const extension = fileNameParts.pop().toLowerCase();
  const fileNameWithoutExtension = fileNameParts.join(".");
  const newFileName = `${fileNameWithoutExtension}.${extension}`;
  file = new File([file], newFileName, {
    type: file?.type,
    lastModified: file?.lastModified,
  });
  const status = { valid: true, name: file?.name?.substring(0, 15), error: "" };
  if (!file) return;

  const allowedMimes = EXTENSION_TO_MIME[extension];
  if (allowedMimes && file.type && !allowedMimes.includes(file.type)) {
    status.valid = false;
    status.error = t(notSupportedError ? notSupportedError : `NOT_SUPPORTED_FILE_TYPE`);
    return status;
  }

  if (!updatedRegex.test(file?.name)) {
    status.valid = false;
    status.error = t(notSupportedError ? notSupportedError : `NOT_SUPPORTED_FILE_TYPE`);
  }

  if (!updatedRegex.test(file?.name) && file.size / 1024 / 1024 > maxSize) {
    status.valid = false;
    status.error = t(`NOT_SUPPORTED_FILE_TYPE_AND_FILE_SIZE_EXCEEDED_10MB`);
  }

  if (file.size / 1024 / 1024 > maxSize) {
    status.valid = false;
    status.error = t(maxFileErrorMessage ? maxFileErrorMessage : `FILE_SIZE_EXCEEDED_10MB`);
  }

  return status;
};
const checkIfAllValidFiles = (files, regex, maxSize, t, maxFilesAllowed, state, notSupportedError, maxFileErrorMessage) => {
  if (!files.length || !regex || !maxSize) return [{}, false];

  if (maxFilesAllowed && files.length > maxFilesAllowed)
    return [[{ valid: false, name: files[0]?.name?.substring(0, 15), error: t(`FILE_LIMIT_EXCEEDED`) }], true];

  const messages = [];
  let isInValidGroup = false;
  for (let file of files) {
    const fileStatus = fileValidationStatus(file, regex, maxSize, t, notSupportedError, maxFileErrorMessage);
    if (!fileStatus.valid) {
      isInValidGroup = true;
    }
    messages.push(fileStatus);
  }

  return [messages, isInValidGroup];
};

// can use react hook form to set validations @neeraj-egov
// NOSONAR S107 - Digit composer passes many individual props
const MultiUploadWrapper = ({
  t,
  module = "PGR",
  tenantId = window?.Digit.ULBService.getStateId(),
  getFormState,
  requestSpecifcFileRemoval,
  extraStyleName = "",
  setuploadedstate = [],
  showHintBelow,
  hintText,
  allowedFileTypesRegex = /(.*?)(jpg|jpeg|webp|aif|png|image|pdf|msword|openxmlformats-officedocument|xls|xlsx|openxmlformats-officedocument|wordprocessingml|document|spreadsheetml|sheet|ms-excel)$/i,
  allowedMaxSizeInMB = 10,
  acceptFiles = "image/*, .jpg, .jpeg, .webp, .aif, .png, .image, .pdf, .msword, .openxmlformats-officedocument, .dxf, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  maxFilesAllowed,
  customClass = "",
  customErrorMsg,
  containerStyles,
  noteMsg,
  notSupportedError,
  maxFileErrorMessage,
  displayName,
  disable,
  uploadDivStyle,
  multiple = true,
}) => {
  const FILES_UPLOADED = "FILES_UPLOADED";
  const RESET_FILE = "RESET_FILE";
  const TARGET_FILE_REMOVAL = "TARGET_FILE_REMOVAL";

  const [fileErrors, setFileErrors] = useState([]);
  const [enableButton, setEnableButton] = useState(true);

  const uploadMultipleFiles = (state, payload) => {
    const { files, fileStoreIds } = payload;
    const filesData = Array.from(files);
    const newUploads = filesData?.map((file, index) => {
      if (file?.name) {
        const fileNameParts = file?.name.split(".");
        const extension = fileNameParts.pop().toLowerCase();
        const fileNameWithoutExtension = fileNameParts.join(".");
        const newFileName = `${fileNameWithoutExtension}.${extension}`;
        file = new File([file], newFileName, {
          type: file?.type,
          lastModified: file?.lastModified,
        });
        return [newFileName, { file, fileStoreId: fileStoreIds[index] }];
      } else {
        return filesData?.map((file, index) => [file?.name, { file, fileStoreId: fileStoreIds[index] }]);
      }
    });
    return [...newUploads];
  };

  const removeFile = (state, payload) => {
    const __indexOfItemToDelete = state?.findIndex((e) => e[1]?.fileStore === payload?.fileStore);
    const mutatedState = state?.filter((e, index) => index !== __indexOfItemToDelete);
    setFileErrors([]);
    return [...mutatedState];
  };

  const uploadReducer = (state, action) => {
    switch (action.type) {
      case RESET_FILE:
        return action.payload;
      case FILES_UPLOADED:
        return uploadMultipleFiles(state, action.payload);
      case TARGET_FILE_REMOVAL:
        return removeFile(state, action.payload);
      default:
        break;
    }
  };

  const [state, dispatch] = useReducer(uploadReducer, [...setuploadedstate]);

  useEffect(() => {
    // 1. Check if the incoming data from parent is different from our local state
    // 2. We use isEqual to compare values, not object references
    if (!isEqual(state, setuploadedstate)) {
      dispatch({ 
        type: "RESET_FILE", 
        payload: [...setuploadedstate] 
      });
    }
  }, [JSON.stringify(setuploadedstate)]);

  const onUploadMultipleFiles = async (e) => {
    setEnableButton(false);
    setFileErrors([]);
    const files = Array.from(e.target.files);

    if (!files.length) return;
    const [validationMsg, error] = checkIfAllValidFiles(
      files,
      allowedFileTypesRegex,
      allowedMaxSizeInMB,
      t,
      maxFilesAllowed,
      state,
      notSupportedError,
      maxFileErrorMessage
    );

    if (!error) {
      try {
        // API call commented for now
        // const { data: { files: fileStoreIds } = {} } = await Digit.UploadServices.MultipleFilesStorage(module, e.target.files, tenantId)
        setEnableButton(true);
        return dispatch({ type: FILES_UPLOADED, payload: { files: e.target.files, fileStoreIds: [1] } });
      } catch (err) {
        setEnableButton(true);
      }
    } else {
      setFileErrors(validationMsg);
      setEnableButton(true);
      return dispatch({ type: FILES_UPLOADED, payload: { files: [], fileStoreIds: [1] } });
    }
  };

  const getFormStateRef = useRef(getFormState);

  useEffect(() => {
    getFormStateRef.current = getFormState;
  }, [getFormState]);

  useEffect(() => {
    getFormStateRef.current?.(state);
  }, [state]);

  useEffect(() => {
    if (requestSpecifcFileRemoval) {
      dispatch({ type: TARGET_FILE_REMOVAL, payload: requestSpecifcFileRemoval });
    }
  }, [requestSpecifcFileRemoval]);

  return (
    <div style={containerStyles}>
      <UploadFile
        onUpload={(e) => onUploadMultipleFiles(e)}
        removeTargetedFile={(fileDetailsData) => dispatch({ type: TARGET_FILE_REMOVAL, payload: fileDetailsData })}
        uploadedFiles={state}
        multiple={multiple}
        showHintBelow={showHintBelow}
        hintText={hintText}
        extraStyleName={extraStyleName}
        onDelete={() => {
          setFileErrors([]);
        }}
        accept={acceptFiles}
        customClass={customClass}
        enableButton={enableButton || !disable}
        disabled={!enableButton || disable}
        displayName={displayName}
        uploadDivStyle={uploadDivStyle}
      />
      <span className="error-msg" style={{ display: "flex" }}>
        {fileErrors.length ? (
          fileErrors.map(({ valid, name, type, size, error }) => (valid ? null : displayError({ t, error, name }, customErrorMsg)))
        ) : (
          <h1 style={{ fontSize: "12px" }}>{t(noteMsg ? noteMsg : "CS_DOCUMENT_UPLOAD_BLURB")}</h1>
        )}
      </span>
    </div>
  );
};

MultiUploadWrapper.propTypes = {
  t: PropTypes.func.isRequired,
  module: PropTypes.string,
  tenantId: PropTypes.string,
  getFormState: PropTypes.func,
  requestSpecifcFileRemoval: PropTypes.any,
  extraStyleName: PropTypes.string,
  setuploadedstate: PropTypes.array,
  showHintBelow: PropTypes.bool,
  hintText: PropTypes.string,
  allowedFileTypesRegex: PropTypes.instanceOf(RegExp),
  allowedMaxSizeInMB: PropTypes.number,
  acceptFiles: PropTypes.string,
  maxFilesAllowed: PropTypes.number,
  customClass: PropTypes.string,
  customErrorMsg: PropTypes.string,
  containerStyles: PropTypes.object,
  noteMsg: PropTypes.string,
  notSupportedError: PropTypes.string,
  maxFileErrorMessage: PropTypes.string,
  displayName: PropTypes.string,
  disable: PropTypes.bool,
  uploadDivStyle: PropTypes.object,
  multiple: PropTypes.bool,
};

export default MultiUploadWrapper;
