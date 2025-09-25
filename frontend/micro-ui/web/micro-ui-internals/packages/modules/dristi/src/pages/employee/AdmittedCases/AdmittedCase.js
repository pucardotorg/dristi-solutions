import { Button as ActionButton } from "@egovernments/digit-ui-components";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import { ActionBar, SubmitBar, Button, Header, InboxSearchComposer, Loader, Menu, Toast, CloseSvg } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { CustomThreeDots } from "../../../icons/svgIndex";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import ViewCaseFile from "../scrutiny/ViewCaseFile";
import { TabSearchconfig } from "./AdmittedCasesConfig";
import CaseOverview from "./CaseOverview";
import EvidenceModal from "./EvidenceModal";
import ExtraComponent from "./ExtraComponent";
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
import {
  admitCaseSubmitConfig,
  scheduleCaseAdmissionConfig,
  scheduleCaseSubmitConfig,
  selectParticipantConfig,
  sendBackCase,
} from "../../citizen/FileCase/Config/admissionActionConfig";
import Modal from "../../../components/Modal";
import CustomCaseInfoDiv from "../../../components/CustomCaseInfoDiv";
import { getDate, removeInvalidNameParts } from "../../../Utils";
import useWorkflowDetails from "../../../hooks/dristi/useWorkflowDetails";
import useSearchOrdersService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersService";
import VoidSubmissionBody from "./VoidSubmissionBody";
import DocumentModal from "@egovernments/digit-ui-module-orders/src/components/DocumentModal";
import { getFullName } from "../../../../../cases/src/utils/joinCaseUtils";
import PublishedNotificationModal from "./publishedNotificationModal";
import ConfirmEvidenceAction from "../../../components/ConfirmEvidenceAction";
import NoticeAccordion from "../../../components/NoticeAccordion";
import useCaseDetailSearchService from "../../../hooks/dristi/useCaseDetailSearchService";
import CaseBundleView from "./CaseBundleView";
import Breadcrumb from "../../../components/BreadCrumb";
import PaymentDemandModal from "./PaymentDemandModal";
import AddWitnessModal from "@egovernments/digit-ui-module-hearings/src/pages/employee/AddWitnessModal";
import MarkAsEvidence from "./MarkAsEvidence";

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

const relevantStatuses = ["CASE_ADMITTED", "PENDING_ADMISSION_HEARING", "PENDING_NOTICE", "PENDING_RESPONSE", "PENDING_ADMISSION"];
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

const AdmittedCases = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { pathname, search, hash } = location;
  const { path } = useRouteMatch();
  const urlParams = new URLSearchParams(location.search);
  const { hearingId, taskOrderType, artifactNumber } = Digit.Hooks.useQueryParams();
  const caseId = urlParams.get("caseId");
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isCourtRoomManager = roles?.some((role) => role.code === "COURT_ROOM_MANAGER");
  const isBenchClerk = roles?.some((role) => role.code === "BENCH_CLERK");
  const activeTab = urlParams.get("tab") || "Overview";
  const filingNumber = urlParams.get("filingNumber");
  const applicationNumber = urlParams.get("applicationNumber");
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();

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
  const [voidReason, setVoidReason] = useState("");
  const [isDelayApplicationPending, setIsDelayApplicationPending] = useState(false);
  const [isOpenDCA, setIsOpenDCA] = useState(false);
  const [isOpenFromPendingTask, setIsOpenFromPendingTask] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showMakeAsEvidenceModal, setShowMakeAsEvidenceModal] = useState(false);

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCitizenMenu, setShowCitizenMenu] = useState(false);
  const [showJoinCase, setShowJoinCase] = useState(false);
  const [showPaymentDemandModal, setShowPaymentDemandModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);

  const JoinCaseHome = useMemo(() => Digit.ComponentRegistryService.getComponent("JoinCaseHome"), []);
  const history = useHistory();
  const isCitizen = userRoles.includes("CITIZEN");
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const [showAddWitnessModal, setShowAddWitnessModal] = useState(false);

  const OrderWorkflowAction = useMemo(() => Digit.ComponentRegistryService.getComponent("OrderWorkflowActionEnum") || {}, []);
  const ordersService = useMemo(() => Digit.ComponentRegistryService.getComponent("OrdersService") || {}, []);
  const OrderReviewModal = useMemo(() => Digit.ComponentRegistryService.getComponent("OrderReviewModal") || {}, []);
  const NoticeProcessModal = useMemo(
    () => Digit.ComponentRegistryService.getComponent("NoticeProcessModal") || <React.Fragment></React.Fragment>,
    []
  );
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && !isCitizen) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const todayDate = new Date().getTime();
  const { downloadPdf } = useDownloadCasePdf();
  const [isShow, setIsShow] = useState(false);
  const currentDiaryEntry = history.location?.state?.diaryEntry;
  const historyCaseData = location?.state?.caseData;
  const historyOrderData = location?.state?.orderData;
  const newWitnesToast = history.location?.state?.newWitnesToast;

  const courtId = localStorage.getItem("courtId");
  const reqEvidenceUpdate = {
    url: Urls.dristi.evidenceUpdate,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  };

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
    Boolean(caseId && !historyCaseData)
  );

  const caseData = historyCaseData || apiCaseData;
  const caseDetails = useMemo(() => caseData?.cases || {}, [caseData]);
  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);
  const delayCondonationData = useMemo(() => caseDetails?.caseDetails?.delayApplications?.formdata?.[0]?.data, [caseDetails]);

  const cnrNumber = useMemo(() => caseDetails?.cnrNumber || "", [caseDetails]);

  const showTakeAction = useMemo(() => userRoles.includes("ORDER_CREATOR") && !isCitizen && relevantStatuses.includes(caseDetails?.status), [
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

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
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
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
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
      parties: [...finalLitigantsData, ...finalRepresentativesData],
      case: caseDetails,
      statue: statue,
    }),
    [caseDetails, caseId, cnrNumber, filingNumber, finalLitigantsData, finalRepresentativesData, statue]
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
      if (isCitizen || isBenchClerk) {
        if (documentStatus === "PENDING_E-SIGN" && documentCreatedByUuid === userInfo?.uuid) {
          history.push(
            `/${window?.contextPath}/${
              isCitizen ? "citizen" : "employee"
            }/submissions/submit-document?filingNumber=${filingNumber}&artifactNumber=${artifactNumber}`
          );
        }
        if (
          [SubmissionWorkflowState.PENDINGPAYMENT, SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(status)
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
      } else {
        if (
          ![SubmissionWorkflowState.PENDINGPAYMENT, SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(status)
        ) {
          setDocumentSubmission(docObj);
          setShow(true);
        }
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
      if ("mark_as_evidence" === item.id || "unmark_as_evidence" === item.id || "view_mark_as_evidence" === item.id) {
        setSelectedRow(row);
        setDocumentSubmission(docObj);
        setSelectedItem(item); // Store row before showing the modal
        setShowMakeAsEvidenceModal(true);
        // setShowConfirmationModal(true);
      } else if ("mark_as_void" === item.id || "view_reason_for_voiding" === item.id) {
        setDocumentSubmission(docObj);
        setVoidReason(row?.reason);
        setShowVoidModal(true);
      } else if ("download_filing" === item.id) {
        downloadPdf(tenantId, row?.file?.fileStore);
      }
    };

    const activeTabConfig = TabSearchconfig?.TabSearchconfig.find((tabConfig) => tabConfig.label === activeTab);
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
                  columns: tabConfig.sections.searchResult.uiConfig.columns.filter(
                    (column) => !(column?.label === "ACTIONS" && userType === "employee")
                  ),
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
                  fields: tabConfig.sections.search.uiConfig.fields.map((field) =>
                    field.key === "parties"
                      ? {
                          ...field,
                          populators: {
                            name: "parties",
                            optionsKey: "name",
                            options: caseRelatedData.parties.map((party) => ({
                              code: removeInvalidNameParts(party.name),
                              name: removeInvalidNameParts(party.name),
                            })),
                          },
                        }
                      : field
                  ),
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
                    ...tabConfig.sections.search.uiConfig.fields,
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
                      label: "OWNER",
                      isMandatory: false,
                      key: "owner",
                      type: "dropdown",
                      populators: {
                        name: "owner",
                        optionsKey: "name",
                        options: caseRelatedData.parties.map((party) => ({
                          code: removeInvalidNameParts(party.name),
                          name: removeInvalidNameParts(party.name),
                          value: party.additionalDetails?.uuid,
                        })),
                      },
                    },
                    ...tabConfig.sections.search.uiConfig.fields,
                  ],
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) =>
                    column.label === "DOCUMENT_TEXT" || column.label === "SUBMISSION_TYPE"
                      ? { ...column, clickFunc: docSetFunc }
                      : column.label === "OWNER"
                      ? { ...column, parties: caseRelatedData.parties }
                      : column
                  ),
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
    isBenchClerk,
    downloadPdf,
    ordersService,
    caseCourtId,
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
      ...TabSearchconfig,
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
              isEvidence: false,
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
    return TabSearchconfig?.TabSearchconfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: configItem?.label === activeTab ? true : false,
      displayLabel: configItem?.displayLabel,
    }));
  }, [activeTab]);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [toastDetails, setToastDetails] = useState({});
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showScheduleHearingModal, setShowScheduleHearingModal] = useState(false);

  const isTabDisabled = useMemo(() => {
    return !relevantStatuses.includes(caseDetails?.status);
  }, [caseDetails?.status]);

  const isCaseAdmitted = useMemo(() => {
    return caseDetails?.status === "CASE_ADMITTED";
  }, [caseDetails?.status]);

  const getEvidence = async () => {
    try {
      const response = await DRISTIService.searchEvidence(
        {
          criteria: {
            filingNumber,
            artifactNumber,
            tenantId,
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
      }
    } catch (error) {
      console.error("Error fetching evidence:", error);
      history.goBack();
    }
  };

  useEffect(() => {
    const getOwnerName = async (artifact) => {
      if (artifact?.sourceType === "COURT") {
        if (artifact.sourceID === undefined) {
          return "NA";
        }
        const owner = await Digit.UserService.userSearch(tenantId, { uuid: [artifact?.sourceID] }, {});
        if (owner?.user?.length > 1) return "";
        return `${owner?.user?.[0]?.name}`.trim();
      } else {
        if (artifact?.sourceID === undefined) {
          return "NA";
        }
        const owner = await DRISTIService.searchIndividualUser(
          {
            Individual: {
              individualId: artifact?.sourceID,
            },
          },
          { tenantId, limit: 1000, offset: 0 }
        );
        return `${owner?.Individual[0]?.name?.givenName} ${owner[0]?.Individual[0]?.name?.familyName || ""}`.trim();
      }
    };
    const fetchEvidence = async () => {
      try {
        const response = await DRISTIService.searchEvidence(
          {
            criteria: {
              filingNumber,
              artifactNumber,
              tenantId,
              ...(caseCourtId && { courtId: caseCourtId }),
            },
            tenantId,
          },
          {}
        );

        const uniqueArtifactsMap = new Map();
        response?.artifacts?.forEach((artifact) => {
          if (!uniqueArtifactsMap.has(artifact.sourceID)) {
            uniqueArtifactsMap.set(artifact.sourceID, artifact);
          }
        });
        const uniqueArtifacts = Array.from(uniqueArtifactsMap.values());

        const ownerNames = await Promise.all(
          uniqueArtifacts?.map(async (artifact) => {
            const ownerName = await getOwnerName(artifact);
            return { owner: ownerName, sourceID: artifact.sourceID };
          })
        );
        const evidence = response?.artifacts?.map((artifact) => {
          const ownerName = ownerNames?.find((item) => item.sourceID === artifact.sourceID)?.owner;
          return { artifact, owner: ownerName };
        });
        setArtifacts(evidence);
      } catch (error) {
        console.error("Error fetching evidence:", error);
      }
    };
    if (activeTab === "Documents") {
      // There is no need to set Artifacts now, so commenting the fetchEvidence function call but keeping the code.
      // fetchEvidence();
    }
  }, [filingNumber, artifactNumber, tenantId, activeTab]);

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
    }
  }, [history.location?.state?.applicationDocObj, show]);

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
      setShow(true);
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

  const getDefaultValue = (value) => value || "N.A.";
  const formatDateOrDefault = (date) => (date ? formatDate(new Date(date)) : "N.A.");

  const caseBasicDetails = useMemo(() => {
    return [
      {
        key: "CS_FILING_NO",
        value: getDefaultValue(caseDetails?.filingNumber),
      },
      {
        key: "CS_COMPLAINT_NO",
        value: getDefaultValue(caseDetails?.cmpNumber),
      },
      {
        key: "CS_CNR",
        value: getDefaultValue(caseDetails?.cnrNumber),
      },
      {
        key: "CS_CCST",
        value: getDefaultValue(caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber),
      },
      {
        key: "SUBMITTED_ON",
        value: formatDateOrDefault(caseDetails?.filingDate),
      },
      {
        key: "REGISTERED_ON",
        value: formatDateOrDefault(caseDetails?.registrationDate),
      },
    ];
  }, [caseDetails]);

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
        const orderType = type === "reject" ? "DISMISS_CASE" : type === "accept" ? "TAKE_COGNIZANCE" : null;
        const formdata = {
          orderType: {
            code: orderType,
            type: orderType,
            name: `ORDER_TYPE_${orderType}`,
          },
        };
        if (generateOrder) {
          const caseNumber =
            (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
            caseDetails?.courtCaseNumber ||
            caseDetails?.cmpNumber ||
            caseDetails?.filingNumber;
          const reqbody = {
            order: {
              createdDate: null,
              tenantId,
              cnrNumber,
              filingNumber,
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
            actionCategory: "Schedule Hearing",
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
            actionCategory: "Schedule Hearing",
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

  const { data: hearingDetails } = Digit.Hooks.hearings.useGetHearings(
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
    (_, i) => {
      history.replace(`${path}?caseId=${caseId}&filingNumber=${filingNumber}&tab=${i?.label}`, {
        caseData,
        orderData: ordersData,
      });
    },
    [caseData, caseId, filingNumber, history, ordersData, path]
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
          filingNumber,
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

  const onSubmit = async () => {
    switch (primaryAction.action) {
      case "REGISTER":
        break;
      case "ADMIT":
        if ((isDelayApplicationPending || isDelayCondonationApplicable) && !isDelayApplicationCompleted) {
          setIsOpenDCA(true);
        } else {
          setSubmitModalInfo({ ...admitCaseSubmitConfig, caseInfo: caseInfo });
          setModalInfo({ type: "admitCase", page: 0 });
          setShowModal(true);
        }
        break;
      case "ISSUE_ORDER":
        const { hearingDate, hearingNumber } = await getHearingData();
        if (hearingNumber) {
          const {
            list: [orderData],
          } = await Digit.ordersService.searchOrder({
            tenantId,
            criteria: {
              filingNumber,
              applicationNumber: "",
              cnrNumber,
              status: OrderWorkflowState.DRAFT_IN_PROGRESS,
              hearingNumber: hearingNumber,
              ...(caseCourtId && { courtId: caseCourtId }),
            },
            pagination: { limit: 1, offset: 0 },
          });
          if (
            (orderData?.orderCategory === "COMPOSITE" && orderData?.compositeItems?.some((item) => item?.orderType === "NOTICE")) ||
            orderData?.orderType === "NOTICE"
          ) {
            history.push(
              `/${window?.contextPath}/employee/orders/generate-order?filingNumber=${caseDetails?.filingNumber}&orderNumber=${orderData.orderNumber}`,
              {
                caseId: caseId,
                tab: "Orders",
              }
            );
          } else {
            handleIssueNotice(hearingDate, hearingNumber);
          }
        }
        break;
      case "SCHEDULE_ADMISSION_HEARING":
        setShowScheduleHearingModal(true);
        setCreateAdmissionOrder(true);
        break;

      default:
        break;
    }
  };

  const onSaveDraft = async () => {
    if ([CaseWorkflowState.PENDING_NOTICE, CaseWorkflowState.PENDING_RESPONSE].includes(caseDetails?.status)) {
      const { hearingDate, hearingNumber } = await getHearingData();
      if (hearingNumber) {
        const date = new Date(hearingDate);
        const requestBody = {
          order: {
            createdDate: null,
            tenantId: tenantId,
            // hearingNumber: hearingNumber,
            filingNumber: filingNumber,
            cnrNumber: cnrNumber,
            statuteSection: {
              tenantId: tenantId,
            },
            orderTitle: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
            orderCategory: "INTERMEDIATE",
            orderType: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
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
                  type: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  isactive: true,
                  code: "INITIATING_RESCHEDULING_OF_HEARING_DATE",
                  name: "ORDER_TYPE_INITIATING_RESCHEDULING_OF_HEARING_DATE",
                },
                originalHearingDate: `${date.getFullYear()}-${date.getMonth() < 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${
                  date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
                }`,
              },
            },
          },
        };
        ordersService
          .createOrder(requestBody, { tenantId: Digit.ULBService.getCurrentTenantId() })
          .then((res) => {
            history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${res.order.orderNumber}`, {
              caseId: caseDetails?.id,
              tab: "Orders",
            });
          })
          .catch((err) => {
            console.error("Error while creating order", err);
            showToast({ isError: true, message: "ORDER_CREATION_FAILED" });
          });
      }
    } else {
      setShowModal(true);
      setSubmitModalInfo({
        ...scheduleCaseSubmitConfig,
        caseInfo: [...caseInfo],
        shortCaseInfo: [
          {
            key: "CASE_NUMBER",
            value: caseDetails?.caseNumber,
          },
          {
            key: "COURT_NAME",
            value: t(`COMMON_MASTERS_COURT_R00M_${caseCourtId}`),
          },
          {
            key: "CASE_TYPE",
            value: "NIA S138",
          },
        ],
      });
      setModalInfo({ type: "schedule", page: 0 });
    }
  };

  const handleMakeSubmission = useCallback(() => {
    history.push(`/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const handleSubmitDocuments = useCallback(() => {
    history.push(`/${window?.contextPath}/citizen/submissions/submit-document?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const handleCitizenAction = useCallback(
    (option) => {
      if (option.value === "RAISE_APPLICATION") {
        history.push(`/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}`);
      } else if (option.value === "SUBMIT_DOCUMENTS") {
        history.push(`/${window?.contextPath}/citizen/submissions/submit-document?filingNumber=${filingNumber}`);
      }
    },
    [filingNumber, history]
  );

  const handleCourtAction = useCallback(() => {
    history.push(`/${window?.contextPath}/employee/submissions/submit-document?filingNumber=${filingNumber}`);
  }, [filingNumber, history]);

  const openHearingModule = useCallback(() => {
    setShowScheduleHearingModal(true);
    if (!isCaseAdmitted) {
      setCreateAdmissionOrder(true);
    }
  }, [isCaseAdmitted]);

  const handleSelect = useCallback(
    (option) => {
      if (option === t("MAKE_SUBMISSION")) {
        history.push(`/${window?.contextPath}/employee/submissions/submissions-create?filingNumber=${filingNumber}&applicationType=DOCUMENT`);
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
      }
      history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}`, { caseId: caseId, tab: "Orders" });
    },
    [t, history, filingNumber, caseId, openHearingModule, tenantId, cnrNumber, OrderWorkflowAction.SAVE_DRAFT, ordersService, activeTab, showToast]
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
      history.push(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Orders`);
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
    ],
    []
  );

  const courtActionOptions = useMemo(
    () => [
      {
        value: "SUBMIT_DOCUMENTS",
        label: "Submit Documents",
      },
    ],
    []
  );

  const takeActionOptions = useMemo(
    () => [
      ...(userRoles?.includes("SUBMISSION_CREATOR") && !userRoles?.includes("BENCH_CLERK") ? [t("MAKE_SUBMISSION")] : []),
      t("GENERATE_ORDER_HOME"),
      t("SCHEDULE_HEARING"),
      t("REFER_TO_ADR"),
    ],
    [t, userRoles]
  );

  // outcome always null unless case went on final stage
  const showActionBar = useMemo(
    () =>
      (primaryAction.action ||
        secondaryAction.action ||
        tertiaryAction.action ||
        ([CaseWorkflowState.PENDING_NOTICE, CaseWorkflowState.PENDING_RESPONSE].includes(caseDetails?.status) && !isCitizen)) &&
      !caseDetails?.outcome &&
      !isCourtRoomManager,
    [primaryAction.action, secondaryAction.action, tertiaryAction.action, caseDetails?.status, caseDetails?.outcome, isCitizen, isCourtRoomManager]
  );

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

  const handleDownloadPDF = useCallback(async () => {
    const caseId = caseDetails?.id;
    const caseStatus = caseDetails?.status;

    if (["PENDING_PAYMENT", "RE_PENDING_PAYMENT", "UNDER_SCRUTINY", "PENDING_REGISTRATION"].includes(caseStatus)) {
      const fileStoreId =
        caseDetails?.documents?.find((doc) => doc?.key === "case.complaint.signed")?.fileStore || caseDetails?.additionalDetails?.signedCaseDocument;
      if (fileStoreId) {
        downloadPdf(tenantId, fileStoreId);
        return;
      } else {
        console.error("No fileStoreId available for download.");
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

      downloadPdf(tenantId, responseFileStoreId);
    } catch (error) {
      console.error("Error downloading PDF: ", error.message || error);
      showToast({
        isError: true,
        message: "UNABLE_CASE_PDF",
      });
    } finally {
      setDownloadCasePdfLoading(false);
    }
  }, [caseDetails, downloadPdf, tenantId, showToast]);

  const citizenCrumbs = useMemo(
    () => [
      {
        path: `/${window?.contextPath}/citizen/home/home-pending-task`,
        content: t("ES_COMMON_HOME"),
        show: true,
        isLast: false,
      },
      {
        path: `${path}/home/view-case`,
        content: t("VIEW_CASE"),
        show: true,
        isLast: true,
      },
    ],
    [path, t]
  );
  const complainants = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("complainant"))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
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
          const uniqueId = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          )?.uniqueId;
          return {
            additionalDetails: item?.additionalDetails,
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

  if (caseApiLoading || isWorkFlowLoading || isApplicationLoading || isCaseFetching) {
    return <Loader />;
  }
  if (
    (userRoles?.includes("JUDGE_ROLE") || userRoles?.includes("BENCH_CLERK") || userRoles?.includes("COURT_ROOM_MANAGER")) &&
    caseData?.cases?.status &&
    !judgeReviewStages.includes(caseData.cases.status)
  ) {
    history.push(homePath);
  }

  return (
    <div className="admitted-case" style={{ position: "absolute", width: "100%" }}>
      <Breadcrumb crumbs={citizenCrumbs} breadcrumbStyle={{ paddingLeft: 20 }}></Breadcrumb>
      {downloadCasePdfLoading && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "9999",
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
        style={{ position: showJoinCase ? "" : "", top: "72px", width: "100%", zIndex: 150, background: "white" }}
      >
        {caseDetails?.caseTitle && <Header styles={{ marginBottom: "-30px" }}>{caseDetails?.caseTitle}</Header>}
        <div className="admitted-case-details" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
          <div className="case-details-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {statue && (
              <React.Fragment>
                <div className="sub-details-text">{statue}</div>
              </React.Fragment>
            )}
            <hr className="vertical-line" />
            <div className="sub-details-text">{t(caseDetails?.stage)}</div>
            <hr className="vertical-line" />
            <div className="sub-details-text">{t(caseDetails?.substage)}</div>
            <hr className="vertical-line" />
            {caseDetails?.outcome && (
              <React.Fragment>
                <div className="sub-details-text">{t(caseDetails?.outcome)}</div>
                <hr className="vertical-line" />
              </React.Fragment>
            )}
            <div className="sub-details-text">Code: {caseDetails?.accessCode}</div>
            {delayCondonationData?.delayCondonationType?.code === "NO" && (
              <div className="delay-condonation-chip" style={delayCondonationStylsMain}>
                <p style={delayCondonationTextStyle}>
                  {(delayCondonationData?.isDcaSkippedInEFiling?.code === "NO" && isDelayApplicationPending) ||
                  isDelayApplicationPending ||
                  isDelayApplicationCompleted
                    ? t("DELAY_CONDONATION_FILED")
                    : t("DELAY_CONDONATION_NOT_FILED")}
                </p>
              </div>
            )}
          </div>
          <div className="make-submission-action" style={{ display: "flex", gap: 20, justifyContent: "space-between", alignItems: "center" }}>
            {isCitizen && (
              <Button
                variation={"outlined"}
                label={t("DOWNLOAD_CASE_FILE")}
                isDisabled={!caseDetails?.additionalDetails?.signedCaseDocument}
                onButtonClick={handleDownloadPDF}
              />
            )}
            {(showMakeSubmission || isCitizen) && (
              <div className="evidence-header-wrapper">
                <div className="evidence-hearing-header" style={{ background: "transparent" }}>
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
                      style={{ cursor: "pointer" }}
                    >
                      <CustomThreeDots />
                      {showCitizenMenu && (
                        <Menu
                          options={["MANAGE_CASE_ACCESS"]}
                          t={t}
                          onSelect={(option) => {
                            if (option === "MANAGE_CASE_ACCESS") {
                              setShowJoinCase(true);
                              setShowCitizenMenu(false);
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
          </div>
          {showTakeAction && (
            <div className="judge-action-block" style={{ display: "flex" }}>
              {!isCourtRoomManager && (
                <div className="evidence-header-wrapper">
                  <div className="evidence-hearing-header" style={{ background: "transparent" }}>
                    <div className="evidence-actions" style={{ ...(isTabDisabled ? { pointerEvents: "none" } : {}) }}>
                      <ActionButton
                        variation={"primary"}
                        label={t("TAKE_ACTION_LABEL")}
                        icon={showMenu ? "ExpandLess" : "ExpandMore"}
                        isSuffix={true}
                        onClick={handleTakeAction}
                        className={"take-action-btn-class"}
                      ></ActionButton>
                      {showMenu && <Menu options={takeActionOptions} onSelect={(option) => handleSelect(option)}></Menu>}
                    </div>
                  </div>
                </div>
              )}
              {isBenchClerk && (
                <div className="evidence-header-wrapper">
                  <div className="evidence-hearing-header" style={{ background: "transparent" }}>
                    <div className="evidence-actions" style={{ ...(isTabDisabled ? { pointerEvents: "none" } : {}) }}>
                      <ActionButton
                        variation={"primary"}
                        label={t("CS_CASE_MAKE_FILINGS")}
                        icon={showMenuFilings ? "ExpandLess" : "ExpandMore"}
                        isSuffix={true}
                        onClick={handleTakeFilingAction}
                        className={"take-action-btn-class"}
                      ></ActionButton>
                      {showMenuFilings && (
                        <Menu t={t} optionKey={"label"} localeKeyPrefix={"CS_CASE"} options={courtActionOptions} onSelect={handleCourtAction}></Menu>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="evidence-header-wrapper">
                <div className="evidence-hearing-header" style={{ background: "transparent" }}>
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
                      {showOtherMenu && <Menu options={[t("DOWNLOAD_CASE_FILE")]} onSelect={handleDownloadPDF}></Menu>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {hasAnyRelevantOrderType && (
          <div
            style={{
              backgroundColor: "#FFF6EA",
              padding: "8px 12px",
              borderRadius: "4px",
              display: "inline-block",
              fontSize: "14px",
              color: "#333",
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

        <CustomCaseInfoDiv t={t} data={caseBasicDetails} column={6} />
        <div className="search-tabs-container">
          <div>
            {tabData?.map((i, num) => (
              <button
                className={i?.active === true ? "search-tab-head-selected" : "search-tab-head"}
                onClick={() => {
                  onTabChange(num, i);
                }}
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
          <div style={{ fontWeight: 700, fontSize: "24px", lineHeight: "28.8px" }}>{t(`All_${config?.label.toUpperCase()}_TABLE_HEADER`)}</div>
          {/* {(!userRoles.includes("CITIZENS") || userRoles.includes("ADVOCATE_ROLE")) &&
            (config?.label === "Hearings" || config?.label === "Documents") && (
              <div style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}>
                {t("DOWNLOAD_ALL_LINK")}
              </div>
            )} */}
          {(showMakeSubmission || userType === "employee") && config?.label === "Parties" && (
            <Button
              label={t("ADD_NEW_WITNESS")}
              variation={"secondary"}
              onButtonClick={() => setShowAddWitnessModal(true)}
              style={{ marginRight: "30px" }}
            />
          )}
          {userRoles.includes("ORDER_CREATOR") && config?.label === "Orders" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <div
                onClick={() => handleSelect(t("GENERATE_ORDER_HOME"))}
                style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}
              >
                {t("GENERATE_ORDERS_LINK")}
              </div>
              {/* <div style={{ fontWeight: 500, fontSize: "16px", lineHeight: "20px", color: "#0A5757", cursor: "pointer" }}>
                {t("DOWNLOAD_ALL_LINK")}
              </div> */}
            </div>
          )}
          {userRoles.includes("ORDER_CREATOR") && config?.label === "Submissions" && (
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
      <div
        className="inbox-search-wrapper orders-tab-inbox-wrapper"
        style={{
          paddingBottom: tabData?.find((tab) => tab.label === "caseFileOverview")?.active ? "0px" : showActionBar ? "60px" : undefined,
        }}
      >
        {inboxComposer}
      </div>
      {tabData?.filter((tab) => tab.label === "Overview")?.[0]?.active && (
        <div className="case-overview-wrapper">
          <CaseOverview
            handleDownload={handleDownload}
            handleExtensionRequest={handleExtensionRequest}
            handleSubmitDocument={handleSubmitDocument}
            openHearingModule={openHearingModule}
            caseData={caseRelatedData}
            setUpdateCounter={setUpdateCounter}
            showToast={showToast}
            t={t}
            order={currentOrder}
            caseStatus={caseStatus}
            extensionApplications={extensionApplications}
            productionOfDocumentApplications={productionOfDocumentApplications}
            submitBailDocumentsApplications={submitBailDocumentsApplications}
          />
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
          style={{ maxWidth: "670px" }}
        />
      )}
      {showActionBar &&
        !isWorkFlowFetching &&
        ((currentHearingStatus === HearingWorkflowState.SCHEDULED && tertiaryAction.action) || primaryAction?.label || secondaryAction.action) && (
          <ActionBar className={"e-filing-action-bar"} style={{ justifyContent: "space-between" }}>
            <div style={{ width: "fit-content", display: "flex", gap: 20 }}>
              {currentHearingStatus === HearingWorkflowState.SCHEDULED && tertiaryAction.action && (
                <Button className="previous-button" variation="secondary" label={t(tertiaryAction.label)} onButtonClick={onSaveDraft} />
              )}
              {primaryAction?.label && <SubmitBar label={t(primaryAction?.label)} submit="submit" disabled={""} onSubmit={onSubmit} />}
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
          cmpNumber={caseDetails?.cmpNumber}
          stNumber={caseDetails?.courtCaseNumber}
          handleOrdersTab={handleOrdersTab}
        />
      )}
      {showMakeAsEvidenceModal && (
        <MarkAsEvidence
          showToast={showToastMsg}
          t={t}
          evidenceDetailsObj={artifact || documentSubmission?.[0]?.artifactList || selectedRow}
          setDocumentCounter={setUpdateCounter}
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
      )}{" "}
      {(showPaymentDemandModal || showPaymentConfirmationModal) && (
        <PaymentDemandModal
          t={t}
          setShowPaymentDemandModal={setShowPaymentDemandModal}
          setShowPaymentConfirmationModal={setShowPaymentConfirmationModal}
          joinedLitigants={[...complainants, ...respondents]}
          showPaymentConfirmationModal={showPaymentConfirmationModal}
          showPaymentDemandModal={showPaymentDemandModal}
          caseDetails={updatedCaseDetails}
          tenantId={tenantId}
        />
      )}
      {showAddWitnessModal && (
        <AddWitnessModal
          activeTab={activeTab}
          onCancel={() => setShowAddWitnessModal(false)}
          onDismiss={() => setShowAddWitnessModal(false)}
          tenantId={tenantId}
          caseDetails={caseDetails}
          isEmployee={userType === "employee"}
          showToast={showToast}
          onAddSuccess={() => {
            setShowAddWitnessModal(false);
          }}
        ></AddWitnessModal>
      )}
    </div>
  );
};

export default AdmittedCases;
