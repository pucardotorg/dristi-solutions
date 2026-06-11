import { Card, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
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
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [taskType, setTaskType] = useState({});
  const [showAllTranscript, setShowAllTranscript] = useState(false);
  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);

  const NoticeProcessModalComponent = useMemo(() => Digit.ComponentRegistryService.getComponent("NoticeProcessModal"), []);

  const { data: botdOrdersRes, isLoading: isBotdOrdersLoading } = useGetBotdOrders(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber)
  );

  const previousBotdOrders = botdOrdersRes?.botdOrderList?.sort((order1, order2) => order2.createdDate - order1.createdDate);

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
          {isBotdOrdersLoading ? (
            <Loader />
          ) : (
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
                  <span style={{ lineHeight: "normal", marginLeft: "12px" }}>
                    {t("PREVIOUS")} {previousBotdOrders?.[0]?.hearingType ? t(previousBotdOrders?.[0]?.hearingType) : ""} {t("BOTD")}
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    color: "#007E7E",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "16px",
                    lineHeight: "18.75px",
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                  }}
                  onClick={() => setShowAllTranscript(true)}
                >
                  {t("VIEW_ALL_SUMMARIES")}
                </button>
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
                {previousBotdOrders?.[0]?.businessOfTheDay ? (
                  <div>{previousBotdOrders?.[0]?.businessOfTheDay}</div>
                ) : (
                  t("NO_HEARING_SUMMARY_AVAILABLE")
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
      <div className="pending-actions-container">
        <TasksComponent
          taskType={taskType}
          setTaskType={setTaskType}
          userInfoType={userInfoType}
          filingNumber={filingNumber}
          inCase={true}
          tableView={true}
          needRefresh={isBailBondTaskExists}
        />
      </div>
      {showNoticeProcessModal && NoticeProcessModalComponent && (
        <div className="process-summary-container">
          <Card style={{ border: "solid 1px #E8E8E8", boxShadow: "none", webkitBoxShadow: "none" }}>
            <NoticeProcessModalComponent
              showModal={false}
              filingNumber={filingNumber}
              currentHearingId={currentHearingId}
              caseDetails={caseDetails}
              ordersDataFromParent={ordersDataFromParent}
              hearingsDataFromParent={hearingsDataFromParent}
            />
          </Card>
        </div>
      )}
      {showAllTranscript && (
        <ShowAllTranscriptModal setShowAllTranscript={setShowAllTranscript} botdOrderList={previousBotdOrders} judgeView={true} />
      )}
    </div>
  );
};

CaseOverviewV2.propTypes = {
  caseData: PropTypes.shape({}).isRequired,
  filingNumber: PropTypes.string.isRequired,
  currentHearingId: PropTypes.string,
  caseDetails: PropTypes.object,
  showNoticeProcessModal: PropTypes.bool,
  isBailBondTaskExists: PropTypes.bool,
  ordersDataFromParent: PropTypes.object,
  hearingsDataFromParent: PropTypes.object,
};

export default CaseOverviewV2;
