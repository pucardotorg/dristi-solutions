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
import { HearingWorkflowState } from "@egovernments/digit-ui-module-orders/src/utils/hearingWorkflow";
const CaseOverview = ({
  caseData,
  openHearingModule,
  handleDownload,
  handleSubmitDocument,
  handleExtensionRequest,
  extensionApplications,
  caseStatus,
  productionOfDocumentApplications,
  submitBailDocumentsApplications,
}) => {
  const { t } = useTranslation();
  const filingNumber = caseData.filingNumber;
  const caseCourtId = useMemo(() => caseData?.case?.courtId, [caseData]);
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
  const isEpostUser = useMemo(() => userRoles?.some((role) => role?.code === "POST_MANAGER"), [userRoles]);

  let homePath = `/${window?.contextPath}/${userInfoType}/home/home-pending-task`;
  if (!isEpostUser && userInfoType === "employee") homePath = `/${window?.contextPath}/${userInfoType}/home/home-screen`;

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
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    cnrNumber + filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const { data: ordersRes, isLoading: isOrdersLoading } = useGetOrders(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    cnrNumber + filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const previousHearing = hearingRes?.HearingList?.filter((hearing) =>
    [HearingWorkflowState?.COMPLETED, HearingWorkflowState?.ABANDONED].includes(hearing?.status)
  ).sort((hearing1, hearing2) => hearing2.endTime - hearing1.endTime);

  const navigateOrdersGenerate = () => {
    history.push(`/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}`);
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
    <div style={{ display: "flex" }}>
      <div style={{ width: "70%" }}>
        {caseData?.case?.outcome ? (
          <React.Fragment>
            <JudgementViewCard caseData={caseData} />
            {hearingRes?.HearingList?.filter((hearing) => !["SCHEDULED", "IN_PROGRESS"].includes(hearing?.status)).length !== 0 && (
              <Card>
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
                    <span style={{ lineHeight: "normal", marginLeft: "12px" }}>
                      {`Previous Hearing - ${previousHearing?.[0]?.hearingType.charAt(0).toUpperCase()}${previousHearing?.[0]?.hearingType
                        .slice(1)
                        .toLowerCase()} Hearing`}
                    </span>
                  </div>
                  <div
                    style={{ color: "#007E7E", cursor: "pointer", fontWeight: 700, fontSize: "16px", lineHeight: "18.75px" }}
                    onClick={() => setShowAllTranscript(true)}
                  >
                    {t("ALL_HEARING_TRANSCRIPT")}
                  </div>
                </div>
                <hr style={{ border: "1px solid #FFF6E880" }} />
                <div
                  style={{
                    padding: "10px",
                    color: "#505A5F",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                  }}
                >
                  {previousHearing?.[0]?.hearingSummary ? (
                    <div>{previousHearing?.[0]?.hearingSummary}</div>
                  ) : (
                    "No Transcript available for this hearing"
                  )}
                </div>
              </Card>
            )}
            {showAllTranscript && <ShowAllTranscriptModal setShowAllTranscript={setShowAllTranscript} hearingList={previousHearing} />}
          </React.Fragment>
        ) : hearingRes?.HearingList?.length === 0 && orderList?.length === 0 ? (
          <div
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              width: "100%",
              height: "500px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fffaf6",
              padding: "20px",
            }}
          >
            <EmptyStates heading={t("CASE_OVERVIEW_TEXT")} message={t("CASE_OVERVIEW_SUB_TEXT")} />
            {!userRoles.includes("CITIZEN") && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  width: "100%",
                  marginTop: "16px",
                  gap: "16px",
                }}
              >
                {userRoles.includes("HEARING_SCHEDULER") && (
                  <Button variation={"outlined"} label={t("SCHEDULE_HEARING")} onButtonClick={openHearingModule} />
                )}
                {userRoles.includes("ORDER_CREATOR") && (
                  <Button variation={"outlined"} label={t("GENERATE_ORDERS_LINK")} onButtonClick={() => navigateOrdersGenerate()} />
                )}
              </div>
            )}
            {showMakeSubmission && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                <Button variation={"outlined"} label={t("RAISE_APPLICATION")} onButtonClick={handleMakeSubmission} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <NextHearingCard caseData={caseData} width={"100%"} />
            {hearingRes?.HearingList?.filter((hearing) => !["SCHEDULED", "IN_PROGRESS"].includes(hearing?.status)).length !== 0 && (
              <Card>
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
                    <span style={{ lineHeight: "normal", marginLeft: "12px" }}>
                      {`Previous Hearing - ${previousHearing?.[0]?.hearingType.charAt(0).toUpperCase()}${previousHearing?.[0]?.hearingType
                        .slice(1)
                        .toLowerCase()} Hearing`}
                    </span>
                  </div>
                  <div
                    style={{ color: "#007E7E", cursor: "pointer", fontWeight: 700, fontSize: "16px", lineHeight: "18.75px" }}
                    onClick={() => setShowAllTranscript(true)}
                  >
                    {t("ALL_HEARING_TRANSCRIPT")}
                  </div>
                </div>
                <hr style={{ border: "1px solid #FFF6E880" }} />
                <div
                  style={{
                    padding: "10px",
                    color: "#505A5F",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                  }}
                >
                  {previousHearing?.[0]?.hearingSummary ? (
                    <div>{previousHearing?.[0]?.hearingSummary}</div>
                  ) : (
                    "No Transcript available for this hearing"
                  )}
                </div>
              </Card>
            )}
            {orderList?.length !== 0 && (
              <Card
                style={{
                  marginTop: "10px",
                }}
              >
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "16px",
                      lineHeight: "18.75px",
                      color: "#231F20",
                      width: "40%",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <RecentOrdersIcon />
                    <span style={{ lineHeight: "normal", marginLeft: "12px" }}>{t("RECENT_ORDERS")}</span>{" "}
                  </div>
                  <div
                    style={{ color: "#007E7E", cursor: "pointer", fontWeight: 700, fontSize: "16px", lineHeight: "18.75px" }}
                    onClick={() => history.replace(`${path}?caseId=${caseId}&filingNumber=${filingNumber}&tab=Orders`)}
                  >
                    {t("ALL_ORDERS_LINK")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
                  {orderList
                    ?.sort((order1, order2) => order2.auditDetails?.createdTime - order1.auditDetails?.createdTime)
                    .slice(0, 5)
                    .map((order) => (
                      <div
                        style={{
                          padding: "12px 16px",
                          fontWeight: 700,
                          fontSize: "16px",
                          lineHeight: "18.75px",
                          border: "1px solid #BBBBBD",
                          color: "#505A5F",
                          borderRadius: "4px",
                          width: "300px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={() => {
                          if (order?.status === OrderWorkflowState.DRAFT_IN_PROGRESS) {
                            history.push(
                              `/${window.contextPath}/employee/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${order?.orderNumber}`
                            );
                          } else if (order?.status === OrderWorkflowState.PENDING_BULK_E_SIGN) {
                            history.push(homePath, { isBulkEsignSelected: true });
                          } else {
                            setShowReviewModal(true);
                            setCurrentOrder(order);
                          }
                        }}
                      >
                        {order?.orderCategory === "COMPOSITE" ? order?.orderTitle : t(`ORDER_TYPE_${order?.orderType?.toUpperCase()}`)}
                      </div>
                    ))}
                </div>
              </Card>
            )}
            {/* <Button variation={"outlined"} label={"Schedule Hearing"} onButtonClick={openHearingModule} /> */}
            {showReviewModal && (
              <PublishedOrderModal
                t={t}
                order={currentOrder}
                handleDownload={handleDownload}
                handleRequestLabel={handleExtensionRequest}
                handleSubmitDocument={handleSubmitDocument}
                extensionApplications={extensionApplications}
                productionOfDocumentApplications={productionOfDocumentApplications}
                caseStatus={caseStatus}
                handleOrdersTab={() => {
                  setShowReviewModal(false);
                }}
                submitBailDocumentsApplications={submitBailDocumentsApplications}
              />
            )}
            {showAllTranscript && <ShowAllTranscriptModal setShowAllTranscript={setShowAllTranscript} hearingList={previousHearing} />}
          </div>
        )}
      </div>
      <div className="right-side">
        <TasksComponent
          taskType={taskType}
          setTaskType={setTaskType}
          isLitigant={userRoles.includes("CITIZEN")}
          uuid={userInfo?.uuid}
          userInfoType={userInfoType}
          filingNumber={filingNumber}
          inCase={true}
        />
      </div>
    </div>
  );
};

export default CaseOverview;
