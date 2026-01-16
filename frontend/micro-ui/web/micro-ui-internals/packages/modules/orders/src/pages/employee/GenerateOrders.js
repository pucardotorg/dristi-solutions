import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from "react"; // Added useContext for breadcrumb implementation
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import { Header, FormComposerV2, Toast, Button, EditIcon, Modal, CloseButton, TextInput, CloseSvg } from "@egovernments/digit-ui-react-components";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core"; // Import breadcrumb context from core module
import {
  applicationTypeConfig,
  configCheckout,
  configRejectSubmission,
  configsAssignDateToRescheduledHearing,
  configsAssignNewHearingDate,
  configsBail,
  configsCaseSettlement,
  configsCaseTransferAccept,
  configsCaseTransferReject,
  configsCaseWithdrawalAccept,
  configsCaseWithdrawalReject,
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
  configsAdmitCase,
  configsDismissCase,
  configsApproveRejectLitigantDetailsChange,
  replaceAdvocateConfig,
  configsCreateOrderProclamation,
  configsCreateOrderAttachment,
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
import useSearchOrdersService from "../../hooks/orders/useSearchOrdersService";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { getRespondantName, getComplainantName, constructFullName, removeInvalidNameParts, getFormattedName } from "../../utils";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import CompositeOrdersErrorModal from "./CompositeOrdersErrorModal";
import OrderItemDeleteModal from "./OrderItemDeleteModal";
import TasksComponent from "../../../../home/src/components/TaskComponent";
import MandatoryFieldsErrorModal from "./MandatoryFieldsErrorModal";
import OrderAddToBulkSuccessModal from "../../pageComponents/OrderAddToBulkSuccessModal";
import { getFullName } from "../../../../cases/src/utils/joinCaseUtils";

// any order type from orderTypes can not be paired with any order from unAllowedOrderTypes when creating composite order.
export const compositeOrderAllowedTypes = [
  {
    key: "finalStageOrders",
    orderTypes: ["REFERRAL_CASE_TO_ADR", "JUDGEMENT", "WITHDRAWAL_ACCEPT", "SETTLEMENT_ACCEPT", "CASE_TRANSFER_ACCEPT", "DISMISS_CASE"],
    unAllowedOrderTypes: ["REFERRAL_CASE_TO_ADR", "JUDGEMENT", "WITHDRAWAL_ACCEPT", "SETTLEMENT_ACCEPT", "CASE_TRANSFER_ACCEPT", ""],
  },
  {
    key: "schedule_Reschedule",
    orderTypes: ["SCHEDULE_OF_HEARING_DATE", "RESCHEDULE_OF_HEARING_DATE"],
    unAllowedOrderTypes: ["SCHEDULE_OF_HEARING_DATE", "RESCHEDULE_OF_HEARING_DATE"],
  },
  {
    key: "no_restriction",
    orderTypes: [
      "NOTICE",
      "OTHERS",
      "WARRANT",
      "SUMMONS",
      "MANDATORY_SUBMISSIONS_RESPONSES",
      "SECTION_202_CRPC",
      "ACCEPT_BAIL",
      "PROCLAMATION",
      "ATTACHMENT",
    ],
    unAllowedOrderTypes: [],
  },
  {
    key: "admit_case",
    orderTypes: ["TAKE_COGNIZANCE"],
    unAllowedOrderTypes: ["TAKE_COGNIZANCE", "DISMISS_CASE"],
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
  CASE_TRANSFER_ACCEPT: configsCaseTransferAccept,
  CASE_TRANSFER_REJECT: configsCaseTransferReject,
  SETTLEMENT_ACCEPT: configsCaseSettlement,
  SETTLEMENT_REJECT: configsCaseSettlement,
  SUMMONS: configsIssueSummons,
  NOTICE: configsIssueNotice,
  BAIL: configsBail,
  WARRANT: configsCreateOrderWarrant,
  PROCLAMATION: configsCreateOrderProclamation,
  ATTACHMENT: configsCreateOrderAttachment,
  WITHDRAWAL_ACCEPT: configsCaseWithdrawalAccept,
  WITHDRAWAL_REJECT: configsCaseWithdrawalReject,
  OTHERS: configsOthers,
  APPROVE_VOLUNTARY_SUBMISSIONS: configsVoluntarySubmissionStatus,
  REJECT_VOLUNTARY_SUBMISSIONS: configRejectSubmission,
  JUDGEMENT: configsJudgement,
  REJECT_BAIL: configsIssueBailReject,
  ACCEPT_BAIL: configsIssueBailAcceptance,
  SET_BAIL_TERMS: configsSetTermBail,
  ACCEPTANCE_REJECTION_DCA: configsAcceptRejectDelayCondonation,
  TAKE_COGNIZANCE: configsAdmitCase,
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

function appendRoleToName(name, newRole) {
  const nameWithoutParentheses = name?.replace(/\([^)]*\)/, "")?.trim();
  const existingRoles = name?.match(/\(([^)]+)\)/);
  const roles = existingRoles ? `${existingRoles[1]}, ${newRole}` : newRole;
  return `${nameWithoutParentheses} (${roles})`;
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
  CASE_TRANSFER_ACCEPT: 3,
  CASE_TRANSFER_REJECT: 3,
  SETTLEMENT_ACCEPT: 3,
  SETTLEMENT_REJECT: 3,
  SUMMONS: 3,
  NOTICE: 3,
  BAIL: 3,
  WARRANT: 3,
  PROCLAMATION: 3,
  ATTACHMENT: 3,
  WITHDRAWAL_ACCEPT: 3,
  WITHDRAWAL_REJECT: 3,
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
  const canSaveSignLater = roles?.some((role) => role.code === "ORDER_APPROVER");
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const judgeName = localStorage.getItem("judgeName");
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
  const [isOrderChanged, setIsOrderChanged] = useState(false);

  const [OrderTitles, setOrderTitles] = useState([]);
  const [showEditTitleNameModal, setShowEditTitleNameModal] = useState(false);
  const [modalTitleName, setModalTitleName] = useState("");
  const [showMandatoryFieldsErrorModal, setShowMandatoryFieldsErrorModal] = useState({ showModal: false, errorsData: [] });
  const [profileEditorName, setProfileEditorName] = useState("");
  const currentDiaryEntry = history.location?.state?.diaryEntry;

  // Access breadcrumb context to get and set case navigation data
  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId: caseIdFromBreadCrumbs, filingNumber: filingNumberFromBreadCrumbs } = BreadCrumbsParamsData;

  const [fileStoreIds, setFileStoreIds] = useState(new Set());
  const courtId = localStorage.getItem("courtId");

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

  const { data: warrantSubType, isLoading: isWarrantSubType } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Order",
    [{ name: "warrantSubType" }],
    {
      select: (data) => {
        return data?.Order?.warrantSubType || [];
      },
    }
  );

  const groupedWarrantOptions = useMemo(() => {
    if (!Array.isArray(warrantSubType)) return [];

    const specific = [];
    const others = [];

    for (const item of warrantSubType) {
      if (item?.belowOthers === "YES") {
        others.push(item);
      } else {
        specific.push(item);
      }
    }

    const result = [];
    if (specific.length) result.push({ options: specific });
    if (others.length) result.push({ label: "Others", options: others });

    return result;
  }, [warrantSubType]);

  // Replaced React Query implementation with direct API call for better control over breadcrumb data
  // const { data: caseData, isLoading: isCaseDetailsLoading, refetch: refetchCaseData } = Digit.Hooks.dristi.useSearchCaseService(
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

  // Manual state management for case data instead of using React Query
  const [caseData, setCaseData] = useState(undefined);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const [caseApiError, setCaseApiError] = useState(undefined);
  // Flag to prevent multiple breadcrumb updates
  const isBreadCrumbsParamsDataSet = useRef(false);

  /**
   * Fetch case details and update breadcrumb data
   * This function replaces the previous React Query implementation for better control
   * over when and how the breadcrumb context is updated
   */
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

  const userInfo = Digit.UserService.getUser()?.info;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [taskType, setTaskType] = useState({});

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const caseCourtId = useMemo(() => caseDetails?.courtId || localStorage.getItem("courtId"), [caseDetails]);

  const { data: applicationData, isLoading: isApplicationDetailsLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const isDelayApplicationPending = useMemo(() => {
    return Boolean(
      applicationData?.applicationList?.some(
        (item) =>
          item?.applicationType === "DELAY_CONDONATION" &&
          [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
      )
    );
  }, [applicationData]);

  const applicationTypeConfigUpdated = useMemo(() => {
    const updatedConfig = structuredClone(applicationTypeConfig);
    // Showing admit case/Dismiss case order type in the dropdown list depending on the case status.
    if (["PENDING_RESPONSE", "PENDING_ADMISSION"].includes(caseDetails?.status)) {
      // case admit can not be allowed if there are pending review/approval of some Delay condonation application.

      if (isDelayApplicationPending) {
        updatedConfig[0].body[0].populators.mdmsConfig.select =
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`DISMISS_CASE`, `SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
      } else {
        updatedConfig[0].body[0].populators.mdmsConfig.select =
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`TAKE_COGNIZANCE`, `DISMISS_CASE`, `SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
      }
    }
    return updatedConfig;
  }, [caseDetails, isDelayApplicationPending]);

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
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
          if (poaHolder) {
            return {
              code: fullName,
              name: `${fullName} (Complainant, PoA Holder)`,
              uuid: allAdvocates[item?.additionalDetails?.uuid],
              partyUuid: item?.additionalDetails?.uuid,
              individualId: item?.individualId,
              isJoined: true,
              partyType: "complainant",
              representingLitigants: poaHolder?.representingLitigants?.map((lit) => lit?.individualId),
            };
          }
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

  const poaHolders = useMemo(() => {
    const complainantIds = new Set(complainants?.map((c) => c?.individualId));
    return (
      caseDetails?.poaHolders
        ?.filter((item) => !complainantIds.has(item?.individualId))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.name);
          return {
            code: fullName,
            name: `${fullName} (PoA Holder)`,
            representingLitigants: item?.representingLitigants?.map((lit) => lit?.individualId),
            individualId: item?.individualId,
            isJoined: true,
            partyType: "poaHolder",
          };
        }) || []
    );
  }, [caseDetails, complainants]);

  const respondents = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("respondent"))
        .map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const uniqueId = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          )?.uniqueId;
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
            uniqueId,
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
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: data?.data?.uuid,
            isJoined: false,
            partyType: "respondent",
            uniqueId: data?.uniqueId,
          };
        }) || []
    );
  }, [caseDetails]);

  const witnesses = useMemo(() => {
    return (
      caseDetails?.witnessDetails?.map((data) => {
        const fullName = getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null);
        return { code: fullName, name: `${fullName} (Witness)`, uuid: data?.uuid, partyType: "witness" };
      }) || []
    );
  }, [caseDetails]);

  const allParties = useMemo(() => [...complainants, ...poaHolders, ...respondents, ...unJoinedLitigant, ...witnesses], [
    complainants,
    poaHolders,
    respondents,
    unJoinedLitigant,
    witnesses,
  ]);

  const { data: ordersData, refetch: refetchOrdersData, isLoading: isOrdersLoading, isFetching: isOrdersFetching } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        orderNumber,
        status: OrderWorkflowState.DRAFT_IN_PROGRESS,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.DRAFT_IN_PROGRESS,
    Boolean(filingNumber && caseCourtId)
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
    if (isOrdersLoading || isOrdersFetching) {
      return;
    }
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
    const currentSelectedOrderIndex = sessionStorage.getItem("currentSelectedOrder");

    if (currentSelectedOrderIndex) {
      setSelectedOrder(currentSelectedOrderIndex);
    } else if (defaultIndex && defaultIndex !== -1 && orderNumber && defaultIndex !== selectedOrder && !isOrderChanged) {
      setSelectedOrder(defaultIndex);
    }
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const savedOrderPdf = sessionStorage.getItem("orderPDF");
    if (isSignSuccess) {
      setShowsignatureModal(true);
      setOrderPdfFileStoreID(savedOrderPdf);
    }
  }, [defaultIndex, orderNumber, selectedOrder]);

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

  useEffect(() => {
    if (orderPdfFileStoreID) {
      setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, orderPdfFileStoreID]));
    }
    if (signedDoucumentUploadedID) {
      setFileStoreIds((fileStoreIds) => new Set([...fileStoreIds, signedDoucumentUploadedID]));
    }
  }, [orderPdfFileStoreID, signedDoucumentUploadedID]);

  const currentOrder = useMemo(() => formList?.[selectedOrder], [formList, selectedOrder]);

  // Checking if the current order type is NOTICE.
  const isNoticeOrder = useMemo(() => {
    if (currentOrder?.orderCategory === "COMPOSITE") {
      if (currentOrder?.compositeItems?.find((item) => item?.orderType === "NOTICE")) {
        return true;
      } else return false;
    } else if (currentOrder?.orderType === "NOTICE") {
      return true;
    } else return false;
  }, [currentOrder]);

  const { data: publishedNoticeOrdersData } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        orderType: "NOTICE",
        status: "PUBLISHED",
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.PUBLISHED + "NOTICE",
    Boolean(filingNumber && isNoticeOrder && caseCourtId)
  );

  const isDCANoticeGenerated = useMemo(
    () =>
      publishedNoticeOrdersData?.list?.some((notice) => {
        if (notice?.orderCategory === "COMPOSITE") {
          return notice?.compositeItems?.some((item) => item?.orderSchema?.additionalDetails?.formdata?.noticeType?.code === "DCA Notice");
        }
        return notice?.additionalDetails?.formdata?.noticeType?.code === "DCA Notice";
      }),
    [publishedNoticeOrdersData]
  );

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

  // Get all the published orders corresponding to approval/rejection of litigants profile change request.
  const { data: approveRejectLitigantDetailsChangeOrderData } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        orderType: "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
        status: OrderWorkflowState.PUBLISHED,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.PUBLISHED + "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
    Boolean(filingNumber && cnrNumber && isApproveRejectLitigantDetailsChange && caseCourtId)
  );

  const publishedLitigantDetailsChangeOrders = useMemo(() => approveRejectLitigantDetailsChangeOrderData?.list || [], [
    approveRejectLitigantDetailsChangeOrderData,
  ]);

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

  const { data: publishedBailOrdersData, isLoading: isPublishedOrdersLoading } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        status: OrderWorkflowState.PUBLISHED,
        orderType: "ACCEPT_BAIL",
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.PUBLISHED + "ACCEPT_BAIL",
    Boolean(filingNumber && cnrNumber && isJudgementOrder && caseCourtId)
  );
  const publishedBailOrder = useMemo(() => publishedBailOrdersData?.list?.[0] || {}, [publishedBailOrdersData]);

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
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    hearingId || hearingNumber,
    Boolean(filingNumber && caseCourtId)
  );
  const hearingDetails = useMemo(() => hearingsData?.HearingList?.[0], [hearingsData]);
  const hearingsList = useMemo(() => hearingsData?.HearingList?.sort((a, b) => b.startTime - a.startTime), [hearingsData]);

  const attendeeOptions = useMemo(() => {
    if (!Array.isArray(hearingDetails?.attendees)) {
      return [];
    }
    return hearingDetails?.attendees.map((attendee) => ({
      ...attendee,
      partyType: attendee?.type,
      value: attendee.individualId || attendee.name,
      label: attendee.name,
    }));
  }, [hearingDetails?.attendees]);

  const isHearingScheduled = useMemo(() => {
    const isPresent = (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.SCHEDULED);
    return isPresent;
  }, [hearingsData]);

  const isHearingInProgress = useMemo(() => {
    const isPresent = (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.INPROGRESS);
    return isPresent;
  }, [hearingsData]);

  const isHearingInPassedOver = useMemo(() => {
    const isPresent = (hearingsData?.HearingList || []).some((hearing) => hearing?.status === HearingWorkflowState.PASSED_OVER);
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
    if (!currentOrder) return null;
    if (currentOrder?.orderCategory === "COMPOSITE") {
      return currentOrder?.compositeItems?.map((item) => {
        // We will disable the order type dropdown as a quick fix to handle formcomposer issue
        // becuase if we change the order type, there is a match between formconfig and form data in composer
        // so values are setting in keys of other order type form fields.
        const orderType = item?.orderType;
        let newConfig = orderType
          ? applicationTypeConfigUpdated?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfigUpdated);

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

          if (orderType === "WARRANT") {
            const warrantSubtypeCode = item?.orderSchema?.additionalDetails?.formdata?.warrantSubType?.templateType;
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

          if (orderType === "ACCEPT_BAIL") {
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
                  return field;
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
        ? applicationTypeConfigUpdated?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
        : structuredClone(applicationTypeConfigUpdated);
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

        if (orderType === "WARRANT") {
          const warrantSubtypeCode = currentOrder?.additionalDetails?.formdata?.warrantSubType?.templateType;
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

        if (orderType === "ACCEPT_BAIL") {
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
                return field;
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
  }, [
    currentOrder,
    applicationTypeConfigUpdated,
    complainants,
    respondents,
    attendeeOptions,
    poaHolders,
    unJoinedLitigant,
    witnesses,
    caseDetails?.id,
    caseDetails?.filingNumber,
    t,
    groupedWarrantOptions,
  ]);

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
      if (orderType === "REJECT_BAIL") {
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

      if (orderType === "WITHDRAWAL_ACCEPT") {
        if (newApplicationDetails?.applicationType === applicationTypes.WITHDRAWAL) {
          updatedFormdata.applicationOnBehalfOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
          setValueRef?.current?.[index]?.("applicationOnBehalfOf", updatedFormdata.applicationOnBehalfOf);

          updatedFormdata.partyType = t(newApplicationDetails?.additionalDetails?.partyType);
          setValueRef?.current?.[index]?.("partyType", updatedFormdata.partyType);

          updatedFormdata.reasonForWithdrawal = t(newApplicationDetails?.additionalDetails?.formdata?.reasonForWithdrawal?.code);
          setValueRef?.current?.[index]?.("reasonForWithdrawal", updatedFormdata.reasonForWithdrawal);
        }
      }

      if (orderType === "WITHDRAWAL_REJECT") {
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
          updatedFormdata.dateForHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
        } else if (isHearingScheduled || isHearingInPassedOver || isHearingInProgress) {
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
          updatedFormdata.dateForHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
        } else if (isHearingScheduled || isHearingInPassedOver || isHearingInProgress) {
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
      if (orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT") {
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
          updatedFormdata.dateOfHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
        } else if (isHearingScheduled || isHearingInPassedOver || isHearingInProgress) {
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
      if (
        formData?.warrantSubType?.templateType === "SPECIFIC" &&
        formData?.bailInfo?.isBailable &&
        Object.keys(formState?.errors).includes("isBailable")
      ) {
        clearFormErrors?.current?.[index]?.("isBailable");
      } else if (
        formState?.submitCount &&
        formData?.warrantSubType?.templateType === "SPECIFIC" &&
        !formData?.bailInfo?.isBailable &&
        !Object.keys(formState?.errors).includes("isBailable")
      ) {
        setFormErrors?.current?.[index]?.("isBailable", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.warrantSubType?.templateType === "GENERIC" && formData?.warrantText && Object.keys(formState?.errors).includes("warrantText")) {
        clearFormErrors?.current?.[index]?.("warrantText");
      } else if (
        formState?.submitCount &&
        formData?.warrantSubType?.templateType === "GENERIC" &&
        !formData?.warrantText &&
        !Object.keys(formState?.errors).includes("warrantText")
      ) {
        setFormErrors?.current?.[index]?.("warrantText", { message: t("CORE_REQUIRED_FIELD_ERROR") });
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

      const warrantType = formData?.warrantSubType?.templateType;
      if (warrantType !== "GENERIC" && formData?.bailInfo?.warrantText) {
        setValue("bailInfo", undefined);
      } else if (warrantType === "GENERIC" && formData?.warrantText?.isBailable) {
        setValue("warrantText", undefined);
      }
    }

    if (orderType && ["PROCLAMATION"].includes(orderType)) {
      if (formData?.proclamationText && Object.keys(formState?.errors).includes("proclamationText")) {
        clearFormErrors?.current?.[index]?.("proclamationText");
      } else if (formState?.submitCount && !formData?.proclamationText && !Object.keys(formState?.errors).includes("proclamationText")) {
        setFormErrors?.current?.[index]?.("proclamationText", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
    }

    if (orderType && ["ATTACHMENT"].includes(orderType)) {
      if (formData?.attachmentText && Object.keys(formState?.errors).includes("attachmentText")) {
        clearFormErrors?.current?.[index]?.("attachmentText");
      } else if (formState?.submitCount && !formData?.attachmentText && !Object.keys(formState?.errors).includes("attachmentText")) {
        setFormErrors?.current?.[index]?.("attachmentText", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.village && Object.keys(formState?.errors).includes("village")) {
        clearFormErrors?.current?.[index]?.("village");
      } else if (formState?.submitCount && !formData?.village && !Object.keys(formState?.errors).includes("village")) {
        setFormErrors?.current?.[index]?.("village", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.district && Object.keys(formState?.errors).includes("district")) {
        clearFormErrors?.current?.[index]?.("district");
      } else if (formState?.submitCount && !formData?.district && !Object.keys(formState?.errors).includes("district")) {
        setFormErrors?.current?.[index]?.("district", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (formData?.chargeDays && Object.keys(formState?.errors).includes("chargeDays")) {
        clearFormErrors?.current?.[index]?.("chargeDays");
      } else if (formState?.submitCount && !formData?.chargeDays && !Object.keys(formState?.errors).includes("chargeDays")) {
        setFormErrors?.current?.[index]?.("chargeDays", { message: t("CORE_REQUIRED_FIELD_ERROR") });
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
            orderDetails: item?.orderCategory !== "COMPOSITE" ? item?.orderDetails : null,
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
      parties = [
        ...(orderSchema?.orderDetails?.partyDetails?.partiesToRespond || []),
        ...(orderSchema?.orderDetails?.partyDetails?.partyToMakeSubmission || []),
      ];
    } else if (["WARRANT", "SUMMONS", "NOTICE", "PROCLAMATION", "ATTACHMENT"].includes(type)) {
      parties = orderSchema?.orderDetails?.respondentName?.name
        ? [orderSchema?.orderDetails?.respondentName?.name]
        : orderSchema?.orderDetails?.respondentName
        ? [orderSchema?.orderDetails?.respondentName]
        : [];
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
    const updatedParties = parties?.map((party) => {
      const matchingParty = allParties?.find((p) => p?.code?.trim() === party?.trim());
      if (matchingParty) {
        return {
          partyName: matchingParty?.name,
          partyType: matchingParty?.partyType,
        };
      } else {
        return {
          partyName: party,
          partyType: "witness",
        };
      }
    });
    return updatedParties;
  };

  const getPartyNamesString = (parties) => {
    if (!Array.isArray(parties) || parties.length === 0) {
      return "";
    }
    return parties.map((party) => party.partyName).join(", ");
  };

  const fetchAdvocateIndividualInfo = useCallback(async (uuid) => {
    try {
      const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
        {
          Individual: {
            userUuid: [uuid],
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );
      return individualData;
    } catch (error) {
      console.error("Error fetching advocate info:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchAdvocateName = async () => {
      if (!currentOrder?.orderType) {
        setProfileEditorName("");
        return;
      }

      // if the editor is a complainant (pip), we will get its name from litigant
      if (currentOrder?.additionalDetails?.applicantType === "COMPLAINANT") {
        for (let i = 0; i < caseDetails?.litigants?.length; i++) {
          const lit = caseDetails?.litigants?.[i];
          if (lit?.additionalDetails?.uuid === currentOrder?.additionalDetails?.applicantPartyUuid) {
            setProfileEditorName(lit?.additionalDetails?.fullName || "");
            return;
          }
        }
      }

      // If the editor is an advocate, we will get its name from representatives,
      if (currentOrder?.additionalDetails?.applicantType === "ADVOCATE") {
        let advFound = false;
        for (let i = 0; i < caseDetails?.representatives?.length; i++) {
          const rep = caseDetails?.representatives?.[i];
          if (rep?.additionalDetails?.uuid === currentOrder?.additionalDetails?.applicantPartyUuid) {
            advFound = true;
            setProfileEditorName(rep?.additionalDetails?.advocateName || "");
            return;
          }
        }

        // if the advocate is not found in representatives, we have to get its name using individual search api.
        if (!advFound) {
          try {
            const individualData = await fetchAdvocateIndividualInfo(currentOrder?.additionalDetails?.applicantPartyUuid);
            const { givenName = "", otherNames = "", familyName = "" } = individualData?.Individual?.[0]?.name || {};
            const fullName = getFullName(" ", givenName, otherNames, familyName);
            setProfileEditorName(fullName);
          } catch (error) {
            console.error("Error fetching advocate name:", error);
            setProfileEditorName("");
          }
        }
      }
    };

    fetchAdvocateName();
  }, [caseDetails, currentOrder, fetchAdvocateIndividualInfo]);

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
        return `For ${t(
          currentOrder?.orderDetails?.purposeOfHearing || currentOrder?.additionalDetails?.formdata?.hearingPurpose?.code
        )} on ${formatDate(new Date(currentOrder?.additionalDetails?.formdata?.hearingDate), "DD-MM-YYYY")}`;
      case "SCHEDULING_NEXT_HEARING":
        return `${currentOrder?.additionalDetails?.formdata?.hearingSummary?.text || ""}`;
      case "RESCHEDULE_OF_HEARING_DATE":
        return `Hearing for ${formatDate(
          new Date(currentOrder?.additionalDetails?.formdata?.originalHearingDate),
          "DD-MM-YYYY"
        )} rescheduled to ${formatDate(new Date(currentOrder?.additionalDetails?.formdata?.newHearingDate), "DD-MM-YYYY")}`;
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
        return `For ${t(
          currentOrder?.orderDetails?.purposeOfHearing || currentOrder?.additionalDetails?.formdata?.hearingPurpose?.code
        )} on ${formatDate(new Date(currentOrder?.additionalDetails?.formdata?.hearingDate), "DD-MM-YYYY")}`;
      case "CASE_TRANSFER_ACCEPT":
        return "The case is transferred to another court for further proceedings";
      case "CASE_TRANSFER_REJECT":
        return `The request to transfer the case to another court has been rejected`;
      case "SETTLEMENT_ACCEPT":
        return "The settlement records have been accepted by the court. Case closed.";
      case "SETTLEMENT_REJECT":
        return "The settlement records have been dismissed by the court";
      case "SUMMONS":
        return `Issue Summons to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "NOTICE":
        return `Issue Notice to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "BAIL":
        return "Bail";
      case "WARRANT":
        return `Issue ${t(currentOrder?.orderDetails?.warrantType)} to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "PROCLAMATION":
        return `Issue Proclamation to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "ATTACHMENT":
        return `Issue Attachment to ${currentOrder?.orderDetails?.parties?.[0]?.partyName}`;
      case "WITHDRAWAL_ACCEPT":
        return "The application to withdraw the case has been accepted. Case closed";
      case "WITHDRAWAL_REJECT":
        return `The application to withdraw the case raised by ${applicationDetails?.additionalDetails?.owner} has been rejected`;
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
      case "TAKE_COGNIZANCE":
        return `Cognizance of the offence taken on file as ${caseDetails?.cmpNumber} under Section 138 of the Negotiable Instruments Act`;
      case "DISMISS_CASE":
        return `Case has been dismissed`;
      case "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE":
        return `Application by ${profileEditorName} to update litigant details is hereby ${t(
          currentOrder?.additionalDetails?.formdata?.applicationGrantedRejected?.code
        )}`;
      default:
        return "";
    }
  }, [t, applicationDetails, caseDetails, currentOrder, profileEditorName]);

  useEffect(() => {
    const businessOfTheDay = sessionStorage.getItem("businessOfTheDay");
    if (businessOfTheDay) {
      setBusinessOfTheDay(businessOfTheDay);
    } else {
      setBusinessOfTheDay(defaultBOTD);
    }
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

    if (documentsFile?.documentType === "SIGNED") {
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const newFileStoreId = localStorageID || signedDoucumentUploadedID;
      fileStoreIds.delete(newFileStoreId);
      let index = 1;
      for (const fileStoreId of fileStoreIds) {
        if (fileStoreId !== newFileStoreId) {
          documents.push({
            isActive: false,
            documentType: "UNSIGNED",
            fileStore: fileStoreId,
            documentOrder: index,
          });
          index++;
        }
      }
    }
    return [...documents, documentsFile];
  };

  const updateOrder = async (order, action, unsignedFileStoreId) => {
    try {
      const localStorageID = sessionStorage.getItem("fileStoreId");
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
            if (["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT"]?.includes(item?.order?.orderType)) {
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
        } else if (["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT"]?.includes(order?.orderType)) {
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
          ? applicationTypeConfigUpdated?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfigUpdated);
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
      return await ordersService
        .updateOrder(
          {
            order: {
              ...order,
              ...orderSchema,
              ...(isSigning && order?.orderCategory === "COMPOSITE" && { compositeItems: newCompositeItems }),
              ...(isSigning &&
                order?.orderCategory === "INTERMEDIATE" && {
                  additionalDetails: {
                    ...order?.additionalDetails,
                    ...(taskDetails && { taskDetails }),
                  },
                }),
              ...((newHearingNumber || hearingNumber || hearingDetails?.hearingId) && {
                hearingNumber: newHearingNumber || hearingNumber || hearingDetails?.hearingId,
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
        });
    } catch (error) {
      setShowErrorToast({ label: action === OrderWorkflowAction.ESIGN ? t("ERROR_PUBLISHING_THE_ORDER") : t("SOMETHING_WENT_WRONG"), error: true });
    }
  };

  const addOrderItem = async (order, action, index) => {
    const compositeItems = [];
    order?.compositeItems?.forEach((item, index) => {
      let orderSchema = {};
      try {
        let orderTypeDropDownConfig = item?.id
          ? applicationTypeConfigUpdated?.map((obj) => ({ body: obj.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfigUpdated);
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
    const payload = {
      order: {
        ...order,
        additionalDetails: null,
        orderDetails: null,
        orderType: null,
        orderCategory: "COMPOSITE",
        orderTitle: OrderTitles[index],
        compositeItems,
        workflow: { ...order.workflow, action, documents: [{}] },
      },
    };
    if (order?.orderNumber) {
      return await ordersService.addOrderItem(payload, { tenantId });
    }
    return await ordersService.createOrder(payload, { tenantId });
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
          ? applicationTypeConfigUpdated?.map((item) => ({ body: item.body.map((input) => ({ ...input, disable: true })) }))
          : structuredClone(applicationTypeConfigUpdated);
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
    setIsOrderChanged(true);
    setSelectedOrder(formList?.length);
    setOrderTitles([...OrderTitles, t("CS_ORDER")]);
  };

  const createPendingTask = async ({ order, createTask = false, taskStatus = "CREATE_SUBMISSION", taskName = "", orderEntityType = null }) => {
    let create = createTask;
    let name = taskName;
    let assignees = [];
    let referenceId = order?.orderNumber;
    let assignedRole = [];
    let additionalDetails = {};
    let entityType = orderEntityType;
    let status = taskStatus;

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
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
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
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: true,
          stateSla: null,
          additionalDetails: {},
          tenantId,
        },
      });
    } catch (error) {}
  };

  const handleSaveDraft = async ({ showReviewModal }) => {
    try {
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

              // Send only isEnabled composite items from current order;
              const enabledCompositeItems = order?.compositeItems?.filter((item) => item?.isEnabled);
              updatedOrder.compositeItems = enabledCompositeItems;
              updatedOrder.orderTitle = t(OrderTitles[index]);
              return await addOrderItem(updatedOrder, OrderWorkflowAction.SAVE_DRAFT, index);
            }
          }
        }
      });

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
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      setLoader(false);
    }
  };

  const getFormData = (orderType, order) => {
    const formDataKeyMap = {
      SUMMONS: "SummonsOrder",
      WARRANT: "warrantFor",
      NOTICE: "noticeOrder",
      PROCLAMATION: "proclamationFor",
      ATTACHMENT: "attachmentFor",
    };
    const formDataKey = formDataKeyMap[orderType];
    return order?.additionalDetails?.formdata?.[formDataKey];
  };

  const getOrderData = (orderType, orderFormData) => {
    return ["SUMMONS", "NOTICE", "WARRANT", "PROCLAMATION", "ATTACHMENT"].includes(orderType) ? orderFormData?.party?.data : orderFormData;
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
    // const individualDetail1 = await Digit.DRISTIService.searchIndividualUser(
    //   {
    //     Individual: {
    //       individualId: complainantIndividualId,
    //     },
    //   },
    //   { tenantId, limit: 1000, offset: 0 }
    // );

    const orderData = orderDetails?.order;
    const orderFormData = getFormData(orderType, orderData);
    const orderFormValue = orderDetails?.order?.additionalDetails?.formdata;
    const respondentNameData = getOrderData(orderType, orderFormData);
    const formDataKeyMap = {
      NOTICE: "noticeOrder",
      SUMMONS: "SummonsOrder",
      WARRANT: "warrantFor",
      PROCLAMATION: "proclamationFor",
      ATTACHMENT: "attachmentFor",
      // Add more types here easily in future
    };
    const selectedChannel = orderData?.additionalDetails?.formdata?.[formDataKeyMap[orderType]]?.selectedChannels;
    const noticeType = orderData?.additionalDetails?.formdata?.noticeType?.type;
    const respondentAddress = orderFormData?.addressDetails
      ? orderFormData?.addressDetails?.map((data) => ({ ...data?.addressDetails }))
      : respondentNameData?.address
      ? respondentNameData?.address
      : caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.map((data) => data?.addressDetails);
    const partyIndex = orderFormData?.party?.data?.partyIndex || "";
    const result = getRespondantName(respondentNameData);
    const respondentName = result?.name || result;
    const respondentPhoneNo = orderFormData?.party?.data?.phone_numbers || [];
    const respondentEmail = orderFormData?.party?.data?.email || [];
    const complainantDetails = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
      (d) => d?.data?.complainantVerification?.individualDetails?.individualId === complainantIndividualId
    )?.data;

    const state = complainantDetails?.addressDetails?.state || "";
    const district = complainantDetails?.addressDetails?.district || "";
    const city = complainantDetails?.addressDetails?.city || "";
    const pincode = complainantDetails?.addressDetails?.pincode || "";
    const latitude = complainantDetails?.addressDetails?.pincode?.latitude || "";
    const longitude = complainantDetails?.addressDetails?.pincode?.longitude || "";
    const complainantName = getComplainantName(complainantDetails);
    const locality = complainantDetails?.addressDetails?.locality || "";
    const complainantAddress = {
      pincode: pincode,
      district: district,
      city: city,
      state: state,
      coordinate: {
        longitude: longitude,
        latitude: latitude,
      },
      locality: locality,
    };
    const courtDetails = courtRoomData?.Court_Rooms?.find((data) => data?.code === caseDetails?.courtId);
    const ownerType = orderFormData?.party?.data?.ownerType;

    const respondentDetails = {
      name: respondentName,
      address: respondentAddress?.[0],
      phone: respondentPhoneNo[0] || "",
      email: respondentEmail[0] || "",
      age: "",
      gender: "",
      ...(ownerType && { ownerType: ownerType }),
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
            templateType: orderFormValue?.warrantSubType?.templateType || "GENERIC",
            warrantText: orderFormValue?.warrantText?.warrantText || "",
          },
          respondentDetails: {
            name: respondentName,
            address: { ...respondentAddress?.[0], coordinate: respondentAddress?.[0]?.coordinates },
            phone: respondentPhoneNo?.[0] || "",
            email: respondentEmail?.[0] || "",
            age: "",
            gender: "",
            ...(ownerType && { ownerType: ownerType }),
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
            fees: await getCourtFee(
              "POLICE",
              respondentAddress?.[0]?.pincode,
              orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType
            ),
            feesStatus: "",
          },
        };
        break;
      case "PROCLAMATION":
        payload = {
          proclamationDetails: {
            issueDate: orderData?.auditDetails?.lastModifiedTime,
            caseFilingDate: caseDetails?.filingDate,
            docSubType: "Proclamation requiring the appearance of a person accused",
            templateType: "GENERIC",
            proclamationText: orderFormValue?.proclamationText?.proclamationText || "",
            partyType: respondentNameData?.partyType?.toLowerCase() || "accused",
          },
          respondentDetails: {
            name: respondentName,
            address: { ...respondentAddress?.[0], coordinate: respondentAddress?.[0]?.coordinates },
            phone: respondentPhoneNo?.[0] || "",
            email: respondentEmail?.[0] || "",
            age: "",
            gender: "",
            ...(ownerType && { ownerType: ownerType }),
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
            fees: await getCourtFee(
              "POLICE",
              respondentAddress?.[0]?.pincode,
              orderType === "WARRANT" || orderType === "PROCLAMATION" ? "WARRANT" : orderType
            ),
            feesStatus: "",
          },
        };
        break;
      case "ATTACHMENT":
        payload = {
          attachmentDetails: {
            issueDate: orderData?.auditDetails?.lastModifiedTime,
            caseFilingDate: caseDetails?.filingDate,
            docSubType: "Order authorising an attachment by the district magistrate or collector",
            templateType: "GENERIC",
            attachmentText: orderFormValue?.attachmentText?.attachmentText || "",
            district: orderFormValue?.district?.district || "",
            village: orderFormValue?.village?.village || "",
            chargeDays: orderFormValue?.chargeDays?.chargeDays || "",
            partyType: respondentNameData?.partyType?.toLowerCase() || "accused",
          },
          respondentDetails: {
            name: respondentName,
            address: { ...respondentAddress?.[0], coordinate: respondentAddress?.[0]?.coordinates },
            phone: respondentPhoneNo?.[0] || "",
            email: respondentEmail?.[0] || "",
            age: "",
            gender: "",
            ...(ownerType && { ownerType: ownerType }),
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
            fees: await getCourtFee(
              "POLICE",
              respondentAddress?.[0]?.pincode,
              orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType
            ),
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
      const channelPayloads = await Promise.all(
        selectedChannel?.map(async (item) => {
          let clonedPayload = JSON.parse(JSON.stringify(payload));

          const pincode = ["e-Post", "Registered Post", "Via Police"].includes(item?.type)
            ? item?.value?.pincode
            : clonedPayload?.respondentDetails?.address?.pincode;

          let courtFees = await getCourtFee(
            item?.code,
            pincode,
            orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType
          );

          if ("deliveryChannels" in clonedPayload) {
            clonedPayload.deliveryChannels = {
              ...clonedPayload.deliveryChannels,
              channelName: channelTypeEnum?.[item?.type]?.type,
              fees: courtFees,
              channelCode: channelTypeEnum?.[item?.type]?.code,
            };

            let address = {};
            if (orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" || item?.type === "Via Police") {
              address = {
                ...item?.value,
                locality: item?.value?.locality || "",
                coordinate: {
                  longitude: item?.value?.geoLocationDetails?.longitude,
                  latitude: item?.value?.geoLocationDetails?.latitude,
                },
              };
            } else if (["e-Post", "Registered Post"].includes(item?.type)) {
              const baseAddress = item?.value || {};
              address = {
                ...baseAddress,
                locality: item?.value?.locality || baseAddress?.locality || "",
                coordinate: item?.value?.coordinates || baseAddress?.coordinates || {},
              };
            } else {
              const baseAddress = respondentAddress[0] || {};
              address = {
                ...baseAddress,
                coordinate: baseAddress?.coordinates || {},
              };
            }

            const phone = item?.type === "SMS" ? item?.value : respondentPhoneNo?.[0] || "";
            const email = item?.type === "E-mail" ? item?.value : respondentEmail?.[0] || "";
            const commonDetails = { address, phone, email, age: "", gender: "" };

            clonedPayload.respondentDetails = {
              ...clonedPayload.respondentDetails,
              ...commonDetails,
            };

            if (clonedPayload?.witnessDetails) {
              clonedPayload.witnessDetails = {
                ...clonedPayload.witnessDetails,
                ...commonDetails,
              };
            }
          }

          return clonedPayload;
        })
      );
      return channelPayloads;
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
            createTask: true,
            taskStatus: "DRAFT_IN_PROGRESS",
            taskName: t("DRAFT_IN_PROGRESS_ISSUE_SUMMONS"),
            orderEntityType: "order-default",
          })
        )
      );
    } catch (error) {}
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
      await updateOrder(
        {
          ...currentOrder,
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
    sessionStorage.removeItem("fileStoreId");
    sessionStorage.removeItem("businessOfTheDay");
    setShowsignatureModal(false);
    setShowReviewModal(true);
  };
  const handleOrderChange = (index) => {
    setIsOrderChanged(true);
    setSelectedOrder(index);
  };
  const handleDownloadOrders = () => {
    const fileStoreId = sessionStorage.getItem("fileStoreId");
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

  const handleReviewOrderClick = async () => {
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

        if (["TAKE_COGNIZANCE", "DISMISS_CASE"].includes(orderType) && ["CASE_DISMISSED", "CASE_ADMITTED"].includes(caseDetails?.status)) {
          setShowErrorToast({
            label: "CASE_ADMITTED" === caseDetails?.status ? t("CASE_ALREADY_ADMITTED") : t("CASE_ALREADY_REJECTED"),
            error: true,
          });
          hasError = true;
          break;
        }

        if (["SCHEDULE_OF_HEARING_DATE"].includes(orderType) && (isHearingScheduled || isHearingInProgress || isHearingOptout)) {
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

        if (orderType === "NOTICE") {
          if (formData?.noticeOrder?.selectedChannels?.length === 0) {
            setShowErrorToast({ label: t("PLESE_SELECT_A_DELIVERY_CHANNEL_FOR_NOTICE_ORDER"), error: true });
            hasError = true;
            break;
          }
        }

        if (orderType === "SUMMONS") {
          if (formData?.SummonsOrder?.selectedChannels?.length === 0) {
            setShowErrorToast({ label: t("PLESE_SELECT_A_DELIVERY_CHANNEL_FOR_SUMMONS_ORDER"), error: true });
            hasError = true;
            break;
          } else if (
            formData?.SummonsOrder?.selectedChannels?.some(
              (channel) => channel?.code === "POLICE" && (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
            )
          ) {
            setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
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

          if (formData?.warrantFor?.selectedChannels?.length === 0) {
            setShowErrorToast({ label: t("PLESE_SELECT_ADDRESSS"), error: true });
            hasError = true;
            break;
          }

          if (
            formData?.warrantFor?.selectedChannels?.some(
              (channel) =>
                (channel?.code === "RPAD" || channel?.code === "POLICE") &&
                (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
            )
          ) {
            setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
            hasError = true;
            break;
          }
        }

        if (orderType === "PROCLAMATION") {
          if (formData?.proclamationFor?.selectedChannels?.length === 0) {
            setShowErrorToast({ label: t("PLESE_SELECT_ADDRESSS"), error: true });
            hasError = true;
            break;
          }

          if (
            formData?.proclamationFor?.selectedChannels?.some(
              (channel) =>
                (channel?.code === "RPAD" || channel?.code === "POLICE") &&
                (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
            )
          ) {
            setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
            hasError = true;
            break;
          }
        }

        if (orderType === "ATTACHMENT") {
          if (formData?.attachmentFor?.selectedChannels?.length === 0) {
            setShowErrorToast({ label: t("PLESE_SELECT_ADDRESSS"), error: true });
            hasError = true;
            break;
          }

          if (
            formData?.attachmentFor?.selectedChannels?.some(
              (channel) =>
                (channel?.code === "RPAD" || channel?.code === "POLICE") &&
                (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
            )
          ) {
            setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
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
    sessionStorage.removeItem("fileStoreId");
    if (successModalActionSaveLabel === t("CS_COMMON_CLOSE")) {
      setShowSuccessModal(false);
      history.push(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`, {
        from: "orderSuccessModal",
      });
      return;
    }
    if (successModalActionSaveLabel === t("ISSUE_SUMMONS_BUTTON")) {
      await handleIssueSummons(extractedHearingDate, newHearingNumber || hearingId || hearingNumber);
      history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${createdSummon}`);
    }
    if (successModalActionSaveLabel === t("ISSUE_NOTICE_BUTTON")) {
      await handleIssueNotice(extractedHearingDate, newHearingNumber || hearingId || hearingNumber);
      history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${createdNotice}`);
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("fileStoreId");
    setShowSuccessModal(false);
    history.push(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`, {
      from: "orderSuccessModal",
    });
  };

  const handleBulkCloseSuccessModal = () => {
    setShowBulkModal(false);
    history.push(`/${window.contextPath}/${userInfoType}/home/bulk-esign-order`);
  };

  if (!filingNumber) {
    history.push("/employee/home/home-screen");
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
  }, [currentOrder?.compositeItems, currentOrder?.orderCategory, currentOrder?.orderNumber, ordersData?.list]);

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
  }, [
    currentOrder?.orderCategory,
    currentOrder?.additionalDetails?.formdata?.orderType?.code,
    currentOrder?.additionalDetails?.formdata?.noticeType?.code,
    currentOrder?.compositeItems,
    caseDetails?.caseDetails?.delayApplications?.formdata,
    isDCANoticeGenerated,
    isDelayApplicationSubmitted,
    t,
  ]);

  if (
    loader ||
    isOrdersLoading ||
    isOrdersFetching ||
    isCaseDetailsLoading ||
    isApplicationDetailsLoading ||
    !ordersData?.list ||
    isHearingLoading ||
    isCourtIdsLoading ||
    isPublishedOrdersLoading ||
    !modifiedFormConfig
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
          showActions={(canESign || canSaveSignLater) && !currentDiaryEntry}
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
          orderPdfFileStoreID={orderPdfFileStoreID}
          saveOnsubmitLabel={"ISSUE_ORDER"}
          businessOfDay={businessOfTheDay}
          selectedOrder={selectedOrder}
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
