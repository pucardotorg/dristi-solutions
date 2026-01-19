import { Card, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useGetBotdOrders from "../../../hooks/dristi/useGetBotdOrders";
import TasksComponent from "@egovernments/digit-ui-module-home/src/components/TaskComponent";
import { PreviousHearingIcon } from "../../../icons/svgIndex";
import ShowAllTranscriptModal from "../../../components/ShowAllTranscriptModal";
import NextHearingCard from "./NextHearingCard";

const CaseOverviewV2 = ({
  caseData,
  filingNumber,
  currentHearingId,
  caseDetails,
  showNoticeProcessModal = true,
  isBailBondTaskExists = false,
  ordersDataFromParent = null,
  hearingsDataFromParent = null,
}) => {
  const { t } = useTranslation();
  const cnrNumber = caseData.cnrNumber;
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [taskType, setTaskType] = useState({});
  const [showAllTranscript, setShowAllTranscript] = useState(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const userRoles = useMemo(() => userInfo?.roles?.map((role) => role.code), [userInfo]);

  const NoticeProcessModal = useMemo(
    () => Digit.ComponentRegistryService.getComponent("NoticeProcessModal") || <React.Fragment></React.Fragment>,
    []
  );

  const { data: botdOrdersRes, isLoading: isBotdOrdersLoading } = useGetBotdOrders(
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

  const previousBotdOrders = botdOrdersRes?.botdOrderList?.sort((order1, order2) => order2.createdDate - order1.createdDate);

  if (isBotdOrdersLoading) {
    return <Loader />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {userInfoType === "citizen" && (
        <div style={{ width: "100%" }}>
          <NextHearingCard
            caseData={caseData}
            width={"100%"}
            minWidth={"100%"}
            cardStyle={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none", maxWidth: "100%" }}
          />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "row", gap: "1rem", justifyContent: "space-between" }}>
        <div className="hearing-summary-container" style={{ width: "100%" }}>
          {
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
                  <span style={{ lineHeight: "normal", marginLeft: "12px" }}>{t("PREVIOUS")} {previousBotdOrders?.[0]?.hearingType ? t(previousBotdOrders?.[0]?.hearingType) : ""} {t("BOTD")}</span>
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
                {previousBotdOrders?.[0]?.businessOfTheDay ? <div>{previousBotdOrders?.[0]?.businessOfTheDay}</div> : t("NO_HEARING_SUMMARY_AVAILABLE")}
              </div>
            </Card>
          }
        </div>
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
          needRefresh={isBailBondTaskExists}
        />
      </div>
      {showNoticeProcessModal && (
        <div className="process-summary-container">
          <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none" }}>
            {
              <NoticeProcessModal
                showModal={false}
                filingNumber={filingNumber}
                currentHearingId={currentHearingId}
                caseDetails={caseDetails}
                ordersDataFromParent={ordersDataFromParent}
                hearingsDataFromParent={hearingsDataFromParent}
              />
            }
          </Card>
        </div>
      )}
      {showAllTranscript && (
        <ShowAllTranscriptModal setShowAllTranscript={setShowAllTranscript} botdOrderList={previousBotdOrders} judgeView={true} />
      )}
    </div>
  );
};

export default CaseOverviewV2;
