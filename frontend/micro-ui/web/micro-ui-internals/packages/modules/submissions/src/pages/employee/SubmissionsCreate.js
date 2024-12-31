import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposerV2, Header, Loader } from "@egovernments/digit-ui-react-components";
import {
  applicationTypeConfig,
  configsBailBond,
  configsCaseTransfer,
  configsCaseWithdrawal,
  configsCheckoutRequest,
  configsDocumentSubmission,
  configsExtensionSubmissionDeadline,
  configsOthers,
  configsProductionOfDocuments,
  configsRescheduleRequest,
  configsSettlement,
  configsSurety,
  submissionTypeConfig,
  requestForBail,
  submitDocsForBail,
  submitDelayCondonation,
} from "../../configs/submissionsCreateConfig";
import ReviewSubmissionModal from "../../components/ReviewSubmissionModal";
import SubmissionSignatureModal from "../../components/SubmissionSignatureModal";
import PaymentModal from "../../components/PaymentModal";
import SuccessModal from "../../components/SuccessModal";
import { DRISTIService } from "../../../../dristi/src/services";
import { submissionService } from "../../hooks/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import isEqual from "lodash/isEqual";
import { orderTypes } from "../../utils/orderTypes";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../../../dristi/src/Utils/submissionWorkflow";
import { Urls } from "../../hooks/services/Urls";
import { getAdvocates } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/EfilingValidationUtils";
import usePaymentProcess from "../../../../home/src/hooks/usePaymentProcess";
import { getSuffixByBusinessCode, getTaxPeriodByBusinessService, getCourtFeeAmountByPaymentType } from "../../utils";
import { combineMultipleFiles, getFilingType } from "@egovernments/digit-ui-module-dristi/src/Utils";

const fieldStyle = { marginRight: 0, width: "100%" };

const stateSla = {
  RE_SCHEDULE: 2 * 24 * 3600 * 1000,
  CHECKOUT_REQUEST: 2 * 24 * 3600 * 1000,
  ESIGN_THE_SUBMISSION: 2 * 24 * 3600 * 1000,
  MAKE_PAYMENT_SUBMISSION: 2 * 24 * 3600 * 1000,
};

const SubmissionsCreate = ({ path }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const { orderNumber, filingNumber, applicationNumber, isExtension, hearingId, applicationType: applicationTypeUrl } = Digit.Hooks.useQueryParams();
  const [formdata, setFormdata] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showsignatureModal, setShowsignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [makePaymentLabel, setMakePaymentLabel] = useState(false);
  const [loader, setLoader] = useState(false);
  const userInfo = Digit.UserService.getUser()?.info;
  const applicationTypeParam = useMemo(() => applicationTypeUrl, [applicationTypeUrl]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const [signedDoucumentUploadedID, setSignedDocumentUploadID] = useState("");
  const [applicationPdfFileStoreId, setApplicationPdfFileStoreId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const scenario = "applicationSubmission";
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const hasSubmissionRole = useMemo(
    () =>
      ["SUBMISSION_CREATOR", "SUBMISSION_RESPONDER"].reduce((result, current) => {
        if (!result) return result;
        result = userInfo?.roles?.includes(current);
        return result;
      }, false),
    [userInfo]
  );
  const todayDate = new Date().getTime();
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

  const { data: paymentTypeData, isLoading: isPaymentTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "payment",
    [{ name: "paymentType" }],
    {
      select: (data) => {
        return data?.payment?.paymentType || [];
      },
    }
  );

  const { data: taxPeriodData, isLoading: taxPeriodLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "BillingService",
    [{ name: "TaxPeriod" }],
    {
      select: (data) => {
        return data?.BillingService?.TaxPeriod || [];
      },
    }
  );

  const { data: courtFeeAmount, isLoading: isLoadingCourtFeeData } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "payment",
    [{ name: "courtFeePayment" }],
    {
      select: (data) => {
        return data?.payment?.courtFeePayment || [];
      },
    }
  );

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "Application"), [filingTypeData?.FilingType]);

  const { data: documentTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Application", [{ name: "DocumentType" }], {
    select: (data) => {
      return data?.Application?.DocumentType || [];
    },
  });

  const { data: caseData } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
        },
      ],
      tenantId,
    },
    {},
    `case-details-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

  const { data: applicationData, isloading: isApplicationLoading, refetch: applicationRefetch } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        applicationNumber,
        tenantId,
      },
      tenantId,
    },
    {},
    applicationNumber + filingNumber,
    Boolean(applicationNumber + filingNumber)
  );

  const orderRefNumber = useMemo(() => applicationData?.applicationList?.[0]?.additionalDetails?.formdata?.refOrderId, [applicationData]);
  const referenceId = useMemo(() => applicationData?.applicationList?.[0]?.referenceId, [applicationData]);

  const submissionType = useMemo(() => {
    return formdata?.submissionType?.code;
  }, [formdata?.submissionType?.code]);

  const submissionFormConfig = useMemo(() => {
    const submissionConfigKeys = {
      APPLICATION: applicationTypeConfig,
    };
    if (applicationData && caseDetails && Array.isArray(submissionConfigKeys[submissionType])) {
      const isDelayApplicationPending = Boolean(
        applicationData?.applicationList?.some(
          (item) =>
            item?.applicationType === "DELAY_CONDONATION" &&
            [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
        )
      );
      if (orderNumber || (hearingId && applicationTypeUrl) || !isCitizen) {
        const tempData = submissionConfigKeys[submissionType]?.map((item) => {
          return {
            ...item,
            body: item?.body?.map((input) => {
              return { ...input, disable: true };
            }),
          };
        });
        return tempData;
      } else {
        return submissionConfigKeys[submissionType]?.map((item) => {
          return {
            ...item,
            body: item?.body?.map((input) => {
              return {
                ...input,
                populators: {
                  ...input.populators,
                  mdmsConfig: {
                    ...input.populators.mdmsConfig,
                    select: `(data) => {return data['Application'].ApplicationType?.filter((item)=>!["EXTENSION_SUBMISSION_DEADLINE","DOCUMENT","RE_SCHEDULE","CHECKOUT_REQUEST", "SUBMIT_BAIL_DOCUMENTS",${
                      isDelayApplicationPending ? `"DELAY_CONDONATION",` : ""
                    }${
                      caseDetails?.status !== "CASE_ADMITTED" ? `"REQUEST_FOR_BAIL",` : ""
                    }].includes(item.type)).map((item) => {return { ...item, name: 'APPLICATION_TYPE_'+item.type };});}`,
                  },
                },
              };
            }),
          };
        });
      }
    }
    return [];
  }, [applicationData, caseDetails, submissionType, orderNumber, hearingId, applicationTypeUrl, isCitizen]);

  const applicationType = useMemo(() => {
    return formdata?.applicationType?.type || applicationTypeUrl;
  }, [formdata?.applicationType?.type, applicationTypeUrl]);

  const applicationFormConfig = useMemo(() => {
    const applicationConfigKeys = {
      RE_SCHEDULE: configsRescheduleRequest,
      EXTENSION_SUBMISSION_DEADLINE: configsExtensionSubmissionDeadline,
      PRODUCTION_DOCUMENTS: configsProductionOfDocuments,
      WITHDRAWAL: configsCaseWithdrawal,
      TRANSFER: configsCaseTransfer,
      SETTLEMENT: configsSettlement,
      BAIL_BOND: configsBailBond,
      SURETY: configsSurety,
      CHECKOUT_REQUEST: configsCheckoutRequest,
      REQUEST_FOR_BAIL: requestForBail,
      SUBMIT_BAIL_DOCUMENTS: submitDocsForBail,
      DELAY_CONDONATION: submitDelayCondonation,
      OTHERS: configsOthers, // need to chnage here
    };
    const applicationConfigKeysForEmployee = {
      DOCUMENT: configsDocumentSubmission,
    };
    let newConfig = isCitizen ? applicationConfigKeys?.[applicationType] || [] : applicationConfigKeysForEmployee?.[applicationType] || [];

    if (newConfig.length > 0) {
      const updatedConfig = newConfig.map((config) => {
        return {
          ...config,
          body: config?.body.map((body) => {
            if (body?.populators?.validation?.customValidationFn) {
              const customValidations =
                Digit.Customizations[body.populators.validation.customValidationFn.moduleName][
                  body.populators.validation.customValidationFn.masterName
                ];

              if (customValidations) {
                body.populators.validation = {
                  ...body.populators.validation,
                  ...customValidations(),
                };
              }
            }
            if (body?.key === "suretyDocuments") {
              body.populators.inputs[0].modalData = documentTypeData;
            }
            return {
              ...body,
            };
          }),
        };
      });
      return updatedConfig;
    } else {
      return [];
    }
  }, [applicationType, documentTypeData, isCitizen]);

  const formatDate = (date, format) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    if (format === "DD-MM-YYYY") {
      return `${day}-${month}-${year}`;
    }
    return `${year}-${month}-${day}`;
  };

  const modifiedFormConfig = useMemo(() => {
    return [...submissionTypeConfig, ...submissionFormConfig, ...applicationFormConfig];
  }, [submissionFormConfig, applicationFormConfig]);

  const { data: hearingsData } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: hearingId,
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    "dristi",
    true
  );

  const applicationDetails = useMemo(() => (applicationNumber ? applicationData?.applicationList?.[0] : undefined), [
    applicationData?.applicationList,
    applicationNumber,
  ]);

  useEffect(() => {
    if (applicationDetails) {
      if ([SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(applicationDetails?.status)) {
        setShowReviewModal(true);
        return;
      }
      if (applicationDetails?.status === SubmissionWorkflowState.PENDINGPAYMENT) {
        setShowPaymentModal(true);
        return;
      }
    }
  }, [applicationDetails]);

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

  const { data: orderData, isloading: isOrdersLoading } = Digit.Hooks.orders.useSearchOrdersService(
    { tenantId, criteria: { filingNumber, applicationNumber: "", cnrNumber: caseDetails?.cnrNumber, orderNumber: orderNumber || orderRefNumber } },
    { tenantId },
    filingNumber + caseDetails?.cnrNumber,
    Boolean(filingNumber && caseDetails?.cnrNumber && (orderNumber || orderRefNumber))
  );
  const orderDetails = useMemo(() => orderData?.list?.[0], [orderData]);

  const { data: allOrdersData, isloading: isAllOrdersLoading } = Digit.Hooks.orders.useSearchOrdersService(
    { tenantId, criteria: { filingNumber, applicationNumber: "", cnrNumber: caseDetails?.cnrNumber } },
    { tenantId },
    filingNumber + caseDetails?.cnrNumber + "allOrdersData",
    Boolean(filingNumber && caseDetails?.cnrNumber)
  );
  const allOrdersList = useMemo(() => allOrdersData?.list, [allOrdersData]);
  const extensionOrders = useMemo(
    () =>
      allOrdersList
        ?.filter(
          (item) =>
            item.orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" &&
            item?.additionalDetails?.applicationStatus === "APPROVED" &&
            item?.linkedOrderNumber === orderDetails?.orderNumber
        )
        ?.sort((a, b) => b?.auditDetails?.lastModifiedTime - a?.auditDetails?.lastModifiedTime),
    [allOrdersList, orderDetails]
  );
  const latestExtensionOrder = useMemo(() => extensionOrders?.[0], [extensionOrders]);

  const { entityType, taxHeadMasterCode } = useMemo(() => {
    const isResponseRequired = orderDetails?.orderDetails.isResponseRequired?.code === true;
    if ((orderNumber || orderRefNumber) && referenceId) {
      return {
        entityType: isResponseRequired ? "application-order-submission-feedback" : "application-order-submission-default",
        taxHeadMasterCode: isResponseRequired
          ? "APPLICATION_ORDER_SUBMISSION_FEEDBACK_ADVANCE_CARRYFORWARD"
          : "APPLICATION_ORDER_SUBMISSION_DEFAULT_ADVANCE_CARRY_FORWARD",
      };
    }
    // need Specific for request for bail
    if (applicationType === "REQUEST_FOR_BAIL") {
      return {
        entityType: "voluntary-application-submission-bail",
        taxHeadMasterCode: "APPLICATION_VOLUNTARY_BAIL_SUBMISSION_ADVANCE_CARRY_FORWARD",
      };
    }
    return {
      entityType: "application-voluntary-submission",
      taxHeadMasterCode: "APPLICATION_VOLUNTARY_SUBMISSION_ADVANCE_CARRY_FORWARD",
    };
  }, [applicationType, orderDetails?.orderDetails.isResponseRequired?.code, orderNumber, orderRefNumber, referenceId]);

  const defaultFormValue = useMemo(() => {
    if (applicationDetails?.additionalDetails?.formdata) {
      return applicationDetails?.additionalDetails?.formdata;
    } else if (!isCitizen && applicationTypeParam) {
      return {
        submissionType: {
          code: "APPLICATION",
          name: "APPLICATION",
        },
        ...(applicationTypeParam && {
          applicationType: {
            type: applicationTypeParam,
            name: `APPLICATION_TYPE_${applicationTypeParam}`,
          },
        }),
      };
    } else if (hearingId && hearingsData?.HearingList?.[0]?.startTime && applicationTypeUrl) {
      return {
        submissionType: {
          code: "APPLICATION",
          name: "APPLICATION",
        },
        applicationType: {
          type: applicationTypeUrl,
          isactive: true,
          name: `APPLICATION_TYPE_${applicationTypeUrl}`,
        },
        applicationDate: formatDate(new Date()),
      };
    } else if (orderNumber) {
      if (orderDetails?.orderType === orderTypes.MANDATORY_SUBMISSIONS_RESPONSES) {
        if (isExtension) {
          const initialSubmissionDate = latestExtensionOrder
            ? formatDate(new Date(latestExtensionOrder?.orderDetails.newSubmissionDate))
            : orderDetails?.additionalDetails?.formdata?.submissionDeadline;
          return {
            submissionType: {
              code: "APPLICATION",
              name: "APPLICATION",
            },
            applicationType: {
              type: "EXTENSION_SUBMISSION_DEADLINE",
              isactive: true,
              name: "APPLICATION_TYPE_EXTENSION_SUBMISSION_DEADLINE",
            },
            refOrderId: orderDetails?.orderNumber,
            applicationDate: formatDate(new Date()),
            documentType: orderDetails?.additionalDetails?.formdata?.documentType,
            initialSubmissionDate: initialSubmissionDate,
          };
        } else {
          return {
            submissionType: {
              code: "APPLICATION",
              name: "APPLICATION",
            },
            applicationType: {
              type: "PRODUCTION_DOCUMENTS",
              isactive: true,
              name: "APPLICATION_TYPE_PRODUCTION_DOCUMENTS",
            },
            refOrderId: orderDetails?.orderNumber,
            applicationDate: formatDate(new Date()),
          };
        }
      } else if (orderDetails?.orderType === orderTypes.WARRANT) {
        return {
          submissionType: {
            code: "APPLICATION",
            name: "APPLICATION",
          },
          applicationType: {
            type: "BAIL_BOND",
            name: "APPLICATION_TYPE_BAIL_BOND",
          },
          refOrderId: orderDetails?.orderNumber,
          applicationDate: formatDate(new Date()),
        };
      } else if (orderDetails?.orderType === orderTypes.SET_BAIL_TERMS) {
        return {
          submissionType: {
            code: "APPLICATION",
            name: "APPLICATION",
          },
          applicationType: {
            type: "SUBMIT_BAIL_DOCUMENTS",
            name: "APPLICATION_TYPE_SUBMIT_BAIL_DOCUMENTS",
          },
          refOrderId: orderDetails?.orderNumber,
          applicationDate: formatDate(new Date()),
        };
      } else {
        return {
          submissionType: {
            code: "APPLICATION",
            name: "APPLICATION",
          },
          applicationDate: formatDate(new Date()),
        };
      }
    } else if (applicationType) {
      return {
        submissionType: {
          code: "APPLICATION",
          name: "APPLICATION",
        },
        applicationType: {
          type: applicationType,
          name: `APPLICATION_TYPE_${applicationType}`,
          isActive: true,
        },
        applicationDate: formatDate(new Date()),
      };
    } else {
      return {
        submissionType: {
          code: "APPLICATION",
          name: "APPLICATION",
        },
        applicationDate: formatDate(new Date()),
      };
    }
  }, [
    applicationDetails,
    isCitizen,
    hearingId,
    hearingsData,
    orderNumber,
    applicationType,
    applicationTypeParam,
    orderDetails,
    isExtension,
    latestExtensionOrder,
    applicationTypeUrl,
  ]);

  const formKey = useMemo(() => applicationType + (defaultFormValue?.initialSubmissionDate || ""), [applicationType, defaultFormValue]);

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    if (
      applicationType &&
      !["OTHERS", "DOCUMENT", "REQUEST_FOR_BAIL", "SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType) &&
      !formData?.applicationDate
    ) {
      setValue("applicationDate", formatDate(new Date()));
    }
    // if (applicationType && applicationType === "TRANSFER" && !formData?.requestedCourt) {
    //   setValue("requestedCourt", caseDetails?.courtId ? t(`COMMON_MASTERS_COURT_R00M_${caseDetails?.courtId}`) : "");
    // }
    if (applicationType && hearingId && ["CHECKOUT_REQUEST", "RE_SCHEDULE"].includes(applicationType) && !formData?.initialHearingDate) {
      setValue("initialHearingDate", formatDate(new Date(hearingsData?.HearingList?.[0]?.startTime)));
    }
    if (
      applicationType &&
      ["CHECKOUT_REQUEST", "RE_SCHEDULE"].includes(applicationType) &&
      formData?.initialHearingDate &&
      formData?.changedHearingDate
    ) {
      if (new Date(formData?.initialHearingDate).getTime() >= new Date(formData?.changedHearingDate).getTime()) {
        setValue("changedHearingDate", "");
        setError("changedHearingDate", { message: t("PROPOSED_DATE_CAN_NOT_BE_BEFORE_INITIAL_DATE") });
      } else if (Object.keys(formState?.errors).includes("changedHearingDate")) {
        setValue("changedHearingDate", formData?.changedHearingDate);
        clearErrors("changedHearingDate");
      }
    }

    if (applicationType && ["REQUEST_FOR_BAIL", "SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType) && formState?.submitCount) {
      if (!formData?.supportingDocuments && !Object.keys(formState?.errors).includes("supportingDocuments")) {
        setValue("supportingDocuments", [{}]);
        setError("supportingDocuments", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      } else if (formData?.supportingDocuments?.length > 0 && !Object.keys(formState?.errors).includes("supportingDocuments")) {
        formData?.supportingDocuments?.forEach((docs, index) => {
          if (!docs?.documentType && !Object.keys(formState?.errors).includes(`documentType_${index}`)) {
            setError(`documentType_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          } else if (docs?.documentType && Object.keys(formState?.errors).includes(`documentType_${index}`)) {
            clearErrors(`documentType_${index}`);
          }
          if (!docs?.submissionDocuments?.uploadedDocs?.length && !Object.keys(formState?.errors).includes(`submissionDocuments_${index}`)) {
            setError(`submissionDocuments_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          } else if (docs?.submissionDocuments?.uploadedDocs?.length && Object.keys(formState?.errors).includes(`submissionDocuments_${index}`)) {
            clearErrors(`submissionDocuments_${index}`);
          }
        });
      } else if (formData?.supportingDocuments?.length > 0 && Object.keys(formState?.errors).includes("supportingDocuments")) {
        clearErrors("supportingDocuments");
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
  };
  const onDocumentUpload = async (fileData, filename) => {
    if (fileData?.fileStore) return fileData;
    const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  };

  const createPendingTask = async ({
    name,
    status,
    isCompleted = false,
    refId = applicationNumber,
    stateSla = null,
    isAssignedRole = false,
    assignedRole = [],
  }) => {
    const assignes = !isAssignedRole ? [userInfo?.uuid] || [] : [];
    await submissionService.customApiService(Urls.application.pendingTask, {
      pendingTask: {
        name,
        entityType,
        referenceId: `MANUAL_${refId}`,
        status,
        assignedTo: assignes?.map((uuid) => ({ uuid })),
        assignedRole: assignedRole,
        cnrNumber: caseDetails?.cnrNumber,
        filingNumber: filingNumber,
        isCompleted,
        stateSla,
        additionalDetails: {},
        tenantId,
      },
    });
  };
  const cleanString = (input) => {
    return input
      .replace(/\b(null|undefined)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };
  const createSubmission = async () => {
    try {
      let documentsList = [];
      if (formdata?.listOfProducedDocuments?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.listOfProducedDocuments?.documents];
      }
      if (formdata?.reasonForDocumentsSubmission?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.reasonForDocumentsSubmission?.documents];
      }
      if (formdata?.submissionDocuments?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.submissionDocuments?.documents];
      }
      if (formdata?.othersDocument?.documents?.length > 0) {
        documentsList = [...documentsList, ...formdata?.othersDocument?.documents];
      }

      const applicationDocuments = ["REQUEST_FOR_BAIL", "SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType)
        ? formdata?.supportingDocuments?.map((supportDocs) => ({
            fileType: supportDocs?.submissionDocuments?.uploadedDocs?.[0]?.documentType,
            fileStore: supportDocs?.submissionDocuments?.uploadedDocs?.[0]?.fileStore,
            additionalDetails: supportDocs?.submissionDocuments?.uploadedDocs?.[0]?.additionalDetails,
          })) || []
        : formdata?.submissionDocuments?.submissionDocuments?.map((item) => ({
            fileType: item?.document?.documentType,
            fileStore: item?.document?.fileStore,
            additionalDetails: item?.document?.additionalDetails,
          })) || [];

      const documentres = (await Promise.all(documentsList?.map((doc) => onDocumentUpload(doc, doc?.name)))) || [];
      let documents = [];
      let file = null;
      let evidenceReqBody = {};
      const uploadedDocumentList = [...(documentres || []), ...applicationDocuments];

      // evidence we are creating after create application (each evidenece need application Number)
      uploadedDocumentList.forEach((res) => {
        file = {
          documentType: res?.fileType,
          fileStore: res?.fileStore || res?.file?.files?.[0]?.fileStoreId,
          additionalDetails: { name: res?.filename || res?.additionalDetails?.name },
        };
        documents.push(file);
      });

      let applicationSchema = {};
      try {
        applicationSchema = Digit.Customizations.dristiOrders.ApplicationFormSchemaUtils.formToSchema(formdata, modifiedFormConfig);
      } catch (error) {
        console.error(error);
      }
      if (userTypeCitizen === "ADVOCATE") {
        applicationSchema = {
          ...applicationSchema,
          applicationDetails: { ...applicationSchema?.applicationDetails, advocateIndividualId: individualId },
        };
      }

      if (applicationType === "SUBMIT_BAIL_DOCUMENTS") {
        applicationSchema = {
          ...applicationSchema,
          applicationDetails: { ...applicationSchema?.applicationDetails, relatedApplication: orderDetails?.applicationNumber },
        };
      }

      if (applicationType === "DELAY_CONDONATION") {
        applicationSchema = {
          ...applicationSchema,
          applicationDetails: { ...applicationSchema?.applicationDetails },
        };
      }

      const applicationReqBody = {
        tenantId,
        application: {
          ...applicationSchema,
          tenantId,
          filingNumber,
          cnrNumber: caseDetails?.cnrNumber,
          cmpNumber: caseDetails?.cmpNumber,
          caseId: caseDetails?.id,
          referenceId: isExtension ? null : orderDetails?.id || null,
          createdDate: new Date().getTime(),
          applicationType,
          status: caseDetails?.status,
          isActive: true,
          createdBy: userInfo?.uuid,
          statuteSection: { tenantId },
          additionalDetails: {
            formdata,
            ...(orderDetails && { orderDate: formatDate(new Date(orderDetails?.auditDetails?.lastModifiedTime)) }),
            ...(orderDetails?.additionalDetails?.formdata?.documentName && { documentName: orderDetails?.additionalDetails?.formdata?.documentName }),
            onBehalOfName: onBehalfOfLitigent?.additionalDetails?.fullName,
            partyType: sourceType?.toLowerCase(),
            ...(orderDetails &&
              orderDetails?.orderDetails.isResponseRequired?.code === true && {
                respondingParty: orderDetails?.additionalDetails?.formdata?.responseInfo?.respondingParty,
              }),
            isResponseRequired: orderDetails && !isExtension ? orderDetails?.orderDetails.isResponseRequired?.code === true : true,
            ...(hearingId && { hearingId }),
            owner: cleanString(userInfo?.name),
          },
          documents,
          onBehalfOf: [isCitizen ? onBehalfOfuuid : userInfo?.uuid],
          comment: [],
          workflow: {
            id: "workflow123",
            action: SubmissionWorkflowAction.CREATE,
            status: "in_progress",
            comments: "Workflow comments",
            documents: [{}],
          },
        },
      };
      const res = await submissionService.createApplication(applicationReqBody, { tenantId });

      documents?.forEach((docs) => {
        evidenceReqBody = {
          artifact: {
            artifactType: "DOCUMENTARY",
            caseId: caseDetails?.id,
            application: res?.application?.applicationNumber,
            filingNumber,
            tenantId,
            comments: [],
            file: docs,
            sourceType,
            sourceID: individualId,
            filingType: filingType,
            additionalDetails: {
              uuid: userInfo?.uuid,
            },
          },
        };
        DRISTIService.createEvidence(evidenceReqBody);
      });
      setLoader(false);
      return res;
    } catch (error) {
      setLoader(false);
      return null;
    }
  };

  const updateSubmission = async (action) => {
    try {
      const localStorageID = localStorage.getItem("fileStoreId");
      const documents = Array.isArray(applicationDetails?.documents) ? applicationDetails.documents : [];
      const documentsFile =
        signedDoucumentUploadedID !== "" || localStorageID
          ? {
              documentType: "SIGNED",
              fileStore: signedDoucumentUploadedID || localStorageID,
              additionalDetails: { name: "Signed_Doc.pdf" },
            }
          : null;

      localStorage.removeItem("fileStoreId");
      const reqBody = {
        application: {
          ...applicationDetails,
          documents: documentsFile ? [...documents, documentsFile] : documents,
          workflow: { ...applicationDetails?.workflow, documents: [{}], action },
          tenantId,
        },
        tenantId,
      };

      const submissionResponse = await submissionService.updateApplication(reqBody, { tenantId });
      if (isCitizen || hasSubmissionRole) {
        await createPendingTask({
          name: t("ESIGN_THE_SUBMISSION"),
          status: "ESIGN_THE_SUBMISSION",
          isCompleted: true,
          ...(hasSubmissionRole && { isAssignedRole: true, assignedRole: ["SUBMISSION_CREATOR", "SUBMISSION_RESPONDER"] }),
        });

        if (applicationType === "SUBMIT_BAIL_DOCUMENTS") {
          applicationRefetch();
          setShowSuccessModal(true);
          return submissionResponse;
        }

        await createPendingTask({
          name: t("MAKE_PAYMENT_SUBMISSION"),
          status: "MAKE_PAYMENT_SUBMISSION",
          stateSla: todayDate + stateSla.MAKE_PAYMENT_SUBMISSION,
          ...(hasSubmissionRole && { isAssignedRole: true, assignedRole: ["SUBMISSION_CREATOR", "SUBMISSION_RESPONDER"] }),
        });
      }
      applicationRefetch();
      setShowPaymentModal(true);
      return submissionResponse;
    } catch (error) {
      setShowReviewModal(true);
    }
    setShowsignatureModal(false);
    setLoader(false);
  };

  // move to utils
  const replaceUploadedDocsWithCombinedFile = async (formData) => {
    if (formData?.supportingDocuments?.length) {
      for (let index = 0; index < formData.supportingDocuments.length; index++) {
        const doc = formData.supportingDocuments[index];
        if (doc?.submissionDocuments?.uploadedDocs?.length) {
          try {
            const combinedDocName = `SUPPORTING_DOCS_${index + 1}.pdf`;
            const combinedDocumentFile = await combineMultipleFiles(doc.submissionDocuments.uploadedDocs, combinedDocName, "submissionDocuments");
            const docs = await onDocumentUpload(combinedDocumentFile?.[0], combinedDocName);
            const file = {
              documentType: docs?.fileType,
              fileStore: docs?.file?.files?.[0]?.fileStoreId,
              additionalDetails: { name: docs?.filename || combinedDocName },
            };
            doc.submissionDocuments.uploadedDocs = [file];
          } catch (error) {
            console.error("Error combining or uploading documents for index:", index, error);
            throw new Error("Failed to combine and update uploaded documents.");
          }
        }
      }
    }
    return formData;
  };

  const handleOpenReview = async () => {
    setLoader(true);

    if (applicationType && ["REQUEST_FOR_BAIL", "SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType)) {
      const updatedFormData = await replaceUploadedDocsWithCombinedFile(formdata);
      setFormdata(updatedFormData);
    }

    const res = await createSubmission();
    const newapplicationNumber = res?.application?.applicationNumber;
    if (newapplicationNumber) {
      if (isCitizen) {
        await createPendingTask({
          name: t("ESIGN_THE_SUBMISSION"),
          status: "ESIGN_THE_SUBMISSION",
          refId: newapplicationNumber,
          stateSla: todayDate + stateSla.ESIGN_THE_SUBMISSION,
        });
      } else if (hasSubmissionRole) {
        await createPendingTask({
          name: t("ESIGN_THE_SUBMISSION"),
          status: "ESIGN_THE_SUBMISSION",
          refId: newapplicationNumber,
          stateSla: todayDate + stateSla.ESIGN_THE_SUBMISSION,
          isAssignedRole: true,
          assignedRole: ["SUBMISSION_CREATOR", "SUBMISSION_RESPONDER"],
        });
      }
      ["PRODUCTION_DOCUMENTS", "SUBMIT_BAIL_DOCUMENTS"].includes(applicationType) &&
        (orderNumber || orderRefNumber) &&
        createPendingTask({
          refId: `${userInfo?.uuid}_${orderNumber || orderRefNumber}`,
          isCompleted: true,
          status: "Completed",
          ...(applicationType === "SUBMIT_BAIL_DOCUMENTS" && { name: t("SUBMIT_BAIL_DOCUMENTS") }),
        });
      history.push(
        orderNumber
          ? `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}&orderNumber=${orderNumber}`
          : `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}`
      );
    }
  };

  const handleBack = () => {
    if (!paymentLoader) {
      history.replace(`/digit-ui/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Submissions`);
    }
  };

  const handleAddSignature = async () => {
    setLoader(true);
    try {
      if (applicationType !== "SUBMIT_BAIL_DOCUMENTS") {
        await createDemand();
      }
      const response = await updateSubmission(SubmissionWorkflowAction.ESIGN);
      if (response && response?.application?.additionalDetails?.isResponseRequired) {
        await submissionService.customApiService(Urls.application.taskCreate, {
          task: {
            workflow: {
              action: "CREATE",
            },
            filingNumber: response?.application?.filingNumber,
            assignedTo: response?.application?.additionalDetails?.respondingParty
              ?.flatMap((item) => item?.uuid?.map((u) => ({ uuid: u })))
              ?.filter((item) => item?.uuid !== userInfo?.uuid),
            state: "PENDINGRESPONSE",
            referenceId: response?.application?.applicationNumber,
            taskType: "PENDING_TASK",
            tenantId,
            status: "INPROGRESS",
            duedate: orderDetails?.orderDetails?.dates?.responseDeadlineDate,
          },
          tenantId,
        });
      }
    } catch (error) {
      setLoader(false);
    }
    setLoader(false);
  };

  const handleCloseSignaturePopup = () => {
    setShowsignatureModal(false);
    setShowReviewModal(true);
  };

  const handleSkipPayment = () => {
    setMakePaymentLabel(true);
    setShowPaymentModal(false);
    setShowSuccessModal(true);

    if (!paymentLoader) {
      setMakePaymentLabel(true);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
    }
  };

  const suffix = useMemo(() => getSuffixByBusinessCode(paymentTypeData, entityType) || "APPL_FILING", [entityType, paymentTypeData]);
  // const amount = getCourtFeeAmountByPaymentType(courtFeeAmount, "APPLICATION_FEE");
  const { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal, billPaymentStatus } = usePaymentProcess({
    tenantId,
    consumerCode: applicationDetails?.applicationNumber + `_${suffix}`,
    service: entityType,
    path,
    caseDetails,
    totalAmount: "2",
    scenario,
  });

  const { data: billResponse, isLoading: isBillLoading } = Digit.Hooks.dristi.useBillSearch(
    {},
    { tenantId, consumerCode: applicationDetails?.applicationNumber + `_${suffix}`, service: entityType },
    `dristi_${suffix}`,
    Boolean(applicationDetails?.applicationNumber && suffix)
  );

  const createDemand = async () => {
    if (billResponse?.Bill?.length === 0) {
      const taxPeriod = getTaxPeriodByBusinessService(taxPeriodData, entityType);
      await DRISTIService.createDemand({
        Demands: [
          {
            tenantId,
            consumerCode: applicationDetails?.applicationNumber + `_${suffix}`,
            consumerType: entityType,
            businessService: entityType,
            taxPeriodFrom: taxPeriod?.fromDate,
            taxPeriodTo: taxPeriod?.toDate,
            demandDetails: [
              {
                taxHeadMasterCode: taxHeadMasterCode,
                taxAmount: 2,
                collectionAmount: 0,
              },
            ],
            additionalDetails: {
              filingNumber: caseDetails?.filingNumber,
              cnrNumber: caseDetails?.cnrNumber,
              payer: caseDetails?.litigants?.[0]?.additionalDetails?.fullName,
              payerMobileNo: caseDetails?.additionalDetails?.payerMobileNo,
            },
          },
        ],
      });
    }
  };

  const handleMakePayment = async (totalAmount) => {
    try {
      const bill = await fetchBill(applicationDetails?.applicationNumber + `_${suffix}`, tenantId, entityType);
      if (bill?.Bill?.length) {
        const billPaymentStatus = await openPaymentPortal(bill);
        setPaymentStatus(billPaymentStatus);
        await applicationRefetch();
        console.log(billPaymentStatus);
        if (billPaymentStatus === true) {
          setMakePaymentLabel(false);
          setShowPaymentModal(false);
          setShowSuccessModal(true);
          createPendingTask({ name: t("MAKE_PAYMENT_SUBMISSION"), status: "MAKE_PAYMENT_SUBMISSION", isCompleted: true });
        } else {
          setMakePaymentLabel(true);
          setShowPaymentModal(false);
          setShowSuccessModal(true);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadSubmission = () => {
    downloadPdf(tenantId, applicationDetails?.documents?.filter((doc) => doc?.documentType === "SIGNED")?.[0]?.fileStore);
    // history.push(`/digit-ui/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Submissions`);
  };
  if (!filingNumber) {
    handleBack();
  }
  if (
    loader ||
    isOrdersLoading ||
    isApplicationLoading ||
    (applicationNumber ? !applicationDetails?.additionalDetails?.formdata : false) ||
    (orderNumber ? !orderDetails?.orderType : false) ||
    (hearingId ? (hearingsData?.HearingList?.[0]?.startTime ? false : true) : false) ||
    isAllOrdersLoading
  ) {
    return <Loader />;
  }
  return (
    <div className="citizen create-submission" style={{ width: "50%", ...(!isCitizen && { padding: "0 8px 24px 16px" }) }}>
      <Header> {t("CREATE_SUBMISSION")}</Header>
      <div style={{ minHeight: "550px", overflowY: "auto" }}>
        <FormComposerV2
          label={t("REVIEW_SUBMISSION")}
          config={modifiedFormConfig}
          defaultValues={defaultFormValue}
          onFormValueChange={onFormValueChange}
          onSubmit={handleOpenReview}
          fieldStyle={fieldStyle}
          key={formKey}
          isDisabled={isSubmitDisabled}
        />
      </div>
      {showReviewModal && (
        <ReviewSubmissionModal
          t={t}
          applicationType={applicationDetails?.applicationType}
          application={applicationDetails}
          submissionDate={applicationDetails?.createdDate}
          sender={caseDetails?.additionalDetails?.payerName}
          setShowReviewModal={setShowReviewModal}
          setShowsignatureModal={setShowsignatureModal}
          handleBack={handleBack}
          documents={applicationDetails?.documents || []}
          setApplicationPdfFileStoreId={setApplicationPdfFileStoreId}
        />
      )}
      {showsignatureModal && (
        <SubmissionSignatureModal
          t={t}
          handleProceed={handleAddSignature}
          handleCloseSignaturePopup={handleCloseSignaturePopup}
          setSignedDocumentUploadID={setSignedDocumentUploadID}
          applicationPdfFileStoreId={applicationPdfFileStoreId}
        />
      )}
      {showPaymentModal && (
        <PaymentModal
          t={t}
          handleClosePaymentModal={handleBack}
          handleSkipPayment={handleSkipPayment}
          handleMakePayment={handleMakePayment}
          tenantId={tenantId}
          consumerCode={applicationDetails?.applicationNumber}
          paymentLoader={paymentLoader}
          entityType={entityType}
        />
      )}
      {showSuccessModal && (
        <SuccessModal
          t={t}
          isPaymentDone={applicationDetails?.status === SubmissionWorkflowState.PENDINGPAYMENT}
          headerBarEndClose={handleBack}
          handleCloseSuccessModal={makePaymentLabel ? handleMakePayment : handleBack}
          actionCancelLabel={"DOWNLOAD_SUBMISSION"}
          actionCancelOnSubmit={handleDownloadSubmission}
          applicationNumber={applicationNumber}
          createdDate={applicationDetails?.createdDate}
          makePayment={makePaymentLabel}
          paymentStatus={paymentStatus}
        />
      )}
    </div>
  );
};

export default SubmissionsCreate;
