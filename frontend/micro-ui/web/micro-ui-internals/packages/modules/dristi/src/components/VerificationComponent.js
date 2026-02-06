import { InfoCard } from "@egovernments/digit-ui-components";
import { CardLabel, CloseSvg, FormComposerV2 } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useMemo, useState } from "react";
import { idProofVerificationConfig } from "../configs/component";
import Button from "./Button";
import Modal from "./Modal";
import RenderFileCard from "./RenderFileCard";
import { useToast } from "./Toast/useToast";

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

function VerificationComponent({ t, config, onSelect, formData = {}, errors, setError, clearErrors }) {
  const [{ showModal, verificationType, modalData, isAadharVerified }, setState] = useState({
    showModal: false,
    verificationType: "",
    modalData: {},
    isAadharVerified: false,
  });
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isAdvocateOrClerkFilingCase = roles?.some((role) => role.code === "ADVOCATE_ROLE" || role.code === "CLERK_ROLE");
  const [isDisabled, setIsDisabled] = useState(false);
  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          label: "CS_LOCATION",
          type: "LocationSearch",
          name: [],
        },
      ],
    [config?.populators?.inputs]
  );

  const handleCloseModal = () => {
    setState((prev) => ({
      ...prev,
      showModal: false,
    }));
  };

  const onFormValueChange = useCallback(
    (setValue, formData, formState) => {
      let isDisabled = false;
      idProofVerificationConfig.forEach((curr) => {
        if (isDisabled) return;
        if (!(curr.body[0].key in formData) || !formData[curr.body[0].key]) {
          isDisabled = true;
          return;
        }
        curr.body[0].populators.inputs.forEach((input) => {
          if (isDisabled) return;
          if (Array.isArray(input.name)) return;
          if (
            formData[curr.body[0].key][input.name] &&
            formData[curr.body[0].key][input.name].length > 0 &&
            !["documentUpload", "radioButton"].includes(input.type) &&
            input.validation &&
            !formData[curr.body[0].key][input.name].match(window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern)
          ) {
            isDisabled = true;
          }
          if (Array.isArray(formData[curr.body[0].key][input.name]) && formData[curr.body[0].key][input.name].length === 0) {
            isDisabled = true;
          }
        });
      });
      if (isDisabled) {
        setIsDisabled(isDisabled);
      } else {
        setIsDisabled(false);
        if (JSON.stringify(formData?.[idProofVerificationConfig?.[0].body[0].key]) !== JSON.stringify(modalData)) {
          setState((prev) => ({
            ...prev,
            modalData: formData?.[idProofVerificationConfig?.[0].body[0].key],
          }));
        }
      }
    },
    [modalData]
  );

  const fileValidator = (file, input) => {
    const maxFileSize = input?.maxFileSize * 1024 * 1024;
    return file.size > maxFileSize ? t(input?.maxFileErrorMessage) : null;
  };

  const handleChange = (file, input, index = Infinity) => {
    setState((prev) => ({
      ...prev,
      showModal: true,
      verificationType: "uploadIdProof",
    }));
  };

  const handleDeleteFile = (input, index) => {
    onSelect(config.key, { ...formData[config.key], [input?.name]: undefined }, { shouldValidate: true });
  };

  return (
    <div className="verification-component">
      {inputs?.map((input, index) => {
        let currentValue = (formData && formData[config.key] && formData[config.key][input.name]) || "";
        const isComplainantId =
          formData?.[config?.key]?.[input?.name] === true || formData?.complainantId?.complainantId?.complainantId?.["ID_Proof"]?.[0]?.[1]?.["file"];
        if (isComplainantId && input?.name === "complainantId") {
          currentValue = formData?.complainantVerification?.individualDetails?.document;
        } else if (isComplainantId && input?.name === "poaComplainantId") {
          currentValue = formData?.poaVerification?.individualDetails?.document;
        }
        let fileErrors =
          currentValue?.["ID_Proof"]?.[0]?.[1]?.["file"] &&
          [currentValue?.["ID_Proof"]?.[0]?.[1]?.["file"]]?.map((file) =>
            fileValidator(file, idProofVerificationConfig?.[0]?.body[0]?.populators?.inputs?.[1])
          );
        const isUserVerified = isAadharVerified || (!config?.isScrutiny && formData?.[config.key]?.[config.key]);
        return (
          <React.Fragment key={index}>
            <CardLabel className="card-label-smaller">{t(input.label)}</CardLabel>
            {!currentValue?.["ID_Proof"] ? (
              <React.Fragment>
                {(!isUserVerified || !currentValue) && (
                  <React.Fragment>
                    <div className="button-field">
                      {/* <Button
                        variation={"secondary"}
                        className={"secondary-button-selector"}
                        label={t("VERIFY_AADHAR")}
                        labelClassName={"secondary-label-selector"}
                        onButtonClick={() => {
                          setState((prev) => ({
                            ...prev,
                            isAadharVerified: true,
                          }));
                          onSelect(
                            config.key,
                            {
                              ...formData[config.key],
                              [config.key]: generateAadhaar(),
                              verificationType: "AADHAR",
                              isFirstRender: true,
                            },
                            { shouldValidate: true }
                          );
                        }}
                      /> */}
                      {!config?.isScrutiny && (
                        <Button
                          className={"secondary-button-selector"}
                          variation={"secondary"}
                          label={t("VERIFY_ID_PROOF")}
                          labelClassName={"secondary-label-selector"}
                          onButtonClick={() => {
                            setState((prev) => ({
                              ...prev,
                              showModal: true,
                              verificationType: "uploadIdProof",
                            }));
                          }}
                        />
                      )}
                    </div>
                    {errors?.[config.key] && <span className="alert-error">{t(errors?.[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</span>}
                  </React.Fragment>
                )}

                {isUserVerified && currentValue && (
                  <InfoCard
                    variant={isUserVerified ? "success" : "default"}
                    label={isUserVerified ? t("CS_AADHAR_VERIFIED") : t("CS_COMMON_NOTE")}
                    additionalElements={{}}
                    inline
                    text={
                      isUserVerified
                        ? isAdvocateOrClerkFilingCase
                          ? t("CS_ADVOCATE_VERIFY_COMPLAINANT_ID")
                          : t("CS_ID_VERIFIED_NOTE")
                        : t("CS_AADHAR_VERIFICATION_NOTE")
                    }
                    textStyle={{}}
                    className={`adhaar-verification-info-card ${isUserVerified && "user-verified"}`}
                  />
                )}
                {isComplainantId &&
                  currentValue?.map((file, index) => (
                    <RenderFileCard
                      key={`${input?.name}${index}`}
                      index={index}
                      fileData={file}
                      handleChange={handleChange}
                      handleDeleteFile={handleDeleteFile}
                      t={t}
                      uploadErrorInfo={fileErrors?.[index]}
                      input={input}
                      isDisabled={true}
                      disableUploadDelete={config?.disable}
                    />
                  ))}
              </React.Fragment>
            ) : (
              [currentValue?.["ID_Proof"]?.[0]?.[1]?.["file"]].map((file, index) => (
                <RenderFileCard
                  key={`${input?.name}${index}`}
                  index={index}
                  fileData={file}
                  handleChange={handleChange}
                  handleDeleteFile={handleDeleteFile}
                  t={t}
                  uploadErrorInfo={fileErrors[index]}
                  input={input}
                  isDisabled={true}
                />
              ))
            )}
            {showModal && (
              <Modal
                headerBarEnd={<CloseBtn onClick={handleCloseModal} isMobileView={true} />}
                // actionCancelLabel={page === 0 ? t("CORE_LOGOUT_CANCEL") : null}
                actionCancelOnSubmit={() => {}}
                isDisabled={isDisabled}
                actionSaveLabel={t("ADD")}
                actionSaveOnSubmit={() => {
                  onSelect(config.key, { ...formData[config.key], [input.name]: { verificationType, ...modalData } }, { shouldValidate: true });
                  setState((prev) => ({
                    ...prev,
                    showModal: false,
                    verificationType: "",
                  }));
                }}
                formId="modal-action"
                headerBarMain={<Heading label={t("VERIFY_ID_PROOF")} />}
                submitTextClassName={"verification-button-text-modal"}
                className={"verification-complainant-modal"}
              >
                <FormComposerV2
                  config={idProofVerificationConfig}
                  t={t}
                  cardClassName={"form-composer-id-proof-card"}
                  inline
                  headingStyle={{ textAlign: "center" }}
                  cardStyle={{ minWidth: "100%" }}
                  onFormValueChange={onFormValueChange}
                ></FormComposerV2>
              </Modal>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default VerificationComponent;
