import { Button, CloseSvg, FormComposerV2, Modal, Loader } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useMemo, useRef, useState } from "react";
import addPartyConfig from "../../configs/AddNewPartyConfig.js";
import { useTranslation } from "react-i18next";
import SelectCustomNote from "@egovernments/digit-ui-module-dristi/src/components/SelectCustomNote.js";
import { Urls } from "../../hooks/services/Urls.js";

const AddParty = ({ onCancel, onAddSuccess, caseDetails, tenantId, hearing, refetchHearing }) => {
  const { t } = useTranslation();
  const DRISTIService = Digit?.ComponentRegistryService?.getComponent("DRISTIService");
  const [formConfigs, setFormConfigs] = useState([addPartyConfig(1)]);
  const [aFormData, setFormData] = useState([{}]);
  const setFormErrors = useRef([]);
  const [isPartyAdding, setIsPartyAdding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fieldLabelMap = {
    partyType: "Party Type",
    partyName: "Party Name",
    phoneNumber: "Phone Number",
    emailId: "Email ID",
    address: "Address",
    additionalDetails: "Additional Details",
  };

  const { mutateAsync: updateAttendees } = Digit.Hooks.useCustomAPIMutationHook({
    url: Urls.hearing.hearingUpdateTranscript,
    params: { applicationNumber: "", cnrNumber: "" },
    body: { tenantId, hearingType: "", status: "" },
    config: {
      mutationKey: "addAttendee",
    },
  });

  const CloseBtn = (props) => {
    return (
      <div onClick={props.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  // check if labelchildren is optional then change it to span with color #77787B
  useMemo(() => {
    formConfigs.forEach((config) => {
      config.body.forEach((body) => {
        if (body.labelChildren === "optional") {
          body.labelChildren = <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>;
        }
      });
    });
  }, [formConfigs, t]);

  const handleAddParty = () => {
    const newConfig = addPartyConfig(formConfigs.length + 1);
    setFormConfigs([...formConfigs, newConfig]);
    setFormData((prev) => [...prev, {}]);
  };

  const handleRemoveParty = () => {
    if (formConfigs.length > 1) {
      setFormConfigs(formConfigs.slice(0, -1));
    }
    if (aFormData.length > 1) {
      setFormData(aFormData.slice(0, -1));
    }
  };

  const validateFormData = (data, index) => {
    const errors = {};
    if (!data["partyName" + index] || !/^[a-zA-Z\s]+$/.test(data["partyName" + index])) errors["partyName" + index] = "Party name is required";
    if (!data["partyType" + index]) errors["partyType" + index] = "Party type is required";
    const phone = data["phoneNumber" + index];
    if (phone && !/^\d{10}$/.test(phone)) {
      errors["phoneNumber" + index] = "Phone number is invalid";
    }
    const email = data["emailId" + index];
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors["emailId" + index] = "Email is invalid";
    }
    if (!data["address" + index]) errors["address" + index] = "Address is required";
    return errors;
  };

  const handleSubmit = (e) => {
    e?.stopPropagation();
    e?.preventDefault();

    let hasErrors = false;

    aFormData.forEach(({ data }, index) => {
      const errors = validateFormData(data, index + 1);
      if (Object.keys(errors).length > 0) {
        hasErrors = true;
        Object.entries(errors).forEach(([errorKey, value]) => {
          setFormErrors.current[index](errorKey, value);
        });
      }
    });

    if (hasErrors) return;

    const collectedData = aFormData.map(({ data }) => {
      const entry = {};
      Object.entries(data).forEach(([key, value]) => {
        entry[key] = typeof value === "object" && value?.name ? value.name : value;
      });
      return entry;
    });

    setPreviewData(collectedData);
    setShowConfirmModal(true);
  };

  const confirmAndSubmit = (e) => {
    setIsPartyAdding(true);
    e?.stopPropagation();
    e?.preventDefault();

    const cleanedData = aFormData.map(({ data }) => {
      const newData = {};
      Object.keys(data).forEach((key) => {
        const newKey = key.replace(/\d+$/, "");
        if (newKey === "partyType") {
          newData[newKey] = data[key].name;
        } else {
          newData[newKey] = data[key];
        }
      });
      newData.uuid = generateUUID();
      return newData;
    });
    setIsPartyAdding(false);
    onAdd(cleanedData)
      .catch(console.error)
      .then(() => {
        onAddSuccess();
        onCancel();
        setShowConfirmModal(false);
      });
  };

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
  const onAdd = async (cleanedData) => {
    const newWitnesses = cleanedData.map((data) => {
      return {
        isenabled: true,
        displayindex: 0,
        data: {
          emails: { emailId: [data.emailId], textFieldValue: "" },
          firstName: data.partyName,
          lastName: "",
          phonenumbers: {
            mobileNumber: [data.phoneNumber],
            textFieldValue: "",
          },
          addressDetails: [{ addressDetails: data?.address }],
          witnessAdditionalDetails: {
            text: data.additionalDetails,
          },
          uuid: data.uuid,
        },
      };
    });

    const witnessDetails = caseDetails.additionalDetails?.witnessDetails
      ? [...caseDetails.additionalDetails?.witnessDetails?.formdata, ...newWitnesses]
      : [...newWitnesses];

    await DRISTIService.addWitness(
      {
        tenantId,
        caseFilingNumber: caseDetails.filingNumber,
        additionalDetails: {
          ...caseDetails.additionalDetails,
          witnessDetails: {
            formdata: witnessDetails,
          },
        },
      },
      tenantId
    );

    if (hearing) {
      const updatedHearing = structuredClone(hearing);
      updatedHearing.attendees = updatedHearing.attendees || [];
      updatedHearing.attendees.push(
        ...newWitnesses.map((witness) => {
          return {
            name: [witness.data.firstName, witness.data.lastName].join(" "),
            type: "Witness",
            wasPresent: false,
            isOnline: false,
          };
        })
      );

      await updateAttendees({ body: { hearing: updatedHearing } });
      refetchHearing?.();
    }
  };

  const onFormValueChange = useCallback(
    (formData, index) => {
      if (JSON.stringify(formData) !== JSON.stringify(aFormData[index].data)) {
        setFormData((prevData) => prevData.map((item, i) => (i === index ? { ...item, data: formData } : item)));
      }
    },
    [aFormData]
  );

  return (
    <React.Fragment>
      <Modal
        popupStyles={{
          width: "60%",
          minWidth: "600px",
          position: "absolute",
          height: "calc(100% - 100px)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          justify: "space-between",
        }}
        popupModuleMianStyles={{
          padding: 0,
          margin: "0px",
          height: "calc(100% - 100px)",
          overflowY: "auto",
        }}
        headerBarMain={<h1 className="heading-m">{t("ADD_NEW_PARTY")}</h1>}
        headerBarEnd={<CloseBtn onClick={onCancel} />}
        // actionCancelLabel={t("HEARING_BACK")}
        // actionCancelOnSubmit={onCancel}
        actionSaveLabel={t("HEARING_ADD")}
        actionSaveOnSubmit={handleSubmit}
      >
        <div style={{ padding: "16px 0px 24px 0px" }}>
          <SelectCustomNote
            config={{
              populators: {
                inputs: [
                  {
                    infoHeader: "CS_PLEASE_COMMON_NOTE",
                    infoText: "NEW_PARTY_NOTE",
                    infoTooltipMessage: "NEW_PARTY_NOTE",
                    type: "InfoComponent",
                  },
                ],
              },
            }}
            t={t}
          />
        </div>
        <div className="add-party">
          {formConfigs.map((config, index) => (
            <FormComposerV2
              key={index}
              config={[config]}
              onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
                onFormValueChange(formData, index);
                if (!setFormErrors.current.hasOwnProperty(index)) {
                  setFormErrors.current[index] = setError;
                }
                if (JSON.stringify(formData) !== JSON.stringify(aFormData[index].data)) {
                  if (formData && Object.keys(formData).length !== 0) {
                    const errors = validateFormData(formData, index + 1);
                    for (const key of Object.keys(formData)) {
                      if (formData[key] && !errors.hasOwnProperty(key)) {
                        clearErrors(key);
                      }
                    }
                  }
                }
              }}
              fieldStyle={{ width: "100%" }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3rem" }}>
          <Button
            onButtonClick={handleAddParty}
            label={t("ADD_PARTY")}
            style={{
              border: "none",
              boxShadow: "none",
              marginTop: "10px",
              borderColor: "#007E7E",
              width: "28%",
              backgroundColor: "#fff",
            }}
            textStyles={{
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "18.75px",
              textAlign: "start",
              color: "#007E7E",
            }}
          />
          <Button
            onButtonClick={handleRemoveParty}
            label={t("REMOVE_PARTY")}
            style={{
              border: "none",
              boxShadow: "none",
              marginTop: "10px",
              borderColor: "#007E7E",
              width: "28%",
              backgroundColor: "#fff",
            }}
            textStyles={{
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "18.75px",
              textAlign: "end",
              color: "#007E7E",
            }}
          />
        </div>
      </Modal>
      {showConfirmModal && (
        <Modal
          popupStyles={{ width: "50%", padding: "10px" }}
          headerBarMain={<h1>{t("CONFIRM_PARTY_DETAIL")}</h1>}
          actionSaveLabel={t("CS_CONFIRM_DETAILS")}
          actionCancelLabel={t("CS_BACK")}
          actionSaveOnSubmit={confirmAndSubmit}
          actionCancelOnSubmit={() => setShowConfirmModal(false)}
        >
          {isPartyAdding ? (
            <Loader />
          ) : (
            <div style={{ padding: "1rem" }}>
              {previewData.map((data, index) => (
                <div key={index} style={{ marginBottom: "1rem", borderBottom: "1px solid #ccc" }}>
                  <h1 style={{ fontSize: "25px" }}>
                    {t("PARTY")} {index + 1}
                  </h1>
                  <ul>
                    {Object.entries(data).map(([key, value]) => {
                      const cleanedKey = key.replace(/\d+$/, "");
                      const label = fieldLabelMap[cleanedKey] || key;
                      let displayValue = value;
                      if (value && typeof value === "object") {
                        if ("text" in value) {
                          displayValue = value.text;
                        } else {
                          displayValue = JSON.stringify(value);
                        }
                      }
                      return (
                        <li key={key} style={{ marginBottom: "8px" }}>
                          <strong>{t(label)}:</strong> {displayValue || "-"}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </React.Fragment>
  );
};

export default AddParty;
