import { Button as ActionButton } from "@egovernments/digit-ui-components";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { Header, InboxSearchComposer, Loader, Menu, Toast, CloseSvg, CheckBox } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { CustomThreeDots, RightArrow } from "../../../icons/svgIndex";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import ViewCaseFile from "../scrutiny/ViewCaseFile";
import { TabSearchconfigNew } from "./AdmittedCasesConfig";
import EvidenceModal from "./EvidenceModal";
import ExtraComponent from "./ExtraComponent";
import "./tabs.css";
import { SubmissionWorkflowAction, SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";
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
import { getFormattedName } from "@egovernments/digit-ui-module-hearings/src/utils";
import {
  admitCaseSubmitConfig,
  scheduleCaseAdmissionConfig,
  scheduleCaseSubmitConfig,
  selectParticipantConfig,
  sendBackCase,
} from "../../citizen/FileCase/Config/admissionActionConfig";
import Modal from "../../../components/Modal";
import { getDate, removeInvalidNameParts } from "../../../Utils";
import useWorkflowDetails from "../../../hooks/dristi/useWorkflowDetails";
import useSearchOrdersService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersService";
import VoidSubmissionBody from "./VoidSubmissionBody";
import DocumentModal from "@egovernments/digit-ui-module-orders/src/components/DocumentModal";
import { getFullName } from "../../../../../cases/src/utils/joinCaseUtils";
import { constructFullName } from "@egovernments/digit-ui-module-orders/src/utils";
import PublishedNotificationModal from "./publishedNotificationModal";
import ConfirmEvidenceAction from "../../../components/ConfirmEvidenceAction";
import useCaseDetailSearchService from "../../../hooks/dristi/useCaseDetailSearchService";
import Breadcrumb from "../../../components/BreadCrumb";
import Button from "../../../components/Button";
import MonthlyCalendar from "@egovernments/digit-ui-module-hearings/src/pages/employee/CalendarView";
import OrderDrawer from "./OrderDrawer";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import CaseBundleView from "./CaseBundleView";
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
const stateSla = {
  SCHEDULE_HEARING: 3 * 24 * 3600 * 1000,
  NOTICE: 3 * 24 * 3600 * 1000,
};

const delayCondonationStylsMain = {
  padding: "6px 8px",
  borderRadius: "999px",
  backgroundColor: "#E9A7AA",
};

const delayCondonationTextStyle = {
  margin: "0px",
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "16.41px",
  color: "#231F20",
};

const casePrimaryActions = [
  { action: "REGISTER", label: "CS_REGISTER" },
  { action: "ADMIT", label: "CS_ADMIT_CASE" },
  { action: "SCHEDULE_ADMISSION_HEARING", label: "CS_SCHEDULE_HEARING" },
  { action: "ISSUE_ORDER", label: "ISSUE_BNSS_NOTICE" },
];
const caseSecondaryActions = [
  { action: "SEND_BACK", label: "SEND_BACK_FOR_CORRECTION" },
  { action: "REJECT", label: "CS_CASE_REJECT" },
];
const caseTertiaryActions = [];

const HearingWorkflowState = {
  OPTOUT: "OPT_OUT",
  INPROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ABATED: "ABATED",
  SCHEDULED: "SCHEDULED",
};

const homeTabEnum = {
  RESCHEDULE_APPLICATIONS: "HOME_RESCHEDULE_APPLICATIONS",
  DELAY_CONDONATION: "HOME_DELAY_CONDONATION_APPLICATIONS",
  OTHERS: "HOME_OTHER_APPLICATIONS",
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

const actionEnabledStatuses = ["CASE_ADMITTED", "PENDING_ADMISSION_HEARING", "PENDING_NOTICE", "PENDING_RESPONSE", "PENDING_ADMISSION"];
const viewEnabledStatuses = [...actionEnabledStatuses, "CASE_DISMISSED"];
const judgeReviewStages = ["CASE_ADMITTED", "PENDING_ADMISSION_HEARING", "PENDING_NOTICE", "PENDING_RESPONSE", "PENDING_ADMISSION", "CASE_DISMISSED"];

const styles = {
  container: {
    display: "flex",
    gap: "8px",
    padding: "4px",
    borderRadius: "4px",
    backgroundColor: "#FCE8E8",
  },
  icon: {
    height: "20px",
    width: "20px",
  },
  text: {
    fontFamily: "Roboto",
    fontSize: "16px",
    fontWeight: "400",
    lineHeight: "18.75px",
    textAlign: "left",
    color: "#0a0a0a",
    margin: "0px",
  },
  link: {
    textDecoration: "underline",
    color: "#007e7e",
    cursor: "pointer",
  },
};

const formatDate = (date) => {
  if (date instanceof Date && !isNaN(date)) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return "";
};

const AdmittedCaseV2 = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { pathname, search, hash } = location;
  const { path } = useRouteMatch();
  const urlParams = new URLSearchParams(location.search);
  const { hearingId, taskOrderType, artifactNumber, fromHome, openExaminationModal, examinationDocNumber } = Digit.Hooks.useQueryParams();
  const caseId = urlParams.get("caseId");
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isTypist = roles?.some((role) => role.code === "TYPIST_ROLE");
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const activeTab = urlParams.get("tab") || "Overview";
  const filingNumber = urlParams.get("filingNumber");
  const applicationNumber = urlParams.get("applicationNumber");
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();

  const [apiCalled, setApiCalled] = useState(false);
  const [passOver, setPassOver] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEndHearingModal, setShowEndHearingModal] = useState({ isNextHearingDrafted: false, openEndHearingModal: false });
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [showExaminationModal, setShowExaminationModal] = useState(openExaminationModal || false);
  const [show, setShow] = useState(false);
  const [openAdmitCaseModal, setOpenAdmitCaseModal] = useState(true);
  const [documentSubmission, setDocumentSubmission] = useState();
  const [artifact, setArtifact] = useState();
  const [artifacts, setArtifacts] = useState();
  const [showOrderReviewModal, setShowOrderReviewModal] = useState(false);
  const [showHearingTranscriptModal, setShowHearingTranscriptModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState();
  const [currentHearing, setCurrentHearing] = useState();
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuFilings, setShowMenuFilings] = useState(false);
  const [toast, setToast] = useState(false);
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
  const [toastStatus, setToastStatus] = useState({ alreadyShown: false });
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
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCitizenMenu, setShowCitizenMenu] = useState(false);
  const [showJoinCase, setShowJoinCase] = useState(false);
  const [shouldRefetchCaseData, setShouldRefetchCaseData] = useState(false);
  const [showPaymentDemandModal, setShowPaymentDemandModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [showAllStagesModal, setShowAllStagesModal] = useState(false);
  const [showBailBondModal, setShowBailBondModal] = useState(false);
  const [showMakeAsEvidenceModal, setShowMakeAsEvidenceModal] = useState(false);
  const [isBailBondTaskExists, setIsBailBondTaskExists] = useState(false);
  const [bailBondLoading, setBailBondLoading] = useState(false);
  const [showAddWitnessModal, setShowAddWitnessModal] = useState(false);
  const [showWitnessDepositionDoc, setShowWitnessDepositionDoc] = useState({ docObj: null, show: false });
  const [editWitnessDepositionArtifact, setEditWitnessDepositionArtifact] = useState(null);
  const [examinationDocumentNumber, setExaminationDocumentNumber] = useState(examinationDocNumber || null);

  const JoinCaseHome = useMemo(() => Digit.ComponentRegistryService.getComponent("JoinCaseHome"), []);
  const history = useHistory();
  const isCitizen = userRoles?.includes("CITIZEN");
  const isJudge = userRoles?.includes("JUDGE_ROLE");
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
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isEmployee = useMemo(() => userType === "employee", [userType]);
  const todayDate = new Date().getTime();
  const { downloadPdf } = useDownloadCasePdf();
  const [isShow, setIsShow] = useState(false);
  const currentDiaryEntry = history.location?.state?.diaryEntry;
  const historyCaseData = location?.state?.caseData;
  const needCaseRefetch = location?.state?.needCaseRefetch;
  const historyOrderData = location?.state?.orderData;
  const newWitnesToast = history.location?.state?.newWitnesToast;
  const [isApplicationAccepted, setIsApplicationAccepted] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [deleteApplication, setDeleteApplication] = useState(null);

  const openOrder = location?.state?.openOrder;
  const [showOrderModal, setShowOrderModal] = useState(openOrder || false);
  const courtId = localStorage.getItem("courtId");
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && !isCitizen) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const hasHearingPriorityView = useMemo(() => roles?.some((role) => role?.code === "HEARING_PRIORITY_VIEW") && isEmployee, [roles, isEmployee]);

  const { data: hearingTypeOptions } = useSortedMDMSData("Hearing", "HearingType", "type", t);
  const { data: orderTypeOptions } = useSortedMDMSData("Order", "OrderType", "type", t);
  const { data: applicationTypeOptions, isLoading } = useSortedMDMSData("Application", "ApplicationType", "type", t);

  const hasHearingEditAccess = useMemo(() => roles?.some((role) => role?.code === "HEARING_APPROVER"), [roles]);
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
    return bailPendingTaskExpiry?.find((data) => data?.enitiyName === "BAIL_BONDS_REVIEW")?.noofdaysforexpiry || 0;
  }, [bailPendingTaskExpiry]);

  const { BreadCrumbsParamsData, setBreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);

  const evidenceUpdateMutation = Digit.Hooks.useCustomAPIMutationHook(reqEvidenceUpdate);

  const { data: apiCaseData, isLoading: caseApiLoading, refetch: refetchCaseData, isFetching: isCaseFetching } = useCaseDetailSearchService(
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
    Boolean(caseId && (needCaseRefetch || shouldRefetchCaseData || !historyCaseData))
  );

  const caseData = apiCaseData || historyCaseData;
  const caseDetails = useMemo(() => caseData?.cases || {}, [caseData]);
  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);
  const latestCaseDetails = useMemo(() => apiCaseData?.cases || historyCaseData?.cases || {}, [apiCaseData, historyCaseData]);
  const delayCondonationData = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data, [caseDetails]);

  const cnrNumber = useMemo(() => caseDetails?.cnrNumber || "", [caseDetails]);

  const showTakeAction = useMemo(() => userRoles?.includes("ORDER_CREATOR") && !isCitizen && actionEnabledStatuses.includes(caseDetails?.status), [
    caseDetails?.status,
    userRoles,
    isCitizen,
  ]);

  const {
    isLoading: isWorkFlowLoading,
    data: workFlowDetails,
    revalidate: revalidateWorkflow = () => {},
    isFetching: isWorkFlowFetching,
  } = useWorkflowDetails({
    tenantId,
    id: caseDetails?.filingNumber,
    moduleCode: "case-default",
    config: {
      enabled: Boolean(caseDetails?.filingNumber && tenantId),
      cacheTime: 10000,
      retry: 1,
    },
  });

  const nextActions = useMemo(() => workFlowDetails?.nextActions || [{}], [workFlowDetails]);
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

  const homeNextHearingData = JSON.parse(localStorage.getItem("Digit.homeNextHearingFilter"));

  useEffect(() => {
    const fetchInboxForNextHearingData = async () => {
      try {
        const payload = (fromDate, toDate) => {
          return {
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
        };

        if (homeNextHearingData) {
          const fromDateForNextHearings = new Date(homeNextHearingData.homeFilterDate).setHours(0, 0, 0, 0);
          const toDateForNextHearings = new Date(homeNextHearingData.homeFilterDate).setHours(23, 59, 59, 999);

          const resForNextHearings = await HomeService.InboxSearch(payload(fromDateForNextHearings, toDateForNextHearings), { tenantId: "kl" });
          setDataForNextHearings(resForNextHearings?.items || []);
        }
      } catch (err) {
        console.error("error", err);
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

  const primaryAction = useMemo(() => {
    return casePrimaryActions?.find((action) => nextActions?.some((data) => data.action === action?.action)) || { action: "", label: "" };
  }, [nextActions]);

  const secondaryAction = useMemo(() => {
    return caseSecondaryActions?.find((action) => nextActions?.some((data) => data.action === action?.action)) || { action: "", label: "" };
  }, [nextActions]);

  const tertiaryAction = useMemo(
    () => caseTertiaryActions?.find((action) => nextActions?.some((data) => data.action === action?.action)) || { action: "", label: "" },
    [nextActions]
  );

  // const isPendingNoticeStatus = useMemo(() => {
  //   return [CaseWorkflowState.PENDING_NOTICE].includes(caseDetails?.status) && primaryAction?.action === "ISSUE_ORDER";
  // }, [caseDetails?.status, primaryAction?.action]);

  const isDelayCondonationApplicable = useMemo(() => {
    if (!caseDetails?.cnrNumber) return undefined;
    return caseDetails?.caseDetails?.delayApplications?.formdata[0]?.data?.delayCondonationType?.code === "NO";
  }, [caseDetails]);

  const statue = useMemo(() => {
    const statutesAndSections = caseDetails?.statutesAndSections;
    if (!statutesAndSections?.length) return "";
    const section = statutesAndSections?.[0]?.sections?.[0];
    const subsection = statutesAndSections?.[0]?.subsections?.[0];

    if (!section || !subsection) return "";

    return section && subsection
      ? `${section
          ?.split(" ")
          ?.map((splitString) => splitString.charAt(0))
          ?.join("")} S${subsection}`
      : "";
  }, [caseDetails?.statutesAndSections]);

  const litigants = useMemo(() => (caseDetails?.litigants?.length > 0 ? caseDetails?.litigants : []), [caseDetails]);
  const finalLitigantsData = useMemo(
    () =>
      litigants?.map((litigant) => {
        return {
          ...litigant,
          name: removeInvalidNameParts(litigant.additionalDetails?.fullName),
        };
      }),
    [litigants]
  );
  const reps = useMemo(() => (caseDetails?.representatives?.length > 0 ? caseDetails?.representatives : []), [caseDetails]);
  const finalRepresentativesData = useMemo(
    () =>
      reps.map((rep) => {
        return {
          ...rep,
          name: removeInvalidNameParts(rep.additionalDetails?.advocateName),
          partyType: `Advocate (for ${rep.representing?.map((client) => removeInvalidNameParts(client?.additionalDetails?.fullName))?.join(", ")})`,
        };
      }),
    [reps]
  );

  const witnesses = useMemo(() => {
    return (
      caseDetails?.witnessDetails?.map((data) => {
        const fullName = getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null);
        return {
          ...data,
          name: fullName,
          partyType: "witness",
        };
      }) || []
    );
  }, [caseDetails]);

  const unJoinedLitigant = useMemo(() => {
    return (
      caseDetails?.additionalDetails?.respondentDetails?.formdata
        ?.filter((data) => !data?.data?.respondentVerification?.individualDetails?.individualId)
        ?.map((data) => {
          const fullName = constructFullName(data?.data?.respondentFirstName, data?.data?.respondentMiddleName, data?.data?.respondentLastName);
          return {
            ...data,
            name: `${fullName} (Accused)`,
            code: fullName,
            partyType: "respondent",
            uniqueId: data?.uniqueId,
          };
        }) || []
    );
  }, [caseDetails]);

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);

  const complainants = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("complainant"))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
          const complainantDetails = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
            (obj) => obj?.data?.complainantVerification?.individualDetails?.individualId === item?.individualId
          )?.data;
          if (poaHolder) {
            return {
              additionalDetails: item?.additionalDetails,
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
            additionalDetails: item?.additionalDetails,
            code: fullName,
            name: `${fullName} (Complainant)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "complainant",
            poaUuid: complainantDetails?.poaVerification?.individualDetails?.userUuid,
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
          const respondentDetails = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          );
          const respondentPoaDetails = respondentDetails?.data?.poaVerification?.individualDetails?.userUuid;
          return {
            additionalDetails: item?.additionalDetails,
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
            uniqueId: respondentDetails?.uniqueId,
            poaUuid: respondentPoaDetails,
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);
  const listAllAdvocates = useMemo(() => Object.values(allAdvocates || {}).flat(), [allAdvocates]);
  const isAdvocatePresent = useMemo(() => listAllAdvocates?.includes(userInfo?.uuid), [listAllAdvocates, userInfo?.uuid]);

  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(userInfo?.uuid)), [
    allAdvocates,
    userInfo?.uuid,
  ]);
  const { data: applicationData, isLoading: isApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber,
        tenantId,
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
          item?.applicationType === "EXTENSION_SUBMISSION_DEADLINE" &&
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
          item?.applicationType === "PRODUCTION_DOCUMENTS" &&
          item?.onBehalfOf?.includes(onBehalfOfuuid) &&
          ![SubmissionWorkflowState.DELETED, SubmissionWorkflowState.ABATED].includes(item?.status)
      ) || [],
    [applicationData, onBehalfOfuuid]
  );

  const submitBailDocumentsApplications = useMemo(
    () =>
      applicationData?.applicationList?.filter(
        (item) =>
          item?.applicationType === "SUBMIT_BAIL_DOCUMENTS" &&
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
            item?.applicationType === "DELAY_CONDONATION" &&
            [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(item?.status)
        )
      )
    );
  }, [applicationData]);

  const isDelayApplicationCompleted = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === "DELAY_CONDONATION" && [SubmissionWorkflowState.COMPLETED].includes(item?.status)
        )
      ),
    [applicationData]
  );

  const isDelayApplicationRejected = useMemo(
    () =>
      Boolean(
        applicationData?.applicationList?.some(
          (item) => item?.applicationType === "DELAY_CONDONATION" && [SubmissionWorkflowState.REJECTED].includes(item?.status)
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
  const showMakeSubmission = useMemo(() => {
    return (
      isAdvocatePresent &&
      userRoles?.includes("SUBMISSION_CREATOR") &&
      [
        CaseWorkflowState.PENDING_ADMISSION_HEARING,
        CaseWorkflowState.PENDING_NOTICE,
        CaseWorkflowState.PENDING_RESPONSE,
        CaseWorkflowState.PENDING_ADMISSION,
        CaseWorkflowState.CASE_ADMITTED,
      ].includes(caseStatus)
    );
  }, [userRoles, caseStatus, isAdvocatePresent]);

  const openDraftModal = (orderList) => {
    setDraftOrderList(orderList);
    setOrderDraftModal(true);
  };

  const openSubmissionViewModal = (submissionList, openEvidenceModalFunc) => {
    setSubmissionsViewList({ list: submissionList, func: openEvidenceModalFunc });
    setSubmissionsViewModal(true);
  };

  const handleTakeAction = () => {
    setShowMenu(!showMenu);
    setShowOtherMenu(false);
    setShowMenuFilings(false);

    if (showCitizenMenu) {
      setShowCitizenMenu(false);
    }
  };

  const handleTakeFilingAction = () => {
    setShowMenuFilings(!showMenuFilings);
    setShowOtherMenu(false);
    setShowMenu(false);
  };

  const showToast = useCallback((details, duration = 5000) => {
    setToast(true);
    setToastDetails(details);
    setTimeout(() => {
      setToast(false);
      setToastStatus({ alreadyShown: true });
    }, duration);
  }, []);

  const showToastMsg = useCallback((type, message, duration = 5000) => {
    setToast(true);
    setToastDetails({ isError: type === "error", message: message });
    setTimeout(() => {
      setToast(false);
      setToastStatus({ alreadyShown: true });
    }, duration);
  }, []);

  const onSuccess = async (response, data) => {
    showToast({
      isError: false,
      message: !data?.body?.artifact?.isEvidence ? t("SUCCESSFULLY_UNMARKED_MESSAGE") : t("SUCCESSFULLY_MARKED_MESSAGE"),
    });
    refetchCaseData();
  };

  const onError = async (error, data) => {
    showToast({
      isError: true,
      message: !data?.body?.artifact?.isEvidence ? t("UNSUCCESSFULLY_UNMARKED_MESSAGE") : t("UNSUCCESSFULLY_MARKED_MESSAGE"),
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

  const caseInfo = useMemo(
    () => [
      {
        key: "CASE_NUMBER",
        value: caseDetails?.filingNumber,
      },
      {
        key: "CASE_CATEGORY",
        value: caseDetails?.caseCategory,
      },
      {
        key: "CASE_TYPE",
        value: "NIA S138",
      },
      {
        key: "COURT_NAME",
        value: t(`COMMON_MASTERS_COURT_R00M_${caseCourtId}`),
      },
      {
        key: "SUBMITTED_ON",
        value: formatDate(new Date(caseDetails?.filingDate)),
      },
    ],
    [caseCourtId, caseDetails?.caseCategory, caseDetails?.filingDate, caseDetails?.filingNumber, t]
  );

  const configList = useMemo(() => {
    const docSetFunc = (docObj) => {
      const applicationNumber = docObj?.[0]?.applicationList?.applicationNumber;
      const status = docObj?.[0]?.applicationList?.status;
      const createdByUuid = docObj?.[0]?.applicationList?.statuteSection?.auditdetails?.createdBy;
      const documentCreatedByUuid = docObj?.[0]?.artifactList?.auditdetails?.createdBy;
      const artifactNumber = docObj?.[0]?.artifactList?.artifactNumber;
      const documentStatus = docObj?.[0]?.artifactList?.status;
      if (documentStatus === "PENDING_E-SIGN" && documentCreatedByUuid === userInfo?.uuid) {
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
        if (createdByUuid === userInfo?.uuid) {
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
    };

    const orderSetFunc = async (order) => {
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
    };

    const orderDeleteFunc = async (history, column, row, item) => {
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
        console.error(error);
        showToast({
          isError: true,
          message: t("SOMETHING_WENT_WRONG"),
        });
      }
    };

    const handleApplicationDeleteFunc = async (row) => {
      setDeleteApplication(row);
    };

    const takeActionFunc = (hearingData) => {
      setCurrentHearing(hearingData);
      setShowHearingTranscriptModal(true);
    };

    const handleFilingAction = async (history, column, row, item) => {
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
    };

    const activeTabConfig = TabSearchconfigNew?.TabSearchconfig.find((tabConfig) => tabConfig.label === activeTab);
    if (!activeTabConfig) return [];

    const getTabConfig = (tabConfig) => {
      switch (tabConfig.label) {
        case "Parties":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                criteria: [
                  {
                    filingNumber: filingNumber,
                    ...(caseCourtId && { courtId: caseCourtId }),
                  },
                ],
              },
            },
            sections: {
              ...tabConfig.sections,
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.filter((column) => !(column?.label === "ACTIONS" && isEmployee)),
                },
              },
            },
          };

        case "Orders":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                inbox: {
                  ...tabConfig.apiDetails.requestBody.inbox,
                  moduleSearchCriteria: {
                    ...tabConfig.apiDetails.requestBody.inbox.moduleSearchCriteria,
                    caseNumbers: [filingNumber, caseDetails?.cmpNumber, caseDetails?.courtCaseNumber, caseDetails?.lprNumber]?.filter(Boolean),
                    ...(caseCourtId && { courtId: caseCourtId }),
                  },
                },
              },
            },
            sections: {
              ...tabConfig.sections,
              search: {
                ...tabConfig.sections.search,
                uiConfig: {
                  ...tabConfig.sections.search.uiConfig,
                  fields: tabConfig.sections.search.uiConfig.fields.map((field) => {
                    if (field.key === "parties") {
                      return {
                        ...field,
                        populators: {
                          name: "parties",
                          optionsKey: "name",
                          options: caseRelatedData.parties
                            .map((party) => ({
                              code: removeInvalidNameParts(party.name),
                              name: removeInvalidNameParts(party.name),
                            }))
                            .sort((a, b) => a.name.localeCompare(b.name)),
                        },
                      };
                    }

                    if (field.key === "type") {
                      return {
                        ...field,
                        populators: {
                          ...field.populators,
                          options: orderTypeOptions || [],
                        },
                      };
                    }
                    return field;
                  }),
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                    return column.label === "ORDER_TITLE"
                      ? {
                          ...column,
                          clickFunc: orderSetFunc,
                        }
                      : column.label === "CS_ACTIONS"
                      ? {
                          ...column,
                          clickFunc: orderDeleteFunc,
                        }
                      : column;
                  }),
                },
              },
            },
          };

        case "Hearings":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                criteria: {
                  filingNumber: filingNumber,
                  tenantId: tenantId,
                  ...(caseCourtId && { courtId: caseCourtId }),
                },
              },
            },
            sections: {
              ...tabConfig.sections,
              search: {
                ...tabConfig.sections.search,
                uiConfig: {
                  ...tabConfig.sections.search.uiConfig,
                  fields: [
                    {
                      label: "PARTIES",
                      isMandatory: false,
                      key: "parties",
                      type: "dropdown",
                      populators: {
                        name: "parties",
                        optionsKey: "name",
                        options: caseRelatedData.parties.map((party) => ({
                          code: removeInvalidNameParts(party.name),
                          name: removeInvalidNameParts(party.name),
                        })),
                      },
                    },
                    ...tabConfig?.sections?.search?.uiConfig?.fields?.map((field) => {
                      if (field.key === "hearingType") {
                        return {
                          ...field,
                          populators: {
                            ...field.populators,
                            options: hearingTypeOptions || [],
                          },
                        };
                      }
                      return field;
                    }),
                  ],
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) =>
                    column.label === "CS_ACTIONS" ? { ...column, clickFunc: takeActionFunc, showMakeSubmission: showMakeSubmission } : column
                  ),
                },
              },
            },
          };

        case "History":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                filingNumber: filingNumber,
                tenantId: tenantId,
              },
            },
          };

        case "Documents":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                criteria: {
                  caseId: caseDetails?.id,
                  filingNumber: caseDetails?.filingNumber,
                  tenantId: tenantId,
                  ...(caseCourtId && { courtId: caseCourtId }),
                },
              },
            },
            sections: {
              ...tabConfig.sections,
              search: {
                ...tabConfig.sections.search,
                uiConfig: {
                  ...tabConfig.sections.search.uiConfig,
                  fields: [
                    // {
                    //   label: "OWNER",
                    //   isMandatory: false,
                    //   key: "owner",
                    //   type: "dropdown",
                    //   populators: {
                    //     name: "owner",
                    //     optionsKey: "name",
                    //     options: Array.from(
                    //       new Map(
                    //         artifacts?.map((artifact) => [
                    //           removeInvalidNameParts(artifact.owner), // Key for uniqueness
                    //           {
                    //             code: removeInvalidNameParts(artifact.owner),
                    //             name: removeInvalidNameParts(artifact.owner),
                    //             value: artifact.sourceID,
                    //           },
                    //         ])
                    //       ).values()
                    //     ),
                    //   },
                    // },
                    ...tabConfig.sections.search.uiConfig.fields,
                  ],
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                    switch (column.label) {
                      case "FILE":
                      case "FILING_NAME":
                        return { ...column, clickFunc: docSetFunc };
                      case "CS_ACTIONS":
                        return { ...column, clickFunc: handleFilingAction };
                      default:
                        return column;
                    }
                  }),
                },
              },
            },
          };

        case "Submissions":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                criteria: {
                  filingNumber: filingNumber,
                  tenantId: tenantId,
                },
              },
            },
            sections: {
              ...tabConfig.sections,
              search: {
                ...tabConfig.sections.search,
                uiConfig: {
                  ...tabConfig.sections.search.uiConfig,
                  fields: [
                    {
                      label: "OWNER",
                      isMandatory: false,
                      key: "owner",
                      type: "dropdown",
                      populators: {
                        name: "owner",
                        optionsKey: "name",
                        options: caseRelatedData.parties
                          .map((party) => ({
                            code: removeInvalidNameParts(party.name),
                            name: removeInvalidNameParts(party.name),
                            value: party.additionalDetails?.uuid,
                          }))
                          .sort((a, b) => a.name.localeCompare(b.name)),
                      },
                    },
                    ...tabConfig?.sections?.search?.uiConfig?.fields?.map((field) => {
                      if (field.key === "applicationType") {
                        return {
                          ...field,
                          populators: {
                            ...field.populators,
                            options: applicationTypeOptions || [],
                          },
                        };
                      }

                      return field;
                    }),
                  ],
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                    switch (column.label) {
                      case "DOCUMENT_TEXT":
                      case "SUBMISSION_TYPE":
                        return {
                          ...column,
                          clickFunc: docSetFunc,
                        };
                      case "CS_ACTIONS":
                        return {
                          ...column,
                          clickFunc: handleApplicationDeleteFunc,
                        };
                      case "OWNER":
                        return {
                          ...column,
                          parties: caseRelatedData.parties,
                        };

                      default:
                        return column;
                    }
                  }),
                },
              },
            },
          };

        default:
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestParam: {
                ...tabConfig.apiDetails?.requestParam,
                filingNumber: filingNumber,
                cnrNumber,
                applicationNumber: "",
              },
            },
          };
      }
    };

    return getTabConfig(activeTabConfig);
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
    artifacts,
    userType,
    downloadPdf,
    ordersService,
    caseCourtId,
    orderTypeOptions,
    applicationTypeOptions,
    hearingTypeOptions,
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
      const nextHearing = hearingDetails?.HearingList?.filter((hearing) => hearing.status === "SCHEDULED");
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
    } catch (error) {
      console.error("error: ", error);
      toast.error(t("SOMETHING_WENT_WRONG"));
    }
    setShowConfirmationModal(false);
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

  const voidModalConfig = useMemo(() => {
    if (!showVoidModal) return {};

    const onSuccess = async (response, data) => {
      showToast({
        isError: false,
        message: !data?.body?.artifact?.isVoid ? "SUCCESSFULLY_UNMARKED_AS_VOID_MESSAGE" : "SUCCESSFULLY_MARKED_AS_VOID_MESSAGE",
      });
      refetchCaseData();
      setShowVoidModal(false);
    };

    const onError = async (error, data) => {
      showToast({
        isError: true,
        message: !data?.body?.artifact?.isVoid ? "UNSUCCESSFULLY_UNMARKED_AS_VOID_MESSAGE" : "UNSUCCESSFULLY_MARKED_AS_VOID_MESSAGE",
      });
    };

    const handleMarkAsVoid = async (documentSubmission, isVoid) => {
      await evidenceUpdateMutation.mutate(
        {
          url: Urls.dristi.evidenceUpdate,
          params: {},
          body: {
            artifact: {
              ...documentSubmission?.[0].artifactList,
              filingNumber: filingNumber,
              isVoid,
              // isEvidence: false,
              reason: isVoid ? voidReason : "",
              workflow: null,
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

    const handleClose = () => {
      refetchCaseData();
      setShowVoidModal(false);
    };

    return {
      handleClose: handleClose,
      heading: {
        label:
          "view_reason_for_voiding" === documentSubmission?.[0]?.itemType
            ? t("REASON_FOR_VOIDING")
            : "unmark_void_submission" === documentSubmission?.[0]?.itemType
            ? t("ARE_YOU_SURE_TO_UNMARK_AS_VOID")
            : t("ARE_YOU_SURE_TO_MARK_AS_VOID"),
      },
      isStepperModal: true,
      actionSaveLabel:
        userType === "citizen"
          ? undefined
          : "view_reason_for_voiding" === documentSubmission?.[0]?.itemType
          ? t("UNMARK_AS_VOID")
          : "unmark_void_submission" === documentSubmission?.[0]?.itemType
          ? t("MARK_VOID_CONFIRM")
          : t("MARK_AS_VOID"),
      actionCancelLabel: userType === "citizen" ? t("VOID_BACK") : t("MARK_VOID_CANCEL"),
      steps: [
        {
          actionCancelOnSubmit: handleClose,
          actionSaveLableType: "mark_as_void" === documentSubmission?.[0]?.itemType ? "WARNING" : null,
          modalBody: (
            <VoidSubmissionBody
              t={t}
              documentSubmission={documentSubmission}
              setVoidReason={setVoidReason}
              voidReason={voidReason}
              disabled={"view_reason_for_voiding" === documentSubmission[0].itemType || "unmark_void_submission" === documentSubmission[0].itemType}
            />
          ),
          async: true,
          isDisabled: !Boolean(voidReason),
          actionSaveOnSubmit: async () => {
            if (documentSubmission[0].itemType === "unmark_void_submission") {
              await handleMarkAsVoid(documentSubmission, false);
            } else if (documentSubmission[0].itemType === "view_reason_for_voiding") {
              setDocumentSubmission(
                documentSubmission?.map((item) => {
                  return { ...item, itemType: "unmark_void_submission" };
                })
              );
            } else {
              await handleMarkAsVoid(documentSubmission, true);
            }
          },
        },
      ],
    };
  }, [documentSubmission, evidenceUpdateMutation, filingNumber, refetchCaseData, showVoidModal, t, userType, voidReason]);

  const dcaConfirmModalConfig = useMemo(() => {
    if (!isDelayCondonationApplicable) return;
    return {
      handleClose: () => {
        setIsOpenFromPendingTask(false);
        setIsOpenDCA(false);
      },
      heading: { label: "" },
      actionSaveLabel: "",
      isStepperModal: true,
      actionSaveOnSubmit: () => {},
      steps: [
        {
          heading: { label: isDelayApplicationPending ? t("DELAY_CONDONATION_APPLICATION_OPEN") : t("DCA_NOT_FILED") },
          ...(isDelayCondonationApplicable &&
            !isDelayApplicationPending && {
              actionSaveLabel: t("DCA_PROCEED_ANYWAY"),
              actionSaveOnSubmit: () => {
                setIsOpenDCA(false);
                setSubmitModalInfo({ ...admitCaseSubmitConfig, caseInfo: caseInfo });
                setModalInfo({ type: "admitCase", page: 0 });
                setShowModal(true);
              },
            }),
          modalBody: (
            <div style={{ width: "527px", padding: "12px 16px" }}>
              <p style={delayCondonationTextStyle}>
                {isDelayApplicationPending ? t("DELAY_CONDONATION_APPLICATION_OPEN_MESSAGE") : t("DCA_NOT_FILED_MESSAGE")}
              </p>
            </div>
          ),

          actionCancelLabel: "BACK",
          actionCancelOnSubmit: () => {
            setIsOpenDCA(false);
            if (isOpenFromPendingTask) {
              setIsOpenFromPendingTask(false);
              window.history.back();
            }
          },
        },
      ],
    };
  }, [caseInfo, isDelayApplicationPending, isDelayCondonationApplicable, isOpenFromPendingTask, t]);

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
  const [toastDetails, setToastDetails] = useState({});
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showScheduleHearingModal, setShowScheduleHearingModal] = useState(false);

  const isTabDisabled = useMemo(() => {
    return !viewEnabledStatuses.includes(caseDetails?.status);
  }, [caseDetails?.status]);

  const isCaseAdmitted = useMemo(() => {
    return caseDetails?.status === "CASE_ADMITTED";
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

  // useEffect(() => {
  //   const getOwnerName = async (artifact) => {
  //     if (artifact?.sourceType === "COURT") {
  //       if (artifact.sourceID === undefined) {
  //         return "NA";
  //       }
  //       const owner = await Digit.UserService.userSearch(tenantId, { uuid: [artifact?.sourceID] }, {});
  //       if (owner?.user?.length > 1) return "";
  //       return `${owner?.user?.[0]?.name}`.trim();
  //     } else {
  //       if (artifact?.sourceID === undefined) {
  //         return "NA";
  //       }
  //       const owner = await DRISTIService.searchIndividualUser(
  //         {
  //           Individual: {
  //             individualId: artifact?.sourceID,
  //           },
  //         },
  //         { tenantId, limit: 1000, offset: 0 }
  //       );
  //       return `${owner?.Individual[0]?.name?.givenName} ${owner[0]?.Individual[0]?.name?.familyName || ""}`.trim();
  //     }
  //   };
  //   // const fetchEvidence = async () => {
  //   //   try {
  //   //     const response = await DRISTIService.searchEvidence(
  //   //       {
  //   //         criteria: {
  //   //           filingNumber: filingNumber,
  //   //           artifactNumber: artifactNumber,
  //   //           tenantId: tenantId,
  //   //           ...(caseCourtId && { courtId: caseCourtId }),
  //   //         },
  //   //         tenantId,
  //   //       },
  //   //       {}
  //   //     );

  //   //     const uniqueArtifactsMap = new Map();
  //   //     response?.artifacts?.forEach((artifact) => {
  //   //       if (!uniqueArtifactsMap.has(artifact.sourceID)) {
  //   //         uniqueArtifactsMap.set(artifact.sourceID, artifact);
  //   //       }
  //   //     });
  //   //     const uniqueArtifacts = Array.from(uniqueArtifactsMap.values());

  //   //     const ownerNames = await Promise.all(
  //   //       uniqueArtifacts?.map(async (artifact) => {
  //   //         const ownerName = await getOwnerName(artifact);
  //   //         return { owner: ownerName, sourceID: artifact.sourceID };
  //   //       })
  //   //     );
  //   //     const evidence = response?.artifacts?.map((artifact) => {
  //   //       const ownerName = ownerNames?.find((item) => item.sourceID === artifact.sourceID)?.owner;
  //   //       return { artifact, owner: ownerName };
  //   //     });
  //   //     setArtifacts(evidence);
  //   //   } catch (error) {
  //   //     console.error("Error fetching evidence:", error);
  //   //   }
  //   // };
  //   if (activeTab === "Documents") {
  //     // There is no need to set Artifacts now, so commenting the fetchEvidence function call but keeping the code.
  //     // fetchEvidence();
  //   }
  // }, [filingNumber, artifactNumber, tenantId, activeTab]);

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
    if (history?.location?.state?.from === "orderSuccessModal" && !toastStatus?.alreadyShown) {
      showToast(true);

      refetchCaseData();
      setToastDetails({
        isError: false,
        message: "ORDER_SUCCESSFULLY_ISSUED",
      });
    }
  }, [history?.location, showToast, toastStatus?.alreadyShown]);

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
      showToast({ message: t("NEW_WITNESS_SUCCESSFULLY_ADDED"), error: false });
    }
  }, [newWitnesToast, showToast, t]);

  useEffect(() => {
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
    }
  }, [applicationData, applicationNumber]);

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

  const handleIssueNotice = useCallback(
    async (hearingDate, hearingNumber) => {
      try {
        const orderBody = {
          createdDate: null,
          tenantId,
          cnrNumber: caseDetails?.cnrNumber,
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
        return DRISTIService.customApiService(Urls.dristi.ordersCreate, { order: orderBody }, { tenantId })
          .then((res) => {
            DRISTIService.customApiService(Urls.dristi.pendingTask, {
              pendingTask: {
                name: t("DRAFT_IN_PROGRESS_ISSUE_NOTICE"),
                entityType: "order-default",
                referenceId: `MANUAL_${res?.order?.orderNumber}`,
                status: "DRAFT_IN_PROGRESS",
                assignedTo: [],
                assignedRole: ["PENDING_TASK_ORDER"],
                cnrNumber: updatedCaseDetails?.cnrNumber,
                filingNumber: caseDetails?.filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
                isCompleted: false,
                stateSla: todayDate + stateSla.NOTICE,
                additionalDetails: {},
                tenantId,
              },
            });
            history.push(
              `/${window?.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${res.order.orderNumber}`,
              {
                caseId: caseDetails?.id,
                tab: "Orders",
              }
            );
          })
          .catch((error) => {
            console.error("Error while creating order", error);
            showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
          });
      } catch (error) {
        console.error("Error while fetching Hearing Data", error);
        showToast({ isError: true, message: "ERROR_WHILE_FETCH_HEARING_DETAILS" });
      }
    },
    [
      OrderWorkflowAction.SAVE_DRAFT,
      caseDetails?.caseTitle,
      caseDetails?.cnrNumber,
      caseDetails?.filingNumber,
      caseDetails?.id,
      filingNumber,
      history,
      showToast,
      t,
      tenantId,
      todayDate,
      updatedCaseDetails?.cnrNumber,
    ]
  );

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
        revalidateWorkflow();
        setUpdatedCaseDetails(response?.cases?.[0]);
      });
    },
    [caseDetails, tenantId, refetchCaseData, revalidateWorkflow]
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
      try {
        const caseNumber =
          (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
          caseDetails?.courtCaseNumber ||
          caseDetails?.cmpNumber ||
          caseDetails?.filingNumber;
        const orderType = type === "reject" ? "DISMISS_CASE" : type === "accept" ? "TAKE_COGNIZANCE" : null;
        const formdata = {
          orderType: {
            code: orderType,
            type: orderType,
            name: `ORDER_TYPE_${orderType}`,
          },
        };
        if (generateOrder) {
          const reqbody = {
            order: {
              createdDate: null,
              tenantId,
              cnrNumber,
              filingNumber,
              statuteSection: {
                tenantId,
              },
              orderTitle: t(orderType),
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
              additionalDetails: {
                formdata,
              },
              ...(documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName && {
                orderDetails: {
                  parties: [{ partyName: documentSubmission?.[0]?.applicationList?.additionalDetails?.onBehalOfName }],
                  caseNumber: caseNumber,
                },
              }),
            },
          };
          try {
            const res = await ordersService.createOrder(reqbody, { tenantId });
            const name = orderType;
            DRISTIService.customApiService(Urls.dristi.pendingTask, {
              pendingTask: {
                name: t(name),
                entityType: "order-default",
                referenceId: `MANUAL_${res?.order?.orderNumber}`,
                status: "DRAFT_IN_PROGRESS",
                assignedTo: [],
                assignedRole: ["PENDING_TASK_ORDER"],
                cnrNumber,
                filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
                isCompleted: false,
                // stateSla: stateSla.DRAFT_IN_PROGRESS * dayInMillisecond + todayDate,
                additionalDetails: { orderType },
                tenantId,
              },
            });
            history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res?.order?.orderNumber}`);
          } catch (error) {}
        }
      } catch (error) {}
    },
    [
      tenantId,
      cnrNumber,
      filingNumber,
      OrderWorkflowAction.SAVE_DRAFT,
      documentSubmission,
      ordersService,
      t,
      caseDetails?.id,
      caseDetails?.caseTitle,
      history,
    ]
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
        showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
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

  const onSendBack = useCallback(async () => {
    switch (secondaryAction.action) {
      case "SEND_BACK":
        setSubmitModalInfo({
          ...sendBackCase,
          caseInfo: [{ key: "CASE_FILE_NUMBER", value: caseDetails?.filingNumber }],
        });
        setShowModal(true);
        setModalInfo({ type: "sendCaseBack", page: 0 });
        break;

      case "REJECT":
        await handleAdmitDismissCaseOrder(true, "reject");
        break;

      default:
        break;
    }
  }, [caseDetails?.filingNumber, handleAdmitDismissCaseOrder, secondaryAction.action]);

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

  // const isDcaHearingScheduled = useMemo(() => {
  //   const isDcaHearingScheduled = Boolean(
  //     hearingDetails?.HearingList?.find(
  //       (hearing) =>
  //         ["DELAY_CONDONATION_HEARING", "DELAY_CONDONATION_AND_ADMISSION"].includes(hearing?.hearingType) &&
  //         [HearingWorkflowState?.INPROGRESS, HearingWorkflowState?.SCHEDULED].includes(hearing?.status)
  //     )
  //   );
  //   return isDcaHearingScheduled;
  // }, [hearingDetails]);

  // const isAdmissionHearingCompletedOnce = useMemo(() => {
  //   if (!hearingDetails?.HearingList?.length) {
  //     return false;
  //   } else {
  //     return Boolean(
  //       hearingDetails?.HearingList?.find(
  //         (hearing) => hearing?.hearingType === "ADMISSION" && [HearingWorkflowState?.COMPLETED].includes(hearing?.status)
  //       )
  //     );
  //   }
  // }, [hearingDetails]);

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
    filingNumber + currentHearingId,
    Boolean(filingNumber && !historyOrderData && caseCourtId),
    0
  );

  const ordersData = historyOrderData || apiOrdersData;

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

    const validTypes = ["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT"];

    return ordersData.list.some((item) => {
      if (item?.orderCategory === "COMPOSITE") {
        return item?.compositeItems?.some((subItem) => validTypes.includes(subItem?.orderType));
      } else {
        return validTypes.includes(item?.orderType);
      }
    });
  }, [ordersData?.list]);

  // const orderListFiltered = useMemo(() => {
  //   if (!ordersData?.list) return [];

  //   const filteredOrders = ordersData?.list?.filter((item) => item?.hearingNumber === currentHearingId);
  //   const sortedOrders = filteredOrders?.sort((a, b) => new Date(b.auditDetails.createdTime) - new Date(a.auditDetails.createdTime));

  //   // Group by partyIndex
  //   const groupedOrders = sortedOrders?.reduce((acc, item) => {
  //     if (item?.orderCategory === "COMPOSITE") {
  //       const compositeItems = item?.compositeItems?.filter((item) => item?.orderType === "NOTICE");
  //       compositeItems.forEach((itemDetails) => {
  //         const partyIndex = itemDetails?.orderSchema?.additionalDetails?.formdata?.noticeOrder?.party?.data?.partyIndex;
  //         if (partyIndex !== undefined) {
  //           acc[partyIndex] = acc[partyIndex] || [];
  //           acc[partyIndex].push(item);
  //         }
  //       });
  //     } else {
  //       const partyIndex = item?.additionalDetails?.formdata?.noticeOrder?.party?.data?.partyIndex;
  //       if (partyIndex !== undefined) {
  //         acc[partyIndex] = acc[partyIndex] || [];
  //         acc[partyIndex].push(item);
  //       }
  //     }
  //     return acc;
  //   }, {});

  //   return groupedOrders;
  // }, [currentHearingId, ordersData]);

  // const noticeFailureCount = useMemo(() => {
  //   if (isCaseAdmitted) return [];

  //   return Object.entries(orderListFiltered)
  //     ?.map(([partyIndex, orders]) => {
  //       const firstOrder = orders?.[0];
  //       const partyName =
  //         firstOrder?.orderCategory === "COMPOSITE"
  //           ? firstOrder?.compositeItems?.find(
  //               (item) =>
  //                 item?.orderType === "NOTICE" && item?.orderSchema?.additionalDetails?.formdata?.noticeOrder?.party?.data?.partyIndex === partyIndex
  //             )?.orderSchema?.orderDetails?.parties?.[0]?.partyName
  //           : firstOrder?.orderDetails?.parties?.[0]?.partyName;
  //       return {
  //         partyIndex,
  //         partyName,
  //         failureCount: orders.length - 1,
  //       };
  //     })
  //     ?.filter(({ failureCount }) => failureCount > 0);
  // }, [isCaseAdmitted, orderListFiltered]);

  const getHearingData = async () => {
    try {
      const { HearingList = [] } = await Digit.HearingService.searchHearings({
        hearing: { tenantId },
        criteria: {
          tenantID: tenantId,
          filingNumber: filingNumber,
          ...(caseCourtId && { courtId: caseCourtId }),
        },
      });
      if (HearingList?.length >= 1) {
        const { startTime: hearingDate, hearingId: hearingNumber } = HearingList?.find(
          (list) => !(list?.status === HearingWorkflowState.COMPLETED || list?.status === HearingWorkflowState.ABATED)
        );
        if (!(hearingDate || hearingNumber)) {
          showToast(
            {
              isError: true,
              message: "NO_ADMISSION_HEARING_SCHEDULED",
            },
            3000
          );
        } else return { hearingDate, hearingNumber };
      } else {
        showToast(
          {
            isError: true,
            message: "NO_ADMISSION_HEARING_SCHEDULED",
          },
          3000
        );
        return { hearingDate: null, hearingNumber: null };
      }
    } catch (error) {
      console.error("Error while fetching Hearing Data", error);
      showToast({ isError: true, message: "ERROR_WHILE_FETCH_HEARING_DETAILS" }, 3000);
      return { hearingDate: null, hearingNumber: null };
    }
  };

  const handleMakeSubmission = useCallback(() => {
    history.push(`/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const handleSubmitDocuments = useCallback(() => {
    history.push(`/${window?.contextPath}/citizen/submissions/submit-document?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const handleDownloadPDF = useCallback(async () => {
    const caseId = caseDetails?.id;
    const caseStatus = caseDetails?.status;

    setCasePdfError(null);
    setCasePdfFileStoreId(null);

    if (["PENDING_PAYMENT", "RE_PENDING_PAYMENT", "UNDER_SCRUTINY", "PENDING_REGISTRATION"].includes(caseStatus)) {
      const fileStoreId =
        caseDetails?.documents?.find((doc) => doc?.key === "case.complaint.signed")?.fileStore || caseDetails?.additionalDetails?.signedCaseDocument;
      if (fileStoreId) {
        setCasePdfFileStoreId(fileStoreId);
        return;
      } else {
        console.error("No fileStoreId available for download.");
        setCasePdfError("No fileStoreId available for download.");
        return;
      }
    }

    try {
      setDownloadCasePdfLoading(true);

      if (!caseId) {
        throw new Error("Case ID is not available.");
      }

      const response = await DRISTIService.downloadCaseBundle({ tenantId, caseId }, { tenantId });
      const responseFileStoreId = response?.fileStoreId?.toLowerCase();

      if (!responseFileStoreId || ["null", "undefined"].includes(responseFileStoreId)) {
        throw new Error("Invalid fileStoreId received in the response.");
      }

      setCasePdfFileStoreId(responseFileStoreId);
    } catch (error) {
      console.error("Error downloading PDF: ", error.message || error);
      showToast({
        isError: true,
        message: "UNABLE_CASE_PDF",
      });
      setCasePdfError(t("UNABLE_CASE_PDF"));
    } finally {
      setDownloadCasePdfLoading(false);
    }
  }, [t, caseDetails, tenantId, showToast]);

  useEffect(() => {
    if (showDownloadCasePdfModal) {
      handleDownloadPDF();
    }
  }, [showDownloadCasePdfModal, handleDownloadPDF]);

  const handleDownloadClick = useCallback(() => {
    if (casePdfFileStoreId) {
      downloadPdf(tenantId, casePdfFileStoreId);
    }
  }, [casePdfFileStoreId, downloadPdf, tenantId]);

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
                    ...(isCitizen && { assignedTo: userInfo?.uuid }),
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
        showToast({ isError: true, message: "BAIL_BOND_SEARCH_FAILED" });
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
    const validData = dataForNextHearings?.filter((item) => ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS", "COMPLETED"]?.includes(item?.businessObject?.hearingDetails?.status));
    const index = validData?.findIndex(
      (item) => item?.businessObject?.hearingDetails?.hearingNumber === homeNextHearingData?.homeHearingNumber
    );
    return index === -1 || validData?.length <= 1;
  }, [dataForNextHearings, homeNextHearingData]);

  const customNextHearing = useCallback(
    () => {
      if (dataForNextHearings?.length === 0) {
        history.push(`/${window?.contextPath}/employee/home/home-screen`);
      } else {
        const validData = dataForNextHearings?.filter((item) => ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS", "COMPLETED"]?.includes(item?.businessObject?.hearingDetails?.status));
        const index = validData?.findIndex(
          (item) => item?.businessObject?.hearingDetails?.hearingNumber === homeNextHearingData?.homeHearingNumber
        );
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
    }, [dataForNextHearings, history, homeNextHearingData]
  )

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
    [currentInProgressHearing?.hearingId, data, history, todayScheduledHearing?.hearingId, userType]
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
        setShowWitnessModal(true);
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
            showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
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
            showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
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
        const errorMsg = errorCode === "ORDER_ALREADY_PUBLISHED" ? "ORDER_ALREADY_PUBLISHED" : "CORE_SOMETHING_WENT_WRONG";
        showToast({ isError: true, message: errorMsg }, 3000);
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
      showToast,
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
      history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Orders`, {
        homeFilteredData: homeFilteredData,
        homeActiveTab: homeActiveTab,
      });
    } else {
      if (showOrderReviewModal) setShowOrderReviewModal(false);
      if (showNotificationModal) setShowNotificationModal(false);
    }
  }, [history, userType, caseId, filingNumber, showOrderReviewModal, showNotificationModal]);

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
    const dateArr = data.date.split(" ").map((date, i) => (i === 0 ? date.slice(0, date.length - 2) : date));
    const date = new Date(dateArr.join(" "));
    const reqBody = {
      order: {
        createdDate: null,
        tenantId,
        cnrNumber,
        filingNumber: filingNumber,
        statuteSection: {
          tenantId,
        },
        orderTitle: "SCHEDULE_OF_HEARING_DATE",
        orderCategory: "INTERMEDIATE",
        orderType: "SCHEDULE_OF_HEARING_DATE",
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
            hearingDate: formatDate(date).split("-").reverse().join("-"),
            hearingPurpose: data.purpose,
            orderType: {
              code: "SCHEDULE_OF_HEARING_DATE",
              type: "SCHEDULE_OF_HEARING_DATE",
              name: "ORDER_TYPE_SCHEDULE_OF_HEARING_DATE",
            },
          },
        },
      },
    };
    ordersService
      .createOrder(reqBody, { tenantId })
      .then(async (res) => {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: `Draft in Progress for ${t(data.purpose?.code)} Hearing Order`,
            entityType: "order-default",
            referenceId: `MANUAL_${res.order.orderNumber}`,
            status: "DRAFT_IN_PROGRESS",
            assignedTo: [],
            assignedRole: ["PENDING_TASK_ORDER"],
            cnrNumber: updatedCaseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: false,
            stateSla: todayDate + stateSla.SCHEDULE_HEARING,
            additionalDetails: {},
            tenantId,
          },
        });
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Pending Response",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "PENDING_RESPONSE",
            assignedRole: ["CASE_RESPONDER"],
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            tenantId,
          },
        });
        refetchCaseData();
        revalidateWorkflow();
        history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`);
      })
      .catch((err) => {
        showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
      });
  };

  const citizenActionOptions = useMemo(
    () => [
      {
        value: "RAISE_APPLICATION",
        label: "Raise Application",
      },
      {
        value: "SUBMIT_DOCUMENTS",
        label: "Submit Documents",
      },
      {
        value: "GENERATE_BAIL_BOND",
        label: "Generate Bail Bond",
      },
    ],
    []
  );

  const employeeActionsPermissionsMapping = useMemo(
    () => [
      {
        label: "END_HEARING",
        requiredRoles: ["HEARING_APPROVER"], // update hearing api validation
      },
      {
        label: "GENERATE_ORDER",
        requiredRoles: ["ORDER_CREATOR"], // order create api validation
      },
      {
        label: "SUBMIT_DOCUMENTS", // /evidence/v1/_create api, then /evidence/v1/_update api for signing
        requiredRoles: ["EVIDENCE_CREATOR", "EVIDENCE_EDITOR"],
      },
      {
        label: "GENERATE_PAYMENT_DEMAND",
        requiredRoles: ["TASK_CREATOR"], // task create api validation
      },
      {
        label: "CREATE_BAIL_BOND",
        requiredRoles: ["PENDING_TASK_CONFIRM_BOND_SUBMISSION"],
        // The employee which has this role, wil receive this pending task so for create button also we are using same role.
      },
      {
        label: "DOWNLOAD_CASE_FILE",
        requiredRoles: [],
      },
      {
        label: "SHOW_TIMELINE",
        requiredRoles: [],
      },
      {
        label: "ADD_WITNESS",
        requiredRoles: ["ALLOW_ADD_WITNESS"], // add witness api validation
      },
      {
        label: "TAKE_WITNESS_DEPOSITION",
        requiredRoles: ["EVIDENCE_EDITOR"], // update evidence api validation
      },
      {
        label: "VIEW_CALENDAR",
        requiredRoles: [],
      },
      {
        label: "RECORD_PLEA",
        requiredRoles: ["PLEA_CREATOR", "PLEA_EDITOR"],
      },
      {
        label: "RECORD_EXAMINATION_OF_ACCUSED",
        requiredRoles: ["EXAMINATION_CREATOR", "EXAMINATION_EDITOR"], // TODO: update this when backend validation is done.
      },
    ],
    []
  );

  const employeeActionOptions = useMemo(() => {
    if (isEmployee) {
      if (hasHearingPriorityView) {
        return currentInProgressHearing
          ? [
              {
                value: "NEXT_HEARING",
                label: "NEXT_HEARING",
              },

              {
                value: "GENERATE_ORDER",
                label: "GENERATE_ORDER",
              },
              {
                value: "SUBMIT_DOCUMENTS",
                label: "SUBMIT_DOCUMENTS",
              },
              {
                value: "DOWNLOAD_CASE_FILE",
                label: "DOWNLOAD_CASE_FILE",
              },
              {
                value: "GENERATE_PAYMENT_DEMAND",
                label: "GENERATE_PAYMENT_DEMAND",
              },
              {
                value: "SHOW_TIMELINE",
                label: "SHOW_TIMELINE",
              },
              {
                value: "ADD_WITNESS",
                label: "ADD_WITNESS",
              },
              {
                value: "TAKE_WITNESS_DEPOSITION",
                label: "TAKE_WITNESS_DEPOSITION",
              },
              { value: "RECORD_PLEA", label: "RECORD_PLEA" },
              {
                value: "RECORD_EXAMINATION_OF_ACCUSED",
                label: "RECORD_EXAMINATION_OF_ACCUSED",
              },
            ]
          : [
              {
                value: "DOWNLOAD_CASE_FILE",
                label: "DOWNLOAD_CASE_FILE",
              },
              {
                value: "SHOW_TIMELINE",
                label: "SHOW_TIMELINE",
              },
              {
                value: "ADD_WITNESS",
                label: "ADD_WITNESS",
              },
              {
                value: "TAKE_WITNESS_DEPOSITION",
                label: "TAKE_WITNESS_DEPOSITION",
              },
              { value: "RECORD_PLEA", label: "RECORD_PLEA" },
              {
                value: "RECORD_EXAMINATION_OF_ACCUSED",
                label: "RECORD_EXAMINATION_OF_ACCUSED",
              },
            ];
      } else
        return [
          ...(currentInProgressHearing
            ? [
                {
                  value: "END_HEARING",
                  label: "END_HEARING",
                },
                {
                  value: "SUBMIT_DOCUMENTS",
                  label: "SUBMIT_DOCUMENTS",
                },
                {
                  value: "GENERATE_PAYMENT_DEMAND",
                  label: "GENERATE_PAYMENT_DEMAND",
                },
              ]
            : [
                {
                  value: "CREATE_BAIL_BOND",
                  label: "CREATE_BAIL_BOND",
                },
              ]),
          {
            value: "DOWNLOAD_CASE_FILE",
            label: "DOWNLOAD_CASE_FILE",
          },
          {
            value: "SHOW_TIMELINE",
            label: "SHOW_TIMELINE",
          },
          {
            value: "ADD_WITNESS",
            label: "ADD_WITNESS",
          },
          {
            value: "TAKE_WITNESS_DEPOSITION",
            label: "TAKE_WITNESS_DEPOSITION",
          },
          { value: "RECORD_PLEA", label: "RECORD_PLEA" },
          {
            value: "RECORD_EXAMINATION_OF_ACCUSED",
            label: "RECORD_EXAMINATION_OF_ACCUSED",
          },
        ];
    } else return [];
  }, [currentInProgressHearing, hasHearingPriorityView, isEmployee]);

  const allowedEmployeeActionOptions = useMemo(() => {
    return employeeActionOptions?.filter((option) => {
      // Find matching permission mapping for this action
      const permissionMapping = employeeActionsPermissionsMapping.find((mapping) => mapping.label === option.label);

      // If no mapping found, allow the action (no restrictions)
      if (!permissionMapping) {
        return true;
      }

      // If no required roles specified, allow the action
      if (!permissionMapping.requiredRoles || permissionMapping.requiredRoles.length === 0) {
        return true;
      }

      // Check if user has all required roles
      const userRoleCodes = roles?.map((role) => role.code) || [];
      return permissionMapping.requiredRoles.every((requiredRole) => userRoleCodes.includes(requiredRole));
    });
  }, [employeeActionOptions, roles, employeeActionsPermissionsMapping]);

  const courtActionOptions = useMemo(
    () => [
      {
        value: "SUBMIT_DOCUMENTS",
        label: "Submit Documents",
      },
    ],
    []
  );

  const takeActionOptions = useMemo(() => [{ label: "CS_GENERATE_ORDER" }, { label: "SUBMIT_DOCUMENTS" }, { label: "GENERATE_PAYMENT_DEMAND" }], [t]);

  const allowedTakeActionOptions = useMemo(() => {
    return takeActionOptions
      .filter((option) => {
        // Find matching permission mapping for this action
        const permissionMapping = employeeActionsPermissionsMapping.find((mapping) => mapping.label === option.label);

        // If no mapping found, allow the action (no restrictions)
        if (!permissionMapping) {
          return true;
        }

        // If no required roles specified, allow the action
        if (!permissionMapping.requiredRoles || permissionMapping.requiredRoles.length === 0) {
          return true;
        }

        // Check if user has all required roles
        const userRoleCodes = roles?.map((role) => role.code) || [];
        return permissionMapping.requiredRoles.every((requiredRole) => userRoleCodes.includes(requiredRole));
      })
      ?.map((obj) => t(obj?.label));
  }, [takeActionOptions, employeeActionsPermissionsMapping, roles, t]);

  const employeeCrumbs = useMemo(
    () => [
      {
        path: `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/home/home-screen`,
        content: t("ES_COMMON_HOME"),
        show: true,
        isLast: false,
        homeFilteredData: homeFilteredData,
      },
      {
        path: `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/home/home-screen`,
        content: t(homeTabEnum[homeActiveTab]),
        show: ["RESCHEDULE_APPLICATIONS", "DELAY_CONDONATION", "OTHERS"]?.includes(homeActiveTab),
        homeActiveTab: homeActiveTab,
        isLast: false,
      },
      {
        path: `/${window?.contextPath}/${isCitizen ? "citizen" : "employee"}/home/home-pending-task`,
        content: t("OPEN_ALL_CASES"),
        show: fromHome || isCitizen ? false : true,
        isLast: false,
      },
      {
        path: `${path}/home/view-case`,
        content: t("VIEW_CASE"),
        show: true,
        isLast: true,
      },
    ],
    [t, homeFilteredData, fromHome, isCitizen, path, homeActiveTab]
  );

  const advocateName = useMemo(() => {
    if (!caseDetails?.representatives?.length) return "";
    const complainantAdvocates = caseDetails?.representatives?.filter((rep) =>
      rep?.representing?.some((lit) => lit?.partyType?.includes("complainant"))
    );
    const accusedAdvocates = caseDetails?.representatives?.filter((rep) => rep?.representing?.some((lit) => lit?.partyType?.includes("respondent")));
    const complainantAdvocateName =
      complainantAdvocates?.length > 0
        ? `${complainantAdvocates?.[0]?.additionalDetails?.advocateName} (C)${
            complainantAdvocates?.length > 1
              ? ` ${t("CS_COMMON_AND")} ${complainantAdvocates?.length - 1} ${
                  complainantAdvocates?.length === 2 ? t("CS_COMMON_OTHER") : t("CS_COMMON_OTHERS")
                }`
              : ""
          }`
        : "";
    const accusedAdvocateName =
      accusedAdvocates?.length > 0
        ? `${accusedAdvocates?.[0]?.additionalDetails?.advocateName} (A)${
            accusedAdvocates?.length > 1
              ? ` ${t("CS_COMMON_AND")} ${accusedAdvocates?.length - 1} ${
                  accusedAdvocates?.length === 2 ? t("CS_COMMON_OTHER") : t("CS_COMMON_OTHERS")
                }`
              : ""
          }`
        : "";
    return `${t("CS_COMMON_ADVOCATES")}: ${complainantAdvocateName} ${accusedAdvocateName ? ", " + accusedAdvocateName : ""}`;
  }, [caseDetails?.representatives, t]);

  // outcome always null unless case went on final stage
  const showActionBar = useMemo(
    () =>
      // If there is any hearing in progress, do not show action bar
      !currentInProgressHearing &&
      (primaryAction.action ||
        secondaryAction.action ||
        tertiaryAction.action ||
        ([CaseWorkflowState.PENDING_NOTICE, CaseWorkflowState.PENDING_RESPONSE].includes(caseDetails?.status) && !isCitizen)) &&
      !caseDetails?.outcome,
    [
      primaryAction.action,
      secondaryAction.action,
      tertiaryAction.action,
      caseDetails?.status,
      caseDetails?.outcome,
      isCitizen,
      currentInProgressHearing,
    ]
  );

  const viewActionBar = useMemo(() => {
    return (
      showActionBar &&
      !isWorkFlowFetching &&
      ((currentHearingStatus === HearingWorkflowState.SCHEDULED && tertiaryAction.action) || primaryAction?.label || secondaryAction.action)
    );
  }, [showActionBar, isWorkFlowFetching, currentHearingStatus, tertiaryAction.action, primaryAction?.label, secondaryAction.action]);

  // const handleOpenSummonNoticeModal = async (partyIndex) => {
  //   if (currentHearingId) {
  //     history.push(`${path}?filingNumber=${filingNumber}&caseId=${caseId}&taskOrderType=NOTICE&hearingId=${currentHearingId}&tab=${config?.label}`, {
  //       state: {
  //         params: {
  //           partyIndex: partyIndex,
  //           taskCnrNumber: cnrNumber,
  //         },
  //       },
  //     });
  //   }
  // };

  const handleAllNoticeGeneratedForHearing = (hearingNumber) => {
    setIsShow(!isShow);
  };

  const handleAllSummonWarrantGeneratedForHearing = useCallback(
    async (hearingNumber) => {
      if (hearingNumber) {
        history.push(`${path}?filingNumber=${filingNumber}&caseId=${caseId}&taskOrderType=SUMMONS&hearingId=${hearingNumber}&tab=${config?.label}`);
      }
    },
    [history, path, filingNumber, caseId, config]
  );

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
        showToast({
          isError: true,
          message: t("BAIL_BOND_TASK_ALREADY_EXISTS"),
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
            assignedRole: ["PENDING_TASK_CONFIRM_BOND_SUBMISSION"],
            actionCategory: "Bail Bond",
            cnrNumber,
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
      console.error(e);
      setBailBondLoading(false);

      showToast({
        isError: true,
        message: t("UNABLE_TO_CREATE_BAIL_BOND_TASK"),
      });
    }
  };

  const handleDeleteOrder = async () => {
    try {
      setLoader(true);
      await ordersService?.updateOrder(
        {
          order: {
            ...deleteOrder,
            workflow: { ...deleteOrder?.workflow, action: OrderWorkflowAction.DELETE, documents: [{}] },
          },
        },
        { tenantId }
      );
      await ordersService.customApiService(Urls.dristi.pendingTask, {
        pendingTask: {
          name: "Completed",
          entityType: "order-default",
          referenceId: `MANUAL_${deleteOrder?.orderNumber}`,
          status: "DRAFT_IN_PROGRESS",
          assignedTo: [],
          assignedRole: [],
          cnrNumber,
          filingNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: true,
          stateSla: null,
          additionalDetails: {},
          tenantId,
        },
      });
      history.replace(`${path}?caseId=${caseId}&filingNumber=${filingNumber}&tab=${config?.label}`);
      setDeleteOrder(null);
    } catch (error) {
      console.error(error);
      showToast({
        isError: true,
        message: t("SOMETHING_WENT_WRONG"),
      });
    } finally {
      setLoader(false);
    }
  };

  const handleDeleteApplication = async () => {
    try {
      setLoader(true);
      const reqBody = {
        application: {
          ...deleteApplication,
          workflow: { ...deleteApplication?.workflow, documents: [{}], action: SubmissionWorkflowAction.DELETE },
          tenantId,
        },
        tenantId,
      };
      await submissionService.updateApplication(reqBody, { tenantId });
      setDeleteApplication(null);
      // history.replace(`${path}?caseId=${caseId}&filingNumber=${filingNumber}&tab=${config?.label}`);
      window.location.reload();
    } catch (error) {
      console.error(error);
      showToast({
        isError: true,
        message: t("SOMETHING_WENT_WRONG"),
      });
    } finally {
      setLoader(false);
    }
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
        setEditWitnessDepositionArtifact={setEditWitnessDepositionArtifact}
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

  const MemoCaseOverview = useMemo(() => {
    return (
      <CaseOverviewV2
        caseData={caseRelatedData}
        filingNumber={filingNumber}
        currentHearingId={currentHearingId}
        caseDetails={caseDetails}
        showNoticeProcessModal={!isCitizen}
        isBailBondTaskExists={isBailBondTaskExists}
      />
    );
  }, [caseRelatedData, filingNumber, currentHearingId, caseDetails, isCitizen, isBailBondTaskExists]);

  if (isEpostUser) {
    history.push(homePath);
  }

  if (caseApiLoading || isWorkFlowLoading || isApplicationLoading || isCaseFetching) {
    return <Loader />;
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
      <div
        className="admitted-case-header"
        style={{ position: showJoinCase ? "" : "", top: "72px", width: "100%", zIndex: 150, background: "white", gap: "0px" }}
      >
        <div className="admitted-case-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {caseDetails?.caseTitle && <Header styles={{ marginBottom: "0px" }}>{caseDetails?.caseTitle}</Header>}
          <div className="make-submission-action" style={{ display: "flex", gap: 20, justifyContent: "space-between", alignItems: "center" }}>
            {(showMakeSubmission || isCitizen) && (
              <div className="evidence-header-wrapper">
                <div className="evidence-hearing-header" style={{ background: "transparent", padding: "0px" }}>
                  <div className="evidence-actions" style={{ ...(isTabDisabled ? { pointerEvents: "none" } : {}) }}>
                    {showMakeSubmission && (
                      <React.Fragment>
                        <ActionButton
                          variation={"primary"}
                          label={t("CS_CASE_MAKE_FILINGS")}
                          icon={showMenu ? "ExpandLess" : "ExpandMore"}
                          isSuffix={true}
                          onClick={handleTakeAction}
                          className={"take-action-btn-class"}
                        ></ActionButton>
                        {showMenu && (
                          <Menu
                            t={t}
                            optionKey={"label"}
                            localeKeyPrefix={"CS_CASE"}
                            options={citizenActionOptions}
                            onSelect={(option) => handleCitizenAction(option)}
                          ></Menu>
                        )}
                      </React.Fragment>
                    )}

                    <div
                      onClick={() => {
                        setShowCitizenMenu((prev) => !prev);
                        if (showMenu) {
                          setShowMenu(false);
                        }
                      }}
                      style={{ cursor: "pointer", height: "40px" }}
                    >
                      <CustomThreeDots />
                      {showCitizenMenu && (
                        <Menu
                          options={["MANAGE_CASE_ACCESS", "DOWNLOAD_CASE_FILE", "SHOW_TIMELINE"]}
                          t={t}
                          localeKeyPrefix={"CS_CASE"}
                          onSelect={(option) => {
                            if (option === "MANAGE_CASE_ACCESS") {
                              setShowJoinCase(true);
                              setShowCitizenMenu(false);
                            } else if (option === "DOWNLOAD_CASE_FILE") {
                              setShowDownloadCasePdfModal(true);
                            } else if (option === "SHOW_TIMELINE") {
                              setShowAllStagesModal(true);
                            }
                          }}
                        ></Menu>
                      )}
                      <JoinCaseHome
                        setShowJoinCase={setShowJoinCase}
                        showJoinCase={showJoinCase}
                        type={"external"}
                        data={{ caseDetails: caseDetails }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showTakeAction && (
              <div className="judge-action-block" style={{ display: "flex", gap: "20px" }}>
                {
                  <div className="evidence-header-wrapper">
                    <div className="evidence-hearing-header" style={{ background: "transparent", padding: "0px" }}>
                      <div className="evidence-actions" style={{ ...(isTabDisabled ? { pointerEvents: "none" } : {}) }}>
                        {currentInProgressHearing ? (
                          <React.Fragment>
                            <Button
                              variation={"outlined"}
                              label={t("CS_CASE_VIEW_CALENDAR")}
                              onButtonClick={() => handleEmployeeAction({ value: "VIEW_CALENDAR" })}
                              style={{ boxShadow: "none" }}
                            ></Button>
                            {!hasHearingPriorityView && userRoles?.includes("ORDER_CREATOR") && (
                              <Button
                                variation={"outlined"}
                                label={t("CS_CASE_GENERATE_ORDER")}
                                onButtonClick={() => handleEmployeeAction({ value: "GENERATE_ORDER" })}
                                style={{ boxShadow: "none" }}
                              ></Button>
                            )}
                            {hasHearingPriorityView && hasHearingEditAccess && (
                              <Button
                                variation={"outlined"}
                                label={t("CS_CASE_PASS_OVER")}
                                onButtonClick={() => handleEmployeeAction({ value: "PASS_OVER_START_NEXT_HEARING" })}
                                style={{
                                  boxShadow: "none",
                                  border: "1px solid rgb(187, 44, 47)",
                                  color: "rgb(187, 44, 47)",
                                }}
                                isDisabled={apiCalled}
                              ></Button>
                            )}
                            {(hasHearingPriorityView || (isJudge && !hideNextHearingButton)) && hasHearingEditAccess && (
                              <Button
                                variation={"primary"}
                                isDisabled={apiCalled}
                                label={t(hasHearingPriorityView ? "CS_CASE_END_START_NEXT_HEARING" : `${t("CS_CASE_NEXT_HEARING")} (${formatDate(new Date(parseInt(homeNextHearingData?.homeFilterDate))).split("-").join("/")})`)}
                                children={hasHearingPriorityView ? null : <RightArrow />}
                                isSuffix={true}
                                onButtonClick={() =>
                                  handleEmployeeAction({
                                    value: hasHearingPriorityView ? "CS_CASE_END_START_NEXT_HEARING" : "NEXT_HEARING",
                                  })
                                }
                                style={{
                                  boxShadow: "none",
                                  ...(hasHearingPriorityView ? { backgroundColor: "#007e7e", border: "none" } : {}),
                                }}
                              ></Button>
                            )}
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            {!hasHearingPriorityView && !hideNextHearingButton && (
                              <Button
                                variation={"primary"}
                                label={t(`${t("CS_CASE_NEXT_HEARING")} (${formatDate(new Date(parseInt(homeNextHearingData?.homeFilterDate))).split("-").join("/")})`)}
                                children={<RightArrow />}
                                isSuffix={true}
                                onButtonClick={() =>
                                  handleEmployeeAction({
                                    value: "NEXT_HEARING",
                                  })
                                }
                              />
                            )}
                            <ActionButton
                              variation={"primary"}
                              label={t("TAKE_ACTION_LABEL")}
                              icon={showMenu ? "ExpandLess" : "ExpandMore"}
                              isSuffix={true}
                              onClick={handleTakeAction}
                              className={"take-action-btn-class"}
                            ></ActionButton>
                            {showMenu && (
                              <Menu
                                textStyles={{ cursor: "pointer" }}
                                options={allowedTakeActionOptions}
                                onSelect={(option) => handleSelect(option)}
                              ></Menu>
                            )}
                          </React.Fragment>
                        )}
                      </div>
                    </div>
                  </div>
                }
                <div className="evidence-header-wrapper">
                  <div className="evidence-hearing-header" style={{ background: "transparent", padding: "0px" }}>
                    <div className="evidence-actions">
                      <div
                        className="custom-icon-wrapper"
                        onClick={() => {
                          setShowOtherMenu((prev) => !prev);
                          setShowMenu(false);
                          setShowMenuFilings(false);
                        }}
                      >
                        <CustomThreeDots />
                        {showOtherMenu && (
                          <Menu
                            t={t}
                            localeKeyPrefix={"CS_CASE"}
                            options={allowedEmployeeActionOptions}
                            optionKey={"label"}
                            onSelect={handleEmployeeAction}
                          ></Menu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="admitted-case-details" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
          <div className="case-details-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {caseDetails?.cmpNumber && (
              <React.Fragment>
                <div className="sub-details-text">{caseDetails?.cmpNumber}</div>
                <hr className="vertical-line" />
              </React.Fragment>
            )}
            {caseDetails?.courtCaseNumber && caseDetails?.courtCaseNumber?.includes("ST/") && (
              <React.Fragment>
                <div className="sub-details-text">{caseDetails?.courtCaseNumber}</div>
                <hr className="vertical-line" />
              </React.Fragment>
            )}
            {caseDetails?.isLPRCase ? (
              <React.Fragment>
                <div className="sub-details-text">{caseDetails?.lprNumber}</div>
                <hr className="vertical-line" />
              </React.Fragment>
            ) : (
              caseDetails?.courtCaseNumber &&
              !caseDetails?.courtCaseNumber?.includes("ST/") && (
                <React.Fragment>
                  <div className="sub-details-text">{caseDetails?.courtCaseNumber}</div>
                  <hr className="vertical-line" />
                </React.Fragment>
              )
            )}
            {(caseDetails?.courtCaseNumber || caseDetails?.cmpNumber) && (
              <React.Fragment>
                {" "}
                <div className="sub-details-text">{t(caseDetails?.filingNumber)}</div> <hr className="vertical-line" />
              </React.Fragment>
            )}
            <div className="sub-details-text">{t(caseDetails?.substage)}</div>
            {caseDetails?.outcome && (
              <React.Fragment>
                <hr className="vertical-line" />
                <div className="sub-details-text">{t(caseDetails?.outcome)}</div>
              </React.Fragment>
            )}
            <hr className="vertical-line" />
            <div className="sub-details-text">Code: {caseDetails?.accessCode}</div>
            <hr className="vertical-line" />
            {advocateName && <div className="sub-details-text">{advocateName}</div>}
            {delayCondonationData?.delayCondonationType?.code === "NO" && !isDelayApplicationCompleted && (
              <div className="delay-condonation-chip" style={delayCondonationStylsMain}>
                <p style={delayCondonationTextStyle}>
                  {(delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" && isDelayApplicationPending) || isDelayApplicationPending
                    ? t("DELAY_CONDONATION_FILED")
                    : t("DELAY_CONDONATION_NOT_FILED")}
                </p>
              </div>
            )}
          </div>
        </div>
        {hasAnyRelevantOrderType && isCitizen && (
          <div
            style={{
              backgroundColor: "#FFF6EA",
              padding: "8px 12px",
              borderRadius: "4px",
              display: "inline-block",
              fontSize: "14px",
              color: "#333",
              marginTop: "24px",
            }}
          >
            {t("VIEW_NOTICE_SUMMONS")}{" "}
            <span
              style={{
                color: "#007F80",
                fontWeight: "600",
                cursor: "pointer",
              }}
              className="click-here"
              onClick={handleAllNoticeGeneratedForHearing}
            >
              {t("NOTICE_CLICK_HERE")}
            </span>
          </div>
        )}
        <div className="search-tabs-container" style={{ marginTop: "24px" }}>
          <div>
            {tabData?.map((i, num) => (
              <button
                className={i?.active === true ? "search-tab-head-selected" : "search-tab-head"}
                onClick={() => {
                  onTabChange(num, i);
                }}
                style={{ fontSize: "18px" }}
                disabled={["Complaint", "Overview"].includes(i?.label) ? false : isTabDisabled}
              >
                {t(i?.displayLabel)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {config?.label !== "Overview" && (
        <ExtraComponent
          caseData={caseRelatedData}
          setUpdateCounter={setUpdateCounter}
          tab={config?.label}
          setOrderModal={openDraftModal}
          openSubmissionsViewModal={openSubmissionViewModal}
        />
      )}
      {config?.label !== "Overview" && config?.label !== "caseFileOverview" && config?.label !== "Complaint" && config?.label !== "History" && (
        <div style={{ width: "100%", background: "white", padding: "10px", display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <div style={{ fontWeight: 700, fontSize: "24px", lineHeight: "28.8px" }}>{t(`All_${config?.label?.toUpperCase()}_TABLE_HEADER`)}</div>
          {/* {(!userRoles.includes("CITIZENS") || userRoles.includes("ADVOCATE_ROLE")) &&
            (config?.label === "Hearings" || config?.label === "Documents") && (
              <div style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}>
                {t("DOWNLOAD_ALL_LINK")}
              </div>
            )} */}
          {(showMakeSubmission || userRoles?.includes("ALLOW_ADD_WITNESS")) && config?.label === "Parties" && (
            <Button
              label={userRoles.includes("CITIZEN") ? t("ADD_NEW_WITNESS") : t("CS_CASE_ADD_WITNESS")}
              variation={"secondary"}
              onButtonClick={() => setShowAddWitnessModal(true)}
              style={{ marginRight: "30px" }}
            />
          )}
          {userRoles?.includes("ORDER_CREATOR") && config?.label === "Submissions" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <div
                onClick={() => handleSelect(t("MANDATORY_SUBMISSIONS_RESPONSES"))}
                style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}
              >
                {t("REQUEST_DOCUMENTS_LINK")}
              </div>
              {/* <div style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}>
                {t("DOWNLOAD_ALL_LINK")}
              </div> */}
            </div>
          )}
          {isCitizen && config?.label === "Submissions" && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {showMakeSubmission && (
                <div
                  onClick={handleMakeSubmission}
                  style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}
                >
                  {t("MAKE_APPLICATION")}
                </div>
              )}

              {/* <div style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}>
                {t("DOWNLOAD_ALL_LINK")}
              </div> */}
              {showMakeSubmission && (
                <div
                  onClick={handleSubmitDocuments}
                  style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}
                >
                  {t("SUBMIT_DOCUMENTS")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!tabData?.filter((tab) => tab.label === "Overview")?.[0]?.active && !tabData?.filter((tab) => tab.label === "Complaint")?.[0]?.active && (
        <div
          className={`inbox-search-wrapper orders-tab-inbox-wrapper`}
          style={{
            paddingBottom: tabData?.find((tab) => tab.label === "caseFileOverview")?.active ? "0px" : showActionBar ? "60px" : undefined,
          }}
        >
          {activeTab === "Documents" ? documentsInboxSearch : inboxComposer}
        </div>
      )}
      {tabData?.filter((tab) => tab.label === "Overview")?.[0]?.active && (
        <div className="case-overview-wrapper" style={{ ...(viewActionBar ? { marginBottom: "60px" } : {}) }}>
          {MemoCaseOverview}
        </div>
      )}
      {tabData?.filter((tab) => tab.label === "Complaint")?.[0]?.active && (
        <div className="view-case-file-wrapper">
          <ViewCaseFile t={t} inViewCase={true} caseDetailsAdmitted={caseDetails} />
        </div>
      )}
      {tabData?.filter((tab) => tab.label === "caseFileOverview")?.[0]?.active && (
        <div
          className="view-case-file-new-wrapper"
          style={{
            ...(showActionBar && { paddingBottom: "60px" }),
          }}
        >
          <CaseBundleView caseDetails={caseDetails} tenantId={tenantId} filingNumber={filingNumber} />
        </div>
      )}
      {showWitnessDepositionDoc?.show && (
        <WitnessDepositionDocModal
          t={t}
          docObj={showWitnessDepositionDoc?.docObj}
          setShowWitnessDepositionDoc={setShowWitnessDepositionDoc}
          showWitnessModal={showWitnessModal}
          setShowWitnessModal={setShowWitnessModal}
          setEditWitnessDepositionArtifact={setEditWitnessDepositionArtifact}
          editWitnessDepositionArtifact={editWitnessDepositionArtifact}
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
          showToast={showToast}
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
          showToast={showToast}
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
        />
      )}
      {toast && toastDetails && (
        <Toast
          error={toastDetails?.isError}
          label={t(toastDetails?.message)}
          isDleteBtn={true}
          onClose={() => setToast(false)}
          style={{ maxWidth: "500px" }}
        />
      )}
      {/* {viewActionBar && (
        <ActionBar className={"e-filing-action-bar"} style={{ justifyContent: "space-between" }}>
          <div style={{ width: "fit-content", display: "flex", gap: 20 }}>
            {currentHearingStatus === HearingWorkflowState.SCHEDULED && tertiaryAction.action && (
              <Button className="previous-button" variation="secondary" label={t(tertiaryAction.label)} onButtonClick={onSaveDraft} />
            )}
            {primaryAction?.label && (
              <SubmitBar
                label={t(isPendingNoticeStatus ? "ISSUE_BNSS_NOTICE" : primaryAction?.label)}
                submit="submit"
                disabled={""}
                onSubmit={onSubmit}
              />
            )}
          </div>
          {secondaryAction.action && (
            <Button
              className="previous-button"
              variation="secondary"
              style={{
                border: "none",
                marginLeft: 0,
                fontSize: 16,
                fontWeight: 700,
                color: secondaryAction.action === "REJECT" && "#BB2C2F",
              }}
              label={t(secondaryAction.label)}
              onButtonClick={onSendBack}
            />
          )}
        </ActionBar>
      )} */}
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
      {showDismissCaseConfirmation && (
        <Modal
          headerBarMain={<Heading label={t("DISMISS_CASE_CONFIRMATION")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowDismissCaseConfirmation(false);
              }}
            />
          }
          actionSaveLabel={t("CS_DISMISS")}
          actionCancelLabel={t("CS_BACK")}
          actionCancelOnSubmit={() => {
            setShowDismissCaseConfirmation(false);
          }}
          style={{
            backgroundColor: "#BB2C2F",
          }}
          children={<div style={{ margin: "16px 0px" }}>{t("DISMISS_CASE_CONFIRMATION_TEXT")}</div>}
          actionSaveOnSubmit={() => {
            handleActionModal();
          }}
        ></Modal>
      )}
      {showPendingDelayApplication && (
        <Modal
          headerBarMain={<Heading label={t("PENDING_DELAY_CONDONATION_HEADER")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowPendingDelayApplication(false);
              }}
            />
          }
          actionSaveLabel={t("CS_CLOSE")}
          children={<div style={{ margin: "16px 0px" }}>{t("PENDING_DELAY_CONDONATION_APPLICATION_TEXT")}</div>}
          actionSaveOnSubmit={() => {
            setShowPendingDelayApplication(false);
          }}
        ></Modal>
      )}
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
          showToast={showToastMsg}
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
          isDisabled={isSubmitDisabled}
          isEvidence={documentSubmission?.[0]?.artifactList?.isEvidence}
          isFromActions={true}
        />
      )}
      {showCalendarModal && (
        <Modal
          headerBarMain={<Heading label={t("CS_CASE_VIEW_CALENDAR")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowCalendarModal(false);
              }}
            />
          }
          actionSaveLabel={t("CS_CLOSE")}
          actionSaveOnSubmit={() => {
            setShowCalendarModal(false);
          }}
          popupStyles={{ width: "75vw" }}
        >
          <div style={{ margin: "16px 0px" }}>
            <MonthlyCalendar hideRight={true} />
          </div>
        </Modal>
      )}
      {showEndHearingModal.openEndHearingModal && (
        <Modal
          headerBarMain={<Heading label={t("CS_CASE_CONFIRM_END_HEARING")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: false });
              }}
            />
          }
          actionSaveLabel={t(passOver ? "CS_CASE_PASS_OVER_START_NEXT_HEARING" : "CS_CASE_END_START_NEXT_HEARING")}
          isBackButtonDisabled={apiCalled}
          isCustomButtonDisabled={apiCalled}
          isDisabled={apiCalled}
          actionSaveOnSubmit={async () => {
            setApiCalled(true);
            hearingService
              .updateHearings(
                {
                  tenantId: Digit.ULBService.getCurrentTenantId(),
                  hearing: { ...currentInProgressHearing, workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
                  hearingType: "",
                  status: "",
                },
                { applicationNumber: "", cnrNumber: "" }
              )
              .then(() => {
                setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: false });
                nextHearing(true);
                setApiCalled(false);
              })
              .catch((error) => {
                console.error("Error while updating hearings", error);
                setApiCalled(false);
              })
              .finally(() => {
                setApiCalled(false);
              });
          }}
          actionCustomLabelSubmit={async () => {
            setApiCalled(true);
            hearingService
              .updateHearings(
                {
                  tenantId: Digit.ULBService.getCurrentTenantId(),
                  hearing: { ...currentInProgressHearing, workflow: { action: passOver ? "PASS_OVER" : "CLOSE" } },
                  hearingType: "",
                  status: "",
                },
                { applicationNumber: "", cnrNumber: "" }
              )
              .then(() => {
                setTimeout(() => {
                  setShowEndHearingModal({
                    isNextHearingDrafted: false,
                    openEndHearingModal: false,
                  });
                  setApiCalled(false);
                  history.push(`/${window?.contextPath}/employee/home/home-screen`);
                }, 100);
              })
              .catch((error) => {
                console.error("Error while updating hearings", error);
                setApiCalled(false);
              })
              .finally(() => {
                setApiCalled(false);
              });
          }}
          actionCancelOnSubmit={() => {
            setShowEndHearingModal({ isNextHearingDrafted: false, openEndHearingModal: false });
          }}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCustomLabel={t(passOver ? "CS_CASE_PASS_OVER_VIEW_CAUSE_LIST" : "CS_CASE_END_VIEW_CAUSE_LIST")}
          customActionClassName={"end-and-view-causelist-button"}
          submitClassName={"end-and-view-causelist-submit-button"}
          className={"confirm-end-hearing-modal"}
        >
          <div style={{ margin: "16px 0px" }}>
            <CheckBox
              onChange={(e) => {
                setPassOver(e.target.checked);
              }}
              label={`${t("CS_CASE_PASS_OVER")}: ${t("CS_CASE_PASS_OVER_HEARING_TEXT")}`}
              checked={passOver}
              disable={false}
            />
          </div>
        </Modal>
      )}
      {showOrderModal && (
        <OrderDrawer
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          onSubmit={(action) => {
            if (action === "end-hearing") {
              // Handle end hearing action
            } else if (action === "view-cause-list") {
              // Handle view cause list action
            }
            setShowOrderModal(false);
          }}
          attendees={currentInProgressHearing?.attendees}
          caseDetails={caseDetails}
          currentHearingId={currentInProgressHearingId}
          setUpdateCounter={setUpdateCounter}
          isBailBondTaskExists={isBailBondTaskExists}
          setIsBailBondTaskExists={setIsBailBondTaskExists}
          setShowBailBondModal={setShowBailBondModal}
        />
      )}
      {showWitnessModal && (
        <WitnessDrawerV2
          isOpen={showWitnessModal}
          onClose={() => {
            setShowWitnessModal(false);
            setEditWitnessDepositionArtifact(null);
            refetchHearing();
            refetchCaseData();
            onTabChange(0, {}, "Documents");
          }}
          onSubmit={(action) => {
            if (action === "end-hearing") {
              // Handle end hearing action
            } else if (action === "view-cause-list") {
              // Handle view cause list action
            }
            setShowWitnessModal(false);
          }}
          attendees={currentActiveHearing?.attendees}
          // caseDetails={latestCaseDetails}
          hearing={currentActiveHearing}
          hearingId={currentInProgressHearingId}
          tenantId={tenantId}
          // refetchCaseData={refetchCaseData}
          artifactNumber={editWitnessDepositionArtifact}
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
          caseDetails={latestCaseDetails}
          tenantId={tenantId}
        />
      )}{" "}
      {showAllStagesModal && (
        <Modal popupStyles={{}} hideSubmit={true} popmoduleClassName={"workflow-timeline-modal"}>
          {caseTimeLine}
        </Modal>
      )}
      {showBailBondModal &&
        (!isBailBondTaskExists ? (
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
        ) : (
          <Modal
            headerBarEnd={<CloseBtn onClick={() => setShowBailBondModal(false)} />}
            actionSaveLabel={t("CS_COMMON_CLOSE")}
            actionSaveOnSubmit={() => setShowBailBondModal(false)}
            formId="modal-action"
            headerBarMain={<Heading label={t("TASK_ALREADY_EXISTS")} />}
            className="upload-signature-modal"
            submitTextClassName="upload-signature-button"
          >
            <div style={{ margin: "16px 16px" }}>{t("TASK_ALREADY_EXISTS_TEXT")}</div>
          </Modal>
        ))}
      {showAddWitnessModal && (
        <AddWitnessModal
          activeTab={activeTab}
          onCancel={() => setShowAddWitnessModal(false)}
          onDismiss={() => setShowAddWitnessModal(false)}
          tenantId={tenantId}
          caseDetails={caseDetails}
          isEmployee={isEmployee}
          showToast={showToast}
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
      {showDownloadCasePdfModal && (
        <Modal
          headerBarMain={<Heading label={t("DOWNLOAD_CASE_FILE")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                if (!downloadCasePdfLoading) {
                  setShowDownloadCasePdfModal(false);
                }
              }}
            />
          }
          actionCancelLabel={t("CS_COMMON_CLOSE")}
          actionCancelOnSubmit={() => {
            if (!downloadCasePdfLoading) {
              setShowDownloadCasePdfModal(false);
            }
          }}
          actionSaveLabel={t("DOWNLOAD")}
          actionSaveOnSubmit={handleDownloadClick}
          style={{ height: "40px" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          isDisabled={downloadCasePdfLoading || casePdfError || !casePdfFileStoreId}
          isBackButtonDisabled={downloadCasePdfLoading}
          children={
            downloadCasePdfLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px" }}>
                <Loader />
                <p style={{ margin: 0, textAlign: "center" }}>{t("CASE_BUNDLE_GENERATION_IN_PROGRESS")}</p>
              </div>
            ) : casePdfError ? (
              <div style={{ padding: "24px" }}>
                <p style={{ margin: 0, color: "#D4351C" }}>{casePdfError}</p>
              </div>
            ) : (
              <div style={{ padding: "24px" }}>
                <p style={{ margin: 0 }}>{t("CASE_BUNDLE_IS_READY")}</p>
              </div>
            )
          }
        />
      )}
    </div>
  );
};

export default AdmittedCaseV2;
