import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { InboxSearchComposer, Loader } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import ViewCaseFile from "../scrutiny/ViewCaseFile";
import { TabSearchconfigNew } from "./AdmittedCasesConfig";
import EvidenceModal from "./EvidenceModal";
import "./tabs.css";
import { SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";
import { OrderTypes, OrderWorkflowState } from "../../../Utils/orderWorkflow";
import ScheduleHearing from "./ScheduleHearing";
import ViewAllOrderDrafts from "./ViewAllOrderDrafts";
import PublishedOrderModal from "./PublishedOrderModal";
import ViewAllSubmissions from "./ViewAllSubmissions";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import HearingTranscriptModal from "./HearingTranscriptModal";
import AdmissionActionModal from "../admission/AdmissionActionModal";
import { DRISTIService } from "../../../services";
import { Urls } from "../../../hooks";
import { admitCaseSubmitConfig, scheduleCaseAdmissionConfig, selectParticipantConfig } from "../../citizen/FileCase/Config/admissionActionConfig";
import Modal from "../../../components/Modal";
import {
  checkIfCaseAccessThroughMultipleAdvocates,
  getAllAdvocatesAndClerksUuids,
  getAllAssociatedPartyUuids,
  getAuthorizedUuid,
  getDate,
} from "../../../Utils";
import useSearchOrdersService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersService";
import VoidSubmissionBody from "./VoidSubmissionBody";
import DocumentModal from "@egovernments/digit-ui-module-orders/src/components/DocumentModal";
import { getFullName } from "../../../../../cases/src/utils/joinCaseUtils";
import PublishedNotificationModal from "./publishedNotificationModal";
import ConfirmEvidenceAction from "../../../components/ConfirmEvidenceAction";
import useCaseDetailSearchService from "../../../hooks/dristi/useCaseDetailSearchService";
import Breadcrumb from "../../../components/BreadCrumb";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import WorkflowTimeline from "../../../components/WorkflowTimeline";
import CaseOverviewV2 from "./CaseOverviewV2";
import PaymentDemandModal from "./PaymentDemandModal";
import DocumentsV2 from "./DocumentsV2";
import MarkAsEvidence from "./MarkAsEvidence";
import AddWitnessModal from "@egovernments/digit-ui-module-hearings/src/pages/employee/AddWitnessModal";
import WitnessDrawerV2 from "./WitnessDrawerV2";
import WitnessDepositionDocModal from "./WitnessDepositionDocModal";
import { convertTaskResponseToPayload } from "@egovernments/digit-ui-module-orders/src/utils";
import ExaminationDrawer from "./ExaminationDrawer";
import useSortedMDMSData from "../../../hooks/dristi/useSortedMDMSData";

// Import extracted components
import { CalendarModal, DismissCaseModal, PendingDelayModal, CaseHeader, CaseTabContent } from "./components";
import EndHearingModal from "./components/EndHearingModal";
import DownloadCasePdfModal from "./components/DownloadCasePdfModal";
import CustomToast from "../../../components/CustomToast";

// Import extracted constants
import {
  stateSla,
  delayCondonationTextStyle,
  HearingWorkflowState,
  homeTabEnum,
  actionEnabledStatuses,
  viewEnabledStatuses,
  judgeReviewStages,
} from "./utils/constants";

// Import extracted permission mappings and action options
import {
  citizenActionOptions,
  employeeActionsPermissionsMapping,
  takeActionOptions,
  getEmployeeActionOptions,
  filterActionsByPermissions,
} from "./utils/permissionMappings";

// Import breadcrumb utilities
import { getEmployeeCrumbs, getAdvocateName } from "./utils/breadcrumbUtils";

// Import party filter utilities
import { getPipComplainants, getPipAccuseds, getComplainantsList } from "./utils/partyFilterUtils";

// Import modal config utilities
import { getDcaConfirmModalConfig, getVoidModalConfig } from "./utils/modalConfigUtils";

// Import case data processing utilities
import {
  getStatue,
  getLitigants,
  getFinalLitigantsData,
  getReps,
  getFinalRepresentativesData,
  getWitnesses,
  getUnJoinedLitigant,
  getComplainants,
  getRespondents,
  getShowMakeSubmission,
} from "./utils/caseDataProcessingUtils";

// Import case info utilities
import { getCaseInfo } from "./utils/caseInfoUtils";

// Import tab config utilities
import { getTabConfig } from "./utils/tabConfigUtils";

// Import advocate/clerk utilities
import { getPopupForJuniorAdvocate, getIsMemberPartOfCase } from "./utils/advocateClerkUtils";

// Import case submission utilities
import { handleCaseAdmittedSubmit, handleAdmitDismissCaseOrder as handleAdmitDismissCaseOrderUtil } from "./utils/caseSubmissionUtils";

// Import delete handlers
import { handleDeleteApplication as handleDeleteApplicationUtil, handleDeleteOrder as handleDeleteOrderUtil } from "./utils/deleteHandlers";

// Import bail bond utilities
import { createBailBondTask as createBailBondTaskUtil } from "./utils/bailBondUtils";

// Import PDF download utilities
import { handleDownloadPDF as handleDownloadPDFUtil } from "./utils/pdfDownloadUtils";
import BailBondTaskModal from "./components/BailBondTaskModal";
import { applicationTypes, userRolesEnum } from "../../../Utils/constants";

const AdmittedCaseV2 = () => {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();

  const [apiCalled, setApiCalled] = useState(false);
  const [passOver, setPassOver] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const location = useLocation();
  const { pathname, search, hash } = location;
  const { path } = useRouteMatch();
  const urlParams = new URLSearchParams(location.search);
  const { artifactNumber, fromHome, openExaminationModal, examinationDocNumber } = Digit.Hooks.useQueryParams();
  const caseId = urlParams.get("caseId");
  const userInfo = useMemo(() => JSON.parse(window.localStorage.getItem("user-info")), []);
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === userRolesEnum.POST_MANAGER), [roles]);
  const activeTab = urlParams.get("tab") || "Overview";
  const filingNumber = urlParams.get("filingNumber");
  const applicationNumber = urlParams.get("applicationNumber");
  const userRoles = useMemo(() => roles.map((role) => role.code), [roles]);
  const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false });
  const [showWitnessModal, setShowWitnessModal] = useState({ show: false, artifactNumber: null });
  const [showExaminationModal, setShowExaminationModal] = useState(openExaminationModal || false);
  const [show, setShow] = useState(false);
  const [openAdmitCaseModal, setOpenAdmitCaseModal] = useState(true);
  const [documentSubmission, setDocumentSubmission] = useState();
  const [artifact, setArtifact] = useState();
  const [showOrderReviewModal, setShowOrderReviewModal] = useState(false);
  const [showHearingTranscriptModal, setShowHearingTranscriptModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState();
  const [currentHearing, setCurrentHearing] = useState();
  const [showMenu, setShowMenu] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [orderDraftModal, setOrderDraftModal] = useState(false);
  const [submissionsViewModal, setSubmissionsViewModal] = useState(false);
  const [draftOrderList, setDraftOrderList] = useState([]);
  const [submissionsViewList, setSubmissionsViewList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [submitModalInfo, setSubmitModalInfo] = useState(null);
  const [caseAdmitLoader, setCaseAdmitLoader] = useState(false);
  const [createAdmissionOrder, setCreateAdmissionOrder] = useState(false);
  const [updatedCaseDetails, setUpdatedCaseDetails] = useState({});
  const [showDismissCaseConfirmation, setShowDismissCaseConfirmation] = useState(false);
  const [showPendingDelayApplication, setShowPendingDelayApplication] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [downloadCasePdfLoading, setDownloadCasePdfLoading] = useState(false);
  const [showDownloadCasePdfModal, setShowDownloadCasePdfModal] = useState(false);
  const [casePdfFileStoreId, setCasePdfFileStoreId] = useState(null);
  const [casePdfError, setCasePdfError] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [isDelayApplicationPending, setIsDelayApplicationPending] = useState(false);
  const [isOpenDCA, setIsOpenDCA] = useState(false);
  const [isOpenFromPendingTask, setIsOpenFromPendingTask] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCitizenMenu, setShowCitizenMenu] = useState(false);
  const [showJoinCase, setShowJoinCase] = useState(false);
  const [showPaymentDemandModal, setShowPaymentDemandModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [showAllStagesModal, setShowAllStagesModal] = useState(false);
  const [showBailBondModal, setShowBailBondModal] = useState(false);
  const [showMakeAsEvidenceModal, setShowMakeAsEvidenceModal] = useState(false);
  const [isBailBondTaskExists, setIsBailBondTaskExists] = useState(false);
  const [bailBondLoading, setBailBondLoading] = useState(false);
  const [showAddWitnessModal, setShowAddWitnessModal] = useState(false);
  const [showWitnessDepositionDoc, setShowWitnessDepositionDoc] = useState({ docObj: null, show: false });
  const [examinationDocumentNumber, setExaminationDocumentNumber] = useState(examinationDocNumber || null);

  const JoinCaseHome = useMemo(() => Digit.ComponentRegistryService.getComponent("JoinCaseHome"), []);
  const history = useHistory();
  const isCitizen = userRoles?.includes(userRolesEnum.CITIZEN);
  const isJudge = userRoles?.includes(userRolesEnum.JUDGE_ROLE);
  const OrderWorkflowAction = useMemo(() => Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {}, []);
  const ordersService = useMemo(() => Digit.ComponentRegistryService.getComponent("OrdersService") || {}, []);
  const submissionService = useMemo(() => Digit.ComponentRegistryService.getComponent("submissionService") || {}, []);
  const OrderReviewModal = useMemo(() => Digit.ComponentRegistryService.getComponent("OrderReviewModal") || {}, []);
  const EditSendBackModal = useMemo(() => Digit.ComponentRegistryService.getComponent("EditSendBackModal") || {}, []);
  const [loader, setLoader] = useState(false);
  const NoticeProcessModal = useMemo(
    () => Digit.ComponentRegistryService.getComponent("NoticeProcessModal") || <React.Fragment></React.Fragment>,
    []
  );
  const userType = useMemo(() => (userInfo?.type === userRolesEnum.CITIZEN ? "citizen" : "employee"), [userInfo?.type]);
  const isEmployee = useMemo(() => userType === "employee", [userType]);
  const isAdvocateOrClerk = useMemo(
    () => userRoles?.includes(userRolesEnum.ADVOCATE_ROLE) || userRoles?.includes(userRolesEnum.ADVOCATE_CLERK_ROLE),
    [userRoles]
  );
  const todayDate = new Date().getTime();
  const { downloadPdf } = useDownloadCasePdf();
  const [isShow, setIsShow] = useState(false);
  const currentDiaryEntry = history.location?.state?.diaryEntry;
  const historyOrderData = location?.state?.orderData;
  const newWitnesToast = history.location?.state?.newWitnesToast;
  const [isApplicationAccepted, setIsApplicationAccepted] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [deleteApplication, setDeleteApplication] = useState(null);

  const courtId = localStorage.getItem("courtId");
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && !isCitizen) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const hasHearingPriorityView = useMemo(() => roles?.some((role) => role?.code === userRolesEnum.HEARING_PRIORITY_VIEW) && isEmployee, [
    roles,
    isEmployee,
  ]);

  const { data: hearingTypeOptions } = useSortedMDMSData("Hearing", "HearingType", "type", t);
  const { data: orderTypeOptions } = useSortedMDMSData("Order", "OrderType", "type", t);
  const { data: applicationTypeOptions } = useSortedMDMSData("Application", "ApplicationType", "type", t);
  const storedAdvocate = JSON.parse(sessionStorage.getItem("selectedAdvocate"));
  const [showPopupForClerkOrAdvocate, setShowPopupForClerkOrAdvocate] = useState({ show: false, message: "" });

  const hasHearingEditAccess = useMemo(() => roles?.some((role) => role?.code === userRolesEnum.HEARING_APPROVER), [roles]);
  const reqEvidenceUpdate = {
    url: Urls.dristi.evidenceUpdate,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  };
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
    return bailPendingTaskExpiry?.find((data) => data?.enitiyName === userRolesEnum.BAIL_BONDS_REVIEW)?.noofdaysforexpiry || 0;
  }, [bailPendingTaskExpiry]);

  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);

  const evidenceUpdateMutation = Digit.Hooks.useCustomAPIMutationHook(reqEvidenceUpdate);

  const { data: caseData, isLoading: caseApiLoading, refetch: refetchCaseData, isFetching: isCaseFetching } = useCaseDetailSearchService(
    {
      criteria: {
        caseId: caseId,
        ...(courtId && { courtId }),
      },
      tenantId,
    },
    {},
    `dristi-admitted-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const caseDetails = useMemo(() => caseData?.cases || {}, [caseData]);
  const caseCourtId = !isCitizen ? localStorage.getItem("courtId") : caseDetails?.courtId;
  const delayCondonationData = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data, [caseDetails]);

  const cnrNumber = useMemo(() => caseDetails?.cnrNumber || "", [caseDetails]);

  const showTakeAction = useMemo(
    () => userRoles?.includes(userRolesEnum.ORDER_CREATOR) && !isCitizen && actionEnabledStatuses.includes(caseDetails?.status),
    [caseDetails?.status, userRoles, isCitizen]
  );

  const [data, setData] = useState([]);
  const [dataForNextHearings, setDataForNextHearings] = useState([]);

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
            tenantId,
          },
          moduleSearchCriteria: {
            tenantId,
            ...(fromDate && toDate ? { fromDate, toDate } : {}),
          },
          tenantId,
          limit: 300,
          offset: 0,
        },
      };

      const res = await HomeService.InboxSearch(payload, { tenantId });
      setData(res?.items || []);
    } catch (err) {
      console.error("error", err);
      const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("FAILED_TO_FETCH_HEARING_INBOX_DATA"), error: true, errorId });
    } finally {
    }
  }, []);

  const homeNextHearingFilter = useMemo(() => JSON.parse(localStorage.getItem("Digit.homeNextHearingFilter")), []);

  useEffect(() => {
    const fetchInboxForNextHearingData = async () => {
      try {
        const payload = (fromDate, toDate) => {
          return {
            inbox: {
              processSearchCriteria: {
                businessService: ["hearing-default"],
                moduleName: "Hearing Service",
                tenantId,
              },
              moduleSearchCriteria: {
                tenantId,
                ...(fromDate && toDate ? { fromDate, toDate } : {}),
              },
              tenantId,
              limit: 300,
              offset: 0,
            },
          };
        };

        if (homeNextHearingFilter) {
          const fromDateForNextHearings = new Date(homeNextHearingFilter.homeFilterDate).setHours(0, 0, 0, 0);
          const toDateForNextHearings = new Date(homeNextHearingFilter.homeFilterDate).setHours(23, 59, 59, 999);

          const resForNextHearings = await HomeService.InboxSearch(payload(fromDateForNextHearings, toDateForNextHearings), { tenantId });
          setDataForNextHearings(resForNextHearings?.items || []);
        }
      } catch (err) {
        console.error("error", err);
        const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
        setShowToast({ label: t("FAILED_TO_FETCH_HEARING_INBOX_DATA"), error: true, errorId });
      } finally {
      }
    };
    fetchInboxForNextHearingData();
  }, []);

  useEffect(() => {
    fetchInbox();
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
        console.error(err);
        const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
        setShowToast({ label: t("FAILED_TO_FETCH_BAIL_BOND_PENDING_TASK"), error: true, errorId });
      }
    };
    if (isEmployee) isBailBondPendingTaskPresent();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType]);
  const homeActiveTab = useMemo(() => location?.state?.homeActiveTab || "TOTAL_HEARINGS_TAB", [location?.state?.homeActiveTab]);
  const homeFilteredData = useMemo(() => location?.state?.homeFilteredData || {}, [location?.state?.homeFilteredData]);

  useEffect(() => {
    const unlisten = history.listen((location, action) => {
      if (action === "POP" && location.pathname.includes("home-screen")) {
        history.replace(location.pathname, {
          ...location.state,
          homeFilteredData: homeFilteredData,
          homeActiveTab: homeActiveTab,
        });
      }
    });

    return () => {
      unlisten();
    };
  }, [history]);

  const isDelayCondonationApplicable = useMemo(() => {
    if (!caseDetails?.cnrNumber) return undefined;
    return caseDetails?.caseDetails?.delayApplications?.formdata[0]?.data?.delayCondonationType?.code === "NO";
  }, [caseDetails]);

  const statue = useMemo(() => getStatue(caseDetails), [caseDetails]);

  const litigants = useMemo(() => getLitigants(caseDetails), [caseDetails]);
  const finalLitigantsData = useMemo(() => getFinalLitigantsData(litigants), [litigants]);
  const reps = useMemo(() => getReps(caseDetails), [caseDetails]);
  const finalRepresentativesData = useMemo(() => getFinalRepresentativesData(reps), [reps]);

  const witnesses = useMemo(() => getWitnesses(caseDetails), [caseDetails]);

  const unJoinedLitigant = useMemo(() => getUnJoinedLitigant(caseDetails), [caseDetails]);

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);

  const complainants = useMemo(() => getComplainants(caseDetails, allAdvocates), [caseDetails, allAdvocates]);

  const respondents = useMemo(() => getRespondents(caseDetails, allAdvocates), [caseDetails, allAdvocates]);
  const listAllAdvocates = useMemo(() => Object.values(allAdvocates || {}).flat(), [allAdvocates]);
  const isAdvocatePresent = useMemo(() => listAllAdvocates?.includes(authorizedUuid), [listAllAdvocates, authorizedUuid]);

  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(authorizedUuid)), [
    allAdvocates,
    authorizedUuid,
  ]);
  const { data: applicationData, isLoading: isApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        tenantId,
        asUser: authorizedUuid,
      },
      tenantId,
      ...(caseCourtId && { courtId: caseCourtId }),
    },
    {},
    filingNumber + "allApplications",
    Boolean(filingNumber && caseCourtId)
  );
  const extensionApplications = useMemo(
    () =>
      applicationData?.applicationList?.filter(
        (item) =>
          item?.applicationType === applicationTypes.EXTENSION_SUBMISSION_DEADLINE &&
          item?.onBehalfOf?.includes(onBehalfOfuuid) &&
          ![
            SubmissionWorkflowState.COMPLETED,
            SubmissionWorkflowState.DELETED,
            SubmissionWorkflowState.REJECTED,
            SubmissionWorkflowState.ABATED,
          ].includes(item?.status)
      ) || [],
    [applicationData, onBehalfOfuuid]
  );

  const productionOfDocumentApplications = useMemo(
    () =>
      applicationData?.applicationList?.filter(
        (item) =>
          item?.applicationType === applicationTypes.PRODUCTION_DOCUMENTS &&
          item?.onBehalfOf?.includes(onBehalfOfuuid) &&
          ![SubmissionWorkflowState.DELETED, SubmissionWorkflowState.ABATED].includes(item?.status)
      ) || [],
    [applicationData, onBehalfOfuuid]
  );

  const submitBailDocumentsApplications = useMemo(
    () =>
      applicationData?.applicationList?.filter(
        (item) =>
          item?.applicationType === applicationTypes.SUBMIT_BAIL_DOCUMENTS &&
          item?.onBehalfOf?.includes(onBehalfOfuuid) &&
          ![SubmissionWorkflowState.DELETED, SubmissionWorkflowState.ABATED].includes(item?.status)
      ) || [],
    [applicationData, onBehalfOfuuid]
  );

  useMemo(() => {
    setIsDelayApplicationPending(
      Boolean(
        applicationData?.applicationList?.some(
          (item) =>
            item?.applicationType === applicationTypes.DELAY_CONDONATION &&
            [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
        )
      )
    );
  }, [applicationData]);

  const isDelayApplicationCompleted = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === applicationTypes.DELAY_CONDONATION && [SubmissionWorkflowState.COMPLETED].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const isDelayApplicationRejected = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === applicationTypes.DELAY_CONDONATION && [SubmissionWorkflowState.REJECTED].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const caseRelatedData = useMemo(
    () => ({
      caseId,
      filingNumber,
      cnrNumber,
      title: caseDetails?.caseTitle || "",
      stage: caseDetails?.stage,
      parties: [...finalLitigantsData, ...finalRepresentativesData, ...unJoinedLitigant, ...witnesses],
      case: caseDetails,
      statue: statue,
    }),
    [caseDetails, caseId, cnrNumber, filingNumber, finalLitigantsData, finalRepresentativesData, unJoinedLitigant, witnesses, statue]
  );

  const caseStatus = useMemo(() => caseDetails?.status || "", [caseDetails]);
  const showMakeSubmission = useMemo(() => getShowMakeSubmission(isAdvocatePresent, userRoles, caseStatus), [
    userRoles,
    caseStatus,
    isAdvocatePresent,
  ]);

  const openDraftModal = (orderList) => {
    setDraftOrderList(orderList);
    setOrderDraftModal(true);
  };

  const openSubmissionViewModal = (submissionList, openEvidenceModalFunc) => {
    setSubmissionsViewList({ list: submissionList, func: openEvidenceModalFunc });
    setSubmissionsViewModal(true);
  };

  const handleTakeAction = useCallback(() => {
    setShowMenu(!showMenu);
    setShowOtherMenu(false);

    if (showCitizenMenu) {
      setShowCitizenMenu(false);
    }
  }, [showMenu, showCitizenMenu]);

  const onSuccess = async (response, data) => {
    setShowToast({
      label: !data?.body?.artifact?.isEvidence ? t("SUCCESSFULLY_UNMARKED_MESSAGE") : t("SUCCESSFULLY_MARKED_MESSAGE"),
      error: false,
    });
    refetchCaseData();
  };

  const onError = async (error, data) => {
    setShowToast({
      label: !data?.body?.artifact?.isEvidence ? t("UNSUCCESSFULLY_UNMARKED_MESSAGE") : t("UNSUCCESSFULLY_MARKED_MESSAGE"),
      error: true,
    });
  };

  const handleMarkEvidence = async (documentSubmission, isEvidence) => {
    await evidenceUpdateMutation.mutate(
      {
        url: Urls.dristi.evidenceUpdate,
        params: {},
        body: {
          artifact: {
            ...documentSubmission?.[0].artifactList,
            isEvidence: !isEvidence,
            isVoid: false,
            reason: "",
            filingNumber: filingNumber,
          },
        },
        config: {
          enable: true,
        },
      },
      {
        onSuccess,
        onError,
      }
    );
  };

  const caseInfo = useMemo(() => getCaseInfo(caseDetails, caseCourtId, t), [caseDetails, caseCourtId, t]);

  const docSetFunc = useCallback(
    (docObj) => {
      // This is redundant for document tab, used only for submissions tab
      const applicationNumber = docObj?.[0]?.applicationList?.applicationNumber;
      const status = docObj?.[0]?.applicationList?.status;
      const applicationOwnerUuid = docObj?.[0]?.applicationList?.asUser;
      const documentOwnerUuid = docObj?.[0]?.artifactList?.asUser;

      const artifactNumber = docObj?.[0]?.artifactList?.artifactNumber;
      const documentStatus = docObj?.[0]?.artifactList?.status;
      const allAllowedPartiesForApplicationsActions = getAllAssociatedPartyUuids(caseDetails, applicationOwnerUuid);
      const allAllowedPartiesForDocumentsActions = getAllAssociatedPartyUuids(caseDetails, documentOwnerUuid);

      if (documentStatus === SubmissionWorkflowState.PENDING_E_SIGN && allAllowedPartiesForDocumentsActions.includes(userUuid)) {
        history.push(
          `/${window?.contextPath}/${
            isCitizen ? "citizen" : "employee"
          }/submissions/submit-document?filingNumber=${filingNumber}&artifactNumber=${artifactNumber}`
        );
      }
      if (
        [
          SubmissionWorkflowState.PENDINGPAYMENT,
          SubmissionWorkflowState.PENDINGESIGN,
          SubmissionWorkflowState.PENDINGSUBMISSION,
          SubmissionWorkflowState.DRAFT_IN_PROGRESS,
        ].includes(status)
      ) {
        if (allAllowedPartiesForApplicationsActions.includes(userUuid)) {
          history.push(
            `/${window?.contextPath}/${
              isCitizen ? "citizen" : "employee"
            }/submissions/submissions-create?filingNumber=${filingNumber}&applicationNumber=${applicationNumber}`
          );
        }
      } else {
        setDocumentSubmission(docObj);
        setShow(true);
      }
      if (
        ![SubmissionWorkflowState.PENDINGPAYMENT, SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(status)
      ) {
        setDocumentSubmission(docObj);
        setShow(true);
      }
    },
    [caseDetails, filingNumber, history, isCitizen, userUuid, setDocumentSubmission, setShow]
  );

  const orderSetFunc = useCallback(
    async (order) => {
      if (order?.businessObject?.orderNotification?.entityType === "Notification") {
        const notificationResponse = await Digit.HearingService.searchNotification({
          criteria: {
            tenantId: tenantId,
            notificationNumber: order?.businessObject?.orderNotification?.id,
            ...(caseCourtId && { courtId: caseCourtId }),
          },
          pagination: {
            limit: 100,
          },
        });
        const notification = notificationResponse?.list?.[0];
        setShowNotificationModal(true);
        setCurrentNotification(notification);
      } else {
        if (order?.businessObject?.orderNotification?.entityType === "Order") {
          const orderResponse = await ordersService.searchOrder(
            {
              criteria: {
                tenantId: tenantId,
                filingNumber: filingNumber,
                orderNumber: order?.businessObject?.orderNotification?.id,
                ...(caseCourtId && { courtId: caseCourtId }),
              },
            },
            { tenantId }
          );
          order = orderResponse?.list?.[0];
        }
        if (isCitizen) {
          // for citizen, only those orders should be visible which are published
          setCurrentOrder(order);
          setShowOrderReviewModal(true);
        } else {
          if (order?.status === OrderWorkflowState.DRAFT_IN_PROGRESS) {
            history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${order?.orderNumber}`);
          } else if (order?.status === OrderWorkflowState.PENDING_BULK_E_SIGN) {
            history.push(`/${window.contextPath}/employee/home/home-screen?orderNumber=${order?.orderNumber}`, { homeActiveTab: "CS_HOME_ORDERS" });
          } else {
            setCurrentOrder(order);
            setShowOrderReviewModal(true);
          }
        }
      }
    },
    [
      caseCourtId,
      filingNumber,
      history,
      isCitizen,
      ordersService,
      tenantId,
      setCurrentOrder,
      setCurrentNotification,
      setShowNotificationModal,
      setShowOrderReviewModal,
    ]
  );

  const orderDeleteFunc = useCallback(
    async (history, column, row, item) => {
      try {
        const orderResponse = await ordersService.searchOrder(
          {
            criteria: {
              tenantId: tenantId,
              filingNumber: filingNumber,
              orderNumber: row?.businessObject?.orderNotification?.id,
              ...(caseCourtId && { courtId: caseCourtId }),
            },
          },
          { tenantId }
        );
        row = orderResponse?.list?.[0];
        setDeleteOrder(row);
      } catch (error) {
        console.error("Failed to search order for delete request:", error);
        const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
        setShowToast({
          label: t("FAILED_TO_SEARCH_ORDER_FOR_DELETE_REQUEST"),
          error: true,
          errorId,
        });
      }
    },
    [caseCourtId, filingNumber, ordersService, setShowToast, t, tenantId, setDeleteOrder]
  );

  const handleApplicationDeleteFunc = useCallback(
    async (row) => {
      setDeleteApplication(row);
    },
    [setDeleteApplication]
  );

  const takeActionFunc = useCallback(
    (hearingData) => {
      setCurrentHearing(hearingData);
      setShowHearingTranscriptModal(true);
    },
    [setCurrentHearing, setShowHearingTranscriptModal]
  );

  const handleFilingAction = useCallback(
    async (history, column, row, item) => {
      const docObj = [
        {
          itemType: item.id,
          status: row.workflow?.action,
          details: {
            applicationType: row.artifactType,
            applicationSentOn: getDate(parseInt(row.auditdetails.createdTime)),
            sender: row.owner,
            additionalDetails: row.additionalDetails,
            applicationId: row.id,
            auditDetails: row.auditDetails,
          },
          applicationContent: {
            tenantId: row.tenantId,
            fileStoreId: row.file?.fileStore,
            id: row.file?.id,
            documentType: row.file?.documentType,
            documentUid: row.file?.documentUid,
            additionalDetails: row.file?.additionalDetails,
          },
          comments: row.comments,
          artifactList: row,
        },
      ];
      if ("mark_as_evidence" === item.id || "unmark_as_evidence" === item.id) {
        setSelectedRow(row);
        setSelectedItem(item); // Store row before showing the modal
        setShowConfirmationModal(true);
      } else if ("mark_as_void" === item.id || "view_reason_for_voiding" === item.id) {
        setDocumentSubmission(docObj);
        setVoidReason(row?.reason);
        setShowVoidModal(true);
      } else if ("download_filing" === item.id) {
        downloadPdf(tenantId, row?.file?.fileStore);
      }
    },
    [downloadPdf, tenantId, setSelectedRow, setSelectedItem, setShowConfirmationModal, setDocumentSubmission, setVoidReason, setShowVoidModal]
  );

  const configList = useMemo(() => {
    const activeTabConfig = TabSearchconfigNew?.TabSearchconfig.find((tabConfig) => tabConfig.label === activeTab);
    if (!activeTabConfig) return [];

    return getTabConfig({
      tabConfig: activeTabConfig,
      filingNumber,
      caseCourtId,
      isEmployee,
      caseDetails,
      tenantId,
      caseRelatedData,
      orderTypeOptions,
      orderSetFunc,
      orderDeleteFunc,
      hearingTypeOptions,
      takeActionFunc,
      showMakeSubmission,
      docSetFunc,
      handleFilingAction,
      applicationTypeOptions,
      handleApplicationDeleteFunc,
      cnrNumber,
    });
  }, [
    activeTab,
    caseRelatedData,
    cnrNumber,
    filingNumber,
    history,
    isCitizen,
    tenantId,
    userInfo,
    caseDetails,
    userType,
    downloadPdf,
    ordersService,
    caseCourtId,
    orderTypeOptions,
    applicationTypeOptions,
    hearingTypeOptions,
    docSetFunc,
    orderSetFunc,
    orderDeleteFunc,
    handleApplicationDeleteFunc,
    takeActionFunc,
    handleFilingAction,
    showMakeSubmission,
  ]);

  const handleEvidenceAction = async () => {
    const docObj = [
      {
        itemType: selectedItem.id,
        status: selectedRow.workflow?.action,
        details: {
          applicationType: selectedRow.artifactType,
          applicationSentOn: getDate(parseInt(selectedRow.auditdetails.createdTime)),
          sender: selectedRow.owner,
          additionalDetails: selectedRow.additionalDetails,
          applicationId: selectedRow.id,
          auditDetails: selectedRow.auditDetails,
        },
        applicationContent: {
          tenantId: selectedRow.tenantId,
          fileStoreId: selectedRow.file?.fileStore,
          id: selectedRow.file?.id,
          documentType: selectedRow.file?.documentType,
          documentUid: selectedRow.file?.documentUid,
          additionalDetails: selectedRow.file?.additionalDetails,
        },
        comments: selectedRow.comments,
        artifactList: selectedRow,
      },
    ];
    const courtId = localStorage.getItem("courtId");
    try {
      const nextHearing = hearingDetails?.HearingList?.filter((hearing) => hearing.status === HearingWorkflowState.SCHEDULED);
      await DRISTIService.addADiaryEntry(
        {
          diaryEntry: {
            courtId: courtId,
            businessOfDay: `${selectedRow?.artifactNumber} ${selectedRow?.isEvidence ? "unmarked" : "marked"} as evidence`,
            tenantId: tenantId,
            entryDate: new Date().setHours(0, 0, 0, 0),
            caseNumber: caseDetails?.cmpNumber,
            referenceId: selectedRow?.artifactNumber,
            referenceType: "Documents",
            hearingDate: (Array.isArray(nextHearing) && nextHearing.length > 0 && nextHearing[0]?.startTime) || null,
            additionalDetails: {
              filingNumber: filingNumber,
              caseId: caseId,
            },
          },
        },
        {}
      );
      await handleMarkEvidence(docObj, selectedRow?.isEvidence);
      setShowConfirmationModal(false);
    } catch (error) {
      console.error("Error marking evidence:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({
        label: t("ERROR_MARKING_EVIDENCE"),
        error: true,
        errorId,
      });
    }
  };

  const newTabSearchConfig = useMemo(
    () => ({
      ...TabSearchconfigNew,
      TabSearchconfig: configList,
    }),
    [configList]
  );

  const config = useMemo(() => {
    return newTabSearchConfig?.TabSearchconfig;
  }, [newTabSearchConfig?.TabSearchconfig]);

  const voidModalConfig = useMemo(
    () =>
      getVoidModalConfig({
        showVoidModal,
        documentSubmission,
        evidenceUpdateMutation,
        filingNumber,
        refetchCaseData,
        setShowVoidModal,
        setShowToast,
        t,
        userType,
        voidReason,
        setVoidReason,
        setDocumentSubmission,
        VoidSubmissionBody,
        Urls,
      }),
    [documentSubmission, evidenceUpdateMutation, filingNumber, refetchCaseData, showVoidModal, t, userType, voidReason]
  );

  const dcaConfirmModalConfig = useMemo(
    () =>
      getDcaConfirmModalConfig({
        isDelayCondonationApplicable,
        isDelayApplicationPending,
        setIsOpenFromPendingTask,
        setIsOpenDCA,
        setSubmitModalInfo,
        admitCaseSubmitConfig,
        caseInfo,
        setModalInfo,
        setShowModal,
        isOpenFromPendingTask,
        t,
        delayCondonationTextStyle,
      }),
    [caseInfo, isDelayApplicationPending, isDelayCondonationApplicable, isOpenFromPendingTask, t]
  );

  const tabData = useMemo(() => {
    return TabSearchconfigNew?.TabSearchconfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: configItem?.label === activeTab ? true : false,
      displayLabel: configItem?.displayLabel,
    }));
  }, [activeTab]);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [documentCounter, setDocumentCounter] = useState(0);
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showScheduleHearingModal, setShowScheduleHearingModal] = useState(false);

  const isTabDisabled = useMemo(() => {
    return !viewEnabledStatuses.includes(caseDetails?.status);
  }, [caseDetails?.status]);

  const isCaseAdmitted = useMemo(() => {
    return caseDetails?.status === CaseWorkflowState.CASE_ADMITTED;
  }, [caseDetails?.status]);

  const getEvidence = async () => {
    try {
      // Add courtId to criteria if it exists
      const response = await DRISTIService.searchEvidence(
        {
          criteria: {
            filingNumber: filingNumber,
            artifactNumber: artifactNumber,
            tenantId: tenantId,
            asUser: authorizedUuid,
            ...(caseCourtId && { courtId: caseCourtId }),
          },
          tenantId,
        },
        {}
      );

      const evidence = response?.artifacts?.[0];

      const individualResponse = await DRISTIService.searchIndividualUser(
        {
          Individual: {
            individualId: evidence?.sourceID,
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );
      const individualData = individualResponse?.Individual?.[0];
      const fullName = getFullName(" ", individualData?.name?.givenName, individualData?.name?.otherNames, individualData?.name?.familyName);
      if (evidence) {
        setArtifact({ ...evidence, sender: fullName });
        setShowMakeAsEvidenceModal(true);
        // setShow(true);
      }
    } catch (error) {
      console.error("Error fetching evidence:", error);
      history.goBack();
    }
  };

  useEffect(() => {
    if (
      history?.location?.state?.triggerAdmitCase &&
      openAdmitCaseModal &&
      isDelayCondonationApplicable !== undefined &&
      isDelayApplicationCompleted !== undefined
    ) {
      if (isDelayCondonationApplicable && !isDelayApplicationCompleted) {
        setIsOpenFromPendingTask(true);
        setIsOpenDCA(true);
        setShowModal(false);
        setOpenAdmitCaseModal(false);
      } else {
        setSubmitModalInfo({ ...admitCaseSubmitConfig, caseInfo: caseInfo });
        setModalInfo({ type: "admitCase", page: 0 });
        setShowModal(true);
        setOpenAdmitCaseModal(false);
      }
    }
  }, [caseInfo, history?.location, isDelayApplicationCompleted, isDelayCondonationApplicable, openAdmitCaseModal]);

  useEffect(() => {
    if (history?.location?.state?.from === "orderSuccessModal") {
      refetchCaseData();
      setShowToast({
        label: t("ORDER_SUCCESSFULLY_ISSUED"),
        error: false,
      });
    }
  }, [history?.location, setShowToast, t]);

  useEffect(() => {
    if (history.location?.state?.orderObj && !showOrderReviewModal) {
      setCurrentOrder(history.location?.state?.orderObj);
      setShowOrderReviewModal(true);
    }
  }, [history.location?.state?.orderObj, OrderReviewModal, showOrderReviewModal]);

  useEffect(() => {
    if (history.location?.state?.applicationDocObj && !show) {
      setDocumentSubmission(history.location?.state?.applicationDocObj);
      setShow(true);

      if (history.location?.state?.isApplicationAccepted !== undefined) {
        setIsApplicationAccepted({ value: history.location?.state?.isApplicationAccepted });
      }
    }
  }, [history.location?.state?.applicationDocObj, history.location?.state?.isApplicationAccepted, show]);

  useEffect(() => {
    if (currentDiaryEntry && artifactNumber) {
      getEvidence();
    }
  }, [artifactNumber, currentDiaryEntry]);

  useEffect(() => {
    if (newWitnesToast) {
      setShowToast({ label: t("NEW_WITNESS_SUCCESSFULLY_ADDED"), error: false });
    }
  }, [newWitnesToast, setShowToast, t]);

  useEffect(() => {
    const { refApplicationNumber, ...rest } = location?.state || {};
    const applicationNumber = urlParams.get("applicationNumber") || refApplicationNumber;
    if (applicationData && applicationNumber) {
      const applicationDetails = applicationData?.applicationList?.filter((application) => application?.applicationNumber === applicationNumber)?.[0];
      setDocumentSubmission(
        applicationDetails?.documents?.map((doc) => {
          return {
            status: applicationDetails?.status,
            details: {
              applicationType: applicationDetails?.applicationType,
              applicationSentOn: getDate(parseInt(applicationDetails?.auditDetails?.createdTime)),
              sender: applicationDetails?.additionalDetails?.owner,
              additionalDetails: applicationDetails?.additionalDetails,
              applicationId: applicationDetails?.id,
              auditDetails: applicationDetails?.auditDetails,
            },
            applicationContent: {
              tenantId: applicationDetails?.tenantId,
              fileStoreId: doc.fileStore,
              id: doc.id,
              documentType: doc.documentType,
              documentUid: doc.documentUid,
              additionalDetails: doc.additionalDetails,
            },
            comments: applicationDetails?.comment ? applicationDetails?.comment : [],
            applicationList: applicationDetails,
          };
        })
      );
      setShow(true);
      if (refApplicationNumber) {
        history.replace({
          pathname: location.pathname,
          search: location.search,
          state: Object.keys(rest).length ? rest : null,
        });
      }
    }
  }, [applicationData, applicationNumber, location?.state?.refApplicationNumber]);

  useEffect(() => {
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const doc = JSON.parse(sessionStorage.getItem("docSubmission"));
    if (isSignSuccess) {
      if (doc) {
        setDocumentSubmission(doc);
      }
      if (!sessionStorage.getItem("markAsEvidenceSelectedItem")) {
        setShow(true);
      }
    }
  }, []);

  /**
   * Update breadcrumb navigation context when URL parameters change
   *
   * This effect synchronizes the breadcrumb navigation state with the current URL parameters.
   * It runs whenever the URL path, search parameters, or hash fragment changes.
   *
   * The effect:
   * 1. Extracts current case data from the breadcrumb context
   * 2. Gets the case ID and filing number from URL parameters
   * 3. Updates the breadcrumb context only if the values differ from current context
   *
   * This ensures consistent navigation context across the application when users
   * navigate directly to this page via URL rather than through the application flow.
   */
  useEffect(() => {
    const { caseId: caseIdFromBreadCrumb, filingNumber: filingNumberFromBreadCrumb } = BreadCrumbsParamsData;
    const caseId = urlParams.get("caseId");
    const filingNumber = urlParams.get("filingNumber");
    if (!(caseIdFromBreadCrumb === caseId && filingNumberFromBreadCrumb === filingNumber)) {
      setBreadCrumbsParamsData({ caseId, filingNumber });
    }
  }, [pathname, search, hash]);

  const updateCaseDetails = useCallback(
    async (action, data = {}) => {
      const newcasedetails = {
        ...caseDetails,
        additionalDetails: { ...caseDetails.additionalDetails, judge: data },
      };
      const caseCreatedByUuid = caseDetails?.auditDetails?.createdBy;
      let assignees = [];
      assignees.push(caseCreatedByUuid);

      return await DRISTIService.caseUpdateService(
        {
          cases: {
            ...newcasedetails,
            linkedCases: caseDetails?.linkedCases ? caseDetails?.linkedCases : [],
            workflow: {
              ...caseDetails?.workflow,
              action,
              ...(action === "SEND_BACK" && { assignes: assignees || [] }),
            },
          },
          tenantId,
        },
        tenantId
      ).then(async (response) => {
        await refetchCaseData();
        setUpdatedCaseDetails(response?.cases?.[0]);
      });
    },
    [caseDetails, tenantId, refetchCaseData]
  );

  const handleSendCaseBack = useCallback(
    async (props) => {
      updateCaseDetails("SEND_BACK", { comment: props?.commentForLitigant }).then((res) => {
        setModalInfo({ ...modalInfo, page: 1 });
      });
    },
    [updateCaseDetails, modalInfo, setModalInfo]
  );

  const handleAdmitDismissCaseOrder = useCallback(
    async (generateOrder, type) => {
      await handleAdmitDismissCaseOrderUtil({
        generateOrder,
        type,
        caseDetails,
        tenantId,
        cnrNumber,
        filingNumber,
        t,
        documentSubmission,
        ordersService,
        DRISTIService,
        Urls,
        history,
      });
    },
    [caseDetails, tenantId, cnrNumber, filingNumber, t, documentSubmission, ordersService, history]
  );

  const handleAdmitCase = useCallback(async () => {
    setCaseAdmitLoader(true);
    setOpenAdmitCaseModal(false);
    await handleAdmitDismissCaseOrder(true, "accept");
  }, [setCaseAdmitLoader, setOpenAdmitCaseModal, handleAdmitDismissCaseOrder]);

  const scheduleHearing = useCallback(
    async ({ purpose, participant, date }) => {
      return DRISTIService.createHearings(
        {
          hearing: {
            tenantId: tenantId,
            filingNumber: [caseDetails.filingNumber],
            hearingType: purpose,
            courtCaseNumber: caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber,
            cmpNumber: caseDetails?.cmpNumber,
            status: true,
            attendees: [
              ...Object.values(participant)
                .map((val) => val.attendees.map((attendee) => JSON.parse(attendee)))
                .flat(Infinity),
            ],
            startTime: Date.parse(
              `${date
                .split(" ")
                .map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date))
                .join(" ")}`
            ),
            endTime: Date.parse(
              `${date
                .split(" ")
                .map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date))
                .join(" ")}`
            ),
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
    },
    [tenantId, caseDetails.filingNumber, caseDetails.courtCaseNumber, caseDetails.cmpNumber]
  );

  const handleScheduleCase = useCallback(
    async (props) => {
      const hearingData = await scheduleHearing({ purpose: "ADMISSION", date: props.date, participant: props.participant });
      setSubmitModalInfo({
        ...scheduleCaseAdmissionConfig,
        caseInfo: [
          ...caseInfo,
          {
            key: "CS_ISSUE_NOTICE",
            value: props.date,
          },
          {
            hearingNumber: hearingData?.hearing?.hearingNumber,
          },
        ],
      });
      updateCaseDetails("SCHEDULE_ADMISSION_HEARING", props).then((res) => {
        setModalInfo({ ...modalInfo, page: 2 });
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Schedule Admission Hearing",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "PENDING_ADMISSION_HEARING",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            stateSla: todayDate + stateSla.SCHEDULE_HEARING,
            additionalDetails: {},
            tenantId,
          },
        });
      });
    },
    [
      scheduleHearing,
      caseInfo,
      updateCaseDetails,
      modalInfo,
      caseDetails?.filingNumber,
      caseDetails?.id,
      caseDetails?.caseTitle,
      updatedCaseDetails?.cnrNumber,
      todayDate,
      tenantId,
    ]
  );

  const handleScheduleNextHearing = () => {
    const reqBody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber: updatedCaseDetails?.cnrNumber || caseDetails?.cnrNumber,
        filingNumber: caseDetails?.filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: OrderTypes.SCHEDULE_OF_HEARING_DATE,
        orderCategory: "INTERMEDIATE",
        orderType: OrderTypes.SCHEDULE_OF_HEARING_DATE,
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
        additionalDetails: {
          formdata: {
            orderType: {
              code: OrderTypes.SCHEDULE_OF_HEARING_DATE,
              type: OrderTypes.SCHEDULE_OF_HEARING_DATE,
              name: `ORDER_TYPE_${OrderTypes.SCHEDULE_OF_HEARING_DATE}`,
            },
          },
        },
      },
    };
    DRISTIService.customApiService(Urls.dristi.ordersCreate, reqBody, { tenantId })
      .then((res) => {
        history.push(
          `/${window?.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`,
          {
            caseId: caseId,
            tab: "Orders",
          }
        );
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Schedule Hearing",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "SCHEDULE_HEARING",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            stateSla: todayDate + stateSla.SCHEDULE_HEARING,
            additionalDetails: {},
            tenantId,
          },
        });
      })
      .catch((error) => {
        console.error("Error while creating order", error);
        const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
        setShowToast({ label: t("ORDER_CREATION_FAILED"), error: true, errorId });
      });
  };

  const updateConfigWithCaseDetails = (config, caseDetails) => {
    const litigantsNames = caseDetails.litigants?.map((litigant) => {
      return { name: litigant.additionalDetails.fullName, individualId: litigant.individualId };
    });

    config.checkBoxes.forEach((checkbox) => {
      if (checkbox.key === "Litigants") {
        checkbox.dependentFields = litigantsNames;
      }
    });

    return config;
  };

  const updatedConfig = caseDetails && updateConfigWithCaseDetails(selectParticipantConfig, caseDetails);

  const { data: hearingDetails, refetch: refetchHearing } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const currentHearingAdmissionHearing = useMemo(
    () =>
      hearingDetails?.HearingList?.find((list) => list?.hearingType === "ADMISSION" && !(list?.status === "COMPLETED" || list?.status === "ABATED"))
        ?.hearingId,
    [hearingDetails?.HearingList]
  );

  const currentHearingId = useMemo(
    () => hearingDetails?.HearingList?.find((list) => ["SCHEDULED", "IN_PROGRESS"].includes(list?.status))?.hearingId,
    [hearingDetails?.HearingList]
  );

  const currentInProgressHearingId = useMemo(() => hearingDetails?.HearingList?.find((list) => ["IN_PROGRESS"].includes(list?.status))?.hearingId, [
    hearingDetails?.HearingList,
  ]);

  const currentInProgressHearing = useMemo(() => hearingDetails?.HearingList?.find((list) => list?.status === "IN_PROGRESS"), [
    hearingDetails?.HearingList,
  ]);

  const todayScheduledHearing = useMemo(() => {
    const now = new Date();
    const fromDate = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const toDate = new Date(now.setHours(23, 59, 59, 999)).getTime();

    return hearingDetails?.HearingList?.find((list) => list?.status === "SCHEDULED" && list?.startTime >= fromDate && list?.startTime <= toDate);
  }, [hearingDetails?.HearingList]);

  const currentActiveHearing = useMemo(() => hearingDetails?.HearingList?.find((list) => list?.hearingId === currentHearingId), [
    hearingDetails?.HearingList,
    currentHearingId,
  ]);

  const currentHearingStatus = useMemo(
    () =>
      hearingDetails?.HearingList?.length === 1 &&
      hearingDetails?.HearingList?.find((list) => list?.status === HearingWorkflowState.SCHEDULED)?.status,
    [hearingDetails?.HearingList]
  );

  const { data: apiOrdersData } = useSearchOrdersService(
    { criteria: { tenantId: tenantId, filingNumber, status: "PUBLISHED", ...(caseCourtId && { courtId: caseCourtId }) } },
    { tenantId },
    filingNumber,
    Boolean(filingNumber && !historyOrderData && caseCourtId),
    0
  );
  const ordersData = useMemo(() => historyOrderData || apiOrdersData, [historyOrderData, apiOrdersData]);

  const onTabChange = useCallback(
    (_, i, label = "") => {
      history.replace(
        `${path}?caseId=${caseId}&filingNumber=${filingNumber}&tab=${i?.label ? i?.label : label}${fromHome ? `&fromHome=${fromHome}` : ""}`,
        {
          caseData,
          orderData: ordersData,
          homeFilteredData: homeFilteredData,
          homeActiveTab: homeActiveTab,
        }
      );
    },
    [caseData, caseId, filingNumber, history, ordersData, path, fromHome]
  );

  const hasAnyRelevantOrderType = useMemo(() => {
    if (!ordersData?.list) return false;

    const validTypes = ["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT", "MISCELLANEOUS_PROCESS"];

    return ordersData.list.some((item) => {
      if (item?.orderCategory === "COMPOSITE") {
        return item?.compositeItems?.some((subItem) => validTypes.includes(subItem?.orderType));
      } else {
        return validTypes.includes(item?.orderType);
      }
    });
  }, [ordersData?.list]);

  const handleMakeSubmission = useCallback(() => {
    history.push(`/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const handleSubmitDocuments = useCallback(() => {
    history.push(`/${window?.contextPath}/citizen/submissions/submit-document?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const handleDownloadPDF = useCallback(async () => {
    await handleDownloadPDFUtil({
      caseDetails,
      tenantId,
      DRISTIService,
      setCasePdfError,
      setCasePdfFileStoreId,
      setDownloadCasePdfLoading,
      setShowToast,
      t,
    });
  }, [caseDetails, tenantId, setShowToast, t]);

  useEffect(() => {
    if (showDownloadCasePdfModal) {
      handleDownloadPDF();
    }
  }, [showDownloadCasePdfModal, handleDownloadPDF]);

  useEffect(() => {
    if (!caseDetails) return;
    // if the same advocate is working as a senior advocate himself as well as junior advocate under another advocate in the same case- > show a warning popup.
    const isJuniorAndDirectAdvocate = checkIfCaseAccessThroughMultipleAdvocates(caseDetails, userUuid);
    const shouldShowPopup = sessionStorage.getItem("showPopupIfCaseAccessThroughMultipleAdvocates");
    if (isJuniorAndDirectAdvocate && !showPopupForClerkOrAdvocate?.show && shouldShowPopup) {
      const message = `${t("YOU_HAVE_CASE_ACCESS_THROUGH_MULTIPLE_ADVOCATES")} ${
        storedAdvocate?.uuid === userUuid ? t("yourself.") : `Advocate ${storedAdvocate?.advocateName}'s office.`
      }`;
      setShowPopupForClerkOrAdvocate({ show: true, message: message });
    }
  }, [showPopupForClerkOrAdvocate, caseDetails, userUuid, storedAdvocate, t]);

  const handleDownloadClick = useCallback(() => {
    if (casePdfFileStoreId) {
      downloadPdf(tenantId, casePdfFileStoreId);
    }
  }, [casePdfFileStoreId, downloadPdf, tenantId]);

  const pipComplainants = useMemo(() => getPipComplainants(caseDetails), [caseDetails]);

  const pipAccuseds = useMemo(() => getPipAccuseds(caseDetails), [caseDetails]);

  const complainantsList = useMemo(() => getComplainantsList(caseDetails, pipComplainants, pipAccuseds, authorizedUuid), [
    caseDetails,
    pipComplainants,
    pipAccuseds,
    authorizedUuid,
  ]);

  const handleCitizenAction = useCallback(
    async (option) => {
      try {
        if (option.value === "RAISE_APPLICATION") {
          history.push(`/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}`);
        } else if (option.value === "SUBMIT_DOCUMENTS") {
          history.push(`/${window?.contextPath}/citizen/submissions/submit-document?filingNumber=${filingNumber}`);
        } else if (option.value === "GENERATE_BAIL_BOND") {
          if (complainantsList?.length === 1) {
            setApiCalled(true);
            const res = await DRISTIService?.getPendingTaskService(
              {
                SearchCriteria: {
                  tenantId,
                  moduleName: "Pending Tasks Service",
                  moduleSearchCriteria: {
                    isCompleted: false,
                    ...(isCitizen && { assignedTo: authorizedUuid }),
                    ...(courtId && { courtId }),
                    filingNumber,
                    entityType: "bail bond",
                  },
                  limit: 1000,
                  offset: 0,
                },
              },
              { tenantId }
            );
            const pendingTaskResponse = res?.data || [];
            const pendingTaskDetails = convertTaskResponseToPayload(pendingTaskResponse);

            if (pendingTaskResponse?.length > 0 && pendingTaskDetails?.additionalDetails?.bailbondId) {
              history.push(
                `/${window?.contextPath}/citizen/submissions/bail-bond/view?filingNumber=${filingNumber}&bailBondId=${pendingTaskDetails?.additionalDetails?.bailbondId}`
              );
            } else if (pendingTaskResponse?.length > 0) {
              history.push(`/${window?.contextPath}/citizen/submissions/bail-bond?filingNumber=${filingNumber}`, {
                state: {
                  params: {
                    actualReferenceId: pendingTaskDetails?.referenceId,
                  },
                },
              });
            } else {
              history.push(`/${window?.contextPath}/citizen/submissions/bail-bond?filingNumber=${filingNumber}`);
            }
          } else {
            history.push(`/${window?.contextPath}/citizen/submissions/bail-bond?filingNumber=${filingNumber}`);
          }
        }
      } catch (error) {
        console.error("Error handling citizen action:", error);
        const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
        setShowToast({
          label: t("BAIL_BOND_SEARCH_FAILED"),
          error: true,
          errorId,
        });
      } finally {
        setApiCalled(false);
      }
    },
    [history, filingNumber]
  );

  const handleCourtAction = useCallback(() => {
    history.push(`/${window?.contextPath}/employee/submissions/submit-document?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const hideNextHearingButton = useMemo(() => {
    const validData = dataForNextHearings?.filter((item) =>
      ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS", "COMPLETED"]?.includes(item?.businessObject?.hearingDetails?.status)
    );
    const index = validData?.findIndex((item) => item?.businessObject?.hearingDetails?.hearingNumber === homeNextHearingFilter?.homeHearingNumber);
    return index === -1 || validData?.length <= 1;
  }, [dataForNextHearings, homeNextHearingFilter]);

  const customNextHearing = useCallback(() => {
    if (dataForNextHearings?.length === 0) {
      history.push(`/${window?.contextPath}/employee/home/home-screen`);
    } else {
      const validData = dataForNextHearings?.filter((item) =>
        ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS", "COMPLETED"]?.includes(item?.businessObject?.hearingDetails?.status)
      );
      const index = validData?.findIndex((item) => item?.businessObject?.hearingDetails?.hearingNumber === homeNextHearingFilter?.homeHearingNumber);
      if (index === -1 || validData?.length === 1) {
        history.push(`/${window?.contextPath}/employee/home/home-screen`);
      } else {
        const row = validData[(index + 1) % validData?.length];
        localStorage.setItem(
          "Digit.homeNextHearingFilter",
          JSON.stringify({
            homeFilterDate: row?.businessObject?.hearingDetails?.fromDate,
            homeHearingNumber: row?.businessObject?.hearingDetails?.hearingNumber,
          })
        );
        history.push(
          `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`
        );
      }
    }
  }, [dataForNextHearings, history, homeNextHearingFilter]);

  const nextHearing = useCallback(
    (isStartHearing) => {
      if (data?.length === 0) {
        history.push(`/${window?.contextPath}/employee/home/home-screen`);
      } else {
        const validData = data?.filter((item) => ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS"]?.includes(item?.businessObject?.hearingDetails?.status));
        const index = validData?.findIndex(
          (item) => item?.businessObject?.hearingDetails?.hearingNumber === (currentInProgressHearing?.hearingId || todayScheduledHearing?.hearingId)
        );
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
                      ...(row?.businessObject?.hearingDetails?.courtId && isEmployee && { courtId: row?.businessObject?.hearingDetails?.courtId }),
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
    [currentInProgressHearing?.hearingId, data, history, isEmployee, todayScheduledHearing?.hearingId, userType]
  );

  const handleCaseTransition = async (actionType) => {
    try {
      setApiCalled(true);

      await hearingService.updateHearings(
        {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          hearing: {
            ...currentInProgressHearing,
            workflow: {
              action: actionType === "PASS_OVER_START_NEXT_HEARING" ? "PASS_OVER" : "CLOSE",
            },
          },
          hearingType: "",
          status: "",
        },
        { applicationNumber: "", cnrNumber: "" }
      );

      nextHearing(true);
    } catch (error) {
      console.error("Error in updating hearing status", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({
        label: t("HEARING_STATUS_UPDATE_FAILED"),
        error: true,
        errorId,
      });
    } finally {
      setApiCalled(false);
    }
  };

  const handleEmployeeAction = useCallback(
    async (option) => {
      if (option.value === "DOWNLOAD_CASE_FILE") {
        setShowDownloadCasePdfModal(true);
      } else if (option.value === "NEXT_HEARING") {
        customNextHearing();
      } else if (option.value === "VIEW_CALENDAR") {
        setShowCalendarModal(true);
      } else if (option.value === "GENERATE_ORDER") {
        handleSelect("GENERATE_ORDER");
      } else if (option.value === "END_HEARING") {
        setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: true });
      } else if (option.value === "TAKE_WITNESS_DEPOSITION") {
        setShowWitnessModal({ show: true, artifactNumber: null });
      } else if (option.value === "RECORD_EXAMINATION_OF_ACCUSED") {
        setShowExaminationModal(true);
      } else if (option.value === "SUBMIT_DOCUMENTS") {
        handleCourtAction();
      } else if (option.value === "GENERATE_PAYMENT_DEMAND") {
        setShowPaymentDemandModal(true);
      } else if (option.value === "SHOW_TIMELINE") {
        setShowAllStagesModal(true);
      } else if (option.value === "CREATE_BAIL_BOND") {
        setShowBailBondModal(true);
      } else if (option.value === "ADD_WITNESS") {
        setShowAddWitnessModal(true);
      } else if (option.value === "PASS_OVER_START_NEXT_HEARING" || option.value === "CS_CASE_END_START_NEXT_HEARING") {
        handleCaseTransition(option.value);
      } else if (option.value === "RECORD_PLEA") {
        history.push(`/${window?.contextPath}/employee/submissions/record-plea?filingNumber=${filingNumber}`);
        return;
      }
    },
    [
      caseCourtId,
      caseDetails?.filingNumber,
      caseDetails?.tenantId,
      currentInProgressHearing?.hearingId,
      handleCourtAction,
      nextHearing,
      ordersService,
    ]
  );

  const openHearingModule = useCallback(() => {
    setShowScheduleHearingModal(true);
    if (!isCaseAdmitted) {
      setCreateAdmissionOrder(true);
    }
  }, [isCaseAdmitted]);

  const handleSelect = useCallback(
    async (option) => {
      if (option === t("MAKE_SUBMISSION")) {
        history.push(`/${window?.contextPath}/employee/submissions/submissions-create?filingNumber=${filingNumber}&applicationType=DOCUMENT`);
        return;
      }
      if (option === t("SUBMIT_DOCUMENTS")) {
        history.push(`/${window?.contextPath}/employee/submissions/submit-document?filingNumber=${filingNumber}`);
        return;
      }
      if (option === t("SCHEDULE_HEARING")) {
        openHearingModule();
        return;
      } else if (option === t("REFER_TO_ADR")) {
        const reqBody = {
          order: {
            createdDate: null,
            tenantId,
            cnrNumber,
            filingNumber: filingNumber,
            statuteSection: {
              tenantId,
            },
            orderTitle: "REFERRAL_CASE_TO_ADR",
            orderCategory: "INTERMEDIATE",
            orderType: "REFERRAL_CASE_TO_ADR",
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
            additionalDetails: {
              formdata: {
                orderType: {
                  type: "REFERRAL_CASE_TO_ADR",
                  code: "REFERRAL_CASE_TO_ADR",
                  name: "ORDER_TYPE_REFERRAL_CASE_TO_ADR",
                },
              },
            },
          },
        };
        ordersService
          .createOrder(reqBody, { tenantId })
          .then((res) => {
            history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`, {
              caseId: caseId,
              tab: activeTab,
            });
          })
          .catch((err) => {
            const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
            setShowToast({
              label: t("ORDER_CREATION_FAILED"),
              error: true,
              errorId,
            });
          });
        return;
      } else if (option === t("MANDATORY_SUBMISSIONS_RESPONSES")) {
        const reqBody = {
          order: {
            createdDate: null,
            tenantId,
            cnrNumber,
            filingNumber: filingNumber,
            statuteSection: {
              tenantId,
            },
            orderTitle: "MANDATORY_SUBMISSIONS_RESPONSES",
            orderCategory: "INTERMEDIATE",
            orderType: "MANDATORY_SUBMISSIONS_RESPONSES",
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
            additionalDetails: {
              formdata: {
                orderType: {
                  type: "MANDATORY_SUBMISSIONS_RESPONSES",
                  code: "MANDATORY_SUBMISSIONS_RESPONSES",
                  name: "ORDER_TYPE_MANDATORY_SUBMISSIONS_RESPONSES",
                },
              },
            },
          },
        };
        ordersService
          .createOrder(reqBody, { tenantId })
          .then((res) => {
            history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`, {
              caseId: caseId,
              tab: activeTab,
            });
          })
          .catch((err) => {
            const errorId = err?.response?.headers?.["x-correlation-id"] || err?.response?.headers?.["X-Correlation-Id"];
            setShowToast({
              label: t("ORDER_CREATION_FAILED"),
              error: true,
              errorId,
            });
          });
        return;
      } else if (option === t("GENERATE_PAYMENT_DEMAND")) {
        setShowPaymentDemandModal(true);
        setShowMenu(false);
        return;
      }

      try {
        setApiCalled(true);

        let response;

        if (currentInProgressHearing) {
          response = await DRISTIService.getDraftOrder(
            {
              hearingDraftOrder: {
                cnrNumber,
                filingNumber,
                tenantId,
                hearingNumber: currentInProgressHearing?.hearingId,
                hearingType: currentInProgressHearing?.hearingType,
              },
            },
            {}
          );
        } else {
          response = await DRISTIService.createOrder(
            {
              order: {
                tenantId,
                cnrNumber,
                filingNumber,
                statuteSection: { tenantId },
                status: "",
                orderTitle: t("DEFAULT_ORDER_TITLE"),
                orderType: "",
                orderCategory: "INTERMEDIATE",
                isActive: true,
                workflow: {
                  action: "SAVE_DRAFT",
                  documents: [{}],
                },
              },
            },
            { tenantId }
          );
        }

        history.push(
          `/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${response?.order?.orderNumber}`,
          { caseId, tab: "Orders" }
        );
      } catch (error) {
        console.error("Error fetching order", error);
        const errorCode = error?.response?.data?.Errors?.[0]?.code;
        const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
        const errorMsg = errorCode === "ORDER_ALREADY_PUBLISHED" ? "ORDER_ALREADY_PUBLISHED" : "CORE_SOMETHING_WENT_WRONG";
        setShowToast({
          label: t(errorMsg),
          error: true,
          errorId,
        });
      } finally {
        setApiCalled(false);
      }
    },
    [
      t,
      currentInProgressHearing,
      history,
      filingNumber,
      openHearingModule,
      tenantId,
      cnrNumber,
      OrderWorkflowAction.SAVE_DRAFT,
      ordersService,
      caseId,
      activeTab,
      setShowToast,
    ]
  );

  const handleDownload = useCallback(
    (filestoreId) => {
      if (filestoreId) {
        downloadPdf(tenantId, filestoreId);
      }
    },
    [downloadPdf, tenantId]
  );

  const handleOrdersTab = useCallback(() => {
    if (history.location?.state?.orderObj) {
      showOrderReviewModal && setShowOrderReviewModal(false);
      history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Orders`, {
        homeFilteredData: homeFilteredData,
        homeActiveTab: homeActiveTab,
      });
    } else {
      showOrderReviewModal && setShowOrderReviewModal(false);
      showNotificationModal && setShowNotificationModal(false);
    }
  }, [history, userType, caseId, filingNumber, showOrderReviewModal, showNotificationModal, homeFilteredData, homeActiveTab]);

  const handleExtensionRequest = useCallback(
    (orderNumber, itemId, litigant, litigantIndId) => {
      let url = `/${
        window?.contextPath
      }/citizen/submissions/submissions-create?filingNumber=${filingNumber}&orderNumber=${orderNumber}&isExtension=true&litigant=${
        currentOrder?.litigant || litigant
      }&litigantIndId=${currentOrder?.litigantIndId || litigantIndId}`;
      if (itemId) url += `&itemId=${itemId}`;
      history.push(url);
    },
    [currentOrder?.litigant, currentOrder?.litigantIndId, filingNumber, history]
  );

  const handleSubmitDocument = useCallback(
    (orderNumber, itemId, litigant, litigantIndId) => {
      let url = `/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}&orderNumber=${orderNumber}&litigant=${
        currentOrder?.litigant || litigant
      }&litigantIndId=${currentOrder?.litigantIndId || litigantIndId}`;
      if (itemId) url += `&itemId=${itemId}`;
      history.push(url);
    },
    [currentOrder?.litigant, currentOrder?.litigantIndId, filingNumber, history]
  );

  const handleActionModal = () => {
    updateCaseDetails("REJECT").then(() => {
      history.push(homePath);
    });
  };

  const caseAdmittedSubmit = (data) => {
    handleCaseAdmittedSubmit({
      data,
      tenantId,
      cnrNumber,
      filingNumber,
      ordersService,
      DRISTIService,
      Urls,
      t,
      updatedCaseDetails,
      caseDetails,
      todayDate,
      stateSla,
      refetchCaseData,
      history,
      setShowToast,
    });
  };

  const employeeActionOptions = useMemo(() => {
    return getEmployeeActionOptions(isEmployee, hasHearingPriorityView, currentInProgressHearing);
  }, [currentInProgressHearing, hasHearingPriorityView, isEmployee]);

  const allowedEmployeeActionOptions = useMemo(() => {
    return filterActionsByPermissions(employeeActionOptions, employeeActionsPermissionsMapping, roles);
  }, [employeeActionOptions, roles]);

  const allowedTakeActionOptions = useMemo(() => {
    return filterActionsByPermissions(takeActionOptions, employeeActionsPermissionsMapping, roles)?.map((obj) => t(obj?.label));
  }, [roles, t]);

  const employeeCrumbs = useMemo(() => getEmployeeCrumbs({ t, isCitizen, homeFilteredData, homeActiveTab, fromHome, path, homeTabEnum }), [
    t,
    homeFilteredData,
    fromHome,
    isCitizen,
    path,
    homeActiveTab,
  ]);

  const advocateName = useMemo(() => getAdvocateName({ caseDetails, t }), [caseDetails, t]);

  // outcome always null unless case went on final stage
  const showActionBar = useMemo(
    () =>
      // If there is any hearing in progress, do not show action bar
      !currentInProgressHearing &&
      [CaseWorkflowState.PENDING_NOTICE, CaseWorkflowState.PENDING_RESPONSE].includes(caseDetails?.status) &&
      !isCitizen &&
      !caseDetails?.outcome,
    [caseDetails?.status, caseDetails?.outcome, isCitizen, currentInProgressHearing]
  );

  const viewActionBar = useMemo(() => {
    return showActionBar && currentHearingStatus === HearingWorkflowState.SCHEDULED;
  }, [showActionBar, currentHearingStatus]);

  const handleAllNoticeGeneratedForHearing = (hearingNumber) => {
    setIsShow(!isShow);
  };

  const createBailBondTask = async () => {
    await createBailBondTaskUtil({
      tenantId,
      roles,
      filingNumber,
      courtId,
      HomeService,
      DRISTIService,
      Urls,
      cnrNumber,
      caseDetails,
      bailPendingTaskExpiryDays,
      todayDate,
      setBailBondLoading,
      setIsBailBondTaskExists,
      setShowBailBondModal,
      setShowToast,
      t,
    });
  };

  const handleDeleteOrder = async () => {
    await handleDeleteOrderUtil({
      deleteOrder,
      tenantId,
      ordersService,
      Urls,
      cnrNumber,
      filingNumber,
      caseDetails,
      history,
      path,
      caseId,
      config,
      setDeleteOrder,
      setLoader,
      setShowToast,
      setUpdateCounter,
      t,
    });
  };

  const handleDeleteApplication = async () => {
    await handleDeleteApplicationUtil({
      deleteApplication,
      tenantId,
      submissionService,
      setDeleteApplication,
      setLoader,
      setShowToast,
      t,
    });
  };

  const inboxComposer = useMemo(() => {
    if (
      activeTab === "Documents" &&
      config?.sections?.search?.uiConfig?.fields?.[0]?.key === "owner" &&
      !(config?.sections?.search?.uiConfig?.fields?.[0]?.populators?.options?.length > 0)
    ) {
      return;
    }
    return <InboxSearchComposer key={`${config?.label}-${updateCounter}`} configs={config} showTab={false}></InboxSearchComposer>;
  }, [config, activeTab, updateCounter]);

  const documentsInboxSearch = useMemo(() => {
    return (
      <DocumentsV2
        caseDetails={caseDetails}
        caseCourtId={courtId}
        tenantId={tenantId}
        filingNumber={filingNumber}
        caseId={caseId}
        cnrNumber={cnrNumber}
        setDocumentSubmission={setDocumentSubmission}
        setShow={setShow}
        setShowMakeAsEvidenceModal={setShowMakeAsEvidenceModal}
        setShowConfirmationModal={setShowConfirmationModal}
        setVoidReason={setVoidReason}
        setShowVoidModal={setShowVoidModal}
        setSelectedRow={setSelectedRow}
        setSelectedItem={setSelectedItem}
        counter={documentCounter}
        // handleFilingAction={handleFilingAction}
        setShowWitnessDepositionDoc={setShowWitnessDepositionDoc}
        setExaminationDocumentNumber={setExaminationDocumentNumber}
        setShowWitnessModal={setShowWitnessModal}
        setShowExaminationModal={setShowExaminationModal}
        setDocumentCounter={setDocumentCounter}
      />
    );
  }, [caseDetails, courtId, tenantId, filingNumber, caseId, cnrNumber, documentCounter]);

  const caseTimeLine = useMemo(() => {
    return (
      <WorkflowTimeline
        t={t}
        applicationNo={caseDetails?.filingNumber}
        tenantId={tenantId}
        businessService="case-default"
        onViewCasePage={true}
        setShowAllStagesModal={setShowAllStagesModal}
        modalView={true}
      />
    );
  }, [t, caseDetails?.filingNumber, tenantId]);

  const memoisedCaseComplaintTab = useMemo(() => {
    return <ViewCaseFile t={t} inViewCase={true} caseDetailsAdmitted={caseDetails} />;
  }, [t, caseDetails]);

  const MemoCaseOverview = useMemo(() => {
    return (
      <CaseOverviewV2
        caseData={caseRelatedData}
        filingNumber={filingNumber}
        currentHearingId={currentHearingId}
        caseDetails={caseDetails}
        showNoticeProcessModal={!isCitizen}
        isBailBondTaskExists={isBailBondTaskExists}
        ordersDataFromParent={ordersData}
        hearingsDataFromParent={hearingDetails}
      />
    );
  }, [caseRelatedData, filingNumber, currentHearingId, caseDetails, isCitizen, isBailBondTaskExists, ordersData, hearingDetails]);

  const popupForJuniorAdvocate = useMemo(() => getPopupForJuniorAdvocate(t, showPopupForClerkOrAdvocate, setShowPopupForClerkOrAdvocate), [
    t,
    showPopupForClerkOrAdvocate,
  ]);

  const isMemberPartOfCase = useMemo(() => getIsMemberPartOfCase(caseDetails, isAdvocateOrClerk, userUuid, getAllAdvocatesAndClerksUuids), [
    caseDetails,
    isAdvocateOrClerk,
    userUuid,
  ]);

  useEffect(() => {
    if (isMemberPartOfCase === false) {
      history.push(homePath);
    }
  }, [isMemberPartOfCase, history, homePath]);

  if (isEpostUser) {
    history.push(homePath);
  }

  if (isEmployee && caseData?.cases?.status && !judgeReviewStages.includes(caseData.cases.status)) {
    history.push(homePath);
  }

  return (
    <div className="admitted-case" style={{ position: "absolute", width: "100%" }}>
      <Breadcrumb crumbs={employeeCrumbs} breadcrumbStyle={{ paddingLeft: 20 }}></Breadcrumb>
      {apiCalled && (
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
      <CaseHeader
        t={t}
        caseApiLoading={caseApiLoading}
        isCaseFetching={isCaseFetching}
        caseDetails={caseDetails}
        showJoinCase={showJoinCase}
        showMakeSubmission={showMakeSubmission}
        isCitizen={isCitizen}
        showTakeAction={showTakeAction}
        isTabDisabled={isTabDisabled}
        showMenu={showMenu}
        showCitizenMenu={showCitizenMenu}
        showOtherMenu={showOtherMenu}
        citizenActionOptions={citizenActionOptions}
        allowedTakeActionOptions={allowedTakeActionOptions}
        allowedEmployeeActionOptions={allowedEmployeeActionOptions}
        currentInProgressHearing={currentInProgressHearing}
        hasHearingPriorityView={hasHearingPriorityView}
        hasHearingEditAccess={hasHearingEditAccess}
        userRoles={userRoles}
        isJudge={isJudge}
        hideNextHearingButton={hideNextHearingButton}
        apiCalled={apiCalled}
        homeNextHearingFilter={homeNextHearingFilter}
        JoinCaseHome={JoinCaseHome}
        advocateName={advocateName}
        delayCondonationData={delayCondonationData}
        isDelayApplicationCompleted={isDelayApplicationCompleted}
        isDelayApplicationPending={isDelayApplicationPending}
        hasAnyRelevantOrderType={hasAnyRelevantOrderType}
        tabData={tabData}
        handleTakeAction={handleTakeAction}
        handleCitizenAction={handleCitizenAction}
        handleEmployeeAction={handleEmployeeAction}
        handleSelect={handleSelect}
        setShowCitizenMenu={setShowCitizenMenu}
        setShowMenu={setShowMenu}
        setShowJoinCase={setShowJoinCase}
        setShowDownloadCasePdfModal={setShowDownloadCasePdfModal}
        setShowAllStagesModal={setShowAllStagesModal}
        setShowOtherMenu={setShowOtherMenu}
        onTabChange={onTabChange}
        handleAllNoticeGeneratedForHearing={handleAllNoticeGeneratedForHearing}
      />
      <CaseTabContent
        t={t}
        config={config}
        caseRelatedData={caseRelatedData}
        setUpdateCounter={setUpdateCounter}
        openDraftModal={openDraftModal}
        openSubmissionViewModal={openSubmissionViewModal}
        showMakeSubmission={showMakeSubmission}
        userRoles={userRoles}
        isCitizen={isCitizen}
        setShowAddWitnessModal={setShowAddWitnessModal}
        handleSelect={handleSelect}
        handleMakeSubmission={handleMakeSubmission}
        handleSubmitDocuments={handleSubmitDocuments}
        tabData={tabData}
        activeTab={activeTab}
        documentsInboxSearch={documentsInboxSearch}
        inboxComposer={inboxComposer}
        showActionBar={showActionBar}
        viewActionBar={viewActionBar}
        MemoCaseOverview={MemoCaseOverview}
        memoisedCaseComplaintTab={memoisedCaseComplaintTab}
        caseDetails={caseDetails}
        tenantId={tenantId}
        filingNumber={filingNumber}
      />
      {showWitnessDepositionDoc?.show && (
        <WitnessDepositionDocModal
          t={t}
          docObj={showWitnessDepositionDoc?.docObj}
          setShowWitnessDepositionDoc={setShowWitnessDepositionDoc}
          showWitnessModal={showWitnessModal}
          setShowWitnessModal={setShowWitnessModal}
        />
      )}
      {show && (
        <EvidenceModal
          documentSubmission={documentSubmission}
          show={show}
          setShow={setShow}
          userRoles={userRoles}
          modalType={tabData?.filter((tab) => tab.active)?.[0]?.label}
          setUpdateCounter={setUpdateCounter}
          setShowToast={setShowToast}
          caseData={caseRelatedData}
          caseId={caseId}
          setIsDelayApplicationPending={setIsDelayApplicationPending}
          currentDiaryEntry={currentDiaryEntry}
          artifact={artifact}
          setShowMakeAsEvidenceModal={setShowMakeAsEvidenceModal}
          isApplicationAccepted={isApplicationAccepted}
          history={history}
        />
      )}
      {showOrderReviewModal && (
        <PublishedOrderModal
          t={t}
          order={currentOrder}
          handleDownload={handleDownload}
          handleRequestLabel={handleExtensionRequest}
          handleSubmitDocument={handleSubmitDocument}
          extensionApplications={extensionApplications}
          productionOfDocumentApplications={productionOfDocumentApplications}
          caseStatus={caseStatus}
          handleOrdersTab={handleOrdersTab}
          submitBailDocumentsApplications={submitBailDocumentsApplications}
        />
      )}
      {showHearingTranscriptModal && (
        <HearingTranscriptModal t={t} hearing={currentHearing} setShowHearingTranscriptModal={setShowHearingTranscriptModal} />
      )}
      {showScheduleHearingModal && (
        <ScheduleHearing
          setUpdateCounter={setUpdateCounter}
          setShowToast={setShowToast}
          tenantId={tenantId}
          caseData={caseRelatedData}
          setShowModal={setShowScheduleHearingModal}
          caseAdmittedSubmit={caseAdmittedSubmit}
          isCaseAdmitted={isCaseAdmitted}
          createAdmissionOrder={createAdmissionOrder}
          delayCondonationData={delayCondonationData}
          hearingDetails={hearingDetails}
          isDelayApplicationPending={isDelayApplicationPending}
          isDelayApplicationCompleted={isDelayApplicationCompleted}
          isDelayApplicationRejected={isDelayApplicationRejected}
        />
      )}
      {orderDraftModal && <ViewAllOrderDrafts t={t} setShow={setOrderDraftModal} draftOrderList={draftOrderList} filingNumber={filingNumber} />}
      {submissionsViewModal && (
        <ViewAllSubmissions
          t={t}
          setShow={setSubmissionsViewModal}
          submissionList={submissionsViewList.list}
          openEvidenceModal={submissionsViewList.func}
          filingNumber={filingNumber}
          asUser={getAuthorizedUuid(userInfo?.uuid)}
        />
      )}
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
      {isOpenDCA && <DocumentModal config={dcaConfirmModalConfig} />}
      {showModal && (
        <AdmissionActionModal
          t={t}
          setShowModal={setShowModal}
          setSubmitModalInfo={setSubmitModalInfo}
          submitModalInfo={submitModalInfo}
          modalInfo={modalInfo}
          setModalInfo={setModalInfo}
          handleSendCaseBack={handleSendCaseBack}
          handleAdmitCase={handleAdmitCase}
          path={path}
          handleScheduleCase={handleScheduleCase}
          updatedConfig={updatedConfig}
          tenantId={tenantId}
          handleScheduleNextHearing={handleScheduleNextHearing}
          caseAdmitLoader={caseAdmitLoader}
          caseDetails={caseDetails}
          isAdmissionHearingAvailable={Boolean(currentHearingAdmissionHearing)}
          setOpenAdmitCaseModal={setOpenAdmitCaseModal}
          delayCondonationData={delayCondonationData}
          hearingDetails={hearingDetails}
          isDelayApplicationPending={isDelayApplicationPending}
          isDelayApplicationCompleted={isDelayApplicationCompleted}
          isDelayApplicationRejected={isDelayApplicationRejected}
        ></AdmissionActionModal>
      )}
      {showPopupForClerkOrAdvocate?.show && popupForJuniorAdvocate}
      <DismissCaseModal
        t={t}
        showDismissCaseConfirmation={showDismissCaseConfirmation}
        setShowDismissCaseConfirmation={setShowDismissCaseConfirmation}
        handleActionModal={handleActionModal}
      />
      <PendingDelayModal
        t={t}
        showPendingDelayApplication={showPendingDelayApplication}
        setShowPendingDelayApplication={setShowPendingDelayApplication}
      />
      {isShow && (
        <NoticeProcessModal
          handleClose={() => {
            setIsShow(false);
          }}
          filingNumber={filingNumber}
          currentHearingId={currentHearingId}
          caseDetails={caseDetails}
        />
      )}
      {showVoidModal && <DocumentModal config={voidModalConfig} />}
      {showNotificationModal && (
        <PublishedNotificationModal
          t={t}
          notification={currentNotification}
          handleDownload={handleDownload}
          filingNumber={filingNumber}
          handleOrdersTab={handleOrdersTab}
        />
      )}
      {showMakeAsEvidenceModal && (
        <MarkAsEvidence
          setShowToast={setShowToast}
          t={t}
          evidenceDetailsObj={artifact || documentSubmission?.[0]?.artifactList || selectedRow}
          setDocumentCounter={setDocumentCounter}
          isEvidenceLoading={false}
          handleAction={handleEvidenceAction}
          setShowMakeAsEvidenceModal={setShowMakeAsEvidenceModal}
        />
      )}
      {showConfirmationModal && (
        <ConfirmEvidenceAction
          t={t}
          setShowConfirmationModal={setShowConfirmationModal}
          type={showConfirmationModal.type}
          setShow={setShow}
          handleAction={handleEvidenceAction}
          isDisabled={false}
          isEvidence={documentSubmission?.[0]?.artifactList?.isEvidence}
          isFromActions={true}
        />
      )}
      {showCalendarModal && <CalendarModal t={t} showCalendarModal={showCalendarModal} setShowCalendarModal={setShowCalendarModal} />}
      {showEndHearingModal.openEndHearingModal && (
        <EndHearingModal
          showEndHearingModal={showEndHearingModal}
          setShowEndHearingModal={setShowEndHearingModal}
          t={t}
          passOver={passOver}
          setPassOver={setPassOver}
          apiCalled={apiCalled}
          setApiCalled={setApiCalled}
          hearingService={hearingService}
          Digit={Digit}
          currentInProgressHearing={currentInProgressHearing}
          nextHearing={nextHearing}
          history={history}
          setShowToast={setShowToast}
        />
      )}
      {showWitnessModal?.show && (
        <WitnessDrawerV2
          isOpen={showWitnessModal?.show}
          onClose={() => {
            setShowWitnessModal({ show: false, artifactNumber: null });
            refetchHearing();
            refetchCaseData();
            onTabChange(0, {}, "Documents");
            setDocumentCounter((prev) => prev + 1);
          }}
          onSubmit={(action) => {
            if (action === "end-hearing") {
              // Handle end hearing action
            } else if (action === "view-cause-list") {
              // Handle view cause list action
            }
            setShowWitnessModal({ show: false, artifactNumber: null });
          }}
          attendees={currentActiveHearing?.attendees}
          hearing={currentActiveHearing}
          hearingId={currentInProgressHearingId}
          tenantId={tenantId}
          artifactNumber={showWitnessModal?.artifactNumber}
          caseId={caseId}
          courtId={courtId}
        />
      )}
      {showExaminationModal && (
        <ExaminationDrawer
          isOpen={showExaminationModal}
          onClose={() => {
            setShowExaminationModal(false);
            setExaminationDocumentNumber(null);
            refetchCaseData();
            sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
            onTabChange(0, {}, "Documents");
          }}
          tenantId={tenantId}
          documentNumber={examinationDocumentNumber}
          caseId={caseId}
          courtId={courtId}
        />
      )}
      {(showPaymentDemandModal || showPaymentConfirmationModal) && (
        <PaymentDemandModal
          t={t}
          setShowPaymentDemandModal={setShowPaymentDemandModal}
          setShowPaymentConfirmationModal={setShowPaymentConfirmationModal}
          joinedLitigants={[...complainants, ...respondents]}
          showPaymentConfirmationModal={showPaymentConfirmationModal}
          showPaymentDemandModal={showPaymentDemandModal}
          caseDetails={caseDetails}
          tenantId={tenantId}
        />
      )}{" "}
      {showAllStagesModal && (
        <Modal popupStyles={{}} hideSubmit={true} popmoduleClassName={"workflow-timeline-modal"}>
          {caseTimeLine}
        </Modal>
      )}
      <BailBondTaskModal
        t={t}
        showBailBondModal={showBailBondModal}
        setShowBailBondModal={setShowBailBondModal}
        isBailBondTaskExists={isBailBondTaskExists}
        createBailBondTask={createBailBondTask}
        bailBondLoading={bailBondLoading}
      />
      {showAddWitnessModal && (
        <AddWitnessModal
          activeTab={activeTab}
          onCancel={() => setShowAddWitnessModal(false)}
          tenantId={tenantId}
          caseDetails={caseDetails}
          isEmployee={isEmployee}
          onAddSuccess={() => {
            setShowAddWitnessModal(false);
          }}
        ></AddWitnessModal>
      )}
      {(deleteOrder !== null || deleteApplication !== null) && (
        <EditSendBackModal
          t={t}
          handleCancel={() => {
            if (!loader) {
              setDeleteOrder(null);
              setDeleteApplication(null);
            }
          }}
          handleSubmit={() => {
            if (deleteOrder) {
              handleDeleteOrder();
            } else if (deleteApplication) {
              handleDeleteApplication();
            }
          }}
          headerLabel={"GENERATE_ORDER_CONFIRM_DELETE"}
          saveLabel={"GENERATE_ORDER_DELETE"}
          cancelLabel={"GENERATE_ORDER_CANCEL_EDIT"}
          contentText={deleteOrder ? "ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_ORDER" : "ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_APPLICATION"}
          className={"edit-send-back-modal"}
          submitButtonStyle={{ backgroundColor: "#C7222A" }}
          loader={loader}
        />
      )}
      <DownloadCasePdfModal
        showDownloadCasePdfModal={showDownloadCasePdfModal}
        setShowDownloadCasePdfModal={setShowDownloadCasePdfModal}
        t={t}
        downloadCasePdfLoading={downloadCasePdfLoading}
        casePdfError={casePdfError}
        casePdfFileStoreId={casePdfFileStoreId}
        handleDownloadClick={handleDownloadClick}
      />
    </div>
  );
};

export default AdmittedCaseV2;
