import { Button, Card, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch } from "react-router-dom";
import useGetIndividualAdvocate from "../../../hooks/dristi/useGetIndividualAdvocate";
import useGetOrders from "../../../hooks/dristi/useGetOrders";
import { OrderWorkflowState } from "../../../Utils/orderWorkflow";
import PublishedOrderModal from "./PublishedOrderModal";
import TasksComponent from "../../../../../home/src/components/TaskComponent";
import NextHearingCard from "./NextHearingCard";
import EmptyStates from "../../../../../home/src/components/EmptyStates";
import { PreviousHearingIcon, RecentOrdersIcon } from "../../../icons/svgIndex";
import { CaseWorkflowState } from "../../../Utils/caseWorkflow";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import JudgementViewCard from "./JudgementViewCard";
import ShowAllTranscriptModal from "../../../components/ShowAllTranscriptModal";
const CaseOverviewJudge = ({
  caseData,
  openHearingModule,
  handleDownload,
  handleSubmitDocument,
  handleExtensionRequest,
  extensionApplications,
  caseStatus,
  productionOfDocumentApplications,
  submitBailDocumentsApplications,
  filingNumber,
  currentHearingId,
  caseDetails,
}) => {
  const { t } = useTranslation();
  //   const filingNumber = caseData.filingNumber;
  const history = useHistory();
  const cnrNumber = caseData.cnrNumber;
  const caseId = caseData.caseId;
  const { path } = useRouteMatch();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState({});
  const [taskType, setTaskType] = useState({});
  const [showAllTranscript, setShowAllTranscript] = useState(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const userRoles = useMemo(() => userInfo?.roles?.map((role) => role.code), [userInfo]);
  const advocateIds = caseData?.case?.representatives?.map((representative) => {
    return {
      id: representative?.advocateId,
    };
  });

  const NoticeProcessModal = useMemo(
    () => Digit.ComponentRegistryService.getComponent("NoticeProcessModal") || <React.Fragment></React.Fragment>,
    []
  );

  const allAdvocates = useMemo(() => getAdvocates(caseData?.case)[userInfo?.uuid], [caseData?.case, userInfo]);
  const isAdvocatePresent = useMemo(
    () => (userInfo?.roles?.some((role) => role?.code === "ADVOCATE_ROLE") ? true : allAdvocates?.includes(userInfo?.uuid)),
    [allAdvocates, userInfo?.roles, userInfo?.uuid]
  );

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

  // const { data: advocateDetails, isLoading: isAdvocatesLoading } = useGetIndividualAdvocate(
  //   {
  //     criteria: advocateIds,
  //   },
  //   { tenantId: tenantId },
  //   "DRISTI",
  //   cnrNumber + filingNumber,
  //   Boolean(filingNumber)
  // );

  const { data: hearingRes, isLoading: isHearingsLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
      },
    },
    {},
    cnrNumber + filingNumber,
    Boolean(filingNumber)
  );

  const { data: ordersRes, isLoading: isOrdersLoading } = useGetOrders(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
      },
    },
    {},
    cnrNumber + filingNumber,
    Boolean(filingNumber)
  );

  const previousHearing = hearingRes?.HearingList?.filter((hearing) => !["SCHEDULED", "IN_PROGRESS"].includes(hearing?.status)).sort(
    (hearing1, hearing2) => hearing2.endTime - hearing1.endTime
  );

  const navigateOrdersGenerate = () => {
    history.push(`/${window.contextPath}/employee/orders/generate-orders?filingNumber=${filingNumber}`);
  };

  const orderList = useMemo(
    () =>
      userRoles.includes("CITIZEN")
        ? ordersRes?.list.filter((order) => order.status === "PUBLISHED")
        : ordersRes?.list?.filter((order) => order.status !== "DRAFT_IN_PROGRESS"),
    [userRoles, ordersRes?.list]
  );

  const handleMakeSubmission = () => {
    history.push(`/${window?.contextPath}/citizen/submissions/submissions-create?filingNumber=${filingNumber}`);
  };

  if (isHearingsLoading || isOrdersLoading) {
    return <Loader />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="hearing-summary-container">
        {hearingRes?.HearingList?.find((hearing) => !["SCHEDULED", "IN_PROGRESS"].includes(hearing?.status) && Boolean(hearing?.transcript?.[0])) && (
          <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none" }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "18.75px",
                  color: "#231F20",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <PreviousHearingIcon />
                <span style={{ lineHeight: "normal", marginLeft: "12px" }}>{t("PREVIOUS_HEARING_SUMMARY")}</span>
              </div>
              <div
                style={{ color: "#007E7E", cursor: "pointer", fontWeight: 700, fontSize: "16px", lineHeight: "18.75px" }}
                onClick={() => setShowAllTranscript(true)}
              >
                {t("VIEW_ALL_SUMMARIES")}
              </div>
            </div>
            <hr style={{ borderTop: "1px solid #E8E8E8", margin: "10px -15px 0px -15px" }} />
            <div
              style={{
                padding: "10px",
                color: "#505A5F",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "24px",
              }}
            >
              {previousHearing?.[0]?.transcript?.length
                ? previousHearing?.[0]?.transcript?.map((transcript) => <div>{transcript}</div>)
                : "No Transcript available for this hearing"}
            </div>
          </Card>
        )}
      </div>
      <div className="pending-actions-container">
        <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none" }}>
          <TasksComponent
            taskType={taskType}
            setTaskType={setTaskType}
            isLitigant={userRoles.includes("CITIZEN")}
            uuid={userInfo?.uuid}
            userInfoType={userInfoType}
            filingNumber={filingNumber}
            inCase={true}
            tableView={true}
          />
        </Card>
      </div>
      <div className="process-summary-container">
        <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none" }}>
          {<NoticeProcessModal showModal={false} filingNumber={filingNumber} currentHearingId={currentHearingId} caseDetails={caseDetails} />}
        </Card>
      </div>
      {showAllTranscript && <ShowAllTranscriptModal setShowAllTranscript={setShowAllTranscript} hearingList={previousHearing} judgeView={true} />}
    </div>
  );
};

export default CaseOverviewJudge;
