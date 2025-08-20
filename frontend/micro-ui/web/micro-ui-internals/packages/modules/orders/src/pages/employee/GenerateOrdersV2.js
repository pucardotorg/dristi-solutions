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
} from "@egovernments/digit-ui-react-components";
import { CustomAddIcon, CustomDeleteIcon, EditPencilIcon, OutlinedInfoIcon } from "../../../../dristi/src/icons/svgIndex";
import ReactTooltip from "react-tooltip";
import AddOrderTypeModal from "../../pageComponents/AddOrderTypeModal";
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
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../utils/submissionWorkflow";
import { getAdvocates, getuuidNameMap } from "../../utils/caseUtils";
import _ from "lodash";
import useSearchOrdersService from "../../hooks/orders/useSearchOrdersService";
import { OrderWorkflowAction, OrderWorkflowState } from "../../utils/orderWorkflow";
import { applicationTypes } from "../../utils/applicationTypes";
import { HearingWorkflowAction, HearingWorkflowState } from "../../utils/hearingWorkflow";
import { ordersService } from "../../hooks/services";
import { getRespondantName, getComplainantName, constructFullName, removeInvalidNameParts, getFormattedName } from "../../utils";
import {
  channelTypeEnum,
  CloseBtn,
  formatDate,
  generateAddress,
  getCourtFee,
  getFormData,
  getOrderData,
  getParties,
  getUpdateDocuments,
  Heading,
  prepareUpdatedOrderData,
} from "../../utils/orderUtils";

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

const options = [
  { code: "COMPLAINANT", name: "Complainant" },
  { code: "COMPLAINANT_ADVOCATE", name: "Complainant's Advocate" },
  { code: "ACCUSED", name: "Accused" },
  { code: "ACCUSED_ADVOCATE", name: "Accused Advocate" },
];

const orderTypeConfig = {
  isMandatory: true,
  key: "orderType",
  type: "dropdown",
  label: "CHOOSE_ITEM",
  schemaKeyPath: "orderType",
  transformer: "mdmsDropdown",
  disable: false,
  populators: {
    name: "orderType",
    optionsKey: "name",
    error: "required ",
    styles: { maxWidth: "100%" },
    mdmsConfig: {
      moduleName: "Order",
      masterName: "OrderType",
      localePrefix: "ORDER_TYPE",
      select:
        "(data) => {return data['Order'].OrderType?.filter((item)=>[`SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}",
    },
  },
};

const purposeOfHearingConfig = {
  label: "HEARING_PURPOSE",
  isMandatory: true,
  key: "hearingPurpose",
  schemaKeyPath: "orderDetails.purposeOfHearing",
  transformer: "mdmsDropdown",
  type: "dropdown",
  populators: {
    name: "hearingPurpose",
    optionsKey: "code",
    error: "CORE_REQUIRED_FIELD_ERROR",
    styles: { maxWidth: "100%" },
    required: true,
    isMandatory: true,
    hideInForm: false,
    mdmsConfig: {
      masterName: "HearingType",
      moduleName: "Hearing",
      localePrefix: "HEARING_PURPOSE",
    },
  },
};

const nextDateOfHearing = {
  type: "component",
  component: "CustomDatePicker",
  key: "hearingDate",
  label: "Next Date of Hearing",
  className: "order-date-picker",
  isMandatory: true,
  customStyleLabelField: { display: "flex", justifyContent: "space-between" },
  populators: {
    name: "hearingDate",
    error: "CORE_REQUIRED_FIELD_ERROR",
  },
};

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
  const [OrderTitles, setOrderTitles] = useState([]);
  const submitButtonRefs = useRef([]);
  const setValueRef = useRef([]);
  const formStateRef = useRef([]);
  const clearFormErrors = useRef([]);
  const setFormErrors = useRef([]);
  const [compositeOrderIndex, setCompositeOrderIndex] = useState(0);
  const [currentOrder, setCurrentOrder] = useState({});
  const [caseData, setCaseData] = useState(undefined);
  const [isCaseDetailsLoading, setIsCaseDetailsLoading] = useState(false);
  const { orderNumber, filingNumber, orderId } = Digit.Hooks.useQueryParams();
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
  const judgeName = localStorage.getItem("judgeName");
  const [signedDoucumentUploadedID, setSignedDocumentUploadID] = useState("");
  const [fileStoreIds, setFileStoreIds] = useState(new Set()); // TODO: need to check usage
  const [orderPdfFileStoreID, setOrderPdfFileStoreID] = useState(null); // TODO: need to check usage
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [prevOrder, setPrevOrder] = useState();

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
        orderNumber: orderNumber, // TODO: comes from payload
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

  const { data: orderTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Order", [{ name: "OrderType" }], {
    select: (data) => {
      return _.get(data, "Order.OrderType", [])
        .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
        .map((opt) => ({ ...opt }));
    },
  });

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
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`DISMISS_CASE`, `SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
      } else {
        updatedConfig[0].body[0].populators.mdmsConfig.select =
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`TAKE_COGNIZANCE`, `DISMISS_CASE`, `SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}";
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

  // TODO: temporary Form Config, need to be replaced with the actual config
  const modifiedFormConfig = useMemo(() => {
    let formConfig = [];
    let selectedOrderType = "";
    if (currentOrder?.orderCategory === "COMPOSITE") {
      selectedOrderType = currentOrder?.compositeItems?.[compositeOrderIndex]?.orderType || orderType?.code || "";
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
                        // customFunction: () => handleSaveDraft({ showReviewModal: false }),
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

      formConfig = [...orderTypeForm];
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
    orderType,
  ]);

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

  const handleAddOrder = async (orderFormData, compOrderIndex) => {
    try {
      setAddOrderTypeLoader(true);
      const updatedOrderData = prepareUpdatedOrderData(currentOrder, orderFormData, compOrderIndex);
      let updatedOrder;
      if (updatedOrderData?.orderCategory === "INTERMEDIATE") {
        if (updatedOrderData?.orderType) {
          updatedOrder = structuredClone(updatedOrderData);
          updatedOrder.orderTitle = t(updatedOrderData?.orderTitle);

          if (updatedOrder?.orderNumber) {
            await updateOrder(updatedOrder, OrderWorkflowAction.SAVE_DRAFT);
          } else {
            await createOrder(updatedOrder);
          }
        }
      } else {
        // TODO: Handle for Composite Orders
      }
      setCurrentOrder(updatedOrder);
      setAddOrderModal(false);
      setAddOrderTypeLoader(false);
    } catch (error) {
      console.error("Error while saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      setAddOrderTypeLoader(false);
    }
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

  if (isCaseDetailsLoading || isHearingFetching || bailBondLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="generate-orders-v2-content">
        <Header className="generate-orders-v2-header">{t("Order : Case Ashutosh vs Ranjit")}</Header>

        <div className="generate-orders-v2-columns">
          {/* Left Column */}
          <div className="generate-orders-v2-column">
            {currentInProgressHearing && (
              <React.Fragment>
                <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left" }}>
                  <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>Mark Who Is Present</CardHeader>

                  <div className="checkbox-group">
                    {options?.map((option, index) => (
                      <div className="checkbox-item" key={index}>
                        <input
                          id={`present-${option.code}`}
                          type="checkbox"
                          className="custom-checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add to present attendees
                              setPresentAttendees([...presentAttendees, option]);
                              // Remove from absent attendees if present there
                              setAbsentAttendees(absentAttendees.filter((item) => item.code !== option.code));
                            } else {
                              // Remove from present attendees
                              setPresentAttendees(presentAttendees.filter((item) => item.code !== option.code));
                            }
                          }}
                          checked={presentAttendees.some((item) => item.code === option.code)}
                          disabled={absentAttendees.some((item) => item.code === option.code)}
                          style={{ cursor: "pointer", width: "20px", height: "20px" }}
                        />
                        <label htmlFor={`present-${option.code}`}>{t(option?.name)}</label>
                      </div>
                    ))}
                  </div>
                </LabelFieldPair>

                <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left", marginTop: "12px" }}>
                  <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>Mark Who Is Absent</CardHeader>

                  <div className="checkbox-group">
                    {options?.map((option, index) => (
                      <div className="checkbox-item" key={index}>
                        <input
                          id={`absent-${option.code}`}
                          type="checkbox"
                          className="custom-checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add to absent attendees
                              setAbsentAttendees([...absentAttendees, option]);
                              // Remove from present attendees if present there
                              setPresentAttendees(presentAttendees?.filter((item) => item?.code !== option?.code));
                            } else {
                              // Remove from absent attendees
                              setAbsentAttendees(absentAttendees?.filter((item) => item?.code !== option?.code));
                            }
                          }}
                          checked={absentAttendees?.some((item) => item?.code === option?.code)}
                          disabled={presentAttendees?.some((item) => item?.code === option?.code)}
                          style={{ cursor: "pointer", width: "20px", height: "20px" }}
                        />
                        <label htmlFor={`absent-${option.code}`}>{t(option?.name)}</label>
                      </div>
                    ))}
                  </div>
                </LabelFieldPair>
              </React.Fragment>
            )}

            <LabelFieldPair className="order-type-dropdown">
              <CardLabel className="order-type-dropdown-label">{t(orderTypeConfig?.label)}</CardLabel>
              <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
                <CustomDropdown
                  t={t}
                  onChange={(e) => {
                    // setModeOfPayment(e);
                    // setAdditionalDetails("");
                    setOrderType(e);
                    setAddOrderModal(true);
                  }}
                  value={orderType}
                  config={{
                    ...orderTypeConfig?.populators,
                    styles: { ...orderTypeConfig?.populators?.styles, flex: 1 },
                  }}
                />
                <Button
                  className={"edit-button"}
                  variation="secondary"
                  onButtonClick={handleEditOrder}
                  label={t("Edit")}
                  icon={<EditPencilIcon width="20" height="20" />}
                />
                <Button
                  className={"delete-button"}
                  variation="secondary"
                  label={t("Delete")}
                  icon={<CustomDeleteIcon color="#BB2C2F" width="20" height="20" />}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <Button
                  variation="secondary"
                  // onButtonClick={handleAddForm}
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
                        setPurposeOfHearing("");
                        setNextHearingDate("");
                      }
                    }}
                    checked={skipScheduling}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  />
                  <label htmlFor="skip-scheduling">Skip Scheduling Next Hearing</label>
                </div>

                <LabelFieldPair className="purpose-hearing-dropdown">
                  <CardLabel className={`purpose-hearing-dropdown-label ${skipScheduling ? "disabled" : ""}`}>
                    {t(purposeOfHearingConfig?.label)}
                  </CardLabel>
                  <CustomDropdown
                    t={t}
                    onChange={(e) => {
                      setPurposeOfHearing(e);
                    }}
                    value={purposeOfHearing}
                    config={purposeOfHearingConfig?.populators}
                    disable={skipScheduling}
                  ></CustomDropdown>
                </LabelFieldPair>

                <LabelFieldPair className={`case-label-field-pair`} style={{ width: "75%" }}>
                  <CardLabel className={`case-input-label ${skipScheduling ? "disabled" : ""}`}>Next Date of Hearing</CardLabel>
                  <CustomDatePickerV2
                    t={t}
                    config={nextDateOfHearing}
                    formData={{ nextHearingDate: nextHearingDate }}
                    onDateChange={(date) => {
                      setNextHearingDate(new Date(date).setHours(0, 0, 0, 0));
                    }}
                    value={nextHearingDate}
                    disable={skipScheduling}
                    disableColor="#D6D5D4"
                    disableBorderColor="#D6D5D4"
                    disableBackgroundColor="white"
                  />
                  {/* {orderError?.hearingDate && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(orderError?.hearingDate)} </CardLabelError>} */}
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
                  <label htmlFor="bail-bond-required">Bail Bond Required</label>
                </div>
              </React.Fragment>
            )}
          </div>

          {/* Right Column */}
          <div className="generate-orders-v2-column">
            <div className="section-header">Order Text</div>
            {currentInProgressHearing && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Attendance</div>
                <textarea
                  value={`${presentAttendees?.length > 0 ? `Present: ${presentAttendees?.map((item) => t(item?.name))?.join(", ")}` : ``}${
                    presentAttendees?.length > 0 && absentAttendees?.length > 0 ? "\n" : ""
                  }${absentAttendees?.length > 0 ? `Absent: ${absentAttendees?.map((item) => t(item?.name))?.join(", ")}` : ``}`}
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  disabled={true}
                  readOnly={true}
                ></textarea>
                {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
              </div>
            )}

            <div>
              <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Item Text</div>
              <textarea
                // value={formdata?.[config.key]?.[input.name]}
                // onChange={(data) => {
                //   handleChange(data, input);
                // }}
                rows={currentInProgressHearing ? 8 : 20}
                maxLength={1000}
                className={`custom-textarea-style`}
                // placeholder={t(input?.placeholder)}
                // disabled={config.disable}
              ></textarea>
              {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
            </div>

            {currentInProgressHearing && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Next Hearing</div>
                <textarea
                  value={
                    skipScheduling
                      ? "No Next Hearing"
                      : `${purposeOfHearing ? `Purpose of Next Hearing: ${t(purposeOfHearing?.code || purposeOfHearing)}` : ``}${
                          purposeOfHearing && nextHearingDate ? "\n" : ""
                        }${nextHearingDate ? `Date: ${new Date(nextHearingDate).toLocaleDateString()}` : ``}`
                  }
                  rows={3}
                  maxLength={1000}
                  className={`custom-textarea-style`}
                  disabled={true}
                  readOnly={true}
                ></textarea>
                {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
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
              // onButtonClick={() => {
              //   setEditCaseModal(true);
              // }}
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
            <SubmitBar
              label={t("PREVIEW_ORDER_PDF")}
              // disabled={
              //   Object.keys(!modeOfPayment ? {} : modeOfPayment).length === 0 ||
              //   (["CHEQUE", "DD"].includes(modeOfPayment?.code) ? additionDetails.length !== 6 : false) ||
              //   isDisabled
              // }
              // onSubmit={() => {
              //   onSubmitCase();
              // }}
            />
          </div>
        </ActionBar>
      </div>
      {showEditOrderModal && (
        <EditSendBackModal
          t={t}
          handleCancel={() => setEditOrderModal(false)}
          handleSubmit={handleEditConfirmationOrder}
          headerLabel={"Confirm Edit"}
          saveLabel={"CONFIRM"}
          cancelLabel={"CANCEL_EDIT"}
          contentText={"Are you sure you want to make these changes in this item. This will not update the order text on the right side."}
          className={"edit-send-back-modal"}
        />
      )}
      {showAddOrderModal && (
        <AddOrderTypeModal
          t={t}
          handleCancel={() => setAddOrderModal(false)}
          headerLabel={"Add Order"}
          saveLabel={"CONFIRM"}
          cancelLabel={"CANCEL_EDIT"}
          handleSubmit={handleAddOrder}
          orderType={orderType}
          modifiedFormConfig={modifiedFormConfig}
          getDefaultValue={getDefaultValue}
          currentOrder={currentOrder}
          index={compositeOrderIndex}
          setFormErrors={setFormErrors}
          clearFormErrors={clearFormErrors}
          setValueRef={setValueRef}
          addOrderTypeLoader={addOrderTypeLoader}
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
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default GenerateOrdersV2;
