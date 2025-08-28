import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Header,
  Button,
  LabelFieldPair,
  CardHeader,
  CardLabel,
  CustomDropdown,
  ActionBar,
  SubmitBar,
  Loader,
  Toast,
  CardLabelError,
} from "@egovernments/digit-ui-react-components";
import { CustomAddIcon, OutlinedInfoIcon, RightArrow } from "../../../../dristi/src/icons/svgIndex";
import ReactTooltip from "react-tooltip";
import AddOrderTypeModal from "../../pageComponents/AddOrderTypeModal";
import OrderTypeControls from "../../components/OrderTypeControls";
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
  configsMoveCaseToLongPendingRegister,
  configsMoveCaseOutOfLongPendingRegister,
  attendeesOptions,
  purposeOfHearingConfig,
  nextDateOfHearing,
  configsCost,
  configsWitnessBatta,
} from "../../configs/ordersCreateConfig";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { SubmissionWorkflowState } from "../../utils/submissionWorkflow";
import { getAdvocates, getuuidNameMap } from "../../utils/caseUtils";
import _, { set } from "lodash";
import useSearchOrdersService from "../../hooks/orders/useSearchOrdersService";
import { OrderWorkflowAction, OrderWorkflowState } from "../../utils/orderWorkflow";
import { applicationTypes } from "../../utils/applicationTypes";
import { HearingWorkflowState } from "../../utils/hearingWorkflow";
import { ordersService, taskService } from "../../hooks/services";
import { getRespondantName, getComplainantName, constructFullName, removeInvalidNameParts, getFormattedName } from "../../utils";
import {
  channelTypeEnum,
  checkValidation,
  CloseBtn,
  compositeOrderAllowedTypes,
  formatDate,
  generateAddress,
  getFormData,
  getMandatoryFieldsErrors,
  getOrderData,
  getParties,
  getUpdateDocuments,
  Heading,
  prepareUpdatedOrderData,
} from "../../utils/orderUtils";
import { addOrderItem, createOrder, deleteOrderItem, getCourtFee } from "../../utils/orderApiCallUtils";
import OrderReviewModal from "../../pageComponents/OrderReviewModal";
import OrderSignatureModal from "../../pageComponents/OrderSignatureModal";
import OrderSucessModal from "../../pageComponents/OrderSucessModal";
import OrderAddToBulkSuccessModal from "../../pageComponents/OrderAddToBulkSuccessModal";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import MandatoryFieldsErrorModal from "./MandatoryFieldsErrorModal";
import TasksComponent from "../../../../home/src/components/TaskComponent";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import CompositeOrdersErrorModal from "./CompositeOrdersErrorModal";

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
  MOVE_CASE_TO_LONG_PENDING_REGISTER: configsMoveCaseToLongPendingRegister,
  MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER: configsMoveCaseOutOfLongPendingRegister,
  COST: configsCost,
  WITNESS_BATTA: configsWitnessBatta,
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
  COST: 3,
  WITNESS_BATTA: 3,
};

const dayInMillisecond = 24 * 3600 * 1000;

const GenerateOrdersV2 = () => {
  const { t } = useTranslation();
  const history = useHistory();
  // Component state and hooks can be added here as needed
  const [presentAttendees, setPresentAttendees] = useState([]);
  const [absentAttendees, setAbsentAttendees] = useState([]);
  const [purposeOfHearing, setPurposeOfHearing] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState("");
  const [skipScheduling, setSkipScheduling] = useState(false);
  const [showEditOrderModal, setEditOrderModal] = useState(false);
  const [showAddOrderModal, setAddOrderModal] = useState(false);
  const EditSendBackModal = Digit?.ComponentRegistryService?.getComponent("EditSendBackModal");
  const [orderType, setOrderType] = useState({}); // not sure it needed
  const [showOrderValidationModal, setShowOrderValidationModal] = useState({ showModal: false, errorMessage: "" });
  const [orderTitle, setOrderTitle] = useState(null);
  const submitButtonRefs = useRef([]);
  const setValueRef = useRef([]);
  const formStateRef = useRef([]);
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
  const [caseApiError, setCaseApiError] = useState(undefined);
  // Flag to prevent multiple breadcrumb updates
  const isBreadCrumbsParamsDataSet = useRef(false);
  const [isBailBondTaskExists, setIsBailBondTaskExists] = useState(false);
  const [bailBondLoading, setBailBondLoading] = useState(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const todayDate = new Date().getTime();
  const [showBailBondModal, setShowBailBondModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [addOrderTypeLoader, setAddOrderTypeLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const judgeName = localStorage.getItem("judgeName");
  const [signedDoucumentUploadedID, setSignedDocumentUploadID] = useState("");
  const [fileStoreIds, setFileStoreIds] = useState(new Set()); // TODO: need to check usage
  const [orderPdfFileStoreID, setOrderPdfFileStoreID] = useState(null); // TODO: need to check usage
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [prevOrder, setPrevOrder] = useState();
  const [deleteOrderItemIndex, setDeleteOrderItemIndex] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showsignatureModal, setShowsignatureModal] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [currentPublishedOrder, setCurrentPublishedOrder] = useState(null);
  const canESign = roles?.some((role) => role.code === "ORDER_ESIGN");
  const canSaveSignLater = roles?.some((role) => role.code === "ORDER_APPROVER");
  const currentDiaryEntry = history.location?.state?.diaryEntry;
  const [businessOfTheDay, setBusinessOfTheDay] = useState(null);
  const toast = useToast();
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const [createdSummon, setCreatedSummon] = useState(null);
  const [createdNotice, setCreatedNotice] = useState(null);
  const [showMandatoryFieldsErrorModal, setShowMandatoryFieldsErrorModal] = useState({ showModal: false, errorsData: [] });
  const [taskType, setTaskType] = useState({});
  const [errors, setErrors] = useState({});
  const [warrantSubtypeCode, setWarrantSubtypeCode] = useState("");
  const [data, setData] = useState([]);
  const isJudge = roles?.some((role) => role.code === "JUDGE_ROLE");
  const isCourtRoomManager = roles?.some((role) => role.code === "COURT_ROOM_MANAGER");
  const isBenchClerk = roles?.some((role) => role.code === "BENCH_CLERK");
  const isTypist = roles?.some((role) => role.code === "TYPIST_ROLE");
  const [itemTextNull, setItemTextNull] = useState(false);

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

  const fetchInbox = useCallback(async () => {
    try {
      const now = new Date();
      const fromDate = new Date(now.setHours(0, 0, 0, 0)).getTime();
      const toDate = new Date(now.setHours(23, 59, 59, 999)).getTime();

      const payload = {
        inbox: {
          processSearchCriteria: {
            businessService: ["hearing-default"],
            moduleName: "Hearing Service",
            tenantId: "kl",
          },
          moduleSearchCriteria: {
            tenantId: "kl",
            ...(fromDate && toDate ? { fromDate, toDate } : {}),
          },
          tenantId: "kl",
          limit: 300,
          offset: 0,
        },
      };

      const res = await HomeService.InboxSearch(payload, { tenantId: "kl" });
      setData(res?.items || []);
    } catch (err) {
      console.error("error", err);
    } finally {
    }
  }, []);

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

  const caseCourtId = useMemo(() => caseDetails?.courtId || localStorage.getItem("courtId"), [caseDetails]);
  const hearingNumber = useMemo(() => currentOrder?.hearingNumber || currentOrder?.additionalDetails?.hearingId || "", [currentOrder]);

  const { data: ordersData, refetch: refetchOrdersData, isLoading: isOrdersLoading, isFetching: isOrdersFetching } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        orderNumber: orderNumber,
        status: OrderWorkflowState.DRAFT_IN_PROGRESS,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.DRAFT_IN_PROGRESS,
    Boolean(filingNumber && caseCourtId)
  );

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

  const applicationDetails = useMemo(
    () =>
      applicationData?.applicationList?.find(
        (application) => application?.applicationNumber === currentOrder?.additionalDetails?.formdata?.refApplicationId
      ),
    [applicationData, currentOrder]
  );

  const hearingId = useMemo(() => currentOrder?.hearingNumber || applicationDetails?.additionalDetails?.hearingId || "", [
    applicationDetails,
    currentOrder,
  ]);

  const { data: hearingsData, isFetching: isHearingFetching, refetch: refetchHearing } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: hearingId || hearingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const currentInProgressHearing = useMemo(() => hearingsData?.HearingList?.find((list) => list?.status === "IN_PROGRESS"), [
    hearingsData?.HearingList,
  ]);

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

  const { data: orderTypeData, isLoading: isOrderTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Order",
    [{ name: "OrderType" }],
    {
      select: (data) => {
        return _.get(data, "Order.OrderType", [])
          .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
          .map((opt) => ({ ...opt }));
      },
    }
  );

  const { data: purposeOfHearingData, isLoading: isPurposeOfHearingLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Hearing",
    [{ name: "HearingType" }],
    {
      select: (data) => {
        return _.get(data, "Hearing.HearingType", [])
          .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
          .map((opt) => ({ ...opt }));
      },
    }
  );

  const { data: courtRoomDetails, isLoading: isCourtIdsLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "Court_Rooms" },
  ]);
  const courtRooms = useMemo(() => courtRoomDetails?.Court_Rooms || [], [courtRoomDetails]);

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
      caseDetails?.additionalDetails?.witnessDetails?.formdata?.map((data) => {
        const fullName = getFormattedName(data?.data?.firstName, data?.data?.middleName, data?.data?.lastName, data?.data?.witnessDesignation, null);
        return { code: fullName, name: `${fullName} (Witness)`, uuid: data?.data?.uuid, partyType: "witness" };
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
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`DISMISS_CASE`, `SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`, `COST`, `WITNESS_BATTA`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
      } else {
        updatedConfig[0].body[0].populators.mdmsConfig.select =
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`TAKE_COGNIZANCE`, `DISMISS_CASE`, `SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`,`COST`, `WITNESS_BATTA`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
      }
    } else if (caseDetails?.courtCaseNumber) {
      if (caseDetails?.isLPRCase) {
        updatedConfig[0].body[0].populators.mdmsConfig.select =
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`, `MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER`,`COST`, `WITNESS_BATTA`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
      } else if (!caseDetails?.lprNumber) {
        updatedConfig[0].body[0].populators.mdmsConfig.select =
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`, `MOVE_CASE_TO_LONG_PENDING_REGISTER`,`COST`, `WITNESS_BATTA`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
      }
    }
    return updatedConfig;
  }, [caseDetails, isDelayApplicationPending]);

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

  useEffect(() => {
    const isBailBondPendingTaskPresent = async () => {
      try {
        const bailBondPendingTask = await HomeService.getPendingTaskService(
          {
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                assignedRole: [...roles], //judge.clerk,typist
                filingNumber: filingNumber,
                courtId: courtId,
                entityType: "bail bond",
              },
              limit: 10000,
              offset: 0,
            },
          },
          { tenantId }
        );
        if (bailBondPendingTask?.data?.length > 0) {
          setIsBailBondTaskExists(true);
        }
      } catch (err) {
        console.log(err);
      }
    };
    if (userType === "employee") isBailBondPendingTaskPresent();
  }, [userType]);

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

  const nextHearing = useCallback(
    (isStartHearing) => {
      if (data?.length === 0) {
        history.push(`/${window?.contextPath}/employee/home/home-screen`);
      } else {
        const validData = data?.filter((item) => ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS"]?.includes(item?.businessObject?.hearingDetails?.status));
        const index = validData?.findIndex((item) => item?.businessObject?.hearingDetails?.hearingNumber === currentInProgressHearing?.hearingId);
        if (index === -1 || validData?.length === 1) {
          history.push(`/${window?.contextPath}/employee/home/home-screen`);
        } else {
          const row = validData[(index + 1) % validData?.length];
          if (["SCHEDULED", "PASSED_OVER"].includes(row?.businessObject?.hearingDetails?.status)) {
            if (isStartHearing) {
              hearingService
                .searchHearings(
                  {
                    criteria: {
                      hearingId: row?.businessObject?.hearingDetails?.hearingNumber,
                      tenantId: row?.businessObject?.hearingDetails?.tenantId,
                      ...(row?.businessObject?.hearingDetails?.courtId &&
                        userType === "employee" && { courtId: row?.businessObject?.hearingDetails?.courtId }),
                    },
                  },
                  { tenantId: row?.businessObject?.hearingDetails?.tenantId }
                )
                .then((response) => {
                  hearingService.startHearing({ hearing: response?.HearingList?.[0] }).then(() => {
                    window.location = `/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`;
                  });
                })
                .catch((error) => {
                  console.error("Error starting hearing", error);
                  history.push(`/${window?.contextPath}/employee/home/home-screen`);
                });
            } else {
              history.push(
                `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`
              );
            }
          } else {
            history.push(
              `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`
            );
          }
        }
      }
    },
    [currentInProgressHearing?.hearingId, data, history, userType]
  );

  // TODO: temporary Form Config, need to be replaced with the actual config
  const getModifiedFormConfig = useCallback(
    (compositeActiveOrderIndex) => {
      const newConfig =
        applicationTypeConfigUpdated?.map((item) => ({
          ...item,
          body: item.body.map((input) => ({
            ...input,
            disable: true,
          })),
        })) || [];

      let formConfig = [...newConfig];
      let selectedOrderType = "";
      if (currentOrder?.orderCategory === "COMPOSITE") {
        selectedOrderType = currentOrder?.compositeItems?.[compositeActiveOrderIndex]?.orderType || orderType?.code || "";
      } else {
        selectedOrderType = currentOrder?.orderType || orderType?.code || "";
      }

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
                const isRejected = currentOrder?.additionalDetails?.applicationStatus === t("REJECTED");
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
                return field;
              }),
            };
          });
        }

        if (["COST", "WITNESS_BATTA"]?.includes(selectedOrderType)) {
          orderTypeForm = orderTypeForm?.map((section) => {
            return {
              ...section,
              body: section.body.map((field) => {
                if (field.key === "paymentToBeMadeBy") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: [...complainants, ...respondents],
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
      currentOrder,
      applicationTypeConfigUpdated,
      orderType?.code,
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
      warrantSubtypeCode,
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

        updatedFormdata.caseNumber = caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber;
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

      if (currentOrderType === "BAIL") {
        updatedFormdata.bailType = { type: newApplicationDetails?.applicationType };
        setValueRef?.current?.[index]?.("bailType", updatedFormdata.bailType);

        updatedFormdata.submissionDocuments = newApplicationDetails?.additionalDetails?.formdata?.submissionDocuments;
        setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);

        updatedFormdata.bailOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
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
        setValueRef?.current?.[index]?.("bailParty", updatedFormdata.bailParty);
        setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);
      }

      // if (orderType === "CASE_TRANSFER") {
      //   updatedFormdata.caseTransferredTo = applicationDetails?.applicationDetails?.selectRequestedCourt;
      // setValueRef?.current?.[index]?.("caseTransferredTo", updatedFormdata.caseTransferredTo);
      //   updatedFormdata.grounds = { text: applicationDetails?.applicationDetails?.groundsForSeekingTransfer };
      // setValueRef?.current?.[index]?.("grounds", updatedFormdata.grounds);

      // }

      // if (currentOrderType === "WITHDRAWAL_ACCEPT") {
      //   if (newApplicationDetails?.applicationType === applicationTypes.WITHDRAWAL) {
      //     updatedFormdata.applicationOnBehalfOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
      //     setValueRef?.current?.[index]?.("applicationOnBehalfOf", updatedFormdata.applicationOnBehalfOf);

      //     updatedFormdata.partyType = t(newApplicationDetails?.additionalDetails?.partyType);
      //     setValueRef?.current?.[index]?.("partyType", updatedFormdata.partyType);

      //     updatedFormdata.reasonForWithdrawal = t(newApplicationDetails?.additionalDetails?.formdata?.reasonForWithdrawal?.code);
      //     setValueRef?.current?.[index]?.("reasonForWithdrawal", updatedFormdata.reasonForWithdrawal);
      //   }
      // }

      // if (currentOrderType === "WITHDRAWAL_REJECT") {
      //   if (newApplicationDetails?.applicationType === applicationTypes.WITHDRAWAL) {
      //     updatedFormdata.applicationOnBehalfOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
      //     setValueRef?.current?.[index]?.("applicationOnBehalfOf", updatedFormdata.applicationOnBehalfOf);

      //     updatedFormdata.partyType = t(newApplicationDetails?.additionalDetails?.partyType);
      //     setValueRef?.current?.[index]?.("partyType", updatedFormdata.partyType);

      //     updatedFormdata.reasonForWithdrawal = t(newApplicationDetails?.additionalDetails?.formdata?.reasonForWithdrawal?.code);
      //     setValueRef?.current?.[index]?.("reasonForWithdrawal", updatedFormdata.reasonForWithdrawal);
      //   }
      // }

      if (currentOrderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
        if (newApplicationDetails?.applicationType === applicationTypes.EXTENSION_SUBMISSION_DEADLINE) {
          updatedFormdata.documentName = newApplicationDetails?.additionalDetails?.formdata?.documentType?.value;
          setValueRef?.current?.[index]?.("documentName", updatedFormdata.documentName);

          updatedFormdata.originalDeadline = newApplicationDetails?.additionalDetails?.formdata?.initialSubmissionDate;
          setValueRef?.current?.[index]?.("originalDeadline", updatedFormdata.originalDeadline);

          // updatedFormdata.proposedSubmissionDate = newApplicationDetails?.additionalDetails?.formdata?.changedSubmissionDate;
          // setValueRef?.current?.[index]?.("proposedSubmissionDate", updatedFormdata.proposedSubmissionDate);

          // updatedFormdata.originalSubmissionOrderDate = newApplicationDetails?.additionalDetails?.orderDate;
          // setValueRef?.current?.[index]?.("originalSubmissionOrderDate", updatedFormdata.originalSubmissionOrderDate);
        }
      }

      if (currentOrderType === "SUMMONS") {
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
      if (currentOrderType === "NOTICE") {
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
      if (currentOrderType === "WARRANT" || currentOrderType === "PROCLAMATION" || currentOrderType === "ATTACHMENT") {
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
        ].includes(currentOrderType)
      ) {
        updatedFormdata.originalHearingDate =
          newCurrentOrder?.additionalDetails?.formdata?.originalHearingDate ||
          newApplicationDetails?.additionalDetails?.formdata?.initialHearingDate ||
          "";
        setValueRef?.current?.[index]?.("originalHearingDate", updatedFormdata.originalHearingDate);
      }
      // setCurrentFormData(updatedFormdata); // TODO: check and update setCurrentFormData here and update where ever currentFormData is being used.
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

  // TODO: check logic here
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

  const { data: bailPendingTaskExpiry } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "common-masters",
    [{ name: "pendingTaskExpiry" }],
    {
      select: (data) => {
        return data?.["common-masters"]?.pendingTaskExpiry || [];
      },
    }
  );
  const bailPendingTaskExpiryDays = useMemo(() => {
    return bailPendingTaskExpiry?.find((data) => data?.enitiyName === "BAIL_BONDS_REVIEW")?.noofdaysforexpiry || 0;
  }, [bailPendingTaskExpiry]);

  const handleEditOrder = () => {
    setEditOrderModal(true);
  };

  const handleEditConfirmationOrder = () => {
    setAddOrderModal(true);
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
              orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
              tenantId
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
            docSubType: "Proclamation requiring the apperance of a person accused",
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
              orderType === "WARRANT" || orderType === "PROCLAMATION" ? "WARRANT" : orderType,
              tenantId
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
            docSubType: "Attachment requiring the apperance of a person accused",
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
              orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
              tenantId
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
            orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
            tenantId
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
      const updatedDocuments = getUpdateDocuments(documents, documentsFile, signedDoucumentUploadedID, fileStoreIds);
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

      const parties = getParties(
        order?.orderType,
        {
          ...orderSchema,
          orderDetails: { ...(order?.orderDetails || {}), ...orderSchema?.orderDetails },
        },
        allParties
      );
      orderSchema = { ...orderSchema, orderDetails: { ...(order?.orderDetails || {}), ...orderSchema?.orderDetails, parties: parties } };
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
              ...((hearingNumber || hearingDetails?.hearingId) && {
                hearingNumber: hearingNumber || hearingDetails?.hearingId,
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

  const handleSaveDraft = async (updatedOrderData) => {
    try {
      setIsLoading(true);
      let updatedOrder;
      let updateOrderResponse = {};
      if (updatedOrderData?.orderCategory === "INTERMEDIATE") {
        if (updatedOrderData?.orderType) {
          updatedOrder = structuredClone(updatedOrderData);
          updatedOrder.orderTitle = t(updatedOrderData?.orderTitle);

          if (updatedOrder?.orderNumber) {
            updateOrderResponse = await updateOrder(updatedOrder, OrderWorkflowAction.SAVE_DRAFT);
          } else {
            updateOrderResponse = await createOrder(updatedOrder, tenantId, applicationTypeConfigUpdated, configKeys, caseDetails);
          }
        }
      } else {
        if (updatedOrderData?.orderNumber) {
          updatedOrder = {
            ...updatedOrderData,
            compositeItems: updatedOrderData?.compositeItems?.filter((item) => item?.isEnabled),
            itemText: itemTextNull ? null : updatedOrderData?.itemText,
          };
          updateOrderResponse = await addOrderItem(
            updatedOrder,
            OrderWorkflowAction.SAVE_DRAFT,
            tenantId,
            applicationTypeConfigUpdated,
            configKeys,
            caseDetails
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
            updateOrderResponse = await createOrder(updatedOrder, tenantId, applicationTypeConfigUpdated, configKeys, caseDetails);
          } else {
            const updatedOrder = structuredClone(updatedOrderData);
            const enabledCompositeItems = updatedOrderData?.compositeItems?.filter((item) => item?.isEnabled);
            updatedOrder.compositeItems = enabledCompositeItems;
            updateOrderResponse = await addOrderItem(
              updatedOrder,
              OrderWorkflowAction.SAVE_DRAFT,
              tenantId,
              applicationTypeConfigUpdated,
              configKeys,
              caseDetails
            );
          }
        }
      }
      return updateOrderResponse;
    } catch (error) {
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentUpload = async (fileData, filename) => {
    if (fileData?.fileStore) return fileData;
    const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  };

  const replaceUploadedDocsWithCombinedFile = async (formData) => {
    try {
      const docsArray = formData?.lprDocuments?.documents;
      if (!Array.isArray(docsArray) || docsArray.length === 0) {
        return formData;
      }
      const uploadedDocs = await Promise.all(
        docsArray.map(async (fileData) => {
          if (fileData?.fileStore) {
            return fileData;
          }
          try {
            const docs = await onDocumentUpload(fileData, fileData?.name);
            return {
              documentType: docs?.fileType || "application/pdf",
              fileStore: docs?.file?.files?.[0]?.fileStoreId || null,
              additionalDetails: { name: docs?.filename || fileData?.name || "lpr" },
            };
          } catch (err) {
            console.error("Error uploading document:", fileData, err);
            return null;
          }
        })
      );
      formData.lprDocuments.documents = uploadedDocs.filter(Boolean);
      return formData;
    } catch (err) {
      console.error("replaceUploadedDocsWithCombinedFile failed:", err);
      throw err;
    }
  };

  const handleAddOrder = async (orderFormData, compOrderIndex) => {
    try {
      if (checkValidation(t, orderFormData, compOrderIndex, setFormErrors, setShowErrorToast)) {
        return;
      }
      setAddOrderTypeLoader(true);
      const updatedFormData = await replaceUploadedDocsWithCombinedFile(orderFormData);
      const updatedOrderData = prepareUpdatedOrderData(currentOrder, updatedFormData, compOrderIndex);
      const updateOrderResponse = await handleSaveDraft(updatedOrderData);
      setCurrentOrder(updateOrderResponse?.order);
      setAddOrderTypeLoader(false);
      setAddOrderModal(false);
      setEditOrderModal(false);

      if (!orderNumber) {
        history.replace(
          `/${window.contextPath}/employee/orders/generate-orders?filingNumber=${caseDetails?.filingNumber}&orderNumber=${updateOrderResponse?.order?.orderNumber}`
        );
      } else {
        await refetchOrdersData();
      }
    } catch (error) {
      console.error("Error while saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      setAddOrderTypeLoader(false);
    }
  };

  const handleReviewOrderClick = async () => {
    const items = structuredClone(currentOrder?.orderCategory === "INTERMEDIATE" ? [currentOrder] : currentOrder?.compositeItems);
    let hasError = false;
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
    const errors = getMandatoryFieldsErrors(getModifiedFormConfig, currentOrder);

    if (errors?.some((obj) => obj?.errors?.length > 0)) {
      setShowMandatoryFieldsErrorModal({ showModal: true, errorsData: errors });
      return;
    }

    const mandatoryOrderFields = [{ itemText: currentOrder?.itemText }];

    if (currentInProgressHearing) {
      mandatoryOrderFields?.push({ presentAttendees: currentOrder?.attendance?.Present }, { absentAttendees: currentOrder?.attendance?.Absent });
      if (!skipScheduling) {
        mandatoryOrderFields?.push({ nextHearingDate: currentOrder?.nextHearingDate }, { hearingPurpose: currentOrder?.purposeOfNextHearing });
      }
    }

    // Collect all errors first
    const allErrors = {};
    mandatoryOrderFields?.forEach((field) => {
      const [key, value] = Object?.entries(field)[0];
      if (!value || (Array?.isArray(value) && value?.length === 0)) {
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
    const orderTypeValidationObj = checkOrderValidation(orderType?.code, index);
    if (orderTypeValidationObj?.showModal) {
      setShowOrderValidationModal(orderTypeValidationObj);
      return;
    }
    setCompositeOrderIndex(index !== null ? index : 0);
    setOrderType(orderType);
    setAddOrderModal(true);
  };

  const createBailBondTask = async () => {
    setBailBondLoading(true);
    try {
      const bailBondPendingTask = await HomeService.getPendingTaskService(
        {
          SearchCriteria: {
            tenantId,
            moduleName: "Pending Tasks Service",
            moduleSearchCriteria: {
              isCompleted: false,
              assignedRole: [...roles],
              filingNumber: filingNumber,
              courtId: courtId,
              entityType: "bail bond",
            },
            limit: 10,
            offset: 0,
          },
        },
        { tenantId }
      );

      if (bailBondPendingTask?.data?.length > 0) {
        setIsBailBondTaskExists(true);
        setShowErrorToast({
          label: t("BAIL_BOND_TASK_ALREADY_EXISTS"),
          error: true,
        });
        return;
      } else {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: t("CS_COMMON_BAIL_BOND"),
            entityType: "bail bond",
            referenceId: `MANUAL_BAIL_BOND_${filingNumber}`,
            status: "PENDING_SIGN",
            assignedTo: [],
            assignedRole: ["JUDGE_ROLE", "BENCH_CLERK", "COURT_ROOM_MANAGER"],
            actionCategory: "Bail Bond",
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: false,
            expiryDate: bailPendingTaskExpiryDays * 24 * 60 * 60 * 1000 + todayDate,
            stateSla: todayDate,
            additionalDetails: {},
            tenantId,
          },
        });
        setTimeout(() => {
          setBailBondLoading(false);
          setIsBailBondTaskExists(true);
          setShowBailBondModal(false);
        }, 1000);
      }
    } catch (e) {
      console.log(e);
      setBailBondLoading(false);

      setShowErrorToast({
        label: t("UNABLE_TO_CREATE_BAIL_BOND_TASK"),
        error: true,
      });
    }
  };

  const handleAddForm = () => {
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
        setItemTextNull(true);
      } else {
        setItemTextNull(false);
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
      orderTitle: updatedItems.orderTitle,
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
              await refetchOrdersData(); // hard refresh
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
              compositeItems: updatedCompositeItems?.filter((o) => o?.orderType),
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
                file, // already uploaded doc or file object
                sourceType: "COURT",
                sourceID: userInfo?.uuid,
                filingType: "DIRECT",
                additionalDetails: {
                  uuid: userInfo?.uuid,
                },
              },
            };
            return DRISTIService.createEvidence(evidenceReqBody);
          })
        );
      }

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
      setIsLoading(false);
    }
  };

  const handleGoBackSignatureModal = () => {
    sessionStorage.removeItem("fileStoreId");
    sessionStorage.removeItem("businessOfTheDay");
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
    history.replace(`/${window.contextPath}/${userInfoType}/home/bulk-esign-order`);
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
      await handleIssueSummons(extractedHearingDate, hearingId || hearingNumber);
      history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${createdSummon}`);
    }
    if (successModalActionSaveLabel === t("ISSUE_NOTICE_BUTTON")) {
      await handleIssueNotice(extractedHearingDate, hearingId || hearingNumber);
      history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}&orderNumber=${createdNotice}`);
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("fileStoreId");
    setShowSuccessModal(false);
    history.push(`/${window.contextPath}/employee/dristi/home/view-case?tab=${"Orders"}&caseId=${caseDetails?.id}&filingNumber=${filingNumber}`, {
      from: "orderSuccessModal",
      needCaseRefetch: true,
    });
  };

  if (isLoading || isCaseDetailsLoading || isHearingFetching || bailBondLoading || isOrderTypeLoading || isPurposeOfHearingLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="generate-orders-v2-content">
        <div className="generate-orders-v2-header">
          <Header>{`${t("CS_ORDER")} : ${caseDetails?.caseTitle}`}</Header>
          {currentInProgressHearing && (
            <Button
              variation={"primary"}
              label={t(isBenchClerk || isCourtRoomManager ? "CS_CASE_END_HEARING" : isJudge || isTypist ? "CS_CASE_NEXT_HEARING" : "")}
              children={isBenchClerk || isCourtRoomManager ? null : isJudge || isTypist ? <RightArrow /> : null}
              isSuffix={true}
              onButtonClick={() => nextHearing(false)}
              style={{
                boxShadow: "none",
                ...(isBenchClerk || isCourtRoomManager ? { backgroundColor: "#BB2C2F", border: "none" } : {}),
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
              uuid={userInfo?.uuid}
              userInfoType={userInfoType}
              filingNumber={filingNumber}
              inCase={true}
              hideFilters={true}
              isApplicationCompositeOrder={true}
              compositeOrderObj={currentOrder}
            />
            {currentInProgressHearing && (
              <React.Fragment>
                <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left" }}>
                  <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>{t("MARK_WHO_IS_PRESENT")}</CardHeader>

                  <div className="checkbox-group">
                    {attendeesOptions?.map((option, index) => (
                      <div className="checkbox-item" key={index}>
                        <input
                          id={`present-${option.code}`}
                          type="checkbox"
                          className="custom-checkbox"
                          onChange={(e) => {
                            let updatedPresentAttendees;
                            let updatedAbsentAttendees;
                            if (e.target.checked) {
                              // Add to present attendees
                              updatedPresentAttendees = [...presentAttendees, option];
                              setPresentAttendees(updatedPresentAttendees);

                              // Remove from absent attendees if present there
                              updatedAbsentAttendees = absentAttendees.filter((item) => item.code !== option.code);
                              setAbsentAttendees(updatedAbsentAttendees);
                              setErrors((prevErrors) => {
                                const newErrors = { ...prevErrors };
                                delete newErrors["presentAttendees"];
                                return newErrors;
                              });
                            } else {
                              // Remove from present attendees
                              updatedPresentAttendees = presentAttendees.filter((item) => item.code !== option.code);
                              setPresentAttendees(updatedPresentAttendees);
                              updatedAbsentAttendees = absentAttendees;
                            }

                            // Update currentOrder.attendance
                            setCurrentOrder({
                              ...currentOrder,
                              attendance: {
                                Present: updatedPresentAttendees.map((item) => item.code),
                                Absent: updatedAbsentAttendees.map((item) => item.code),
                              },
                            });
                          }}
                          checked={presentAttendees.some((item) => item.code === option.code)}
                          disabled={absentAttendees.some((item) => item.code === option.code)}
                          style={{ cursor: "pointer", width: "20px", height: "20px" }}
                        />
                        <label htmlFor={`present-${option.code}`}>{t(option?.name)}</label>
                      </div>
                    ))}
                  </div>
                  {errors["presentAttendees"] && (
                    <CardLabelError> {t(errors["presentAttendees"]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>
                  )}
                </LabelFieldPair>

                <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left", marginTop: "12px" }}>
                  <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>{t("MARK_WHO_IS_ABSENT")}</CardHeader>

                  <div className="checkbox-group">
                    {attendeesOptions?.map((option, index) => (
                      <div className="checkbox-item" key={index}>
                        <input
                          id={`absent-${option.code}`}
                          type="checkbox"
                          className="custom-checkbox"
                          onChange={(e) => {
                            let updatedPresentAttendees;
                            let updatedAbsentAttendees;

                            if (e.target.checked) {
                              // Add to absent attendees
                              updatedAbsentAttendees = [...absentAttendees, option];
                              setAbsentAttendees(updatedAbsentAttendees);

                              // Remove from present attendees if present there
                              updatedPresentAttendees = presentAttendees?.filter((item) => item?.code !== option?.code);
                              setPresentAttendees(updatedPresentAttendees);
                              setErrors((prevErrors) => {
                                const newErrors = { ...prevErrors };
                                delete newErrors["absentAttendees"];
                                return newErrors;
                              });
                            } else {
                              // Remove from absent attendees
                              updatedAbsentAttendees = absentAttendees?.filter((item) => item?.code !== option?.code);
                              setAbsentAttendees(updatedAbsentAttendees);
                              updatedPresentAttendees = presentAttendees;
                            }

                            // Update currentOrder.attendance
                            setCurrentOrder({
                              ...currentOrder,
                              attendance: {
                                Present: updatedPresentAttendees.map((item) => item.code),
                                Absent: updatedAbsentAttendees.map((item) => item.code),
                              },
                            });
                          }}
                          checked={absentAttendees?.some((item) => item?.code === option?.code)}
                          disabled={presentAttendees?.some((item) => item?.code === option?.code)}
                          style={{ cursor: "pointer", width: "20px", height: "20px" }}
                        />
                        <label htmlFor={`absent-${option.code}`}>{t(option?.name)}</label>
                      </div>
                    ))}
                  </div>
                  {errors["absentAttendees"] && <CardLabelError> {t(errors["absentAttendees"]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>}
                </LabelFieldPair>
              </React.Fragment>
            )}

            <LabelFieldPair className="order-type-dropdown">
              <OrderTypeControls
                t={t}
                currentOrder={currentOrder}
                orderTypeData={orderTypeData}
                orderTypeConfig={{
                  ...applicationTypeConfigUpdated?.[0]?.body[0],
                  populators: {
                    ...applicationTypeConfigUpdated?.[0]?.body[0]?.populators,
                    styles: { maxWidth: "75%" },
                  },
                }}
                setOrderType={setOrderType}
                setCompositeOrderIndex={setCompositeOrderIndex}
                handleEditOrder={handleEditOrder}
                setDeleteOrderItemIndex={setDeleteOrderItemIndex}
                handleOrderTypeChange={handleOrderTypeChange}
              />
              <div style={{ marginBottom: "10px" }}>
                <Button
                  variation="secondary"
                  onButtonClick={() => {
                    handleAddForm();
                  }}
                  className="add-new-form"
                  icon={<CustomAddIcon width="16px" height="16px" />}
                  label={t("ADD_ITEM")}
                  style={{ border: "none" }}
                ></Button>
              </div>
            </LabelFieldPair>

            {currentInProgressHearing && (
              <React.Fragment>
                <div className="checkbox-item">
                  <input
                    id="skip-scheduling"
                    type="checkbox"
                    className="custom-checkbox"
                    onChange={() => {
                      const newSkipValue = !skipScheduling;
                      setSkipScheduling(newSkipValue);
                      if (newSkipValue) {
                        // Clear purpose and date when skipping
                        setCurrentOrder({ ...currentOrder, purposeOfNextHearing: "", nextHearingDate: "" });
                        setPurposeOfHearing("");
                        setNextHearingDate("");
                        setErrors((prevErrors) => {
                          const newErrors = { ...prevErrors };
                          delete newErrors["hearingPurpose"];
                          delete newErrors["nextHearingDate"];
                          return newErrors;
                        });
                      }
                    }}
                    checked={skipScheduling}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  />
                  <label htmlFor="skip-scheduling">{t("SKIP_SCHEDULING_NEXT_HEARING")}</label>
                </div>

                <LabelFieldPair className="purpose-hearing-dropdown">
                  <CardLabel className={`purpose-hearing-dropdown-label ${skipScheduling ? "disabled" : ""}`}>
                    {t(purposeOfHearingConfig?.label)}
                  </CardLabel>
                  <CustomDropdown
                    t={t}
                    onChange={(e) => {
                      setCurrentOrder({ ...currentOrder, purposeOfNextHearing: e?.code });
                      setPurposeOfHearing(e);
                      if (e?.code) {
                        setErrors((prevErrors) => {
                          const newErrors = { ...prevErrors };
                          delete newErrors["hearingPurpose"];
                          return newErrors;
                        });
                      }
                    }}
                    value={purposeOfHearing || purposeOfHearingData?.find((item) => item?.code === currentOrder?.purposeOfNextHearing)}
                    config={purposeOfHearingConfig?.populators}
                    disable={skipScheduling}
                  ></CustomDropdown>
                  {errors[purposeOfHearingConfig?.key] && (
                    <CardLabelError> {t(errors[purposeOfHearingConfig?.key]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>
                  )}
                </LabelFieldPair>

                <LabelFieldPair className={`case-label-field-pair`} style={{ width: "75%" }}>
                  <CardLabel className={`case-input-label ${skipScheduling ? "disabled" : ""}`}> {t(nextDateOfHearing?.label)}</CardLabel>
                  <CustomDatePickerV2
                    t={t}
                    config={nextDateOfHearing}
                    formData={{ nextHearingDate: nextHearingDate || currentOrder?.nextHearingDate }}
                    onDateChange={(date) => {
                      setCurrentOrder({ ...currentOrder, nextHearingDate: new Date(date).setHours(0, 0, 0, 0) });
                      setNextHearingDate(new Date(date).setHours(0, 0, 0, 0));
                      setErrors((prevErrors) => {
                        const newErrors = { ...prevErrors };
                        delete newErrors["nextHearingDate"];
                        return newErrors;
                      });
                    }}
                    value={nextHearingDate || currentOrder?.nextHearingDate}
                    disable={skipScheduling}
                    disableColor="#D6D5D4"
                    disableBorderColor="#D6D5D4"
                    disableBackgroundColor="white"
                  />
                  {errors[nextDateOfHearing?.key] && (
                    <CardLabelError> {t(errors[nextDateOfHearing?.key]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>
                  )}
                </LabelFieldPair>

                <div className="checkbox-item">
                  <input
                    id="bail-bond-required"
                    type="checkbox"
                    className="custom-checkbox"
                    onChange={() => {
                      setShowBailBondModal(true);
                    }}
                    checked={isBailBondTaskExists}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                    disabled={isBailBondTaskExists || skipScheduling}
                  />
                  <label htmlFor="bail-bond-required">{t("BAIL_BOND_REQUIRED")}</label>
                </div>
              </React.Fragment>
            )}
          </div>

          {/* Right Column */}
          <div className="generate-orders-v2-column">
            <div className="section-header">{t("ORDER_TEXT")}</div>
            {currentInProgressHearing && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("ORDER_ATTENDANCE")}</div>
                <textarea
                  value={(() => {
                    // Use presentAttendees if available, otherwise use currentOrder.attendance.Present
                    const presentNames =
                      presentAttendees?.length > 0
                        ? presentAttendees?.map((item) => t(item?.name))?.join(", ")
                        : currentOrder?.attendance?.Present?.length > 0
                        ? attendeeOptions
                            ?.filter((option) => currentOrder.attendance.Present.includes(option.code))
                            ?.map((item) => t(item?.name))
                            ?.join(", ")
                        : "";

                    // Use absentAttendees if available, otherwise use currentOrder.attendance.Absent
                    const absentNames =
                      absentAttendees?.length > 0
                        ? absentAttendees?.map((item) => t(item?.name))?.join(", ")
                        : currentOrder?.attendance?.Absent?.length > 0
                        ? attendeeOptions
                            ?.filter((option) => currentOrder.attendance.Absent.includes(option.code))
                            ?.map((item) => t(item?.name))
                            ?.join(", ")
                        : "";

                    const presentText = presentNames ? `Present: ${presentNames}` : "";
                    const absentText = absentNames ? `Absent: ${absentNames}` : "";
                    const newline = presentText && absentText ? "\n" : "";

                    return `${presentText}${newline}${absentText}`;
                  })()}
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  disabled={true}
                  readOnly={true}
                ></textarea>
              </div>
            )}

            <div>
              <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("ITEM_TEXT")}</div>
              <textarea
                value={currentOrder?.itemText}
                onChange={(data) => {
                  setCurrentOrder({ ...currentOrder, itemText: data.target.value });
                  if (data.target.value) {
                    setErrors((prevErrors) => {
                      const newErrors = { ...prevErrors };
                      delete newErrors["itemText"];
                      return newErrors;
                    });
                  }
                }}
                rows={currentInProgressHearing ? 8 : 20}
                maxLength={1000}
                className={`custom-textarea-style`}
              ></textarea>
              {errors["itemText"] && <CardLabelError>{t(errors["itemText"]?.msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>}
            </div>

            {currentInProgressHearing && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("NEXT_HEARING_TEXT")}</div>
                <textarea
                  value={
                    skipScheduling
                      ? `${t("NO_NEXT_HEARING")}`
                      : `${purposeOfHearing ? `${t("PURPOSE_OF_NEXT_HEARING")} ${t(purposeOfHearing?.code || purposeOfHearing)}` : ``}${
                          purposeOfHearing && nextHearingDate ? "\n" : ""
                        }${nextHearingDate ? `${t("DATE_TEXT")} ${new Date(nextHearingDate).toLocaleDateString()}` : ``}`
                  }
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  disabled={true}
                  readOnly={true}
                ></textarea>
              </div>
            )}
          </div>
        </div>
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
          <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <Button
              label={t("SAVE_AS_DRAFT")}
              variation={"secondary"}
              onButtonClick={() => {
                handleSaveDraft(currentOrder);
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
        </ActionBar>
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
          }}
          headerLabel={
            showEditOrderModal ? `${t("EDIT")} ${t(orderType?.code)} ${t("CS_ORDER")}` : `${t("ADD")} ${t(orderType?.code)} ${t("CS_ORDER")}`
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
        />
      )}
      {showBailBondModal && !isBailBondTaskExists && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => !bailBondLoading && setShowBailBondModal(false)} />}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={createBailBondTask}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          isBackButtonDisabled={bailBondLoading}
          isDisabled={bailBondLoading}
          actionCancelOnSubmit={() => setShowBailBondModal(false)}
          formId="modal-action"
          headerBarMain={<Heading label={t("CREATE_BAIL_BOND_TASK")} />}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
        >
          <div style={{ margin: "16px 16px" }}>{t("CREATE_BAIL_BOND_TASK_TEXT")}</div>
        </Modal>
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
          saveSignLater={canSaveSignLater}
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
