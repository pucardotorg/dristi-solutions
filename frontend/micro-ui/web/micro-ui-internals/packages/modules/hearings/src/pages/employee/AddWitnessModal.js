import { Button, CloseSvg, FormComposerV2, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import addWitnessConfig from "../../configs/AddWitnessConfig.js";
import { useTranslation } from "react-i18next";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal.js";
import isEqual from "lodash/isEqual";
import { submissionService } from "../../../../submissions/src/hooks/services/index.js";
import { SubmissionWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/submissionWorkflow.js";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min.js";
import { runComprehensiveSanitizer } from "@egovernments/digit-ui-module-dristi/src/Utils/index.js";
import { formatName } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/EfilingValidationUtils.js";
import { getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils/index.js";

const AddWitnessModal = ({ activeTab, tenantId, onCancel, caseDetails, isEmployee, showToast, onAddSuccess, style }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const DRISTIService = Digit?.ComponentRegistryService?.getComponent("DRISTIService");
  const [formConfigs, setFormConfigs] = useState([addWitnessConfig(1)]);
  const [witnessFormList, setWitnessFormList] = useState([{}]);
  const userInfo = Digit.UserService.getUser()?.info;
  const userRoles = userInfo?.roles?.map((role) => role?.code);
  const isCitizen = userRoles?.includes("CITIZEN");
  const setFormErrors = useRef([]);
  const [isWitnessAdding, setIsWitnessAdding] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [currentFormErrors, setCurrentFormErrors] = useState({});
  const [addressErrors, setAddressError] = useState([]);
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);

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

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const cleanString = (input) => {
    return input
      .replace(/\b(null|undefined)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const { data: individualData } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [authorizedUuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    authorizedUuid
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

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

  const addressConfig = useMemo(() => {
    const addressConfig = formConfigs?.[0]
      ?.find((conf) => conf?.body?.some((b) => b?.key === "addressDetails"))
      ?.body.find((b) => b?.key === "addressDetails");
    return addressConfig;
  }, [formConfigs]);

  const pipComplainants = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("complainant"))
      ?.filter(
        (litigant) =>
          !caseDetails?.representatives?.some((representative) =>
            representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
          )
      );
  }, [caseDetails]);

  const pipAccuseds = useMemo(() => {
    return caseDetails?.litigants
      ?.filter((litigant) => litigant.partyType.includes("respondent"))
      ?.filter(
        (litigant) =>
          !caseDetails?.representatives?.some((representative) =>
            representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
          )
      );
  }, [caseDetails]);

  const complainantsList = useMemo(() => {
    const loggedinUserUuid = authorizedUuid;
    // If logged in person is an advocate
    const isAdvocateLoggedIn = caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === loggedinUserUuid);
    const isPipLoggedIn = pipComplainants?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);
    const accusedLoggedIn = pipAccuseds?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);

    if (isAdvocateLoggedIn) {
      return isAdvocateLoggedIn?.representing?.map((r) => {
        return {
          code: r?.additionalDetails?.fullName,
          name: r?.additionalDetails?.fullName,
          uuid: r?.additionalDetails?.uuid,
        };
      });
    } else if (isPipLoggedIn) {
      return [
        {
          code: isPipLoggedIn?.additionalDetails?.fullName,
          name: isPipLoggedIn?.additionalDetails?.fullName,
          uuid: isPipLoggedIn?.additionalDetails?.uuid,
        },
      ];
    } else if (accusedLoggedIn) {
      return [
        {
          code: accusedLoggedIn?.additionalDetails?.fullName,
          name: accusedLoggedIn?.additionalDetails?.fullName,
          uuid: accusedLoggedIn?.additionalDetails?.uuid,
        },
      ];
    }
    return [];
  }, [caseDetails, pipComplainants, pipAccuseds, userInfo]);

  const handleAddParty = () => {
    const newConfig = addWitnessConfig(formConfigs.length + 1);
    setFormConfigs([...formConfigs, newConfig]);
    setWitnessFormList((prev) => [...prev, {}]);
  };

  const handleRemoveParty = () => {
    if (formConfigs.length > 1) {
      setFormConfigs(formConfigs.slice(0, -1));
    }
    if (witnessFormList.length > 1) {
      setWitnessFormList(witnessFormList.slice(0, -1));
    }
  };

  const handleReviewDetails = (e) => {
    e?.stopPropagation();
    e?.preventDefault();

    // Filter out entries with data
    const validFormData = witnessFormList?.filter((item) => item?.data);

    // Validate required fields
    for (const { data } of validFormData) {
      if (!(data?.firstName || data?.witnessDesignation)) {
        setShowErrorToast({ label: t("AT_LEAST_ONE_OUT_OF_FIRST_NAME_AND_WITNESS_DESIGNATION_IS_MANDATORY"), error: true });
        return;
      }
    }
    setShowConfirmModal(true);
  };

  const confirmAndSubmit = async (e) => {
    setIsWitnessAdding(true);
    e?.stopPropagation();
    e?.preventDefault();

    try {
      if (isEmployee) {
        const newWitnesses = witnessFormList?.map((data) => {
          return {
            ...data?.data,
            ownerType: "-",
            createdTime: new Date().getTime(),
            uniqueId: generateUUID(),
          };
        });
        await DRISTIService.addNewWitness(
          {
            tenantId,
            caseFilingNumber: caseDetails?.filingNumber,
            witnessDetails: newWitnesses,
          },
          { tenantId: tenantId }
        ).then(() => {
          if (activeTab === "Parties") {
            history.replace(
              `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${caseDetails?.filingNumber}&tab=Parties`,
              {
                newWitnesToast: true,
              }
            );
          } else {
            showToast({ message: t("NEW_WITNESS_SUCCESSFULLY_ADDED"), error: false });
          }
        });
      } else {
        const litigant =
          caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === authorizedUuid)?.representing?.[0] ||
          caseDetails?.litigants?.find((litigant) => litigant?.additionalDetails?.uuid === authorizedUuid);

        const ownerType = litigant?.partyType?.includes("complainant") ? "COMPLAINANT" : "ACCUSED";
        const newWitnesses = witnessFormList?.map((data) => {
          return {
            data: {
              ...data?.data,
              ownerType,
              createdTime: new Date().getTime(),
            },
            isenabled: true,
            displayindex: 0,
            uniqueId: generateUUID(),
          };
        });
        await submissionService
          .createApplication(
            {
              tenantId,
              application: {
                tenantId,
                filingNumber: caseDetails?.filingNumber,
                cnrNumber: caseDetails?.cnrNumber,
                cmpNumber: caseDetails?.cmpNumber,
                caseId: caseDetails?.id,
                createdDate: new Date().getTime(),
                applicationType: "ADDING_WITNESSES",
                isActive: true,
                asUser: authorizedUuid, // Sending uuid of the main advocate in case clerk/jr. adv is creating doc.
                createdBy: userUuid,
                statuteSection: { tenantId },
                additionalDetails: {
                  witnessDetails: newWitnesses,
                  onBehalfOfName: complainantsList,
                  advocateIndividualId: individualId,
                  owner: cleanString(userInfo?.name),
                  formdata: {
                    submissionType: {
                      code: "APPLICATION",
                      name: "APPLICATION",
                    },
                    applicationType: {
                      name: "APPLICATION_TYPE_ADDING_WITNESSES",
                      type: "ADDING_WITNESSES",
                      isActive: true,
                    },
                  },
                },
                onBehalfOf: complainantsList?.map((item) => item?.uuid),
                comment: [],
                status: caseDetails?.status,

                workflow: {
                  action: SubmissionWorkflowAction.SUBMIT,
                },
              },
            },
            { tenantId }
          )
          .then((response) => {
            history.push(
              `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/submissions/submissions-create?filingNumber=${
                caseDetails?.filingNumber
              }&applicationNumber=${response?.application?.applicationNumber}`
            );
          });
      }
      setShowConfirmModal(false);
      onAddSuccess();
    } catch (error) {
      console.error(error);
      setShowErrorToast({ label: t("ERROR_ADDING_WITNESS"), error: true });
    } finally {
      setIsWitnessAdding(false);
    }
  };

  const checkNameValidation = ({ formData, setValue, clearErrors, formState }) => {
    const formDataCopy = structuredClone(formData);
    for (const key in formDataCopy) {
      if (["firstName", "middleName", "lastName", "witnessDesignation"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
        const oldValue = formDataCopy[key];
        let value = oldValue;
        if (typeof value === "string") {
          if (value.length > 100) {
            value = value.slice(0, 100);
          }

          let updatedValue = formatName(value);
          if (updatedValue !== oldValue) {
            const element = document.querySelector(`[name="${key}"]`);
            const start = element?.selectionStart;
            const end = element?.selectionEnd;
            setValue(key, updatedValue);
            setTimeout(() => {
              element?.setSelectionRange(start, end);
            }, 0);
          }
          if (updatedValue !== "" && ["firstName", "witnessDesignation"].includes(key)) {
            if (formState?.errors?.firstName) {
              clearErrors("firstName");
            }
            if (formState?.errors?.witnessDesignation) {
              clearErrors("witnessDesignation");
            }
          }
        }
      }
      if (["witnessAge"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
        const oldValue = formDataCopy[key];
        let value = oldValue;

        let updatedValue = value?.replace(/\D/g, "");
        // Convert to number and restrict value to 150
        if (updatedValue && parseInt(updatedValue, 10) > 150) {
          updatedValue = updatedValue.substring(0, updatedValue.length - 1); // Disallow the extra digit
        }
        if (updatedValue !== oldValue) {
          const element = document?.querySelector(`[name="${key}"]`);
          const start = element?.selectionStart;
          const end = element?.selectionEnd;
          setValue(key, updatedValue);
          setTimeout(() => {
            element?.setSelectionRange(start, end);
          }, 0);
        }
      }
    }
  };

  const checkDuplicateMobileEmailValidation = ({ formData, setError, clearErrors, formdata, caseDetails }) => {
    const complainantMobileNumbersArray =
      caseDetails?.additionalDetails?.complainantDetails?.formdata
        .filter((data) => {
          if (data?.data?.complainantVerification?.mobileNumber) {
            return true;
          } else return false;
        })
        .map((data) => {
          return data?.data?.complainantVerification?.mobileNumber;
        }) || [];
    const respondentMobileNumbersArray =
      caseDetails?.additionalDetails?.respondentDetails?.formdata
        .filter((data) => {
          if (data?.data?.phonenumbers?.mobileNumber && data?.data?.phonenumbers?.mobileNumber?.length > 0) {
            return true;
          } else return false;
        })
        ?.map((data) => {
          return data?.data?.phonenumbers?.mobileNumber;
        })
        ?.reduce((acc, curr) => acc.concat(curr), []) || [];

    const witnessMobileNumbersArray =
      caseDetails?.witnessDetails
        ?.filter((data) => {
          if (data?.phonenumbers?.mobileNumber && data?.phonenumbers?.mobileNumber?.length > 0) {
            return true;
          } else return false;
        })
        ?.map((data) => {
          return data?.phonenumbers?.mobileNumber;
        })
        ?.reduce((acc, curr) => acc.concat(curr), []) || [];

    const advocateMobileNumbersArray =
      caseDetails?.additionalDetails?.advocateDetails?.formdata
        ?.filter((data) => {
          return data?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails?.length > 0;
        })
        ?.map((data) => {
          return data?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails
            ?.filter((advocate) => advocate?.advocateNameDetails?.advocateMobileNumber)
            ?.map((advocate) => advocate?.advocateNameDetails?.advocateMobileNumber);
        })
        ?.reduce((acc, curr) => acc.concat(curr), []) || [];

    const respondentEmailsArray =
      caseDetails?.additionalDetails?.respondentDetails?.formdata
        ?.filter((data) => {
          if (data?.data?.emails?.emailId && data?.data?.emails?.emailId?.length > 0) {
            return true;
          } else return false;
        })
        ?.map((data) => {
          return data?.data?.emails?.emailId;
        })
        ?.reduce((acc, curr) => acc.concat(curr), []) || [];

    const witnessEmailsArray =
      caseDetails?.witnessDetails
        ?.filter((data) => {
          if (data?.emails?.emailId && data?.emails?.emailId?.length > 0) {
            return true;
          } else return false;
        })
        ?.map((data) => {
          return data?.emails?.emailId;
        })
        ?.reduce((acc, curr) => acc.concat(curr), []) || [];

    const currentMobileNumber = formData?.phonenumbers?.textfieldValue;
    if (
      currentMobileNumber &&
      (complainantMobileNumbersArray.some((number) => number === currentMobileNumber) ||
        respondentMobileNumbersArray.some((number) => number === currentMobileNumber) ||
        witnessMobileNumbersArray.some((number) => number === currentMobileNumber) ||
        advocateMobileNumbersArray.some((number) => number === currentMobileNumber))
    ) {
      setError("phonenumbers", { mobileNumber: "WITNESS_MOB_NUM_CAN_NOT_BE_SAME_AS_OTHER_USER_MOB_NUM" });
    } else if (
      formdata &&
      formdata?.length > 0 &&
      formData?.phonenumbers?.textfieldValue &&
      formData?.phonenumbers?.textfieldValue?.length === 10 &&
      formdata?.some((data) => data?.data?.phonenumbers?.mobileNumber?.some((number) => number === formData?.phonenumbers?.textfieldValue))
    ) {
      setError("phonenumbers", { mobileNumber: "DUPLICATE_MOBILE_NUMBER_FOR_WITNESS" });
    } else {
      clearErrors("phonenumbers");
    }

    const currentEmail = formData?.emails?.textfieldValue;
    if (
      currentEmail &&
      (respondentEmailsArray.some((email) => email === currentEmail) || witnessEmailsArray.some((email) => email === currentEmail))
    ) {
      setError("emails", { emailId: "WITNESS_EMAIL_CAN_NOT_BE_SAME_AS_OTHER_EMAIL" });
    } else if (
      formdata &&
      formdata?.length > 0 &&
      formData?.emails?.textfieldValue &&
      formdata?.some((data) => data?.data?.emails?.emailId?.some((email) => email === formData?.emails?.textfieldValue))
    ) {
      setError("emails", { emailId: "DUPLICATE_EMAIL_ID_FOR_WITNESS" });
    } else {
      clearErrors("emails");
    }
  };

  function validateAddressDetails(addressDetails = [], config, formIndex) {
    const fieldConfigs = config?.populators?.inputs || [];

    setAddressError((prevErrors = {}) => {
      const updatedErrors = { ...prevErrors };
      const formErrors = [];

      addressDetails?.forEach((addressItem, addressIndex) => {
        const fieldErrors = {};
        const address = addressItem?.addressDetails || {};

        fieldConfigs?.forEach((field) => {
          const { name, validation = {} } = field;
          const value = address?.[name];

          if (!value) return;

          if (validation?.pattern) {
            const regex = new RegExp(validation?.pattern);
            if (!regex?.test(value)) {
              fieldErrors[name] = validation?.errMsg;
              return;
            }
          }

          if (validation?.minlength && value?.length < validation?.minlength) {
            fieldErrors[name] = validation?.errMsg;
            return;
          }

          if (validation?.maxlength && value?.length > validation?.maxlength) {
            fieldErrors[name] = validation?.errMsg;
            return;
          }
        });

        if (Object?.keys(fieldErrors)?.length > 0) {
          formErrors[addressIndex] = fieldErrors;
        }
      });

      if (formErrors?.length > 0) {
        updatedErrors[formIndex] = formErrors;
      } else {
        delete updatedErrors[formIndex];
      }

      return updatedErrors;
    });
  }

  const onFormValueChange = useCallback(
    (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues, index) => {
      // Ensure we have valid form data
      if (!isEqual(formData, witnessFormList?.[index]?.data)) {
        runComprehensiveSanitizer({ formData, setValue });
        setWitnessFormList((prevData) => prevData?.map((item, i) => (i === index ? { ...item, data: formData } : item)));
        checkNameValidation({ formData, setValue, clearErrors, formState });
        checkDuplicateMobileEmailValidation({
          formData,
          setError,
          clearErrors,
          formdata: witnessFormList,
          caseDetails,
        });
        setCurrentFormErrors(formState?.errors || {});
        validateAddressDetails(formData?.addressDetails || [], addressConfig, index);
      }
    },
    [witnessFormList, caseDetails, addressConfig]
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
          top: style?.top || "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          justify: "space-between",
        }}
        popupModuleMianStyles={{
          padding: 0,
          margin: "0px",
          height: "calc(100% - 65px)",
          overflowY: "auto",
          maxHeight: "100%",
        }}
        headerBarMain={<h1 className="heading-m">{t("ADD_WITNESS_DETAILS")}</h1>}
        headerBarEnd={<CloseBtn onClick={onCancel} />}
        actionSaveOnSubmit={handleReviewDetails}
        isDisabled={Object?.keys(currentFormErrors)?.length > 0 || Object?.keys(addressErrors)?.length > 0}
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
                  onFormValueChange(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues, index);
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
            isDisabled={formConfigs?.length === 1 || witnessFormList?.length === 1}
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
          isDisabled={isWitnessAdding}
          isBackButtonDisabled={isWitnessAdding}
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
