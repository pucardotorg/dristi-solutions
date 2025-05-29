import { InfoBannerIcon } from "@egovernments/digit-ui-components";
import { CustomArrowDownIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
// import { CustomArrowDownIcon, CustomArrowUpIcon } from "../icons/svgIndex";

function PendingTaskAccordion({
  pendingTasks,
  t,
  totalCount,
  accordionHeader = "COMPLETE_THIS_WEEK",
  accordionKey = "accordion",
  isHighlighted = false,
  isAccordionOpen = false,
  setShowSubmitResponseModal,
  setResponsePendingTask,
  setPendingTaskActionModals,
  tableView = false,
}) {
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(isAccordionOpen);
  const [check, setCheck] = useState(false);

  const roles = useMemo(() => Digit.UserService.getUser()?.info?.roles?.map((role) => role?.code) || [], []);
  const isJudge = roles.includes("JUDGE_ROLE");

  const handleAccordionClick = () => {
    setIsOpen(!isOpen);
  };

  const redirectPendingTaskUrl = async (url, isCustomFunction = () => {}, params = {}, isOpenInNewTab) => {
    if (isCustomFunction) {
      await url({ ...params, isOpenInNewTab });
    } else {
      history.push(url, {
        state: {
          params: params,
        },
      });
      setCheck(!check);
    }
  };

  const formatDate = (dateInMS) => {
    try {
      const milliseconds = parseInt(dateInMS?.split("-")[1]);
      const date = new Date(milliseconds);
      const options = { month: "short", day: "numeric" };
      return date.toLocaleDateString("en-GB", options);
    } catch (error) {
      return "";
    }
  };

  const getNextFormatDate = (dateInMS) => {
    try {
      const milliseconds = parseInt(dateInMS?.split("-")[1]);
      const date = new Date(milliseconds);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const options = { year: "numeric", month: "short", day: "numeric" };
      return nextDate.toLocaleDateString("en-GB", options);
    } catch (error) {
      return "";
    }
  };

  return !tableView ? (
    <div
      key={`${accordionKey}-${pendingTasks?.map((task) => task.filingNumber).join(",")}`}
      className="accordion-wrapper"
      style={{ border: "1px solid #E8E8E8", padding: 16, borderRadius: 4 }}
    >
      <div
        className={`accordion-title ${isOpen ? "open" : ""}`}
        style={{ cursor: "default", marginBottom: isOpen && totalCount ? 16 : 0, transition: "margin-bottom 0.25s" }}
        onClick={handleAccordionClick}
      >
        <span
          style={{
            color: isHighlighted ? "#9E400A" : "black",
            fontFamily: "Roboto",
            fontSize: "16px",
            fontWeight: "700",
            lineHeight: "18.75px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          className="accordion-header"
        >
          {isHighlighted && (
            <span>
              <InfoBannerIcon fill="#9E400A" />
            </span>
          )}
          <span>{`${t(accordionHeader)}${totalCount ? ` (${totalCount})` : ""}`}</span>
        </span>
        <div
          className="icon"
          style={{
            marginRight: 4,
          }}
        >
          <span className="reverse-arrow" style={{ cursor: "pointer" }} onClick={handleAccordionClick}>
            <CustomArrowDownIcon />
          </span>
        </div>
      </div>
      <div className={`accordion-item ${!isOpen ? "collapsed" : ""}`}>
        <div
          className={`accordion-item ${!isOpen ? "collapsed" : ""}`}
          style={{ overflowY: "auto", maxHeight: "40vh", paddingRight: "8px", "&::WebkitScrollbar": { width: 0 } }}
        >
          {pendingTasks?.map((item) => (
            <div
              className={`task-item ${item?.due === "Due today" && "due-today"}`}
              key={`${item?.filingNumber}-${item?.referenceId}`}
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (item?.actionName === "Pay Vakalatnama Fees") {
                  setPendingTaskActionModals((pendingTaskActionModals) => ({
                    ...pendingTaskActionModals,
                    joinCasePaymentModal: true,
                    data: {
                      filingNumber: item?.filingNumber,
                      taskNumber: item?.referenceId,
                    },
                  }));
                  return;
                }
                if (item?.actionName === "Review Advocate Replace Request") {
                  setPendingTaskActionModals((pendingTaskActionModals) => ({
                    ...pendingTaskActionModals,
                    joinCaseConfirmModal: true,
                    data: {
                      filingNumber: item?.filingNumber,
                      taskNumber: item?.referenceId,
                    },
                  }));
                  return;
                }
                if (item?.status === "PENDING_SIGN" && item?.screenType === "Adiary") {
                  history.push(`/${window.contextPath}/employee/home/dashboard/adiary?date=${item?.params?.referenceId}`);
                } else if (item?.status === "PROFILE_EDIT_REQUEST") {
                  const caseId = item?.params?.caseId;
                  const referenceId = item?.referenceId;
                  const dateOfApplication = item?.params?.dateOfApplication;
                  const uniqueId = item?.params?.uniqueId;

                  history.push(
                    `/${window.contextPath}/employee/dristi/home/view-case/review-litigant-details?caseId=${caseId}&referenceId=${referenceId}`,
                    {
                      dateOfApplication,
                      uniqueId,
                    }
                  );
                } else if (item?.status === "PENDING_RESPONSE") {
                  if (isJudge) {
                    const caseId = item?.params?.caseId;
                    const filingNumber = item?.params?.filingNumber;
                    history.push(`/${window.contextPath}/employee/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`, {
                      triggerAdmitCase: true,
                    });
                  } else {
                    setResponsePendingTask(item);
                    setShowSubmitResponseModal(true);
                  }
                } else redirectPendingTaskUrl(item?.redirectUrl, item?.isCustomFunction, item?.params);
              }}
            >
              <input type="checkbox" value={check} />
              {item?.screenType === "Adiary" && item?.status === "PENDING_SIGN" ? (
                <div className="task-details" style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 8 }}>
                  <span className="task-title">
                    {item?.actionName} {formatDate(item?.params?.referenceId)}
                  </span>
                  <span className="task-info">
                    {t("ADIARY_DUE_ON")} {getNextFormatDate(item?.params?.referenceId)}{" "}
                  </span>
                </div>
              ) : (
                <div className="task-details" style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 8 }}>
                  <span className="task-title">
                    {t(item?.actionName)} : {item?.caseTitle}
                  </span>
                  <span className="task-info">
                    {item?.caseType} - {item?.filingNumber} -{" "}
                    <span style={{ ...(item?.dueDateColor && { color: item?.dueDateColor }) }}>{item?.due}</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="tasks-component-table" style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: "20px" }}>
      <div
        className="tasks-component-table-header"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #BBBBBD",
          padding: "10px 20px 10PX 15PX",
        }}
      >
        <div className="tasks-component-table-header-row-cell" style={{ width: "40%", color: "#0B0C0C", fontWeight: "bold" }}>
          {t("TASK")}
        </div>
        <div className="tasks-component-table-header-row-cell" style={{ width: "30%", color: "#0B0C0C", fontWeight: "bold" }}>
          {t("DUE_DATE")}
        </div>
        <div className="tasks-component-table-header-row-cell" style={{ width: "30%", color: "#0B0C0C", fontWeight: "bold" }}>
          {t("CREATED_ON")}
        </div>
      </div>
      <div className="tasks-component-table-body" style={{ overflowY: "auto", maxHeight: "200px" }}>
        {pendingTasks?.map((item) => (
          <div
            className="tasks-component-table-row"
            key={`${item?.filingNumber}-${item?.referenceId}`}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #E8E8E8",
              padding: "10px 20px 10PX 15PX",
              cursor: "pointer",
            }}
            onClick={() => {
              if (item?.actionName === "Pay Vakalatnama Fees") {
                setPendingTaskActionModals((pendingTaskActionModals) => ({
                  ...pendingTaskActionModals,
                  joinCasePaymentModal: true,
                  data: {
                    filingNumber: item?.filingNumber,
                    taskNumber: item?.referenceId,
                  },
                }));
                return;
              }
              if (item?.actionName === "Review Advocate Replace Request") {
                setPendingTaskActionModals((pendingTaskActionModals) => ({
                  ...pendingTaskActionModals,
                  joinCaseConfirmModal: true,
                  data: {
                    filingNumber: item?.filingNumber,
                    taskNumber: item?.referenceId,
                  },
                }));
                return;
              }
              if (item?.status === "PENDING_SIGN" && item?.screenType === "Adiary") {
                history.push(`/${window.contextPath}/employee/home/dashboard/adiary?date=${item?.params?.referenceId}`);
              } else if (item?.status === "PROFILE_EDIT_REQUEST") {
                const caseId = item?.params?.caseId;
                const referenceId = item?.referenceId;
                const dateOfApplication = item?.params?.dateOfApplication;
                const uniqueId = item?.params?.uniqueId;

                history.push(
                  `/${window.contextPath}/employee/dristi/home/view-case/review-litigant-details?caseId=${caseId}&referenceId=${referenceId}`,
                  {
                    dateOfApplication,
                    uniqueId,
                  }
                );
              } else if (item?.status === "PENDING_RESPONSE") {
                if (isJudge) {
                  const caseId = item?.params?.caseId;
                  const filingNumber = item?.params?.filingNumber;
                  history.push(`/${window.contextPath}/employee/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`, {
                    triggerAdmitCase: true,
                  });
                } else {
                  setResponsePendingTask(item);
                  setShowSubmitResponseModal(true);
                }
              } else redirectPendingTaskUrl(item?.redirectUrl, item?.isCustomFunction, item?.params);
            }}
          >
            <div className="tasks-component-table-row-cell" style={{ width: "40%" }}>
              {item?.actionName}
            </div>
            <div className="tasks-component-table-row-cell" style={{ width: "30%" }}>
              {item?.due}
            </div>
            <div className="tasks-component-table-row-cell" style={{ width: "30%" }}>
              {item?.createdOn}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingTaskAccordion;
