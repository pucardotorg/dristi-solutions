import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Header, Button, ActionBar, SubmitBar, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { OutlinedInfoIcon, RightArrow } from "../../../../dristi/src/icons/svgIndex";
import ReactTooltip from "react-tooltip";
import AddOrderTypeModal from "../../pageComponents/AddOrderTypeModal";
import AttendanceSection from "../../sections/AttendanceSection";
import OrderTypeSection from "../../sections/OrderTypeSection";
import OrderTextSection from "../../sections/OrderTextSection";
import { applicationTypeConfig, attendeesOptions, purposeOfHearingConfig, nextDateOfHearing, itemTextConfig } from "../../configs/ordersCreateConfig";
import { configKeys, stateSlaMap, dayInMillisecond, ErrorAttendeesKey, ORDER_TYPE_SETS } from "../../configs/generateOrdersConstants";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { SubmissionWorkflowState } from "../../utils/submissionWorkflow";
import useGenerateOrdersData from "../../hooks/useGenerateOrdersData";
import useGenerateOrdersComputedValues from "../../hooks/useGenerateOrdersComputedValues";
import useOrderTaskHandlers from "../../hooks/useOrderTaskHandlers";
import { OrderWorkflowAction, OrderWorkflowState } from "../../utils/orderWorkflow";
import { applicationTypes } from "../../utils/applicationTypes";
import { ordersService, taskService } from "../../hooks/services";
import { createDefaultOrderData } from "../../configs/generateOrdersConstants";
import { getSafeFileExtension } from "../../utils";
import {
  checkValidation,
  compositeOrderAllowedTypes,
  generateAddress,
  getMandatoryFieldsErrors,
  getMediationChangedFlag,
  getParties,
  getUpdateDocuments,
  prepareUpdatedOrderData,
  createTaskPayload,
} from "../../utils/orderUtils";
import { addOrderItem, createOrder, deleteOrderItem, fetchInboxData, replaceUploadedDocsWithCombinedFile } from "../../utils/orderApiCallUtils";
import OrderReviewModal from "../../pageComponents/OrderReviewModal";
import OrderSignatureModal from "../../pageComponents/OrderSignatureModal";
import OrderSucessModal from "../../pageComponents/OrderSucessModal";
import OrderAddToBulkSuccessModal from "../../pageComponents/OrderAddToBulkSuccessModal";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import MandatoryFieldsErrorModal from "./MandatoryFieldsErrorModal";
import TasksComponent from "../../../../home/src/components/TaskComponent";
import CompositeOrdersErrorModal from "./CompositeOrdersErrorModal";
import {
  checkAcceptRejectOrderValidation,
  DateUtils,
  getAuthorizedUuid,
  getOrderActionName,
  getOrderTypes,
  setApplicationStatus,
} from "@egovernments/digit-ui-module-dristi/src/Utils";
import useSearchMiscellaneousTemplate from "../../hooks/orders/useSearchMiscellaneousTemplate";

const GenerateOrdersV2 = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [presentAttendees, setPresentAttendees] = useState([]);
  const [absentAttendees, setAbsentAttendees] = useState([]);
  const [purposeOfHearing, setPurposeOfHearing] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState(null);
  const [skipScheduling, setSkipScheduling] = useState(false);
  const [showEditOrderModal, setEditOrderModal] = useState(false);
  const [showAddOrderModal, setAddOrderModal] = useState(false);
  const EditSendBackModal = Digit?.ComponentRegistryService?.getComponent("EditSendBackModal");
  const [orderType, setOrderType] = useState({});
  const [showOrderValidationModal, setShowOrderValidationModal] = useState({ showModal: false, errorMessage: "" });
  const [orderTitle, setOrderTitle] = useState(null);
  const setValueRef = useRef([]);
  const clearFormErrors = useRef([]);
  const setFormErrors = useRef([]);
  const [compositeOrderIndex, setCompositeOrderIndex] = useState(0);
  const [currentOrder, setCurrentOrder] = useState({});
  const [caseData, setCaseData] = useState(undefined);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const { orderNumber, filingNumber } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;
  const isBreadCrumbsParamsDataSet = useRef(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const todayDate = new Date().getTime();
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [addOrderTypeLoader, setAddOrderTypeLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const judgeName = localStorage.getItem("judgeName");
  const [signedDoucumentUploadedID, setSignedDocumentUploadID] = useState("");
  const [signedOrderPdfFileName, setSignedOrderPdfFileName] = useState("");
  const [fileStoreIds, setFileStoreIds] = useState(new Set());
  const [orderPdfFileStoreID, setOrderPdfFileStoreID] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [prevOrder, setPrevOrder] = useState();
  const [deleteOrderItemIndex, setDeleteOrderItemIndex] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showsignatureModal, setShowsignatureModal] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [currentPublishedOrder, setCurrentPublishedOrder] = useState(null);
  const canESign = roles?.some((role) => role.code === "ORDER_ESIGN");
  const canSaveSignLater = roles?.some((role) => role.code === "ALLOW_SEND_FOR_SIGN_LATER");
  const currentDiaryEntry = history.location?.state?.diaryEntry;
  const [businessOfTheDay, setBusinessOfTheDay] = useState(null);
  const toast = useToast();
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [showMandatoryFieldsErrorModal, setShowMandatoryFieldsErrorModal] = useState({ showModal: false, errorsData: [] });
  const [taskType, setTaskType] = useState({});
  const [errors, setErrors] = useState({});
  const [warrantSubtypeCode, setWarrantSubtypeCode] = useState("");
  const [data, setData] = useState([]);
  const isJudge = roles?.some((role) => role.code === "JUDGE_ROLE");
  const isTypist = roles?.some((role) => role.code === "TYPIST_ROLE");
  const hasOrderUpdateAccess = useMemo(() => roles?.some((role) => role?.code === "ORDER_APPROVER"), [roles]);
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const SelectCustomFormatterTextArea = window?.Digit?.ComponentRegistryService?.getComponent("SelectCustomFormatterTextArea");
  const [bailBondRequired, setBailBondRequired] = useState(false);
  const [isApiCallLoading, setIsApiCallLoading] = useState(false);
  const documentSubmission = history.location?.state?.applicationDocObj;
  const isApplicationAccepted = history.location?.state?.isApplicationAccepted;
  const hasCalledApplicationAction = useRef(false);
  const hasInitialized = useRef(false);

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
      return null;
    } finally {
      setIsCaseDetailsLoading(false);
    }
  };

  const fetchInbox = useCallback(async () => {
    try {
      const data = await fetchInboxData({ tenantId: tenantId });
      setData(data);
    } catch (err) {
      console.error("error", err);
    }
  }, [tenantId]);

  // Fetch case details on component mount
  useEffect(() => {
    fetchCaseDetails();
    fetchInbox();
  }, [courtId]);

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const cnrNumber = useMemo(() => caseDetails?.cnrNumber, [caseDetails]);
  const caseCourtId = useMemo(() => caseDetails?.courtId || localStorage.getItem("courtId"), [caseDetails]);
  const hearingNumber = useMemo(() => currentOrder?.hearingNumber || currentOrder?.additionalDetails?.hearingId || "", [currentOrder]);

  const { data: miscellaneousTemplateData, isLoading: isMiscellaneousTemplateLoading, refetch: refectMiscellaneous } = useSearchMiscellaneousTemplate(
    {
      criteria: {
        tenantId: tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId && orderType?.code === "MISCELLANEOUS_PROCESS" && showAddOrderModal === true)
  );

  const miscellaneousProcessTemplateDropDown = useMemo(() => {
    return (
      miscellaneousTemplateData?.list?.map((template) => {
        const { auditDetails, ...result } = template;
        const processTitleLabel = `${result?.processTitle} ${result?.subTitle ? `- ${result?.subTitle}` : ""}`;
        return {
          ...result,
          processTitleLabel,
        };
      }) || []
    );
  }, [miscellaneousTemplateData]);

  // Checking if the current order is for approving/rejecting the litigant's profile edit request.
  const isApproveRejectLitigantDetailsChange = useMemo(() => {
    if (currentOrder?.orderCategory === "COMPOSITE") {
      if (currentOrder?.compositeItems?.find((item) => item?.orderType === "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE")) {
        return true;
      } else return false;
    } else if (currentOrder?.orderType === "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE") {
      return true;
    } else return false;
  }, [currentOrder]);

  // If current order is Judgement type, then we require published bail orders list.
  const isJudgementOrder = useMemo(() => {
    if (currentOrder?.orderCategory === "COMPOSITE") {
      if (currentOrder?.compositeItems?.find((item) => item?.orderType === "JUDGEMENT")) {
        return true;
      } else return false;
    } else if (currentOrder?.orderType === "JUDGEMENT") {
      return true;
    } else return false;
  }, [currentOrder]);

  const {
    sortedPoliceStations,
    ordersData,
    refetchOrdersData,
    isOrdersLoading,
    isOrdersFetching,
    applicationData,
    isApplicationDetailsLoading,
    hearingsData,
    isHearingFetching,
    orderTypeData,
    isOrderTypeLoading,
    bailTypeData,
    isBailTypeLoading,
    purposeOfHearingData,
    isPurposeOfHearingLoading,
    courtRoomDetails,
    courtRoomData,
    warrantSubType,
    approveRejectLitigantDetailsChangeOrderData,
    publishedBailOrdersData,
    bailPendingTaskExpiry,
  } = useGenerateOrdersData({
    tenantId,
    filingNumber,
    caseCourtId,
    orderNumber,
    orderType,
    showAddOrderModal,
    cnrNumber,
    isApproveRejectLitigantDetailsChange,
    isJudgementOrder,
  });

  const {
    publishedLitigantDetailsChangeOrders,
    publishedBailOrder,
    hearingId,
    currentInProgressHearing,
    currentScheduledHearing,
    currentOptOutHearing,
    todayScheduledHearing,
    lastCompletedHearing,
    hearingDetails,
    hearingsList,
    attendeeOptions,
    isHearingScheduled,
    isHearingInProgress,
    isHearingInPassedOver,
    isHearingOptout,
    allAdvocates,
    allAdvocatesNames,
    uuidNameMap,
    isCaseAdmitted,
    complainants,
    poaHolders,
    respondents,
    unJoinedLitigant,
    witnesses,
    allParties,
    isDelayApplicationPending,
    isBailApplicationPending,
    groupedWarrantOptions,
  } = useGenerateOrdersComputedValues({
    hearingsData,
    caseDetails,
    applicationData,
    currentOrder,
    orderTypeData,
    warrantSubType,
    tenantId,
    approveRejectLitigantDetailsChangeOrderData,
    publishedBailOrdersData,
  });

  const bailPendingTaskExpiryDays = useMemo(() => {
    const bailPendingTaskExpiryConfig = bailPendingTaskExpiry?.find((item) => item?.code === "BAIL_BOND_PENDING_TASK_EXPIRY");
    return bailPendingTaskExpiryConfig?.defaultValue || 7;
  }, [bailPendingTaskExpiry]);

  // Extract task-related handlers to reduce component complexity
  const { createPendingTaskForJudge, createPendingTaskForEmployee, createPendingTask, handleIssueSummons, handleIssueNotice } = useOrderTaskHandlers({
    filingNumber,
    tenantId,
    courtId,
    caseDetails,
    applicationData,
    bailPendingTaskExpiryDays,
    todayDate,
    cnrNumber,
    t,
    orderType,
  });

  const applicationTypeConfigUpdated = useMemo(() => {
    const updatedConfig = structuredClone(applicationTypeConfig);

    let baseSet = [];
    if (["PENDING_RESPONSE", "PENDING_ADMISSION"].includes(caseDetails?.status)) {
      if (isDelayApplicationPending) baseSet = ORDER_TYPE_SETS.PENDING_DELAY;
      else if (isBailApplicationPending) baseSet = ORDER_TYPE_SETS.PENDING_BAIL;
      else baseSet = ORDER_TYPE_SETS.PENDING_DEFAULT;
    } else if (caseDetails?.courtCaseNumber) {
      if (caseDetails?.isLPRCase) baseSet = ORDER_TYPE_SETS.ADMITTED_LPR;
      else if (!caseDetails?.lprNumber) baseSet = ORDER_TYPE_SETS.ADMITTED_NO_LPR;
      else baseSet = ORDER_TYPE_SETS.ADMITTED_DEFAULT;
    } else {
      baseSet = ORDER_TYPE_SETS.FALLBACK;
    }

    const hasActiveHearing = currentInProgressHearing || currentOrder?.hearingNumber;
    let finalOrderTypes = [...baseSet];

    if (!hasActiveHearing && !finalOrderTypes.includes("SCHEDULE_OF_HEARING_DATE")) {
      finalOrderTypes.push("SCHEDULE_OF_HEARING_DATE");
    }

    updatedConfig[0].body[0].populators.options = orderTypeData?.filter((opt) => finalOrderTypes.includes(opt.code));

    return updatedConfig;
  }, [orderTypeData, caseDetails, isDelayApplicationPending, isBailApplicationPending, currentInProgressHearing, currentOrder]);

  const courtRooms = useMemo(() => courtRoomDetails?.Court_Rooms || [], [courtRoomDetails]);

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
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const savedOrderPdf = sessionStorage.getItem("orderPDF");
    if (isSignSuccess) {
      setShowsignatureModal(true);
      setOrderPdfFileStoreID(savedOrderPdf);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (showsignatureModal) {
      const cleanupTimer = setTimeout(() => {
        sessionStorage.removeItem("esignProcess");
        sessionStorage.removeItem("orderPDF");
        sessionStorage.removeItem("currentSelectedOrder");
      }, 2000);

      return () => clearTimeout(cleanupTimer);
    }
  }, [showsignatureModal]);

  useEffect(() => {
    const getOrder = async () => {
      try {
        const response = await DRISTIService.searchOrders(
          {
            criteria: {
              filingNumber: filingNumber,
              orderNumber: orderNumber,
              status: "PUBLISHED",
              ...(caseCourtId && { courtId: caseCourtId }),
            },
            tenantId,
          },
          { tenantId: tenantId }
        );

        const order = response?.list?.[0];

        if (order) {
          setCurrentPublishedOrder(order);
          setBusinessOfTheDay(currentDiaryEntry?.businessOfDay);
          setShowReviewModal(true);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    };

    if (orderNumber && currentDiaryEntry) {
      getOrder();
    }
  }, [currentDiaryEntry, filingNumber, orderNumber, tenantId, caseCourtId]);

  // Initialize presentAttendees and absentAttendees from currentOrder.attendance
  useEffect(() => {
    if (currentOrder?.attendance) {
      // Find present attendees from currentOrder.attendance.Present
      if (Array.isArray(currentOrder?.attendance?.Present) && currentOrder?.attendance?.Present?.length > 0) {
        const presentAttendeesFromOrder = attendeesOptions?.filter((option) => currentOrder?.attendance?.Present?.includes(option?.code)) || [];
        setPresentAttendees(presentAttendeesFromOrder);
      }

      // Find absent attendees from currentOrder.attendance.Absent
      if (Array.isArray(currentOrder?.attendance?.Absent) && currentOrder?.attendance?.Absent?.length > 0) {
        const absentAttendeesFromOrder = attendeesOptions?.filter((option) => currentOrder?.attendance?.Absent?.includes(option?.code)) || [];
        setAbsentAttendees(absentAttendeesFromOrder);
      }
    }
  }, [currentOrder?.attendance]);

  const hideNextHearingButton = useMemo(() => {
    if (currentScheduledHearing) return true;
    const validData = data?.filter((item) => ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS"]?.includes(item?.businessObject?.hearingDetails?.status));
    const index = validData?.findIndex(
      (item) => item?.businessObject?.hearingDetails?.hearingNumber === (currentInProgressHearing?.hearingId || todayScheduledHearing?.hearingId)
    );
    return index === -1 || validData?.length === 1;
  }, [data, currentInProgressHearing, todayScheduledHearing, currentScheduledHearing]);

  const nextHearing = useCallback(async () => {
    try {
      const validData = (data || []).filter((item) =>
        ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS"].includes(item?.businessObject?.hearingDetails?.status)
      );

      if (!validData?.length) {
        setShowErrorToast({ error: true, label: t("No next hearing with a draft order found") });
        return;
      }

      const currentIndex = validData?.findIndex(
        (item) => item?.businessObject?.hearingDetails?.hearingNumber === (currentInProgressHearing?.hearingId || todayScheduledHearing?.hearingId)
      );
      for (let step = 1; step < validData.length; step++) {
        const row = validData[(Math.max(currentIndex, 0) + step) % validData.length];
        const nextFiling = row?.businessObject?.hearingDetails?.filingNumber;
        const nextTenantId = row?.businessObject?.hearingDetails?.tenantId || tenantId;
        const nextCourtId = row?.businessObject?.hearingDetails?.courtId;
        const nextHearingNumber = row?.businessObject?.hearingDetails?.hearingNumber;
        if (!nextFiling) continue;

        try {
          const response = await ordersService.searchOrder(
            {
              tenantId: nextTenantId,
              criteria: {
                tenantId: nextTenantId,
                filingNumber: nextFiling,
                hearingNumber: nextHearingNumber,
                applicationNumber: "",
                status: OrderWorkflowState.DRAFT_IN_PROGRESS,
                ...(nextCourtId && { courtId: nextCourtId }),
              },
              pagination: { limit: 1, offset: 0 },
            },
            { tenantId: nextTenantId }
          );

          const orderDraft = response?.list?.[0];
          if (orderDraft?.orderNumber) {
            history.push(`/${window.contextPath}/${userType}/orders/generate-order?filingNumber=${nextFiling}&orderNumber=${orderDraft.orderNumber}`);
            return;
          }
        } catch (e) {
          // continue to next item on error
        }
      }

      setShowErrorToast({ error: true, label: t("No next hearing with a draft order found") });
    } catch (e) {
      setShowErrorToast({ error: true, label: t("No next hearing with a draft order found") });
    }
  }, [data, currentInProgressHearing, todayScheduledHearing, ordersService, tenantId, caseCourtId, history, userType, t]);

  // TODO: temporary Form Config, need to be replaced with the actual config
  const getModifiedFormConfig = useCallback(
    (compositeActiveOrderIndex) => {
      const newConfig =
        applicationTypeConfigUpdated?.map((item) => ({
          ...item,
          body: item.body.map((input) => ({
            ...input,
            disable: true,
            populators: {
              ...input.populators,
              customStyle: { display: "none" },
            },
          })),
        })) || [];

      let formConfig = [...newConfig];
      let selectedOrderType = "";
      let currentSelectedOrder = {};
      if (currentOrder?.orderCategory === "COMPOSITE") {
        selectedOrderType = currentOrder?.compositeItems?.[compositeActiveOrderIndex]?.orderType || orderType?.code || "";
        const item = currentOrder?.compositeItems?.[compositeActiveOrderIndex];
        const schema = item?.orderSchema;

        currentSelectedOrder = {
          ...currentOrder,
          additionalDetails: schema?.additionalDetails,
          orderDetails: schema?.orderDetails,
          orderType: item?.orderType,
        };
      } else {
        selectedOrderType = currentOrder?.orderType || orderType?.code || "";
        currentSelectedOrder = currentOrder;
      }

      const currentSelectedOrderRelatedApplication = applicationData?.applicationList?.find(
        (application) => application?.applicationNumber === currentSelectedOrder?.additionalDetails?.formdata?.refApplicationId
      );

      if (selectedOrderType && configKeys.hasOwnProperty(selectedOrderType)) {
        let orderTypeForm = configKeys[selectedOrderType];
        if (selectedOrderType === "SECTION_202_CRPC") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "applicationFilledBy") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents],
                    },
                  };
                }
                if (field.key === "detailsSeekedOf") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }
        if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(selectedOrderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "attendees") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: attendeeOptions,
                    },
                  };
                }
                if (field.key === "namesOfPartiesRequired") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...poaHolders, ...respondents, ...unJoinedLitigant, ...witnesses],
                    },
                  };
                }
                if (field.key === "hearingPurpose") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: purposeOfHearingData,
                    },
                  };
                }
                if (field.key === "unjoinedPartiesNote") {
                  const parties = [...unJoinedLitigant, ...witnesses];
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      inputs: [
                        {
                          ...field.populators.inputs[0],
                          children: (
                            <React.Fragment>
                              {parties.map((party, index) => (
                                <div className="list-div" key={index}>
                                  <p style={{ margin: "0px", fontSize: "14px" }}>
                                    {index + 1}. {party?.name}
                                  </p>
                                </div>
                              ))}
                            </React.Fragment>
                          ),
                        },
                      ],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }
        if (["RESCHEDULE_OF_HEARING_DATE"].includes(selectedOrderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "hearingPurpose") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: purposeOfHearingData,
                    },
                  };
                }
                return field;
              }),
            };
          });
        }
        if (["ACCEPT_RESCHEDULING_REQUEST"].includes(selectedOrderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "hearingPurpose") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: purposeOfHearingData,
                    },
                  };
                }

                if (field.key === "newHearingDate") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      inputs: [
                        {
                          ...field.populators.inputs[0],
                          options: currentSelectedOrderRelatedApplication?.additionalDetails?.formdata?.newHearingDates || [],
                        },
                      ],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }
        if (selectedOrderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "submissionParty") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents],
                    },
                  };
                }
                if (field?.populators?.inputs?.some((input) => input?.name === "respondingParty")) {
                  return {
                    ...field,
                    populators: {
                      ...field?.populators,
                      inputs: field?.populators?.inputs.map((input) =>
                        input.name === "respondingParty"
                          ? {
                              ...input,
                              options: [...complainants, ...respondents],
                            }
                          : input
                      ),
                    },
                  };
                }
                return field;
              }),
            };
          });
        }

        if (selectedOrderType === "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "applicationGrantedRejected") {
                  return {
                    ...field,
                    disable: true,
                  };
                }
                return field;
              }),
            };
          });
        }
        if (selectedOrderType === "JUDGEMENT") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "witnessNote" || field.key === "evidenceNote") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      inputs: [
                        {
                          ...field.populators.inputs[0],
                          caseId: caseDetails?.id,
                          filingNumber: caseDetails?.filingNumber,
                          tab: field?.key === "witnessNote" ? "Complaint" : field?.key === "evidenceNote" ? "Documents" : "Overview",
                          customFunction: () => handleSaveDraft(currentOrder),
                        },
                      ],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }
        if (selectedOrderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.filter((field) => {
                const isRejected = currentSelectedOrder?.additionalDetails?.applicationStatus === t("REJECTED");
                return !(field.key === "newSubmissionDate" && isRejected);
              }),
            };
          });
        }

        if (selectedOrderType === "WARRANT") {
          orderTypeForm = orderTypeForm?.map((section) => {
            const updatedBody = section.body
              .map((field) => {
                if (field.key === "warrantSubType") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...groupedWarrantOptions],
                    },
                  };
                }
                return field;
              })
              .filter((field) => {
                if (field.key === "warrantText" || field.key === "bailInfo") {
                  if (warrantSubtypeCode === "GENERIC") {
                    return field.key === "warrantText";
                  } else if (warrantSubtypeCode === "SPECIFIC") {
                    return field.key === "bailInfo";
                  }
                  return false;
                }
                return true;
              });

            return {
              ...section,
              body: updatedBody,
            };
          });
        }

        if (selectedOrderType === "ACCEPT_BAIL") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "bailParty") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents],
                    },
                  };
                }
                const refApplicationId = currentSelectedOrder?.additionalDetails?.formdata?.refApplicationId;
                if (field.key === "refApplicationId" && !refApplicationId) {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      hideInForm: true,
                    },
                  };
                }
                if (field.key === "bailType") {
                  return {
                    ...field,
                    disable: false,
                    populators: {
                      ...field.populators,
                      defaultValue: { code: "SURETY", name: "SURETY" },
                      options: bailTypeData?.sort((a, b) => t(a.name).localeCompare(t(b.name))),
                    },
                  };
                }

                return field;
              }),
            };
          });
        }

        if (["COST"]?.includes(selectedOrderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "paymentToBeMadeBy") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents, ...unJoinedLitigant, ...witnesses],
                    },
                  };
                }
                if (field.key === "paymentToBeMadeTo") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents, ...unJoinedLitigant, ...witnesses],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }

        if (["WITNESS_BATTA"]?.includes(selectedOrderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "paymentToBeMadeBy") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents, ...unJoinedLitigant],
                    },
                  };
                }
                if (field.key === "paymentToBeMadeTo") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...witnesses],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }

        if (["MISCELLANEOUS_PROCESS"].includes(selectedOrderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "processTemplate") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: miscellaneousProcessTemplateDropDown || [],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }

        formConfig = [...formConfig, ...orderTypeForm];
      }

      const updatedConfig = formConfig?.map((config) => {
        return {
          ...config,
          body: config?.body.map((body) => {
            if (body?.labelChildren === "OutlinedInfoIcon") {
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

            if (body?.populators?.validation?.customValidationFn) {
              const customValidations =
                Digit.Customizations[body.populators.validation.customValidationFn.moduleName][
                  body.populators.validation.customValidationFn.masterName
                ];

              body.populators.validation = {
                ...body.populators.validation,
                ...customValidations(),
              };
            }
            if (body?.labelChildren === "optional") {
              return {
                ...body,
                labelChildren: <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>,
              };
            }
            return {
              ...body,
            };
          }),
        };
      });

      return updatedConfig;
    },
    [
      applicationTypeConfigUpdated,
      currentOrder,
      orderType?.code,
      complainants,
      respondents,
      attendeeOptions,
      poaHolders,
      unJoinedLitigant,
      witnesses,
      purposeOfHearingData,
      applicationData?.applicationList,
      caseDetails?.id,
      caseDetails?.filingNumber,
      t,
      groupedWarrantOptions,
      warrantSubtypeCode,
      bailTypeData,
      miscellaneousProcessTemplateDropDown,
    ]
  );

  const successModalActionSaveLabel = useMemo(() => {
    if (
      (prevOrder?.orderCategory === "COMPOSITE"
        ? prevOrder?.compositeItems?.some((item) => item?.orderType === "RESCHEDULE_OF_HEARING_DATE")
        : prevOrder?.orderType === "RESCHEDULE_OF_HEARING_DATE" ||
          (currentOrder?.orderCategory === "COMPOSITE"
            ? currentOrder?.compositeItems?.some(
                (item) =>
                  item?.orderType === "SCHEDULE_OF_HEARING_DATE" &&
                  item?.orderSchema?.additionalDetails?.formdata?.namesOfPartiesRequired?.some((data) => data?.partyType?.includes("respondent"))
              )
            : currentOrder?.orderType === "SCHEDULE_OF_HEARING_DATE" &&
              currentOrder?.additionalDetails?.formdata?.namesOfPartiesRequired?.some((data) => data?.partyType?.includes("respondent")))) &&
      isCaseAdmitted
    ) {
      if (
        currentOrder?.orderCategory === "COMPOSITE"
          ? currentOrder?.compositeItems?.some((item) => item?.orderSchema?.additionalDetails?.isReIssueNotice)
          : currentOrder?.additionalDetails?.isReIssueNotice
      ) {
        return t("ISSUE_NOTICE_BUTTON");
      }
      return t("ISSUE_SUMMONS_BUTTON");
    } else if (
      prevOrder?.orderCategory === "COMPOSITE"
        ? prevOrder?.compositeItems?.some((item) => item?.orderType === "RESCHEDULE_OF_HEARING_DATE")
        : prevOrder?.orderType === "RESCHEDULE_OF_HEARING_DATE" ||
          ((prevOrder?.orderCategory === "COMPOSITE"
            ? prevOrder?.compositeItems?.some((item) => item?.orderType === "SCHEDULE_OF_HEARING_DATE")
            : prevOrder?.orderType === "SCHEDULE_OF_HEARING_DATE") &&
            !isCaseAdmitted)
    ) {
      return t("ISSUE_NOTICE_BUTTON");
    }
    return t("CS_COMMON_CLOSE");
  }, [currentOrder, prevOrder?.orderType, t, isCaseAdmitted]);

  const extractedHearingDate = useMemo(() => {
    if (currentOrder?.orderCategory === "INTERMEDIATE") {
      // check and add condition for ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE"].includes orderType if its needed,
      // and take "newHearingDate" value
      return currentOrder?.additionalDetails?.formdata?.hearingDate;
    } else {
      let updatedHearingDate = "";
      // check and add condition for ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE"].includes orderType if its needed,
      // and take "newHearingDate" value
      const scheduleHearingOrderItem = currentOrder?.compositeItems?.find(
        (item) => item?.isEnabled && item?.orderType === "SCHEDULE_OF_HEARING_DATE"
      );
      if (scheduleHearingOrderItem) {
        updatedHearingDate = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate;
      }
      return updatedHearingDate;
    }
  }, [currentOrder]);

  const isAddItemDisabled = useMemo(
    () =>
      currentOrder?.orderCategory === "INTERMEDIATE" ? !currentOrder?.orderType : currentOrder?.compositeItems?.some((item) => !item?.orderType),
    [currentOrder]
  );

  const getDefaultValue = useCallback(
    (index) => {
      if (currentOrder?.orderType && !currentOrder?.additionalDetails?.formdata) {
        return {
          orderType: {
            ...orderTypeData?.find((item) => item.code === currentOrder?.orderType),
          },
        };
      }

      const requiredDateFormat = "YYYY-MM-DD";
      const newCurrentOrder =
        currentOrder?.orderCategory === "COMPOSITE"
          ? {
              ...currentOrder,
              additionalDetails: currentOrder?.compositeItems?.[index]?.orderSchema?.additionalDetails,
              orderDetails: currentOrder?.compositeItems?.[index]?.orderSchema?.orderDetails,
              orderType: currentOrder?.compositeItems?.[index]?.orderType,
            }
          : currentOrder;

      let updatedFormdata = newCurrentOrder?.additionalDetails?.formdata || {};
      const currentOrderType = newCurrentOrder?.orderType || orderType?.code || "";
      const newApplicationDetails = applicationData?.applicationList?.find(
        (application) => application?.applicationNumber === newCurrentOrder?.additionalDetails?.formdata?.refApplicationId
      );
      if (currentOrderType === "JUDGEMENT") {
        const complainantPrimary = caseDetails?.litigants?.find((item) => item?.partyType?.includes("complainant.primary"));
        const respondentPrimary = caseDetails?.litigants?.find((item) => item?.partyType?.includes("respondent.primary"));

        updatedFormdata.nameofComplainant = complainantPrimary?.additionalDetails?.fullName;
        setValueRef?.current?.[index]?.("nameofComplainant", updatedFormdata.nameofComplainant);

        updatedFormdata.nameofRespondent = respondentPrimary?.additionalDetails?.fullName;
        setValueRef?.current?.[index]?.("nameofRespondent", updatedFormdata.nameofRespondent);

        updatedFormdata.nameofComplainantAdvocate = uuidNameMap?.[allAdvocates?.[complainantPrimary?.additionalDetails?.uuid]] || "";
        setValueRef?.current?.[index]?.("nameofComplainantAdvocate", updatedFormdata.nameofComplainantAdvocate);

        updatedFormdata.nameofRespondentAdvocate = uuidNameMap?.[allAdvocates?.[respondentPrimary?.additionalDetails?.uuid]] || "";
        setValueRef?.current?.[index]?.("nameofRespondentAdvocate", updatedFormdata.nameofRespondentAdvocate);

        updatedFormdata.caseNumber = (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) || caseDetails?.courtCaseNumber;
        setValueRef?.current?.[index]?.("caseNumber", updatedFormdata.caseNumber);

        updatedFormdata.nameOfCourt = courtRooms.find((room) => room.code === caseDetails?.courtId)?.name;
        setValueRef?.current?.[index]?.("nameOfCourt", updatedFormdata.nameOfCourt);

        updatedFormdata.addressRespondant = generateAddress(
          caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.map((data) => data?.addressDetails)?.[0]
        );
        setValueRef?.current?.[index]?.("addressRespondant", updatedFormdata.addressRespondant);

        updatedFormdata.dateChequeReturnMemo = DateUtils.getFormattedDate(
          new Date(caseDetails?.caseDetails?.chequeDetails?.formdata?.[0]?.data?.depositDate),
          requiredDateFormat
        );
        setValueRef?.current?.[index]?.("dateChequeReturnMemo", updatedFormdata.dateChequeReturnMemo);

        updatedFormdata.dateFiling = DateUtils.getFormattedDate(new Date(caseDetails?.filingDate), requiredDateFormat);
        setValueRef?.current?.[index]?.("dateFiling", updatedFormdata.dateFiling);

        updatedFormdata.dateApprehension =
          DateUtils.getFormattedDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime), requiredDateFormat) || "";
        setValueRef?.current?.[index]?.("dateApprehension", updatedFormdata.dateApprehension);

        updatedFormdata.dateofReleaseOnBail =
          DateUtils.getFormattedDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime), requiredDateFormat) || "";
        setValueRef?.current?.[index]?.("dateofReleaseOnBail", updatedFormdata.dateofReleaseOnBail);

        updatedFormdata.dateofCommencementTrial =
          DateUtils.getFormattedDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime), requiredDateFormat) || "";
        setValueRef?.current?.[index]?.("dateofCommencementTrial", updatedFormdata.dateofCommencementTrial);

        updatedFormdata.dateofCloseTrial = DateUtils.getFormattedDate(
          new Date(hearingsList?.[hearingsList?.length - 2]?.startTime),
          requiredDateFormat
        );
        setValueRef?.current?.[index]?.("dateofCloseTrial", updatedFormdata.dateofCloseTrial);

        updatedFormdata.dateofSentence = DateUtils.getFormattedDate(
          new Date(hearingsList?.[hearingsList?.length - 1]?.startTime),
          requiredDateFormat
        );
        setValueRef?.current?.[index]?.("dateofSentence", updatedFormdata.dateofSentence);

        updatedFormdata.offense = "Section 138 of Negotiable Instruments Act";
        setValueRef?.current?.[index]?.("offense", updatedFormdata.offense);
      }

      if (currentOrderType === "BAIL") {
        updatedFormdata.bailType = { type: newApplicationDetails?.applicationType };
        setValueRef?.current?.[index]?.("bailType", updatedFormdata.bailType);

        updatedFormdata.submissionDocuments = newApplicationDetails?.additionalDetails?.formdata?.submissionDocuments;
        setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);

        updatedFormdata.bailOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
        updatedFormdata.bailOfIndividualId = newApplicationDetails?.additionalDetails?.individualId || null;
        setValueRef?.current?.[index]?.("bailOf", updatedFormdata.bailOf);
      }

      if (currentOrderType === "SET_BAIL_TERMS") {
        updatedFormdata.partyId = newApplicationDetails?.createdBy;
        setValueRef?.current?.[index]?.("partyId", updatedFormdata.partyId);
      }
      if (currentOrderType === "REJECT_BAIL") {
        updatedFormdata.bailParty = newApplicationDetails?.additionalDetails?.onBehalOfName;
        updatedFormdata.submissionDocuments = {
          uploadedDocs:
            newApplicationDetails?.additionalDetails?.formdata?.supportingDocuments?.flatMap((doc) => doc.submissionDocuments?.uploadedDocs || []) ||
            [],
        };
        updatedFormdata.bailPartyIndividualId = newApplicationDetails?.additionalDetails?.individualId || null;
        setValueRef?.current?.[index]?.("bailParty", updatedFormdata.bailParty);
        setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);
      }

      if (currentOrderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
        if (newApplicationDetails?.applicationType === applicationTypes.EXTENSION_SUBMISSION_DEADLINE) {
          updatedFormdata.documentName = newApplicationDetails?.additionalDetails?.formdata?.documentType?.value;
          setValueRef?.current?.[index]?.("documentName", updatedFormdata.documentName);

          updatedFormdata.originalDeadline = newApplicationDetails?.additionalDetails?.formdata?.initialSubmissionDate;
          setValueRef?.current?.[index]?.("originalDeadline", updatedFormdata.originalDeadline);
        }
      }

      if (currentOrderType === "SUMMONS") {
        const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
          (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
        );
        const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
          (item) =>
            item?.isEnabled &&
            ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING", "ACCEPT_RESCHEDULING_REQUEST"].includes(
              item?.orderType
            )
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.dateForHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          if (currentOrder?.nextHearingDate && rescheduleHearingItem?.orderType === "ACCEPT_RESCHEDULING_REQUEST") {
            updatedFormdata.dateForHearing = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), requiredDateFormat);
          } else {
            updatedFormdata.dateForHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
          }
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.dateForHearing = DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), requiredDateFormat);
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.dateForHearing = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), requiredDateFormat);
        } else if (!currentOrder?.nextHearingDate && skipScheduling) {
          // make sure to clear the previously set next hearing date in case of skipScheduling
          updatedFormdata.dateForHearing = "";
        }
        setValueRef?.current?.[index]?.("dateForHearing", updatedFormdata.dateForHearing);
        if (newCurrentOrder?.additionalDetails?.selectedParty && newCurrentOrder?.additionalDetails?.selectedParty?.uuid) {
          updatedFormdata.SummonsOrder = {
            party: caseDetails?.additionalDetails?.respondentDetails?.formdata
              ?.filter((data) => data?.data?.uuid === newCurrentOrder?.additionalDetails?.selectedParty?.uuid)
              ?.map((item) => ({
                ...item,
                data: {
                  ...item.data,
                  firstName: item?.data?.respondentFirstName,
                  lastName: item?.data?.respondentLastName,
                  address: item?.data?.addressDetails.map((address) => ({
                    locality: address?.addressDetails?.locality,
                    city: address.addressDetails.city,
                    district: address?.addressDetails?.district,
                    pincode: address?.addressDetails?.pincode,
                  })),
                  partyType: "Respondent",
                  phone_numbers: item?.data?.phonenumbers?.mobileNumber || [],
                  email: item?.data?.emails?.emailId,
                },
              }))?.[0],
            selectedChannels: newCurrentOrder?.additionalDetails?.formdata?.SummonsOrder?.selectedChannels,
          };
          setValueRef?.current?.[index]?.("SummonsOrder", updatedFormdata.SummonsOrder);
        }
      }
      if (currentOrderType === "NOTICE") {
        const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
          (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
        );
        const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
          (item) =>
            item?.isEnabled &&
            ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING", "ACCEPT_RESCHEDULING_REQUEST"].includes(
              item?.orderType
            )
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.dateForHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          if (currentOrder?.nextHearingDate && rescheduleHearingItem?.orderType === "ACCEPT_RESCHEDULING_REQUEST") {
            updatedFormdata.dateForHearing = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), requiredDateFormat);
          } else {
            updatedFormdata.dateForHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
          }
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.dateForHearing = DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), requiredDateFormat);
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.dateForHearing = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), requiredDateFormat);
        } else if (!currentOrder?.nextHearingDate && skipScheduling) {
          // make sure to clear the previously set next hearing date in case of skipScheduling
          updatedFormdata.dateForHearing = "";
        }
        setValueRef?.current?.[index]?.("dateForHearing", updatedFormdata.dateForHearing);
        const partyUuid = newCurrentOrder?.additionalDetails?.selectedParty?.uuid;

        if (partyUuid) {
          updatedFormdata.noticeOrder = {
            party: caseDetails?.additionalDetails?.respondentDetails?.formdata
              ?.filter((data) => data?.data?.uuid === partyUuid)
              ?.map((item) => ({
                ...item,
                data: {
                  ...item.data,
                  firstName: item.data.respondentFirstName,
                  lastName: item.data.respondentLastName,
                  address: item.data.addressDetails.map((address) => ({
                    locality: address.addressDetails.locality,
                    city: address.addressDetails.city,
                    district: address?.addressDetails?.district,
                    pincode: address?.addressDetails?.pincode,
                  })),
                  partyType: "Respondent",
                  phone_numbers: item?.data?.phonenumbers?.mobileNumber || [],
                  email: item?.data?.emails?.emailId,
                },
              })),
          };
          setValueRef?.current?.[index]?.("noticeOrder", updatedFormdata.noticeOrder);
        }
      }
      if (
        currentOrderType === "WARRANT" ||
        currentOrderType === "PROCLAMATION" ||
        currentOrderType === "ATTACHMENT" ||
        currentOrderType === "MISCELLANEOUS_PROCESS"
      ) {
        const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
          (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
        );
        const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
          (item) =>
            item?.isEnabled &&
            ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "INITIATING_RESCHEDULING_OF_HEARING_DATE", "ACCEPT_RESCHEDULING_REQUEST"].includes(
              item?.orderType
            )
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.dateOfHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          if (currentOrder?.nextHearingDate && rescheduleHearingItem?.orderType === "ACCEPT_RESCHEDULING_REQUEST") {
            updatedFormdata.dateOfHearing = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), requiredDateFormat);
          } else {
            updatedFormdata.dateOfHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
          }
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.dateOfHearing = DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), requiredDateFormat);
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.dateOfHearing = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), requiredDateFormat);
        } else if (!currentOrder?.nextHearingDate && skipScheduling) {
          // make sure to clear the previously set next hearing date in case of skipScheduling
          updatedFormdata.dateOfHearing = "";
        }
        setValueRef?.current?.[index]?.("dateOfHearing", updatedFormdata.dateOfHearing);
      }
      if (currentOrderType === "REFERRAL_CASE_TO_ADR") {
        const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
          (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
        );
        const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
          (item) =>
            item?.isEnabled &&
            ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING", "ACCEPT_RESCHEDULING_REQUEST"].includes(
              item?.orderType
            )
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.hearingDate = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          updatedFormdata.hearingDate = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.hearingDate = DateUtils.getFormattedDate(new Date(hearingDetails?.startTime), requiredDateFormat);
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.hearingDate = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), requiredDateFormat);
        } else if (!currentOrder?.nextHearingDate && skipScheduling) {
          // make sure to clear the previously set next hearing date in case of skipScheduling
          updatedFormdata.hearingDate = "";
        }
        setValueRef?.current?.[index]?.("hearingDate", updatedFormdata.hearingDate);
      }
      if (currentOrderType === "ACCEPT_RESCHEDULING_REQUEST" && !updatedFormdata?.hearingPurpose) {
        const oldHearingPurpose = purposeOfHearingData?.find((purpose) => purpose?.code === updatedFormdata?.originalHearingPurpose);

        if (oldHearingPurpose) {
          updatedFormdata.hearingPurpose = oldHearingPurpose;
          setValueRef?.current?.[index]?.("hearingPurpose", oldHearingPurpose);
        }
      }

      if (
        [
          "RESCHEDULE_OF_HEARING_DATE",
          "REJECTION_RESCHEDULE_REQUEST",
          "APPROVAL_RESCHEDULE_REQUEST",
          "INITIATING_RESCHEDULING_OF_HEARING_DATE",
          "CHECKOUT_ACCEPTANCE",
          "CHECKOUT_REJECT",
          "ACCEPT_RESCHEDULING_REQUEST",
        ].includes(currentOrderType)
      ) {
        updatedFormdata.originalHearingDate =
          newCurrentOrder?.additionalDetails?.formdata?.originalHearingDate ||
          newApplicationDetails?.additionalDetails?.formdata?.initialHearingDate ||
          "";
        setValueRef?.current?.[index]?.("originalHearingDate", updatedFormdata.originalHearingDate);
      }
      return {
        ...updatedFormdata,
        orderType: orderType,
      };
    },
    [
      currentOrder,
      orderType,
      applicationData?.applicationList,
      orderTypeData,
      caseDetails?.litigants,
      caseDetails?.courtCaseNumber,
      caseDetails?.additionalDetails?.respondentDetails?.formdata,
      caseDetails?.caseDetails?.chequeDetails?.formdata,
      caseDetails?.filingDate,
      caseDetails?.courtId,
      uuidNameMap,
      allAdvocates,
      courtRooms,
      publishedBailOrder?.auditDetails?.lastModifiedTime,
      hearingsList,
      t,
      isHearingScheduled,
      isHearingInPassedOver,
      isHearingInProgress,
      hearingDetails?.startTime,
    ]
  );

  // Create default order data structure for new orders
  const defaultOrderData = useMemo(() => createDefaultOrderData({ tenantId, cnrNumber, filingNumber }), [cnrNumber, filingNumber, tenantId]);

  useEffect(() => {
    if (isOrdersLoading || isOrdersFetching) {
      return;
    }
    if (!orderNumber || !ordersData?.list || ordersData?.list.length < 1) {
      setCurrentOrder(defaultOrderData);
    } else {
      const formListNew = structuredClone([...(ordersData?.list || [])].reverse());
      const updatedFormList = formListNew?.map((order, index) => {
        if (order?.orderCategory === "COMPOSITE") {
          const updatedCompositeItems = order?.compositeItems?.map((compItem, i) => {
            return {
              ...compItem,
              isEnabled: true,
              displayindex: i,
            };
          });
          return {
            ...order,
            compositeItems: updatedCompositeItems,
          };
        } else return order;
      });
      setCurrentOrder(updatedFormList?.[0]);
    }
  }, [ordersData, defaultOrderData]);

  useEffect(() => {
    if (orderPdfFileStoreID) {
      setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, orderPdfFileStoreID]));
    }
    if (signedDoucumentUploadedID) {
      setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, signedDoucumentUploadedID]));
    }
  }, [orderPdfFileStoreID, signedDoucumentUploadedID]);

  const handleEditOrder = () => {
    setEditOrderModal(true);
  };

  const handleEditConfirmationOrder = async () => {
    if (orderType?.code === "MISCELLANEOUS_PROCESS") {
      await refectMiscellaneous();
    }
    setAddOrderModal(true);
  };

  const handleAddForm = () => {
    const updatedCompositeItems = (obj) => {
      let orderTitleNew = obj?.orderTitle || t("DEFAULT_ORDER_TITLE");
      let compositeItemsNew = obj?.compositeItems ? [...obj.compositeItems] : [];
      const totalEnabled = compositeItemsNew?.filter((o) => o?.isEnabled)?.length;

      if (compositeItemsNew.length === 0 && obj?.orderType) {
        compositeItemsNew = [
          {
            orderType: obj?.orderType,
            ...(obj?.orderNumber && {
              orderSchema: { orderDetails: obj?.orderDetails, additionalDetails: obj?.additionalDetails, orderType: obj?.orderType },
            }),
            isEnabled: true,
            displayindex: 0,
          },
        ];
        orderTitleNew = obj?.orderType ? `${t(obj?.orderType)} and Other Items` : t("DEFAULT_ORDER_TITLE");
      }

      return {
        compositeItems: [
          ...compositeItemsNew,
          {
            orderType: null,
            isEnabled: true,
            displayindex: totalEnabled === 0 ? 1 : totalEnabled,
          },
        ],
        orderTitle: orderTitleNew,
      };
    };
    const updatedItems = updatedCompositeItems(currentOrder);
    setCurrentOrder({
      ...currentOrder,
      orderCategory: "COMPOSITE",
      orderTitle: updatedItems.orderTitle || t("DEFAULT_ORDER_TITLE"),
      compositeItems: updatedItems.compositeItems,
    });

    if (
      !currentOrder?.orderNumber ||
      ordersData?.list?.find((order) => order?.orderNumber === currentOrder?.orderNumber)?.orderCategory === "INTERMEDIATE"
    ) {
      let compositeItemsNew = currentOrder?.compositeItems ? [...currentOrder.compositeItems] : [];
      const totalEnabled = currentOrder?.compositeItems?.filter((o) => o?.isEnabled)?.length;

      if (compositeItemsNew?.length === 0) {
        setOrderTitle(`${t(currentOrder?.orderType)} and Other Items`);
      }

      if (totalEnabled === 1) {
        const enabledItem = currentOrder?.compositeItems?.find((item) => item?.isEnabled && item?.orderType);
        setOrderTitle(`${t(enabledItem?.orderType)} and Other Items`);
      }
    }
  };

  const updateOrder = async (order, action, unsignedFileStoreId) => {
    try {
      let localStorageID = sessionStorage.getItem("fileStoreId");
      const documents = Array.isArray(order?.documents) ? order.documents : [];
      let taskDetails = null;
      const newCompositeItems = [];
      const isSigning = [OrderWorkflowAction.ESIGN, OrderWorkflowAction.SUBMIT_BULK_E_SIGN]?.includes(action);
      if (isSigning) {
        if (order?.orderCategory === "COMPOSITE") {
          const updatedOrders = order?.compositeItems?.map((item) => {
            return {
              order: {
                ...order,
                additionalDetails: item?.orderSchema?.additionalDetails,
                orderDetails: item?.orderSchema?.orderDetails,
                orderType: item?.orderType,
                itemId: item?.id,
              },
            };
          });
          for (const item of updatedOrders) {
            const matchedItem = order?.compositeItems?.find((compositeItem) => compositeItem?.id === item?.order?.itemId);
            if (["WARRANT", "PROCLAMATION", "ATTACHMENT", "MISCELLANEOUS_PROCESS"]?.includes(item?.order?.orderType)) {
              const payloads = await createTaskPayload(item?.order?.orderType, item, { caseDetails, courtRoomData, tenantId, judgeName });
              if (matchedItem) {
                const newItem = {
                  ...matchedItem,
                  orderSchema: {
                    ...matchedItem?.orderSchema,
                    additionalDetails: {
                      ...matchedItem?.orderSchema?.additionalDetails,
                      taskDetails: JSON.stringify(payloads),
                    },
                  },
                };
                newCompositeItems?.push(newItem);
              }
            } else if (matchedItem) {
              newCompositeItems?.push(matchedItem);
            }
          }
        } else if (["WARRANT", "PROCLAMATION", "ATTACHMENT", "MISCELLANEOUS_PROCESS"]?.includes(order?.orderType)) {
          const payloads = await createTaskPayload(order?.orderType, { order }, { caseDetails, courtRoomData, tenantId, judgeName });
          taskDetails = JSON.stringify(payloads);
        }
      }

      if (mockESignEnabled && !unsignedFileStoreId) {
        localStorageID = orderPdfFileStoreID;
      }

      const fileExtension = signedOrderPdfFileName && signedDoucumentUploadedID ? getSafeFileExtension(signedOrderPdfFileName) : "pdf";
      const documentsFile =
        signedDoucumentUploadedID !== "" || localStorageID
          ? {
              documentType: "SIGNED",
              fileStore: signedDoucumentUploadedID || localStorageID,
              documentOrder: documents?.length > 0 ? documents.length + 1 : 1,
              additionalDetails: {
                name: `Order: ${order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(order?.orderType)}.${fileExtension}`,
              },
            }
          : unsignedFileStoreId
          ? {
              documentType: "UNSIGNED",
              fileStore: unsignedFileStoreId,
              documentOrder: documents?.length > 0 ? documents.length + 1 : 1,
              additionalDetails: {
                name: `Order: ${order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(order?.orderType)}.${fileExtension}`,
              },
            }
          : null;
      const updatedDocuments = mockESignEnabled
        ? documentsFile
          ? [documentsFile]
          : []
        : getUpdateDocuments(documents, documentsFile, signedDoucumentUploadedID, fileStoreIds);
      let orderSchema = {};
      try {
        let orderTypeDropDownConfig = order?.orderNumber
          ? applicationTypeConfigUpdated?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfigUpdated);
        let orderFormConfig = configKeys.hasOwnProperty(order?.orderType) ? configKeys[order?.orderType] : [];
        const modifiedPlainFormConfig = [...orderTypeDropDownConfig, ...orderFormConfig];
        orderSchema = Digit.Customizations.dristiOrders.OrderFormSchemaUtils.formToSchema(order.additionalDetails.formdata, modifiedPlainFormConfig);
      } catch (error) {
        console.error("error :>> ", error);
      }

      let parties = getParties(
        order?.orderType,
        {
          ...orderSchema,
          orderDetails: { ...(order?.orderDetails || {}), ...orderSchema?.orderDetails },
        },
        allParties
      );

      parties = parties?.map((p) => ({
        ...p,
        counselName: (allAdvocatesNames[p?.userUuid] || [])?.join(", "),
      }));

      let actionResponse = null;
      if (order?.orderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
        const isResponseRequired = order.additionalDetails?.formdata?.responseInfo?.isResponseRequired?.code;
        actionResponse = isResponseRequired ? "RESPONSE_REQUIRED" : "RESPONSE_NOT_REQUIRED";
      }
      const isMediationChanged = getMediationChangedFlag(order?.orderDetails, {
        ...orderSchema?.orderDetails,
        mediationCentre: t(orderSchema?.orderDetails?.mediationCentre),
        modeOfSigning: "INITIATE_E-SIGN",
        parties,
      });

      const caseNumber =
        (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
        caseDetails?.courtCaseNumber ||
        caseDetails?.cmpNumber ||
        caseDetails?.filingNumber;
      orderSchema = {
        ...orderSchema,
        orderDetails: {
          ...(order?.orderDetails || {}),
          ...orderSchema?.orderDetails,
          parties: parties,
          caseNumber: caseNumber,
          ...(actionResponse && { action: actionResponse }),
          ...(order?.orderType === "REFERRAL_CASE_TO_ADR" && {
            dateOfInstitution: caseDetails?.filingDate,
            caseStage: caseDetails?.stage,
            caseId: caseDetails?.id,
            isMediationChanged: isMediationChanged,
            dateOfEndADR: orderSchema?.orderDetails?.hearingDate,
            mediationCentre: t(orderSchema?.orderDetails?.mediationCentre) || "",
            modeOfSigning: "INITIATE_E-SIGN",
          }),
          ...(order?.orderType === "ACCEPT_RESCHEDULING_REQUEST" && { currentDate: new Date().getTime() }),
        },
      };
      const isAssignDateRescheduleHearingOrder =
        order?.orderCategory === "INTERMEDIATE"
          ? order?.orderType === "ASSIGNING_DATE_RESCHEDULED_HEARING"
          : newCompositeItems?.find((item) => item?.orderType === "ASSIGNING_DATE_RESCHEDULED_HEARING");
      return await ordersService
        .updateOrder(
          {
            order: {
              ...order,
              ...orderSchema,
              ...(isSigning && order?.orderCategory === "COMPOSITE" && { compositeItems: newCompositeItems }),
              ...((currentInProgressHearing || hearingId) && {
                hearingSummary: order?.itemText,
              }),
              ...(order?.orderCategory === "INTERMEDIATE"
                ? {
                    orderTitle: t(order?.orderType) || order?.orderTitle || t("DEFAULT_ORDER_TITLE"),
                  }
                : {
                    orderTitle: `${t(currentOrder?.compositeItems?.[0]?.orderType)} and Other Items`,
                  }),
              additionalDetails: {
                ...order?.additionalDetails,
                ...(isSigning && order?.orderCategory === "INTERMEDIATE" && taskDetails ? { taskDetails } : {}),
                ...((currentInProgressHearing || hearingId) &&
                  !skipScheduling && {
                    formdata: {
                      ...(order?.additionalDetails?.formdata || {}),
                      attendees: attendeeOptions,
                      refHearingId: order?.hearingNumber,
                      namesOfPartiesRequired: [...complainants, ...poaHolders, ...respondents, ...unJoinedLitigant, ...witnesses],
                    },
                  }),
                refHearingId: order?.additionalDetails?.refHearingId || order?.hearingNumber || lastCompletedHearing?.hearingId,
              },
              ...(currentScheduledHearing && {
                scheduledHearingNumber: currentScheduledHearing?.hearingId,
              }),
              ...(currentOptOutHearing &&
                isAssignDateRescheduleHearingOrder && {
                  scheduledHearingNumber: currentOptOutHearing?.hearingId,
                }),
              documents: updatedDocuments,
              workflow: { ...order.workflow, action, documents: [{}] },
            },
          },
          { tenantId }
        )
        .then((response) => {
          if (action === OrderWorkflowAction.ESIGN) {
            setPrevOrder(response?.order);
            sessionStorage.removeItem("businessOfTheDay");
            setShowSuccessModal(true);
          }
          if (action === OrderWorkflowAction.SUBMIT_BULK_E_SIGN) {
            setPrevOrder(response?.order);
          }
          return response;
        });
    } catch (error) {
      setShowErrorToast({ label: action === OrderWorkflowAction.ESIGN ? t("ERROR_PUBLISHING_THE_ORDER") : t("SOMETHING_WENT_WRONG"), error: true });
    }
  };

  const handleSaveDraft = async (updatedOrderData) => {
    try {
      setIsApiCallLoading(true);
      let updatedOrder;
      let updateOrderResponse = {};
      if (updatedOrderData?.orderCategory === "INTERMEDIATE") {
        updatedOrder = structuredClone(updatedOrderData);
        updatedOrder.orderTitle = t(updatedOrderData?.orderTitle);
        if (updatedOrder?.orderNumber) {
          updateOrderResponse = await updateOrder(updatedOrder, OrderWorkflowAction.SAVE_DRAFT);
        } else {
          updateOrderResponse = await createOrder(updatedOrder, tenantId, applicationTypeConfigUpdated, configKeys, caseDetails, allParties);
        }
      } else {
        if (updatedOrderData?.orderNumber) {
          updatedOrder = {
            ...updatedOrderData,
            compositeItems: updatedOrderData?.compositeItems?.filter((item) => item?.isEnabled),
            itemText: updatedOrderData?.itemText,
          };
          updateOrderResponse = await addOrderItem(
            t,
            updatedOrder,
            OrderWorkflowAction.SAVE_DRAFT,
            tenantId,
            applicationTypeConfigUpdated,
            configKeys,
            caseDetails,
            allParties,
            currentOrder,
            allAdvocatesNames
          );
        } else {
          const totalEnabled = updatedOrderData?.compositeItems?.filter((compItem) => compItem?.isEnabled && compItem?.orderType)?.length;
          if (totalEnabled === 1) {
            const updatedOrder = structuredClone(updatedOrderData);
            const compositeItem = updatedOrderData?.compositeItems?.find((item) => item?.isEnabled && item?.orderType);
            updatedOrder.additionalDetails = compositeItem?.orderSchema?.additionalDetails;
            updatedOrder.compositeItems = null;
            updatedOrder.orderType = t(compositeItem?.orderType);
            updatedOrder.orderCategory = "INTERMEDIATE";
            updatedOrder.orderTitle = t(compositeItem?.orderType);
            updateOrderResponse = await createOrder(updatedOrder, tenantId, applicationTypeConfigUpdated, configKeys, caseDetails, allParties);
          } else {
            const updatedOrder = structuredClone(updatedOrderData);
            const enabledCompositeItems = updatedOrderData?.compositeItems?.filter((item) => item?.isEnabled);
            updatedOrder.compositeItems = enabledCompositeItems;
            updateOrderResponse = await addOrderItem(
              t,
              updatedOrder,
              OrderWorkflowAction.SAVE_DRAFT,
              tenantId,
              applicationTypeConfigUpdated,
              configKeys,
              caseDetails,
              allParties,
              currentOrder,
              allAdvocatesNames
            );
          }
        }
      }
      return updateOrderResponse;
    } catch (error) {
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      throw error;
    } finally {
      setIsApiCallLoading(false);
    }
  };

  const handleAddOrder = async (orderFormData, compOrderIndex) => {
    try {
      if (checkValidation(t, orderFormData, compOrderIndex, setFormErrors, setShowErrorToast)) {
        return;
      }
      setAddOrderTypeLoader(true);
      const updatedFormData = await replaceUploadedDocsWithCombinedFile(orderFormData, tenantId);
      const isAcceptBailOrder = orderFormData?.orderType?.code === "ACCEPT_BAIL";
      const requestBailBond = orderFormData?.requestBailBond;
      let updatedOrderData = prepareUpdatedOrderData(currentOrder, updatedFormData, compOrderIndex);

      if (orderFormData?.orderType?.code === "MISCELLANEOUS_PROCESS") {
        const miscItemText = orderFormData?.processTemplate?.orderText || "";
        const baseOrder = updatedOrderData && typeof updatedOrderData === "object" ? updatedOrderData : {};

        updatedOrderData = {
          ...baseOrder,
          itemText: [baseOrder.itemText, miscItemText].filter(Boolean).join(" "),
        };
      }

      if (orderFormData?.orderType?.code === "ACCEPT_RESCHEDULING_REQUEST") {
        const hearingDate = orderFormData?.newHearingDate;
        const baseOrder = updatedOrderData && typeof updatedOrderData === "object" ? updatedOrderData : {};

        if (hearingDate && hearingDate !== todayDate) {
          updatedOrderData = {
            ...baseOrder,
            nextHearingDate: null,
            purposeOfNextHearing: null,
          };
        }
      }

      const updateOrderResponse = await handleSaveDraft(updatedOrderData);
      if (isAcceptBailOrder && requestBailBond) {
        await createPendingTaskForJudge(updateOrderResponse?.order);
        await createPendingTaskForEmployee(updateOrderResponse?.order, false);
      }
      setCurrentOrder(updateOrderResponse?.order);
      setAddOrderModal(false);
      setEditOrderModal(false);
      sessionStorage.removeItem("currentOrderType");

      if (!orderNumber || orderNumber === "null" || orderNumber === "undefined" || updateOrderResponse?.order?.orderNumber) {
        history.replace(
          `/${window.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${updateOrderResponse?.order?.orderNumber}`
        );
      } else {
        await refetchOrdersData();
      }
    } catch (error) {
      console.error("Error while saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setAddOrderTypeLoader(false);
    }
  };

  const handleReviewOrderClick = async () => {
    const items = structuredClone(currentOrder?.orderCategory === "INTERMEDIATE" ? [currentOrder] : currentOrder?.compositeItems);
    let hasError = false;
    if (skipScheduling && (currentInProgressHearing || currentOrder?.hearingNumber)) {
      const hearingDateKeys = new Set(["nextHearingDate", "dateForHearing", "dateOfHearing", "hearingDate"]);
      const dynamicDateErrors = [];

      const getIsEnabled = (item) => (currentOrder?.orderCategory === "INTERMEDIATE" ? true : item?.isEnabled);

      const getFormIndex = (idx) => (currentOrder?.orderCategory === "INTERMEDIATE" ? 0 : idx);

      items?.forEach((item, idx) => {
        if (!item || !getIsEnabled(item)) return;

        const formIndex = getFormIndex(idx);
        const cfg = getModifiedFormConfig(formIndex) || [];
        const mandatoryDateFields = [];

        cfg?.forEach((section) => {
          section?.body?.forEach((field) => {
            if (
              !field?.populators?.hideInForm &&
              field?.isMandatory &&
              hearingDateKeys.has(field?.key) &&
              !item?.orderSchema?.additionalDetails?.formdata?.[field?.key]
            ) {
              mandatoryDateFields.push(field);
            }
          });
        });

        if (mandatoryDateFields.length > 0) {
          dynamicDateErrors.push({
            index: formIndex,
            orderType: item?.orderType,
            errors: mandatoryDateFields.map((field) => ({
              key: field?.label || field?.key || "NEXT_DATE_OF_HEARING",
              errorMessage: "THIS_IS_MANDATORY_FIELD",
            })),
          });
        }
      });

      if (dynamicDateErrors.length > 0) {
        const baseErrors = getMandatoryFieldsErrors(getModifiedFormConfig, currentOrder, currentInProgressHearing, skipScheduling) || [];

        const mergedErrorsMap = new Map();

        baseErrors.forEach((e) => mergedErrorsMap.set(e.index, { ...e, errors: [...(e?.errors || [])] }));

        dynamicDateErrors.forEach((e) => {
          const existing = mergedErrorsMap.get(e.index);
          existing ? existing.errors.push(...e.errors) : mergedErrorsMap.set(e.index, e);
        });

        const mergedErrors = Array.from(mergedErrorsMap.values());
        if (mergedErrors.some((obj) => obj?.errors?.length > 0)) {
          setShowMandatoryFieldsErrorModal({ showModal: true, errorsData: mergedErrors });
          return;
        }
      }
    }

    for (let index = 0; index < items?.length; index++) {
      const item = items[index];

      if (currentOrder?.orderCategory === "INTERMEDIATE" || item?.isEnabled) {
        const additionalDetails =
          currentOrder?.orderCategory === "INTERMEDIATE"
            ? currentOrder?.additionalDetails
            : currentOrder?.compositeItems?.[index]?.orderSchema?.additionalDetails;
        const formData = additionalDetails?.formdata;
        const orderType = item?.orderType;
        const newApplicationDetails = applicationData?.applicationList?.find(
          (application) => application?.applicationNumber === formData?.refApplicationId
        );

        if (["APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE"].includes(orderType)) {
          // we will check if for the current referenceid, if an order is already published for a
          // previous profile request(check by dateofApplication) -> then  don't allow another oorder get published.
          const isPublished = publishedLitigantDetailsChangeOrders?.some((order) => {
            const itemAdditionalDetails =
              order?.orderCategory === "INTERMEDIATE"
                ? order?.additionalDetails
                : order?.compositeItems?.find((item) => item?.orderSchema?.orderType === "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE")?.orderSchema
                    ?.additionalDetails;
            if (
              itemAdditionalDetails?.dateOfApplication === additionalDetails?.dateOfApplication &&
              itemAdditionalDetails?.pendingTaskRefId === additionalDetails?.pendingTaskRefId
            ) {
              return true;
            }
            return false;
          });
          if (isPublished) {
            setShowErrorToast({
              label: t("AN_ORDER_HAS_ALREADY_BEEN_PUBLISHED_FOR_THIS_PROFILE_EDIT_REQUEST"),
              error: true,
            });
            hasError = true;
            break;
          }
        }

        if ("ADVOCATE_REPLACEMENT_APPROVAL" === orderType) {
          const taskSearch = await taskService?.searchTask({
            criteria: {
              tenantId: tenantId,
              taskNumber: additionalDetails?.taskNumber,
              ...(caseDetails?.courtId && { courtId: caseDetails?.courtId }),
            },
          });
          if (["APPROVED", "REJECTED"].includes(taskSearch?.list?.[0]?.status)) {
            setShowErrorToast({
              label: t("AN_ORDER_HAS_ALREADY_BEEN_PUBLISHED_FOR_THIS_ADVOCATE_REPLACEMENT_REQUEST"),
              error: true,
            });
            hasError = true;
            break;
          }
        }

        if (
          formData?.refApplicationId &&
          "ACCEPTANCE_REJECTION_DCA" === orderType &&
          [SubmissionWorkflowState.COMPLETED, SubmissionWorkflowState.REJECTED].includes(newApplicationDetails?.status)
        ) {
          setShowErrorToast({
            label:
              newApplicationDetails?.status === SubmissionWorkflowState.COMPLETED ? t("DCA_APPLICATION_ACCEPTED") : t("DCA_APPLICATION_REJECTED"),
            error: true,
          });
          hasError = true;
          break;
        }

        if (
          (orderType === "TAKE_COGNIZANCE" && ["CASE_DISMISSED", "CASE_ADMITTED"].includes(caseDetails?.status)) ||
          (orderType === "DISMISS_CASE" && ["CASE_DISMISSED"].includes(caseDetails?.status))
        ) {
          setShowErrorToast({
            label: "CASE_ADMITTED" === caseDetails?.status ? t("CASE_ALREADY_ADMITTED") : t("CASE_ALREADY_REJECTED"),
            error: true,
          });
          hasError = true;
          break;
        }

        if (["SCHEDULE_OF_HEARING_DATE"].includes(orderType) && (isHearingScheduled || isHearingInProgress || isHearingOptout)) {
          const isIntermediate = currentOrder?.orderCategory === "INTERMEDIATE";

          const hasValidRescheduleBypass = (() => {
            if (isIntermediate || !currentOrder?.compositeItems) return false;

            const acceptIndex = currentOrder?.compositeItems?.findIndex((item) => {
              if (item?.orderType === "ACCEPT_RESCHEDULING_REQUEST") {
                const selectedDateTimestamp = item?.orderSchema?.orderDetails?.newHearingDate;
                const isToday = selectedDateTimestamp && new Date(selectedDateTimestamp).toDateString() === new Date().toDateString();

                return isToday && isHearingScheduled;
              }
              return false;
            });

            const scheduleIndex = currentOrder?.compositeItems?.findIndex((item) => item?.orderType === "SCHEDULE_OF_HEARING_DATE");

            return acceptIndex !== -1 && scheduleIndex > acceptIndex;
          })();
          if (!hasValidRescheduleBypass) {
            setShowErrorToast({
              label: isHearingScheduled
                ? t("HEARING_IS_ALREADY_SCHEDULED_FOR_THIS_CASE")
                : isHearingInProgress
                ? t("HEARING_IS_ALREADY_IN_PROGRESS_FOR_THIS_CASE")
                : t("CURRENTLY_A_HEARING_IS_IN_OPTOUT_STATE"),
              error: true,
            });
            hasError = true;
            break;
          }
        }

        if (["SCHEDULING_NEXT_HEARING"].includes(orderType) && (isHearingScheduled || isHearingOptout)) {
          setShowErrorToast({
            label: isHearingScheduled ? t("HEARING_IS_ALREADY_SCHEDULED_FOR_THIS_CASE") : t("CURRENTLY_A_HEARING_IS_IN_OPTOUT_STATE"),
            error: true,
          });
          hasError = true;
          break;
        }

        if (["INITIATING_RESCHEDULING_OF_HEARING_DATE"].includes(orderType) && !isHearingScheduled) {
          setShowErrorToast({
            label: t("CURRENTLY_NO_HEARING_IS_IN_SCHEDULED_STATE"),
            error: true,
          });
          hasError = true;
          break;
        }

        if (["ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(orderType) && !isHearingOptout) {
          setShowErrorToast({
            label: t("CURRENTLY_NO_HEARING_IS_IN_OPTOUT_STATE"),
            error: true,
          });
          hasError = true;
          break;
        }

        if (["ACCEPT_RESCHEDULING_REQUEST"]?.includes(orderType)) {
          const rescheduleStatus = hearingsData?.HearingList?.find((data) => data?.hearingId === additionalDetails?.refHearingId);

          if (!["SCHEDULED", "IN_PROGRESS", "PASSED_OVER"]?.includes(rescheduleStatus?.status)) {
            setShowErrorToast({
              label: t("HEARING_ALREADY_CLOSED_FOR_THIS_RESCHEDULE_REQUEST"),
              error: true,
            });
            hasError = true;
            break;
          }

          const newHearingDate = additionalDetails?.formdata?.newHearingDate;
          const todayDate = new Date().toISOString().split("T")[0];

          if ((currentInProgressHearing || currentOrder?.hearingNumber) && !skipScheduling && newHearingDate !== todayDate) {
            setShowErrorToast({
              label: t("SAME_HEARING_RESCHEDULE_DATE"),
              error: true,
            });
            hasError = true;
            break;
          }
        }

        if (
          [
            "JUDGEMENT",
            "DISMISS_CASE",
            "SETTLEMENT_REJECT",
            "SETTLEMENT_ACCEPT",
            "CASE_TRANSFER_REJECT",
            "CASE_TRANSFER_ACCEPT",
            "WITHDRAWAL_REJECT",
            "WITHDRAWAL_ACCEPT",
          ].includes(orderType) &&
          caseDetails?.isLPRCase
        ) {
          setShowErrorToast({
            label: t("ORDER_NOT_ALLOWED_FOR_LPR_CASE"),
            error: true,
          });
          hasError = true;
          break;
        }
        if (
          formData?.refApplicationId &&
          ![SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(newApplicationDetails?.status)
        ) {
          setShowErrorToast({
            label:
              SubmissionWorkflowState.COMPLETED === newApplicationDetails?.status
                ? t("SUBMISSION_ALREADY_ACCEPTED")
                : SubmissionWorkflowState.REJECTED === newApplicationDetails?.status
                ? t("SUBMISSION_ALREADY_REJECTED")
                : t("SUBMISSION_NO_LONGER_VALID"),
            error: true,
          });
          setShowReviewModal(false);
          setShowsignatureModal(false);
          hasError = true;
          break;
        }
      }
    }

    // ✅ Works for both COMPOSITE and Non-COMPOSITE
    const errors = getMandatoryFieldsErrors(getModifiedFormConfig, currentOrder, currentInProgressHearing, skipScheduling);

    if (errors?.some((obj) => obj?.errors?.length > 0)) {
      setShowMandatoryFieldsErrorModal({ showModal: true, errorsData: errors });
      return;
    }

    const mandatoryOrderFields = [{ itemText: currentOrder?.itemText }];

    if (currentInProgressHearing || currentOrder?.hearingNumber) {
      mandatoryOrderFields?.push({ presentAttendees: currentOrder?.attendance?.Present }, { absentAttendees: currentOrder?.attendance?.Absent });
      if (!skipScheduling) {
        mandatoryOrderFields?.push({ nextHearingDate: currentOrder?.nextHearingDate }, { hearingPurpose: currentOrder?.purposeOfNextHearing });
      }
    }

    // Collect all errors first
    const allErrors = {};
    mandatoryOrderFields?.forEach((field) => {
      const [key, value] = Object?.entries(field)[0];

      // Special handling for presentAttendees and absentAttendees
      if (key === "absentAttendees" || key === "presentAttendees") {
        // If presentAttendees has all four options, absentAttendees can be empty
        // const presentAttendeesComplete = currentOrder?.attendance?.Present?.length === 4;
        // If absentAttendees has all four options, presentAttendees can be empty
        // const absentAttendeesComplete = currentOrder?.attendance?.Absent?.length === 4;

        const requiredAttendees = ["COMPLAINANT", "ACCUSED"];
        const allAttendees = [...(currentOrder?.attendance?.Present || []), ...(currentOrder?.attendance?.Absent || [])];
        const requiredAttendeesComplete = requiredAttendees.every((req) => allAttendees.includes(req));

        if (!requiredAttendeesComplete && (!value || !requiredAttendees.includes(value))) {
          allErrors[ErrorAttendeesKey] = { msg: "ATTENDEE_ERROR_MESSAGE" };
        }
      } else if (key === "itemText") {
        // Special handling for itemText to check for empty HTML content
        const isEmptyHtml = !value || (typeof value === "string" && value.replace(/<[^>]*>/g, "").trim() === "");
        if (isEmptyHtml) {
          allErrors[key] = { msg: "CORE_REQUIRED_FIELD_ERROR" };
        }
      } else if (!value || (Array?.isArray(value) && value?.length === 0)) {
        // Format errors according to the expected structure
        // The component expects an object with msg property
        allErrors[key] = { msg: "CORE_REQUIRED_FIELD_ERROR" };
      }
    });

    // Set all errors at once if there are any
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    if (!hasError) {
      try {
        await handleSaveDraft(currentOrder);
        setShowReviewModal(true);
      } catch (error) {
        setShowErrorToast({ label: t("ERROR_CREATING_ORDER"), error: true });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const checkOrderTypeValidation = (a, b) => {
    let errorObj = { isIncompatible: false, isDuplicate: false };
    for (let i = 0; i < compositeOrderAllowedTypes?.length; i++) {
      const currentObj = compositeOrderAllowedTypes?.[i];
      if (currentObj?.orderTypes?.includes(a)) {
        if (currentObj?.unAllowedOrderTypes?.includes(b)) {
          if (a === b) {
            errorObj.isDuplicate = true;
          } else {
            errorObj.isIncompatible = true;
          }
          break;
        }
      }
    }
    return errorObj;
  };

  const checkOrderValidation = useCallback(
    (orderType, index) => {
      let error = { isIncompatible: false, isDuplicate: false };
      let errorMessage = "";
      for (let i = 0; i < currentOrder?.compositeItems?.length; i++) {
        if (i === index) {
          continue;
        } else {
          const orderTypeA = currentOrder?.compositeItems?.[i]?.orderSchema?.additionalDetails?.formdata?.orderType?.code;
          const errorObj = checkOrderTypeValidation(orderTypeA, orderType);
          error.isIncompatible = error.isIncompatible || errorObj?.isIncompatible;
          error.isDuplicate = error.isDuplicate || errorObj?.isDuplicate;
          if (error.isDuplicate || error.isIncompatible) {
            break;
          }
        }
      }
      if (error?.isIncompatible && !error?.isDuplicate) {
        errorMessage = t("ORDER_TYPES_CAN_NOT_BE_GROUPED_TOGETHER");
      }
      if (!error?.isIncompatible && error?.isDuplicate) {
        errorMessage = t("ORDER_TYPES_ARE_DUPLICATED");
      }
      if (error?.isIncompatible || error?.isDuplicate) {
        return { showModal: true, errorMessage };
      } else return { showModal: false, errorMessage: "" };
    },
    [currentOrder, t]
  );

  const handleOrderTypeChange = (index, orderType) => {
    if (!orderType) {
      return;
    }
    const orderTypeValidationObj = checkOrderValidation(orderType?.code, index);
    if (orderTypeValidationObj?.showModal) {
      setShowOrderValidationModal(orderTypeValidationObj);
      return;
    }
    setCompositeOrderIndex(index !== null ? index : 0);
    setOrderType(orderType);
    if (!showAddOrderModal) {
      setAddOrderModal(true);
    }
  };

  const handleDeleteOrderItem = async (deleteOrderItemIndex) => {
    if (!currentOrder?.orderNumber) {
      let updatedCompositeItems = currentOrder?.compositeItems?.map((compositeItem, index) => {
        if (index === deleteOrderItemIndex) {
          return { ...compositeItem, isEnabled: false, displayindex: -Infinity };
        }

        return {
          ...compositeItem,
          displayindex: index > deleteOrderItemIndex ? compositeItem.displayindex - 1 : compositeItem.displayindex,
        };
      });
      setCurrentOrder({
        ...currentOrder,
        compositeItems: updatedCompositeItems,
      });
    } else {
      if (currentOrder?.orderCategory === "INTERMEDIATE") {
        await updateOrder(
          {
            ...currentOrder,
            additionalDetails: null,
            orderType: null,
            orderDetails: null,
          },
          OrderWorkflowAction.SAVE_DRAFT
        );
        await refetchOrdersData();
        await refetchOrdersData();
      } else {
        const deletedItemId = currentOrder?.compositeItems?.find((item, index) => index === deleteOrderItemIndex)?.id;
        if (deletedItemId) {
          try {
            const response = await deleteOrderItem(currentOrder, deletedItemId, tenantId);
            if (response?.order?.orderNumber) {
              await refetchOrdersData();
              await refetchOrdersData();
            } else {
              console.error("Delete operation was not successful.");
            }
          } catch (error) {
            console.error("Error deleting order item:", error);
          }
        } else {
          let updatedCompositeItems = currentOrder?.compositeItems?.map((compositeItem, index) => {
            if (index === deleteOrderItemIndex) {
              return { ...compositeItem, isEnabled: false, displayindex: -Infinity };
            }

            return {
              ...compositeItem,
              displayindex: index > deleteOrderItemIndex ? compositeItem.displayindex - 1 : compositeItem.displayindex,
            };
          });

          const totalEnabled = updatedCompositeItems?.filter((o) => o?.isEnabled)?.length;
          if (totalEnabled === 1) {
            const enabledItem = updatedCompositeItems?.find((item) => item?.isEnabled);
            setCurrentOrder({
              ...currentOrder,
              orderType: enabledItem?.orderType,
              orderTitle: `${t(enabledItem?.orderType)}`,
              additionalDetails: enabledItem?.orderSchema?.additionalDetails,
              orderDetails: enabledItem?.orderSchema?.orderDetails,
              orderCategory: "INTERMEDIATE",
              compositeItems: null,
            });
          } else {
            setCurrentOrder({
              ...currentOrder,
              compositeItems: updatedCompositeItems?.filter((o) => o?.isEnabled),
            });
          }
        }
      }
    }
    setDeleteOrderItemIndex(null);
  };

  const handleUpdateBusinessOfDayEntry = async () => {
    try {
      await DRISTIService.aDiaryEntryUpdate(
        {
          diaryEntry: {
            ...currentDiaryEntry,
            businessOfDay: businessOfTheDay,
          },
        },
        {}
      ).then(async () => {
        history.goBack();
      });
    } catch (error) {
      console.error("error: ", error);
      toast.error(t("SOMETHING_WENT_WRONG"));
    }
  };

  const handleReviewGoBack = () => {
    if (currentDiaryEntry) {
      history.goBack();
    } else {
      setShowReviewModal(false);
    }
  };

  const processHandleIssueOrder = async () => {
    setIsLoading(true);
    try {
      const lprDocs =
        currentOrder?.additionalDetails?.formdata?.lprDocuments?.documents ||
        currentOrder?.compositeItems?.find?.((order) => order?.orderType === "MOVE_CASE_TO_LONG_PENDING_REGISTER")?.orderSchema?.additionalDetails
          ?.formdata?.lprDocuments?.documents;

      if (Array.isArray(lprDocs) && lprDocs.length > 0) {
        await Promise.all(
          lprDocs.map((file) => {
            const evidenceReqBody = {
              artifact: {
                artifactType: "LPR_DOCUMENT_ARTIFACT",
                caseId: caseDetails?.id,
                filingNumber,
                tenantId,
                comments: [],
                file,
                sourceType: "COURT",
                sourceID: authorizedUuid,
                filingType: "DIRECT",
                additionalDetails: {
                  uuid: authorizedUuid,
                },
                asUser: userInfo?.uuid,
              },
            };
            return DRISTIService.createEvidence(evidenceReqBody);
          })
        );
      }

      const isBailRejected =
        (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType === "REJECT_BAIL") ||
        currentOrder?.compositeItems?.some?.((it) => it?.orderType === "REJECT_BAIL");

      if (isBailRejected) {
        await createPendingTaskForEmployee(currentOrder, true);
      }

      let hearingNumber = "";
      const todayDate = new Date().toISOString().split("T")[0];

      if (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType === "ACCEPT_RESCHEDULING_REQUEST") {
        const hearingDate = currentOrder?.additionalDetails?.formdata?.newHearingDate;
        if (hearingDate === todayDate) {
          hearingNumber = currentOrder?.additionalDetails?.refHearingId;
        }
      } else {
        const acceptRescheduleRequest = currentOrder?.compositeItems?.find((item) => item?.orderType === "ACCEPT_RESCHEDULING_REQUEST");
        const hearingDate = acceptRescheduleRequest?.orderSchema?.additionalDetails?.formdata?.newHearingDate;

        if (hearingDate === todayDate) {
          hearingNumber = acceptRescheduleRequest?.orderSchema?.additionalDetails?.refHearingId;
        }
      }

      await updateOrder(
        {
          ...currentOrder,
          ...(hearingNumber && { hearingNumber: currentOrder?.hearingNumber || hearingNumber, scheduledHearingNumber: null }),
          additionalDetails: {
            ...currentOrder?.additionalDetails,
            businessOfTheDay: businessOfTheDay,
          },
        },
        OrderWorkflowAction.ESIGN
      );
    } catch (error) {
      console.error("Error in processHandleIssueOrder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBackSignatureModal = () => {
    sessionStorage.removeItem("fileStoreId");
    sessionStorage.removeItem("businessOfTheDay");
    setSignedDocumentUploadID("");
    setFileStoreIds((prev) => {
      const updated = new Set(prev);
      updated.delete(signedDoucumentUploadedID);
      return updated;
    });
    setShowsignatureModal(false);
    setShowReviewModal(true);
  };

  const handleDownloadOrders = () => {
    const fileStoreId = sessionStorage.getItem("fileStoreId");
    downloadPdf(tenantId, signedDoucumentUploadedID || fileStoreId);
  };

  const handleBulkDownloadOrder = () => {
    const fileStoreId = prevOrder?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore;
    downloadPdf(tenantId, fileStoreId);
  };

  const handleBulkCloseSuccessModal = () => {
    setShowBulkModal(false);
    history.replace(`/${window.contextPath}/${userInfoType}/home/home-screen`, { homeActiveTab: "CS_HOME_ORDERS" });
  };

  const handleClose = async () => {
    sessionStorage.removeItem("fileStoreId");
    if (successModalActionSaveLabel === t("CS_COMMON_CLOSE")) {
      setShowSuccessModal(false);
      history.replace(
        `/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`,
        {
          from: "orderSuccessModal",
        }
      );
      return;
    }
    if (successModalActionSaveLabel === t("ISSUE_SUMMONS_BUTTON")) {
      const summonOrderNumber = await handleIssueSummons(extractedHearingDate, hearingId || hearingNumber);
      history.replace(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${summonOrderNumber}`);
    }
    if (successModalActionSaveLabel === t("ISSUE_NOTICE_BUTTON")) {
      const noticeSummonOrder = await handleIssueNotice(extractedHearingDate, hearingId || hearingNumber);
      history.replace(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${noticeSummonOrder}`);
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("fileStoreId");
    setShowSuccessModal(false);
    history.replace(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`, {
      from: "orderSuccessModal",
    });
  };

  const onItemTextSelect = (key, value) => {
    if (key === "itemText" && value?.["itemText"] !== undefined) {
      setCurrentOrder({ ...currentOrder, itemText: value[key] });
      const isEmptyHtml = !value[key] || value[key].replace(/<[^>]*>/g, "").trim() === "";
      if (!isEmptyHtml) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors["itemText"];
          return newErrors;
        });
      }
    }
  };

  const handleNextHearingClick = async () => {
    await handleSaveDraft(currentOrder);
    nextHearing();
  };

  const handleGoBack = async () => {
    await handleSaveDraft(currentOrder);
    history.goBack();
  };

  const handleApplicationAction = async (type) => {
    try {
      const orderType = getOrderTypes(documentSubmission?.[0]?.applicationList?.applicationType, type);
      const refApplicationId = documentSubmission?.[0]?.applicationList?.applicationNumber;
      const applicationCMPNumber = documentSubmission?.[0]?.applicationList?.applicationCMPNumber;
      const currentHearingPurpose = documentSubmission?.[0]?.applicationList?.applicationDetails?.initialHearingPurpose || "";
      const caseNumber =
        (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
        caseDetails?.courtCaseNumber ||
        caseDetails?.cmpNumber ||
        caseDetails?.filingNumber;
      const formdata = {
        orderType: {
          code: orderType,
          type: orderType,
          name: `ORDER_TYPE_${orderType}`,
        },
        refApplicationId: refApplicationId,
        ...(currentHearingPurpose && { originalHearingPurpose: currentHearingPurpose }),
        applicationStatus: documentSubmission?.[0]?.applicationList?.applicationType
          ? setApplicationStatus(type, documentSubmission[0].applicationList.applicationType)
          : null,
        ...(documentSubmission?.[0]?.applicationList?.applicationType === "DELAY_CONDONATION" && {
          isDcaAcceptedOrRejected: {
            code: type === "reject" ? "REJECTED" : type === "accept" ? "ACCEPTED" : null,
            name: type === "reject" ? "REJECTED" : type === "accept" ? "ACCEPTED" : null,
          },
        }),
      };
      const linkedOrderNumber = documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.refOrderId;
      const applicationNumber = [refApplicationId];
      const hearingNumber =
        ["INITIATING_RESCHEDULING_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE"].includes(orderType) &&
        documentSubmission?.[0]?.applicationList?.additionalDetails?.hearingId;
      const refHearingId = documentSubmission?.[0]?.applicationList?.additionalDetails?.formdata?.refHearingId;
      const parties = documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName && {
        parties: [{ partyName: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName }],
      };
      const additionalDetails = {
        formdata,
        applicationStatus: documentSubmission?.[0]?.applicationList?.applicationType
          ? setApplicationStatus(type, documentSubmission[0].applicationList.applicationType)
          : null,
        ...(linkedOrderNumber && { linkedOrderNumber: linkedOrderNumber }),
        ...(applicationNumber && { applicationNumber: applicationNumber }),
        ...(hearingNumber && {
          hearingNumber: hearingNumber,
        }),
        ...(refHearingId && { refHearingId: refHearingId }),
      };
      const isSameOrder =
        currentOrder?.orderCategory === "COMPOSITE"
          ? currentOrder?.compositeItems?.some(
              (item) => item?.isEnabled && item?.orderSchema?.additionalDetails?.formdata?.refApplicationId === refApplicationId
            )
          : currentOrder?.additionalDetails?.formdata?.refApplicationId === refApplicationId;
      const isNewOrder = isSameOrder || checkAcceptRejectOrderValidation(orderType, currentOrder);

      if (currentOrder && currentOrder?.orderTitle && !isNewOrder) {
        try {
          let response;
          if (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType) {
            const compositeItems = [
              {
                orderType: currentOrder?.orderType,
                orderSchema: {
                  applicationNumber: currentOrder?.applicationNumber,
                  orderDetails: currentOrder?.orderDetails,
                  additionalDetails: {
                    ...currentOrder?.additionalDetails,
                    hearingNumber: currentOrder?.hearingNumber,
                    linkedOrderNumber: currentOrder?.linkedOrderNumber,
                    applicationNumber: currentOrder?.applicationNumber,
                    applicationCMPNumber: applicationCMPNumber,
                    ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
                  },
                },
              },
              {
                orderType: orderType,
                orderSchema: {
                  additionalDetails: additionalDetails,
                  orderDetails: {
                    ...(parties || {}),
                    applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
                    applicationNumber: refApplicationId,
                    applicationCMPNumber: applicationCMPNumber,
                    caseNumber: caseNumber,
                    ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
                  },
                  ...(linkedOrderNumber && { linkedOrderNumber }),
                  ...(applicationNumber && {
                    applicationNumber: applicationNumber,
                  }),
                },
              },
            ];
            const payload = {
              order: {
                ...currentOrder,
                additionalDetails: null,
                orderDetails: null,
                orderType: null,
                orderCategory: "COMPOSITE",
                orderTitle: `${t(currentOrder?.orderType)} and Other Items`,
                compositeItems,
                ...(linkedOrderNumber && { linkedOrderNumber }),
                workflow: {
                  action: OrderWorkflowAction.SAVE_DRAFT,
                  comments: "Creating order",
                  assignes: null,
                  rating: null,
                  documents: [{}],
                },
              },
            };
            if (currentOrder?.orderNumber) {
              response = await ordersService.addOrderItem(payload, { tenantId });
            } else {
              response = await ordersService.createOrder(payload, { tenantId });
            }
          } else if (currentOrder?.orderCategory === "INTERMEDIATE" && !currentOrder?.orderType) {
            const reqbody = {
              order: {
                ...currentOrder,
                orderType: orderType,
                applicationNumber: applicationNumber,
                additionalDetails,
                orderTitle: orderType,
                workflow: {
                  action: OrderWorkflowAction.SAVE_DRAFT,
                  comments: "Updating order",
                  assignes: null,
                  rating: null,
                  documents: [{}],
                },
                orderDetails: {
                  ...(parties || {}),
                  applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
                  applicationNumber: refApplicationId,
                  applicationCMPNumber: applicationCMPNumber,
                  caseNumber: caseNumber,
                  ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
                },
                ...(linkedOrderNumber && { linkedOrderNumber }),
              },
            };

            try {
              response = await ordersService.updateOrder(reqbody, { tenantId });
            } catch (error) {
              const errorCode = error?.response?.data?.Errors?.[0]?.code;
              const errorMsg =
                errorCode === "HEARING_ALREADY_COMPLETED" ? t("HEARING_ALREADY_CLOSED_FOR_THIS_RESCHEDULE_REQUEST") : t("SOMETHING_WENT_WRONG");
              toast.error(errorMsg);
            }
          } else {
            const compositeItems = [
              ...currentOrder?.compositeItems?.filter((item) => item?.isEnabled && item?.orderType),
              {
                orderType: orderType,
                orderSchema: {
                  additionalDetails: additionalDetails,
                  orderDetails: {
                    ...(parties || {}),
                    applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
                    applicationNumber: refApplicationId,
                    applicationCMPNumber: applicationCMPNumber,
                    caseNumber: caseNumber,
                  },
                  ...(linkedOrderNumber && { linkedOrderNumber }),
                  ...(applicationNumber && {
                    applicationNumber: applicationNumber,
                  }),
                },
              },
            ];
            const payload = {
              order: {
                ...currentOrder,
                additionalDetails: null,
                orderDetails: null,
                orderType: null,
                compositeItems,
                workflow: {
                  action: OrderWorkflowAction.SAVE_DRAFT,
                  comments: "Creating order",
                  assignes: null,
                  rating: null,
                  documents: [{}],
                },
                applicationNumber: [...(currentOrder?.applicationNumber || []), refApplicationId],
                ...(linkedOrderNumber && { linkedOrderNumber }),
              },
            };
            if (currentOrder?.orderNumber) {
              response = await ordersService.addOrderItem(payload, { tenantId });
            } else {
              response = await ordersService.createOrder(payload, { tenantId });
            }
          }
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              name: `${
                currentOrder?.orderCategory === "INTERMEDIATE" && !currentOrder?.orderType ? currentOrder?.orderType : currentOrder?.orderTitle
              }`,
              entityType: "order-default",
              referenceId: `MANUAL_${response?.order?.orderNumber}`,
              status: "DRAFT_IN_PROGRESS",
              assignedTo: [],
              assignedRole: ["PENDING_TASK_ORDER"],
              cnrNumber,
              filingNumber,
              caseId: caseDetails?.id,
              caseTitle: caseDetails?.caseTitle,
              isCompleted: false,
              stateSla: stateSlaMap.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
              additionalDetails: { orderType },
              tenantId,
            },
          });
          sessionStorage.setItem("currentOrderType", orderType);
          await refetchOrdersData();
          history.replace(
            `/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${response?.order?.orderNumber}`
          );
        } catch (error) {
          const errorCode = error?.response?.data?.Errors?.[0]?.code;
          const errorMsg =
            errorCode === "HEARING_ALREADY_COMPLETED" ? t("HEARING_ALREADY_CLOSED_FOR_THIS_RESCHEDULE_REQUEST") : t("SOMETHING_WENT_WRONG");
          toast.error(errorMsg);
        }
      } else {
        const reqbody = {
          order: {
            createdDate: null,
            tenantId,
            cnrNumber,
            filingNumber,
            applicationNumber: applicationNumber,
            statuteSection: {
              tenantId,
            },
            orderTitle: orderType,
            orderCategory: "INTERMEDIATE",
            orderType,
            status: "",
            isActive: true,
            workflow: {
              action: OrderWorkflowAction.SAVE_DRAFT,
              comments: "Creating order",
              assignes: null,
              rating: null,
              documents: [{}],
            },
            documents: [],
            additionalDetails: additionalDetails,
            orderDetails: {
              ...(parties || {}),
              applicationTitle: t(documentSubmission?.[0]?.applicationList?.applicationType),
              applicationNumber: refApplicationId,
              applicationCMPNumber: applicationCMPNumber,
              caseNumber: caseNumber,
              ...(orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE" ? { action: type === "reject" ? "REJECT" : "APPROVE" } : {}),
            },
            ...(linkedOrderNumber && { linkedOrderNumber }),
          },
        };
        try {
          const res = await ordersService.createOrder(reqbody, { tenantId });
          const name = getOrderActionName(documentSubmission?.[0]?.applicationList?.applicationType ? type : type);
          DRISTIService.customApiService(Urls.dristi.pendingTask, {
            pendingTask: {
              actionCategory:
                name === "ORDER_EXTENSION_SUBMISSION_DEADLINE"
                  ? "View Application"
                  : name === "ORDER_FOR_INITIATING_RESCHEDULING_OF_HEARING_DATE"
                  ? "Schedule Hearing"
                  : null,
              name: t(name),
              entityType: "order-default",
              referenceId: `MANUAL_${res?.order?.orderNumber}`,
              status: "DRAFT_IN_PROGRESS",
              assignedTo: [],
              assignedRole: ["PENDING_TASK_ORDER"],
              cnrNumber,
              filingNumber,
              ccaseId: caseDetails?.id,
              caseTitle: caseDetails?.caseTitle,
              isCompleted: false,
              stateSla: stateSlaMap.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
              additionalDetails: { orderType },
              tenantId,
            },
          });
          sessionStorage.setItem("currentOrderType", orderType);
          await refetchOrdersData();
          history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
        } catch (error) {
          const errorCode = error?.response?.data?.Errors?.[0]?.code;
          const errorMsg =
            errorCode === "HEARING_ALREADY_COMPLETED" ? t("HEARING_ALREADY_CLOSED_FOR_THIS_RESCHEDULE_REQUEST") : t("SOMETHING_WENT_WRONG");
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      const errorCode = error?.response?.data?.Errors?.[0]?.code;
      const errorMsg =
        errorCode === "HEARING_ALREADY_COMPLETED" ? t("HEARING_ALREADY_CLOSED_FOR_THIS_RESCHEDULE_REQUEST") : t("SOMETHING_WENT_WRONG");
      toast.error(errorMsg);
    }
  };

  useEffect(() => {
    const currentOrderType = sessionStorage.getItem("currentOrderType");
    if (!isOrderTypeLoading && !isOrdersLoading && currentOrderType && Object.keys(currentOrder).length > 0 && !Object.keys(orderType).length > 0) {
      let currentOrderTypeIndex = 0;
      if (currentOrder?.orderCategory !== "INTERMEDIATE") {
        currentOrderTypeIndex = currentOrder?.compositeItems?.findIndex((item) => item?.orderType === currentOrderType);
      }
      setOrderType(
        {
          ...orderTypeData?.find((type) => type?.code === currentOrderType),
        } || {}
      );
      setCompositeOrderIndex(currentOrderTypeIndex);
      setAddOrderModal(true);
    }
  }, [currentOrder, isOrderTypeLoading, isOrdersLoading, orderType, orderTypeData]);

  useEffect(() => {
    if (
      !hasCalledApplicationAction?.current &&
      documentSubmission &&
      Object?.keys(documentSubmission)?.length > 0 &&
      isApplicationAccepted !== undefined &&
      isApplicationAccepted !== null &&
      Object?.keys(caseDetails)?.length &&
      Object?.keys(currentOrder)?.length &&
      !isCaseDetailsLoading &&
      !isOrdersLoading &&
      !isOrdersFetching &&
      !isApplicationDetailsLoading &&
      !isOrderTypeLoading
    ) {
      hasCalledApplicationAction.current = true;
      const actionType = isApplicationAccepted ? "accept" : "reject";
      handleApplicationAction(actionType);
    }
  }, [
    documentSubmission,
    isApplicationAccepted,
    caseDetails,
    currentOrder,
    isCaseDetailsLoading,
    isOrdersLoading,
    isOrdersFetching,
    isApplicationDetailsLoading,
    isOrderTypeLoading,
  ]);

  useEffect(() => {
    if (!hasInitialized.current && currentOrder && (currentInProgressHearing || currentOrder?.hearingNumber)) {
      const todayDate = new Date().toISOString().split("T")[0];
      let hearingDate = null;

      if (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType === "ACCEPT_RESCHEDULING_REQUEST") {
        hearingDate = currentOrder?.additionalDetails?.formdata?.newHearingDate;
      } else {
        const acceptRescheduleRequest = currentOrder?.compositeItems?.find((item) => item?.orderType === "ACCEPT_RESCHEDULING_REQUEST");
        hearingDate = acceptRescheduleRequest?.orderSchema?.additionalDetails?.formdata?.newHearingDate;
      }

      if (hearingDate && hearingDate !== todayDate) {
        setSkipScheduling(true);
        hasInitialized.current = true;
      }
    }
  }, [currentInProgressHearing, currentOrder]);

  if (isLoading || isCaseDetailsLoading || isHearingFetching || isOrderTypeLoading || isPurposeOfHearingLoading || isBailTypeLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {(isApiCallLoading || addOrderTypeLoader || isOrdersLoading || isMiscellaneousTemplateLoading) && (
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
      <div className="generate-orders-v2-content">
        <div className="generate-orders-v2-header">
          <Header>{`${t("CS_ORDER")} : ${caseDetails?.caseTitle}`}</Header>
          {(isJudge || isTypist) && !hideNextHearingButton && (
            <Button
              variation={"primary"}
              label={t("CS_CASE_NEXT_HEARING")}
              children={<RightArrow />}
              isSuffix={true}
              onButtonClick={handleNextHearingClick}
              style={{
                boxShadow: "none",
              }}
            ></Button>
          )}
        </div>

        <div className="generate-orders-v2-columns">
          {/* Left Column */}
          <div className="generate-orders-v2-column">
            <TasksComponent
              taskType={taskType}
              setTaskType={setTaskType}
              userInfoType={userInfoType}
              filingNumber={filingNumber}
              inCase={true}
              hideFilters={true}
              isApplicationCompositeOrder={true}
              compositeOrderObj={currentOrder}
              applicationData={applicationData}
            />
            {(currentInProgressHearing || currentOrder?.hearingNumber) && (
              <AttendanceSection
                t={t}
                attendeesOptions={attendeesOptions}
                presentAttendees={presentAttendees}
                absentAttendees={absentAttendees}
                setPresentAttendees={setPresentAttendees}
                setAbsentAttendees={setAbsentAttendees}
                setErrors={setErrors}
                setCurrentOrder={setCurrentOrder}
                currentOrder={currentOrder}
                ErrorAttendeesKey={ErrorAttendeesKey}
                errors={errors}
              />
            )}

            <OrderTypeSection
              t={t}
              isHearingAvailable={currentInProgressHearing || currentOrder?.hearingNumber}
              currentOrder={currentOrder}
              orderTypeData={orderTypeData}
              applicationTypeConfigUpdated={applicationTypeConfigUpdated}
              setOrderType={setOrderType}
              setCompositeOrderIndex={setCompositeOrderIndex}
              handleEditOrder={handleEditOrder}
              setDeleteOrderItemIndex={setDeleteOrderItemIndex}
              handleOrderTypeChange={handleOrderTypeChange}
              handleAddForm={handleAddForm}
              isAddItemDisabled={isAddItemDisabled}
              skipScheduling={skipScheduling}
              setSkipScheduling={setSkipScheduling}
              setCurrentOrder={setCurrentOrder}
              setPurposeOfHearing={setPurposeOfHearing}
              setNextHearingDate={setNextHearingDate}
              setErrors={setErrors}
              purposeOfHearing={purposeOfHearing}
              purposeOfHearingData={purposeOfHearingData}
              nextHearingDate={nextHearingDate}
              purposeOfHearingConfig={purposeOfHearingConfig}
              nextDateOfHearing={nextDateOfHearing}
              errors={errors}
              currentInProgressHearing={currentInProgressHearing}
            />
          </div>

          <OrderTextSection
            t={t}
            currentInProgressHearing={currentInProgressHearing}
            currentOrder={currentOrder}
            presentAttendees={presentAttendees}
            absentAttendees={absentAttendees}
            attendeeOptions={attendeeOptions}
            SelectCustomFormatterTextArea={SelectCustomFormatterTextArea}
            itemTextConfig={itemTextConfig}
            onItemTextSelect={onItemTextSelect}
            errors={errors}
            skipScheduling={skipScheduling}
            purposeOfHearing={purposeOfHearing}
            nextHearingDate={nextHearingDate}
            purposeOfHearingConfig={purposeOfHearingConfig}
            nextDateOfHearing={nextDateOfHearing}
          />
        </div>
        {hasOrderUpdateAccess && (
          <ActionBar
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#fff",
              padding: "16px 24px",
              boxShadow: "none",
              borderTop: "1px solid #BBBBBD",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <Button
                label={t("CS_COMMON_BACK")}
                variation={"secondary"}
                onButtonClick={handleGoBack}
                style={{ boxShadow: "none", backgroundColor: "#fff", width: "110px", marginRight: "20px", border: "none" }}
                textStyles={{
                  fontFamily: "Roboto",
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: "18.75px",
                  textAlign: "center",
                  color: "#007E7E",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                <Button
                  label={t("SAVE_AS_DRAFT")}
                  variation={"secondary"}
                  onButtonClick={async () => {
                    try {
                      await handleSaveDraft(currentOrder);
                      setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
                    } catch (error) {
                      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
                    }
                  }}
                  style={{ boxShadow: "none", backgroundColor: "#fff", padding: "10px", width: "240px", marginRight: "20px" }}
                  textStyles={{
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "18.75px",
                    textAlign: "center",
                    color: "#007E7E",
                  }}
                />
                <SubmitBar label={t("PREVIEW_ORDER_PDF")} style={{ boxShadow: "none" }} onSubmit={handleReviewOrderClick} />
              </div>
            </div>
          </ActionBar>
        )}
      </div>
      {showEditOrderModal && (
        <EditSendBackModal
          t={t}
          handleCancel={() => setEditOrderModal(false)}
          handleSubmit={handleEditConfirmationOrder}
          headerLabel={"GENERATE_ORDER_CONFIRM_EDIT"}
          saveLabel={"GENERATE_ORDER_CONFIRM"}
          cancelLabel={"GENERATE_ORDER_CANCEL_EDIT"}
          contentText={"GENERATE_ORDER_CONFIRM_EDIT_TEXT"}
          className={"edit-send-back-modal"}
        />
      )}
      {deleteOrderItemIndex !== null && (
        <EditSendBackModal
          t={t}
          handleCancel={() => setDeleteOrderItemIndex(null)}
          handleSubmit={() => handleDeleteOrderItem(deleteOrderItemIndex)}
          headerLabel={"GENERATE_ORDER_CONFIRM_DELETE"}
          saveLabel={"GENERATE_ORDER_DELETE"}
          cancelLabel={"GENERATE_ORDER_CANCEL_EDIT"}
          contentText={"GENERATE_ORDER_CONFIRM_EDIT_TEXT"}
          className={"edit-send-back-modal"}
          submitButtonStyle={{ backgroundColor: "#C7222A" }}
        />
      )}
      {showAddOrderModal && (
        <AddOrderTypeModal
          t={t}
          handleCancel={() => {
            setEditOrderModal(false);
            setAddOrderModal(false);
            sessionStorage.removeItem("currentOrderType");
          }}
          headerLabel={
            showEditOrderModal
              ? `${t("EDIT")} ${orderType?.code === "ACCEPT_BAIL" ? "BAIL" : t(orderType?.code)}`
              : `${t("ADD")} ${orderType?.code === "ACCEPT_BAIL" ? "BAIL" : t(orderType?.code)}`
          }
          saveLabel={"CONFIRM"}
          cancelLabel={"CANCEL_EDIT"}
          handleSubmit={handleAddOrder}
          orderType={orderType}
          modifiedFormConfig={getModifiedFormConfig(compositeOrderIndex)}
          getDefaultValue={getDefaultValue}
          currentOrder={currentOrder}
          index={compositeOrderIndex}
          setFormErrors={setFormErrors}
          clearFormErrors={clearFormErrors}
          setValueRef={setValueRef}
          addOrderTypeLoader={addOrderTypeLoader}
          setWarrantSubtypeCode={setWarrantSubtypeCode}
          bailBondRequired={bailBondRequired}
          setBailBondRequired={setBailBondRequired}
          policeStationData={sortedPoliceStations}
          caseDetails={caseDetails}
          miscellaneousProcessTemplateDropDown={miscellaneousProcessTemplateDropDown}
        />
      )}
      {showMandatoryFieldsErrorModal?.showModal && (
        <MandatoryFieldsErrorModal
          t={t}
          showMandatoryFieldsErrorModal={showMandatoryFieldsErrorModal}
          setShowMandatoryFieldsErrorModal={setShowMandatoryFieldsErrorModal}
        ></MandatoryFieldsErrorModal>
      )}
      {showReviewModal && (
        <OrderReviewModal
          t={t}
          order={currentPublishedOrder || currentOrder}
          setShowReviewModal={setShowReviewModal}
          setShowsignatureModal={setShowsignatureModal}
          setOrderPdfFileStoreID={setOrderPdfFileStoreID}
          showActions={canESign && !currentDiaryEntry}
          saveSignLater={canSaveSignLater && !currentDiaryEntry}
          setBusinessOfTheDay={setBusinessOfTheDay}
          currentDiaryEntry={currentDiaryEntry}
          handleUpdateBusinessOfDayEntry={handleUpdateBusinessOfDayEntry}
          handleReviewGoBack={handleReviewGoBack}
          businessOfDay={businessOfTheDay}
          updateOrder={updateOrder}
          setShowBulkModal={setShowBulkModal}
          courtId={caseCourtId}
        />
      )}
      {showsignatureModal && (
        <OrderSignatureModal
          t={t}
          order={currentOrder}
          handleIssueOrder={processHandleIssueOrder}
          handleGoBackSignatureModal={handleGoBackSignatureModal}
          setSignedDocumentUploadID={setSignedDocumentUploadID}
          setSignedOrderPdfFileName={setSignedOrderPdfFileName}
          orderPdfFileStoreID={orderPdfFileStoreID}
          saveOnsubmitLabel={"ISSUE_ORDER"}
          businessOfDay={businessOfTheDay}
        />
      )}
      {showSuccessModal && (
        <OrderSucessModal
          t={t}
          order={prevOrder}
          handleDownloadOrders={handleDownloadOrders}
          handleClose={handleClose}
          handleCloseSuccessModal={handleCloseSuccessModal}
          actionSaveLabel={successModalActionSaveLabel}
        />
      )}
      {showOrderValidationModal?.showModal && (
        <CompositeOrdersErrorModal
          t={t}
          showOrderValidationModal={showOrderValidationModal}
          setShowOrderValidationModal={setShowOrderValidationModal}
        ></CompositeOrdersErrorModal>
      )}
      {showBulkModal && (
        <OrderAddToBulkSuccessModal
          t={t}
          order={currentOrder}
          handleDownloadOrders={handleBulkDownloadOrder}
          handleCloseSuccessModal={handleBulkCloseSuccessModal}
        ></OrderAddToBulkSuccessModal>
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default GenerateOrdersV2;
