import React, { useEffect, useMemo, useRef, useState } from "react";
import { CardLabelError, TextInput, CustomDropdown, Header } from "@egovernments/digit-ui-react-components";
import CustomErrorTooltip from "./CustomErrorTooltip";
import SelectCustomDragDrop from "./SelectCustomDragDrop";
import AddressBailBond from "./AddressBailBond";
import { sanitizeData } from "../Utils";

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

const SuretyComponent = ({ t, config, onSelect, formData = {}, errors, setError, clearErrors, control, watch }) => {
  const [formInstances, setFormInstances] = useState(formData?.[config?.key] || [{}, {}]);
  const initialPrefillRef = useRef(formData?.[config?.key] ? JSON.parse(JSON.stringify(formData?.[config?.key])) : []);
  const disable = config?.disable;
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);
  useEffect(() => {
    const incoming = formData?.[config?.key];
    if (Array.isArray(incoming)) {
      const hasIncoming = incoming.length > 0;
      const changed = JSON.stringify(incoming) !== JSON.stringify(formInstances);
      const hasAnyPrefill = (arr) => {
        if (!Array.isArray(arr)) return false;
        return arr.some((inst) => {
          if (!inst || typeof inst !== "object") return false;
          const baseKeys = ["name", "fatherName", "mobileNumber", "email"];
          const hasBase = baseKeys.some((k) => Boolean(inst?.[k]));
          const hasAddr = inst?.address && Object.keys(inst.address || {}).some((k) => Boolean(inst.address[k]));
          const hasIdDocs = Array.isArray(inst?.identityProof?.document) && inst.identityProof.document.length > 0;
          const hasSolvencyDocs = Array.isArray(inst?.proofOfSolvency?.document) && inst.proofOfSolvency.document.length > 0;
          const hasOtherDocs = Array.isArray(inst?.otherDocuments?.document) && inst.otherDocuments.document.length > 0;
          return hasBase || hasAddr || hasIdDocs || hasSolvencyDocs || hasOtherDocs;
        });
      };
      if (hasIncoming && changed) {
        setFormInstances(incoming.map((i) => i || {}));
      }
      if (hasIncoming) {
        const snapshotHasPrefill = hasAnyPrefill(initialPrefillRef.current);
        const incomingHasPrefill = hasAnyPrefill(incoming);
        if (!snapshotHasPrefill && incomingHasPrefill) {
          initialPrefillRef.current = JSON.parse(JSON.stringify(incoming));
        }
      }
    }
  }, [formData?.[config?.key]]);

  const addAnotherForm = () => {
    const newFormInstances = [...formInstances, {}];
    setFormInstances(newFormInstances);
    updateFormData(newFormInstances);
  };

  const updateFormData = (updatedFormInstances) => {
    onSelect(
      config.key,
      updatedFormInstances.map((instance) => instance || {})
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
    if (!updatedFormInstances[index]) {
      updatedFormInstances[index] = {};
    }
    updatedFormInstances[index][name] = value;

    setFormInstances(updatedFormInstances);
    updateFormData(updatedFormInstances);
  }

  function uploadedDocs(name, inputDocs, inputKey, index) {
    const updatedFormInstances = [...formInstances];
    if (!updatedFormInstances[index]) {
      updatedFormInstances[index] = {};
    }

    updatedFormInstances[index] = {
      ...updatedFormInstances[index],
      [name]: inputDocs,
    };

    setFormInstances(updatedFormInstances);
    updateFormData(updatedFormInstances);
  }

  const handleChange = (value, input, formIndex) => {
    setValue(value, input.key, input, formIndex);
  };

  const isInstanceLockedAt = (idx) => {
    if (!config?.lockPrefilledFields) return false;
    const prefilled = initialPrefillRef.current?.[idx] || {};
    if (!prefilled || typeof prefilled !== "object") return false;
    const baseKeys = ["name", "fatherName", "mobileNumber", "email"];
    const hasBase = baseKeys.some((k) => Boolean(prefilled?.[k]));
    const hasAddr = prefilled?.address && Object.keys(prefilled.address || {}).some((k) => Boolean(prefilled.address[k]));
    const hasIdDocs = Array.isArray(prefilled?.identityProof?.document) && prefilled.identityProof.document.length > 0;
    const hasSolvencyDocs = Array.isArray(prefilled?.proofOfSolvency?.document) && prefilled.proofOfSolvency.document.length > 0;
    const hasOtherDocs = Array.isArray(prefilled?.otherDocuments?.document) && prefilled.otherDocuments.document.length > 0;
    return hasBase || hasAddr || hasIdDocs || hasSolvencyDocs || hasOtherDocs;
  };

  return (
    <React.Fragment>
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
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#0B0C0C", padding: "12px 22px" }}>{`${t(config?.name)} ${formIndex + 1}`}</div>
              {formInstances.length > 1 && !disable && !isInstanceLockedAt(formIndex) && (
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
                const instanceLocked = isInstanceLockedAt(formIndex);

                const getAddressConfigWithDisable = () => {
                  if (!config?.lockPrefilledFields) return input;
                  const prefilledInstance = initialPrefillRef.current?.[formIndex] || {};
                  const addressPrefill = prefilledInstance?.[input?.key] || {};
                  const updatedPopInputs = (input?.populators?.inputs || []).map((addrInput) => ({
                    ...addrInput,
                    isDisabled: instanceLocked ? true : Boolean(addrInput?.isDisabled || (addrInput?.name && addressPrefill?.[addrInput?.name])),
                  }));
                  return {
                    ...input,
                    populators: {
                      ...(input?.populators || {}),
                      inputs: updatedPopInputs,
                    },
                  };
                };
                return (
                  <React.Fragment key={inputIndex}>
                    {input?.type === "text" && (
                      <div className="text-Input text-surety">
                        <div style={{ marginBottom: "8px" }}>
                          {t(input.label)} {input?.isOptional && <span style={{ color: "#77787B" }}>&nbsp;{t("CS_IS_OPTIONAL")}</span>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          {input?.componentInFront ? (
                            <span className="citizen-card-input citizen-card-input--front citizen-bail-bond">{input?.componentInFront}</span>
                          ) : null}
                          <TextInput
                            t={t}
                            className="field desktop-w-full"
                            key={input?.key}
                            name={input.name}
                            value={obj?.[input?.name] ? obj?.[input?.name] : ""}
                            onChange={(e) => {
                              const newValue = sanitizeData(e.target.value);
                              const regex = input?.validation?.pattern;
                              if (input?.key === "email") {
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
                                handleChange(newValue, input, formIndex);
                              } else if (!regex || newValue === "" || new RegExp(regex).test(newValue)) {
                                handleChange(newValue, input, formIndex);
                              }
                            }}
                            disable={input?.isDisabled || formIndex < config?.formDisbalityCount || instanceLocked}
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
                          formData={formInstances[formIndex]}
                          errors={errors}
                          setError={setError}
                          clearErrors={clearErrors}
                          formDisbalityCount={formIndex < config?.formDisbalityCount}
                        />
                      </div>
                    )}
                    {input?.component === "AddressBailBond" && (
                      <div>
                        <AddressBailBond
                          config={input}
                          t={t}
                          onSelect={(key, data) => {
                            setValue(data, key, input, formIndex);
                          }}
                          formData={formInstances[formIndex]?.[input.key]}
                          errors={errors}
                          setError={setError}
                          clearErrors={clearErrors}
                          control={control}
                          watch={watch}
                          formDisbalityCount={formIndex < config?.formDisbalityCount}
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
          {formInstances.length < 1 ? `+ ${t("ADD_SUBMISSION_DOCUMENTS")}` : `+ ${t("ADD_ANOTHER_SURETY")}`}
        </button>
      )}
    </React.Fragment>
  );
};

export default SuretyComponent;
