import React, { useMemo, useState } from "react";
import { CardLabelError, TextInput, CustomDropdown, Header, InfoBannerIcon } from "@egovernments/digit-ui-react-components";
import CustomErrorTooltip from "./CustomErrorTooltip";
import SelectCustomDragDrop from "./SelectCustomDragDrop";
import CustomEmailTextInput from "../pages/citizen/registration/CustomEmailTextInput";

const CloseBtn = () => {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3H0V1H5V0H11V1H16V3H15V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM13 3H3V16H13V3ZM5 14H7V5H5V14ZM9 14H11V5H9V14Z"
        fill="#C62326"
      />
    </svg>
  );
};

const SuretyComponent = ({ t, config, onSelect, formData = {}, errors, setError, clearErrors }) => {
  const [formInstances, setFormInstances] = useState(formData?.[config?.key] || [{}]);
  const disable = config?.disable;
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);

  const addAnotherForm = () => {
    const newFormInstances = [...formInstances, {}];
    setFormInstances(newFormInstances);
    updateFormData(newFormInstances);
  };

  const updateFormData = (updatedFormInstances) => {
    onSelect(
      config.key,
      updatedFormInstances.map((instance) => instance[config.key] || {})
    );
  };

  const deleteForm = (index) => {
    const updatedFormInstances = [...formInstances];
    updatedFormInstances.splice(index, 1);
    setFormInstances(updatedFormInstances);
    updateFormData(updatedFormInstances);
    clearErrors(`name_${index}`);
    clearErrors(`fatherName_${index}`);
    clearErrors(`mobileNumber_${index}`);
    clearErrors(`identityProof_${index}`);
    clearErrors(`proofOfSolvency_${index}`);
    clearErrors(`otherDocuments_${index}`);
  };

  function setValue(value, name, input, index) {
    const updatedFormInstances = [...formInstances];
    if (!updatedFormInstances[index][config.key]) {
      updatedFormInstances[index][config.key] = {};
    }
    updatedFormInstances[index][config.key][name] = value;

    setFormInstances(updatedFormInstances);
    updateFormData(updatedFormInstances);
  }

  function uploadedDocs(name, inputDocs, inputKey, index) {
    const updatedFormInstances = [...formInstances];

    if (!updatedFormInstances[index][config.key]) {
      updatedFormInstances[index][config.key] = {};
    }

    updatedFormInstances[index][config.key] = {
      ...updatedFormInstances[index][config.key],
      [name]: inputDocs,
    };

    setFormInstances(updatedFormInstances);
    updateFormData(updatedFormInstances);
  }

  const handleChange = (e, input, formIndex) => {
    let { value } = e.target;
    setValue(value, input.key, input, formIndex);
  };

  return (
    <React.Fragment>
      <style>
        {`
      .text-Input .text-input-width {
      max-width : none
      }
      .citizen-card-input--front {
          background-color : #E0E0E0 !important
      }
      `}
      </style>
      <div>
        {" "}
        {config.header && <Header>{t(config.header)}</Header>}
        {formInstances.map((formInstance, formIndex) => (
          <div key={formIndex} style={{ marginBottom: "20px" }}>
            <div
              style={{
                borderLeft: "1.5px solid #BBBBBD",
                borderRight: "1.5px solid #BBBBBD",
                borderTop: "1.5px solid #BBBBBD",
                background: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#0B0C0C", padding: "12px 22px" }}>{`${t(config?.name)} (${
                formIndex + 1
              })`}</div>
              {formInstances.length > 1 && !disable && (
                <button
                  type="button"
                  style={{ background: "none", border: "none", padding: "12px 22px", cursor: "pointer" }}
                  onClick={() => deleteForm(formIndex)}
                >
                  <CloseBtn />
                </button>
              )}
            </div>

            <div
              style={{
                border: "1.5px solid #BBBBBD",
                padding: "20px 20px 20px 20px",
                background: "#FFFFFF",
              }}
            >
              {inputs?.map((input, inputIndex) => {
                const obj = formInstances?.[formIndex]?.[config?.key] ? formInstances[formIndex]?.[config?.key] : formInstances[formIndex];
                return (
                  <React.Fragment key={inputIndex}>
                    {input?.type === "text" && (
                      <div className="text-Input">
                        <div style={{ marginBottom: "8px" }}>
                          {t(input.label)} {input?.isOptional && <span style={{ color: "#77787B" }}>&nbsp;{t("CS_IS_OPTIONAL")}</span>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          {input?.componentInFront ? (
                            <span className="citizen-card-input citizen-card-input--front">{input?.componentInFront}</span>
                          ) : null}
                          <TextInput
                            t={t}
                            className="field desktop-w-full"
                            key={input?.key}
                            name={input.name}
                            value={obj?.[input?.name] ? obj?.[input?.name] : ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const regex = input?.validation?.pattern;
                              if (input?.key === "emailId") {
                                if (newValue) {
                                  if (!input?.validation?.pattern?.test(newValue)) {
                                    setError(`${input?.key}_${formIndex}`, {
                                      message: t(input?.validation?.errMsg) || "Invalid Email",
                                    });
                                  } else {
                                    clearErrors(`${input?.key}_${formIndex}`);
                                  }
                                } else {
                                  clearErrors(`${input?.key}_${formIndex}`);
                                }
                                handleChange(e, input, formIndex);
                              } else if (!regex || newValue === "" || new RegExp(regex).test(newValue)) {
                                handleChange(e, input, formIndex);
                              }
                            }}
                            disable={input?.isDisabled}
                            isRequired={input?.validation?.isRequired}
                            pattern={input?.validation?.pattern}
                            errMsg={input?.validation?.errMsg}
                            maxlength={input?.validation?.maxLength}
                            minlength={input?.validation?.minLength}
                            title={input?.validation?.title}
                          />
                        </div>
                      </div>
                    )}
                    {input?.type === "infoBox" && (
                      <div style={{ marginBottom: "24px" }}>
                        <div className="custom-note-main-div">
                          <div className="custom-note-heading-div">
                            <CustomErrorTooltip message={t("")} showTooltip={Boolean(input?.infoTooltipMessage) || input?.showTooltip} />
                            <h2>{t(input?.infoHeader)}</h2>
                          </div>
                          <div className="custom-note-info-div" style={{ display: "flex", alignItems: "center" }}>
                            {<p>{t(input?.infoText)}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    {input?.component === "SelectMultiUpload" && (
                      <div style={{ marginBottom: "20px" }}>
                        <SelectCustomDragDrop
                          config={input}
                          t={t}
                          onSelect={(value, inputDocs) => uploadedDocs(value, inputDocs, input.key, formIndex)}
                          formData={formInstances[formIndex]?.[config?.key]}
                          errors={errors}
                          setError={setError}
                          clearErrors={clearErrors}
                        />
                      </div>
                    )}
                    {input?.type === "dropdown" && (
                      <div>
                        <div style={{ marginBottom: "8px" }}>{t(input.label)}</div>
                        <CustomDropdown
                          t={t}
                          label={input.key}
                          type={input.type}
                          value={obj?.[input?.key] ? obj?.[input?.key] : {}}
                          onChange={(e) => {
                            setValue(e, input.key, input, formIndex);
                          }}
                          key={input.key}
                          config={input.populators}
                        />
                      </div>
                    )}
                    {errors[`${input?.key}_${formIndex}`] && (
                      <CardLabelError style={{ width: "70%", marginLeft: "30%", fontSize: "12px" }}>
                        {errors[`${input?.key}_${formIndex}`]?.message
                          ? errors[`${input?.key}_${formIndex}`]?.message
                          : t(errors[`${input?.key}_${formIndex}`]) || t(input.error)}
                      </CardLabelError>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!disable && (
        <button type="button" onClick={addAnotherForm} style={{ background: "none", fontSize: "16px", fontWeight: 700, color: "#007E7E" }}>
          {formInstances.length < 1 ? `+ ${t("ADD_SUBMISSION_DOCUMENTS")}` : `+ ${t("ADD_ANOTHER")}`}
        </button>
      )}
    </React.Fragment>
  );
};

export default SuretyComponent;
