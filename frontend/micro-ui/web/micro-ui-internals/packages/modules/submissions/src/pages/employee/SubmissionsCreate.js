import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormComposerV2, Header, Loader, Toast } from "@egovernments/digit-ui-react-components";
import {
  applicationTypeConfig,
  configsCaseTransfer,
  configsCaseWithdrawal,
  configsCheckoutRequest,
  configsDocumentSubmission,
  configsExtensionSubmissionDeadline,
  configsOthers,
  configsProductionOfDocuments,
  configsRescheduleRequest,
  configsSettlement,
  submissionTypeConfig,
  requestForBail,
  submitDocsForBail,
  submitDelayCondonation,
  poaClaimingConfig,
  configsAdvancementOrAdjournment,
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
import { getSuffixByBusinessCode } from "../../utils";
import { combineMultipleFiles, DateUtils, getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { editRespondentConfig } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/view-case/Config/editRespondentConfig";
import { editComplainantDetailsConfig } from "@egovernments/digit-ui-module-dristi/src/pages/citizen/view-case/Config/editComplainantDetailsConfig";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { validateSuretyContactNumber } from "../../utils/bailBondUtils";
import {
  _getApplicationAmount,
  BAIL_APPLICATION_EXCLUDED_STATUSES,
  extractOrderNumber,
  getModifiedForm,
  stateSla,
  cleanString,
  getReviewModalCancelButtonLabel,
  replaceUploadedDocsWithCombinedFile,
  onDocumentUpload,
  handleDocumentUploadValidation,
  uploadDocumentsIfAny,
  restrictedApplicationTypes,
  _getDefaultFormValue,
  _getFinalDocumentList,
  replaceUploadedDocsWithFile,
} from "../../utils/application";

const fieldStyle = { marginRight: 0, width: "100%" };
const requiredDateFormat = "YYYY-MM-DD";

const SubmissionsCreate = ({ path }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();
  const {
    orderNumber,
    filingNumber,
    applicationNumber,
    isExtension,
    hearingId,
    applicationType: applicationTypeUrl,
    litigant,
    litigantIndId,
    itemId,
    showModal,
  } = Digit.Hooks.useQueryParams();
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
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const [fileStoreIds, setFileStoreIds] = useState(new Set());
  const setFormErrors = useRef(null);
  const setFormState = useRef(null);
  const resetFormData = useRef(null);
  const setFormDataValue = useRef(null);
  const clearFormDataErrors = useRef(null);
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const [showErrorToast, setShowErrorToast] = useState(null);
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);

  const { triggerSurvey, SurveyUI } = Digit.Hooks.dristi.useSurveyManager({ tenantId: tenantId });

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
        userUuid: [authorizedUuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    "",
    authorizedUuid
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

  const { data: applicationTypeAmount, isLoading: isApplicationTypeAmountLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Application",
    [{ name: "ApplicationType" }],
    {
      select: (data) => {
        return data?.Application?.ApplicationType || [];
      },
    }
  );

  const { data: documentTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Application", [{ name: "DocumentType" }], {
    select: (data) => {
      return data?.Application?.DocumentType || [];
    },
  });

  const [caseData, setCaseData] = useState(undefined);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const isBreadCrumbsParamsDataSet = useRef(false);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setIsCaseDetailsLoading(true);
        const caseData = await DRISTIService.searchCaseService(
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
        return null;
      } finally {
        setIsCaseDetailsLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseIdFromBreadCrumbs, filingNumber, filingNumberFromBreadCrumbs, setBreadCrumbsParamsData, tenantId]);

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  // filtering out litigants which are part in person.
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
  }, [caseDetails, pipComplainants, pipAccuseds, authorizedUuid]);

  const {
    data: applicationData,
    isloading: isApplicationLoading,
    refetch: applicationRefetch,
    isFetching: isApplicationFetching,
  } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        applicationNumber,
        tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    applicationNumber + filingNumber,
    Boolean(
      applicationTypeParam === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS"
        ? applicationNumber && filingNumber
        : applicationNumber && filingNumber && caseCourtId
    )
  );

  const { data: delayCondonationData } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        applicationType: "DELAY_CONDONATION",
        tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const fullName = useMemo(() => {
    return (
      caseDetails?.litigants?.find((litigant) => litigant?.additionalDetails?.uuid === authorizedUuid)?.additionalDetails?.fullName ||
      caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === authorizedUuid)?.additionalDetails?.advocateName ||
      ""
    );
  }, [caseDetails, authorizedUuid]);

  const orderRefNumber = useMemo(() => extractOrderNumber(applicationData?.applicationList?.[0]?.additionalDetails?.formdata?.refOrderId), [
    applicationData,
  ]);
  const referenceId = useMemo(() => applicationData?.applicationList?.[0]?.referenceId, [applicationData]);

  const applicationDetails = useMemo(
    () =>
      applicationNumber
        ? applicationData?.applicationList?.[0]
        : "DELAY_CONDONATION" === formdata?.applicationType?.type
        ? delayCondonationData?.applicationList?.find(
            (application) =>
              !["REJECTED", "COMPLETED", "PENDINGPAYMENT", "PENDINGREVIEW"].includes(application?.status) &&
              "DELAY_CONDONATION" === application?.applicationType
          )
        : undefined,
    [applicationData?.applicationList, delayCondonationData?.applicationList, formdata?.applicationType?.type]
  );

  const submissionType = useMemo(() => {
    return formdata?.submissionType?.code;
  }, [formdata?.submissionType?.code]);

  const isDelayApplicationPending = useMemo(
    () =>
      Boolean(
        delayCondonationData?.applicationList?.some(
          (item) =>
            item?.applicationType === "DELAY_CONDONATION" &&
            [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
        )
      ),
    [delayCondonationData?.applicationList]
  );

  const submissionFormConfig = useMemo(() => {
    const submissionConfigKeys = {
      APPLICATION: applicationTypeConfig,
    };
    if (
      (caseDetails || applicationTypeParam === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS") &&
      Array.isArray(submissionConfigKeys[submissionType])
    ) {
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
                    select: `(data) => {
                      return data['Application'].ApplicationType
                        ?.filter((item) => ![
                          "ADDING_WITNESSES",
                          "EXTENSION_SUBMISSION_DEADLINE",
                          "DOCUMENT",
                          "RE_SCHEDULE",
                          "CHECKOUT_REQUEST",
                          "SUBMIT_BAIL_DOCUMENTS",
                          "CORRECTION_IN_COMPLAINANT_DETAILS",
                          "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS",
                          ${!BAIL_APPLICATION_EXCLUDED_STATUSES.includes(caseDetails?.status) ? '"REQUEST_FOR_BAIL"' : '""'}
                        ].includes(item.type))
                        .map((item) => {
                          return { ...item, name: item.type === 'REQUEST_FOR_BAIL' ? 'BAIL' : item.type };
                        })
                        .sort((a, b) => a.name.localeCompare(b.name));
                    }`, // name: 'APPLICATION_TYPE_'+item.type
                  },
                },
              };
            }),
          };
        });
      }
    }
    return [];
  }, [caseDetails, applicationTypeParam, submissionType, orderNumber, hearingId, applicationTypeUrl, isCitizen, isDelayApplicationPending]);

  const applicationType = useMemo(() => {
    return formdata?.applicationType?.type || applicationTypeUrl;
  }, [formdata, applicationTypeUrl]);

  const applicationFormConfig = useMemo(() => {
    const applicationConfigKeys = {
      RE_SCHEDULE: configsRescheduleRequest,
      EXTENSION_SUBMISSION_DEADLINE: configsExtensionSubmissionDeadline,
      PRODUCTION_DOCUMENTS: configsProductionOfDocuments,
      WITHDRAWAL: configsCaseWithdrawal,
      TRANSFER: configsCaseTransfer,
      SETTLEMENT: configsSettlement,
      CHECKOUT_REQUEST: configsCheckoutRequest,
      REQUEST_FOR_BAIL: requestForBail,
      SUBMIT_BAIL_DOCUMENTS: submitDocsForBail,
      DELAY_CONDONATION: submitDelayCondonation,
      OTHERS: configsOthers,
      CORRECTION_IN_COMPLAINANT_DETAILS:
        applicationDetails?.additionalDetails?.profileEditType === "respondentDetails"
          ? getModifiedForm(editRespondentConfig.formconfig, formdata)
          : getModifiedForm(editComplainantDetailsConfig.formconfig, formdata),
      APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS: poaClaimingConfig,
      ADVANCEMENT_OR_ADJOURNMENT_APPLICATION: configsAdvancementOrAdjournment,
    };
    const applicationConfigKeysForEmployee = {
      DOCUMENT: configsDocumentSubmission,
    };
    let newConfig = isCitizen ? applicationConfigKeys?.[applicationType] || [] : applicationConfigKeysForEmployee?.[applicationType] || [];

    if (newConfig.length > 0) {
      const updatedConfig = newConfig?.map((config) => {
        const mappedBody = (config?.body || []).map((body) => {
          if (applicationType === "REQUEST_FOR_BAIL" && typeof body?.show === "function") {
            try {
              const shouldShow = body.show(formdata);
              if (!shouldShow) {
                return {
                  ...body,
                  populators: { ...(body?.populators || {}), hideInForm: true },
                };
              }
              body = { ...body, populators: { ...(body?.populators || {}), hideInForm: false } };
            } catch (e) {}
          }
          if (body?.populators?.validation?.customValidationFn) {
            const customValidations =
              Digit.Customizations[body.populators.validation.customValidationFn.moduleName]?.[
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
          if (body?.key === "selectComplainant") {
            body.populators.options = complainantsList;
            if (complainantsList?.length === 1 || litigant) {
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
        });
        return { ...config, body: mappedBody };
      });
      return updatedConfig;
    } else {
      return [];
    }
  }, [applicationDetails, formdata, isCitizen, applicationType, documentTypeData, complainantsList, litigant]);

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
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    "dristi",
    Boolean(filingNumber && caseCourtId)
  );

  const scheduledHearing = useMemo(() => {
    return hearingsData?.HearingList?.find((hearing) => hearing?.status === "SCHEDULED") || null;
  }, [hearingsData?.HearingList]);

  useEffect(() => {
    if (applicationDetails) {
      if (showModal && applicationDetails?.status === SubmissionWorkflowState.DRAFT_IN_PROGRESS) {
        setShowReviewModal(true);
        return;
      }

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

  useEffect(() => {
    if (signedDoucumentUploadedID && !fileStoreIds?.has(signedDoucumentUploadedID)) {
      setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, signedDoucumentUploadedID]));
    }
    if (applicationPdfFileStoreId && applicationData && !fileStoreIds?.has(applicationPdfFileStoreId))
      setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, applicationPdfFileStoreId]));
  }, [applicationPdfFileStoreId, signedDoucumentUploadedID]);

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(authorizedUuid)), [
    allAdvocates,
    authorizedUuid,
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
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        cnrNumber: caseDetails?.cnrNumber,
        orderNumber: orderNumber || orderRefNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { tenantId },
    filingNumber + caseDetails?.cnrNumber,
    Boolean(filingNumber && caseDetails?.cnrNumber && (orderNumber || orderRefNumber) && caseCourtId)
  );
  const orderDetails = useMemo(() => orderData?.list?.[0], [orderData]);
  const isComposite = useMemo(() => orderDetails?.orderCategory === "COMPOSITE", [orderDetails]);

  const compositeMandatorySubmissionItem = useMemo(() => {
    return orderDetails?.compositeItems?.find((item) => item?.orderType === "MANDATORY_SUBMISSIONS_RESPONSES" && item?.id === itemId);
  }, [itemId, orderDetails]);

  const compositeSetTermBailItem = useMemo(() => {
    return orderDetails?.compositeItems?.find((item) => item?.orderType === "SET_BAIL_TERMS" && item?.id === itemId);
  }, [itemId, orderDetails]);

  const compositeWarrantItem = useMemo(() => {
    return orderDetails?.compositeItems?.find((item) => item?.orderType === "WARRANT" && item?.id === itemId);
  }, [itemId, orderDetails]);

  const { data: allOrdersData, isloading: isAllOrdersLoading } = Digit.Hooks.orders.useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        cnrNumber: caseDetails?.cnrNumber,
        orderType: "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE",
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { tenantId },
    filingNumber + caseDetails?.cnrNumber + "allOrdersData",
    Boolean(filingNumber && caseDetails?.cnrNumber && caseCourtId)
  );
  const allOrdersList = useMemo(() => allOrdersData?.list, [allOrdersData]);
  const extensionOrders = useMemo(
    () =>
      allOrdersList
        ?.filter((order) => {
          if (isComposite) {
            return order?.compositeItems?.some(
              (item) =>
                item?.orderSchema?.additionalDetails?.applicationStatus === "APPROVED" &&
                item?.orderSchema?.additionalDetails?.linkedOrderNumber === `${itemId}_${orderDetails?.orderNumber}`
            );
          } else {
            return order?.additionalDetails?.applicationStatus === "APPROVED" && order?.linkedOrderNumber === orderDetails?.orderNumber;
          }
        })
        ?.sort((a, b) => b?.auditDetails?.lastModifiedTime - a?.auditDetails?.lastModifiedTime),
    [allOrdersList, orderDetails, itemId, isComposite]
  );
  const latestExtensionOrder = useMemo(() => extensionOrders?.[0], [extensionOrders]);

  const { entityType } = useMemo(() => {
    const isResponseRequired = isComposite
      ? compositeMandatorySubmissionItem?.orderSchema?.orderDetails?.isResponseRequired?.code === true
      : orderDetails?.orderDetails?.isResponseRequired?.code === true;
    if ((orderNumber || orderRefNumber) && referenceId) {
      return {
        entityType: isResponseRequired ? "application-order-submission-feedback" : "application-order-submission-default",
      };
    }
    // need Specific for request for bail
    if (applicationType === "REQUEST_FOR_BAIL") {
      return {
        entityType: "voluntary-application-submission-bail",
      };
    }
    return {
      entityType: "application-voluntary-submission",
    };
  }, [applicationType, orderDetails, orderNumber, orderRefNumber, referenceId, isComposite, compositeMandatorySubmissionItem]);

  const defaultFormValue = useMemo(() => {
    if (
      applicationDetails?.additionalDetails?.formdata &&
      (formdata?.applicationType ? formdata?.applicationType?.type === applicationDetails?.additionalDetails?.formdata?.applicationType?.type : true)
    ) {
      return _getDefaultFormValue(t, applicationDetails);
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
        prayer: { text: "" },
      };
    } else if (hearingId && hearingsData?.HearingList?.[0]?.startTime && applicationTypeUrl) {
      let selectComplainant = null;
      if (complainantsList?.length === 1) {
        selectComplainant = complainantsList?.[0];
      }
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
        applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
        ...(selectComplainant !== null ? { selectComplainant } : {}),
        prayer: { text: "" },
      };
    } else if (orderNumber) {
      if ((isComposite ? compositeMandatorySubmissionItem : orderDetails)?.orderType === orderTypes.MANDATORY_SUBMISSIONS_RESPONSES) {
        if (isExtension) {
          const currentLitigant = complainantsList?.find((c) => c?.uuid === litigant);
          const selectComplainant = currentLitigant
            ? { code: currentLitigant.code, name: currentLitigant.name, uuid: currentLitigant.uuid }
            : undefined;
          const initialSubmissionDate = latestExtensionOrder
            ? DateUtils.getFormattedDate(
                new Date(
                  latestExtensionOrder?.orderCategory === "COMPOSITE"
                    ? latestExtensionOrder?.compositeItems?.find(
                        (item) =>
                          item?.orderSchema?.additionalDetails?.linkedOrderNumber === `${itemId}_${orderDetails?.orderNumber}` &&
                          item?.orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE"
                      )?.orderSchema?.orderDetails?.newSubmissionDate
                    : latestExtensionOrder?.orderDetails?.newSubmissionDate
                ),
                requiredDateFormat
              )
            : isComposite
            ? compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.submissionDeadline
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
            applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
            documentType: isComposite
              ? compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.documentType
              : orderDetails?.additionalDetails?.formdata?.documentType,
            initialSubmissionDate: initialSubmissionDate,
            ...(selectComplainant !== undefined ? { selectComplainant } : {}),
            prayer: { text: "" },
          };
        } else {
          const currentLitigant = complainantsList?.find((c) => c?.uuid === litigant);
          const selectComplainant = currentLitigant
            ? { code: currentLitigant.code, name: currentLitigant.name, uuid: currentLitigant.uuid }
            : undefined;

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
            applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
            ...(selectComplainant !== undefined ? { selectComplainant } : {}),
            prayer: { text: "" },
          };
        }
      } else if ((isComposite ? compositeWarrantItem : orderDetails)?.orderType === orderTypes.WARRANT) {
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
          applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
          prayer: { text: "" },
        };
      } else if ((isComposite ? compositeSetTermBailItem : orderDetails)?.orderType === orderTypes.SET_BAIL_TERMS) {
        const currentLitigant = complainantsList?.find((c) => c?.uuid === litigant);
        const selectComplainant = currentLitigant
          ? { code: currentLitigant.code, name: currentLitigant.name, uuid: currentLitigant.uuid }
          : undefined;
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
          applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
          ...(selectComplainant !== undefined ? { selectComplainant } : {}),
          prayer: { text: "" },
        };
      } else {
        return {
          submissionType: {
            code: "APPLICATION",
            name: "APPLICATION",
          },
          applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
          prayer: { text: "" },
        };
      }
    } else if (applicationType) {
      let selectComplainant = null;
      if (complainantsList?.length === 1) {
        selectComplainant = complainantsList?.[0];
      }
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
        applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
        ...(applicationType === "REQUEST_FOR_BAIL"
          ? {
              addSurety: { code: "YES", name: "Yes", showSurety: true },
            }
          : {}),
        ...(selectComplainant !== null ? { selectComplainant } : {}),
        ...(formdata || {}),
        prayer: { text: "" },
      };
    } else {
      return {
        submissionType: {
          code: "APPLICATION",
          name: "APPLICATION",
        },
        applicationDate: DateUtils.getFormattedDate(new Date(), requiredDateFormat),
        prayer: { text: "" },
      };
    }
  }, [
    applicationDetails,
    formdata,
    isCitizen,
    applicationTypeParam,
    hearingId,
    hearingsData?.HearingList,
    applicationTypeUrl,
    orderNumber,
    applicationType,
    t,
    complainantsList,
    isComposite,
    compositeMandatorySubmissionItem,
    orderDetails,
    compositeWarrantItem,
    compositeSetTermBailItem,
    isExtension,
    latestExtensionOrder,
    litigant,
    itemId,
  ]);

  const formKey = useMemo(
    () =>
      defaultFormValue?.applicationType?.type +
      (defaultFormValue?.initialSubmissionDate || "" + defaultFormValue?.selectComplainant?.name) +
      isDelayApplicationPending,
    [defaultFormValue, isDelayApplicationPending]
  );

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    if (
      applicationType &&
      ![
        "OTHERS",
        "DOCUMENT",
        "REQUEST_FOR_BAIL",
        "SUBMIT_BAIL_DOCUMENTS",
        "DELAY_CONDONATION",
        "CORRECTION_IN_COMPLAINANT_DETAILS",
        "ADDING_WITNESSES",
        "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS",
        "ADVANCEMENT_OR_ADJOURNMENT_APPLICATION",
      ].includes(applicationType) &&
      !formData?.applicationDate
    ) {
      setValue("applicationDate", DateUtils.getFormattedDate(new Date(), requiredDateFormat));
    }
    // if (applicationType && applicationType === "TRANSFER" && !formData?.requestedCourt) {
    //   setValue("requestedCourt", caseDetails?.courtId ? t(`COMMON_MASTERS_COURT_R00M_${caseDetails?.courtId}`) : "");
    // }
    if (applicationType && hearingId && ["CHECKOUT_REQUEST", "RE_SCHEDULE"].includes(applicationType) && !formData?.initialHearingDate) {
      setValue("initialHearingDate", DateUtils.getFormattedDate(new Date(hearingsData?.HearingList?.[0]?.startTime), requiredDateFormat));
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

    if (applicationType && ["PRODUCTION_DOCUMENTS"].includes(applicationType) && formState?.submitCount) {
      formdata?.submissionDocuments?.submissionDocuments?.forEach((docs, index) => {
        if (!docs?.documentType && !Object.keys(setFormState.current?.errors).includes(`documentType_${index}`)) {
          setError(`documentType_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        } else if (docs?.documentType && Object.keys(setFormState.current?.errors).includes(`documentType_${index}`)) {
          clearErrors(`documentType_${index}`);
        }
        if (!docs?.document?.fileStore && !Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)) {
          setFormErrors.current(`submissionDocuments_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        } else if (docs?.document?.fileStore && Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)) {
          clearFormDataErrors.current(`submissionDocuments_${index}`);
        }
      });
    }

    if (applicationType && ["SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType) && formState?.submitCount) {
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

    if (applicationType && ["SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType)) {
      if (formData?.supportingDocuments?.length > 0 && !Object.keys(formState?.errors).includes("supportingDocuments")) {
        formData?.supportingDocuments?.forEach((docs, index) => {
          if (docs?.submissionDocuments?.uploadedDocs && Object.keys(formState?.errors).includes(`submissionDocuments_${index}`)) {
            clearErrors(`submissionDocuments_${index}`);
          }
        });
      } else if (formData?.supportingDocuments?.length > 0 && Object.keys(formState?.errors).includes("supportingDocuments")) {
        clearErrors("supportingDocuments");
      }
    }

    if (applicationType && ["ADVANCEMENT_OR_ADJOURNMENT_APPLICATION"].includes(applicationType)) {
      if (scheduledHearing && !formData?.initialHearingDate) {
        setValue("initialHearingDate", DateUtils.getFormattedDate(new Date(scheduledHearing?.startTime), requiredDateFormat));
        setValue("initialHearingPurpose", scheduledHearing?.hearingType);
        setValue("refHearingId", scheduledHearing?.hearingId);
      }

      if (!formData?.isAllPartiesAgreed) {
        setValue("isAllPartiesAgreed", { code: "YES", name: "YES" });
      }
    }

    if (applicationType === "REQUEST_FOR_BAIL") {
      const addSurety = formData?.addSurety;
      const isSuretySelected = typeof addSurety === "object" ? addSurety?.code === "YES" || addSurety?.showSurety === true : addSurety === "YES";
      if (isSuretySelected && Array.isArray(formData?.sureties)) {
        formData.sureties.forEach((s, idx) => {
          const identityDocs = s?.identityProof?.uploadedDocs || s?.identityProof?.document || [];
          const solvencyDocs = s?.proofOfSolvency?.uploadedDocs || s?.proofOfSolvency?.document || [];
          if (identityDocs?.length && Object.keys(formState?.errors).includes(`identityProof_${idx}`)) {
            clearErrors(`identityProof_${idx}`);
          }
          if (solvencyDocs?.length && Object.keys(formState?.errors).includes(`proofOfSolvency_${idx}`)) {
            clearErrors(`proofOfSolvency_${idx}`);
          }
        });
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

  const createPendingTask = async ({
    name,
    status,
    isCompleted = false,
    refId = applicationNumber,
    stateSla = null,
    isAssignedRole = false,
    assignedRole = [],
  }) => {
    const assignes = !isAssignedRole ? [authorizedUuid] || [] : [];
    await submissionService.customApiService(Urls.application.pendingTask, {
      pendingTask: {
        name,
        entityType,
        referenceId: `MANUAL_${refId}`,
        status,
        assignedTo: assignes?.map((uuid) => ({ uuid })),
        assignedRole: assignedRole,
        cnrNumber: caseDetails?.cnrNumber || applicationDetails?.cnrNumber,
        filingNumber: filingNumber,
        caseId: caseDetails?.id || applicationDetails?.cnrNumber,
        caseTitle: caseDetails?.caseTitle || applicationDetails?.additionalDetails?.caseTitle || "",
        isCompleted,
        stateSla,
        additionalDetails: {
          ...(applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS" && { applicationType }),
        },
        tenantId,
      },
    });
  };

  const submitSubmission = async ({ update, action }) => {
    try {
      let documentsList = [];
      let uploadFileNames = [];
      if (formdata?.listOfProducedDocuments?.documents?.length > 0) {
        formdata.listOfProducedDocuments.documents = await uploadDocumentsIfAny({
          documents: formdata?.listOfProducedDocuments?.documents,
          tenantId,
          documentsList,
        });
      }
      if (formdata?.reasonForDocumentsSubmission?.documents?.length > 0) {
        formdata.reasonForDocumentsSubmission.documents = await uploadDocumentsIfAny({
          documents: formdata.reasonForDocumentsSubmission.documents,
          tenantId,
          documentsList,
        });
      }
      if (formdata?.submissionDocuments?.documents?.length > 0) {
        formdata.submissionDocuments.documents = await uploadDocumentsIfAny({
          documents: formdata.submissionDocuments.documents,
          tenantId,
          documentsList,
        });
      }
      if (formdata?.othersDocument?.documents?.length > 0) {
        formdata.othersDocument.documents = await uploadDocumentsIfAny({
          documents: formdata.othersDocument.documents,
          tenantId,
          documentsList,
        });
      }

      if (applicationType === "REQUEST_FOR_BAIL" && Array.isArray(formdata?.sureties)) {
        const pushIfFile = (arr, doc, displayName) => {
          if (!doc) return;
          const isPreUploaded = doc?.fileStore || doc?.fileStoreId || doc?.file?.files?.[0]?.fileStoreId;
          const isRawFile = (typeof File !== "undefined" && doc instanceof File) || (doc?.size && doc?.type);
          if (isPreUploaded || isRawFile) {
            if (isRawFile) {
              try {
                Object.assign(doc, { name: displayName || doc?.name });
              } catch (e) {}
              arr.push(doc);
            } else {
              const displayFileName = displayName || doc?.name;
              const withName = {
                ...(doc || {}),
                name: displayFileName,
                filename: displayFileName,
                additionalDetails: { ...(doc?.additionalDetails || {}), name: displayFileName },
              };
              arr.push(withName);
            }
            uploadFileNames.push(displayName || doc?.name);
          }
        };
        formdata.sureties.forEach((s, sIdx) => {
          const identityDocs = s?.identityProof?.uploadedDocs || s?.identityProof?.document || [];
          const solvencyDocs = s?.proofOfSolvency?.uploadedDocs || s?.proofOfSolvency?.document || [];
          const otherDocs = s?.otherDocuments?.uploadedDocs || s?.otherDocuments?.document || [];

          if (Array.isArray(identityDocs))
            identityDocs.forEach((d) => pushIfFile(documentsList, d, `Surety${sIdx + 1} ${d?.documentName || "Identity Proof"}.pdf`));
          if (Array.isArray(solvencyDocs))
            solvencyDocs.forEach((d) => pushIfFile(documentsList, d, `Surety${sIdx + 1} ${d?.documentName || "Proof of Solvency"}.pdf`));
          if (Array.isArray(otherDocs))
            otherDocs.forEach((d) => pushIfFile(documentsList, d, `Surety${sIdx + 1} ${d?.documentName || "Other Documents"}.pdf`));
        });
      }
      let documents = [];
      if (applicationType !== "REQUEST_FOR_BAIL") {
        let applicationDocuments = [];

        if (["SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType)) {
          applicationDocuments =
            formdata?.supportingDocuments?.map((supportDocs) => {
              const uploadedDoc = supportDocs?.submissionDocuments?.uploadedDocs?.[0];
              if (!uploadedDoc?.fileStore) return [];
              return {
                fileType: supportDocs?.submissionDocuments?.uploadedDocs?.[0]?.documentType,
                fileStore: supportDocs?.submissionDocuments?.uploadedDocs?.[0]?.fileStore,
                name: supportDocs?.documentTitle || supportDocs?.documentType?.code || "supportingDocument",
                additionalDetails: {
                  ...supportDocs?.submissionDocuments?.uploadedDocs?.[0]?.additionalDetails,
                  documentType: supportDocs?.documentType?.code,
                  documentTitle: supportDocs?.documentTitle,
                },
              };
            }) || [];
        } else if (applicationType === "ADVANCEMENT_OR_ADJOURNMENT_APPLICATION") {
          applicationDocuments =
            formdata?.supportingDocuments?.uploadedDocs?.map((doc) => {
              if (!doc?.fileStore) return [];
              return {
                fileType: doc?.documentType,
                fileStore: doc?.fileStore,
                name: doc?.additionalDetails?.name || "Supporting Document",
                additionalDetails: {
                  ...doc?.additionalDetails,
                },
              };
            }) || [];
        } else {
          applicationDocuments =
            formdata?.submissionDocuments?.submissionDocuments?.map((item) => {
              const uploadedDoc = item?.document;
              if (!uploadedDoc?.fileStore) return [];
              return {
                fileType: item?.document?.documentType,
                fileStore: item?.document?.fileStore,
                name: item?.documentTitle || item?.documentType?.code || "submissionDocument",
                additionalDetails: {
                  ...item?.document?.additionalDetails,
                  documentType: item?.documentType?.code,
                  documentTitle: item?.documentTitle,
                },
              };
            }) || [];
        }

        // const documentres =
        //   (await Promise.all(documentsList?.map((doc, idx) => onDocumentUpload(doc, uploadFileNames?.[idx] || doc?.name, tenantId)))) || [];
        let file = null;
        const uploadedDocumentList = [...(documentsList || []), ...applicationDocuments];
        if (uploadedDocumentList.length > 0) {
          uploadedDocumentList.forEach((res, index) => {
            const fileStore = res?.fileStore || res?.file?.files?.[0]?.fileStoreId;
            if (!fileStore) return;
            const resolvedName = res?.filename || res?.additionalDetails?.name || res?.name;
            const file = {
              documentType: res?.fileType,
              fileStore: fileStore,
              documentOrder: index,
              fileName: resolvedName,
              additionalDetails: {
                name: resolvedName,
                documentType: res?.additionalDetails?.documentType,
                documentTitle: res?.additionalDetails?.documentTitle,
              },
            };

            documents.push(file);
          });
        }
      }

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
          applicationDetails: {
            ...applicationSchema?.applicationDetails,
            relatedApplication: isComposite ? compositeSetTermBailItem?.orderSchema?.applicationNumber : orderDetails?.applicationNumber,
          },
        };
      }

      if (applicationType === "DELAY_CONDONATION") {
        applicationSchema = {
          ...applicationSchema,
          applicationDetails: { ...applicationSchema?.applicationDetails },
        };
      }

      const bailApplicationDocuments = [];
      if (applicationType === "REQUEST_FOR_BAIL") {
        try {
          const sanitizedSureties = Array.isArray(formdata?.sureties)
            ? formdata.sureties.map((s, index) => ({
                suretyIndex: index,
                name: s?.name || "",
                fatherName: s?.fatherName || "",
                mobileNumber: s?.mobileNumber || "",
                email: s?.email || "",
                address: {
                  pincode: s?.address?.pincode || "",
                  state: s?.address?.state || "",
                  district: s?.address?.district || "",
                  city: s?.address?.city || "",
                  locality: s?.address?.locality || "",
                },
              }))
            : [];

          const processDocs = async (docsArr, docType, defaultName, suretyIndex = null) => {
            if (!Array.isArray(docsArr) || docsArr.length === 0) return;

            const originalCount = docsArr.length;

            const hasRaw = docsArr.some(
              (d) => (typeof File !== "undefined" && d instanceof File) || (d?.file && d?.file instanceof File) || (d?.size && d?.type)
            );

            let toUpload = docsArr;
            if (hasRaw && docsArr.length > 0) {
              try {
                const combined = await combineMultipleFiles(docsArr, `${defaultName}.pdf`, "submissionDocuments");
                toUpload = combined || docsArr;
              } catch (e) {
                console.error("Error combining files:", e);
                throw e;
              }
            }
            const uploaded = await onDocumentUpload(toUpload?.[0], `${defaultName}.pdf`, tenantId);
            const fileStore = uploaded?.fileStore || uploaded?.file?.files?.[0]?.fileStoreId;
            if (fileStore) {
              bailApplicationDocuments.push({
                suretyIndex,
                fileStore,
                documentType: docType,
                documentTitle: uploaded?.filename || `${defaultName}.pdf`,
                tenantId,
                additionalDetails: {
                  originalCount,
                  combined: originalCount > 1,
                },
              });
            }
          };

          if (Array.isArray(formdata?.sureties)) {
            for (const [index, s] of formdata.sureties.entries()) {
              const identityDocs = s?.identityProof?.uploadedDocs || s?.identityProof?.document || [];
              const solvencyDocs = s?.proofOfSolvency?.uploadedDocs || s?.proofOfSolvency?.document || [];
              const otherDocs = s?.otherDocuments?.uploadedDocs || s?.otherDocuments?.document || [];

              // Pass suretyIndex for linkage
              await processDocs(identityDocs, "IDENTITY_PROOF", "IdentityProof", index);
              await processDocs(solvencyDocs, "PROOF_OF_SOLVENCY", "ProofOfSolvency", index);
              await processDocs(otherDocs, "OTHER_DOCUMENTS", "OtherDocuments", index);
            }
          }

          applicationSchema = {
            ...applicationSchema,
            applicationDetails: {
              ...applicationSchema?.applicationDetails,
              litigantFatherName: formdata?.litigantFatherName || "",
              addSurety:
                typeof formdata?.addSurety === "object" ? formdata?.addSurety?.code || formdata?.addSurety?.name || "" : formdata?.addSurety || "",
              sureties: sanitizedSureties,
              ...(bailApplicationDocuments.length > 0 && { applicationDocuments: bailApplicationDocuments }),
            },
          };
        } catch (e) {
          console.error("Failed to map surety details for Request for Bail", e);
          throw e;
        }
      }

      if (applicationType === "REQUEST_FOR_BAIL" && Array.isArray(bailApplicationDocuments)) {
        bailApplicationDocuments.forEach((res, index) => {
          const resolvedName = res?.documentTitle;

          const file = {
            documentType: res?.documentType,
            fileStore: res?.fileStore,
            documentOrder: index,
            fileName: resolvedName,
            additionalDetails: {
              name: resolvedName,
              documentType: res?.documentType,
              documentTitle: res?.documentTitle,
              suretyIndex: res?.suretyIndex,
            },
          };

          documents.push(file);
        });
      }

      let filteredFormdata = { ...formdata };
      if (applicationType === "REQUEST_FOR_BAIL") {
        try {
          delete filteredFormdata.litigantFatherName;
          delete filteredFormdata.addSurety;
          delete filteredFormdata.sureties;
          delete filteredFormdata.reasonForApplicationOfBail;
          delete filteredFormdata.prayer;
        } catch (e) {}
      }

      let res = null;
      if (update) {
        const applicationReqBody = {
          tenantId,
          application: {
            ...applicationDetails,
            ...applicationSchema,
            applicationType,
            additionalDetails: {
              formdata: {
                ...filteredFormdata,
                refOrderId: isComposite ? `${itemId}_${orderDetails?.orderNumber}` : orderDetails?.orderNumber,
              },
              ...(orderDetails && {
                orderDate: DateUtils.getFormattedDate(new Date(orderDetails?.auditDetails?.lastModifiedTime), requiredDateFormat),
              }),
              ...(isComposite
                ? compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.documentName && {
                    documentName: compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.documentName,
                  }
                : orderDetails?.additionalDetails?.formdata?.documentName && {
                    documentName: orderDetails?.additionalDetails?.formdata?.documentName,
                  }),
              onBehalOfName: formdata?.selectComplainant?.code,
              partyType: sourceType?.toLowerCase(),
              ...(orderDetails && isComposite
                ? compositeMandatorySubmissionItem?.orderSchema?.orderDetails?.isResponseRequired?.code === true && {
                    respondingParty: compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.responseInfo?.respondingParty,
                  }
                : orderDetails?.orderDetails?.isResponseRequired?.code === true && {
                    respondingParty: orderDetails?.additionalDetails?.formdata?.responseInfo?.respondingParty,
                  }),
              isResponseRequired:
                orderDetails && !isExtension
                  ? isComposite
                    ? compositeMandatorySubmissionItem?.orderSchema?.orderDetails?.isResponseRequired?.code === true
                    : orderDetails?.orderDetails?.isResponseRequired?.code === true
                  : true,
              ...(hearingId && { hearingId }),
              owner: cleanString(userInfo?.name),
            },
            documents: _getFinalDocumentList(applicationDetails, documents),
            onBehalfOf: [formdata?.selectComplainant?.uuid],
            comment: [],
            workflow: {
              action: action,
            },
          },
        };
        res = await submissionService.updateApplication(applicationReqBody, { tenantId });
      } else {
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
            officeAdvocateUserUuid: authorizedUuid !== userUuid ? authorizedUuid : null, // Only sending in case clerk/jr adv is creating application.
            createdBy: userUuid,
            statuteSection: { tenantId },
            additionalDetails: {
              formdata: {
                ...filteredFormdata,
                refOrderId: isComposite ? `${itemId}_${orderDetails?.orderNumber}` : orderDetails?.orderNumber,
              },
              ...(orderDetails && {
                orderDate: DateUtils.getFormattedDate(new Date(orderDetails?.auditDetails?.lastModifiedTime), requiredDateFormat),
              }),
              ...(isComposite
                ? compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.documentName && {
                    documentName: compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.documentName,
                  }
                : orderDetails?.additionalDetails?.formdata?.documentName && {
                    documentName: orderDetails?.additionalDetails?.formdata?.documentName,
                  }),
              onBehalOfName: formdata?.selectComplainant?.code,
              partyType: sourceType?.toLowerCase(),
              ...(orderDetails && isComposite
                ? compositeMandatorySubmissionItem?.orderSchema?.orderDetails?.isResponseRequired?.code === true && {
                    respondingParty: compositeMandatorySubmissionItem?.orderSchema?.additionalDetails?.formdata?.responseInfo?.respondingParty,
                  }
                : orderDetails?.orderDetails?.isResponseRequired?.code === true && {
                    respondingParty: orderDetails?.additionalDetails?.formdata?.responseInfo?.respondingParty,
                  }),
              isResponseRequired:
                orderDetails && !isExtension
                  ? isComposite
                    ? compositeMandatorySubmissionItem?.orderSchema?.orderDetails?.isResponseRequired?.code === true
                    : orderDetails?.orderDetails?.isResponseRequired?.code === true
                  : true,
              ...(hearingId && { hearingId }),
              owner: cleanString(userInfo?.name),
            },
            documents,
            onBehalfOf: [formdata?.selectComplainant?.uuid],
            comment: [],
            workflow: {
              action: action,
            },
          },
        };
        res = await submissionService.createApplication(applicationReqBody, { tenantId });
      }
      setLoader(false);
      return res;
    } catch (error) {
      setLoader(false);
      throw error;
    }
  };

  const updateSubmission = async (action) => {
    try {
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const documents = Array.isArray(applicationDetails?.documents) ? applicationDetails.documents : [];

      const newFileStoreId = localStorageID || signedDoucumentUploadedID;
      fileStoreIds.delete(newFileStoreId);

      const documentsFile =
        mockESignEnabled && applicationPdfFileStoreId
          ? [
              {
                documentType: "SIGNED",
                fileStore: applicationPdfFileStoreId,
                documentOrder: 1,
                additionalDetails: { name: `Application: ${t(applicationType)}.pdf` },
              },
            ]
          : signedDoucumentUploadedID !== "" || localStorageID
          ? [
              {
                documentType: "SIGNED",
                fileStore: signedDoucumentUploadedID || localStorageID,
                documentOrder: documents?.length > 0 ? documents.length + 1 : 1,
                additionalDetails: { name: `Application: ${t(applicationType)}.pdf` },
              },
              ...Array.from(fileStoreIds).map((fileStoreId, index) => ({
                fileStore: fileStoreId,
                isActive: false,
                documentOrder: documents?.length > 0 ? documents.length + index + 1 : 2,
                additionalDetails: { name: `Application : ${t(applicationType)}.pdf` },
              })),
            ]
          : null;

      sessionStorage.removeItem("fileStoreId");
      const reqBody = {
        application: {
          ...applicationDetails,
          additionalDetails: {
            ...applicationDetails?.additionalDetails,
            ...(action === SubmissionWorkflowAction.ESIGN ? { individualId: individualId } : {}), //  required in backend for evidence creation
          },
          documents: documentsFile ? [...documents, ...documentsFile] : documents,
          workflow: { ...applicationDetails?.workflow, documents: [{}], action },
          tenantId,
        },
        tenantId,
      };

      const submissionResponse = await submissionService.updateApplication(reqBody, { tenantId });
      if ((action !== SubmissionWorkflowAction.SUBMIT && isCitizen) || hasSubmissionRole) {
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
          name:
            applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS"
              ? t("MAKE_PAYMENT_SUBMISSION_FOR_POA")
              : t("MAKE_PAYMENT_SUBMISSION"),
          status: "MAKE_PAYMENT_SUBMISSION",
          stateSla: todayDate + stateSla.MAKE_PAYMENT_SUBMISSION,
          ...(hasSubmissionRole && { isAssignedRole: true, assignedRole: ["SUBMISSION_CREATOR", "SUBMISSION_RESPONDER"] }),
        });
      }
      await applicationRefetch();
      return submissionResponse;
    } catch (error) {
      setShowReviewModal(true);
      throw error;
    }
  };

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

  const handleOpenReview = async (formData) => {
    if (
      handleDocumentUploadValidation(
        t,
        formData,
        applicationType,
        setFormState,
        setFormErrors,
        clearFormDataErrors,
        userInfo,
        setShowErrorToast,
        formdata
      )
    ) {
      return;
    }

    if (applicationType && ["ADVANCEMENT_OR_ADJOURNMENT_APPLICATION"].includes(applicationType)) {
      const selectedNewHearingDates = formdata?.newHearingDates || [];
      const originalHearingDate = formdata?.initialHearingDate;

      if (originalHearingDate) {
        const [d, m, y] = originalHearingDate.split("-");
        const reversedOriginalDate = `${y}-${m}-${d}`;

        if (selectedNewHearingDates.includes(reversedOriginalDate)) {
          setShowErrorToast({
            label: t("ERR_SAME_DATE_AS_ORIGINAL_HEARING"),
            error: true,
          });
          return;
        }
      }
    }

    if (applicationType === "REQUEST_FOR_BAIL") {
      const individualData = await getUserUUID(formdata?.selectComplainant?.uuid);
      const validateSuretyContactNumbers = validateSuretyContactNumber(individualData, formData, setShowErrorToast, t);

      if (!validateSuretyContactNumbers) {
        return;
      }
    }

    try {
      setLoader(true);
      if (applicationType && ["SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType)) {
        const updatedFormData = await replaceUploadedDocsWithCombinedFile(t, formdata, tenantId);
        setFormdata(updatedFormData);
      }

      if (applicationType && ["ADVANCEMENT_OR_ADJOURNMENT_APPLICATION"].includes(applicationType)) {
        const updatedFormData = await replaceUploadedDocsWithFile(t, formdata, tenantId);
        setFormdata(updatedFormData);
      }

      const action = restrictedApplicationTypes.includes(applicationType) ? SubmissionWorkflowAction.SUBMIT : SubmissionWorkflowAction.SAVEDRAFT;
      if (applicationNumber) {
        const res = await submitSubmission({ update: true, action });
        await applicationRefetch();
        setShowReviewModal(true);
      } else {
        const res = await submitSubmission({ update: false, action });
        const newapplicationNumber = res?.application?.applicationNumber;
        if (newapplicationNumber) {
          if (action === SubmissionWorkflowAction.SUBMIT) {
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
          }
          history.replace(
            orderNumber
              ? `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}&orderNumber=${orderNumber}&showModal=true`
              : `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}&showModal=true`
          );
        }
      }
    } catch (error) {
      console.error("Error While Updatting:", error);
      setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (!formdata?.applicationType?.type) {
        setFormErrors?.current("applicationType", { message: t("CORE_REQUIRED_FIELD_ERROR") });
        setShowErrorToast({ label: t("CORE_REQUIRED_FIELD_ERROR_MESSAGE"), error: true });
        return;
      }

      setLoader(true);
      if (applicationType && ["SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION"].includes(applicationType)) {
        const updatedFormData = await replaceUploadedDocsWithCombinedFile(t, formdata, tenantId);
        setFormdata(updatedFormData);
      }

      if (applicationType && ["ADVANCEMENT_OR_ADJOURNMENT_APPLICATION"].includes(applicationType)) {
        const updatedFormData = await replaceUploadedDocsWithFile(t, formdata, tenantId);
        setFormdata(updatedFormData);
      }

      if (applicationNumber) {
        const res = await submitSubmission({ update: true, action: SubmissionWorkflowAction.SAVEDRAFT });
        await applicationRefetch();
        setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
      } else {
        const res = await submitSubmission({ update: false, action: SubmissionWorkflowAction.SAVEDRAFT });
        const newapplicationNumber = res?.application?.applicationNumber;
        if (newapplicationNumber) {
          sessionStorage.setItem("DRAFT_SAVED_SUCCESSFULLY", "success");
          history.replace(
            orderNumber
              ? `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}&orderNumber=${orderNumber}`
              : `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}`
          );
        }
      }
    } catch (error) {
      console.error("Error While Updatting:", error);
      setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleBack = () => {
    if (!paymentLoader) {
      if (applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS") {
        history.replace(`/${window?.contextPath}/${userType}/dristi/home`);
      } else {
        if (showSuccessModal) {
          triggerSurvey("APPLICATION_PAYMENT", () => {
            history.replace(
              `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Submissions`
            );
          });
        } else if (applicationDetails?.status === SubmissionWorkflowState.DRAFT_IN_PROGRESS && showModal) {
          history.replace(
            `/${window?.contextPath}/${userType}/submissions/submissions-create?filingNumber=${filingNumber}&applicationNumber=${applicationNumber}`
          );
        } else if (applicationDetails?.status === SubmissionWorkflowState.DRAFT_IN_PROGRESS) {
          setShowReviewModal(!showReviewModal);
        } else {
          history.replace(
            `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseDetails?.id}&filingNumber=${filingNumber}&tab=Submissions`
          );
        }
      }
    }
  };

  const handleReviewModalSubmit = async ({ applicationPreviewPdf, applicationPreviewFileName }) => {
    try {
      if (applicationDetails?.status === SubmissionWorkflowState.DRAFT_IN_PROGRESS) {
        const res = await updateSubmission(SubmissionWorkflowAction.SUBMIT);
        const newapplicationNumber = res?.application?.applicationNumber;
        if (newapplicationNumber) {
          if (isCitizen) {
            await createPendingTask({
              name: t("ESIGN_THE_SUBMISSION"),
              status: "ESIGN_THE_SUBMISSION",
              refId: newapplicationNumber,
              stateSla: todayDate + stateSla.ESIGN_THE_SUBMISSION,
            });
            if (applicationType === "DELAY_CONDONATION")
              await createPendingTask({
                name: "Create DCA Applications",
                status: "CREATE_DCA_SUBMISSION",
                refId: `DCA_${filingNumber}`,
                isCompleted: true,
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
          ["SUBMIT_BAIL_DOCUMENTS"].includes(applicationType) &&
            (orderNumber || orderRefNumber) &&
            (await createPendingTask({
              refId: `${itemId ? `${itemId}_` : ""}${authorizedUuid}_${orderNumber || orderRefNumber}`,
              isCompleted: true,
              status: "Completed",
              ...(applicationType === "SUBMIT_BAIL_DOCUMENTS" && { name: t("SUBMIT_BAIL_DOCUMENTS") }),
            }));
          ["PRODUCTION_DOCUMENTS"].includes(applicationType) &&
            (orderNumber || orderRefNumber) &&
            (await createPendingTask({
              refId: `${itemId ? `${itemId}_` : ""}${litigantIndId}_${authorizedUuid}_${orderNumber || orderRefNumber}`,
              isCompleted: true,
              status: "Completed",
            }));
        }
      }
      const pdfFile = new File([applicationPreviewPdf], applicationPreviewFileName, { type: "application/pdf" });
      const document = await onDocumentUpload(pdfFile, pdfFile.name, tenantId);
      const fileStoreId = document?.file?.files?.[0]?.fileStoreId;
      if (!fileStoreId) {
        throw new Error("FileStoreId not generated");
      }
      if (fileStoreId) {
        setApplicationPdfFileStoreId(fileStoreId);
      }
      setShowsignatureModal(true);
      setShowReviewModal(false);
    } catch (error) {
      console.error("Error while submitting the application:", error);
      setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
    }
  };

  const handleCancelReviewModal = async () => {
    try {
      const getCancelLabel = getReviewModalCancelButtonLabel(applicationDetails);
      if (getCancelLabel === "EDIT") {
        const reqBody = {
          application: {
            ...applicationDetails,
            workflow: { ...applicationDetails?.workflow, action: SubmissionWorkflowAction.EDIT },
            tenantId,
          },
          tenantId,
        };
        const res = await submissionService.updateApplication(reqBody, { tenantId });
        const newapplicationNumber = res?.application?.applicationNumber;
        await createPendingTask({
          refId: newapplicationNumber,
          isCompleted: true,
          status: "ESIGN_THE_SUBMISSION",
        });
        setShowReviewModal(false);
      } else {
        handleBack();
      }
    } catch (error) {
      console.error("Error while Edit Applications:", error);
      setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
    }
  };

  const handleAddSignature = async () => {
    setLoader(true);
    try {
      if (applicationType !== "SUBMIT_BAIL_DOCUMENTS") {
        await createDemand();
      }
      const response = await updateSubmission(SubmissionWorkflowAction.ESIGN);
      setShowsignatureModal(false);
      setShowPaymentModal(true);
      if (response && response?.application?.additionalDetails?.isResponseRequired) {
        const assignedTo = response?.application?.additionalDetails?.respondingParty
          ?.flatMap((item) => item?.uuid?.map((u) => ({ uuid: u })))
          ?.filter((item) => item?.uuid !== authorizedUuid);
        const uniqueAssignedTo = new Set(assignedTo?.map((item) => item?.uuid));
        const litigants = [];
        uniqueAssignedTo.forEach((uuid) => {
          const representative = caseDetails?.representatives?.find((item) => item?.additionalDetails?.uuid === uuid);
          if (representative) {
            litigants.push(...representative?.representing?.map((item) => item?.individualId));
          }
        });
        uniqueAssignedTo.forEach((uuid) => {
          const litigant = caseDetails?.litigants?.find((item) => item?.additionalDetails?.uuid === uuid);
          if (litigant) {
            litigants.push(litigant?.individualId);
          }
        });
        const uniqueLitigants = new Set(litigants);
        const litigantsArray = Array.from(uniqueLitigants);
        await submissionService.customApiService(Urls.application.taskCreate, {
          task: {
            workflow: {
              action: "CREATE",
              additionalDetails: {
                litigants: litigantsArray,
              },
            },
            filingNumber: response?.application?.filingNumber,
            assignedTo,
            state: "PENDINGRESPONSE",
            referenceId: response?.application?.applicationNumber,
            taskType: "PENDING_TASK",
            tenantId,
            status: "INPROGRESS",
            duedate:
              orderDetails?.orderCategory === "COMPOSITE"
                ? compositeMandatorySubmissionItem?.orderSchema?.orderDetails?.dates?.responseDeadlineDate
                : orderDetails?.orderDetails?.dates?.responseDeadlineDate,
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
  const { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal, billPaymentStatus } = usePaymentProcess({
    tenantId,
    consumerCode: applicationDetails?.applicationNumber + `_${suffix}`,
    service: entityType,
    path,
    caseDetails,
    totalAmount: _getApplicationAmount(applicationTypeAmount, applicationType),
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
      await DRISTIService.etreasuryCreateDemand({
        tenantId,
        entityType,
        filingNumber: caseDetails?.filingNumber || filingNumber,
        consumerCode: applicationDetails?.applicationNumber + `_${suffix}`,
        calculation: [
          {
            tenantId: tenantId,
            totalAmount: _getApplicationAmount(applicationTypeAmount, applicationType),
            breakDown: [
              {
                type: "Application Fee",
                code: "APPLICATION_FEE",
                amount: _getApplicationAmount(applicationTypeAmount, applicationType),
                additionalParams: {},
              },
            ],
          },
        ],
      });
    }
  };

  const handleMakePayment = async (totalAmount) => {
    try {
      const bill = await fetchBill(applicationDetails?.applicationNumber + `_${suffix}`, tenantId, entityType);
      if (bill?.Bill?.length) {
        const billPaymentStatus = await openPaymentPortal(bill, bill?.Bill?.totalAmount);
        setPaymentStatus(billPaymentStatus);
        await applicationRefetch();
        if (billPaymentStatus === true) {
          setMakePaymentLabel(false);
          setShowPaymentModal(false);
          setShowSuccessModal(true);
          await createPendingTask({ name: t("MAKE_PAYMENT_SUBMISSION"), status: "MAKE_PAYMENT_SUBMISSION", isCompleted: true });
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
  };

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

  useEffect(() => {
    const saveDraft = sessionStorage.getItem("DRAFT_SAVED_SUCCESSFULLY");
    if (saveDraft === "success") {
      setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
      sessionStorage.removeItem("DRAFT_SAVED_SUCCESSFULLY");
    }
  }, [t]);

  if (!filingNumber) {
    handleBack();
  }

  return (
    <React.Fragment>
      {(isApplicationFetching ||
        loader ||
        isOrdersLoading ||
        isApplicationLoading ||
        (applicationNumber ? !applicationDetails?.additionalDetails?.formdata : false) ||
        (orderNumber ? !orderDetails?.orderTitle : false) ||
        (hearingId ? (hearingsData?.HearingList?.[0]?.startTime ? false : true) : false) ||
        isAllOrdersLoading ||
        isApplicationTypeAmountLoading ||
        isCaseDetailsLoading) && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "10001",
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
      <div className="citizen create-submission" style={{ width: "50%", ...(!isCitizen && { padding: "0 8px 24px 16px" }) }}>
        <Header styles={{ margin: "25px 0px 0px 25px" }}> {t("CREATE_SUBMISSION")}</Header>
        <div style={{ minHeight: "550px", overflowY: "auto" }}>
          <FormComposerV2
            label={t("REVIEW_SUBMISSION")}
            className={"submission-create submission-form-filed-style"}
            secondaryLabel={t("SAVE_AS_DRAFT")}
            showSecondaryLabel={restrictedApplicationTypes?.includes(applicationType) ? false : true}
            onSecondayActionClick={handleSaveDraft}
            config={modifiedFormConfig}
            defaultValues={defaultFormValue}
            onFormValueChange={onFormValueChange}
            onSubmit={handleOpenReview}
            fieldStyle={fieldStyle}
            key={formKey + isApplicationFetching}
            isDisabled={isSubmitDisabled}
            actionClassName={"bail-action-bar"}
          />
        </div>
        {showReviewModal && (
          <ReviewSubmissionModal
            t={t}
            applicationType={applicationDetails?.applicationType}
            application={applicationDetails}
            submissionDate={applicationDetails?.createdDate}
            sender={fullName}
            setShowReviewModal={setShowReviewModal}
            setShowsignatureModal={setShowsignatureModal}
            handleBack={handleBack}
            documents={applicationDetails?.documents || []}
            setApplicationPdfFileStoreId={setApplicationPdfFileStoreId}
            courtId={caseCourtId}
            cancelLabel={getReviewModalCancelButtonLabel(applicationDetails)}
            handleSubmit={handleReviewModalSubmit}
            handleCancel={handleCancelReviewModal}
          />
        )}
        {showsignatureModal && (
          <SubmissionSignatureModal
            t={t}
            handleProceed={handleAddSignature}
            handleCloseSignaturePopup={handleCloseSignaturePopup}
            setSignedDocumentUploadID={setSignedDocumentUploadID}
            applicationPdfFileStoreId={applicationPdfFileStoreId}
            applicationType={applicationType}
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
            totalAmount={_getApplicationAmount(applicationTypeAmount, applicationType)}
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
            createdDate={DateUtils.getFormattedDate(new Date(applicationDetails?.createdDate))}
            makePayment={makePaymentLabel}
            paymentStatus={paymentStatus}
            bannerlabel={
              applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS" ? t("SUBMISSION_SUCCESSFUL_POA") : t("SUBMISSION_SUCCESSFUL")
            }
          />
        )}
        {SurveyUI}
        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default SubmissionsCreate;
