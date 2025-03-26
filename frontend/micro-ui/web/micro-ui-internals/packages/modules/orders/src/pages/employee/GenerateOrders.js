import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import { Header, FormComposerV2, Toast, Button, EditIcon, Modal, CloseButton, TextInput, CloseSvg } from "@egovernments/digit-ui-react-components";
import {
  applicationTypeConfig,
  configCheckout,
  configRejectSubmission,
  configsAssignDateToRescheduledHearing,
  configsAssignNewHearingDate,
  configsBail,
  configsCaseSettlement,
  configsCaseTransfer,
  configsCaseWithdrawal,
  configsCreateOrderWarrant,
  configsInitiateRescheduleHearingDate,
  configsIssueNotice,
  configsIssueSummons,
  configsJudgement,
  configsOrderMandatorySubmissions,
  configsOrderSection202CRPC,
  configsOrderSubmissionExtension,
  configsOrderTranferToADR,
  configsOthers,
  configsRejectCheckout,
  configsRejectRescheduleHeadingDate,
  configsRescheduleHearingDate,
  configsScheduleHearingDate,
  configsScheduleNextHearingDate,
  configsVoluntarySubmissionStatus,
  configsIssueBailAcceptance,
  configsIssueBailReject,
  configsSetTermBail,
  configsAcceptRejectDelayCondonation,
  configsAdmitDismissCase,
  configsAdmitCase,
  configsDismissCase,
  configsApproveRejectLitigantDetailsChange,
  replaceAdvocateConfig,
} from "../../configs/ordersCreateConfig";
import { CustomAddIcon, CustomDeleteIcon, WarningInfoIconYellow } from "../../../../dristi/src/icons/svgIndex";
import OrderReviewModal from "../../pageComponents/OrderReviewModal";
import OrderSignatureModal from "../../pageComponents/OrderSignatureModal";
import OrderDeleteModal from "../../pageComponents/OrderDeleteModal";
import { ordersService, schedulerService, taskService } from "../../hooks/services";
import { Loader } from "@egovernments/digit-ui-components";
import OrderSucessModal from "../../pageComponents/OrderSucessModal";
import { applicationTypes } from "../../utils/applicationTypes";
import isEqual from "lodash/isEqual";
import { OrderWorkflowAction, OrderWorkflowState } from "../../utils/orderWorkflow";
import { Urls } from "../../hooks/services/Urls";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../utils/submissionWorkflow";
import { getAdvocates, getuuidNameMap } from "../../utils/caseUtils";
import { HearingWorkflowAction, HearingWorkflowState } from "../../utils/hearingWorkflow";
import _ from "lodash";
import { useGetPendingTask } from "../../hooks/orders/useGetPendingTask";
import useSearchOrdersService from "../../hooks/orders/useSearchOrdersService";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { getRespondantName, getComplainantName, constructFullName, removeInvalidNameParts, getFormattedName } from "../../utils";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import ErrorDataModal from "@egovernments/digit-ui-module-dristi/src/pages/citizen/FileCase/ErrorDataModal";
import CompositeOrdersErrorModal from "./CompositeOrdersErrorModal";
import OrderItemDeleteModal from "./OrderItemDeleteModal";
import TasksComponent from "../../../../home/src/components/TaskComponent";
import MandatoryFieldsErrorModal from "./MandatoryFieldsErrorModal";
import OrderAddToBulkSuccessModal from "../../pageComponents/OrderAddToBulkSuccessModal";

// any order type from orderTypes can not be paired with any order from unAllowedOrderTypes when creating composite order.
export const compositeOrderAllowedTypes = [
  {
    key: "finalStageOrders",
    orderTypes: ["REFERRAL_CASE_TO_ADR", "JUDGEMENT", "WITHDRAWAL", "SETTLEMENT", "CASE_TRANSFER", "DISMISS_CASE"],
    unAllowedOrderTypes: ["REFERRAL_CASE_TO_ADR", "JUDGEMENT", "WITHDRAWAL", "SETTLEMENT", "CASE_TRANSFER", ""],
  },
  {
    key: "schedule_Reschedule",
    orderTypes: ["SCHEDULE_OF_HEARING_DATE", "RESCHEDULE_OF_HEARING_DATE"],
    unAllowedOrderTypes: ["SCHEDULE_OF_HEARING_DATE", "RESCHEDULE_OF_HEARING_DATE"],
  },
  {
    key: "no_restriction",
    orderTypes: ["NOTICE", "OTHERS", "WARRANT", "SUMMONS", "MANDATORY_SUBMISSIONS_RESPONSES", "SECTION_202_CRPC"],
    unAllowedOrderTypes: [],
  },
  {
    key: "admit_case",
    orderTypes: ["ADMIT_CASE"],
    unAllowedOrderTypes: ["ADMIT_CASE", "DISMISS_CASE"],
  },
];

const stateSla = {
  SCHEDULE_HEARING: 3 * 24 * 3600 * 1000,
  NOTICE: 3 * 24 * 3600 * 1000,
};

const configKeys = {
  SECTION_202_CRPC: configsOrderSection202CRPC,
  MANDATORY_SUBMISSIONS_RESPONSES: configsOrderMandatorySubmissions,
  EXTENSION_OF_DOCUMENT_SUBMISSION_DATE: configsOrderSubmissionExtension,
  REFERRAL_CASE_TO_ADR: configsOrderTranferToADR,
  SCHEDULE_OF_HEARING_DATE: configsScheduleHearingDate,
  SCHEDULING_NEXT_HEARING: configsScheduleNextHearingDate,
  RESCHEDULE_OF_HEARING_DATE: configsRescheduleHearingDate,
  CHECKOUT_ACCEPTANCE: configCheckout,
  CHECKOUT_REJECT: configsRejectCheckout,
  REJECTION_RESCHEDULE_REQUEST: configsRejectRescheduleHeadingDate,
  INITIATING_RESCHEDULING_OF_HEARING_DATE: configsInitiateRescheduleHearingDate,
  ASSIGNING_DATE_RESCHEDULED_HEARING: configsAssignDateToRescheduledHearing,
  ASSIGNING_NEW_HEARING_DATE: configsAssignNewHearingDate,
  CASE_TRANSFER: configsCaseTransfer,
  SETTLEMENT: configsCaseSettlement,
  SUMMONS: configsIssueSummons,
  NOTICE: configsIssueNotice,
  BAIL: configsBail,
  WARRANT: configsCreateOrderWarrant,
  WITHDRAWAL: configsCaseWithdrawal,
  OTHERS: configsOthers,
  APPROVE_VOLUNTARY_SUBMISSIONS: configsVoluntarySubmissionStatus,
  REJECT_VOLUNTARY_SUBMISSIONS: configRejectSubmission,
  JUDGEMENT: configsJudgement,
  REJECT_BAIL: configsIssueBailReject,
  ACCEPT_BAIL: configsIssueBailAcceptance,
  SET_BAIL_TERMS: configsSetTermBail,
  ACCEPTANCE_REJECTION_DCA: configsAcceptRejectDelayCondonation,
  ADMIT_CASE: configsAdmitCase,
  DISMISS_CASE: configsDismissCase,
  APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE: configsApproveRejectLitigantDetailsChange,
  ADVOCATE_REPLACEMENT_APPROVAL: replaceAdvocateConfig,
};

function applyMultiSelectDropdownFix(setValue, formData, keys) {
  keys.forEach((key) => {
    if (formData[key] && Array.isArray(formData[key]) && formData[key].length === 0) {
      setValue(key, undefined);
    }
  });
}

const OutlinedInfoIcon = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", right: -22, top: 0 }}>
    <g clip-path="url(#clip0_7603_50401)">
      <path
        d="M8.70703 5.54232H10.2904V7.12565H8.70703V5.54232ZM8.70703 8.70898H10.2904V13.459H8.70703V8.70898ZM9.4987 1.58398C5.1287 1.58398 1.58203 5.13065 1.58203 9.50065C1.58203 13.8707 5.1287 17.4173 9.4987 17.4173C13.8687 17.4173 17.4154 13.8707 17.4154 9.50065C17.4154 5.13065 13.8687 1.58398 9.4987 1.58398ZM9.4987 15.834C6.00745 15.834 3.16536 12.9919 3.16536 9.50065C3.16536 6.0094 6.00745 3.16732 9.4987 3.16732C12.9899 3.16732 15.832 6.0094 15.832 9.50065C15.832 12.9919 12.9899 15.834 9.4987 15.834Z"
        fill="#3D3C3C"
      />
    </g>
    <defs>
      <clipPath id="clip0_7603_50401">
        <rect width="19" height="19" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};
const CloseBtn = (props) => {
  return (
    <div
      className="composite-orders-error-modal-close"
      onClick={props?.onClick}
      style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}
    >
      <CloseSvg />
    </div>
  );
};

const stateSlaMap = {
  SECTION_202_CRPC: 3,
  MANDATORY_SUBMISSIONS_RESPONSES: 3,
  EXTENSION_OF_DOCUMENT_SUBMISSION_DATE: 3,
  REFERRAL_CASE_TO_ADR: 3,
  SCHEDULE_OF_HEARING_DATE: 3,
  RESCHEDULE_OF_HEARING_DATE: 3,
  REJECTION_RESCHEDULE_REQUEST: 3,
  APPROVAL_RESCHEDULE_REQUEST: 3,
  INITIATING_RESCHEDULING_OF_HEARING_DATE: 1,
  ASSIGNING_DATE_RESCHEDULED_HEARING: 3,
  ASSIGNING_NEW_HEARING_DATE: 3,
  CASE_TRANSFER: 3,
  SETTLEMENT: 3,
  SUMMONS: 3,
  NOTICE: 3,
  BAIL: 3,
  WARRANT: 3,
  WITHDRAWAL: 3,
  OTHERS: 3,
  APPROVE_VOLUNTARY_SUBMISSIONS: 3,
  REJECT_VOLUNTARY_SUBMISSIONS: 3,
  REJECT_BAIL: 3,
  ACCEPT_BAIL: 3,
  SET_BAIL_TERMS: 3,
  JUDGEMENT: 3,
  CHECKOUT_ACCEPTANCE: 1,
  CHECKOUT_REJECT: 1,
};

const channelTypeEnum = {
  "e-Post": { code: "POST", type: "Post" },
  "Registered Post": { code: "RPAD", type: "RPAD" },
  SMS: { code: "SMS", type: "SMS" },
  "Via Police": { code: "POLICE", type: "Police" },
  "E-mail": { code: "EMAIL", type: "Email" },
};

const dayInMillisecond = 24 * 3600 * 1000;

const GenerateOrders = () => {
  const { t } = useTranslation();
  const { orderNumber, filingNumber } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [selectedOrder, _setSelectedOrder] = useState(0);
  const [deleteOrderIndex, setDeleteOrderIndex] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showsignatureModal, setShowsignatureModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formList, setFormList] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const [prevOrder, setPrevOrder] = useState();
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [loader, setLoader] = useState(false);
  const [createdHearing, setCreatedHearing] = useState({});
  const [signedDoucumentUploadedID, setSignedDocumentUploadID] = useState("");
  const [newHearingNumber, setNewHearingNumber] = useState(null);
  const [createdSummon, setCreatedSummon] = useState(null);
  const [createdNotice, setCreatedNotice] = useState(null);
  const [orderPdfFileStoreID, setOrderPdfFileStoreID] = useState(null);
  const history = useHistory();
  const todayDate = new Date().getTime();
  const setFormErrors = useRef([]);
  const [currentFormData, setCurrentFormData] = useState(null);
  const roles = Digit.UserService.getUser()?.info?.roles;
  const canESign = roles?.some((role) => role.code === "ORDER_ESIGN");
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const judgeName = window?.globalConfigs?.getConfig("JUDGE_NAME");
  const [businessOfTheDay, setBusinessOfTheDay] = useState(null);
  const toast = useToast();
  const [currentPublishedOrder, setCurrentPublishedOrder] = useState(null);
  const [showOrderValidationModal, setShowOrderValidationModal] = useState({ showModal: false, errorMessage: "" });
  const formValueChangeTriggerRefs = useRef([]);
  const submitButtonRefs = useRef([]);
  const setValueRef = useRef([]);
  const formStateRef = useRef([]);
  const clearFormErrors = useRef([]);
  const [deleteOrderItemIndex, setDeleteOrderItemIndex] = useState(null);

  const [OrderTitles, setOrderTitles] = useState([]);
  const [showEditTitleNameModal, setShowEditTitleNameModal] = useState(false);
  const [modalTitleName, setModalTitleName] = useState("");
  const [showMandatoryFieldsErrorModal, setShowMandatoryFieldsErrorModal] = useState({ showModal: false, errorsData: [] });

  const currentDiaryEntry = history.location?.state?.diaryEntry;

  const setSelectedOrder = (orderIndex) => {
    _setSelectedOrder(orderIndex);
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };
  const { data: courtRoomDetails, isLoading: isCourtIdsLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "Court_Rooms" },
  ]);
  const courtRooms = useMemo(() => courtRoomDetails?.Court_Rooms || [], [courtRoomDetails]);

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
  const summonsCourtFee = useMemo(() => courtFeeAmount?.find((p) => p?.paymentCode === "SUMMONS_COURT_FEE")?.amount || 0, [courtFeeAmount]);

  const { data: caseData, isLoading: isCaseDetailsLoading, refetch: refetchCaseData } = Digit.Hooks.dristi.useSearchCaseService(
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
  const userInfo = Digit.UserService.getUser()?.info;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [taskType, setTaskType] = useState({});

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const { data: courtRoomData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "common-masters", [{ name: "Court_Rooms" }], {
    select: (data) => {
      let newData = {};
      [{ name: "Court_Rooms" }]?.forEach((master) => {
        const optionsData = _.get(data, `${"common-masters"}.${master?.name}`, []);
        newData = {
          ...newData,
          [master.name]: optionsData.filter((opt) => (opt?.hasOwnProperty("active") ? opt.active : true)).map((opt) => ({ ...opt })),
        };
      });
      return newData;
    },
  });

  const { data: orderTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Order", [{ name: "OrderType" }], {
    select: (data) => {
      return _.get(data, "Order.OrderType", [])
        .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
        .map((opt) => ({ ...opt }));
    },
  });

  const cnrNumber = useMemo(() => caseDetails?.cnrNumber, [caseDetails]);
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const uuidNameMap = useMemo(() => getuuidNameMap(caseDetails), [caseDetails]);
  const isCaseAdmitted = useMemo(() => {
    return caseDetails?.status === "CASE_ADMITTED";
  }, [caseDetails?.status]);

  const complainants = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("complainant"))
        .map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          return {
            code: fullName,
            name: `${fullName} (Complainant)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "complainant",
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);

  const respondents = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("respondent"))
        .map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);

  const unJoinedLitigant = useMemo(() => {
    return (
      caseDetails?.additionalDetails?.respondentDetails?.formdata
        ?.filter((data) => !data?.data?.respondentVerification?.individualDetails?.individualId)
        ?.map((data) => {
          const fullName = constructFullName(data?.data?.respondentFirstName, data?.data?.respondentMiddleName, data?.data?.respondentLastName);
          return { code: fullName, name: `${fullName} (Accused)`, uuid: data?.data?.uuid, isJoined: false, partyType: "respondent" };
        }) || []
    );
  }, [caseDetails]);

  const witnesses = useMemo(() => {
    return (
      caseDetails?.additionalDetails?.witnessDetails?.formdata?.map((data) => {
        const fullName = getFormattedName(data?.data?.firstName, data?.data?.middleName, data?.data?.lastName, data?.data?.witnessDesignation, null);
        return { code: fullName, name: `${fullName} (Witness)`, uuid: data?.data?.uuid, partyType: "witness" };
      }) || []
    );
  }, [caseDetails]);

  const allParties = useMemo(() => [...complainants, ...respondents, ...unJoinedLitigant, ...witnesses], [
    complainants,
    respondents,
    unJoinedLitigant,
    witnesses,
  ]);

  const { data: ordersData, refetch: refetchOrdersData, isLoading: isOrdersLoading, isFetching: isOrdersFetching } = useSearchOrdersService(
    {
      tenantId,
      criteria: { filingNumber, applicationNumber: "", cnrNumber, status: OrderWorkflowState.DRAFT_IN_PROGRESS },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.DRAFT_IN_PROGRESS,
    Boolean(filingNumber)
  );

  const { data: noticeOrdersData } = useSearchOrdersService(
    {
      tenantId,
      criteria: { filingNumber, applicationNumber: "", cnrNumber, orderType: "NOTICE", status: "PUBLISHED" },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber,
    Boolean(filingNumber)
  );

  // Get all the published orders corresponding to approval/rejection of litigants profile change request.
  const { data: approveRejectLitigantDetailsChangeOrderData } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        cnrNumber,
        orderType: "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
        status: OrderWorkflowState.PUBLISHED,
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.PUBLISHED,
    Boolean(filingNumber && cnrNumber)
  );

  const publishedLitigantDetailsChangeOrders = useMemo(() => approveRejectLitigantDetailsChangeOrderData?.list || [], [
    approveRejectLitigantDetailsChangeOrderData,
  ]);

  const isDCANoticeGenerated = useMemo(
    () =>
      noticeOrdersData?.list?.some((notice) => {
        if (notice?.orderCategory === "COMPOSITE") {
          return notice?.compositeItems?.some((item) => item?.orderSchema?.additionalDetails?.formdata?.noticeType?.code === "DCA Notice");
        }
        return notice?.additionalDetails?.formdata?.noticeType?.code === "DCA Notice";
      }),
    [noticeOrdersData]
  );

  const { data: publishedOrdersData, isLoading: isPublishedOrdersLoading } = useSearchOrdersService(
    {
      tenantId,
      criteria: { filingNumber, applicationNumber: "", cnrNumber, status: OrderWorkflowState.PUBLISHED, orderType: "ACCEPT_BAIL" },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.PUBLISHED,
    Boolean(filingNumber && cnrNumber)
  );
  const publishedBailOrder = useMemo(() => publishedOrdersData?.list?.[0] || {}, [publishedOrdersData]);
  const advocateIds = caseDetails.representatives?.map((representative) => {
    return {
      id: representative.advocateId,
    };
  });

  const { data: advocateDetails } = Digit.Hooks.dristi.useGetIndividualAdvocate(
    {
      criteria: advocateIds,
    },
    { tenantId: tenantId },
    "DRISTI",
    cnrNumber + filingNumber,
    true
  );

  const defaultIndex = useMemo(() => {
    return formList.findIndex((order) => order?.orderNumber === orderNumber);
  }, [formList, orderNumber]);

  const defaultOrderData = useMemo(
    () => ({
      createdDate: null,
      tenantId,
      cnrNumber,
      filingNumber,
      orderCategory: "INTERMEDIATE",
      statuteSection: {
        tenantId,
      },
      status: "",
      isActive: true,
      workflow: {
        action: OrderWorkflowAction.SAVE_DRAFT,
        comments: "Creating order",
        assignes: [],
        rating: null,
        documents: [{}],
      },
      documents: [],
      additionalDetails: { formdata: {} },
    }),
    [cnrNumber, filingNumber, tenantId]
  );
  const formatDate = (date, format) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    if (format === "DD-MM-YYYY") {
      return `${day}-${month}-${year}`;
    }
    return `${year}-${month}-${day}`;
  };
  useEffect(() => {
    if (!ordersData?.list || ordersData?.list.length < 1) {
      setFormList([defaultOrderData]);
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
      setFormList(updatedFormList);
    }
  }, [ordersData, defaultOrderData]);

  useEffect(() => {
    if (Boolean(filingNumber && cnrNumber)) {
      refetchOrdersData();
    }
  }, [cnrNumber, filingNumber, refetchOrdersData]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (defaultIndex && defaultIndex !== -1 && orderNumber && defaultIndex !== selectedOrder) {
      setSelectedOrder(defaultIndex);
    }
    const isSignSuccess = localStorage.getItem("esignProcess");
    const savedOrderPdf = localStorage.getItem("orderPDF");
    if (isSignSuccess) {
      setShowsignatureModal(true);
      setOrderPdfFileStoreID(savedOrderPdf);
      localStorage.removeItem("esignProcess");
      localStorage.removeItem("orderPDF");
    }
  }, [defaultIndex]);

  useEffect(() => {
    const getOrder = async () => {
      try {
        const response = await DRISTIService.searchOrders(
          {
            criteria: {
              filingNumber: filingNumber,
              orderNumber: orderNumber,
              status: "PUBLISHED",
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
  }, [currentDiaryEntry, filingNumber, orderNumber, tenantId]);

  const currentOrder = useMemo(() => formList?.[selectedOrder], [formList, selectedOrder]);
  const hearingNumber = useMemo(() => currentOrder?.hearingNumber || currentOrder?.additionalDetails?.hearingId || "", [currentOrder]);
  useEffect(() => {
    const formListNew = structuredClone([...(ordersData?.list || [])].reverse());
    const orderTitlesInitial =
      formListNew?.map((order) => {
        return `${t(order?.orderTitle)}`;
      }) || [];
    if (!isEqual(orderTitlesInitial, OrderTitles)) {
      setOrderTitles(orderTitlesInitial);
    }
  }, [ordersData, t]);
  const { data: pendingTaskData = [], isLoading: pendingTasksLoading } = useGetPendingTask({
    data: {
      SearchCriteria: {
        tenantId,
        moduleName: "Pending Tasks Service",
        moduleSearchCriteria: {
          filingNumber,
          isCompleted: false,
        },
        limit: 10000,
        offset: 0,
      },
    },
    params: { tenantId },
    key: filingNumber,
  });

  const pendingTaskDetails = useMemo(() => pendingTaskData?.data || [], [pendingTaskData]);
  const mandatorySubmissionTasks = useMemo(() => {
    const pendingtask = pendingTaskDetails?.filter((obj) =>
      obj.fields.some((field) => field.key === "referenceId" && field.value?.includes(currentOrder?.linkedOrderNumber))
    );
    if (pendingtask?.length > 0) {
      return pendingtask?.map((item) =>
        item?.fields.reduce((acc, field) => {
          if (field.key.startsWith("assignedTo[")) {
            const indexMatch = field.key.match(/assignedTo\[(\d+)\]\.uuid/);
            if (indexMatch) {
              const index = parseInt(indexMatch[1], 10);
              acc.assignedTo = acc.assignedTo || [];
              acc.assignedTo[index] = { uuid: field.value };
            }
          } else {
            acc[field.key] = field.value;
          }
          return acc;
        }, {})
      );
    }
    return [];
  }, [currentOrder?.linkedOrderNumber, pendingTaskDetails]);

  const { data: applicationData, isLoading: isApplicationDetailsLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
      },
      tenantId,
    },
    {},
    filingNumber,
    Boolean(filingNumber)
  );
  const applicationDetails = useMemo(
    () =>
      applicationData?.applicationList?.find(
        (application) => application?.applicationNumber === currentOrder?.additionalDetails?.formdata?.refApplicationId
      ),
    [applicationData, currentOrder]
  );

  const isDelayApplicationSubmitted = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) =>
            item?.applicationType === "DELAY_CONDONATION" &&
            [
              SubmissionWorkflowState.PENDINGAPPROVAL,
              SubmissionWorkflowState.PENDINGREVIEW,
              SubmissionWorkflowState.PENDINGRESPONSE,
              SubmissionWorkflowState.COMPLETED,
            ].includes(item?.status)
        )
      ),
    [applicationData]
  );
  const isDcaFiled = useMemo(() => {
    return caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data?.isDcaSkippedInEFiling === "NO" || isDelayApplicationSubmitted;
  }, [caseDetails, isDelayApplicationSubmitted]);

  const hearingId = useMemo(() => currentOrder?.hearingNumber || applicationDetails?.additionalDetails?.hearingId || "", [
    applicationDetails,
    currentOrder,
  ]);
  const { data: hearingsData, isLoading: isHearingLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: hearingId || hearingNumber,
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    hearingId || hearingNumber,
    true
  );
  const hearingDetails = useMemo(() => hearingsData?.HearingList?.[0], [hearingsData]);
  const hearingsList = useMemo(() => hearingsData?.HearingList?.sort((a, b) => b.startTime - a.startTime), [hearingsData]);

  const isHearingScheduled = useMemo(() => {
    const isPresent = (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.SCHEDULED);
    return isPresent;
  }, [hearingsData]);

  const isHearingOptout = useMemo(() => {
    const isPresent = (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.OPTOUT);
    return isPresent;
  }, [hearingsData]);

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
    [currentOrder]
  );

  const modifiedFormConfig = useMemo(() => {
    if (currentOrder?.orderCategory === "COMPOSITE") {
      return currentOrder?.compositeItems?.map((item) => {
        // We will disable the order type dropdown as a quick fix to handle formcomposer issue
        // becuase if we change the order type, there is a match between formconfig and form data in composer
        // so values are setting in keys of other order type form fields.
        const orderType = item?.orderType;
        let newConfig = orderType
          ? applicationTypeConfig?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfig);

        if (orderType && configKeys.hasOwnProperty(orderType)) {
          let orderTypeForm = configKeys[orderType];
          if (orderType === "SECTION_202_CRPC") {
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
          if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(orderType)) {
            orderTypeForm = orderTypeForm?.map((section) => {
              return {
                ...section,
                body: section.body.map((field) => {
                  if (field.key === "namesOfPartiesRequired") {
                    return {
                      ...field,
                      populators: {
                        ...field.populators,
                        options: [...complainants, ...respondents, ...unJoinedLitigant, ...witnesses],
                      },
                    };
                  }
                  if (field.key === "hearingPurpose") {
                    return {
                      ...field,
                      populators: {
                        ...field.populators,
                        mdmsConfig: {
                          ...field.populators?.mdmsConfig,
                          select: `(data) => {
                            return (  // based on isDcaFiled condition, we can filter out DCA hearing here if needed.
                              data?.Hearing?.HearingType|| []
                            );
                          }`,
                        },
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
          if (orderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
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
          if (orderType === "WARRANT") {
            orderTypeForm = orderTypeForm?.map((section) => {
              return {
                ...section,
                body: section.body.map((field) => {
                  if (field.key === "warrantFor") {
                    return {
                      ...field,
                      ...(!currentOrder?.additionalDetails?.warrantFor && {
                        disable: false,
                      }),
                      populators: {
                        ...field.populators,
                        options: [
                          ...(currentOrder?.additionalDetails?.warrantFor
                            ? [currentOrder?.additionalDetails?.warrantFor]
                            : [...respondents, ...unJoinedLitigant].map((data) => data?.name || "")),
                        ],
                      },
                    };
                  }
                  return field;
                }),
              };
            });
          }
          if (orderType === "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE") {
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
          if (orderType === "JUDGEMENT") {
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
                            customFunction: () => handleSaveDraft({ showReviewModal: false }),
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
          if (orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
            orderTypeForm = orderTypeForm?.map((section) => {
              return {
                ...section,
                body: section.body.filter((field) => {
                  const isRejected = currentOrder?.additionalDetails?.applicationStatus === t("REJECTED");
                  return !(field.key === "newSubmissionDate" && isRejected);
                }),
              };
            });
          }
          newConfig = [...newConfig, ...orderTypeForm];
        }
        const updatedConfig = newConfig.map((config) => {
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
      });
    } else {
      let newConfig = currentOrder?.orderNumber
        ? applicationTypeConfig?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
        : structuredClone(applicationTypeConfig);
      const orderType = currentOrder?.orderType;
      if (orderType && configKeys.hasOwnProperty(orderType)) {
        let orderTypeForm = configKeys[orderType];
        if (orderType === "SECTION_202_CRPC") {
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
        if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(orderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "namesOfPartiesRequired") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents, ...unJoinedLitigant, ...witnesses],
                    },
                  };
                }
                if (field.key === "hearingPurpose") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      mdmsConfig: {
                        ...field.populators?.mdmsConfig,
                        select: `(data) => {
                            return (  // based on isDcaFiled condition, we can filter out DCA hearing here if needed.
                              data?.Hearing?.HearingType|| []
                            );
                          }`,
                      },
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
        if (orderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
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
        if (orderType === "WARRANT") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "warrantFor") {
                  return {
                    ...field,
                    ...(!currentOrder?.additionalDetails?.warrantFor && {
                      disable: false,
                    }),
                    populators: {
                      ...field.populators,
                      options: [
                        ...(currentOrder?.additionalDetails?.warrantFor
                          ? [currentOrder?.additionalDetails?.warrantFor]
                          : [...respondents, ...unJoinedLitigant].map((data) => data?.name || "")),
                      ],
                    },
                  };
                }
                return field;
              }),
            };
          });
        }

        if (orderType === "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE") {
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
        if (orderType === "JUDGEMENT") {
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
                          customFunction: () => handleSaveDraft({ showReviewModal: false }),
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
        if (orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.filter((field) => {
                const isRejected = currentOrder?.additionalDetails?.applicationStatus === t("REJECTED");
                return !(field.key === "newSubmissionDate" && isRejected);
              }),
            };
          });
        }
        newConfig = [...newConfig, ...orderTypeForm];
      }
      const updatedConfig = newConfig.map((config) => {
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
      return [updatedConfig];
    }
  }, [caseDetails, complainants, currentOrder, respondents, t, unJoinedLitigant, witnesses, selectedOrder]);

  const multiSelectDropdownKeys = useMemo(() => {
    const foundKeys = [];
    modifiedFormConfig?.forEach((modified) => {
      modified?.forEach((config) => {
        config.body.forEach((field) => {
          if (field.type === "dropdown" && field.populators.allowMultiSelect) {
            foundKeys.push(field.key);
          }
        });
      });
    });
    return foundKeys;
  }, [modifiedFormConfig]);

  const generateAddress = ({
    pincode = "",
    district = "",
    city = "",
    state = "",
    coordinates = { longitude: "", latitude: "" },
    locality = "",
    address = "",
  } = {}) => {
    if (address) {
      return address;
    }
    return `${locality ? `${locality},` : ""} ${district ? `${district},` : ""} ${city ? `${city},` : ""} ${state ? `${state},` : ""} ${
      pincode ? `- ${pincode}` : ""
    }`.trim();
  };

  const getDefaultValue = useCallback(
    (index) => {
      if (currentOrder?.orderType && !currentOrder?.additionalDetails?.formdata) {
        return {
          orderType: {
            ...orderTypeData?.find((item) => item.code === currentOrder?.orderType),
          },
        };
      }

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
      const orderType = newCurrentOrder?.orderType;
      const newApplicationDetails = applicationData?.applicationList?.find(
        (application) => application?.applicationNumber === newCurrentOrder?.additionalDetails?.formdata?.refApplicationId
      );
      if (orderType === "JUDGEMENT") {
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

        updatedFormdata.caseNumber = caseDetails?.courtCaseNumber;
        setValueRef?.current?.[index]?.("caseNumber", updatedFormdata.caseNumber);

        updatedFormdata.nameOfCourt = courtRooms.find((room) => room.code === caseDetails?.courtId)?.name;
        setValueRef?.current?.[index]?.("nameOfCourt", updatedFormdata.nameOfCourt);

        updatedFormdata.addressRespondant = generateAddress(
          caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.map((data) => data?.addressDetails)?.[0]
        );
        setValueRef?.current?.[index]?.("addressRespondant", updatedFormdata.addressRespondant);

        updatedFormdata.dateChequeReturnMemo = formatDate(new Date(caseDetails?.caseDetails?.chequeDetails?.formdata?.[0]?.data?.depositDate));
        setValueRef?.current?.[index]?.("dateChequeReturnMemo", updatedFormdata.dateChequeReturnMemo);

        updatedFormdata.dateFiling = formatDate(new Date(caseDetails?.filingDate));
        setValueRef?.current?.[index]?.("dateFiling", updatedFormdata.dateFiling);

        updatedFormdata.dateApprehension = formatDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime)) || "";
        setValueRef?.current?.[index]?.("dateApprehension", updatedFormdata.dateApprehension);

        updatedFormdata.dateofReleaseOnBail = formatDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime)) || "";
        setValueRef?.current?.[index]?.("dateofReleaseOnBail", updatedFormdata.dateofReleaseOnBail);

        updatedFormdata.dateofCommencementTrial = formatDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime)) || "";
        setValueRef?.current?.[index]?.("dateofCommencementTrial", updatedFormdata.dateofCommencementTrial);

        updatedFormdata.dateofCloseTrial = formatDate(new Date(hearingsList?.[hearingsList?.length - 2]?.startTime));
        setValueRef?.current?.[index]?.("dateofCloseTrial", updatedFormdata.dateofCloseTrial);

        updatedFormdata.dateofSentence = formatDate(new Date(hearingsList?.[hearingsList?.length - 1]?.startTime));
        setValueRef?.current?.[index]?.("dateofSentence", updatedFormdata.dateofSentence);

        updatedFormdata.offense = "Section 138 of Negotiable Instruments Act";
        setValueRef?.current?.[index]?.("offense", updatedFormdata.offense);
      }

      if (orderType === "BAIL") {
        updatedFormdata.bailType = { type: newApplicationDetails?.applicationType };
        setValueRef?.current?.[index]?.("bailType", updatedFormdata.bailType);

        updatedFormdata.submissionDocuments = newApplicationDetails?.additionalDetails?.formdata?.submissionDocuments;
        setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);

        updatedFormdata.bailOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
        setValueRef?.current?.[index]?.("bailOf", updatedFormdata.bailOf);
      }

      if (orderType === "SET_BAIL_TERMS") {
        updatedFormdata.partyId = newApplicationDetails?.createdBy;
        setValueRef?.current?.[index]?.("partyId", updatedFormdata.partyId);
      }
      if (orderType === "ACCEPT_BAIL" || orderType === "REJECT_BAIL") {
        updatedFormdata.bailParty = newApplicationDetails?.additionalDetails?.onBehalOfName;
        updatedFormdata.submissionDocuments = {
          uploadedDocs:
            newApplicationDetails?.additionalDetails?.formdata?.supportingDocuments?.flatMap((doc) => doc.submissionDocuments?.uploadedDocs || []) ||
            [],
        };
        setValueRef?.current?.[index]?.("bailParty", updatedFormdata.bailParty);
        setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);
      }

      // if (orderType === "CASE_TRANSFER") {
      //   updatedFormdata.caseTransferredTo = applicationDetails?.applicationDetails?.selectRequestedCourt;
      // setValueRef?.current?.[index]?.("caseTransferredTo", updatedFormdata.caseTransferredTo);
      //   updatedFormdata.grounds = { text: applicationDetails?.applicationDetails?.groundsForSeekingTransfer };
      // setValueRef?.current?.[index]?.("grounds", updatedFormdata.grounds);

      // }

      if (orderType === "WITHDRAWAL") {
        if (newApplicationDetails?.applicationType === applicationTypes.WITHDRAWAL) {
          updatedFormdata.applicationOnBehalfOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
          setValueRef?.current?.[index]?.("applicationOnBehalfOf", updatedFormdata.applicationOnBehalfOf);

          updatedFormdata.partyType = t(newApplicationDetails?.additionalDetails?.partyType);
          setValueRef?.current?.[index]?.("partyType", updatedFormdata.partyType);

          updatedFormdata.reasonForWithdrawal = t(newApplicationDetails?.additionalDetails?.formdata?.reasonForWithdrawal?.code);
          setValueRef?.current?.[index]?.("reasonForWithdrawal", updatedFormdata.reasonForWithdrawal);
        }
      }

      if (orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
        if (newApplicationDetails?.applicationType === applicationTypes.EXTENSION_SUBMISSION_DEADLINE) {
          updatedFormdata.documentName = newApplicationDetails?.additionalDetails?.formdata?.documentType?.value;
          setValueRef?.current?.[index]?.("documentName", updatedFormdata.documentName);

          updatedFormdata.originalDeadline = newApplicationDetails?.additionalDetails?.formdata?.initialSubmissionDate;
          setValueRef?.current?.[index]?.("originalDeadline", updatedFormdata.originalDeadline);

          updatedFormdata.proposedSubmissionDate = newApplicationDetails?.additionalDetails?.formdata?.changedSubmissionDate;
          setValueRef?.current?.[index]?.("proposedSubmissionDate", updatedFormdata.proposedSubmissionDate);

          updatedFormdata.originalSubmissionOrderDate = newApplicationDetails?.additionalDetails?.orderDate;
          setValueRef?.current?.[index]?.("originalSubmissionOrderDate", updatedFormdata.originalSubmissionOrderDate);
        }
      }

      if (orderType === "SUMMONS") {
        const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
          (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
        );
        const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
          (item) =>
            item?.isEnabled && ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(item?.orderType)
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.dateForHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          updatedFormdata.dateForHearing = newCurrentOrder?.additionalDetails?.formdata?.newHearingDate || "";
        } else {
          updatedFormdata.dateForHearing = formatDate(new Date(hearingDetails?.startTime));
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
      if (orderType === "NOTICE") {
        const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
          (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
        );
        const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
          (item) =>
            item?.isEnabled && ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(item?.orderType)
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.dateForHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          updatedFormdata.dateForHearing = newCurrentOrder?.additionalDetails?.formdata?.newHearingDate || "";
        } else {
          updatedFormdata.dateForHearing = formatDate(new Date(hearingDetails?.startTime));
        }
        setValueRef?.current?.[index]?.("dateForHearing", updatedFormdata.dateForHearing);
        const partyUuid = newCurrentOrder?.additionalDetails?.selectedParty?.uuid;
        const selectedChannels = newCurrentOrder?.additionalDetails?.formdata?.noticeOrder?.selectedChannels;

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
              }))?.[0],
            selectedChannels: selectedChannels,
          };
          setValueRef?.current?.[index]?.("noticeOrder", updatedFormdata.noticeOrder);
        }
      }
      if (orderType === "WARRANT") {
        const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
          (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
        );
        const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
          (item) =>
            item?.isEnabled &&
            ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "INITIATING_RESCHEDULING_OF_HEARING_DATE"].includes(item?.orderType)
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.dateOfHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          updatedFormdata.dateOfHearing = newCurrentOrder?.additionalDetails?.formdata?.newHearingDate || "";
        } else {
          updatedFormdata.dateOfHearing = formatDate(new Date(hearingDetails?.startTime));
        }
        setValueRef?.current?.[index]?.("dateOfHearing", updatedFormdata.dateOfHearing);
      }
      if (
        [
          "RESCHEDULE_OF_HEARING_DATE",
          "REJECTION_RESCHEDULE_REQUEST",
          "APPROVAL_RESCHEDULE_REQUEST",
          "INITIATING_RESCHEDULING_OF_HEARING_DATE",
          "CHECKOUT_ACCEPTANCE",
          "CHECKOUT_REJECT",
        ].includes(orderType)
      ) {
        updatedFormdata.originalHearingDate =
          newCurrentOrder?.additionalDetails?.formdata?.originalHearingDate ||
          newApplicationDetails?.additionalDetails?.formdata?.initialHearingDate ||
          "";
        setValueRef?.current?.[index]?.("originalHearingDate", updatedFormdata.originalHearingDate);
      }
      // setCurrentFormData(updatedFormdata); // TODO: check and update setCurrentFormData here and update where ever currentFormData is being used.
      return updatedFormdata;
    },
    [currentOrder, hearingDetails, applicationData, caseDetails]
  );
  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues, index) => {
    // if (Object.keys(formState.errors)?.length) {
    //   for (let key in formState.errors) {
    //     if (!formData?.[key]) {
    //       continue;
    //     } else {
    //       clearErrors(key);
    //     }
    //   }
    // }
    if (currentOrder?.orderCategory === "COMPOSITE") {
      // Validation for order Types check
      if (formData?.orderType?.code) {
        const orderTypeValidationObj = checkOrderValidation(formData?.orderType?.code, index);
        if (orderTypeValidationObj?.showModal) {
          setShowOrderValidationModal(orderTypeValidationObj);
          if (!currentOrder?.compositeItems?.[index]?.orderSchema?.additionalDetails?.formdata?.orderType?.code) {
            setValue("orderType", undefined); // If we are adding new order- set order type to null if validation fails.
            return;
          }
          return;
        }
      }
    }
    applyMultiSelectDropdownFix(setValue, formData, multiSelectDropdownKeys);

    const orderType = currentOrder?.orderCategory === "COMPOSITE" ? currentOrder?.compositeItems?.[index]?.orderType : currentOrder?.orderType;

    if (currentOrder?.orderCategory === "INTERMEDIATE") {
      setOrderTitles((prevTitles) => {
        const newValue = currentOrder?.orderType ? t(currentOrder?.orderType) : t("CS_ORDER");
        if (prevTitles[selectedOrder] === newValue) {
          return prevTitles;
        }
        const updatedTitles = [...prevTitles];
        updatedTitles[selectedOrder] = newValue;
        return updatedTitles;
      });
    }
    if (currentOrder?.orderCategory === "COMPOSITE" && !currentOrder?.orderNumber) {
      const enabledItems = currentOrder?.compositeItems?.filter((compItem) => compItem?.isEnabled) || [];
      if (enabledItems?.length === 1) {
        const enabledCompositeItem = enabledItems?.[0];
        const newTitleValue = t(enabledCompositeItem?.orderType);
        setOrderTitles((prevTitles) => {
          if (prevTitles[selectedOrder] === newTitleValue) {
            return prevTitles;
          } else {
            const updatedTitles = [...prevTitles];
            updatedTitles[selectedOrder] = newTitleValue;
            return updatedTitles;
          }
        });
      }
    }

    // TODO: use refs for setError,  if done - remove this line
    if (orderType && ["MANDATORY_SUBMISSIONS_RESPONSES"].includes(orderType)) {
      if (formData?.submissionDeadline && formData?.responseInfo?.responseDeadline) {
        if (new Date(formData?.submissionDeadline).getTime() >= new Date(formData?.responseInfo?.responseDeadline).getTime()) {
          setValue("responseInfo", {
            ...formData.responseInfo,
            responseDeadline: "",
          });
          setFormErrors?.current?.[index]?.("responseDeadline", { message: t("PROPOSED_DATE_CAN_NOT_BE_BEFORE_SUBMISSION_DEADLINE") });
        } else if (Object.keys(formState?.errors).includes("responseDeadline")) {
          setValue("responseInfo", formData?.responseInfo);
          clearFormErrors?.current?.[index]?.("responseDeadline");
        }
      }
      if (formData?.responseInfo?.isResponseRequired && Object.keys(formState?.errors).includes("isResponseRequired")) {
        clearFormErrors?.current?.[index]?.("isResponseRequired");
      } else if (
        formState?.submitCount &&
        !formData?.responseInfo?.isResponseRequired &&
        !Object.keys(formState?.errors).includes("isResponseRequired")
      ) {
        setFormErrors?.current?.[index]?.("isResponseRequired", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
      if (
        formData?.responseInfo?.responseDeadline &&
        new Date(formData?.submissionDeadline).getTime() < new Date(formData?.responseInfo?.responseDeadline).getTime() &&
        Object.keys(formState?.errors).includes("responseDeadline")
      ) {
        clearFormErrors?.current?.[index]?.("responseDeadline");
      } else if (formData?.responseInfo?.isResponseRequired?.code === false && Object.keys(formState?.errors).includes("responseDeadline")) {
        clearFormErrors?.current?.[index]?.("responseDeadline");
      } else if (
        formState?.submitCount &&
        !formData?.responseInfo?.responseDeadline &&
        formData?.responseInfo?.isResponseRequired?.code === true &&
        !Object.keys(formState?.errors).includes("responseDeadline")
      ) {
        setFormErrors?.current?.[index]?.("responseDeadline", { message: t("PROPOSED_DATE_CAN_NOT_BE_BEFORE_SUBMISSION_DEADLINE") });
      }
      if (formData?.responseInfo?.respondingParty?.length > 0 && Object.keys(formState?.errors).includes("respondingParty")) {
        clearFormErrors?.current?.[index]?.("respondingParty");
      } else if (formData?.responseInfo?.isResponseRequired?.code === false && Object.keys(formState?.errors).includes("respondingParty")) {
        clearFormErrors?.current?.[index]?.("respondingParty");
      } else if (
        formState?.submitCount &&
        (!formData?.responseInfo?.respondingParty || formData?.responseInfo?.respondingParty?.length === 0) &&
        formData?.responseInfo?.isResponseRequired?.code === true &&
        !Object.keys(formState?.errors).includes("respondingParty")
      ) {
        setFormErrors?.current?.[index]?.("respondingParty", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
    }

    if (orderType && ["WARRANT"].includes(orderType)) {
      if (formData?.bailInfo?.isBailable && Object.keys(formState?.errors).includes("isBailable")) {
        clearFormErrors?.current?.[index]?.("isBailable");
      } else if (formState?.submitCount && !formData?.bailInfo?.isBailable && !Object.keys(formState?.errors).includes("isBailable")) {
        setFormErrors?.current?.[index]?.("isBailable", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
      if (formData?.bailInfo?.noOfSureties && Object.keys(formState?.errors).includes("noOfSureties")) {
        clearFormErrors?.current?.[index]?.("noOfSureties");
      } else if (formData?.bailInfo?.isBailable?.code === false && Object.keys(formState?.errors).includes("noOfSureties")) {
        clearFormErrors?.current?.[index]?.("noOfSureties");
      } else if (
        formState?.submitCount &&
        !formData?.bailInfo?.noOfSureties &&
        formData?.bailInfo?.isBailable?.code === true &&
        !Object.keys(formState?.errors).includes("noOfSureties")
      ) {
        setFormErrors?.current?.[index]?.("noOfSureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
      if (
        formData?.bailInfo?.bailableAmount &&
        formData?.bailInfo?.bailableAmount?.slice(-1) !== "." &&
        Object.keys(formState?.errors).includes("bailableAmount")
      ) {
        clearFormErrors?.current?.[index]?.("bailableAmount");
      } else if (formData?.bailInfo?.isBailable?.code === false && Object.keys(formState?.errors).includes("bailableAmount")) {
        clearFormErrors?.current?.[index]?.("bailableAmount");
      } else if (
        formState?.submitCount &&
        formData?.bailInfo?.isBailable?.code === true &&
        formData?.bailInfo?.bailableAmount?.slice(-1) === "." &&
        !Object.keys(formState?.errors).includes("bailableAmount")
      ) {
        setFormErrors?.current?.[index]?.("bailableAmount", { message: t("CS_VALID_AMOUNT_DECIMAL") });
      } else if (
        formState?.submitCount &&
        !formData?.bailInfo?.bailableAmount &&
        formData?.bailInfo?.isBailable?.code === true &&
        !Object.keys(formState?.errors).includes("bailableAmount")
      ) {
        setFormErrors?.current?.[index]?.("bailableAmount", { message: t("CS_VALID_AMOUNT_DECIMAL") });
      }
    }

    if (
      formData?.orderType?.code &&
      !isEqual(
        formData,
        currentOrder?.orderCategory !== "COMPOSITE"
          ? formList?.[selectedOrder]?.additionalDetails?.formdata
          : formList?.[selectedOrder]?.compositeItems?.[index]?.orderSchema?.additionalDetails?.formdata
      )
    ) {
      const updatedFormData =
        currentOrder?.orderCategory === "COMPOSITE"
          ? currentOrder?.compositeItems?.[index]?.orderSchema?.additionalDetails?.formdata?.orderType?.code !== formData?.orderType?.code
            ? { orderType: formData.orderType }
            : formData
          : currentOrder?.additionalDetails?.formdata?.orderType?.code !== formData?.orderType?.code
          ? { orderType: formData.orderType }
          : formData;

      setFormList((prev) => {
        return prev?.map((item, i) => {
          if (i !== selectedOrder) return item;
          let updatedCompositeItems = item?.compositeItems?.map((compItem, compIndex) => {
            if (compIndex === index) {
              return {
                ...compItem,
                orderType: formData?.orderType?.code,
                orderSchema: {
                  ...(compItem?.orderSchema || {}),
                  additionalDetails: {
                    ...(compItem?.orderSchema?.additionalDetails || {}),
                    formdata: updatedFormData,
                  },
                },
              };
            }
            return compItem;
          });

          return {
            ...item,
            comments:
              formData?.comments?.text ||
              formData?.additionalComments?.text ||
              formData?.otherDetails?.text ||
              formData?.sentence?.text ||
              formData?.briefSummary ||
              "",
            orderTitle: item?.orderCategory !== "COMPOSITE" ? formData?.orderType?.code : item?.orderTitle,
            orderCategory: item?.orderCategory,
            orderType: item?.orderCategory !== "COMPOSITE" ? formData?.orderType?.code : null,
            compositeItems: item?.orderCategory !== "COMPOSITE" ? null : updatedCompositeItems,
            additionalDetails: item?.orderCategory !== "COMPOSITE" ? { ...item?.additionalDetails, formdata: updatedFormData } : null,
            orderDetailsDetails: item?.orderCategory !== "COMPOSITE" ? item?.orderDetailsDetails : null,
          };
        });
      });

      // setCurrentFormData(formData); // TODO: check and update setCurrentFormData here and update where ever currentFormData is being used.
    }

    setFormErrors.current[index] = setError;
    clearFormErrors.current[index] = clearErrors;
    setValueRef.current[index] = setValue;
    formStateRef.current[index] = formState;

    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }
  };

  const getParties = (type, orderSchema) => {
    let parties = [];
    if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(type)) {
      parties = orderSchema?.orderDetails.partyName;
    } else if (type === "MANDATORY_SUBMISSIONS_RESPONSES") {
      parties = [...orderSchema?.orderDetails?.partyDetails?.partiesToRespond, ...orderSchema?.orderDetails?.partyDetails?.partyToMakeSubmission];
    } else if (["WARRANT", "SUMMONS", "NOTICE"].includes(type)) {
      parties = orderSchema?.orderDetails?.respondentName ? [orderSchema?.orderDetails?.respondentName] : [];
    } else if (type === "SECTION_202_CRPC") {
      parties = [orderSchema?.orderDetails?.applicationFilledBy, orderSchema?.orderDetails.soughtOfDetails];
    } else if (
      orderSchema?.orderDetails?.parties?.length > 0 &&
      ["BAIL", "REJECT_VOLUNTARY_SUBMISSIONS", "APPROVE_VOLUNTARY_SUBMISSIONS", "REJECTION_RESCHEDULE_REQUEST", "CHECKOUT_REJECT"].includes(type)
    ) {
      parties = orderSchema?.orderDetails?.parties?.map((party) => party?.partyName);
    } else {
      parties = allParties?.map((party) => ({ partyName: party.name, partyType: party?.partyType }));
      return parties;
    }
    parties = parties?.map((party) => {
      const matchingParty = allParties.find((p) => p.code === party);
      if (matchingParty) {
        return {
          partyName: matchingParty.name,
          partyType: matchingParty.partyType,
        };
      } else {
        return {
          partyName: party,
          partyType: "witness",
        };
      }
    });
    return parties;
  };

  const getPartyNamesString = (parties) => {
    if (!Array.isArray(parties) || parties.length === 0) {
      return "";
    }
    return parties.map((party) => party.partyName).join(", ");
  };

  const defaultBOTD = useMemo(() => {
    if (!currentOrder?.orderType) return "";

    switch (currentOrder.orderType) {
      case "SECTION_202_CRPC":
        return "Order Under Section 202 CrPC";
      case "MANDATORY_SUBMISSIONS_RESPONSES":
        return (
          `${currentOrder?.orderDetails?.partyDetails?.partyToMakeSubmission?.join(", ")} to produce ${
            currentOrder?.orderDetails?.documentType?.value
          } before court by ${formatDate(new Date(currentOrder?.orderDetails?.dates?.submissionDeadlineDate), "DD-MM-YYYY")}.` +
          (currentOrder?.orderDetails?.isResponseRequired?.code
            ? ` Objections to be received by ${formatDate(new Date(currentOrder?.orderDetails?.dates?.responseDeadlineDate), "DD-MM-YYYY")}.`
            : "")
        );
      case "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE":
        return currentOrder?.orderDetails?.applicationStatus === "APPROVED"
          ? `Extension of the deadline granted to ${getPartyNamesString(currentOrder?.orderDetails?.parties)} for ${
              currentOrder?.orderDetails?.documentName
            } to the court. Submission to be made by ${formatDate(new Date(currentOrder?.orderDetails?.newSubmissionDate), "DD-MM-YYYY")}`
          : `The application to extend the submission deadline against ${currentOrder?.orderDetails?.documentName} ${caseDetails?.cmpNumber} has been rejected`;
      case "REFERRAL_CASE_TO_ADR":
        return "Case referred to Alternative Dispute Resolution to seek settlement";
      case "SCHEDULE_OF_HEARING_DATE":
        return `For ${t(currentOrder?.orderDetails?.purposeOfHearing)} on ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.hearingDate),
          "DD-MM-YYYY"
        )}`;
      case "SCHEDULING_NEXT_HEARING":
        return `For ${t(currentOrder?.orderDetails?.purposeOfHearing)} on ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.hearingDate),
          "DD-MM-YYYY"
        )}`;
      case "RESCHEDULE_OF_HEARING_DATE":
        return `Hearing for ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          "DD-MM-YYYY"
        )} rescheduled on petition. Hearing Date to be announced on ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          "DD-MM-YYYY"
        )}`;
      case "CHECKOUT_ACCEPTANCE":
        return "Order for Approval of Check out (Emergency Reschedule) request";
      case "CHECKOUT_REJECT":
        return "Order for Rejection of Check out (Emergency Reschedule) request";
      case "REJECTION_RESCHEDULE_REQUEST":
        return `Request for rescheduling of hearing on ${formatDate(
          new Date(currentOrder?.orderDetails?.originalHearingDate),
          "DD-MM-YYYY"
        )} raised by ${applicationDetails?.additionalDetails?.owner} dismissed`;
      case "INITIATING_RESCHEDULING_OF_HEARING_DATE":
        return "Initiated the process for rescheduling the hearing";
      case "ASSIGNING_DATE_RESCHEDULED_HEARING":
        return `Hearing for ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          "DD-MM-YYYY"
        )} rescheduled on petition. Hearing Date to be announced on ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          "DD-MM-YYYY"
        )}`;
      case "ASSIGNING_NEW_HEARING_DATE":
        return `For ${t(currentOrder?.orderDetails?.purposeOfHearing)} on ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.hearingDate),
          "DD-MM-YYYY"
        )}`;
      case "CASE_TRANSFER":
        return "The case is transferred to another court for further proceedings";
      case "SETTLEMENT":
        return currentOrder?.orderDetails?.applicationStatus === "APPROVED"
          ? "The settlement records have been accepted by the court. Case closed."
          : "The settlement records have been dismissed by the court";
      case "SUMMONS":
        return `Issue Summons to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "NOTICE":
        return `Issue Notice to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "BAIL":
        return "Bail";
      case "WARRANT":
        return `Issue ${t(currentOrder?.orderDetails?.warrantType)} to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "WITHDRAWAL":
        return currentOrder?.orderDetails?.applicationStatus === "APPROVED"
          ? "The application to withdraw the case has been accepted. Case closed"
          : `The application to withdraw the case raised by ${applicationDetails?.additionalDetails?.owner} has been rejected`;
      case "OTHERS":
        return "Others";
      case "APPROVE_VOLUNTARY_SUBMISSIONS":
        return `CMP: ${t(applicationDetails?.applicationType)} ${applicationDetails?.applicationNumber} stands allowed`;
      case "REJECT_VOLUNTARY_SUBMISSIONS":
        return `CMP: ${t(applicationDetails?.applicationType)} ${applicationDetails?.applicationNumber} stands dismissed`;
      case "JUDGEMENT":
        return currentOrder?.additionalDetails?.formdata?.plea?.code === "GUILTY"
          ? `The accused is convicted u/s 278(2) BNSS`
          : `The accused is acquitted u/s 278(1) BNSS`;
      case "REJECT_BAIL":
        return "Bail Rejected";
      case "ACCEPT_BAIL":
        return "Bail Granted";
      case "SET_BAIL_TERMS":
        return "Condition of Bail";
      case "ACCEPTANCE_REJECTION_DCA":
        return `CMP: ${t(applicationDetails?.applicationType)} ${applicationDetails?.applicationNumber} stands ${
          currentOrder?.orderDetails?.isDcaAcceptedOrRejected === "ACCEPTED" ? "allowed" : "dismissed"
        }`;
      case "ADMIT_CASE":
        return `Cognizance of the offence taken on file as ${caseDetails?.cmpNumber} under Section 138 of the Negotiable Instruments Act`;
      case "DISMISS_CASE":
        return `Case has been dismissed`;
      default:
        return "";
    }
  }, [t, applicationDetails, caseDetails, currentOrder]);

  useEffect(() => {
    setBusinessOfTheDay(defaultBOTD);
  }, [defaultBOTD]);

  const getUpdateDocuments = (documents, documentsFile) => {
    if (!documentsFile) return documents;

    if (documentsFile?.documentType === "UNSIGNED") {
      const existingUnsignedDoc = documents?.find((doc) => doc?.documentType === "UNSIGNED");

      if (existingUnsignedDoc) {
        return documents?.map((doc) =>
          doc?.documentType === "UNSIGNED"
            ? {
                ...doc,
                fileStore: documentsFile?.fileStore,
                additionalDetails: documentsFile?.additionalDetails,
              }
            : doc
        );
      }
    }
    return [...documents, documentsFile];
  };

  const updateOrder = async (order, action, unsignedFileStoreId) => {
    try {
      const localStorageID = localStorage.getItem("fileStoreId");
      const documents = Array.isArray(order?.documents) ? order.documents : [];
      let taskDetails = null;
      const newCompositeItems = [];
      if (unsignedFileStoreId) {
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
            if (["NOTICE", "SUMMONS", "WARRANT"]?.includes(item?.order?.orderType)) {
              const payloads = await createTaskPayload(item?.order?.orderType, item);
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
        } else if (["NOTICE", "SUMMONS", "WARRANT"]?.includes(order?.orderType)) {
          const payloads = await createTaskPayload(order?.orderType, { order });
          taskDetails = JSON.stringify(payloads);
        }
      }

      const documentsFile =
        signedDoucumentUploadedID !== "" || localStorageID
          ? {
              documentType: "SIGNED",
              fileStore: signedDoucumentUploadedID || localStorageID,
              documentOrder: documents?.length > 0 ? documents.length + 1 : 1,
              additionalDetails: { name: `Order: ${order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(order?.orderType)}.pdf` },
            }
          : unsignedFileStoreId
          ? {
              documentType: "UNSIGNED",
              fileStore: unsignedFileStoreId,
              documentOrder: documents?.length > 0 ? documents.length + 1 : 1,
              additionalDetails: { name: `Order: ${order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(order?.orderType)}.pdf` },
            }
          : null;

      const updatedDocuments = getUpdateDocuments(documents, documentsFile);
      let orderSchema = {};
      try {
        let orderTypeDropDownConfig = order?.orderNumber
          ? applicationTypeConfig?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfig);
        let orderFormConfig = configKeys.hasOwnProperty(order?.orderType) ? configKeys[order?.orderType] : [];
        const modifiedPlainFormConfig = [...orderTypeDropDownConfig, ...orderFormConfig];
        orderSchema = Digit.Customizations.dristiOrders.OrderFormSchemaUtils.formToSchema(order.additionalDetails.formdata, modifiedPlainFormConfig);
      } catch (error) {
        console.error("error :>> ", error);
      }

      const parties = getParties(order?.orderType, {
        ...orderSchema,
        orderDetails: { ...(order?.orderDetails || {}), ...orderSchema?.orderDetails },
      });
      orderSchema = { ...orderSchema, orderDetails: { ...orderSchema?.orderDetails, parties: parties } };
      return await ordersService.updateOrder(
        {
          order: {
            ...order,
            ...orderSchema,
            ...(unsignedFileStoreId && order?.orderCategory === "COMPOSITE" && { compositeItems: newCompositeItems }),
            ...(unsignedFileStoreId &&
              order?.orderCategory === "INTERMEDIATE" && {
                additionalDetails: {
                  ...order?.additionalDetails,
                  ...(taskDetails && { taskDetails }),
                },
              }),
            documents: updatedDocuments,
            workflow: { ...order.workflow, action, documents: [{}] },
          },
        },
        { tenantId }
      );
    } catch (error) {
      return null;
    }
  };

  const addOrderItem = async (order, action, index) => {
    try {
      const compositeItems = [];
      order?.compositeItems?.forEach((item, index) => {
        let orderSchema = {};
        try {
          let orderTypeDropDownConfig = item?.id
            ? applicationTypeConfig?.map((obj) => ({ body: obj.body.map((input) => ({ ...input, disable: true })) }))
            : structuredClone(applicationTypeConfig);
          let orderFormConfig = configKeys.hasOwnProperty(item?.orderSchema?.additionalDetails?.formdata?.orderType?.code)
            ? configKeys[item?.orderSchema?.additionalDetails?.formdata?.orderType?.code]
            : [];
          const modifiedPlainFormConfig = [...orderTypeDropDownConfig, ...orderFormConfig];
          orderSchema = Digit.Customizations.dristiOrders.OrderFormSchemaUtils.formToSchema(
            item?.orderSchema?.additionalDetails?.formdata,
            modifiedPlainFormConfig
          );
        } catch (error) {
          console.error("error :>> ", error);
        }
        const parties = getParties(item?.orderSchema?.additionalDetails?.formdata?.orderType?.code, {
          ...orderSchema,
          orderDetails: { ...orderSchema?.orderDetails },
        });
        const orderSchemaUpdated = {
          ...orderSchema,
          orderDetails: { ...orderSchema?.orderDetails, parties: parties },
          additionalDetails: item?.orderSchema?.additionalDetails,
          ...(orderSchema?.orderDetails?.refApplicationId && {
            applicationNumber: [orderSchema.orderDetails.refApplicationId],
          }),
        };
        compositeItems.push({
          ...(item?.id ? { id: item.id } : {}),
          orderType: item?.orderSchema?.additionalDetails?.formdata?.orderType?.code,
          orderSchema: orderSchemaUpdated,
        });
      });
      return await ordersService.addOrderItem(
        {
          order: {
            ...order,
            additionalDetails: null,
            orderDetails: null,
            orderType: null,
            orderCategory: "COMPOSITE",
            // orderTitle: currentOrderTitle,
            orderTitle: OrderTitles[index],
            compositeItems,
            workflow: { ...order.workflow, action, documents: [{}] },
          },
        },
        { tenantId }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const deleteOrderItem = async (order, itemID) => {
    try {
      return await ordersService.removeOrderItem(
        {
          order: {
            tenantId: order?.tenantId,
            itemID: itemID,
            orderNumber: order?.orderNumber,
          },
        },
        { tenantId }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const createOrder = async (order) => {
    try {
      let orderSchema = {};
      try {
        let orderTypeDropDownConfig = order?.orderNumber
          ? applicationTypeConfig?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfig);
        let orderFormConfig = configKeys.hasOwnProperty(order?.orderType) ? configKeys[order?.orderType] : [];
        const modifiedPlainFormConfig = [...orderTypeDropDownConfig, ...orderFormConfig];
        orderSchema = Digit.Customizations.dristiOrders.OrderFormSchemaUtils.formToSchema(order.additionalDetails.formdata, modifiedPlainFormConfig);
      } catch (error) {
        console.error("error :>> ", error);
      }
      const parties = getParties(order?.orderType, {
        ...orderSchema,
        orderDetails: { ...orderSchema?.orderDetails, ...(order?.orderDetails || {}) },
      });
      orderSchema = { ...orderSchema, orderDetails: { ...orderSchema?.orderDetails, parties: parties } };

      return await ordersService.createOrder(
        {
          order: {
            ...order,
            ...orderSchema,
          },
        },
        { tenantId }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddOrder = () => {
    setFormList((prev) => {
      return [...prev, defaultOrderData];
    });
    setSelectedOrder(formList?.length);
    setOrderTitles([...OrderTitles, t("CS_ORDER")]);
  };

  const createPendingTask = async ({
    order,
    refId = null,
    orderEntityType = null,
    isAssignedRole = false,
    createTask = false,
    taskStatus = "CREATE_SUBMISSION",
    taskName = "",
    channelCode = "",
    orderType = "",
    compositeOrderItemId,
    newApplicationDetails,
  }) => {
    const formdata = order?.additionalDetails?.formdata;
    let create = createTask;
    let name = taskName;
    let assignees = [];
    let referenceId = order?.orderNumber;
    let assignedRole = [];
    let additionalDetails = {};
    let entityType = orderEntityType
      ? orderEntityType
      : formdata?.isResponseRequired?.code === "Yes"
      ? "application-order-submission-feedback"
      : "application-order-submission-default";
    let status = taskStatus;
    let stateSla = stateSlaMap?.[order?.orderType] * dayInMillisecond + todayDate;
    if (order?.orderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
      create = true;
      name = t("MAKE_MANDATORY_SUBMISSION");
      assignees = formdata?.submissionParty
        ?.map((party) =>
          party?.uuid.map((uuid) => {
            return { assigneeInfo: { uuid, individualId: party?.individualId }, partyUuid: party?.partyUuid };
          })
        )
        .flat();
      stateSla = new Date(formdata?.submissionDeadline).getTime();
      status = "CREATE_SUBMISSION";
      const promises = assignees.map(async (assignee) => {
        return ordersService.customApiService(Urls.orders.pendingTask, {
          pendingTask: {
            name,
            entityType,
            referenceId: `MANUAL_${compositeOrderItemId ? `${compositeOrderItemId}_` : ""}${assignee?.assigneeInfo?.individualId}_${
              assignee?.assigneeInfo?.uuid
            }_${order?.orderNumber}`,
            status,
            assignedTo: [assignee?.assigneeInfo],
            assignedRole,
            cnrNumber: cnrNumber,
            filingNumber: filingNumber,
            isCompleted: false,
            stateSla,
            additionalDetails: { ...additionalDetails, litigants: [assignee?.assigneeInfo?.individualId], litigantUuid: [assignee?.partyUuid] },
            tenantId,
          },
        });
      });
      return await Promise.all(promises);
    }
    if (order?.orderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
      stateSla = new Date(formdata?.newSubmissionDate).getTime();
      const promises = mandatorySubmissionTasks?.map(async (task) => {
        return ordersService.customApiService(Urls.orders.pendingTask, {
          pendingTask: { ...task, stateSla, tenantId },
        });
      });
      return await Promise.all(promises);
    }
    if (order?.orderType === "INITIATING_RESCHEDULING_OF_HEARING_DATE") {
      create = true;
      status = "OPTOUT";
      assignees = [
        ...new Map(
          Object.values(allAdvocates)
            ?.flat()
            ?.map((uuid) => [uuid, { uuid }])
        ).values(),
      ];
      name = t("CHOOSE_DATES_FOR_RESCHEDULE_OF_HEARING_DATE");
      entityType = "hearing-default";
      const promises = assignees.map(async (assignee) => {
        return ordersService.customApiService(Urls.orders.pendingTask, {
          pendingTask: {
            name,
            entityType,
            referenceId: `MANUAL_${compositeOrderItemId ? `${compositeOrderItemId}_` : ""}${assignee?.uuid}_${order?.orderNumber}`,
            status,
            assignedTo: [assignee],
            assignedRole,
            cnrNumber: cnrNumber,
            filingNumber: filingNumber,
            isCompleted: false,
            stateSla,
            additionalDetails: {
              ...additionalDetails,
              litigants: caseDetails?.representatives
                ?.find((representative) => representative?.additionalDetails?.uuid === assignee?.uuid)
                ?.representing?.map((representing) => representing?.individualId),
            },
            tenantId,
          },
        });
      });
      return await Promise.all(promises);
    }
    if ((order?.orderType === "SUMMONS" || orderType === "SUMMONS") && refId) {
      const assignee = [...complainants?.map((data) => data?.uuid)]?.flat();
      // const advocateUuid = Object.keys(allAdvocates)
      //   .filter((data) => assignee?.includes(allAdvocates?.[data]?.[0]))
      //   ?.flat();
      const complainantUuids = caseDetails?.litigants
        ?.filter((com) => com?.partyType?.startsWith("complainant"))
        .map((com) => com?.additionalDetails?.uuid);
      assignees = [...assignee, ...complainantUuids]?.map((uuid) => ({ uuid }));
      entityType = "order-default";
      return ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask: {
          name: t(`MAKE_PAYMENT_FOR_SUMMONS_${channelCode}`),
          entityType,
          referenceId: `MANUAL_${refId}`,
          status: `PAYMENT_PENDING_${channelCode}`,
          assignedTo: assignees,
          assignedRole,
          cnrNumber: cnrNumber,
          filingNumber: filingNumber,
          isCompleted: false,
          stateSla: stateSlaMap?.[order?.orderType || orderType] * dayInMillisecond + todayDate,
          additionalDetails: {
            ...additionalDetails,
            applicationNumber: order?.additionalDetails?.formdata?.refApplicationId,
            litigants: [...complainants?.map((data) => data?.individualId)],
          },
          tenantId,
        },
      });
    }
    if ((order?.orderType === "NOTICE" || orderType === "NOTICE") && refId) {
      const assignee = [...complainants?.map((data) => data?.uuid)]?.flat();
      // const advocateUuid = Object.keys(allAdvocates)
      //   .filter((data) => assignee?.includes(allAdvocates?.[data]?.[0]))
      //   ?.flat();
      const complainantUuids = caseDetails?.litigants
        ?.filter((com) => com?.partyType?.startsWith("complainant"))
        .map((com) => com?.additionalDetails?.uuid);
      assignees = [...assignee, ...complainantUuids]?.map((uuid) => ({ uuid }));
      entityType = "order-default";
      const pendingTask = {
        name: t(`MAKE_PAYMENT_FOR_NOTICE_${channelCode}`),
        entityType,
        referenceId: `MANUAL_${refId}`,
        status: `PAYMENT_PENDING_${channelCode}`,
        assignedTo: assignees,
        assignedRole,
        cnrNumber: cnrNumber,
        filingNumber: filingNumber,
        isCompleted: false,
        stateSla: stateSlaMap?.[order?.orderType || orderType] * dayInMillisecond + todayDate,
        additionalDetails: {
          ...additionalDetails,
          applicationNumber: order?.additionalDetails?.formdata?.refApplicationId,
          litigants: [...complainants?.map((data) => data?.individualId)],
        },
        tenantId,
      };

      return ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask,
      });
    }
    if ((order?.orderType === "WARRANT" || orderType === "WARRANT") && refId) {
      const assignee = [...complainants?.map((data) => data?.uuid)]?.flat();
      // const advocateUuid = Object.keys(allAdvocates)
      //   .filter((data) => assignee?.includes(allAdvocates?.[data]?.[0]))
      //   ?.flat();
      const complainantUuids = caseDetails?.litigants
        ?.filter((com) => com?.partyType?.startsWith("complainant"))
        .map((com) => com?.additionalDetails?.uuid);
      assignees = [...assignee, ...complainantUuids]?.map((uuid) => ({ uuid }));
      entityType = "order-default";
      return ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask: {
          name: t(`PAYMENT_PENDING_FOR_WARRANT`),
          entityType,
          referenceId: `MANUAL_${refId}`,
          status: `PAYMENT_PENDING_POLICE`,
          assignedTo: assignees,
          assignedRole,
          cnrNumber: cnrNumber,
          filingNumber: filingNumber,
          isCompleted: false,
          stateSla: stateSlaMap?.[order?.orderType || orderType] * dayInMillisecond + todayDate,
          additionalDetails: {
            ...additionalDetails,
            applicationNumber: order?.additionalDetails?.formdata?.refApplicationId,
            litigants: [...complainants?.map((data) => data?.individualId)],
          },
          tenantId,
        },
      });
    }

    // need to check
    if (order?.orderType === "SET_BAIL_TERMS") {
      create = true;
      status = "CREATE_SUBMISSION";
      name = t("SUBMIT_BAIL_DOCUMENTS");
      entityType = "voluntary-application-submission-bail-documents";
      const assigneeUuid = order?.additionalDetails?.formdata?.partyId;
      return ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask: {
          name,
          entityType,
          referenceId: `MANUAL_${compositeOrderItemId ? `${compositeOrderItemId}_` : ""}${assigneeUuid}_${order?.orderNumber}`,
          status,
          assignedTo: [{ uuid: assigneeUuid }],
          assignedRole,
          cnrNumber: cnrNumber,
          filingNumber: filingNumber,
          isCompleted: false,
          stateSla,
          additionalDetails: {
            ...additionalDetails,
            litigants: [
              caseDetails?.litigants?.find(
                (litigant) => litigant?.additionalDetails?.uuid === newApplicationDetails?.additionalDetails?.formdata?.selectComplainant?.uuid
              )?.individualId,
            ],
            litigantUuid: [
              caseDetails?.litigants?.find(
                (litigant) => litigant?.additionalDetails?.uuid === newApplicationDetails?.additionalDetails?.formdata?.selectComplainant?.uuid
              )?.additionalDetails?.uuid,
            ],
          },
          tenantId,
        },
      });
    }

    if (isAssignedRole) {
      assignees = [];
      assignedRole = ["JUDGE_ROLE"];
      if (order?.orderType === "SCHEDULE_OF_HEARING_DATE" && refId && isCaseAdmitted) {
        referenceId = refId;
        create = true;
        status = "CREATE_SUMMONS_ORDER";
        name = t("CREATE_ORDERS_FOR_SUMMONS");
        entityType = "order-default";
        additionalDetails = { ...additionalDetails, orderType: "SUMMONS", hearingID: order?.hearingNumber };
      }

      if (order?.orderType === "SCHEDULE_OF_HEARING_DATE" && refId && !isCaseAdmitted) {
        referenceId = refId;
        create = true;
        status = "CREATE_NOTICE_ORDER";
        name = t("CREATE_ORDERS_FOR_NOTICE");
        entityType = "order-default";
        additionalDetails = { ...additionalDetails, orderType: "NOTICE", hearingID: order?.hearingNumber };
      }
    }

    create &&
      (await ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask: {
          name,
          entityType,
          referenceId: `MANUAL_${referenceId}`,
          status,
          assignedTo: assignees,
          assignedRole,
          cnrNumber: cnrNumber,
          filingNumber: filingNumber,
          isCompleted: false,
          stateSla: stateSlaMap?.[order?.orderType] * dayInMillisecond + todayDate,
          additionalDetails: additionalDetails,
          tenantId,
        },
      }));
    return;
  };

  const closeManualPendingTask = async (refId) => {
    try {
      await ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask: {
          name: "Completed",
          entityType: "order-default",
          referenceId: `MANUAL_${refId}`,
          status: "DRAFT_IN_PROGRESS",
          assignedTo: [],
          assignedRole: [],
          cnrNumber: cnrNumber,
          filingNumber: filingNumber,
          isCompleted: true,
          stateSla: null,
          additionalDetails: {},
          tenantId,
        },
      });
    } catch (error) {}
  };

  const handleSaveDraft = async ({ showReviewModal }) => {
    if (showReviewModal) {
      setLoader(true);
    }
    let count = 0;
    const promises = formList.map(async (order, index) => {
      // check for Composite order
      if (order?.orderCategory === "INTERMEDIATE") {
        if (order?.orderType) {
          count += 1;
          if (order?.orderNumber) {
            const updatedOrder = structuredClone(order);
            updatedOrder.orderTitle = t(order?.orderTitle);
            return await updateOrder(updatedOrder, OrderWorkflowAction.SAVE_DRAFT);
          } else {
            const updatedOrder = structuredClone(order);
            updatedOrder.orderTitle = t(order?.orderTitle);
            return await createOrder(updatedOrder);
          }
        } else {
          return Promise.resolve();
        }
      }
      // IF order Type is composite
      else {
        if (order?.orderNumber) {
          count += 1;
          const updatedOrder = {
            ...order,
            compositeItems: order?.compositeItems?.filter((item) => item?.isEnabled),
          };
          return await addOrderItem(updatedOrder, OrderWorkflowAction.SAVE_DRAFT, index);
        } else {
          // create call first, get order number from response
          // then add item call
          count += 1;
          try {
            const totalEnabled = order?.compositeItems?.filter((compItem) => compItem?.isEnabled && compItem?.orderType)?.length;
            // if totalEnabled is 1 -> treat it as composite only and call create api only
            if (totalEnabled === 1) {
              const updatedOrder = structuredClone(order);
              const compositeItem = order?.compositeItems?.find((item) => item?.isEnabled && item?.orderType);
              updatedOrder.additionalDetails = compositeItem?.orderSchema?.additionalDetails;
              updatedOrder.compositeItems = null;
              updatedOrder.orderType = t(compositeItem?.orderType);
              updatedOrder.orderCategory = "INTERMEDIATE";
              updatedOrder.orderTitle = t(compositeItem?.orderType); // If total enabled composite items is 1-> send orderTitle as orderType.
              return await createOrder(updatedOrder);
            }
            // if totalEnabled is greater than 1 -> call create api for 1st isEnabled item and get orderNUmber from create reponse and call add item api.
            else {
              const updatedOrder = structuredClone(order);
              const firstCompositeItem = order?.compositeItems?.find((item) => item?.isEnabled);
              updatedOrder.additionalDetails = firstCompositeItem?.orderSchema?.additionalDetails;
              updatedOrder.compositeItems = null;
              updatedOrder.orderType = firstCompositeItem?.orderType;
              updatedOrder.orderCategory = "INTERMEDIATE";

              const response = await createOrder(updatedOrder);

              if (response?.order?.orderNumber) {
                const orderForAddItem = structuredClone(response?.order);
                // Send only isEnabled composite items from current order;
                const enabledCompositeItems = order?.compositeItems?.filter((item) => item?.isEnabled);
                orderForAddItem.additionalDetails = null;
                orderForAddItem.orderType = null;
                orderForAddItem.orderDetails = null;
                orderForAddItem.orderCategory = "COMPOSITE";
                orderForAddItem.compositeItems = enabledCompositeItems;
                // orderForAddItem.orderTitle = currentOrderTitle;
                orderForAddItem.orderTitle = t(OrderTitles[index]);
                return await addOrderItem(orderForAddItem, OrderWorkflowAction.SAVE_DRAFT, index);
              } else {
                console.error("Error: Order creation failed, orderNumber missing.");
                return Promise.reject(new Error("Order creation failed"));
              }
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    });

    try {
      await Promise.all(promises);
      if (showReviewModal) {
        setLoader(false);
      }

      // Callling this explicitely because new formdata is not rerendering after one refetch
      // (specially in case if some api call is failing) - Formcomposer implementation issue
      //######### DO NOT REMOVE BELOW DOUBLE REFETCH  #########
      await refetchOrdersData();
      await refetchOrdersData();

      // Update the form list
      // setFormList(responsesList.map((res) => res?.order));

      if (!showReviewModal) {
        setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
      }

      if (selectedOrder >= count) {
        setSelectedOrder(0);
      }

      if (showReviewModal) {
        setShowReviewModal(true);
      }
    } catch (error) {
      console.error("Error while saving draft:", error);
      setShowErrorToast({ label: t("ERROR_SAVING_DRAFT"), error: true });
    }
  };

  const applicationStatusType = (Type) => {
    switch (Type) {
      case "APPROVED":
        return SubmissionWorkflowAction.APPROVE;
      case "SET_TERM_BAIL":
        return SubmissionWorkflowAction.SET_TERM_BAIL;
      default:
        return SubmissionWorkflowAction.REJECT;
    }
  };

  const handleApplicationAction = async (order, applicationDetails) => {
    try {
      return await ordersService.customApiService(
        `/application/v1/update`,
        {
          application: {
            ...applicationDetails,
            cmpNumber: caseDetails?.cmpNumber,
            workflow: {
              ...applicationDetails.workflow,
              action: applicationStatusType(order?.additionalDetails?.applicationStatus),
            },
          },
        },
        { tenantId }
      );
    } catch (error) {
      return false;
    }
  };

  const { revalidate: revalidateWorkflow = () => {} } = window?.Digit.Hooks.useWorkflowDetails({
    tenantId,
    id: caseDetails?.filingNumber,
    moduleCode: "case-default",
    config: {
      cacheTime: 0,
      enabled: Boolean(caseDetails?.filingNumber && tenantId),
    },
  });

  const handleUpdateHearing = async ({ startTime, endTime, action }) => {
    await ordersService.updateHearings(
      {
        hearing: {
          ...hearingDetails,
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
          documents: hearingDetails?.documents || [],
          workflow: {
            action: action,
            assignes: [],
            comments: "Update Hearing",
            documents: [{}],
          },
        },
      },
      { tenantId }
    );
  };
  const judgeId = window?.globalConfigs?.getConfig("JUDGE_ID") || "JUDGE_ID";

  const handleRescheduleHearing = async ({ hearingType, hearingBookingId, rescheduledRequestId, comments, requesterId, date }) => {
    await schedulerService.RescheduleHearing(
      {
        RescheduledRequest: [
          {
            rescheduledRequestId: rescheduledRequestId,
            hearingBookingId: hearingBookingId,
            tenantId: tenantId,
            judgeId: judgeId,
            caseId: filingNumber,
            hearingType: "ADMISSION",
            requesterId: requesterId,
            reason: comments,
            availableAfter: date,
            rowVersion: 1,
            suggestedDates: null,
            availableDates: null,
            scheduleDate: null,
          },
        ],
      },
      {}
    );
  };

  const getFormData = (orderType, order) => {
    const formDataKeyMap = {
      SUMMONS: "SummonsOrder",
      WARRANT: "warrantFor",
      NOTICE: "noticeOrder",
    };
    const formDataKey = formDataKeyMap[orderType];
    return order?.additionalDetails?.formdata?.[formDataKey];
  };

  const getOrderData = (orderType, orderFormData) => {
    return ["SUMMONS", "NOTICE"].includes(orderType) ? orderFormData?.party?.data : orderFormData;
  };

  const getCourtFee = async (channelId, receiverPincode, taskType) => {
    try {
      const breakupResponse = await DRISTIService.getSummonsPaymentBreakup(
        {
          Criteria: [
            {
              channelId: channelId,
              receiverPincode: receiverPincode,
              tenantId: tenantId,
              taskType: taskType,
            },
          ],
        },
        {}
      );
      return breakupResponse?.Calculation?.[0]?.breakDown?.filter((data) => data?.type === "Court Fee").reduce((sum, fee) => (sum += fee.amount), 0);
    } catch (error) {
      console.error("error", error);
      return 0;
    }
  };

  const createTaskPayload = async (orderType, orderDetails) => {
    let payload = {};
    const { litigants } = caseDetails;
    const complainantIndividualId = litigants?.find((item) => item?.partyType === "complainant.primary")?.individualId;
    const individualDetail = await Digit.DRISTIService.searchIndividualUser(
      {
        Individual: {
          individualId: complainantIndividualId,
        },
      },
      { tenantId, limit: 1000, offset: 0 }
    );

    const orderData = orderDetails?.order;
    const orderFormData = getFormData(orderType, orderData);
    const orderFormValue = orderDetails?.order?.additionalDetails?.formdata;
    const respondentNameData = getOrderData(orderType, orderFormData);
    const selectedChannel = orderData?.additionalDetails?.formdata?.[orderType === "NOTICE" ? "noticeOrder" : "SummonsOrder"]?.selectedChannels;
    const noticeType = orderData?.additionalDetails?.formdata?.noticeType?.type;
    const respondentAddress = orderFormData?.addressDetails
      ? orderFormData?.addressDetails?.map((data) => ({ ...data?.addressDetails }))
      : respondentNameData?.address
      ? respondentNameData?.address
      : caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.map((data) => data?.addressDetails);
    const partyIndex = orderFormData?.party?.data?.partyIndex || "";
    const respondentName = getRespondantName(respondentNameData);
    const respondentPhoneNo = orderFormData?.party?.data?.phone_numbers || [];
    const respondentEmail = orderFormData?.party?.data?.email || [];
    const complainantDetails = individualDetail?.Individual?.[0];
    const addressLine1 = complainantDetails?.address[0]?.addressLine1 || "";
    const addressLine2 = complainantDetails?.address[0]?.addressLine2 || "";
    const buildingName = complainantDetails?.address[0]?.buildingName || "";
    const street = complainantDetails?.address[0]?.street || "";
    const city = complainantDetails?.address[0]?.city || "";
    const pincode = complainantDetails?.address[0]?.pincode || "";
    const latitude = complainantDetails?.address[0]?.latitude || "";
    const longitude = complainantDetails?.address[0]?.longitude || "";
    const doorNo = complainantDetails?.address[0]?.doorNo || "";
    const complainantName = getComplainantName(caseDetails?.additionalDetails?.complainantDetails?.formdata[0]?.data);
    const address = `${doorNo ? doorNo + "," : ""} ${buildingName ? buildingName + "," : ""} ${street}`.trim();
    const complainantAddress = {
      pincode: pincode,
      district: addressLine2,
      city: city,
      state: addressLine1,
      coordinate: {
        longitude: longitude,
        latitude: latitude,
      },
      locality: address,
    };
    const courtDetails = courtRoomData?.Court_Rooms?.find((data) => data?.code === caseDetails?.courtId);

    const respondentDetails = {
      name: respondentName,
      address: respondentAddress?.[0],
      phone: respondentPhoneNo[0] || "",
      email: respondentEmail[0] || "",
      age: "",
      gender: "",
    };
    const caseRespondent = {
      name: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentFirstName || "",
      address: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.[0]?.addressDetails,
      phone: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.phonenumbers?.mobileNumber?.[0] || "",
      email: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.emails?.emailId?.[0] || "",
      age: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentAge,
      gender: "",
    };

    switch (orderType) {
      case "SUMMONS":
        payload = {
          summonDetails: {
            issueDate: orderData?.auditDetails?.lastModifiedTime,
            caseFilingDate: caseDetails?.filingDate,
            docSubType: orderFormData?.party?.data?.partyType === "Witness" ? "WITNESS" : "ACCUSED",
          },
          respondentDetails: orderFormData?.party?.data?.partyType === "Witness" ? caseRespondent : respondentDetails,
          ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
          complainantDetails: {
            name: complainantName,
            address: complainantAddress,
          },
          caseDetails: {
            caseTitle: caseDetails?.caseTitle,
            year: new Date(caseDetails).getFullYear(),
            hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateForHearing || "").getTime(),
            courtName: courtDetails?.name,
            courtAddress: courtDetails?.address,
            courtPhone: courtDetails?.phone,
            courtId: caseDetails?.courtId,
            hearingNumber: orderData?.hearingNumber,
            judgeName: judgeName,
          },
          deliveryChannels: {
            channelName: "",
            status: "",
            statusChangeDate: "",
            fees: 0,
            feesStatus: "pending",
          },
        };
        break;
      case "NOTICE":
        payload = {
          noticeDetails: {
            issueDate: orderData?.auditDetails?.lastModifiedTime,
            caseFilingDate: caseDetails?.filingDate,
            noticeType,
            docSubType: orderFormData?.party?.data?.partyType === "Witness" ? "WITNESS" : "ACCUSED",
            partyIndex: partyIndex,
          },
          respondentDetails: orderFormData?.party?.data?.partyType === "Witness" ? caseRespondent : respondentDetails,
          ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
          complainantDetails: {
            name: complainantName,
            address: complainantAddress,
          },
          caseDetails: {
            caseTitle: caseDetails?.caseTitle,
            year: new Date(caseDetails).getFullYear(),
            hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateForHearing || "").getTime(),
            courtName: courtDetails?.name,
            courtAddress: courtDetails?.address,
            courtPhone: courtDetails?.phone,
            courtId: caseDetails?.courtId,
            hearingNumber: orderData?.hearingNumber,
            judgeName: judgeName,
          },
          deliveryChannels: {
            channelName: "",
            status: "",
            statusChangeDate: "",
            fees: 0,
            feesStatus: "pending",
          },
        };
        break;
      case "WARRANT":
        payload = {
          warrantDetails: {
            issueDate: orderData?.auditDetails?.lastModifiedTime,
            caseFilingDate: caseDetails?.filingDate,
            docType: orderFormValue.warrantType?.code,
            docSubType: orderFormValue.bailInfo?.isBailable?.code ? "BAILABLE" : "NON_BAILABLE",
            surety: orderFormValue.bailInfo?.noOfSureties?.code,
            bailableAmount: orderFormValue.bailInfo?.bailableAmount,
          },
          respondentDetails: {
            name: respondentName,
            address: { ...respondentAddress?.[0], coordinate: respondentAddress?.[0]?.coordinates },
            phone: respondentPhoneNo?.[0] || "",
            email: respondentEmail?.[0] || "",
            age: "",
            gender: "",
          },
          caseDetails: {
            caseTitle: caseDetails?.caseTitle,
            year: new Date(caseDetails).getFullYear(),
            hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime(),
            judgeName: judgeName,
            courtName: courtDetails?.name,
            courtAddress: courtDetails?.address,
            courtPhone: courtDetails?.phone,
            courtId: caseDetails?.courtId,
          },
          deliveryChannels: {
            channelName: "Police",
            name: "",
            address: "",
            phone: "",
            email: "",
            status: "",
            statusChangeDate: "",
            fees: await getCourtFee("POLICE", respondentAddress?.[0]?.pincode, orderType),
            feesStatus: "",
          },
        };
        break;
      case "BAIL":
        payload = {
          respondentDetails: {
            name: respondentName,
            address: respondentAddress?.[0],
            phone: respondentPhoneNo?.[0] || "",
            email: respondentEmail?.[0] || "",
            age: "",
            gender: "",
          },
          caseDetails: {
            title: caseDetails?.caseTitle,
            year: new Date(caseDetails).getFullYear(),
            hearingDate: new Date(orderData?.additionalDetails?.formdata?.date || "").getTime(),
            judgeName: "",
            courtName: courtDetails?.name,
            courtAddress: courtDetails?.address,
            courtPhone: courtDetails?.phone,
            courtId: caseDetails?.courtId,
          },
        };
        break;
      default:
        break;
    }
    if (Object.keys(payload || {}).length > 0 && !Array.isArray(selectedChannel)) return [payload];
    else if (Object.keys(payload || {}).length > 0 && Array.isArray(selectedChannel)) {
      const channelMap = new Map();
      const channelPayloads = await Promise.all(
        selectedChannel?.map(async (item) => {
          let clonedPayload = JSON.parse(JSON.stringify(payload));

          let courtFees = await getCourtFee(item?.code, clonedPayload?.respondentDetails?.address?.pincode, orderType);

          if (channelMap.get(item?.type)) {
            channelMap.set(item?.type, channelMap.get(item?.type) + 1);
          } else {
            channelMap.set(item?.type, 1);
          }
          if ("deliveryChannels" in clonedPayload) {
            clonedPayload.deliveryChannels = {
              ...clonedPayload.deliveryChannels,
              channelName: channelTypeEnum?.[item?.type]?.type,
              fees: courtFees,
              channelCode: channelTypeEnum?.[item?.type]?.code,
            };

            const address = ["e-Post", "Via Police", "Registered Post"].includes(item?.type)
              ? respondentAddress[channelMap.get(item?.type) - 1]
              : respondentAddress[0];
            const sms = ["SMS"].includes(item?.type) ? respondentPhoneNo[channelMap.get(item?.type) - 1] : respondentPhoneNo[0];
            const email = ["E-mail"].includes(item?.type) ? respondentEmail[channelMap.get(item?.type) - 1] : respondentEmail[0];

            clonedPayload.respondentDetails = {
              ...clonedPayload.respondentDetails,
              address: ["e-Post", "Via Police", "Registered Post"].includes(item?.type)
                ? {
                    ...address,
                    locality: item?.value?.locality || address?.locality,
                    coordinate: item?.value?.coordinates || address?.coordinates,
                  }
                : { ...address, coordinate: address?.coordinates } || "",
              phone: ["SMS"].includes(item?.type) ? item?.value : sms || "",
              email: ["E-mail"].includes(item?.type) ? item?.value : email || "",
              age: "",
              gender: "",
            };
          }
          if ("deliveryChannel" in clonedPayload) {
            const channelDetailsEnum = {
              SMS: "phone",
              "E-mail": "email",
              "e-Post": "address",
              "Via Police": "address",
              "Registered Post": "address",
            };
            clonedPayload.deliveryChannel = {
              ...clonedPayload.deliveryChannel,
              channelName: channelTypeEnum?.[item?.type]?.type,
              [channelDetailsEnum?.[item?.type]]: item?.value || "",
            };

            const address = respondentAddress[channelMap.get(item?.type) - 1];

            const sms = respondentPhoneNo[channelMap.get(item?.type) - 1];
            const email = respondentEmail[channelMap.get(item?.type) - 1];

            clonedPayload.respondentDetails = {
              ...clonedPayload.respondentDetails,
              address: ["e-Post", "Via Police", "Registered Post"].includes(item?.type) ? item?.value : address || "",
              phone: ["SMS"].includes(item?.type) ? item?.value : sms || "",
              email: ["E-mail"].includes(item?.type) ? item?.value : email || "",
              age: "",
              gender: "",
            };
          }
          return clonedPayload;
        })
      );
      return channelPayloads;
    }
  };

  const createTask = async (orderType, orderDetails) => {
    const orderData = orderDetails?.order;
    const payloads = await createTaskPayload(orderType, orderDetails);
    for (const payload of payloads) {
      if (["SUMMONS", "NOTICE"]?.includes(orderType)) {
        await ordersService
          .customApiService(Urls.orders.taskCreate, {
            task: {
              taskDetails: payload,
              workflow: {
                action: "CREATE",
                comments: orderType,
                documents: [
                  {
                    documentType: null,
                    fileStore: null,
                    documentUid: null,
                    additionalDetails: {},
                  },
                ],
                assignes: null,
                rating: null,
              },
              createdDate: new Date().getTime(),
              orderId: orderData?.id,
              filingNumber,
              cnrNumber,
              taskType: orderType,
              status: "INPROGRESS",
              tenantId,
              amount: {
                type: "FINE",
                status: "DONE",
                amount: summonsCourtFee,
              },
              ...(orderData?.itemId && { additionalDetails: { itemId: orderData?.itemId } }),
            },
            tenantId,
          })
          .then(async (data) => {
            if (["SUMMONS", "NOTICE"].includes(orderType)) {
              await createPendingTask({ refId: data?.task?.taskNumber, channelCode: payload?.deliveryChannels?.channelCode, orderType: orderType });
            }
          });
      } else if (orderType === "WARRANT") {
        await ordersService
          .customApiService(Urls.orders.taskCreate, {
            task: {
              taskDetails: payload,
              workflow: {
                action: "CREATE",
                comments: orderType,
                documents: [
                  {
                    documentType: null,
                    fileStore: null,
                    documentUid: null,
                    additionalDetails: {},
                  },
                ],
                assignes: null,
                rating: null,
              },
              createdDate: new Date().getTime(),
              orderId: orderData?.id,
              filingNumber,
              cnrNumber,
              taskType: orderType,
              status: "INPROGRESS",
              tenantId,
              amount: {
                type: "FINE",
                status: "DONE",
                amount: summonsCourtFee,
              },
              ...(orderData?.itemId && { additionalDetails: { itemId: orderData?.itemId } }),
            },
            tenantId,
          })
          .then(async (data) => {
            if (["WARRANT"].includes(orderType)) {
              await createPendingTask({ refId: data?.task?.taskNumber, orderType: orderType });
            }
          });
      }
    }
  };

  const handleIssueSummons = async (hearingDate, hearingNumber) => {
    try {
      const orderbody = {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: "SUMMONS",
        orderCategory: "INTERMEDIATE",
        orderType: "SUMMONS",
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
        ...(hearingNumber && { hearingNumber }),
        additionalDetails: {
          formdata: {
            orderType: {
              code: "SUMMONS",
              type: "SUMMONS",
              name: "ORDER_TYPE_SUMMONS",
            },
            hearingDate,
          },
        },
      };

      const summonsArray =
        currentOrder?.orderCategory === "COMPOSITE"
          ? currentOrder?.compositeItems?.some((item) => item?.orderSchema?.additionalDetails?.isReIssueSummons)
          : currentOrder?.additionalDetails?.isReIssueSummons
          ? [{}]
          : currentOrder?.orderCategory === "COMPOSITE"
          ? currentOrder.compositeItems
              .map((item) =>
                (item?.orderSchema?.additionalDetails?.formdata?.namesOfPartiesRequired || []).filter((data) => data?.partyType === "respondent")
              )
              .flat()
          : currentOrder?.additionalDetails?.formdata?.namesOfPartiesRequired?.filter((data) => data?.partyType === "respondent");
      const promiseList = summonsArray?.map((data) =>
        ordersService.createOrder(
          {
            order: {
              ...orderbody,
              additionalDetails: {
                ...orderbody?.additionalDetails,
                selectedParty: data,
              },
            },
          },
          { tenantId }
        )
      );
      const resList = await Promise.all(promiseList);
      setCreatedSummon(resList[0]?.order?.orderNumber);
      await Promise.all(
        resList.forEach((res) =>
          createPendingTask({
            order: res?.order,
            isAssignedRole: true,
            createTask: true,
            taskStatus: "DRAFT_IN_PROGRESS",
            taskName: t("DRAFT_IN_PROGRESS_ISSUE_SUMMONS"),
            orderEntityType: "order-default",
          })
        )
      );
    } catch (error) {}
  };

  const updateCaseDetails = async (action) => {
    return await DRISTIService.caseUpdateService(
      {
        cases: {
          ...caseDetails,
          linkedCases: caseDetails?.linkedCases ? caseDetails?.linkedCases : [],
          workflow: {
            ...caseDetails?.workflow,
            action,
          },
        },
        tenantId,
      },
      tenantId
    ).then(() => {
      refetchCaseData();
      revalidateWorkflow();
    });
  };

  const handleChangeTitleName = (newTitleName) => {
    const updatedOrderTitles = structuredClone(OrderTitles);
    // Only updated order title of the current selected order.
    updatedOrderTitles[selectedOrder] = newTitleName;
    setOrderTitles(updatedOrderTitles);
    setShowEditTitleNameModal(false);
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

  const handleIssueNotice = async (hearingDate, hearingNumber) => {
    try {
      const orderbody = {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: "NOTICE",
        orderCategory: "INTERMEDIATE",
        orderType: "NOTICE",
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
        ...(hearingNumber && { hearingNumber }),
        additionalDetails: {
          formdata: {
            orderType: {
              code: "NOTICE",
              type: "NOTICE",
              name: "ORDER_TYPE_NOTICE",
            },
            hearingDate,
          },
        },
      };

      const summonsArray =
        currentOrder?.orderCategory === "COMPOSITE"
          ? currentOrder?.compositeItems?.some((item) => item?.orderSchema?.additionalDetails?.isReIssueSummons)
          : currentOrder?.additionalDetails?.isReIssueSummons
          ? [{}]
          : currentOrder?.orderCategory === "COMPOSITE"
          ? currentOrder.compositeItems
              .map((item) =>
                (item?.orderSchema?.additionalDetails?.formdata?.namesOfPartiesRequired || []).filter((data) => data?.partyType === "respondent")
              )
              .flat()
          : currentOrder?.additionalDetails?.formdata?.namesOfPartiesRequired?.filter((data) => data?.partyType === "respondent");

      const promiseList = summonsArray?.map((data) =>
        ordersService.createOrder(
          {
            order: {
              ...orderbody,
              additionalDetails: {
                ...orderbody?.additionalDetails,
                selectedParty: data,
              },
            },
          },
          { tenantId }
        )
      );

      const resList = await Promise.all(promiseList);
      setCreatedNotice(resList[0]?.order?.orderNumber);
      await Promise.all(
        resList.forEach((res) =>
          createPendingTask({
            order: res?.order,
            isAssignedRole: true,
            createTask: true,
            taskStatus: "DRAFT_IN_PROGRESS",
            taskName: t("DRAFT_IN_PROGRESS_ISSUE_NOTICE"),
            orderEntityType: "order-default",
          })
        )
      );
    } catch (error) {}
  };

  const processHandleIssueOrder = async () => {
    setLoader(true);
    try {
      let updatedHearingNumber = "";
      if (currentOrder?.orderCategory === "COMPOSITE") {
        const currentOrderUpdated = currentOrder?.compositeItems?.map((item) => {
          return {
            ...currentOrder,
            additionalDetails: item?.orderSchema?.additionalDetails,
            orderDetails: item?.orderSchema?.orderDetails,
            orderType: item?.orderType,
            itemId: item?.id,
          };
        });

        // Checking if composite orders contain both hearing and notice orders
        const compositeItems = currentOrder?.compositeItems || [];
        const isBothHearingAndNoticePresent = compositeItems.reduce(
          (acc, item) => {
            if (item?.orderType === "SCHEDULE_OF_HEARING_DATE") acc.hasHearing = true;
            if (item?.orderType === "NOTICE" && item?.orderSchema?.additionalDetails?.formdata?.noticeType?.code === "Section 223 Notice") {
              acc.hasNotice = true;
            }
            return acc;
          },
          { hasHearing: false, hasNotice: false }
        );

        const result = isBothHearingAndNoticePresent.hasHearing && isBothHearingAndNoticePresent.hasNotice;
        const priorityOrderTypes = ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"];
        const priorityOrders = currentOrderUpdated?.filter((order) => priorityOrderTypes?.includes(order?.orderType));
        const otherOrders = currentOrderUpdated?.filter((order) => !priorityOrderTypes?.includes(order?.orderType));
        const orderedOrders = [...priorityOrders, ...otherOrders];
        setPrevOrder(currentOrder);

        for (const order of orderedOrders) {
          try {
            const hearingNumber = await handleIssueOrder(order, order?.orderType, currentOrder?.orderCategory, result);
            if (hearingNumber) {
              updatedHearingNumber = hearingNumber;
            }
          } catch (error) {
            console.error(`Failed for order ${order.id}:`, error);
          }
        }
      } else {
        setPrevOrder(currentOrder);
        await handleIssueOrder(currentOrder, currentOrder?.orderType, currentOrder?.orderCategory);
      }

      if (businessOfTheDay) {
        const response = await Digit.HearingService.searchHearings(
          {
            criteria: {
              tenantId: Digit.ULBService.getCurrentTenantId(),
              filingNumber: filingNumber,
            },
          },
          {}
        );

        const nextHearing = response?.HearingList?.filter((hearing) => hearing.status === "SCHEDULED");

        await DRISTIService.addADiaryEntry(
          {
            diaryEntry: {
              judgeId: judgeId,
              businessOfDay: businessOfTheDay,
              tenantId: tenantId,
              entryDate: new Date().setHours(0, 0, 0, 0),
              caseNumber: caseDetails?.cmpNumber,
              referenceId: currentOrder?.orderNumber,
              referenceType: "Order",
              hearingDate: (Array.isArray(nextHearing) && nextHearing.length > 0 && nextHearing[0]?.startTime) || null,
              additionalDetails: {
                filingNumber: currentOrder?.filingNumber,
              },
            },
          },
          {}
        ).catch((error) => {
          console.error("Error in adding diary entry: ", error);
          toast.error(t("SOMETHING_WENT_WRONG"));
        });
      }

      const orderResponse = await updateOrder(
        {
          ...currentOrder,
          ...((updatedHearingNumber || newHearingNumber || hearingNumber || hearingDetails?.hearingId) && {
            hearingNumber: updatedHearingNumber || newHearingNumber || hearingNumber || hearingDetails?.hearingId,
          }),
        },
        OrderWorkflowAction.ESIGN
      );

      // Handling composite orders for task creation
      if (currentOrder?.orderCategory === "COMPOSITE") {
        let updatedOrders = [];
        if (orderResponse) {
          updatedOrders = orderResponse?.order?.compositeItems?.map((item) => {
            return {
              order: {
                ...orderResponse?.order,
                additionalDetails: item?.orderSchema?.additionalDetails,
                orderDetails: item?.orderSchema?.orderDetails,
                orderType: item?.orderType,
                itemId: item?.id,
              },
            };
          });
        }

        try {
          await Promise.all(updatedOrders?.map((item) => createTask(item?.order?.orderType, item)));
        } catch (error) {
          console.error("Error in creating tasks:", error);
        }
      } else {
        createTask(currentOrder?.orderType, orderResponse);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error in processHandleIssueOrder:", error);
    } finally {
      setLoader(false);
    }
  };

  const handleIssueOrder = async (currentOrder, orderType, orderCategory, jumpCaseStatusToLatestStage = false) => {
    try {
      let newhearingId = "";
      const referenceId = currentOrder?.additionalDetails?.formdata?.refApplicationId;
      const newApplicationDetails = applicationData?.applicationList?.find((application) => application?.applicationNumber === referenceId);
      if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(orderType)) {
        const advocateData = advocateDetails.advocates.map((advocate) => {
          return {
            individualId: advocate.responseList[0].individualId,
            name: advocate.responseList[0].additionalDetails.username,
            type: "Advocate",
          };
        });
        const hearingres = await ordersService.createHearings(
          {
            hearing: {
              tenantId: tenantId,
              filingNumber: [filingNumber],
              cnrNumbers: cnrNumber ? [cnrNumber] : [],
              courtCaseNumber: caseDetails?.courtCaseNumber,
              cmpNumber: caseDetails?.cmpNumber,
              hearingType: currentOrder?.additionalDetails?.formdata?.hearingPurpose?.type,
              status: true,
              attendees: [
                ...currentOrder?.additionalDetails?.formdata?.namesOfPartiesRequired.map((attendee) => {
                  return { name: attendee.name, individualId: attendee.individualId, type: attendee.partyType };
                }),
                ...advocateData,
              ],
              startTime: new Date(currentOrder?.additionalDetails?.formdata?.hearingDate).setHours(0, 0, 0, 0),
              endTime: new Date(currentOrder?.additionalDetails?.formdata?.hearingDate).setHours(0, 0, 0, 0),
              workflow: {
                action: "CREATE",
                assignes: [],
                comments: "Create new Hearing",
                documents: [{}],
              },
              documents: [],
            },
            tenantId,
          },
          { tenantId: tenantId }
        );
        newhearingId = hearingres?.hearing?.hearingId;
        setNewHearingNumber(newhearingId);
      }
      if (orderType === "RESCHEDULE_OF_HEARING_DATE") {
        await handleUpdateHearing({
          action: HearingWorkflowAction.BULK_RESCHEDULE,
          startTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          endTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
        });
      }
      if (orderType === "CHECKOUT_ACCEPTANCE") {
        await handleUpdateHearing({
          action: HearingWorkflowAction.BULK_RESCHEDULE,
          startTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          endTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
        });
      }
      if (orderType === "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE") {
        let processInfoObj = {
          caseId: caseDetails?.id,
          action: currentOrder?.additionalDetails?.formdata?.applicationGrantedRejected?.code === "REJECTED" ? "REJECT" : "ACCEPT",
          pendingTaskRefId: currentOrder?.additionalDetails?.pendingTaskRefId,
          tenantId,
        };
        await DRISTIService.processProfileRequest({
          processInfo: { ...processInfoObj },
          tenantId: tenantId,
        });

        await ordersService.customApiService(Urls.orders.pendingTask, {
          pendingTask: {
            referenceId: currentOrder?.additionalDetails?.pendingTaskRefId,
            status: "PROFILE_EDIT_REQUEST",
            filingNumber: filingNumber,
            isCompleted: true,
            tenantId,
          },
        });
      }
      if (orderType === "INITIATING_RESCHEDULING_OF_HEARING_DATE") {
        const dateObject = new Date(
          newApplicationDetails?.additionalDetails?.formdata?.changedHearingDate || currentOrder?.additionalDetails?.formdata?.originalHearingDate
        );
        let date = dateObject && dateObject?.getTime();
        if (isNaN(date)) {
          date = Date.now();
        }
        const requesterId = "";
        const comments = currentOrder?.comments || "";
        const hearingBookingId = currentOrder?.hearingNumber;
        const rescheduledRequestId = currentOrder?.orderNumber;
        await handleUpdateHearing({
          action: HearingWorkflowAction.RESCHEDULE,
          startTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          endTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
        });
        await handleRescheduleHearing({ hearingBookingId, rescheduledRequestId, comments, requesterId, date });
      }
      if (orderType === "ASSIGNING_DATE_RESCHEDULED_HEARING") {
        await handleUpdateHearing({
          action: HearingWorkflowAction.SETDATE,
          startTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
          endTime: Date.parse(currentOrder?.additionalDetails?.formdata?.newHearingDate),
        });
      }
      referenceId && (await handleApplicationAction(currentOrder, newApplicationDetails));
      await createPendingTask({
        order: {
          ...currentOrder,
          ...((newhearingId ||
            newHearingNumber ||
            hearingNumber ||
            hearingDetails?.hearingId ||
            newApplicationDetails?.additionalDetails?.hearingId) && {
            hearingNumber:
              newhearingId || newHearingNumber || hearingNumber || hearingDetails?.hearingId || newApplicationDetails?.additionalDetails?.hearingId,
          }),
        },
        compositeOrderItemId: currentOrder?.itemId,
        newApplicationDetails: newApplicationDetails,
      });

      currentOrder?.additionalDetails?.formdata?.refApplicationId && (await closeManualPendingTask(currentOrder?.orderNumber));
      if (currentOrder?.orderCategory === "INTERMEDIATE") {
        if (["SCHEDULE_OF_HEARING_DATE"].includes(orderType)) {
          closeManualPendingTask(filingNumber);
          if (!isCaseAdmitted) {
            await updateCaseDetails("SCHEDULE_ADMISSION_HEARING");
          }
        }
      }
      if (currentOrder?.orderCategory === "COMPOSITE") {
        if (!jumpCaseStatusToLatestStage) {
          // IF we have notice order along with hearing order in the composite, we will update the case status in the notice order logic and skip it here.
          // we will directly jump the case stage to pending response.
          if (["SCHEDULE_OF_HEARING_DATE"].includes(orderType)) {
            closeManualPendingTask(filingNumber);
            if (!isCaseAdmitted) {
              await updateCaseDetails("SCHEDULE_ADMISSION_HEARING");
            }
          }
        } else {
          if (["SCHEDULE_OF_HEARING_DATE"].includes(orderType)) {
            await closeManualPendingTask(filingNumber);
          }
        }
      }
      await closeManualPendingTask(currentOrder?.orderNumber);
      if (orderType === "SUMMONS") {
        await closeManualPendingTask(currentOrder?.hearingNumber || hearingDetails?.hearingId);
      }
      if (currentOrder?.orderCategory === "INTERMEDIATE") {
        if (
          orderType === "NOTICE" &&
          currentOrder?.additionalDetails?.formdata?.noticeType?.code === "Section 223 Notice" &&
          caseDetails?.status === "PENDING_NOTICE"
        ) {
          await closeManualPendingTask(currentOrder?.hearingNumber || hearingDetails?.hearingId);
          try {
            await updateCaseDetails("ISSUE_ORDER");
            const caseDetails = await refetchCaseData();
            const caseData = caseDetails?.data?.criteria?.[0]?.responseList?.[0];
            const respondent = caseData?.litigants?.find((litigant) => litigant?.partyType?.includes("respondent"));
            const advocate = caseData?.representatives?.find((representative) =>
              representative?.representing?.some((represent) => respondent && represent?.individualId === respondent?.individualId)
            );

            const assignees = [];
            if (respondent) assignees.push({ uuid: respondent?.additionalDetails?.uuid });
            if (advocate) assignees.push({ uuid: advocate?.additionalDetails?.uuid });

            if (respondent && assignees?.length > 0) {
              try {
                await DRISTIService.customApiService(Urls.orders.pendingTask, {
                  pendingTask: {
                    name: "Pending Response",
                    entityType: "case-default",
                    referenceId: `MANUAL_${caseData?.filingNumber}`,
                    status: "PENDING_RESPONSE",
                    assignedTo: assignees,
                    assignedRole: ["CASE_RESPONDER"],
                    cnrNumber: caseData?.cnrNumber,
                    filingNumber: caseData?.filingNumber,
                    isCompleted: false,
                    stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                    additionalDetails: {
                      individualId: respondent?.individualId,
                      caseId: caseData?.id,
                      litigants: [respondent?.map((data) => data?.individualId)],
                    },
                    tenantId,
                  },
                });
              } catch (err) {
                console.error("err :>> ", err);
              }
            }
          } catch (error) {
            console.error("error :>> ", error);
          }
        }
      }
      if (currentOrder?.orderCategory === "COMPOSITE") {
        if (orderType === "NOTICE" && currentOrder?.additionalDetails?.formdata?.noticeType?.code === "Section 223 Notice") {
          try {
            await closeManualPendingTask(currentOrder?.hearingNumber || hearingDetails?.hearingId);
          } catch (error) {
            console.error("Error closing manual pending task:", error);
          }
          const currentCaseStaus = caseDetails?.status;
          if (["PENDING_NOTICE", "PENDING_ADMISSION_HEARING"]?.includes(currentCaseStaus)) {
            // Reason for above condition- If we have more than one notices in composite items and case is updated once and reached to pending response
            // then we should not repeat this case update call.
            try {
              await updateCaseDetails("ISSUE_ORDER");
              const caseDetails = await refetchCaseData();
              const caseData = caseDetails?.data?.criteria?.[0]?.responseList?.[0];
              const respondent = caseData?.litigants?.find((litigant) => litigant?.partyType?.includes("respondent"));
              const advocate = caseData?.representatives?.find((representative) =>
                representative?.representing?.some((represent) => respondent && represent?.individualId === respondent?.individualId)
              );
              const assignees = [];
              if (respondent) assignees.push({ uuid: respondent?.additionalDetails?.uuid });
              if (advocate) assignees.push({ uuid: advocate?.additionalDetails?.uuid });

              if (respondent && assignees?.length > 0) {
                try {
                  await DRISTIService.customApiService(Urls.orders.pendingTask, {
                    pendingTask: {
                      name: "Pending Response",
                      entityType: "case-default",
                      referenceId: `MANUAL_${caseData?.filingNumber}`,
                      status: "PENDING_RESPONSE",
                      assignedTo: assignees,
                      assignedRole: ["CASE_RESPONDER"],
                      cnrNumber: caseData?.cnrNumber,
                      filingNumber: caseData?.filingNumber,
                      isCompleted: false,
                      stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                      additionalDetails: {
                        individualId: respondent?.individualId,
                        caseId: caseData?.id,
                        litigants: [respondent?.map((data) => data?.individualId)],
                      },
                      tenantId,
                    },
                  });
                } catch (err) {
                  console.error("err :>> ", err);
                }
              }
            } catch (error) {
              console.error("eror :>> ", error);
            }
          }
        }
      }
      if (["ADMIT_CASE", "DISMISS_CASE"]?.includes(orderType)) {
        updateCaseDetails(orderType === "DISMISS_CASE" ? "REJECT" : "ADMIT").then(async (res) => {
          const { HearingList = [] } = await Digit.HearingService.searchHearings({
            hearing: { tenantId },
            criteria: {
              tenantID: tenantId,
              filingNumber: filingNumber,
            },
          });
          const hearingData =
            HearingList?.find((list) => list?.hearingType === "ADMISSION" && !(list?.status === "COMPLETED" || list?.status === "ABATED")) || {};
          if (hearingData.hearingId) {
            hearingData.workflow = hearingData.workflow || {};
            hearingData.workflow.action = "ABANDON";
            await Digit.HearingService.updateHearings(
              { tenantId, hearing: hearingData, hearingType: "", status: "" },
              { applicationNumber: "", cnrNumber: "" }
            );
          }
          if (orderType !== "DISMISS_CASE") {
            try {
              DRISTIService.customApiService(Urls.orders.pendingTask, {
                pendingTask: {
                  name: "Schedule Hearing",
                  entityType: "case-default",
                  referenceId: `MANUAL_${caseDetails?.filingNumber}`,
                  status: "SCHEDULE_HEARING",
                  assignedTo: [],
                  assignedRole: ["JUDGE_ROLE"],
                  cnrNumber: caseDetails?.cnrNumber,
                  filingNumber: caseDetails?.filingNumber,
                  isCompleted: false,
                  stateSla: todayDate + stateSla.SCHEDULE_HEARING,
                  additionalDetails: {},
                  tenantId,
                },
              });
              const closePendingResponse = respondents?.map((user) =>
                DRISTIService.customApiService(Urls.orders.pendingTask, {
                  pendingTask: {
                    name: "Pending Response",
                    entityType: "case-default",
                    referenceId: `MANUAL_PENDING_RESPONSE_${caseDetails?.filingNumber}_${user?.individualId}`,
                    status: "PENDING_RESPONSE",
                    assignedTo: [],
                    assignedRole: ["CASE_RESPONDER"],
                    cnrNumber: caseDetails?.cnrNumber,
                    filingNumber: caseDetails?.filingNumber,
                    isCompleted: true,
                    stateSla: todayDate + 20 * 24 * 60 * 60 * 1000,
                    additionalDetails: {},
                    tenantId,
                  },
                })
              );
              Promise.all(closePendingResponse);
            } catch (error) {
              console.error("error :>> ", error);
            }
          }
        });
      }
      if ("ADVOCATE_REPLACEMENT_APPROVAL" === orderType) {
        const taskData = await DRISTIService.customApiService(Urls.orders.searchTasks, {
          criteria: {
            tenantId: tenantId,
            taskNumber: currentOrder?.additionalDetails?.taskNumber,
          },
        });
        const task = taskData?.list?.[0];

        try {
          const reqBody = {
            task: {
              ...task,
              workflow: {
                action: currentOrder?.additionalDetails?.formdata?.replaceAdvocateStatus?.code === "GRANT" ? "APPROVE" : "REJECT",
              },
            },
          };
          await taskService.updateTask(reqBody, { tenantId });
        } catch (error) {
          console.error("Error updating task data:", error);
        }
        return;
      }
      if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(orderType)) {
        return newhearingId;
      }
    } catch (error) {
      setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
      setLoader(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      if (formList[deleteOrderIndex]?.orderNumber) {
        await updateOrder(formList[deleteOrderIndex], OrderWorkflowAction.DELETE);
        closeManualPendingTask(formList[deleteOrderIndex]?.orderNumber);
      }
      setFormList((prev) => prev.filter((_, i) => i !== deleteOrderIndex));
      if (orderNumber) {
        history.push(`?filingNumber=${filingNumber}`);
      }
      setSelectedOrder((prev) => {
        return deleteOrderIndex <= prev ? (prev - 1 >= 0 ? prev - 1 : 0) : prev;
      });
    } catch (error) {
      //show toast of API failed
      // setShowErrorToast()
    }
    setDeleteOrderIndex(null);
  };

  const handleDeleteOrderItem = async (deleteOrderItemIndex) => {
    // If order was is in save draft and composite (means it already has orderNumber), keep it composite even if only 1 item remains.
    // otherwise, change the orderCategory to INTERMEDIATE if only 1 item remains.
    if (!currentOrder?.orderNumber) {
      // IF compositeItems length is 1, we are not showing delete icon anyways.
      // const totalEnabled = currentOrder?.compositeItems?.filter((o) => o?.isEnabled)?.length;

      setFormList((prev) => {
        return prev?.map((item, i) => {
          if (i !== selectedOrder) return item;

          let updatedCompositeItems = item?.compositeItems?.map((compositeItem, index) => {
            if (index === deleteOrderItemIndex) {
              return { ...compositeItem, isEnabled: false, displayindex: -Infinity };
            }

            return {
              ...compositeItem,
              displayindex: index > deleteOrderItemIndex ? compositeItem.displayindex - 1 : compositeItem.displayindex,
            };
          });

          // setValueRef.current[deleteOrderItemIndex]?.("");
          return {
            ...item,
            compositeItems: updatedCompositeItems,
          };
        });
      });
    } else {
      // once an order type is composite -> it will be composite even after deleting items.
      const deletedItemId = currentOrder?.compositeItems?.find((item, index) => index === deleteOrderItemIndex)?.id;
      if (deletedItemId) {
        // call delete item api when deleting existing order item
        try {
          const response = await deleteOrderItem(currentOrder, deletedItemId);
          if (response?.order?.orderNumber) {
            await refetchOrdersData();
            await refetchOrdersData(); // hard refresh
          } else {
            console.error("Delete operation was not successful.");
          }
        } catch (error) {
          console.error("Error deleting order item:", error);
        }
      } else {
        // If item was not a saved order item, just remove the item from formList.
        setFormList((prev) => {
          return prev?.map((item, i) => {
            if (i !== selectedOrder) return item;

            let updatedCompositeItems = item?.compositeItems?.map((compositeItem, index) => {
              if (index === deleteOrderItemIndex) {
                return { ...compositeItem, isEnabled: false, displayindex: -Infinity };
              }

              return {
                ...compositeItem,
                displayindex: index > deleteOrderItemIndex ? compositeItem.displayindex - 1 : compositeItem.displayindex,
              };
            });

            return {
              ...item,
              compositeItems: updatedCompositeItems,
            };
          });
        });
      }
    }
    setDeleteOrderItemIndex(null);
  };
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

  const handleGoBackSignatureModal = () => {
    localStorage.removeItem("fileStoreId");
    setShowsignatureModal(false);
    setShowReviewModal(true);
  };
  const handleOrderChange = (index) => {
    setSelectedOrder(index);
  };
  const handleDownloadOrders = () => {
    const fileStoreId = localStorage.getItem("fileStoreId");
    downloadPdf(tenantId, signedDoucumentUploadedID || fileStoreId);
    // setShowSuccessModal(false);
    // history.push(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`, {
    //   from: "orderSuccessModal",
    // });
  };

  const handleBulkDownloadOrder = () => {
    const fileStoreId = prevOrder?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore;
    downloadPdf(tenantId, fileStoreId);
  };

  const handleCustomSubmit = () => {
    modifiedFormConfig.forEach((_, index) => {
      formValueChangeTriggerRefs.current[index]();
    });
    const formSubmitButton = submitButtonRefs.current?.querySelector('button[type="submit"]');
    if (formSubmitButton) {
      formSubmitButton.click();
    }
  };

  function validateValue(masterName, moduleName, value) {
    // Retrieve the validation function dynamically
    const validationFn = Digit?.Customizations?.[masterName]?.[moduleName];

    if (typeof validationFn !== "function") {
      console.error(`Validation function not found for ${masterName}.${moduleName}`);
      return false;
    }

    // Get the validation rules by calling the function
    const rules = validationFn();

    let isValid = true; // Assume valid initially

    // Check pattern validation (for strings)
    if (rules.pattern && typeof rules.pattern.test === "function") {
      isValid = rules.pattern.test(value);
    }

    // Check min validation (for numbers or dates)
    if (rules.min !== undefined) {
      isValid = isValid && value >= rules.min;
    }

    // Check max validation (for numbers or dates)
    if (rules.max !== undefined) {
      isValid = isValid && value <= rules.max;
    }

    return isValid;
  }

  const getMandatoryFieldsErrors = (modifiedFormConfig, currentOrder) => {
    // we are doing this only for composite items
    let errrors = [];
    for (let i = 0; i < currentOrder?.compositeItems?.length; i++) {
      if (!currentOrder?.compositeItems?.[i]?.isEnabled) {
        continue;
      } else {
        const formdata = currentOrder?.compositeItems?.[i]?.orderSchema?.additionalDetails?.formdata;
        const displayindex = currentOrder?.compositeItems?.[i]?.displayindex;
        const orderType = currentOrder?.compositeItems?.[i]?.orderType;
        const allFormSections = [];
        const itemErrors = [];
        for (let p = 0; p < modifiedFormConfig?.[i]?.length; p++) {
          if (!formdata) {
            itemErrors.push({ key: "ORDER_TYPE", errorMessage: "SELECT_ORDER_TYPE" });
            break;
          }
          const body = modifiedFormConfig?.[i]?.[p]?.body;

          for (let k = 0; k < body?.length; k++) {
            if (body?.[k]?.populators?.hideInForm) {
              continue;
            } else {
              if (body?.[k]?.isMandatory && !formdata[body?.[k]?.key]) {
                itemErrors.push({ key: body?.[k]?.label || body?.[k]?.key, errorMessage: "THIS_IS_MANDATORY_FIELD" });
              }
            }
          }
        }
        if (!formdata) {
          errrors.push({ index: i, orderType: "NOT_PRESENT", errors: itemErrors });
          continue;
        }
        errrors.push({ index: i, orderType: orderType, errors: itemErrors });
      }
    }
    return errrors;
  };

  const handleReviewOrderClick = () => {
    const items = structuredClone(currentOrder?.orderCategory === "INTERMEDIATE" ? [currentOrder] : currentOrder?.compositeItems);
    let hasError = false; // Flag to track if an error occurs
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

        if (["ADMIT_CASE", "DISMISS_CASE"].includes(orderType) && ["CASE_DISMISSED", "CASE_ADMITTED"].includes(caseDetails?.status)) {
          setShowErrorToast({
            label: "CASE_ADMITTED" === caseDetails?.status ? t("CASE_ALREADY_ADMITTED") : t("CASE_ALREADY_REJECTED"),
            error: true,
          });
          hasError = true;
          break;
        }

        if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(orderType) && (isHearingScheduled || isHearingOptout)) {
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

        if (orderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
          if (!formData?.responseInfo?.responseDeadline && formData?.responseInfo?.isResponseRequired?.code === true) {
            setFormErrors?.current?.[index]?.("responseDeadline", { message: t("PROPOSED_DATE_CAN_NOT_BE_BEFORE_SUBMISSION_DEADLINE") });
            hasError = true;
            break;
          }
          if (
            (!formData?.responseInfo?.respondingParty || formData?.responseInfo?.respondingParty?.length === 0) &&
            formData?.responseInfo?.isResponseRequired?.code === true
          ) {
            setFormErrors?.current?.[index]?.("respondingParty", { message: t("CORE_REQUIRED_FIELD_ERROR") });
            hasError = true;
            break;
          }
        }

        if (orderType === "WARRANT") {
          if (!formData?.bailInfo?.noOfSureties && formData?.bailInfo?.isBailable?.code === true) {
            setFormErrors?.current?.[index]?.("noOfSureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
            hasError = true;
            break;
          }
          if (
            (!formData?.bailInfo?.bailableAmount || formData?.bailInfo?.bailableAmount?.slice(-1) === ".") &&
            formData?.bailInfo?.isBailable?.code === true
          ) {
            setFormErrors?.current?.[index]?.("bailableAmount", { message: t("CS_VALID_AMOUNT_DECIMAL") });
            hasError = true;
            break;
          }
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

    // for composite orders, due to issue in validation of multiple forms in formcomposer
    // a modal will appear on clicking review order if there are errors for mandatory fields.
    if (currentOrder?.orderCategory === "COMPOSITE") {
      // calculation for errors in currentOrder
      const errors = getMandatoryFieldsErrors(modifiedFormConfig, currentOrder);
      if (errors?.some((obj) => obj?.errors?.length > 0)) {
        setShowMandatoryFieldsErrorModal({ showModal: true, errorsData: errors });
        return;
      }
    }

    if (!hasError) {
      handleSaveDraft({ showReviewModal: true });
    }
  };

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

  const handleClose = async () => {
    localStorage.removeItem("fileStoreId");
    if (successModalActionSaveLabel === t("CS_COMMON_CLOSE")) {
      setShowSuccessModal(false);
      history.push(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`, {
        from: "orderSuccessModal",
      });
      return;
    }
    if (successModalActionSaveLabel === t("ISSUE_SUMMONS_BUTTON")) {
      await handleIssueSummons(extractedHearingDate, newHearingNumber || hearingId || hearingNumber);
      history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${createdSummon}`);
    }
    if (successModalActionSaveLabel === t("ISSUE_NOTICE_BUTTON")) {
      await handleIssueNotice(extractedHearingDate, newHearingNumber || hearingId || hearingNumber);
      history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${createdNotice}`);
    }
  };

  const handleCloseSuccessModal = () => {
    localStorage.removeItem("fileStoreId");
    setShowSuccessModal(false);
    history.push(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`, {
      from: "orderSuccessModal",
    });
  };

  const handleBulkCloseSuccessModal = () => {
    setShowBulkModal(false);
    history.push(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`);
  };

  if (!filingNumber) {
    history.push("/employee/home/home-pending-task");
  }

  const handleAddForm = () => {
    setFormList((prev) => {
      return prev?.map((item, i) => {
        if (i !== selectedOrder) return item;

        const updatedCompositeItems = (obj) => {
          let orderTitleNew = obj?.orderTitle;
          let compositeItemsNew = obj?.compositeItems ? [...obj.compositeItems] : [];
          const totalEnabled = compositeItemsNew?.filter((o) => o?.isEnabled)?.length;

          if (compositeItemsNew.length === 0) {
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
            orderTitleNew = `${t(obj?.orderType)} and Other Items`;
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

        const updatedItems = updatedCompositeItems(item);

        return {
          ...item,
          orderCategory: "COMPOSITE",
          orderTitle: updatedItems.orderTitle,
          compositeItems: updatedItems.compositeItems,
        };
      });
    });

    if (
      !currentOrder?.orderNumber ||
      ordersData?.list?.find((order) => order?.orderNumber === currentOrder?.orderNumber)?.orderCategory === "INTERMEDIATE"
    ) {
      let compositeItemsNew = currentOrder?.compositeItems ? [...currentOrder.compositeItems] : [];
      const totalEnabled = currentOrder?.compositeItems?.filter((o) => o?.isEnabled)?.length;

      if (compositeItemsNew?.length === 0) {
        // This case if when we are making new composite from scratch
        const orderTitleNew = `${t(currentOrder?.orderType)} and Other Items`;
        setOrderTitles((prevTitles) => {
          if (prevTitles[selectedOrder] === orderTitleNew) {
            return prevTitles;
          }
          const updatedTitles = [...prevTitles];
          updatedTitles[selectedOrder] = orderTitleNew;
          return updatedTitles;
        });
      }

      if (totalEnabled === 1) {
        const enabledItem = currentOrder?.compositeItems?.find((item) => item?.isEnabled && item?.orderType);
        const orderTitleNew = `${t(enabledItem?.orderType)} and Other Items`;
        setOrderTitles((prevTitles) => {
          if (prevTitles[selectedOrder] === orderTitleNew) {
            return prevTitles;
          }
          const updatedTitles = [...prevTitles];
          updatedTitles[selectedOrder] = orderTitleNew;
          return updatedTitles;
        });
      }
    }
  };

  const showEditTitleIcon = useMemo(() => {
    if (currentOrder?.orderCategory === "COMPOSITE") {
      const totalEnabled = currentOrder?.compositeItems?.filter((o) => o?.isEnabled)?.length;

      if (totalEnabled > 1 || ordersData?.list?.find((order) => order?.orderNumber === currentOrder?.orderNumber)?.orderCategory === "COMPOSITE") {
        return true;
      }
    }
    return false;
  }, [currentOrder, selectedOrder]);

  const DcaWarning = useMemo(() => {
    let warningObj = { show: false, message: "" };
    if (currentOrder?.orderCategory === "INTERMEDIATE") {
      const showWarning =
        "NO" === caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data?.delayCondonationType?.code &&
        "NOTICE" === currentOrder?.additionalDetails?.formdata?.orderType?.code &&
        (("Section 223 Notice" === currentOrder?.additionalDetails?.formdata?.noticeType?.code && !isDCANoticeGenerated) ||
          (!isDelayApplicationSubmitted && currentOrder?.additionalDetails?.formdata?.noticeType?.code === "DCA Notice"));

      warningObj.show = showWarning;
      if (showWarning) {
        const warningMessage =
          "Section 223 Notice" === currentOrder?.additionalDetails?.formdata?.noticeType?.code && !isDCANoticeGenerated
            ? t("DCA_NOTICE_NOT_SENT") + ": " + t("DCA_NOTICE_NOT_SENT_MESSAGE")
            : !isDelayApplicationSubmitted && currentOrder?.additionalDetails?.formdata?.noticeType?.code === "DCA Notice"
            ? t("DELAY_APPLICATION_NOT_SUBMITTED")
            : "";
        warningObj.message = warningMessage;
      }
      return warningObj;
    } else {
      if (!isDCANoticeGenerated) {
        const showWarning = currentOrder?.compositeItems?.some(
          (orderItem) =>
            orderItem?.isEnabled &&
            "NO" === caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data?.delayCondonationType?.code &&
            "NOTICE" === orderItem?.orderSchema?.additionalDetails?.formdata?.orderType?.code &&
            "Section 223 Notice" === orderItem?.orderSchema?.additionalDetails?.formdata?.noticeType?.code
        );
        warningObj.show = showWarning;
        if (showWarning) {
          const warningMessage = t("DCA_NOTICE_NOT_SENT") + ": " + t("DCA_NOTICE_NOT_SENT_MESSAGE");
          warningObj.message = warningMessage;
        }
      }
      if (!isDelayApplicationSubmitted) {
        const showWarning = currentOrder?.compositeItems?.some(
          (orderItem) =>
            orderItem?.isEnabled &&
            "NO" === caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data?.delayCondonationType?.code &&
            "NOTICE" === orderItem?.orderSchema?.additionalDetails?.formdata?.orderType?.code &&
            orderItem?.orderSchema?.additionalDetails?.formdata?.noticeType?.code === "DCA Notice"
        );
        warningObj.show = warningObj.show || showWarning;
        if (showWarning) {
          const warningMessage = t("DELAY_APPLICATION_NOT_SUBMITTED");
          warningObj.message = warningObj?.message ? warningObj.message + " and " + warningMessage : warningMessage;
        }
      }
      return warningObj;
    }
  }, [currentOrder, isDelayApplicationSubmitted, caseDetails, isDCANoticeGenerated]);

  if (
    loader ||
    isOrdersLoading ||
    isOrdersFetching ||
    isCaseDetailsLoading ||
    isApplicationDetailsLoading ||
    !ordersData?.list ||
    isHearingLoading ||
    pendingTasksLoading ||
    isCourtIdsLoading ||
    isPublishedOrdersLoading
  ) {
    return <Loader />;
  }

  return (
    <div className="generate-orders">
      <div className="orders-list-main" style={{ flex: 1 }}>
        <div className="add-order-button" onClick={handleAddOrder}>{`+ ${t("CS_ADD_ORDER")}`}</div>
        <React.Fragment>
          <style>
            {` .view-order .generate-orders .employeeCard .label-field-pair .field .field-container .component-in-front {
                border-top:1px solid #000 !important ;
                border-bottom:1px solid #000 !important ;
                border-left:1px solid #000 !important ;
                margin-top: 0px; 
          }`}
          </style>

          {formList?.map((item, index) => {
            return (
              <div className={`order-item-main ${selectedOrder === index ? "selected-order" : ""}`}>
                <h1
                  onClick={() => {
                    handleOrderChange(index);
                  }}
                  style={{ cursor: "pointer", flex: 1 }}
                >
                  {t(OrderTitles?.[index]) || `${t("CS_ORDER")} ${index + 1}`}
                </h1>
                {formList?.length > 1 && (
                  <span
                    onClick={() => {
                      setDeleteOrderIndex(index);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <CustomDeleteIcon />
                  </span>
                )}
              </div>
            );
          })}
        </React.Fragment>
      </div>
      <div className="view-order" style={{ marginBottom: "300px", flex: 3 }}>
        {
          <div
            className="header-title-icon"
            style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}
          >
            {
              <Header className="order-header">{`${
                currentOrder?.orderCategory === "INTERMEDIATE" ? `${t("CS_ORDER")} ${selectedOrder + 1}` : OrderTitles?.[selectedOrder]
              }`}</Header>
            }

            {showEditTitleIcon && (
              <div
                className="case-edit-icon"
                onClick={() => {
                  setShowEditTitleNameModal(true);
                }}
              >
                <div className="edit-order-title-icon">
                  <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`Click`}>
                    {" "}
                    <EditIcon />
                  </span>
                  <ReactTooltip id={`Click`} place="bottom" content={t("CS_CLICK_TO_EDIT") || ""}>
                    {t("CS_CLICK_TO_EDIT")}
                  </ReactTooltip>
                </div>
              </div>
            )}
          </div>
        }
        {DcaWarning?.show && (
          <div
            className="dca-infobox-message"
            style={{
              display: "flex",
              gap: "8px",
              backgroundColor: "#FEF4F4",
              border: "1px",
              borderColor: "#FCE8E8",
              padding: "8px",
              borderRadius: "8px",
              marginBottom: "24px",
              width: "fit-content",
            }}
          >
            <div className="dca-infobox-icon" style={{}}>
              <WarningInfoIconYellow />{" "}
            </div>
            <div className="dca-infobox-me" style={{}}>
              {DcaWarning?.message}
            </div>
          </div>
        )}
        {modifiedFormConfig?.map((config, index) => {
          let displayindex = 0;
          if (currentOrder?.orderCategory === "COMPOSITE") {
            displayindex = currentOrder?.compositeItems?.[index]?.displayindex;
          }
          if (currentOrder?.orderCategory === "COMPOSITE" && currentOrder?.compositeItems?.[index]?.isEnabled === false) {
            return null;
          }
          const showDeleteIcon = (currentOrder?.compositeItems?.filter((o) => o?.isEnabled) || []).length > 1;
          return (
            <div key={`${selectedOrder}-${index}`} className="form-wrapper-d" ref={(el) => (submitButtonRefs.current = el)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontWeight: "700", fontSize: "20px" }}>{`${t("ITEM")} ${displayindex + 1}`}</h1>
                {showDeleteIcon && (
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setDeleteOrderItemIndex(index);
                    }}
                  >
                    <CustomDeleteIcon />
                  </span>
                )}
              </div>
              <FormComposerV2
                className={"generate-orders"}
                key={`${selectedOrder}=${index}`}
                label={t("PREVIEW_ORDER_PDF")}
                config={config}
                defaultValues={getDefaultValue(index)}
                onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
                  formValueChangeTriggerRefs.current[index] = trigger;
                  onFormValueChange(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues, index);
                }}
                onSubmit={handleReviewOrderClick}
                onSecondayActionClick={handleSaveDraft}
                secondaryLabel={t("SAVE_AS_DRAFT")}
                showSecondaryLabel={true}
                cardClassName={`order-type-form-composer`}
                actionClassName={"order-type-action"}
                isDisabled={isSubmitDisabled}
              />
            </div>
          );
        })}
        {/* <div
          className="custom-submit-button"
          style={{
            position: "fixed",
            bottom: "16px",
            zIndex: "1000",
            right: "24px",
            height: "40px",
            width: "164px",
          }}
        >
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={isSubmitDisabled}
            style={{ height: "40px", width: "164px", background: "#007e7e", fontSize: "16px", fontWeight: "700", color: "white" }}
          >
            {t("REVIEW_ORDER")}
          </button>
        </div> */}
        {true && ( // TODO: set condition here to show add item button
          <div style={{ marginBottom: "100px" }}>
            <Button
              variation="secondary"
              onButtonClick={handleAddForm}
              className="add-new-form"
              icon={<CustomAddIcon />}
              label={t("ADD_ITEM")}
              style={{ border: "none" }}
            ></Button>
          </div>
        )}
      </div>
      <div style={{ flex: 2 }}>
        <TasksComponent
          taskType={taskType}
          setTaskType={setTaskType}
          uuid={userInfo?.uuid}
          userInfoType={userInfoType}
          filingNumber={filingNumber}
          inCase={true}
          hideFilters={true}
          isApplicationCompositeOrder={true}
          compositeOrderObj={currentOrder}
        />
      </div>
      {deleteOrderIndex !== null && (
        <div className="delete-order-warning-modal">
          <OrderDeleteModal
            t={t}
            deleteOrderIndex={deleteOrderIndex}
            setDeleteOrderIndex={setDeleteOrderIndex}
            handleDeleteOrder={handleDeleteOrder}
          />
        </div>
      )}
      {showReviewModal && (
        <OrderReviewModal
          t={t}
          order={currentPublishedOrder || currentOrder}
          setShowReviewModal={setShowReviewModal}
          setShowsignatureModal={setShowsignatureModal}
          setOrderPdfFileStoreID={setOrderPdfFileStoreID}
          showActions={canESign && !currentDiaryEntry}
          setBusinessOfTheDay={setBusinessOfTheDay}
          currentDiaryEntry={currentDiaryEntry}
          handleUpdateBusinessOfDayEntry={handleUpdateBusinessOfDayEntry}
          handleReviewGoBack={handleReviewGoBack}
          businessOfDay={businessOfTheDay}
          updateOrder={updateOrder}
          setShowBulkModal={setShowBulkModal}
          setPrevOrder={setPrevOrder}
        />
      )}
      {showsignatureModal && (
        <OrderSignatureModal
          t={t}
          order={currentOrder}
          handleIssueOrder={processHandleIssueOrder}
          handleGoBackSignatureModal={handleGoBackSignatureModal}
          setSignedDocumentUploadID={setSignedDocumentUploadID}
          orderPdfFileStoreID={orderPdfFileStoreID}
          saveOnsubmitLabel={"ISSUE_ORDER"}
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

      {deleteOrderItemIndex !== null && (
        <OrderItemDeleteModal
          t={t}
          handleDeleteOrderItem={handleDeleteOrderItem}
          deleteOrderItemIndex={deleteOrderItemIndex}
          setDeleteOrderItemIndex={setDeleteOrderItemIndex}
        ></OrderItemDeleteModal>
      )}
      {showEditTitleNameModal && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowEditTitleNameModal(false);
              }}
            />
          }
          actionCancelOnSubmit={() => setShowEditTitleNameModal(false)}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={() => handleChangeTitleName(modalTitleName)}
          formId="modal-action"
          headerBarMain={<Heading label={t("CS_CHANGE_ORDER_TITLE")} />}
          className="edit-case-name-modal"
        >
          <h3 className="input-label">{t("CS_TITLE_Name")}</h3>
          <TextInput
            defaultValue={t(OrderTitles?.[selectedOrder])}
            type="text"
            onChange={(e) => setModalTitleName(e.target.value)}
            maxlength={1024}
          />
        </Modal>
      )}
      {showMandatoryFieldsErrorModal?.showModal && (
        <MandatoryFieldsErrorModal
          t={t}
          showMandatoryFieldsErrorModal={showMandatoryFieldsErrorModal}
          setShowMandatoryFieldsErrorModal={setShowMandatoryFieldsErrorModal}
        ></MandatoryFieldsErrorModal>
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
    </div>
  );
};

export default GenerateOrders;
