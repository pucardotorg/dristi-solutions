import React, { useCallback, useMemo, useState } from "react";
import { LabelFieldPair, CardLabel, TextInput, CardLabelError, CustomDropdown } from "@egovernments/digit-ui-react-components";
import MultiUploadWrapper from "./MultiUploadWrapper";
import CitizenInfoLabel from "./CitizenInfoLabel";
import { CardText } from "@egovernments/digit-ui-components";
import useInterval from "../hooks/useInterval";
import DocViewerWrapper from "../pages/employee/docViewerWrapper";
import ImageModal from "./ImageModal";
import CustomToast from "./CustomToast";
import PropTypes from "prop-types";
const TYPE_REGISTER = { type: "register" };
const TYPE_LOGIN = { type: "login" };
const DEFAULT_USER = "digit-user";

const SelectUserTypeComponent = ({ t, config, onSelect, formData = {}, errors, formState, control, setError }) => {
  const [removeFile, setRemoveFile] = useState();
  const [timeLeft, setTimeLeft] = useState(10);
  const [showDoc, setShowDoc] = useState(false);
  const Digit = globalThis.Digit ?? {};
  const tenantId = Digit.ULBService?.getCurrentTenantId?.();
  const [fileStoreId, setFileStoreID] = useState();
  const [fileName, setFileName] = useState();
  const [showToast, setShowToast] = useState(null);
  const getUserType = () => Digit.UserService?.getType?.();
  const stateCode = Digit.ULBService?.getStateId?.();
  const onDocumentUpload = async (fileData, filename) => {
    try {
      const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
      return { file: fileUploadRes?.data, fileType: fileData.type, filename };
    } catch (error) {
      console.error("Error while uploading id proof", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_WHILE_UPLOADING_ID_PROOF"), error: true, errorId });
      throw error;
    }
  };
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);

  useInterval(
    () => {
      setTimeLeft(timeLeft - 1);
    },
    timeLeft > 0 ? 1000 : null
  );
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

  function setValue(value, name, input) {
    if (input && input?.clearFields && value) {
      if (input?.clearFieldsType && formData[config.key]) {
        Object.keys(input?.clearFields).forEach((ele) => {
          if (ele in input?.clearFieldsType && input?.clearFieldsType[ele] === "documentUpload" && formData[config.key][ele]?.length > 0) {
            const [fileData] = formData[config.key][ele];
            setRemoveFile(fileData[1]);
          }
        });
      }
      if (input?.type && input.type === "documentUpload" && value?.length === 0) {
        onSelect(config.key, { ...formData[config.key], [name]: value });
        return;
      }
      onSelect(config.key, { ...formData[config.key], [name]: value, ...input.clearFields }, { shouldValidate: true });
    } else onSelect(config.key, { ...formData[config.key], [name]: value }, { shouldValidate: true });

    // if (
    //   value &&
    //   typeof value === "string" &&
    //   !value?.match(window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern)
    // ) {
    //   setError(config.key, { ...formData[config.key], [name]: value });
    // }
  }
  function getFileStoreData(filesData, input) {
    const numberOfFiles = filesData.length;
    if (numberOfFiles > 0) {
      onDocumentUpload(filesData[0][1]?.file, filesData[0][0]).then((document) => {
        const newFileStoreId = document.file?.files?.[0]?.fileStoreId;

        filesData[0][1].fileStoreId = {
          fileStoreId: newFileStoreId,
        };
        setFileName(filesData[0][0]);

        setFileStoreID(document.file?.files?.[0]?.fileStoreId);
        setShowDoc(true);
        setValue(filesData, input.name, input);
      });
    } else {
      setShowDoc(false);
    }
    setValue(numberOfFiles > 0 ? filesData : [], input.name, input);
  }

  const checkIfAadharValidationNotSuccessful = (currentValue, input) => {
    if (!input?.checkAadharVerification) {
      return !currentValue.match(Digit.Utils?.getPattern?.(input.validation.patternType) || input.validation.pattern);
    }
    let isValidated = true;
    const ifOnlyNumeric = /^\d*$/.test(currentValue);
    if (!ifOnlyNumeric) {
      isValidated = false;
    }
    return !isValidated;
  };

  const sendOtp = async (data) => {
    try {
      const res = await Digit.UserService?.sendOtp?.(data, stateCode);
      return [res, null];
    } catch (err) {
      return [null, err];
    }
  };

  const resendOtp = async (input) => {
    const data = {
      mobileNumber: formData[config.key]?.[input?.mobileNoKey],
      tenantId: stateCode,
      userType: getUserType(),
    };
    const [, loginErr] = await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });
    if (!loginErr) {
      return;
    }
    await sendOtp({ otp: { ...data, name: DEFAULT_USER, ...TYPE_REGISTER } });
  };

  const handleImageModalOpen = useCallback((id, fname) => {
    setIsImageModalOpen(true);
    setImageInfo({ data: { fileStore: id, fileName: fname, docViewerStyle: { minWidth: "100%", height: "calc(100vh - 154px)" } } });
  }, []);

  const handleImageModalClose = () => {
    setIsImageModalOpen(false);
  };

  const showUploadedDocument = useMemo(() => {
    return (
      <button
        type="button"
        onClick={() => handleImageModalOpen(fileStoreId, fileName)}
        style={{
          display: "block",
          width: "100%",
          padding: 0,
          margin: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "inherit",
        }}
      >
        <div className="documentDetails_row_items" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <DocViewerWrapper fileStoreId={fileStoreId} tenantId={tenantId} displayFilename={fileName} />
        </div>
      </button>
    );
  }, [fileStoreId, tenantId, fileName, handleImageModalOpen]);

  return (
    <div className="select-user-type-component">
      {inputs?.map((input, index) => {
        let currentValue = (formData && formData[config.key] && formData[config.key][input.name]) || "";
        const showDependentFields =
          Boolean(input.isDependentOn) && !Boolean(formData && formData[config.key])
            ? false
            : Boolean(formData && formData[config.key] && formData[config.key][input.isDependentOn])
            ? formData &&
              formData[config.key] &&
              Array.isArray(input.dependentKey[input.isDependentOn]) &&
              input.dependentKey[input.isDependentOn].reduce((res, curr) => {
                if (!res) return res;
                res = formData[config.key][input.isDependentOn][curr];
                return res;
              }, true)
            : true;
        return (
          <React.Fragment key={input?.name ?? `field-${index}`}>
            {showDependentFields && (
              <LabelFieldPair style={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
                {!config?.disableScrutinyHeader && (
                  <CardLabel className="card-label-smaller" style={{ display: "flex", width: "100%" }}>
                    {t(input.label) +
                      `${
                        input?.hasMobileNo
                          ? formData[config.key]?.[input?.mobileNoKey]
                            ? input?.isMobileSecret
                              ? input?.mobileCode
                                ? ` ${input?.mobileCode}-******${formData[config.key]?.[input?.mobileNoKey]?.substring(6)}`
                                : ` ${formData[config.key]?.[input?.mobileNoKey]?.substring(6)}`
                              : ` ${formData[config.key]?.[input?.mobileNoKey]}`
                            : ""
                          : ""
                      }`}
                  </CardLabel>
                )}
                <div className="field" style={{ width: "100%" }}>
                  {["radioButton", "dropdown"].includes(input?.type) && (
                    <CustomDropdown
                      t={t}
                      label={input?.label}
                      type={input?.type === "radioButton" ? "radio" : "dropdown"}
                      value={formData && formData[config.key] ? formData[config.key][input.name] : input?.allowMultiSelect ? [] : undefined}
                      onChange={(e) => {
                        setValue(e, input.name, input);
                      }}
                      config={input}
                      errorStyle={errors?.[input.name]}
                      disable={config?.disable}
                      additionalWrapperClass={config?.disable && "radio-disabled"}
                    />
                  )}
                  {["date"].includes(input?.type) && (
                    <TextInput
                      className="field desktop-w-full"
                      key={input.name}
                      type={"date"}
                      value={formData && formData[config.key] ? formData[config.key][input.name] : undefined}
                      onChange={(e) => {
                        setValue(e.target.value, input.name, input);
                      }}
                      min={input?.validation?.min}
                      disable={input.isDisabled}
                      textInputStyle={input?.textInputStyle}
                      style={{ paddingRight: "3px" }}
                      defaultValue={undefined}
                      errorStyle={errors?.[input.name]}
                      customIcon={input?.customIcon}
                      {...input.validation}
                    />
                  )}
                  {input?.type === "documentUpload" && (
                    <MultiUploadWrapper
                      t={t}
                      module="works"
                      tenantId={tenantId}
                      getFormState={(fileData) => getFileStoreData(fileData, input)}
                      showHintBelow={input?.showHintBelow ? true : false}
                      setuploadedstate={formData?.[config.key]?.[input.name] || []}
                      allowedFileTypesRegex={input.allowedFileTypes}
                      allowedMaxSizeInMB={input.allowedMaxSizeInMB || "10"}
                      hintText={input.hintText}
                      maxFilesAllowed={input.maxFilesAllowed || "1"}
                      extraStyleName={{ padding: "0.5rem" }}
                      customClass={input?.customClass}
                      containerStyles={{ ...input?.containerStyles }}
                      requestSpecifcFileRemoval={removeFile}
                      multiple={input?.multiple !== undefined ? input?.multiple : true}
                      noteMsg={input?.noteMsg}
                      notSupportedError={input?.notSupportedError}
                    />
                  )}
                  {showDoc && input?.type === "documentUpload" && showUploadedDocument}
                  {isImageModalOpen && (
                    <ImageModal
                      t={t}
                      imageInfo={imageInfo}
                      handleCloseModal={handleImageModalClose}
                      headerBarMainStyle={{
                        position: "sticky",
                        top: "0",
                        zIndex: 1000,
                        backgroundColor: "grey",
                      }}
                    />
                  )}
                  {input?.type === "text" && (
                    <TextInput
                      className="field desktop-w-full"
                      key={input.name}
                      value={formData && formData[config.key] ? formData[config.key][input.name] : undefined}
                      onChange={(e) => {
                        let updatedValue = e.target.value;
                        if (input.validation && input.validation?.isNumber) {
                          updatedValue = /^\d*$/.test(updatedValue?.[updatedValue?.length - 1])
                            ? updatedValue
                            : updatedValue?.slice(0, updatedValue?.length - 1);
                        }
                        if (input.validation && input.validation?.isDecimal && input.validation?.regex) {
                          updatedValue = input.validation?.regex.test(updatedValue) ? updatedValue : updatedValue?.slice(0, updatedValue?.length - 1);
                        }
                        setValue(updatedValue, input.name, input);
                      }}
                      textInputStyle={input?.textInputStyle}
                      errorStyle={errors?.[input.name]}
                      disable={input.isDisabled}
                      defaultValue={undefined}
                      {...input.validation}
                    />
                  )}

                  {input.hasBreakPoint && <div style={{ margin: 20, textAlign: "center", width: "100%", maxWidth: 540 }}>{"( Or )"}</div>}
                  {currentValue &&
                    currentValue.length > 0 &&
                    !["documentUpload", "radioButton"].includes(input.type) &&
                    input.validation &&
                    checkIfAadharValidationNotSuccessful(currentValue, input) && (
                      <CardLabelError style={{ width: "100%", fontSize: "12px", marginBottom: "12px" }}>
                        <span style={{ color: "#FF0000" }}> {t(input.validation?.errMsg || "CORE_COMMON_INVALID")}</span>
                      </CardLabelError>
                    )}

                  {errors?.[input.name] && (
                    <CardLabelError style={{ width: "70%", marginLeft: "30%", fontSize: "12px" }}>
                      {errors[input.name]?.message ? errors[input.name]?.message : t(errors[input.name]) || t(input.error)}
                    </CardLabelError>
                  )}
                </div>
              </LabelFieldPair>
            )}

            {input?.type === "infoBox" && (
              <CitizenInfoLabel
                style={{ maxWidth: "100%", padding: "0 8px 10px 8px" }}
                textStyle={{ margin: 8 }}
                iconStyle={{ margin: 0 }}
                info={t("ES_COMMON_INFO")}
                text={t(input?.bannerLabel)}
                className="doc-banner"
              >
                {t("CS_AADHAR_NUMBER_INPUT_INFO")}
              </CitizenInfoLabel>
            )}
            {input?.hasResendOTP && (
              <React.Fragment>
                {timeLeft > 0 ? (
                  <CardText>{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t("CS_RESEND_SECONDS")}`}</CardText>
                ) : (
                  <button
                    type="button"
                    className="card-text"
                    onClick={() => resendOtp(input)}
                    style={{ backgroundColor: "#fff", color: "#007E7E", cursor: "pointer", border: "none", font: "inherit" }}
                  >
                    {t("CS_RESEND_OTP")}
                  </button>
                )}
              </React.Fragment>
            )}
            {showToast && (
              <CustomToast
                error={showToast?.error}
                label={showToast?.label}
                errorId={showToast?.errorId}
                onClose={() => setShowToast(null)}
                duration={showToast?.errorId ? 7000 : 5000}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

SelectUserTypeComponent.propTypes = {
  config: PropTypes.shape({
    disable: PropTypes.any,
    disableScrutinyHeader: PropTypes.bool,
    key: PropTypes.string.isRequired,
    populators: PropTypes.shape({
      inputs: PropTypes.array,
    }),
  }).isRequired,
  control: PropTypes.any,
  errors: PropTypes.object,
  formData: PropTypes.object,
  formState: PropTypes.any,
  onSelect: PropTypes.func.isRequired,
  setError: PropTypes.func,
  t: PropTypes.func.isRequired,
};

export default SelectUserTypeComponent;
