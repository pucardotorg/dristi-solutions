import { InfoBannerIcon } from "@egovernments/digit-ui-components";
import { CustomArrowDownIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import React, { useCallback, useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { checkIfDueDatePassed, getFormattedDate } from "../utils";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
// import { CustomArrowDownIcon, CustomArrowUpIcon } from "../icons/svgIndex";

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

function addParamToUrl(url, key, value) {
  const [baseUrl, queryString] = url.split("?");
  const params = new URLSearchParams(queryString);
  params.set(key, value);
  return `${baseUrl}?${params.toString()}`;
}

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
  isApplicationCompositeOrder = false,
  setShowCourierServiceModal,
  setCourierServicePendingTask,
}) {
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(isAccordionOpen);
  const [check, setCheck] = useState(false);
  const [showAllPendingTasksModal, setShowAllPendingTasksModal] = useState(false);
  const [showOfflineStampEnvelopeModal, setShowOfflineStampEnvelopeModal] = useState(false);

  const roles = useMemo(() => Digit.UserService.getUser()?.info?.roles?.map((role) => role?.code) || [], []);
  const isJudge = roles.includes("JUDGE_ROLE");

  const handleAccordionClick = () => {
    setIsOpen(!isOpen);
  };

  const redirectPendingTaskUrl = useCallback(
    async (url, isCustomFunction = () => {}, params = {}, isOpenInNewTab) => {
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
    },
    [history, check, setCheck]
  );
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

  const sortedPendingTasks = useMemo(() => {
    return [...pendingTasks].sort((a, b) => {
      const dateA = new Date(a?.stateSla);
      const dateB = new Date(b?.stateSla);

      const timeA = isNaN(dateA) ? Infinity : dateA.getTime();
      const timeB = isNaN(dateB) ? Infinity : dateB.getTime();

      return timeA - timeB;
    });
  }, [pendingTasks]);

  const pendingTasksTableView = useCallback(
    (modalView = false) => {
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 className="heading-m">{t("PENDING_ACTIONS")}</h1>
            {!modalView && (
              <span
                style={{ lineHeight: "normal", marginLeft: "12px", cursor: "pointer", fontWeight: "bold", color: "rgb(0, 126, 126)" }}
                onClick={() => setShowAllPendingTasksModal(true)}
              >
                {t("VIEW_ALL_PENDING_TASKS")}
              </span>
            )}
          </div>
          <div className="tasks-component-table" style={{ display: "flex", flexDirection: "column", marginLeft: "20px" }}>
            <div
              className="tasks-component-table-header"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #BBBBBD",
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
            <div
              className="tasks-component-table-body"
              style={{ ...(modalView ? { overflowY: "auto", maxHeight: "60vh" } : { overflowY: "hidden", maxHeight: "300px" }) }}
            >
              {sortedPendingTasks?.map((item) => {
                const isDueDatePassed = checkIfDueDatePassed(item?.stateSla);
                return (
                  <div
                    className="tasks-component-table-row"
                    key={`${item?.filingNumber}-${item?.referenceId}`}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #E8E8E8",
                      padding: "20px 20px 20px 15px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (modalView) {
                        setShowAllPendingTasksModal(false);
                      }
                      if (item?.bailBondId && item?.status === "PENDING_RAISE_BAIL_BOND") {
                        const updatedUrl = addParamToUrl(item?.redirectUrl, "bailBondId", item?.bailBondId);
                        redirectPendingTaskUrl(updatedUrl, item?.isCustomFunction, item?.params);
                        return;
                      }
                      if (item?.actionName === "PENDING_ENVELOPE_SUBMISSION") {
                        setShowOfflineStampEnvelopeModal(true);
                        return;
                      }
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
                          history.push(
                            `/${window.contextPath}/employee/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`,
                            {
                              triggerAdmitCase: true,
                            }
                          );
                        } else {
                          setResponsePendingTask(item);
                          setShowSubmitResponseModal(true);
                        }
                      } else if (item?.entityType === "task-management-payment" && item?.status === "PENDING_PAYMENT") {
                        setCourierServicePendingTask(item);
                        setShowCourierServiceModal(true);
                      } else redirectPendingTaskUrl(item?.redirectUrl, item?.isCustomFunction, item?.params);
                    }}
                  >
                    <div className="tasks-component-table-row-cell" style={{ width: "40%", color: "#0A0A0A" }}>
                      {t(item?.actionName)}
                    </div>
                    <div
                      className="tasks-component-table-row-cell"
                      style={{
                        ...(isDueDatePassed ? { color: "#D3302F", fontWeight: "bold" } : { color: "rgb(61, 60, 60)" }),
                        width: "30%",
                      }}
                    >
                      {item?.stateSla ? getFormattedDate(item?.stateSla) : t("NO_DUE_DATE")}
                    </div>
                    <div className="tasks-component-table-row-cell" style={{ width: "30%", color: "#3D3C3C" }}>
                      {item?.createdTime ? getFormattedDate(item?.createdTime) : t("NO_DATE_AVAILABLE")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    },
    [
      history,
      isJudge,
      redirectPendingTaskUrl,
      setPendingTaskActionModals,
      setResponsePendingTask,
      setShowCourierServiceModal,
      t,
      sortedPendingTasks,
      setShowSubmitResponseModal,
      setCourierServicePendingTask,
    ]
  );

  const orderPageTaskView = useCallback(() => {
    return (
      <div className="order-task-container">
        {pendingTasks?.map((task, idx) => {
          return (
            <div key={idx} className="order-task-row">
              <div className="order-task-title">
                <span>{`${t("PENDING")} - ${t(task?.actionName)}`}</span>
              </div>
              <div className="order-task-actions">
                <button
                  className="btn-view"
                  onClick={() => {
                    const params = {
                      ...task?.params,
                      isView: true,
                    };
                    redirectPendingTaskUrl(task?.redirectUrl, task?.isCustomFunction, params);
                  }}
                >
                  {t("VIEW")}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => {
                    const params = {
                      ...task?.params,
                      isApplicationAccepted: false,
                    };
                    redirectPendingTaskUrl(task?.redirectUrl, task?.isCustomFunction, params);
                  }}
                >
                  {t("REJECT")}
                </button>
                <button
                  className="btn-accept"
                  onClick={() => {
                    const params = {
                      ...task?.params,
                      isApplicationAccepted: true,
                    };
                    redirectPendingTaskUrl(task?.redirectUrl, task?.isCustomFunction, params);
                  }}
                >
                  {t("ACCEPT")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [pendingTasks, redirectPendingTaskUrl, t]);

  return (
    <React.Fragment>
      {isApplicationCompositeOrder ? (
        <React.Fragment>{orderPageTaskView()}</React.Fragment>
      ) : !tableView ? (
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
                    if (item?.bailBondId && item?.status === "PENDING_RAISE_BAIL_BOND") {
                      const updatedUrl = addParamToUrl(item?.redirectUrl, "bailBondId", item?.bailBondId);
                      redirectPendingTaskUrl(updatedUrl, item?.isCustomFunction, item?.params);
                      return;
                    }
                    if (item?.actionName === "PENDING_ENVELOPE_SUBMISSION") {
                      setShowOfflineStampEnvelopeModal(true);
                      return;
                    }
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
                        history.push(
                          `/${window.contextPath}/employee/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`,
                          {
                            triggerAdmitCase: true,
                          }
                        );
                      } else {
                        setResponsePendingTask(item);
                        setShowSubmitResponseModal(true);
                      }
                    } else if (item?.entityType === "task-management-payment" && item?.status === "PENDING_PAYMENT") {
                      setCourierServicePendingTask(item);
                      setShowCourierServiceModal(true);
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
        <React.Fragment>
          {pendingTasksTableView()}
          {showAllPendingTasksModal && (
            <Modal
              headerBarEnd={<CloseBtn onClick={() => setShowAllPendingTasksModal(false)} />}
              formId="modal-action"
              popupStyles={{ width: "70%", paddingBottom: "20px" }}
              headerBarMain={<Heading label={t("")} />}
              hideSubmit
            >
              {pendingTasksTableView(true)}
            </Modal>
          )}
        </React.Fragment>
      )}
      {showOfflineStampEnvelopeModal && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => setShowOfflineStampEnvelopeModal(false)} />}
          formId="modal-action"
          popupStyles={{ width: "40%" }}
          headerBarMain={<Heading label={t("")} />}
          actionSaveLabel={t("CS_CLOSE")}
          actionSaveOnSubmit={() => setShowOfflineStampEnvelopeModal(false)}
          className={"pending-envelope-submission-modal"}
        >
          <p style={{ marginBottom: "20px", marginTop: "20px" }}>{t("SUBMIT_STAMP_AND_ENVELOPE_IN_COURT")}</p>
        </Modal>
      )}
    </React.Fragment>
  );
}

export default PendingTaskAccordion;
