import { Card, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useRouteMatch } from "react-router-dom";
import useGetOrders from "../../../hooks/dristi/useGetOrders";
import TasksComponent from "@egovernments/digit-ui-module-home/src/components/TaskComponent";
import { PreviousHearingIcon } from "../../../icons/svgIndex";
import { getAdvocates } from "../../citizen/FileCase/EfilingValidationUtils";
import ShowAllTranscriptModal from "../../../components/ShowAllTranscriptModal";
import { HearingWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/hearingWorkflow";
const CaseOverviewV2 = ({ caseData, filingNumber, currentHearingId, caseDetails, showNoticeProcessModal = true }) => {
  const { t } = useTranslation();
  //   const filingNumber = caseData.filingNumber;
  const history = useHistory();
  const cnrNumber = caseData.cnrNumber;
  const { path } = useRouteMatch();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState({});
  const [taskType, setTaskType] = useState({});
  const [showAllTranscript, setShowAllTranscript] = useState(false);
  const [showAllStagesModal, setShowAllStagesModal] = useState(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const userRoles = useMemo(() => userInfo?.roles?.map((role) => role.code), [userInfo]);

  const NoticeProcessModal = useMemo(
    () => Digit.ComponentRegistryService.getComponent("NoticeProcessModal") || <React.Fragment></React.Fragment>,
    []
  );

  const allAdvocates = useMemo(() => getAdvocates(caseData?.case)[userInfo?.uuid], [caseData?.case, userInfo]);
  const isAdvocatePresent = useMemo(
    () => (userInfo?.roles?.some((role) => role?.code === "ADVOCATE_ROLE") ? true : allAdvocates?.includes(userInfo?.uuid)),
    [allAdvocates, userInfo?.roles, userInfo?.uuid]
  );

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

  const previousHearing = hearingRes?.HearingList?.filter((hearing) =>
    [HearingWorkflowState?.COMPLETED, HearingWorkflowState?.ABANDONED].includes(hearing?.status)
  ).sort((hearing1, hearing2) => hearing2.endTime - hearing1.endTime);

  if (isHearingsLoading || isOrdersLoading) {
    return <Loader />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="hearing-summary-container">
        {hearingRes?.HearingList?.find((hearing) => !["SCHEDULED", "IN_PROGRESS"].includes(hearing?.status) && Boolean(hearing?.hearingSummary)) && (
          <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none", maxWidth: "100%" }}>
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
              {previousHearing?.[0]?.hearingSummary ? <div>{previousHearing?.[0]?.hearingSummary}</div> : t("CS_CASE_NO_TRANSCRIPT_FOR_HEARING")}
            </div>
          </Card>
        )}
      </div>
      <div className="pending-actions-container">
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
      </div>
      {showNoticeProcessModal && (
        <div className="process-summary-container">
          <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none" }}>
            {<NoticeProcessModal showModal={false} filingNumber={filingNumber} currentHearingId={currentHearingId} caseDetails={caseDetails} />}
          </Card>
        </div>
      )}
      {showAllTranscript && <ShowAllTranscriptModal setShowAllTranscript={setShowAllTranscript} hearingList={previousHearing} judgeView={true} />}
      {showAllStagesModal && (
        <Modal popupStyles={{}} hideSubmit={true} popmoduleClassName={"workflow-timeline-modal"}>
          <WorkflowTimeline
            t={t}
            applicationNo={caseDetails?.filingNumber}
            tenantId={tenantId}
            businessService="case-default"
            onViewCasePage={true}
            setShowAllStagesModal={setShowAllStagesModal}
            modalView={true}
          />
        </Modal>
      )}
    </div>
  );
};

export default CaseOverviewV2;
