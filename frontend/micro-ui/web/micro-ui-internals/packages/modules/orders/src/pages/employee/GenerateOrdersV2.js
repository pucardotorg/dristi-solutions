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
  itemTextConfig,
  configsCaseSettlementAccept,
  configsCaseSettlementReject,
  configsAbateCase,
  configAcceptReschedulingRequest,
  configMiscellaneousProcess,
} from "../../configs/ordersCreateConfig";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { SubmissionWorkflowState } from "../../utils/submissionWorkflow";
import { getAdvocates, getAdvocatesNames, getuuidNameMap } from "../../utils/caseUtils";
import _ from "lodash";
import useSearchOrdersService from "../../hooks/orders/useSearchOrdersService";
import { OrderWorkflowAction, OrderWorkflowState } from "../../utils/orderWorkflow";
import { applicationTypes } from "../../utils/applicationTypes";
import { HearingWorkflowState } from "../../utils/hearingWorkflow";
import { ordersService, taskService } from "../../hooks/services";
import {
  getRespondantName,
  getComplainantName,
  constructFullName,
  removeInvalidNameParts,
  getFormattedName,
  getSafeFileExtension,
} from "../../utils";
import {
  _getTaskPayload,
  channelTypeEnum,
  checkValidation,
  compositeOrderAllowedTypes,
  formatDate,
  generateAddress,
  getFormData,
  getMandatoryFieldsErrors,
  getMediationChangedFlag,
  getOrderData,
  getParties,
  getUpdateDocuments,
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
import CompositeOrdersErrorModal from "./CompositeOrdersErrorModal";
import {
  checkAcceptRejectOrderValidation,
  getOrderActionName,
  getOrderTypes,
  setApplicationStatus,
} from "@egovernments/digit-ui-module-dristi/src/Utils";
import useSearchMiscellaneousTemplate from "../../hooks/orders/useSearchMiscellaneousTemplate";

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
  SETTLEMENT_ACCEPT: configsCaseSettlementAccept,
  SETTLEMENT_REJECT: configsCaseSettlementReject,
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
  ABATE_CASE: configsAbateCase,
  ACCEPT_RESCHEDULING_REQUEST: configAcceptReschedulingRequest,
  MISCELLANEOUS_PROCESS: configMiscellaneousProcess,
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
  DRAFT_IN_PROGRESS: 2,
  ABATE_CASE: 3,
  ACCEPT_RESCHEDULING_REQUEST: 3,
  MISCELLANEOUS_PROCESS: 3,
};

const dayInMillisecond = 24 * 3600 * 1000;
const ErrorAttendeesKey = "attendees";

const GenerateOrdersV2 = () => {
  const { t } = useTranslation();
  const history = useHistory();
  // Component state and hooks can be added here as needed
  const [presentAttendees, setPresentAttendees] = useState([]);
  const [absentAttendees, setAbsentAttendees] = useState([]);
  const [purposeOfHearing, setPurposeOfHearing] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState(null);
  const [skipScheduling, setSkipScheduling] = useState(false);
  const [showEditOrderModal, setEditOrderModal] = useState(false);
  const [showAddOrderModal, setAddOrderModal] = useState(false);
  const EditSendBackModal = Digit?.ComponentRegistryService?.getComponent("EditSendBackModal");
  const [orderType, setOrderType] = useState({}); // not sure it needed
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
  const [caseApiError, setCaseApiError] = useState(undefined);
  // Flag to prevent multiple breadcrumb updates
  const isBreadCrumbsParamsDataSet = useRef(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const todayDate = new Date().getTime();
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [addOrderTypeLoader, setAddOrderTypeLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const judgeName = localStorage.getItem("judgeName");
  const [signedDoucumentUploadedID, setSignedDocumentUploadID] = useState("");
  const [signedOrderPdfFileName, setSignedOrderPdfFileName] = useState("");
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
  const [respondents, setRespondents] = useState([]);

  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }]);
  const sortedPoliceStations = useMemo(() => {
    const stations = policeStationData?.case?.PoliceStation || [];
    return [...stations].sort((a, b) => {
      const nameA = (a?.name || "").toUpperCase();
      const nameB = (b?.name || "").toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }, [policeStationData]);

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

  const getRaiseBailBondReferenceId = (accusedKey) => {
    try {
      const safeAccused = `_ACC_${accusedKey || "UNKNOWN"}`;
      return `MANUAL_RAISE_BAIL_BOND_${filingNumber}${safeAccused}`;
    } catch (e) {
      console.error(e);
      return `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`;
    }
  };

  const createPendingTaskForJudge = async () => {
    try {
      const referenceId = `MANUAL_BAIL_BOND_${filingNumber}`;
      const res = await ordersService.getPendingTaskService(
        {
          SearchCriteria: {
            tenantId,
            moduleName: "Pending Tasks Service",
            moduleSearchCriteria: {
              isCompleted: false,
              referenceId,
              filingNumber: filingNumber,
              courtId: courtId,
              entityType: "bail bond",
            },
            limit: 1000,
            offset: 0,
          },
        },
        { tenantId }
      );
      const exists = Array.isArray(res?.data) ? res.data : [];
      if (exists?.length > 0) {
        return;
      }

      await DRISTIService.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          name: t("CS_COMMON_BAIL_BOND"),
          entityType: "bail bond",
          referenceId,
          status: "PENDING_SIGN",
          assignedTo: [],
          assignedRole: ["PENDING_TASK_CONFIRM_BOND_SUBMISSION"],
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
    } catch (e) {
      console.error("Error creating bail bond task:", e);
    }
  };

  const createPendingTaskForEmployee = async (orderObj, isRejected = false) => {
    try {
      const getUserUUID = async (individualId) => {
        try {
          const res = await window?.Digit?.DRISTIService?.searchIndividualUser(
            { Individual: { individualId } },
            { tenantId, limit: 1000, offset: 0 }
          );
          return res?.Individual?.[0]?.userUuid || "";
        } catch (e) {
          console.error("Error fetching user UUID for individualId:", individualId, e);
          return "";
        }
      };
      const bailFormData = (() => {
        if (orderObj?.orderCategory === "INTERMEDIATE" && (orderObj?.orderType === "ACCEPT_BAIL" || orderType?.code === "ACCEPT_BAIL")) {
          return orderObj?.additionalDetails?.formdata || {};
        }
        const acceptBailItem = orderObj?.compositeItems?.find?.((it) => it?.orderType === "ACCEPT_BAIL");
        return acceptBailItem?.orderSchema?.additionalDetails?.formdata || {};
      })();

      const bailOfName = bailFormData?.bailOf;
      const bailType = bailFormData?.bailType?.code || null;
      const bailAmount = bailFormData?.chequeAmount || null;
      const noOfSureties = bailFormData?.noOfSureties || null;

      const newApplicationDetails = applicationData?.applicationList?.find(
        (application) => application?.applicationNumber === orderObj?.additionalDetails?.formdata?.refApplicationId
      );

      const candidateName = bailOfName || newApplicationDetails?.additionalDetails?.onBehalOfName || "";

      const targetLitigant =
        (caseDetails?.litigants || []).find((lit) => {
          const fullName = lit?.additionalDetails?.fullName || "";
          return candidateName && fullName?.toLowerCase?.() === candidateName?.toLowerCase?.();
        }) || (caseDetails?.litigants || []).find((lit) => lit?.partyType?.includes?.("respondent"));

      const targetIndividualId = targetLitigant?.individualId;
      const targetUserUuid = targetIndividualId ? await getUserUUID(targetIndividualId) : "";

      const accusedKey = targetIndividualId || targetLitigant?.uniqueId || targetLitigant?.partyUuid || targetLitigant?.additionalDetails?.uuid || "";
      const referenceId = getRaiseBailBondReferenceId(accusedKey);

      let pendingTaskPayload = {};
      if (!isRejected) {
        const poaUuids = (() => {
          const poaList = caseDetails?.poaHolders || [];
          if (!targetIndividualId) {
            return poaList.map((poa) => poa?.additionalDetails?.uuid).filter(Boolean);
          }
          return poaList
            ?.filter((poa) => poa?.representingLitigants?.some?.((rep) => rep?.individualId === targetIndividualId))
            ?.map((poa) => poa?.additionalDetails?.uuid)
            ?.filter(Boolean);
        })();

        const advocateUuids = (() => {
          const reps = caseDetails?.representatives || [];
          if (!targetIndividualId) {
            return reps.map((rep) => rep?.additionalDetails?.uuid).filter(Boolean);
          }
          return reps
            ?.filter((rep) => rep?.representing?.some?.((r) => r?.individualId === targetIndividualId))
            ?.map((rep) => rep?.additionalDetails?.uuid)
            ?.filter(Boolean);
        })();

        const assignedTo = Array.from(new Set([targetUserUuid, ...(poaUuids || []), ...(advocateUuids || [])].filter(Boolean))).map((uuid) => ({
          uuid,
        }));

        const bailTypeCode = typeof bailType === "string" ? bailType.toUpperCase() : (bailType?.code || bailType?.type || "").toUpperCase();
        const bailTypeObj = bailTypeCode ? { code: bailTypeCode, type: bailTypeCode } : null;
        const additionalDetails = {
          accusedIndividualId: targetIndividualId || null,
          accusedKey: accusedKey || null,
          litigantUuid: targetIndividualId || accusedKey || null,
          individualId: targetIndividualId || null,
          addSurety: bailTypeCode === "SURETY" ? "YES" : bailTypeCode ? "NO" : undefined,
          refApplicationId:
            orderObj?.additionalDetails?.formdata?.refApplicationId ||
            orderObj?.additionalDetails?.refApplicationId ||
            bailFormData?.refApplicationId ||
            "",
          bailType: bailTypeObj || bailTypeCode || bailType || null,
          ...(bailTypeCode && { bailTypeCode }),
          ...(targetIndividualId || accusedKey ? { litigants: [targetIndividualId || accusedKey] } : {}),
          ...(bailAmount != null &&
            (() => {
              const amt = Number(bailAmount);
              return {
                bailAmount: amt,
                chequeAmount: Number.isFinite(amt) ? amt : undefined,
                amount: Number.isFinite(amt) ? amt : undefined,
              };
            })()),
          ...(noOfSureties != null && { noOfSureties: Number(noOfSureties) }),
        };

        if (referenceId !== `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`) {
          const res = await ordersService.getPendingTaskService({
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                referenceId: `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`,
                filingNumber: filingNumber,
                courtId: courtId,
                entityType: "bail bond",
              },
              limit: 10000,
              offset: 0,
            },
          });

          const list = Array.isArray(res?.data) ? res.data : [];

          if (list?.length > 0) {
            const pendingTaskPayload = {
              pendingTask: {
                name: t("CS_COMMON_RAISE_BAIL_BOND"),
                entityType: "bail bond",
                referenceId: `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`,
                status: "PENDING_RAISE_BAIL_BOND",
                isCompleted: true,
                tenantId,
                filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
              },
            };
            await DRISTIService.customApiService(Urls.dristi.pendingTask, pendingTaskPayload);
          }
        }

        pendingTaskPayload = {
          pendingTask: {
            name: t("CS_COMMON_RAISE_BAIL_BOND"),
            entityType: "bail bond",
            referenceId,
            status: "PENDING_RAISE_BAIL_BOND",
            assignedTo: assignedTo,
            assignedRole: [],
            actionCategory: "Bail Bond",
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: bailFormData?.bailType?.code === "SURETY" ? false : true,
            expiryDate: bailPendingTaskExpiryDays * 24 * 60 * 60 * 1000 + todayDate,
            stateSla: todayDate,
            additionalDetails,
            tenantId,
          },
        };
      } else {
        pendingTaskPayload = {
          pendingTask: {
            name: t("CS_COMMON_RAISE_BAIL_BOND"),
            entityType: "bail bond",
            referenceId,
            status: "PENDING_RAISE_BAIL_BOND",
            actionCategory: "Bail Bond",
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            tenantId,
          },
        };
      }
      try {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, pendingTaskPayload);
      } catch (apiErr) {
        console.error("[BailBond Citizen Task] API error while creating pending task:", apiErr);
        throw apiErr;
      }
    } catch (err) {
      console.error("Error creating raise bail bond task:", err);
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

  const { data: miscellaneousTemplateData, isLoading: isMiscellaneousTemplateLoading } = useSearchMiscellaneousTemplate(
    {
      criteria: {
        tenantId: tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId && orderType?.code === "MISCELLANEOUS_PROCESS")
  );

  const miscellaneousProcessTemplateDropDown = useMemo(() => {
    return (
      miscellaneousTemplateData?.list?.map((template) => {
        const { auditDetails, ...result } = template;
        return result;
      }) || []
    );
  }, [miscellaneousTemplateData]);

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

  const currentScheduledHearing = useMemo(() => hearingsData?.HearingList?.find((list) => ["SCHEDULED"]?.includes(list?.status)), [
    hearingsData?.HearingList,
  ]);
  const currentOptOutHearing = useMemo(() => hearingsData?.HearingList?.find((list) => ["OPT_OUT"]?.includes(list?.status)), [
    hearingsData?.HearingList,
  ]);

  const todayScheduledHearing = useMemo(() => {
    const now = new Date();
    const fromDate = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const toDate = new Date(now.setHours(23, 59, 59, 999)).getTime();

    return hearingsData?.HearingList?.find((list) => list?.status === "SCHEDULED" && list?.startTime >= fromDate && list?.startTime <= toDate);
  }, [hearingsData?.HearingList]);

  const lastCompletedHearing = useMemo(() => {
    if (!hearingsData?.HearingList) return null;

    return hearingsData.HearingList.filter((list) => list?.status === "COMPLETED").reduce(
      (latest, current) => (!latest || (current?.endTime || 0) > (latest?.endTime || 0) ? current : latest),
      null
    );
  }, [hearingsData?.HearingList]);

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
          .sort((a, b) => t(a.code).localeCompare(t(b.code)))
          .map((opt) => ({ ...opt, name: `ORDER_TYPE_${opt.code}` }));
      },
    }
  );

  const { data: bailTypeData, isLoading: isBailTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Order",
    [{ name: "BailType" }],
    {
      select: (data) => {
        return _.get(data, "Order.BailType", [])
          .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
          .map((item) => {
            if (item.type === "BAIL_BOND") {
              return { ...item, code: item.type, name: "PERSONAL" };
            }
            return { ...item, code: item.type, name: item.type };
          });
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
          ?.sort((a, b) => t(a.code).localeCompare(t(b.code)))
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
  const allAdvocatesNames = useMemo(() => getAdvocatesNames(caseDetails), [caseDetails]);
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
          const mobileNumber = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
            (obj) => obj?.data?.complainantVerification?.individualDetails?.individualId === item?.individualId
          )?.data?.complainantVerification?.mobileNumber;
          const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
          const complainantPoaHolder = caseDetails?.poaHolders?.find((poa) =>
            poa?.representingLitigants?.some((lit) => lit?.individualId === item?.individualId)
          );
          if (poaHolder) {
            return {
              code: fullName,
              name: `${fullName} (Complainant, PoA Holder)`,
              uuid: allAdvocates[item?.additionalDetails?.uuid],
              mobileNumber,
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
            mobileNumber,
            poaUuid: complainantPoaHolder?.additionalDetails?.uuid,
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

  useEffect(() => {
    if (!caseDetails?.litigants?.length) return;

    const fetchRespondents = async () => {
      const litigants = caseDetails?.litigants?.filter((item) => item?.partyType?.includes("respondent")) || [];

      const results = await Promise?.all(
        litigants?.map(async (item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);

          const uniqueId = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          )?.uniqueId;

          const userResult = await Digit.UserService.userSearch(tenantId, { uuid: [item?.additionalDetails?.uuid] }, {});
          const userData = userResult?.user?.[0];

          const respondentPoaHolder = caseDetails?.poaHolders?.find((poa) =>
            poa?.representingLitigants?.some((lit) => lit?.individualId === item?.individualId)
          );
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            mobileNumber: userData?.mobileNumber,
            poaUuid: respondentPoaHolder?.additionalDetails?.uuid,
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
            uniqueId,
          };
        })
      );

      setRespondents(results);
    };

    fetchRespondents();
  }, [allAdvocates, caseDetails, tenantId]);

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

  const isDelayApplicationPending = useMemo(() => {
    return Boolean(
      applicationData?.applicationList?.some(
        (item) =>
          item?.applicationType === "DELAY_CONDONATION" &&
          [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
      )
    );
  }, [applicationData]);

  const isBailApplicationPending = useMemo(() => {
    return Boolean(
      applicationData?.applicationList?.some(
        (item) =>
          item?.applicationType === "REQUEST_FOR_BAIL" &&
          [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
      )
    );
  }, [applicationData]);

  const applicationTypeConfigUpdated = useMemo(() => {
    const applyOrderTypes = (orderTypes) => {
      updatedConfig[0].body[0].populators.options = orderTypeData?.filter((opt) => orderTypes.includes(opt.code));
    };

    const updatedConfig = structuredClone(applicationTypeConfig);

    if (["PENDING_RESPONSE", "PENDING_ADMISSION"].includes(caseDetails?.status)) {
      if (isDelayApplicationPending) {
        applyOrderTypes(
          currentInProgressHearing || currentOrder?.hearingNumber
            ? [
                "DISMISS_CASE",
                "SUMMONS",
                "NOTICE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
            : [
                "DISMISS_CASE",
                "SUMMONS",
                "NOTICE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "SCHEDULE_OF_HEARING_DATE",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
        );
      } else if (isBailApplicationPending) {
        applyOrderTypes(
          currentInProgressHearing || currentOrder?.hearingNumber
            ? [
                "TAKE_COGNIZANCE",
                "DISMISS_CASE",
                "SUMMONS",
                "NOTICE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
            : [
                "TAKE_COGNIZANCE",
                "DISMISS_CASE",
                "SUMMONS",
                "NOTICE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "SCHEDULE_OF_HEARING_DATE",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
        );
      } else {
        applyOrderTypes(
          currentInProgressHearing || currentOrder?.hearingNumber
            ? [
                "TAKE_COGNIZANCE",
                "DISMISS_CASE",
                "SUMMONS",
                "NOTICE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
            : [
                "TAKE_COGNIZANCE",
                "DISMISS_CASE",
                "SUMMONS",
                "NOTICE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "SCHEDULE_OF_HEARING_DATE",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
        );
      }
    } else if (caseDetails?.courtCaseNumber) {
      if (caseDetails?.isLPRCase) {
        applyOrderTypes(
          currentInProgressHearing
            ? [
                "SUMMONS",
                "NOTICE",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "WARRANT",
                "OTHERS",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER",
                "COST",
                "WITNESS_BATTA",
                "MISCELLANEOUS_PROCESS",
              ]
            : [
                "SUMMONS",
                "NOTICE",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "SCHEDULE_OF_HEARING_DATE",
                "WARRANT",
                "OTHERS",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER",
                "COST",
                "WITNESS_BATTA",
                "MISCELLANEOUS_PROCESS",
              ]
        );
      } else if (!caseDetails?.lprNumber) {
        applyOrderTypes(
          currentInProgressHearing || currentOrder?.hearingNumber
            ? [
                "SUMMONS",
                "NOTICE",
                "DISMISS_CASE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "MOVE_CASE_TO_LONG_PENDING_REGISTER",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
            : [
                "SUMMONS",
                "NOTICE",
                "DISMISS_CASE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "SCHEDULE_OF_HEARING_DATE",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "MOVE_CASE_TO_LONG_PENDING_REGISTER",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
        );
      } else {
        applyOrderTypes(
          currentInProgressHearing || currentOrder?.hearingNumber
            ? [
                "SUMMONS",
                "NOTICE",
                "DISMISS_CASE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
            : [
                "SUMMONS",
                "NOTICE",
                "DISMISS_CASE",
                "SECTION_202_CRPC",
                "MANDATORY_SUBMISSIONS_RESPONSES",
                "REFERRAL_CASE_TO_ADR",
                "SCHEDULE_OF_HEARING_DATE",
                "WARRANT",
                "OTHERS",
                "JUDGEMENT",
                "ACCEPT_BAIL",
                "PROCLAMATION",
                "ATTACHMENT",
                "COST",
                "WITNESS_BATTA",
                "ABATE_CASE",
                "MISCELLANEOUS_PROCESS",
              ]
        );
      }
    } else {
      applyOrderTypes([
        "SUMMONS",
        "NOTICE",
        "DISMISS_CASE",
        "SECTION_202_CRPC",
        "MANDATORY_SUBMISSIONS_RESPONSES",
        "REFERRAL_CASE_TO_ADR",
        "SCHEDULE_OF_HEARING_DATE",
        "WARRANT",
        "OTHERS",
        "JUDGEMENT",
        "ACCEPT_BAIL",
        "PROCLAMATION",
        "ATTACHMENT",
        "COST",
        "WITNESS_BATTA",
        "ABATE_CASE",
        "MISCELLANEOUS_PROCESS",
      ]);
    }

    return updatedConfig;
  }, [orderTypeData, caseDetails, isDelayApplicationPending, isBailApplicationPending, currentInProgressHearing, currentOrder]);

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

  // useEffect(() => {
  //   const isBailBondPendingTaskPresent = async () => {
  //     try {
  //       const bailBondPendingTask = await HomeService.getPendingTaskService(
  //         {
  //           SearchCriteria: {
  //             tenantId,
  //             moduleName: "Pending Tasks Service",
  //             moduleSearchCriteria: {
  //               isCompleted: false,
  //               assignedRole: [...roles], //judge.clerk,typist
  //               filingNumber: filingNumber,
  //               courtId: courtId,
  //               entityType: "bail bond",
  //             },
  //             limit: 10000,
  //             offset: 0,
  //           },
  //         },
  //         { tenantId }
  //       );
  //       const refId = getBailBondReferenceId(currentOrder);
  //       const list = Array.isArray(bailBondPendingTask?.data) ? bailBondPendingTask.data : [];
  //       const matchRef = list.some?.((task) => task?.referenceId === refId);
  //       const anyBailBondPending = list.length > 0;
  //       setIsBailBondTaskExists(Boolean(matchRef || anyBailBondPending));
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };
  //   if (userType === "employee") isBailBondPendingTaskPresent();
  // }, [userType, filingNumber, courtId, roles, tenantId, currentOrder]);

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
                          options: applicationDetails?.additionalDetails?.formdata?.newHearingDates || [],
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
      applicationDetails,
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
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.dateForHearing = formatDate(new Date(hearingDetails?.startTime));
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.dateForHearing = formatDate(new Date(currentOrder?.nextHearingDate));
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
            item?.isEnabled && ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(item?.orderType)
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.dateForHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          updatedFormdata.dateForHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.dateForHearing = formatDate(new Date(hearingDetails?.startTime));
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.dateForHearing = formatDate(new Date(currentOrder?.nextHearingDate));
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
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.dateOfHearing = formatDate(new Date(hearingDetails?.startTime));
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.dateOfHearing = formatDate(new Date(currentOrder?.nextHearingDate));
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
            item?.isEnabled && ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(item?.orderType)
        );
        if (scheduleHearingOrderItem) {
          updatedFormdata.hearingDate = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
        } else if (rescheduleHearingItem) {
          updatedFormdata.hearingDate = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
        } else if (isHearingScheduled || isHearingInPassedOver) {
          updatedFormdata.hearingDate = formatDate(new Date(hearingDetails?.startTime));
        } else if (currentOrder?.nextHearingDate && !skipScheduling) {
          updatedFormdata.hearingDate = formatDate(new Date(currentOrder?.nextHearingDate));
        } else if (!currentOrder?.nextHearingDate && skipScheduling) {
          // make sure to clear the previously set next hearing date in case of skipScheduling
          updatedFormdata.hearingDate = "";
        }
        setValueRef?.current?.[index]?.("hearingDate", updatedFormdata.hearingDate);
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

  const isBailBondCheckboxEnabled = useMemo(() => {
    try {
      const errorsList = getMandatoryFieldsErrors(getModifiedFormConfig, currentOrder, currentInProgressHearing, skipScheduling);
      if (errorsList?.some((obj) => obj?.errors?.length > 0)) return false;

      const mandatoryOrderFields = [{ itemText: currentOrder?.itemText }];

      if (currentInProgressHearing || currentOrder?.hearingNumber) {
        mandatoryOrderFields?.push({ presentAttendees: currentOrder?.attendance?.Present }, { absentAttendees: currentOrder?.attendance?.Absent });
        if (!skipScheduling) {
          mandatoryOrderFields?.push({ nextHearingDate: currentOrder?.nextHearingDate }, { hearingPurpose: currentOrder?.purposeOfNextHearing });
        }
      }

      const allErrors = {};
      mandatoryOrderFields?.forEach((field) => {
        const [key, value] = Object?.entries(field)[0];

        if (key === "absentAttendees" || key === "presentAttendees") {
          const requiredAttendees = ["COMPLAINANT", "ACCUSED"];
          const allAttendees = [...(currentOrder?.attendance?.Present || []), ...(currentOrder?.attendance?.Absent || [])];
          const requiredAttendeesComplete = requiredAttendees.every((req) => allAttendees.includes(req));
          if (!requiredAttendeesComplete && (!value || !requiredAttendees.includes(value))) {
            allErrors[ErrorAttendeesKey] = { msg: "ATTENDEE_ERROR_MESSAGE" };
          }
        } else if (key === "itemText") {
          const isEmptyHtml = !value || (typeof value === "string" && value.replace(/<[^>]*>/g, "").trim() === "");
          if (isEmptyHtml) {
            allErrors[key] = { msg: "CORE_REQUIRED_FIELD_ERROR" };
          }
        } else if (!value || (Array?.isArray(value) && value?.length === 0)) {
          allErrors[key] = { msg: "CORE_REQUIRED_FIELD_ERROR" };
        }
      });

      return Object.keys(allErrors).length === 0;
    } catch (_) {
      return false;
    }
  }, [currentOrder, currentInProgressHearing, skipScheduling, getModifiedFormConfig]);

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
    const respondentUniqueId = orderFormData?.party?.data?.uniqueId || orderFormData?.party?.uniqueId || "";
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
      address: { ...respondentAddress?.[0], coordinate: respondentAddress?.[0]?.coordinates },
      phone: respondentPhoneNo[0] || "",
      email: respondentEmail[0] || "",
      age: "",
      gender: "",
      uniqueId: respondentUniqueId,
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
          ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
          respondentDetails: respondentDetails,
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
          ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
          respondentDetails: respondentDetails,
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
          ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
          respondentDetails: respondentDetails,
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
      case "MISCELLANEOUS_PROCESS":
        const taskCaseDetails = {
          title: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: currentScheduledHearing?.startTime,
          judgeName: "",
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        };
        const caseNumber = caseDetails?.courtCaseNumber || caseDetails?.cmpNumber || caseDetails?.filingNumber;
        payload = await _getTaskPayload(taskCaseDetails, orderData, caseDetails?.filingDate, currentScheduledHearing, caseNumber);
        break;
      default:
        break;
    }
    if (orderType === "MISCELLANEOUS_PROCESS") return payload;
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
              isPendingCollection: channelTypeEnum?.[item?.type]?.code === "RPAD" ? true : false,
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
        } else if (["WARRANT", "PROCLAMATION", "ATTACHMENT", "MISCELLANEOUS_PROCESS"]?.includes(order?.orderType)) {
          const payloads = await createTaskPayload(order?.orderType, { order });
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
                refHearingId: order?.hearingNumber || lastCompletedHearing?.hearingId,
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
            if (!field?.populators?.hideInForm && field?.isMandatory && hearingDateKeys.has(field?.key)) {
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

      const isBailRejected =
        (currentOrder?.orderCategory === "INTERMEDIATE" && currentOrder?.orderType === "REJECT_BAIL") ||
        currentOrder?.compositeItems?.some?.((it) => it?.orderType === "REJECT_BAIL");

      if (isBailRejected) {
        await createPendingTaskForEmployee(currentOrder, true);
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
      (await ordersService.customApiService(Urls.dristi.pendingTask, {
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

      const res = await ordersService.createOrder({ order: orderbody }, { tenantId });
      await createPendingTask({
        order: res?.order,
        createTask: true,
        taskStatus: "DRAFT_IN_PROGRESS",
        taskName: t("DRAFT_IN_PROGRESS_ISSUE_SUMMONS"),
        orderEntityType: "order-default",
      });
      return res?.order?.orderNumber;
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

      const res = await ordersService.createOrder({ order: orderbody }, { tenantId });
      await createPendingTask({
        order: res?.order,
        createTask: true,
        taskStatus: "DRAFT_IN_PROGRESS",
        taskName: t("DRAFT_IN_PROGRESS_ISSUE_NOTICE"),
        orderEntityType: "order-default",
      });
      return res?.order?.orderNumber;
    } catch (error) {}
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
      needCaseRefetch: true,
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
              toast.error(t("SOMETHING_WENT_WRONG"));
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
          toast.error(t("SOMETHING_WENT_WRONG"));
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
        } catch (error) {}
      }
    } catch (error) {
      toast.error(t("SOMETHING_WENT_WRONG"));
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
              uuid={userInfo?.uuid}
              userInfoType={userInfoType}
              filingNumber={filingNumber}
              inCase={true}
              hideFilters={true}
              isApplicationCompositeOrder={true}
              compositeOrderObj={currentOrder}
            />
            {(currentInProgressHearing || currentOrder?.hearingNumber) && (
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
                                delete newErrors[ErrorAttendeesKey];
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
                  {/* {errors["presentAttendees"] && (
                    <CardLabelError> {t(errors["presentAttendees"]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>
                  )} */}
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
                                delete newErrors[ErrorAttendeesKey];
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
                  {errors[ErrorAttendeesKey] && <CardLabelError> {t(errors[ErrorAttendeesKey]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>}
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
                  isDisabled={isAddItemDisabled}
                ></Button>
              </div>
            </LabelFieldPair>

            {(currentInProgressHearing || currentOrder?.hearingNumber) && (
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
                        setCurrentOrder({ ...currentOrder, purposeOfNextHearing: "", nextHearingDate: null });
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
                    config={{ ...purposeOfHearingConfig?.populators, options: purposeOfHearingData }}
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
                      setCurrentOrder({ ...currentOrder, nextHearingDate: date ? new Date(date).setHours(0, 0, 0, 0) : null });
                      setNextHearingDate(date ? new Date(date).setHours(0, 0, 0, 0) : null);
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
              </React.Fragment>
            )}
          </div>

          {/* Right Column */}
          <div className="generate-orders-v2-column">
            <div className="section-header">{t("ORDER_TEXT")}</div>
            {(currentInProgressHearing || currentOrder?.hearingNumber) && (
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
              <SelectCustomFormatterTextArea
                t={t}
                config={itemTextConfig}
                formData={{ itemText: { itemText: currentOrder?.itemText || "" } }}
                onSelect={onItemTextSelect}
                errors={{}}
              />
              {errors["itemText"] && <CardLabelError>{t(errors["itemText"]?.msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>}
            </div>

            {(currentInProgressHearing || currentOrder?.hearingNumber) && (
              <div>
                <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>{t("NEXT_HEARING_TEXT")}</div>
                <textarea
                  value={
                    skipScheduling
                      ? `${t("NO_NEXT_HEARING")}`
                      : `${
                          purposeOfHearing || currentOrder?.purposeOfNextHearing
                            ? `${t("PURPOSE_OF_NEXT_HEARING")} ${t(purposeOfHearing?.code || purposeOfHearing || currentOrder?.purposeOfNextHearing)}`
                            : ``
                        }${
                          (purposeOfHearing || currentOrder?.purposeOfNextHearing) && (nextHearingDate || currentOrder?.nextHearingDate) ? "\n" : ""
                        }${
                          nextHearingDate || currentOrder?.nextHearingDate
                            ? `${t("DATE_TEXT")} ${new Date(nextHearingDate || currentOrder?.nextHearingDate).toLocaleDateString()}`
                            : ``
                        }`
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
          complainants={complainants}
          respondents={respondents}
          caseDetails={caseDetails}
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
