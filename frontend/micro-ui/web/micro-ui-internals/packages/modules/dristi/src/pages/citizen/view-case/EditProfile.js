import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";
import { CloseSvg, FormComposerV2, Header, Loader, Modal, Toast } from "@egovernments/digit-ui-react-components";
import { extractCodeFromErrorMsg, extractValue, OutlinedInfoIcon } from "../FileCase/EFilingCases";
import useGetAllCasesConfig from "../../../hooks/dristi/useGetAllCasesConfig";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import ReactTooltip from "react-tooltip";
import { RightArrow } from "../../../icons/svgIndex";
import isEqual from "lodash/isEqual";
import { DocumentUploadError } from "../../../Utils/errorUtil";
import { useToast } from "../../../components/Toast/useToast";
import { documentLabels, getFilingType, runComprehensiveSanitizer } from "../../../Utils";
import {
  editCheckDuplicateMobileEmailValidation,
  editCheckNameValidation,
  editComplainantValidation,
  editRespondentValidation,
  editShowToastForComplainant,
  updateProfileData,
} from "./editProfileValidationUtils";
import { editComplainantDetailsConfig } from "./Config/editComplainantDetailsConfig";
import { editRespondentConfig } from "./Config/editRespondentConfig";
import { getAdvocates } from "../FileCase/EfilingValidationUtils";
import { DRISTIService } from "../../../services";
import { Urls } from "../../../hooks";

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

const EditProfile = ({ path }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const toast = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [formdata, setFormdata] = useState([{ isenabled: true, data: { reasonForChange: "" }, displayindex: 0 }]);
  const setFormErrors = useRef(null);
  const setFormState = useRef(null);
  const resetFormData = useRef(null);
  const setFormDataValue = useRef(null);
  const clearFormDataErrors = useRef(null);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showConfirmSubmission, setShowConfirmSubmission] = useState(false);
  const [complainantIdProofFileName, setComplainantIdProofFileName] = useState("");
  const [isLoader, setIsLoader] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const selected = urlParams.get("type") || "";
  const caseId = urlParams.get("caseId");
  const isAdvocate = urlParams.get("isAdvocate") === "true";
  const editorUuid = urlParams.get("editorUuid");
  const uniqueId = urlParams.get("uniqueId");
  const userInfo = Digit.UserService.getUser()?.info;
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);

  const { data: caseData, refetch: refetchCaseData, isLoading } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
          defaultFields: false,
        },
      ],
      tenantId,
    },
    {},
    `dristi-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData, caseId, selected, uniqueId]
  );

  const { data: individualData } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    userInfo?.uuid
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);
  const userTypeCitizen = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [
    individualData?.Individual,
  ]);

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(userInfo?.uuid)), [
    allAdvocates,
    userInfo?.uuid,
  ]);
  const onBehalfOfLitigent = useMemo(() => caseDetails?.litigants?.find((item) => item?.additionalDetails?.uuid === onBehalfOfuuid), [
    caseDetails,
    onBehalfOfuuid,
  ]);
  const sourceType = useMemo(
    () => (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("complainant") ? "COMPLAINANT" : !isCitizen ? "COURT" : "ACCUSED"),
    [onBehalfOfLitigent, isCitizen]
  );

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "Application"), [filingTypeData?.FilingType]);

  // useEffect(() => {
  // if (selected === "complainantDetails") {
  //   const currentComplainant = caseDetails?.additionalDetails?.[selected]?.formdata?.find(
  //     (item, index) => item?.data?.complainantVerification?.individualDetails?.individualId === uniqueId
  //   );
  //   if (currentComplainant?.data) {
  //     if(complainantType?.code === "INDIVIDUAL") {
  //     }
  //     const updatedData = structuredClone(currentComplainant?.data);
  //     updatedData.reasonForChange = updatedData?.updatedData || "";
  //     let updatedFormData = structuredClone(formdata);
  //     updatedFormData[0].data = updatedData;
  //     if (!isEqual(updatedFormData, formdata?.[0]?.data)) {
  //       setFormdata(updatedFormData);
  //     }
  //   }
  // }
  // if (selected === "respondentDetails") {
  //   const currentRespondent = caseDetails?.additionalDetails?.[selected]?.formdata?.find(
  //     (item, index) => item?.data?.respondentVerification?.individualDetails?.individualId === uniqueId || item?.uniqueId === uniqueId
  //   );
  //   if (currentRespondent?.data) {
  //     const updatedData = structuredClone(currentRespondent?.data);
  //     updatedData.reasonForChange = "";
  //     let updatedFormData = structuredClone(formdata);
  //     updatedFormData[0].data = updatedData;
  //     if (!isEqual(updatedFormData, formdata?.[0]?.data)) {
  //       setFormdata(updatedFormData);
  //     }
  //   }
  // }
  // }, [caseDetails, selected, uniqueId]);

  const state = useMemo(() => caseDetails?.status, [caseDetails]);

  useEffect(() => {
    // Check if user has access
    const hasAccess = sessionStorage.getItem("editProfileAccess");
    if (!hasAccess) {
      history.replace(`/${window.contextPath}/citizen/dristi/home`);
      return;
    }

    // if (!type || !uniqueId) {
    //   history.replace(`/${window.contextPath}/citizen/dristi/home/view-case`);
    //   return;
    // }

    return () => {
      sessionStorage.removeItem("editProfileAccess");
    };
  }, [history, location]);

  const { data: caseDetailsConfig, isLoading: isGetAllCasesLoading } = useGetAllCasesConfig();

  const pageConfig = useMemo(() => {
    if (selected === "complainantDetails") {
      return editComplainantDetailsConfig;
    } else if (selected === "respondentDetails") {
      return editRespondentConfig;
    }
    return null;
  }, [caseDetailsConfig, selected]);

  const closeToast = () => {
    setShowErrorToast(false);
    setErrorMsg("");
    // setSuccessToast((prev) => ({
    //   ...prev,
    //   showSuccessToast: false,
    //   successMsg: "",
    // }));
  };

  useEffect(() => {
    let timer;
    if (showErrorToast) {
      timer = setTimeout(() => {
        closeToast();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [showErrorToast]);

  const formConfig = useMemo(() => {
    if (selected === "complainantDetails") {
      return editComplainantDetailsConfig?.formconfig;
    } else if (selected === "respondentDetails") {
      return editRespondentConfig?.formconfig;
    }
    return null;
  }, [pageConfig?.formconfig]);

  const multiUploadList = useMemo(
    () =>
      formConfig?.flatMap((config) =>
        config?.body
          ?.filter((item) => ["SelectCustomDragDrop"].includes(item.component))
          ?.map((item) => {
            const { key } = item;
            const fieldType = item?.populators?.inputs?.[0]?.name;
            return { key, fieldType };
          })
      ),
    [formConfig]
  );

  const isDependentEnabled = useMemo(() => {
    let result = false;
    formConfig.forEach((config) => {
      if (config?.body && Array.isArray(config?.body)) {
        config?.body?.forEach((bodyItem) => {
          if (bodyItem?.populators?.isDependent) {
            result = true;
          }
        });
      }
    });
    return result;
  }, [formConfig]);

  const modifiedFormConfig = useMemo(() => {
    let modifiedFormData = formdata;
    if (!isDependentEnabled) {
      modifiedFormData = modifiedFormData.map(() => {
        return formConfig.map((config) => {
          return {
            ...config,
            body: config?.body.map((body) => {
              if (body?.labelChildren === "optional" && Object.keys(caseDetails?.additionalDetails?.scrutiny?.data || {}).length === 0) {
                body.labelChildren = <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>;
              }

              if (body?.labelChildren === "OutlinedInfoIcon" && Object.keys(caseDetails?.additionalDetails?.scrutiny?.data || {}).length === 0) {
                body.labelChildren = (
                  <React.Fragment>
                    <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`${body.label}-tooltip`}>
                      {" "}
                      <OutlinedInfoIcon />
                    </span>
                    <ReactTooltip id={`${body.label}-tooltip`} place="bottom" content={body?.tooltipValue || ""}>
                      {t(body?.tooltipValue || body.label)}
                    </ReactTooltip>
                  </React.Fragment>
                );
              }

              if ("inputs" in body?.populators && Array.isArray(body?.populators.inputs)) {
                return {
                  ...body,
                  populators: {
                    inputs: body?.populators.inputs.map((input) => {
                      if (input?.validation) {
                        if (
                          input?.validation?.pattern &&
                          input?.validation?.pattern?.moduleName &&
                          input?.validation?.pattern?.masterName &&
                          input?.validation?.pattern?.patternType
                        ) {
                          input.validation = {
                            ...input.validation,
                            pattern: Digit?.Customizations?.[input?.validation?.pattern?.masterName]?.[input?.validation?.pattern?.moduleName](
                              input?.validation?.pattern?.patternType
                            ),
                          };
                        }
                      }
                      return {
                        ...input,
                      };
                    }),
                  },
                };
              } else if ("populators" in body) {
                const validationUpdate = {};
                if (
                  body?.populators?.validation &&
                  body?.populators?.validation?.pattern &&
                  body?.populators?.validation?.pattern?.moduleName &&
                  body?.populators?.validation?.pattern?.masterName &&
                  body?.populators?.validation?.pattern?.patternType
                ) {
                  validationUpdate.pattern = {
                    value: Digit?.Customizations?.[body?.populators?.validation?.pattern?.masterName]?.[
                      body?.populators?.validation?.pattern?.moduleName
                    ](body?.populators?.validation?.pattern?.patternType),
                    message: body?.populators?.validation?.pattern?.message,
                  };
                }

                if (
                  body?.populators?.validation &&
                  body?.populators?.validation?.max &&
                  body?.populators?.validation?.max?.moduleName &&
                  body?.populators?.validation?.max?.masterName &&
                  body?.populators?.validation?.max?.patternType
                ) {
                  validationUpdate.max = Digit?.Customizations?.[body?.populators?.validation?.max?.masterName]?.[
                    body?.populators?.validation?.max?.moduleName
                  ](body?.populators?.validation?.max?.patternType);
                }

                return {
                  ...body,
                  populators: {
                    ...body?.populators,
                    validation: {
                      ...body?.populators?.validation,
                      ...validationUpdate,
                    },
                  },
                };
              }
              return {
                ...body,
              };
            }),
          };
        });
      });
    }
    return modifiedFormData.map(({ data }, index) => {
      let disableConfigFields = [];
      const updatedConfig = formConfig
        .filter((config) => {
          const dependentKeys = config?.dependentKey;
          if (!dependentKeys) {
            return config;
          }
          let show = true;
          for (const key in dependentKeys) {
            const nameArray = dependentKeys[key];
            for (const name of nameArray) {
              if (Array.isArray(data?.[key]?.[name]) && data?.[key]?.[name]?.length === 0) {
                show = false;
              } else show = show && Boolean(data?.[key]?.[name]);
            }
          }
          return show && config;
        })
        .map((config) => {
          if (config.updateLabelOn && config.updateLabel.key && config.defaultLabel.key) {
            if (extractValue(data, config.updateLabelOn)) {
              config[config.updateLabel.key] = config.updateLabel.value;
            } else {
              config[config.defaultLabel.key] = config.defaultLabel.value;
            }
          }
          return {
            ...config,
            body: config?.body?.map((body) => {
              body.state = state;
              if (body?.addUUID && body?.uuid !== index) {
                body.uuid = index;
                body.isUserVerified = disableConfigFields.some((field) => {
                  return field === body?.key;
                });
              }

              //isMandatory
              if (
                body?.isDocDependentOn &&
                body?.isDocDependentKey &&
                data?.[body?.isDocDependentOn]?.[body?.isDocDependentKey] &&
                body?.key !== "proofOfReplyFileUpload" &&
                body?.component === "SelectCustomDragDrop"
              ) {
                body.isMandatory = true;
              } else if (body?.isDocDependentOn && body?.isDocDependentKey && body?.component === "SelectCustomDragDrop") {
                body.isMandatory = false;
              }

              //withoutLabelFieldPair
              if (body?.isDocDependentOn && body?.isDocDependentKey && !data?.[body?.isDocDependentOn]?.[body?.isDocDependentKey]) {
                body.withoutLabelFieldPair = true;
              } else {
                body.withoutLabelFieldPair = false;
              }
              if (body?.labelChildren === "optional" && Object.keys(caseDetails?.additionalDetails?.scrutiny?.data || {}).length === 0) {
                body.labelChildren = <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>;
              }

              if (body?.labelChildren === "OutlinedInfoIcon" && Object.keys(caseDetails?.additionalDetails?.scrutiny?.data || {}).length === 0) {
                body.labelChildren = (
                  <React.Fragment>
                    <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`${body.label}-tooltip`}>
                      {" "}
                      <OutlinedInfoIcon />
                    </span>
                    <ReactTooltip id={`${body.label}-tooltip`} place="bottom" content={body?.tooltipValue || ""}>
                      {t(body?.tooltipValue || body.label)}
                    </ReactTooltip>
                  </React.Fragment>
                );
              }
              if (
                body?.validation?.pattern &&
                body?.validation?.pattern?.moduleName &&
                body?.validation?.pattern?.masterName &&
                body?.validation?.pattern?.patternType
              ) {
                body.validation = {
                  ...body.validation,
                  pattern: Digit?.Customizations?.[body?.validation?.pattern?.masterName]?.[body?.validation?.pattern?.moduleName](
                    body?.validation?.pattern?.patternType
                  ),
                };
              }

              if (body.updateLabelOn && body.updateLabel.key && body.defaultLabel.key) {
                if (extractValue(data, body.updateLabelOn)) {
                  body[body.updateLabel.key] = body.updateLabel.value;
                } else {
                  body[body.defaultLabel.key] = body.defaultLabel.value;
                }
              }

              if ("inputs" in body?.populators && Array.isArray(body?.populators.inputs)) {
                return {
                  ...body,
                  populators: {
                    inputs: body?.populators.inputs.map((input) => {
                      if (input.updateLabelOn && input.updateLabel.key && input.defaultLabel.key) {
                        if (extractValue(data, input.updateLabelOn)) {
                          input[input.updateLabel.key] = input.updateLabel.value;
                        } else {
                          input[input.defaultLabel.key] = input.defaultLabel.value;
                        }
                      }

                      if (input?.validation) {
                        if (
                          input?.validation?.pattern &&
                          input?.validation?.pattern?.moduleName &&
                          input?.validation?.pattern?.masterName &&
                          input?.validation?.pattern?.patternType
                        ) {
                          input.validation = {
                            ...input.validation,
                            pattern: Digit?.Customizations?.[input?.validation?.pattern?.masterName]?.[input?.validation?.pattern?.moduleName](
                              input?.validation?.pattern?.patternType
                            ),
                          };
                        }
                      }

                      if (
                        disableConfigFields.some((field) => {
                          if (Array.isArray(input?.name)) return field === input?.key;
                          return field === input?.name;
                        })
                      ) {
                        return {
                          ...input,
                          disable: input?.shouldBeEnabled ? false : true,
                          isDisabled: input?.shouldBeEnabled ? false : true,
                        };
                      }

                      // 225 Inquiry Affidavit Validation in respondent details
                      if (selected === "respondentDetails") {
                        if (
                          Array.isArray(data?.addressDetails) &&
                          data?.addressDetails?.some(
                            (address) =>
                              ((address?.addressDetails?.pincode !==
                                caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.addressDetails?.pincode &&
                                caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.complainantType?.code ===
                                  "INDIVIDUAL") ||
                                (address?.addressDetails?.pincode !==
                                  caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.addressCompanyDetails?.pincode &&
                                  caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.complainantType?.code ===
                                    "REPRESENTATIVE")) &&
                              body?.key === "inquiryAffidavitFileUpload"
                          )
                        ) {
                          // delete input.isOptional;
                          body.isMandatory = false;
                          return {
                            ...input,
                            hideDocument: false,
                          };
                        } else if (body?.key === "inquiryAffidavitFileUpload") {
                          delete body.isMandatory;
                          return {
                            ...input,
                            isOptional: "CS_IS_OPTIONAL",
                            hideDocument: false,
                          };
                        } else {
                          return {
                            ...input,
                          };
                        }
                      }
                      return {
                        ...input,
                      };
                    }),
                  },
                };
              } else if ("populators" in body) {
                const validationUpdate = {};
                if (
                  body?.populators?.validation &&
                  body?.populators?.validation?.pattern &&
                  body?.populators?.validation?.pattern?.moduleName &&
                  body?.populators?.validation?.pattern?.masterName &&
                  body?.populators?.validation?.pattern?.patternType
                ) {
                  validationUpdate.pattern = {
                    value: Digit?.Customizations?.[body?.populators?.validation?.pattern?.masterName]?.[
                      body?.populators?.validation?.pattern?.moduleName
                    ](body?.populators?.validation?.pattern?.patternType),
                    message: body?.populators?.validation?.pattern?.message,
                  };
                }
                if (
                  body?.populators?.validation &&
                  body?.populators?.validation?.max &&
                  body?.populators?.validation?.max?.moduleName &&
                  body?.populators?.validation?.max?.masterName &&
                  body?.populators?.validation?.max?.patternType
                ) {
                  validationUpdate.max = Digit?.Customizations?.[body?.populators?.validation?.max?.masterName]?.[
                    body?.populators?.validation?.max?.moduleName
                  ](body?.populators?.validation?.max?.patternType);
                }

                return {
                  ...body,
                  disable: disableConfigFields.some((field) => field === body?.populators?.name),
                  populators: {
                    ...body?.populators,
                    validation: {
                      ...body?.populators?.validation,
                      ...validationUpdate,
                    },
                  },
                };
              }
              return {
                ...body,
                disable: disableConfigFields.some((field) => field === body?.name),
              };
            }),
          };
        })
        .map((config) => {
          let updatedBody = [];
          updatedBody = config.body.map((formComponent) => {
            return formComponent;
          });
          return {
            ...config,
            body: updatedBody,
          };
        });
      return updatedConfig;
    });
  }, [formdata, isDependentEnabled, selected, formConfig, caseDetails?.additionalDetails, caseDetails?.caseDetails, t]);

  const pincodeConfigs = useMemo(
    () => ({
      individual: editComplainantDetailsConfig?.formconfig
        ?.find((item) => item.body?.[0]?.key === "addressDetails")
        ?.body?.[0]?.populators?.inputs?.find((item) => item?.name === "pincode"),
      representative: editComplainantDetailsConfig?.formconfig
        ?.find((item) => item.body?.[0]?.key === "addressCompanyDetails")
        ?.body?.[0]?.populators?.inputs?.find((item) => item?.name === "pincode"),
    }),
    []
  );

  const checkIfValidated = (currentValue, input) => {
    if (!currentValue) return false;
    const isEmpty = /^\s*$/.test(currentValue);
    return isEmpty || !currentValue.match(window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern);
  };

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues, index, currentDisplayIndex) => {
    editCheckNameValidation({ formData, setValue, selected, formdata, index, reset, clearErrors, formState });
    runComprehensiveSanitizer({ formData, setValue });
    if (!isEqual(formData, formdata[index].data)) {
      editCheckDuplicateMobileEmailValidation({
        formData,
        setValue,
        selected,
        formdata,
        index,
        reset,
        setError,
        clearErrors,
        caseDetails,
        currentDisplayIndex,
      });

      editShowToastForComplainant({ formData, setValue, selected, formState, clearErrors });
      setFormdata(
        formdata.map((item, i) => {
          return i === index
            ? {
                ...item,
                data: formData,
              }
            : item;
        })
      );
    }
    setFormErrors.current = setError;
    setFormState.current = formState;
    resetFormData.current = reset;
    setFormDataValue.current = setValue;
    clearFormDataErrors.current = clearErrors;

    const checkPincodeValidation =
      (formData?.complainantType?.code === "INDIVIDUAL" && checkIfValidated(formData?.addressDetails?.pincode, pincodeConfigs.individual)) ||
      (formData?.complainantType?.code === "REPRESENTATIVE" &&
        checkIfValidated(formData?.addressCompanyDetails?.pincode, pincodeConfigs.representative));

    if (Object.keys(formState?.errors).length || checkPincodeValidation) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }
  };

  const currentComplainant = useMemo(() => {
    return caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.find(
      (item, index) => item?.data?.complainantVerification?.individualDetails?.individualId === uniqueId
    )?.data;
  }, [caseDetails, uniqueId]);

  const currentRespondent = useMemo(() => {
    return caseDetails?.additionalDetails?.["respondentDetails"]?.formdata?.find(
      (item, index) => item?.data?.respondentVerification?.individualDetails?.individualId === uniqueId || item?.uniqueId === uniqueId
    )?.data;
  }, [caseDetails, uniqueId]);

  const getOnBehalfOfUuid = async () => {
    try {
      const response = await window?.Digit.DRISTIService.searchIndividualUser(
        {
          Individual: {
            individualId: uniqueId,
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );

      const individual = response?.Individual?.[0];
      return individual?.userUuid || uniqueId;
    } catch (error) {
      console.error("Failed to fetch individual:", error);
      return uniqueId;
    }
  };

  const getDefaultValues = useMemo(() => {
    if (selected === "complainantDetails") {
      if (currentComplainant) {
        const updatedData = structuredClone(currentComplainant);
        updatedData.complainantIDProofDocument = {
          document: currentComplainant?.complainantVerification?.individualDetails?.document || [],
        };
        const idProofFileName = currentComplainant?.complainantVerification?.individualDetails?.document?.[0]?.fileName || "ID proof";
        setComplainantIdProofFileName(idProofFileName);
        return updatedData;
      } else return formdata?.[0]?.data;
    }
    if (selected === "respondentDetails") {
      if (currentRespondent) {
        const { inquiryAffidavitFileUpload, ...updatedData } = structuredClone(currentRespondent);
        return updatedData;
      } else return {};
    }
    return {};
  }, [selected, currentComplainant, currentRespondent]);

  const onFormSubmit = () => {
    setShowConfirmSubmission(true);
  };

  const createPendingTask = async ({ name, status, isCompleted = false, refId, stateSla = null, isAssignedRole = false, assignedRole = [] }) => {
    const assignes = !isAssignedRole ? [userInfo?.uuid] || [] : [];
    await DRISTIService.customApiService(Urls.dristi.pendingTask, {
      pendingTask: {
        name,
        entityType: "application-voluntary-submission",
        referenceId: `MANUAL_${refId}`,
        status,
        assignedTo: assignes?.map((uuid) => ({ uuid })),
        assignedRole: assignedRole,
        cnrNumber: caseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
        caseId: caseDetails?.id,
        caseTitle: caseDetails?.caseTitle,
        isCompleted,
        stateSla,
        additionalDetails: {},
        tenantId,
      },
    });
  };

  const onSubmit = async (action, isCaseLocked = false, isWarning = false) => {
    setShowConfirmSubmission(false);
    if (!Array.isArray(formdata)) {
      return;
    }
    if (
      formdata
        .filter((data) => data.isenabled)
        .some((data) =>
          editRespondentValidation({
            setErrorMsg,
            t,
            formData: data?.data,
            caseDetails,
            selected,
            setShowErrorToast,
            toast,
            setFormErrors: setFormErrors.current,
            clearFormDataErrors: clearFormDataErrors.current,
          })
        )
    ) {
      return;
    }

    if (
      formdata
        .filter((data) => data.isenabled)
        .some((data) =>
          editComplainantValidation({
            formData: data?.data,
            t,
            caseDetails,
            selected,
            setShowErrorToast,
            toast,
            setFormErrors: setFormErrors.current,
            formState: setFormState.current,
            clearFormDataErrors: clearFormDataErrors.current,
          })
        )
    ) {
      return;
    } else {
      setIsLoader(true);
      try {
        const referenceId = `MANUAL_${uniqueId}_${editorUuid}_${caseDetails?.id}`;
        const ifProfileRequestAlreadyExists = caseDetails?.additionalDetails?.profileRequests?.find((req) => req?.pendingTaskRefId === referenceId);
        if (ifProfileRequestAlreadyExists) {
          toast.error(t("AN_EDIT_PROFILE_REQUEST_ALREADY_EXISTS"));
          return;
        }
        const onBehalfOfUuid = await getOnBehalfOfUuid();
        const res = await updateProfileData({
          t,
          isCompleted: true,
          caseDetails: caseDetails,
          toast,
          formdata,
          pageConfig,
          multiUploadList,
          selected,
          tenantId,
          caseId,
          uniqueId,
          isAdvocate,
          editorUuid,
          complainantIdProofFileName,
          setFormDataValue: setFormDataValue.current,
          action,
          history,
          currentComplainant,
          individualId,
          userTypeCitizen,
          userInfo,
          sourceType,
          onBehalfOfUuid,
          filingType,
        });
        const newapplicationNumber = res?.application?.applicationNumber;
        const todayDate = new Date().getTime();
        if (newapplicationNumber) {
          if (isCitizen) {
            await createPendingTask({
              name: t("ESIGN_THE_SUBMISSION"),
              status: "ESIGN_THE_SUBMISSION",
              refId: newapplicationNumber,
              stateSla: todayDate + 2 * 24 * 3600 * 1000,
            });
          }
        }
        setIsLoader(false);
        history.push(
          `/${window.contextPath}/citizen/submissions/submissions-create?filingNumber=${caseDetails?.filingNumber}&applicationNumber=${newapplicationNumber}`
        );
      } catch (error) {
        let message = t("SOMETHING_WENT_WRONG");
        if (error instanceof DocumentUploadError) {
          message = `${t("DOCUMENT_FORMAT_DOES_NOT_MATCH")} : ${t(documentLabels[error?.documentType])}`;
        } else if (extractCodeFromErrorMsg(error) === 413) {
          message = t("FAILED_TO_UPLOAD_FILE");
        }
        toast.error(message);
        console.error("An error occurred:", error);
        return { error };
      } finally {
        setIsLoader(false);
      }
    }
  };

  if (isLoading || isLoader) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div>
        <div style={{ marginLeft: "3em", marginTop: "30px" }}>
          <Header>{t("EDIT_LITIGANT_DETAILS")}</Header>
        </div>
        <div>
          {modifiedFormConfig.map((config, index) => {
            return formdata[index].isenabled ? (
              <div
                key={`${selected}-${index}`}
                className="form-wrapper-d"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: "110px",
                }}
              >
                <FormComposerV2
                  label={t("CS_COMMON_SUBMIT")}
                  config={config}
                  onSubmit={onFormSubmit}
                  onSecondayActionClick={() => history.goBack()}
                  defaultValues={getDefaultValues}
                  onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
                    onFormValueChange(
                      setValue,
                      formData,
                      formState,
                      reset,
                      setError,
                      clearErrors,
                      trigger,
                      getValues,
                      index,
                      formdata[index].displayindex
                    );
                  }}
                  isDisabled={isSubmitDisabled}
                  cardStyle={{ minWidth: "100%" }}
                  cardClassName={`e-filing-card-form-style ${pageConfig.className}`}
                  secondaryLabel={t("CS_COMMON_BACK")}
                  showSecondaryLabel={true}
                  actionClassName="e-filing-action-bar"
                  className={"edit-profile-style"}
                  noBreakLine
                />
              </div>
            ) : null;
          })}
        </div>
      </div>
      {showConfirmSubmission && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowConfirmSubmission(false);
              }}
            />
          }
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={() => setShowConfirmSubmission(false)}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={() => {
            // setShowConfirmSubmission(false);
            onSubmit();
          }}
          formId="modal-action"
          headerBarMain={<Heading label={t("CS_CONFIRM_SUBMISSION")} />}
          popmoduleClassName="profile-editing-submission-modal"
        >
          <h3 className="input-label">{t("THIS_WILL_CREATE_REQUEST_FOR_APPROVAL_BY_JUDGE")}</h3>
        </Modal>
      )}
      {showErrorToast && (
        <Toast error={true} label={t(errorMsg ? errorMsg : "ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS")} isDleteBtn={true} onClose={closeToast} />
      )}
    </React.Fragment>
  );
};

export default EditProfile;
