import { Button, CloseSvg, FormComposerV2, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import addWitnessConfig from "../../configs/AddWitnessConfig.js";
import { useTranslation } from "react-i18next";
import { Urls } from "../../hooks/services/Urls.js";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal.js";
import isEqual from "lodash/isEqual";

const AddWitnessModal = ({ onCancel, onAddSuccess, caseDetails, tenantId, hearing, refetchHearing }) => {
  const { t } = useTranslation();
  const DRISTIService = Digit?.ComponentRegistryService?.getComponent("DRISTIService");
  const [formConfigs, setFormConfigs] = useState([addWitnessConfig(1)]);
  const [aFormData, setFormData] = useState([{}]);
  const setFormErrors = useRef([]);
  const [isWitnessAdding, setIsWitnessAdding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [showErrorToast, setShowErrorToast] = useState(null);

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

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

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
      config.forEach((conf) => {
        conf.body.forEach((body) => {
          if (body.labelChildren === "optional") {
            body.labelChildren = <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>;
          }
        });
      });
    });
  }, [formConfigs, t]);

  const handleAddParty = () => {
    const newConfig = addWitnessConfig(formConfigs.length + 1);
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

  //   const validateFormData = (data, index) => {
  //     const errors = {};
  //     if (!data["partyName" + index] || !/^[a-zA-Z\s]+$/.test(data["partyName" + index])) errors["partyName" + index] = "Party name is required";
  //     if (!data["partyType" + index]) errors["partyType" + index] = "Party type is required";
  //     const phone = data["phoneNumber" + index];
  //     if (phone && !/^\d{10}$/.test(phone)) {
  //       errors["phoneNumber" + index] = "Phone number is invalid";
  //     }
  //     const email = data["emailId" + index];
  //     if (email && !/\S+@\S+\.\S+/.test(email)) {
  //       errors["emailId" + index] = "Email is invalid";
  //     }
  //     if (!data["address" + index]) errors["address" + index] = "Address is required";
  //     return errors;
  //   };

  const handleSubmit = (e) => {
    e?.stopPropagation();
    e?.preventDefault();

    // Filter out entries with data
    const validFormData = aFormData.filter((item) => item.data);

    // Validate required fields
    for (const { data } of validFormData) {
      if (!(data?.firstName || data?.witnessDesignation)) {
        setShowErrorToast({ label: t("AT_LEAST_ONE_OUT_OF_FIRST_NAME_AND_WITNESS_DESIGNATION_IS_MANDATORY"), error: true });
        return;
      }
    }

    const collectedData = validFormData.map(({ data }) => {
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
    setIsWitnessAdding(true);
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
    setIsWitnessAdding(false);
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
      // Ensure we have valid form data
      if (!isEqual(formData, aFormData?.[index]?.data)) {
        setFormData((prevData) => prevData?.map((item, i) => (i === index ? { ...item, data: formData } : item)));
      }
    },
    [aFormData]
  );

  return (
    <React.Fragment>
      <Modal
        className={"witness-details"}
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
          height: "calc(100% - 65px)",
          overflowY: "auto",
        }}
        headerBarMain={<h1 className="heading-m">{t("ADD_WITNESS_DETAILS")}</h1>}
        headerBarEnd={<CloseBtn onClick={onCancel} />}
        actionSaveOnSubmit={handleSubmit}
        actionSaveLabel={t("REVIEW_WITNESS_DETAILS")}
        actionCancelLabel={t("WITNESS_CANCEL")}
        actionCancelOnSubmit={onCancel}
      >
        <div className="witness-details-form-style">
          {formConfigs.map((config, index) => (
            <React.Fragment key={index}>
              <div style={{ padding: "16px 28px", fontSize: "22px", fontWeight: "bold" }}>{`${t("WITNESS")} ${index + 1}`}</div>
              <FormComposerV2
                key={`witness-modal-${index}`}
                config={config}
                onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
                  onFormValueChange(formData, index);
                  if (!setFormErrors.current.hasOwnProperty(index)) {
                    setFormErrors.current[index] = setError;
                  }
                }}
                fieldStyle={{ width: "100%" }}
              />
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0px 24px" }}>
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
          headerBarMain={<Heading label={t("CONFIRM_ADD_WITNESS")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowConfirmModal(false)} />}
          actionCancelLabel={t("WITNESS_CONFIRM_CANCEL")}
          actionCancelOnSubmit={() => setShowConfirmModal(false)}
          actionSaveLabel={t("WITNESS_CONFIRM")}
          actionSaveOnSubmit={confirmAndSubmit}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            isWitnessAdding ? (
              <Loader />
            ) : (
              <div className="delete-warning-text">
                <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_ADD_WITNESS_TEXT")}</h3>
              </div>
            )
          }
        />
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default AddWitnessModal;
