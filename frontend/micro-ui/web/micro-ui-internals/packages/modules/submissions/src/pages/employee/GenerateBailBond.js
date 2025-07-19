import { FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { bailBondConfig } from "../../configs/generateBailBondConfig";
import isEqual from "lodash/isEqual";
import BailBondReviewModal from "../../components/BailBondReviewModal";
import BailUploadSignatureModal from "../../components/BailUploadSignatureModal";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import BailBondEsignLockModal from "../../components/BailBondEsignLockModal";
import { combineMultipleFiles, formatAddress } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { submissionService } from "../../hooks/services";
import useSearchBailBondService from "../../hooks/submissions/useSearchBailBondService";
import { bailBondWorkflowAction } from "../../../../dristi/src/Utils/submissionWorkflow";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";

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
      code: obj?.bailType?.toUpperCase(),
      name: t(obj?.bailType?.toUpperCase()),
      showSurety: obj?.bailType?.toUpperCase() === "SURETY" ? true : false,
    },
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
              document: surety?.documents?.filter((doc) => doc?.documentType === "IDENTITY_PROOF") || [],
            },
            proofOfSolvency: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "PROOF_OF_SOLVENCY") || [],
            },
            otherDocuments: {
              document: surety?.documents?.filter((doc) => doc?.documentType === "OTHER_DOCUMENTS") || [],
            },
          }))
        : [{}],
  };

  return formdata;
};

export const bailBondAddressValidation = ({ formData, inputs }) => {
  if (
    inputs?.some((input) => {
      const isEmpty = /^\s*$/.test(formData?.[input?.name]);
      return isEmpty || !formData?.[input?.name]?.match(window?.Digit.Utils.getPattern(input?.validation?.patternType) || input?.validation?.pattern);
    })
  ) {
    return true;
  }
};

const GenerateBailBond = () => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const { filingNumber, bailBondId, showModal } = Digit.Hooks.useQueryParams();
  const userInfo = Digit.UserService.getUser()?.info;
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
  const [caseApiError, setCaseApiError] = useState(undefined);
  // Flag to prevent multiple breadcrumb updates
  const isBreadCrumbsParamsDataSet = useRef(false);

  // Access breadcrumb context to get and set case navigation data
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const courtId = localStorage.getItem("courtId");

  // const { data: caseData, isLoading: isCaseLoading } = Digit.Hooks.dristi.useSearchCaseService(
  //   {
  //     criteria: [
  //       {
  //         filingNumber: filingNumber,
  //       },
  //     ],
  //     tenantId,
  //   },
  //   {},
  //   `case-details-${filingNumber}`,
  //   filingNumber,
  //   Boolean(filingNumber)
  // );

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
      setCaseApiError(err);
    } finally {
      setIsCaseDetailsLoading(false);
    }
  };

  // Fetch case details on component mount
  useEffect(() => {
    fetchCaseDetails();
  }, [courtId]);

  const { data: bailBond, isLoading: isBailBondLoading } = useSearchBailBondService(
    {
      criteria: {
        bailId: bailBondId,
      },
      tenantId,
    },
    {},
    `bail-bond-details-${bailBondId}`,
    Boolean(bailBondId && filingNumber)
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
    return bailBond?.bails?.[0];
  }, [bailBond]);

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
    const loggedinUserUuid = userInfo?.uuid;
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

  const modifiedFormConfig = useMemo(() => {
    const updatedConfig = bailBondConfig
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
              if (complainantsList?.length === 1) {
                const updatedBody = {
                  ...body,
                  disable: true,
                };
                return updatedBody;
              }
            }
            return {
              ...body,
            };
          }),
        };
      });
    return updatedConfig;
  }, [complainantsList, formdata]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
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

          if (docs?.otherDocuments && Object.keys(formState?.errors).includes(`otherDocuments_${index}`)) {
            clearErrors(`otherDocuments_${index}`);
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
    }
    setFormErrors.current = setError;
    setFormState.current = formState;
    resetFormData.current = reset;
    setFormDataValue.current = setValue;
    clearFormDataErrors.current = clearErrors;
  };

  const defaultFormValue = useMemo(() => {
    if (Object.keys(defaultFormValueData).length > 0) {
      return convertToFormData(t, defaultFormValueData);
    }
    if (bailBondDetails) {
      return convertToFormData(t, bailBondDetails || {});
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
  }, [bailBondDetails, complainantsList, defaultFormValueData, t]);

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
              const file = await onDocumentUpload(combinedIdentityProof?.[0], "identityProof.pdf");
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
              const file = await onDocumentUpload(combinedProof?.[0], "proofOfSolvency.pdf");
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
              const file = await onDocumentUpload(combinedOtherDocs?.[0], "otherDocuments.pdf");
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

    if (existingSureties?.length > 0) {
      return formData?.sureties?.map((surety) => {
        const matchingSurety = existingSureties?.find((existing) => existing?.id === surety?.id);
        return {
          ...matchingSurety,
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
    } else {
      return formData?.sureties?.map((surety) => {
        return {
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
          sureties: sureties,
          litigantId: updatedFormData?.selectComplainant?.uuid,
          litigantName: updatedFormData?.selectComplainant?.name,
          litigantFatherName: updatedFormData?.litigantFatherName,
          litigantMobileNumber: individualData?.Individual?.[0]?.mobileNumber,
          courtId: caseDetails?.courtId,
          caseTitle: caseDetails?.caseTitle,
          cnrNumber: caseDetails?.cnrNumber,
          caseType: caseDetails?.caseType,
          documents: [],
          additionalDetails: {
            createdUserName: userInfo?.name,
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
            sureties: sureties,
            litigantId: updatedFormData?.selectComplainant?.uuid,
            litigantName: updatedFormData?.selectComplainant?.name,
            litigantFatherName: updatedFormData?.litigantFatherName,
            litigantMobileNumber: individualData ? individualData?.Individual?.[0]?.mobileNumber : bailBondDetails?.litigantMobileNumber,
            additionalDetails: {
              createdUserName: userInfo?.name,
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

  const validateSuretyContactNumber = (individualData, formData) => {
    const indivualMobileNumber = individualData?.Individual?.[0]?.mobileNumber;
    formData?.sureties?.forEach((surety) => {
      if (surety?.mobileNumber && surety?.mobileNumber === indivualMobileNumber) {
        setShowErrorToast({ label: t("SURETY_CONTACT_NUMBER_CANNOT_BE_SAME_AS_COMPLAINANT"), error: true });
        throw new Error(t("SURETY_CONTACT_NUMBER_CANNOT_BE_SAME_AS_COMPLAINANT"));
      }
    });
    return true;
  };

  const validateSurities = (sureties) => {
    let error = false;
    if (!sureties && !Object.keys(setFormState?.current?.errors).includes("sureties")) {
      error = true;
      setFormDataValue.current("sureties", [{}, {}]);
      setFormErrors.current("sureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
    } else if (sureties?.length > 0 && !Object.keys(setFormState?.current?.errors).includes("sureties")) {
      sureties?.forEach((docs, index) => {
        if (!docs?.name && !Object.keys(setFormState?.current?.errors).includes(`name_${index}`)) {
          error = true;
          setFormErrors.current(`name_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.fatherName && !Object.keys(setFormState?.current?.errors).includes(`fatherName_${index}`)) {
          error = true;
          setFormErrors.current(`fatherName_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.mobileNumber && !Object.keys(setFormState?.current?.errors).includes(`mobileNumber_${index}`)) {
          error = true;
          setFormErrors.current(`mobileNumber_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.identityProof && !Object.keys(setFormState?.current?.errors).includes(`identityProof_${index}`)) {
          error = true;
          setFormErrors.current(`identityProof_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.proofOfSolvency && !Object.keys(setFormState?.current?.errors).includes(`proofOfSolvency_${index}`)) {
          error = true;
          setFormErrors.current(`proofOfSolvency_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }

        if (!docs?.otherDocuments && !Object.keys(setFormState?.current?.errors).includes(`otherDocuments_${index}`)) {
          error = true;
          setFormErrors.current(`otherDocuments_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        }
      });
    }
    return error;
  };

  const handleSubmit = async () => {
    if (formdata?.bailType?.code === "SURETY") {
      if (validateSurities(formdata?.sureties)) {
        return;
      }

      const inputs = bailBondConfig?.[1]?.body?.[0]?.populators?.inputs?.find((input) => input?.key === "address")?.populators?.inputs;
      for (let i = 0; i < formdata?.sureties?.length; i++) {
        const surety = formdata?.sureties?.[i];
        const isError = bailBondAddressValidation({ formData: surety?.address, inputs });
        if (isError) {
          setShowErrorToast({ label: "CS_PLEASE_CHECK_ADDRESS_DETAILS_BEFORE_SUBMIT", error: true });
          return;
        }
      }
    }

    try {
      setLoader(true);
      const individualData = await getUserUUID(formdata?.selectComplainant?.uuid);
      const validateSuretyContactNumbers = validateSuretyContactNumber(individualData, formdata);

      if (!validateSuretyContactNumbers) {
        setLoader(false);
        return;
      }
      let bailBondResponse = null;
      if (!bailBondId) {
        bailBondResponse = await createBailBond(individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
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
      setLoader(true);
      const individualData = await getUserUUID(formdata?.selectComplainant?.uuid);
      let bailBondResponse = null;
      if (!bailBondId) {
        bailBondResponse = await createBailBond(individualData);
        setDefaultFormValueData(bailBondResponse?.bails?.[0] || {});
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
      const res = await updateBailBond(bailBondFileStoreId, bailBondWorkflowAction.INITIATEESIGN);
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
      setLoader(false);
      const res = await updateBailBond(fileStoreId, bailBondWorkflowAction.UPLOAD);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
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

  if (loader || isCaseDetailsLoading || !caseDetails || isBailBondLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <style>
        {`
          .bail-action-bar {
            display: flex;
            flex-direction: row-reverse;
            gap: 16px;
          }

          .submit-bar {
            width: fit-content;
            padding-inline: 20px;
            box-shadow: none;
          }
          
          .card .label-field-pair .card-label{
          font-weight : unset !important;
          margin-bottom : 8px !important
          }
        `}
      </style>
      <div className="citizen create-submission" style={{ width: "90%", ...(!isCitizen && { padding: "0 8px 24px 16px" }) }}>
        <Header styles={{ margin: "25px 0px 0px 25px" }}> {t("BAIL_BOND_DETAILS")}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto" }}>
          <FormComposerV2
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
              history.replace(
                `/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondDetails?.bailId}`
              );
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
          <BailUploadSignatureModal
            t={t}
            handleCloseSignatureModal={handleCloseSignatureModal}
            handleDownload={handleDownload}
            handleESign={handleESign}
            setShowUploadSignature={setShowUploadSignature}
            showUploadSignature={showUploadSignature}
            handleSubmit={handleSubmitSignature}
            setLoader={setBailUploadLoader}
            loader={bailUploadLoader}
            bailBondFileStoreId={bailBondFileStoreId}
          />
        )}

        {showBailBondEsign && (
          <BailBondEsignLockModal
            t={t}
            handleSaveOnSubmit={handleCloseSuccessModal}
            userType={userType}
            filingNumber={filingNumber}
            bailBondSignatureURL={bailBondSignatureURL}
          />
        )}
        {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"BAIL_BOND_BANNER_HEADER"} />}
        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default GenerateBailBond;
