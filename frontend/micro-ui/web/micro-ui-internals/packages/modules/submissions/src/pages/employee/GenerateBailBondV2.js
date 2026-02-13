import { FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { bailBondConfig } from "../../configs/generateBailBondConfig";
import isEqual from "lodash/isEqual";
import BailBondReviewModal from "../../components/BailBondReviewModal";
import GenericUploadSignatureModal from "../../components/GenericUploadSignatureModal";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory, useLocation } from "react-router-dom";
import GenericSuccessLinkModal from "../../components/GenericSuccessLinkModal";
import { combineMultipleFiles, getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { submissionService } from "../../hooks/services";
import useSearchBailBondService from "../../hooks/submissions/useSearchBailBondService";
import { bailBondWorkflowAction } from "../../../../dristi/src/Utils/submissionWorkflow";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import useSearchPendingTask from "../../hooks/submissions/useSearchPendingTask";
import { Urls } from "../../hooks/services/Urls";
import { convertTaskResponseToPayload } from "../../utils";
import {
  bailBondAddressValidation,
  validateAdvocateSuretyContactNumber,
  validateSuretyContactNumber,
  validateSurities,
} from "../../utils/bailBondUtils";

const fieldStyle = { marginRight: 0, width: "100%" };

const convertToFormData = (t, obj) => {
  const formdata = {
    selectComplainant: {
      code: obj?.litigantName,
      name: obj?.litigantName,
      uuid: obj?.litigantId,
    },
    litigantFatherName: obj?.litigantFatherName,
    bailAmount: obj?.bailAmount,
    bailType: {
      code: obj?.bailType?.code || obj?.bailType?.toUpperCase(),
      name: t(obj?.bailType?.code || obj?.bailType?.toUpperCase()),
      showSurety: (obj?.bailType?.code || obj?.bailType?.toUpperCase()) === "SURETY" ? true : false,
    },
    noOfSureties: obj?.noOfSureties || obj?.sureties?.length || null,
    sureties:
      Array.isArray(obj?.sureties) && obj.sureties.length > 0
        ? obj.sureties.map((surety) => ({
            id: surety?.id,
            name: surety?.name,
            fatherName: surety?.fatherName,
            mobileNumber: surety?.mobileNumber,
            address: surety?.address,
            email: surety?.email,
            identityProof: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "IDENTITY_PROOF" && doc?.isActive === true) || [],
            },
            proofOfSolvency: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "PROOF_OF_SOLVENCY" && doc?.isActive === true) || [],
            },
            otherDocuments: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "OTHER_DOCUMENTS" && doc?.isActive === true) || [],
            },
          }))
        : Array.from({ length: obj?.noOfSureties || 0 }, () => ({})),
  };

  return formdata;
};

const GenerateBailBondV2 = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const { filingNumber, bailBondId, showModal } = Digit.Hooks.useQueryParams();
  const { state, pathname, search } = useLocation();
  const pendingTaskrefId = state?.state?.params?.actualReferenceId || null;
  // const pendingTaskId = state?.state?.params?.refId || null;
  const userInfo = Digit.UserService.getUser()?.info;
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showBailBondReview, setShowBailBondReview] = useState(false);
  const [showSignatureModal, setShowsignatureModal] = useState(false);
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBailBondEsign, setShowBailBondEsign] = useState(false);
  const [loader, setLoader] = useState(false);
  const [bailUploadLoader, setBailUploadLoader] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const setFormErrors = useRef(null);
  const setFormState = useRef(null);
  const resetFormData = useRef(null);
  const setFormDataValue = useRef(null);
  const clearFormDataErrors = useRef(null);
  const [formdata, setFormdata] = useState({});
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [bailBondFileStoreId, setBailBondFileStoreId] = useState("");
  const [bailBondSignatureURL, setBailBondSignatureURL] = useState("");
  const [defaultFormValueData, setDefaultFormValueData] = useState({});
  const [caseData, setCaseData] = useState(undefined);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const isBreadCrumbsParamsDataSet = useRef(false);
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const courtId = localStorage.getItem("courtId");
  const [clearAutoPopulatedData, setClearAutoPopulatedData] = useState(false);
  const prevComplainantUuid = useRef(null);
  const [complainantToProcessUuid, setComplainantToProcessUuid] = useState(null);
  const [pendingTaskId, setPendingTaskId] = useState(state?.state?.params?.refId || null);
  const fetchCaseDetails = async () => {
    try {
      setIsCaseDetailsLoading(true);
      const caseData = await DRISTIService.searchCaseService(
        {
          criteria: [
            {
              filingNumber: filingNumber,
              ...(courtId && { courtId }),
            },
          ],
          tenantId,
        },
        {}
      );
      const caseId = caseData?.criteria?.[0]?.responseList?.[0]?.id;
      setCaseData(caseData);
      // Only update breadcrumb data if it's different from current and hasn't been set yet
      if (!(caseIdFromBreadCrumbs === caseId && filingNumberFromBreadCrumbs === filingNumber) && !isBreadCrumbsParamsDataSet.current) {
        setBreadCrumbsParamsData({
          caseId,
          filingNumber,
        });
        isBreadCrumbsParamsDataSet.current = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCaseDetailsLoading(false);
    }
  };

  // Fetch case details on component mount
  useEffect(() => {
    fetchCaseDetails();
  }, []);

  const { data: bailBond, isLoading: isBailBondLoading } = useSearchBailBondService(
    {
      criteria: {
        bailId: bailBondId,
        filingNumber,
      },
      tenantId,
    },
    {},
    `bail-bond-details-${bailBondId}`,
    Boolean(bailBondId && filingNumber)
  );

  const roles = (userInfo?.roles || []).map((r) => r.code);

  const { data: pendingTasksResponse, isLoading: isPendingtaskDataLoading } = useSearchPendingTask(
    {
      SearchCriteria: {
        tenantId,
        moduleName: "Pending Tasks Service",
        moduleSearchCriteria: {
          isCompleted: false,
          ...(isCitizen ? { assignedTo: authorizedUuid } : { assignedRole: [...roles] }),
          ...(courtId && { courtId }),
          filingNumber,
          entityType: "bail bond",
        },
        limit: 1000,
        offset: 0,
      },
    },
    { tenantId },
    `get-pending-task-${bailBondId}`,
    Boolean(filingNumber)
  );

  const getUserUUID = useCallback(
    async (uuid) => {
      const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
        {
          Individual: {
            userUuid: [uuid],
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );
      return individualData;
    },
    [tenantId]
  );

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  const bailBondDetails = useMemo(() => {
    if (Object.keys(defaultFormValueData).length > 0) {
      return defaultFormValueData;
    }
    return bailBond?.bails?.[0];
  }, [defaultFormValueData, bailBond]);

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

  const pendingTasks = useMemo(() => {
    if (complainantsList?.length === 1 || (!pendingTaskrefId && !pendingTaskId)) {
      return Array.isArray(pendingTasksResponse?.data) ? pendingTasksResponse.data : [];
    } else {
      return (Array.isArray(pendingTasksResponse?.data) ? pendingTasksResponse.data : [])?.filter((item) =>
        item?.fields?.some((field) => field.key === "referenceId" && field.value === (pendingTaskrefId || pendingTaskId))
      );
    }
  }, [complainantsList, pendingTaskId, pendingTaskrefId, pendingTasksResponse]);

  const pendingTaskAdditionalDetails = useMemo(() => {
    return convertTaskResponseToPayload(pendingTasks)?.additionalDetails || {};
  }, [pendingTasks]);

  const selectedRepresentative = useMemo(() => {
    return caseDetails?.litigants?.filter((litigant) => litigant?.individualId === pendingTaskAdditionalDetails?.litigantUuid)?.[0] || {};
  }, [caseDetails?.litigants, pendingTaskAdditionalDetails?.litigantUuid]);

  const { data: applicationData, isloading: isApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        applicationNumber: pendingTaskAdditionalDetails?.refApplicationId,
        tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    pendingTaskAdditionalDetails?.refApplicationId + filingNumber,
    Boolean(!bailBondId && filingNumber && pendingTaskAdditionalDetails?.refApplicationId)
  );

  const applicationDetails = useMemo(() => {
    return applicationData?.applicationList?.[0];
  }, [applicationData]);

  const _getNoOfSureties = (bailBondDetails, pendingTasks) => {
    if (bailBondDetails && bailBondDetails?.bailType?.toUpperCase() !== "SURETY") {
      return false;
    }

    if (bailBondDetails && bailBondDetails?.bailType?.toUpperCase() === "SURETY" && bailBondDetails?.sureties?.length < 1) {
      return false;
    }

    if (bailBondDetails && bailBondDetails?.additionalDetails?.isFormReset) {
      return false;
    }

    if (pendingTasks?.length < 1) {
      return false;
    }

    if (pendingTasks?.additionalDetails?.noOfSureties < 1) {
      return false;
    }

    return true;
  };

  const modifiedFormConfig = useMemo(() => {
    let bailnewConfig = bailBondConfig;

    const noOfSuretiesField = {
      type: "text",
      label: "NO_OF_SURETIES",
      isMandatory: false,
      key: "noOfSureties",
      disable: true,
      populators: {
        name: "noOfSureties",
        disable: true,
      },
    };

    const bodyFields = bailnewConfig?.[0]?.body || [];
    if (!clearAutoPopulatedData && _getNoOfSureties(bailBondDetails, pendingTasks) && formdata?.selectComplainant?.name) {
      const alreadyExists = bodyFields.some((field) => field?.key === "noOfSureties");
      if (!alreadyExists) {
        bailnewConfig[0].body.push(noOfSuretiesField);
      }
    } else {
      bailnewConfig[0].body = bailnewConfig?.[0]?.body?.filter((field) => field?.key !== "noOfSureties");
    }

    if (clearAutoPopulatedData) {
      bailnewConfig[0].body = bailnewConfig?.[0]?.body?.filter((field) => field?.key !== "noOfSureties");
    }

    const updatedConfig = bailnewConfig
      .filter((config) => {
        const dependentKeys = config?.dependentKey;
        if (!dependentKeys) {
          return config;
        }
        let show = true;
        for (const key in dependentKeys) {
          const nameArray = dependentKeys[key];
          for (const name of nameArray) {
            if (Array.isArray(formdata?.[key]?.[name]) && formdata?.[key]?.[name]?.length === 0) {
              show = false;
            } else show = show && Boolean(formdata?.[key]?.[name]);
          }
        }
        return show && config;
      })
      .map((config) => {
        return {
          ...config,
          body: config?.body.map((body) => {
            if (body?.populators?.validation) {
              const customValidations =
                Digit?.Customizations?.[body.populators.validation.pattern.masterName]?.[body.populators.validation.pattern.moduleName];

              if (typeof customValidations === "function") {
                const patternType = body.populators.validation.pattern.patternType;
                const message = body.populators.validation.pattern.message;

                body.populators.validation = {
                  ...body.populators.validation,
                  pattern: {
                    value: customValidations(patternType),
                    message,
                  },
                };
              }
            }
            if (body?.key === "selectComplainant") {
              body.populators.options = complainantsList;
              if (complainantsList?.length === 1 || pendingTaskrefId) {
                const updatedBody = {
                  ...body,
                  disable: true,
                };
                return updatedBody;
              }
            }

            if (
              body?.key === "litigantFatherName" &&
              (bailBondDetails?.additionalDetails?.isFormReset || pendingTaskAdditionalDetails?.refApplicationId) &&
              (bailBondDetails?.additionalDetails?.isFormReset ? !bailBondDetails?.additionalDetails?.isFormReset : !clearAutoPopulatedData) &&
              formdata?.selectComplainant?.name
            ) {
              return { ...body, disable: true };
            }

            if (
              body?.key === "bailType" &&
              (bailBondDetails?.additionalDetails?.isFormReset || pendingTaskAdditionalDetails?.bailType?.code) &&
              (bailBondDetails?.additionalDetails?.isFormReset ? !bailBondDetails?.additionalDetails?.isFormReset : !clearAutoPopulatedData) &&
              formdata?.selectComplainant?.name
            ) {
              return { ...body, disable: true };
            }

            if (
              body?.key === "bailAmount" &&
              (bailBondDetails?.additionalDetails?.isFormReset || pendingTaskAdditionalDetails?.bailAmount) &&
              (bailBondDetails?.additionalDetails?.isFormReset ? !bailBondDetails?.additionalDetails?.isFormReset : !clearAutoPopulatedData) &&
              formdata?.selectComplainant?.name
            ) {
              return { ...body, disable: true };
            }

            if (
              body?.key === "sureties" &&
              (bailBondDetails?.additionalDetails?.isFormReset ? !bailBondDetails?.additionalDetails?.isFormReset : !clearAutoPopulatedData) &&
              formdata?.selectComplainant?.name &&
              pendingTaskAdditionalDetails?.refApplicationId &&
              pendingTaskAdditionalDetails?.noOfSureties > 0
            ) {
              return {
                ...body,
                disable: true,
                formDisbalityCount:
                  bailBondDetails?.additionalDetails?.formDisableCount || applicationDetails?.applicationDetails?.sureties?.length || 0,
              };
            }

            return {
              ...body,
            };
          }),
        };
      });
    return updatedConfig;
  }, [applicationDetails, bailBondDetails, clearAutoPopulatedData, complainantsList, formdata, pendingTaskAdditionalDetails, pendingTaskrefId]);

  const handleComplainantSelection = async (selectedComplainant, setValue) => {
    if (!selectedComplainant?.uuid || complainantsList?.length <= 1) return;

    const litigantId =
      caseDetails?.litigants?.filter((litigant) => litigant?.additionalDetails?.uuid === selectedComplainant?.uuid)?.[0]?.individualId || {};

    const filteredTasks = (Array.isArray(pendingTasksResponse?.data) ? pendingTasksResponse.data : [])?.filter((item) =>
      item?.fields?.some((field) => field.key === "additionalDetails.litigantUuid" && field.value === litigantId)
    );

    if (filteredTasks?.length > 0) {
      const filteredTaskData = convertTaskResponseToPayload(filteredTasks);
      if (!filteredTaskData) return;
      const selectedTaskPayload = filteredTaskData?.additionalDetails || {};
      const currentParams = new URLSearchParams(window.location.search);

      if (!selectedTaskPayload?.bailBondId && bailBondId) {
        currentParams.delete("bailBondId");
        history.replace({
          pathname,
          search: `?${currentParams.toString()}`,
          state: {
            state: {
              params: {
                refId: filteredTaskData?.referenceId,
              },
            },
          },
        });
        return;
      }

      if (selectedTaskPayload?.bailBondId && selectedTaskPayload?.bailBondId !== bailBondId) {
        currentParams.set("bailBondId", selectedTaskPayload.bailBondId);
        history.replace({
          pathname,
          search: `?${currentParams.toString()}`,
        });
      } else if (selectedTaskPayload?.refApplicationId && filingNumber) {
        const res = await submissionService?.searchApplication(
          {
            criteria: {
              filingNumber,
              applicationNumber: selectedTaskPayload?.refApplicationId,
              tenantId,
              ...(caseCourtId && { courtId: caseCourtId }),
            },
            tenantId,
          },
          {}
        );
        const appDetails = res?.applicationList?.[0] || {};
        const applicationDetailsData = appDetails?.applicationDetails || {};

        const noOfSureties = selectedTaskPayload?.noOfSureties || 0;
        const providedSureties = Array.isArray(applicationDetailsData?.sureties)
          ? applicationDetailsData.sureties.map((s, index) => ({
              id: s?.id || s?.index || null,
              name: s?.name || "",
              fatherName: s?.fatherName || "",
              mobileNumber: s?.mobileNumber || "",
              address: s?.address || {},
              email: s?.email || "",
              documents: [...(applicationDetailsData?.applicationDocuments?.filter((doc) => doc?.suretyIndex === s?.suretyIndex) || [])].map((d) => ({
                ...d,
                documentName: d?.documentTitle,
                isActive: true,
              })),
            }))
          : [];

        const sureties =
          providedSureties.length < noOfSureties
            ? [...providedSureties, ...Array.from({ length: noOfSureties - providedSureties.length }, () => ({}))]
            : providedSureties;

        const completeObject = {
          ...selectedTaskPayload,
          litigantId: selectedComplainant.uuid,
          litigantName: selectedComplainant.name,
          litigantFatherName: applicationDetailsData?.litigantFatherName || selectedTaskPayload?.litigantFatherName,
          sureties,
        };

        const convertedFormData = convertToFormData(t, completeObject);

        if (convertedFormData) {
          Object.keys(convertedFormData).forEach((key) => {
            if (key !== "selectComplainant") {
              setValue(key, convertedFormData[key]);
            }
          });
        }
      } else {
        const newObject = {
          ...selectedTaskPayload,
          litigantId: selectedComplainant.uuid,
          litigantName: selectedComplainant.name,
        };

        const convertedFormData = convertToFormData(t, newObject);

        if (convertedFormData) {
          Object.keys(convertedFormData).forEach((key) => {
            if (key !== "selectComplainant") {
              setValue(key, convertedFormData[key]);
            }
          });
        }
      }
    } else {
      setClearAutoPopulatedData(true);
      setPendingTaskId(null);
    }
  };

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    // Continue with the existing validation logic
    if (formData?.bailAmount <= 0 && !Object.keys(formState?.errors).includes("bailAmount")) {
      setError("bailAmount", { message: t("Must be greater than zero") });
    } else if (formData?.bailAmount > 0 && Object.keys(formState?.errors).includes("bailAmount")) {
      clearErrors("bailAmount");
    }
    if (formData?.bailType?.code === "SURETY") {
      if (formData?.sureties?.length > 0 && !Object.keys(formState?.errors).includes("sureties")) {
        formData?.sureties?.forEach((docs, index) => {
          if (docs?.name && Object.keys(formState?.errors).includes(`name_${index}`)) {
            clearErrors(`name_${index}`);
          }

          if (docs?.fatherName && Object.keys(formState?.errors).includes(`fatherName_${index}`)) {
            clearErrors(`fatherName_${index}`);
          }

          if (docs?.mobileNumber && Object.keys(formState?.errors).includes(`mobileNumber_${index}`)) {
            clearErrors(`mobileNumber_${index}`);
          }

          if (docs?.identityProof && Object.keys(formState?.errors).includes(`identityProof_${index}`)) {
            clearErrors(`identityProof_${index}`);
          }

          if (docs?.proofOfSolvency && Object.keys(formState?.errors).includes(`proofOfSolvency_${index}`)) {
            clearErrors(`proofOfSolvency_${index}`);
          }
        });
      } else if (formData?.sureties?.length > 0 && Object.keys(formState?.errors).includes("sureties")) {
        clearErrors("sureties");
      }
    }

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }

    if (!isEqual(formdata, formData)) {
      setFormdata(formData);

      if (formData?.selectComplainant?.uuid !== formdata?.selectComplainant?.uuid) {
        setComplainantToProcessUuid(formData?.selectComplainant?.uuid);
        setClearAutoPopulatedData(false);
      }
    }
    setFormErrors.current = setError;
    setFormState.current = formState;
    resetFormData.current = reset;
    setFormDataValue.current = setValue;
    clearFormDataErrors.current = clearErrors;
  };

  const defaultFormValue = useMemo(() => {
    if (clearAutoPopulatedData) {
      if (!complainantsList || complainantsList.length === 0) return {};

      if (complainantsList.length === 1) {
        const onlyComplainant = complainantsList[0];
        return {
          selectComplainant: {
            code: onlyComplainant.code,
            name: onlyComplainant.name,
            uuid: onlyComplainant.uuid,
          },
        };
      } else {
        return {
          selectComplainant: formdata?.selectComplainant || {},
        };
      }
    }

    if (bailBondDetails) {
      return convertToFormData(t, bailBondDetails || {});
    }

    if ((pendingTaskrefId || pendingTaskId || complainantsList?.length === 1) && !bailBond && pendingTasks?.length > 0 && applicationDetails) {
      const getPendingTaskPayload = convertTaskResponseToPayload(pendingTasks)?.additionalDetails || {};
      const applicationDetailsData = applicationDetails?.applicationDetails || {};
      const noOfSureties = getPendingTaskPayload?.noOfSureties || 0;
      const providedSureties = Array.isArray(applicationDetailsData?.sureties)
        ? applicationDetailsData.sureties.map((s, index) => ({
            id: s?.id || s?.index || null,
            name: s?.name || "",
            fatherName: s?.fatherName || "",
            mobileNumber: s?.mobileNumber || "",
            address: s?.address || {},
            email: s?.email || "",
            documents: [...(applicationDetailsData?.applicationDocuments?.filter((doc) => doc?.suretyIndex === s?.suretyIndex) || [])].map((d) => ({
              ...d,
              documentName: d?.documentTitle,
              isActive: true,
            })),
          }))
        : [];

      const sureties =
        providedSureties.length < noOfSureties
          ? [...providedSureties, ...Array.from({ length: noOfSureties - providedSureties.length }, () => ({}))]
          : providedSureties;

      const newObject = {
        ...getPendingTaskPayload,
        litigantFatherName: applicationDetailsData?.litigantFatherName || getPendingTaskPayload?.litigantFatherName,
        litigantName: applicationDetails?.additionalDetails?.formdata?.selectComplainant?.name || getPendingTaskPayload?.litigantName,
        litigantId: applicationDetails?.additionalDetails?.formdata?.selectComplainant?.uuid || selectedRepresentative?.additionalDetails?.uuid,
        sureties,
      };

      return convertToFormData(t, newObject);
    }

    if (
      !bailBond &&
      pendingTasks?.length > 0 &&
      !pendingTaskAdditionalDetails?.refApplicationId &&
      (pendingTaskrefId || pendingTaskId || complainantsList?.length === 1)
    ) {
      const getPendingTaskPayload = convertTaskResponseToPayload(pendingTasks)?.additionalDetails || {};
      const newObject = {
        ...getPendingTaskPayload,
        litigantId: selectedRepresentative?.additionalDetails?.uuid || getPendingTaskPayload?.litigantUuid,
        litigantName: getPendingTaskPayload?.litigantName || selectedRepresentative?.additionalDetails?.fullName,
      };
      return convertToFormData(t, newObject);
    }

    if (Object.keys(defaultFormValueData).length > 0) {
      return convertToFormData(t, defaultFormValueData);
    }

    if (!complainantsList || complainantsList.length === 0) return {};

    if (complainantsList.length === 1) {
      const onlyComplainant = complainantsList[0];
      return {
        selectComplainant: {
          code: onlyComplainant.code,
          name: onlyComplainant.name,
          uuid: onlyComplainant.uuid,
        },
      };
    }

    return {};
  }, [
    applicationDetails,
    bailBond,
    bailBondDetails,
    clearAutoPopulatedData,
    complainantsList,
    defaultFormValueData,
    formdata,
    pendingTaskAdditionalDetails,
    pendingTaskrefId,
    pendingTaskId,
    pendingTasks,
    selectedRepresentative,
    t,
  ]);

  const onDocumentUpload = async (fileData, filename) => {
    const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  };

  const preProcessFormData = async (formData) => {
    if (formData?.bailType?.code === "PERSONAL") {
      return formData;
    }
    const updatedFormData = { ...formData };
    if (Array.isArray(updatedFormData?.sureties)) {
      updatedFormData.sureties = await Promise.all(
        updatedFormData.sureties.map(async (surety) => {
          const updatedSurety = { ...surety };

          if (surety?.identityProof?.document?.length > 0) {
            // Check if any document is a File type (needs processing)
            const hasFileTypeDoc = surety.identityProof.document.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));

            if (hasFileTypeDoc) {
              // Only process if we have File type documents
              const combinedIdentityProof = await combineMultipleFiles(surety.identityProof.document);
              const file = await onDocumentUpload(combinedIdentityProof?.[0], "IdentityProof.pdf");
              updatedSurety.identityProof = {
                document: [
                  {
                    fileStore: file?.file?.files?.[0]?.fileStoreId,
                    documentName: file?.filename,
                    documentType: "IDENTITY_PROOF",
                    tenantId,
                  },
                ],
              };
            }
          }

          if (surety?.proofOfSolvency?.document?.length > 0) {
            // Check if any document is a File type (needs processing)
            const hasFileTypeDoc = surety.proofOfSolvency.document.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));

            if (hasFileTypeDoc) {
              // Only process if we have File type documents
              const combinedProof = await combineMultipleFiles(surety.proofOfSolvency.document);
              const file = await onDocumentUpload(combinedProof?.[0], "ProofOfSolvency.pdf");
              updatedSurety.proofOfSolvency = {
                document: [
                  {
                    fileStore: file?.file?.files?.[0]?.fileStoreId,
                    documentName: file?.filename,
                    documentType: "PROOF_OF_SOLVENCY",
                    tenantId,
                  },
                ],
              };
            }
          }

          if (surety?.otherDocuments?.document?.length > 0) {
            // Check if any document is a File type (needs processing)
            const hasFileTypeDoc = surety.otherDocuments.document.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));

            if (hasFileTypeDoc) {
              // Only process if we have File type documents
              const combinedOtherDocs = await combineMultipleFiles(surety.otherDocuments.document);
              const file = await onDocumentUpload(combinedOtherDocs?.[0], "OtherDocuments.pdf");
              updatedSurety.otherDocuments = {
                document: [
                  {
                    fileStore: file?.file?.files?.[0]?.fileStoreId,
                    documentName: file?.filename,
                    documentType: "OTHER_DOCUMENTS",
                    tenantId,
                  },
                ],
              };
            }
          }
          return updatedSurety;
        })
      );
    }
    return updatedFormData;
  };

  const extractSureties = (formData) => {
    const existingSureties = bailBondDetails?.sureties || [];
    if (existingSureties?.length > 0 && formData?.bailType?.code === "SURETY") {
      const activeSureties = formData?.sureties?.map((surety, index) => {
        const matchingSurety = existingSureties?.find((existing) => existing?.id === surety?.id);
        return {
          ...matchingSurety,
          index: index + 1,
          name: surety?.name,
          fatherName: surety?.fatherName,
          mobileNumber: surety?.mobileNumber,
          tenantId,
          address: surety?.address,
          email: surety?.email,
          documents: [
            ...(surety?.identityProof?.document || []),
            ...(surety?.proofOfSolvency?.document || []),
            ...(surety?.otherDocuments?.document || []),
          ],
        };
      });

      const formDataSuretyIds = formData?.sureties?.map((surety) => surety?.id)?.filter(Boolean);
      const inactiveSureties = existingSureties
        ?.filter((existingSurety) => existingSurety?.id && !formDataSuretyIds?.includes(existingSurety.id))
        ?.map((surety) => ({
          ...surety,
          isActive: false,
        }));

      return [...activeSureties, ...inactiveSureties];
    } else if (existingSureties?.length > 0 && formData?.bailType?.code !== "SURETY") {
      return existingSureties?.map((surety) => ({
        ...surety,
        isActive: false,
      }));
    } else {
      return formData?.sureties?.map((surety, index) => {
        return {
          index: index + 1,
          name: surety?.name,
          fatherName: surety?.fatherName,
          mobileNumber: surety?.mobileNumber,
          tenantId,
          address: surety?.address,
          email: surety?.email,
          documents: [
            ...(surety?.identityProof?.document || []),
            ...(surety?.proofOfSolvency?.document || []),
            ...(surety?.otherDocuments?.document || []),
          ],
        };
      });
    }
  };

  const createBailBond = async (individualData) => {
    try {
      const updatedFormData = await preProcessFormData(formdata);
      const sureties = extractSureties(updatedFormData);

      const payload = {
        bail: {
          tenantId,
          caseId: caseDetails?.id,
          filingNumber: filingNumber,
          complainant: updatedFormData?.selectComplainant?.uuid,
          bailType: updatedFormData?.bailType?.code,
          bailAmount: updatedFormData?.bailAmount,
          sureties: sureties || [],
          litigantId: updatedFormData?.selectComplainant?.uuid,
          litigantName: updatedFormData?.selectComplainant?.name,
          litigantFatherName: updatedFormData?.litigantFatherName,
          litigantMobileNumber: individualData?.Individual?.[0]?.mobileNumber,
          courtId: caseDetails?.courtId,
          caseTitle: caseDetails?.caseTitle,
          cnrNumber: caseDetails?.cnrNumber,
          caseType: caseDetails?.caseType,
          asUser: authorizedUuid, // Sending uuid of the main advocate in case clerk/jr. adv is creating doc.
          documents: [],
          additionalDetails: {
            createdUserName: userInfo?.name,
            isFormReset: clearAutoPopulatedData,
            formDisableCount: applicationDetails?.applicationDetails?.sureties?.length || 0,
          },
          workflow: {
            action: bailBondWorkflowAction.SAVEDRAFT,
            documents: [{}],
          },
        },
      };
      const res = await submissionService.createBailBond(payload, { tenantId });
      return res;
    } catch (error) {
      throw error;
    }
  };

  const updateBailBond = async (fileStoreId = null, action, individualData) => {
    try {
      let payload = {};
      if (action !== bailBondWorkflowAction.SAVEDRAFT) {
        const documents = Array.isArray(bailBondDetails?.documents) ? bailBondDetails.documents : [];
        const documentsFile = fileStoreId
          ? [
              {
                fileStore: fileStoreId,
                documentType: action === bailBondWorkflowAction.UPLOAD ? "SIGNED" : "UNSIGNED",
                additionalDetails: { name: `${t("BAIL_BOND")}.pdf` },
                tenantId,
              },
            ]
          : null;

        payload = {
          bail: {
            ...bailBondDetails,
            documents: documentsFile ? [...documentsFile] : documents,
            workflow: { ...bailBondDetails.workflow, action, documents: [{}] },
          },
        };
      } else {
        const updatedFormData = await preProcessFormData(formdata);
        const sureties = extractSureties(updatedFormData);

        payload = {
          bail: {
            ...bailBondDetails,
            complainant: updatedFormData?.selectComplainant?.uuid,
            bailType: updatedFormData?.bailType?.code,
            bailAmount: updatedFormData?.bailAmount,
            sureties: sureties || [],
            litigantId: updatedFormData?.selectComplainant?.uuid,
            litigantName: updatedFormData?.selectComplainant?.name,
            litigantFatherName: updatedFormData?.litigantFatherName,
            litigantMobileNumber: individualData ? individualData?.Individual?.[0]?.mobileNumber : bailBondDetails?.litigantMobileNumber,
            additionalDetails: {
              ...bailBondDetails.additionalDetails,
              createdUserName: userInfo?.name,
              isFormReset: bailBondDetails?.additionalDetails?.isFormReset || clearAutoPopulatedData,
            },
            workflow: { ...bailBondDetails.workflow, action, documents: [{}] },
          },
        };
      }

      const res = await submissionService.updateBailBond(payload, { tenantId });
      return res;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (formdata?.bailType?.code === "SURETY") {
      if (validateSurities(t, formdata?.sureties, setFormState, setFormErrors, setFormDataValue)) {
        return;
      }

      const isFormReset = bailBondDetails?.additionalDetails?.isFormReset;

      // If NOT form reset → perform sureties validation
      if (!clearAutoPopulatedData && !isFormReset) {
        if (formdata?.sureties?.length < pendingTaskAdditionalDetails?.noOfSureties) {
          setShowErrorToast({
            label: t("NUMBER_OF_SURETIES_IS_LESS_THAN_EXPECTED"),
            error: true,
          });
          return;
        }
      }

      const inputs = bailBondConfig?.[1]?.body?.[0]?.populators?.inputs?.find((input) => input?.key === "address")?.populators?.inputs;
      for (let i = 0; i < formdata?.sureties?.length; i++) {
        const surety = formdata?.sureties?.[i];
        const isError = bailBondAddressValidation({ formData: surety?.address, inputs });
        if (isError) {
          setShowErrorToast({ label: t("CS_PLEASE_CHECK_ADDRESS_DETAILS_BEFORE_SUBMIT"), error: true });
          return;
        }
      }

      if (validateAdvocateSuretyContactNumber(t, formdata?.sureties, userInfo, setShowErrorToast)) {
        return;
      }
    }

    try {
      setLoader(true);
      const individualData = await getUserUUID(formdata?.selectComplainant?.uuid);
      const validateSuretyContactNumbers = validateSuretyContactNumber(individualData, formdata, setShowErrorToast, t);

      if (!validateSuretyContactNumbers) {
        setLoader(false);
        return;
      }
      let bailBondResponse = null;
      if (!bailBondId) {
        const getPendingTaskPayload = convertTaskResponseToPayload(pendingTasks);
        bailBondResponse = await createBailBond(individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
        if (pendingTasks?.length > 0) {
          await submissionService.customApiService(Urls.pendingTask, {
            pendingTask: {
              ...getPendingTaskPayload,
              additionalDetails: {
                ...getPendingTaskPayload?.additionalDetails,
                bailBondId: bailBondResponse?.bails?.[0]?.bailId || null,
              },
              tenantId,
            },
          });
        }
        history.replace(
          `/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondResponse?.bails?.[0]?.bailId}&showModal=true`
        );
      } else {
        bailBondResponse = await updateBailBond(null, bailBondWorkflowAction.SAVEDRAFT, individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
        setShowBailBondReview(true);
      }
    } catch (error) {
      console.error("Error while creating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleSaveDraft = async () => {
    // Todo : Create and Update Api Call
    try {
      if (!formdata?.bailType) {
        setShowErrorToast({ label: t("BAIL_TYPE_ISSUE"), error: true });
        return;
      }

      setLoader(true);
      const individualData = await getUserUUID(formdata?.selectComplainant?.uuid);
      let bailBondResponse = null;
      if (!bailBondId) {
        const getPendingTaskPayload = convertTaskResponseToPayload(pendingTasks);
        bailBondResponse = await createBailBond(individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
        if (pendingTasks?.length > 0) {
          await submissionService.customApiService(Urls.pendingTask, {
            pendingTask: {
              ...getPendingTaskPayload,
              additionalDetails: {
                ...getPendingTaskPayload?.additionalDetails,
                bailBondId: bailBondResponse?.bails?.[0]?.bailId || null,
              },
              tenantId,
            },
          });
        }
        history.replace(
          `/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondResponse?.bails?.[0]?.bailId}`
        );
      } else {
        bailBondResponse = await updateBailBond(null, bailBondWorkflowAction.SAVEDRAFT, individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
      }
      setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
    } catch (error) {
      console.error("Error while creating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleCloseSignatureModal = () => {
    setShowsignatureModal(false);
    setShowBailBondReview(true);
  };

  const handleDownload = () => {
    downloadPdf(tenantId, bailBondFileStoreId);
  };

  const handleESign = async () => {
    // TODO: call Api then close this modal and show next modal
    try {
      const getPendingTaskPayload = convertTaskResponseToPayload(pendingTasks);
      const res = await updateBailBond(bailBondFileStoreId, bailBondWorkflowAction.INITIATEESIGN);
      if (pendingTasks?.length > 0) {
        await submissionService.customApiService(Urls.pendingTask, {
          pendingTask: {
            ...getPendingTaskPayload,
            isCompleted: true,
            tenantId,
          },
        });
      }
      setBailBondSignatureURL(res?.bails?.[0]?.shortenedURL);
      setShowsignatureModal(false);
      setShowBailBondEsign(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setShowsignatureModal(false);
    }
  };

  const handleSubmitSignature = async (fileStoreId) => {
    // TODO: api call with fileStoreID then
    try {
      setLoader(true);
      const getPendingTaskPayload = convertTaskResponseToPayload(pendingTasks);
      const res = await updateBailBond(fileStoreId, bailBondWorkflowAction.UPLOAD);
      if (pendingTasks?.length > 0) {
        await submissionService.customApiService(Urls.pendingTask, {
          pendingTask: {
            ...getPendingTaskPayload,
            isCompleted: true,
            tenantId,
          },
        });
      }
      setShowsignatureModal(false);
      setShowUploadSignature(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleCloseSuccessModal = () => {
    history.replace(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`);
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };

  const documents = useMemo(() => {
    let docList = [];
    if (bailBondDetails?.sureties?.length > 0) {
      bailBondDetails.sureties.forEach((surety, index) => {
        if (surety?.documents?.length > 0) {
          surety?.documents?.forEach((doc) => {
            docList.push({
              ...doc,
              name: `Surety${index + 1} ${doc?.documentName}`,
            });
          });
        }
      });
    }
    return docList;
  }, [bailBondDetails]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (showModal) {
      setShowBailBondReview(true);
    }
  }, []);

  useEffect(() => {
    setFormdata(convertToFormData(t, bailBondDetails || {}));
  }, [bailBondDetails, t]);

  // useEffect(() => {
  //   if (defaultFormValue?.selectComplainant?.uuid && !complainantToProcessUuid) {
  //     setComplainantToProcessUuid(defaultFormValue.selectComplainant.uuid);
  //   }
  // }, [defaultFormValue, complainantToProcessUuid]);

  useEffect(() => {
    const newUuidToProcess = complainantToProcessUuid;
    const lastProcessedUuid = prevComplainantUuid.current;
    const fetchAndPopulateComplainantData = async () => {
      if (complainantToProcessUuid) {
        try {
          const selectedComplainant = complainantsList?.find((c) => c.uuid === complainantToProcessUuid);

          if (selectedComplainant && setFormDataValue.current) {
            setLoader(true);
            await handleComplainantSelection(selectedComplainant, setFormDataValue.current);
            setFormDataValue.current("selectComplainant", selectedComplainant);
            prevComplainantUuid.current = newUuidToProcess;
          }
        } catch (error) {
          console.error("Error while fetching and populating complainant data:", error);
        } finally {
          setLoader(false);
        }
      }
    };
    if (newUuidToProcess && newUuidToProcess !== lastProcessedUuid && complainantsList?.length > 1) {
      fetchAndPopulateComplainantData();
    }
  }, [complainantToProcessUuid, complainantsList]);

  useEffect(() => {
    if (caseDetails?.id && !isBailBondLoading && bailBondId && bailBondDetails?.status !== "DRAFT_IN_PROGRESS") {
      history.replace(
        `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Documents`
      );
    }
  }, [isCaseDetailsLoading, isBailBondLoading, bailBondId, bailBondDetails, caseDetails, filingNumber, history, userType]);

  if (isCaseDetailsLoading || !caseDetails || isBailBondLoading || isPendingtaskDataLoading || isApplicationLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "9999",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      <div className="citizen create-submission" style={{ width: "90%", ...(!isCitizen && { padding: "0 8px 24px 16px" }) }}>
        <Header styles={{ margin: "25px 0px 0px 25px" }}> {t("BAIL_BOND_DETAILS")}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto" }}>
          <FormComposerV2
            key={"bailbond-form-composer" + clearAutoPopulatedData + JSON.stringify(defaultFormValue)}
            className={"bailbond"}
            label={t("REVIEW_BAIL_BOND")}
            secondaryLabel={t("SAVE_AS_DRAFT")}
            showSecondaryLabel={true}
            config={modifiedFormConfig}
            defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleSubmit}
            onSecondayActionClick={handleSaveDraft}
            fieldStyle={fieldStyle}
            isDisabled={isSubmitDisabled}
            actionClassName={"bail-action-bar"}
          />
        </div>

        {showBailBondReview && (
          <BailBondReviewModal
            t={t}
            handleBack={() => {
              setShowBailBondReview(false);
              history.replace(`/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondId}`);
            }}
            setShowBailBondReview={setShowBailBondReview}
            setShowsignatureModal={setShowsignatureModal}
            bailBondDetails={bailBondDetails}
            courtId={caseCourtId}
            setBailBondFileStoreId={setBailBondFileStoreId}
            documents={documents}
          />
        )}

        {showSignatureModal && (
          <GenericUploadSignatureModal
            t={t}
            handleCloseSignatureModal={handleCloseSignatureModal}
            handleDownload={handleDownload}
            handleESign={handleESign}
            setShowUploadSignature={setShowUploadSignature}
            showUploadSignature={showUploadSignature}
            handleSubmit={handleSubmitSignature}
            setLoader={setBailUploadLoader}
            loader={bailUploadLoader}
            fileStoreId={bailBondFileStoreId}
          />
        )}

        {showBailBondEsign && (
          <GenericSuccessLinkModal
            t={t}
            handleSaveOnSubmit={handleCloseSuccessModal}
            userType={userType}
            filingNumber={filingNumber}
            signatureUrl={bailBondSignatureURL}
          />
        )}
        {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"BAIL_BOND_BANNER_HEADER"} />}
        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default GenerateBailBondV2;
