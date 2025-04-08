import { Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";
import TasksComponent from "../../components/TaskComponent";
import { BreadCrumb } from "@egovernments/digit-ui-react-components";
import { MailBoxIcon, CaseDynamicsIcon, ThreeUserIcon, DownloadIcon, ExpandIcon, CollapseIcon, FilterIcon, DocumentIcon } from "../../../homeIcon";
import CustomDateRangePicker from "../../components/CustomDateRangePicker";

const DashboardPage = () => {
  const { t } = useTranslation();
  const { select } = Digit.Hooks.useQueryParams();
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const history = useHistory();
  const [stepper, setStepper] = useState(Number(select) || 0);
  const [selectedRange, setSelectedRange] = useState({ startDate: getCurrentDate(), endDate: getCurrentDate() });
  const [downloadingIndices, setDownloadingIndices] = useState([]);
  const [downloadTimers, setDownloadTimers] = useState({});
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const userInfo = Digit?.UserService?.getUser()?.info;
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const userRoles = Digit?.UserService?.getUser?.()?.info?.roles || [];
  const [taskType, setTaskType] = useState({});
  const [jobId, setJobID] = useState("");
  const [headingTxt, setHeadingTxt] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const autoLogin = useCallback(() => {
    debugger;
    console.log(stepper, "checking ", isLoggedIn);

    if (isLoggedIn || stepper !== 1) return;
    const iframe = document.querySelector("iframe");
    if (iframe && iframe.contentDocument) {
      const usernameField = iframe.contentDocument.querySelector(".euiFieldText");
      const passwordField = iframe.contentDocument.querySelector(".euiFieldPassword");
      const submitButton = iframe.contentDocument.querySelector(".euiButton");

      if (usernameField && passwordField && submitButton) {
        usernameField.value = "anonymous";
        passwordField.value = "Beehyv@123";
        submitButton.click();

        setTimeout(() => {
          const success = document.querySelector(".your-login-success-indicator");
          setIsLoggedIn(Boolean(success));
        }, 1000);
      } else {
        console.log("already logged in", usernameField, passwordField, submitButton);

        setIsLoggedIn(true);
      }
    } else {
      console.log(iframe, "iframe is null");
    }
  }, [isLoggedIn, stepper]);

  useEffect(() => {
    autoLogin();
  }, [autoLogin]);

  useEffect(() => {
    setStepper(Number(select));
  }, [select]);

  const handleSubmit = () => {
    setSelectedRange({
      startDate: new Date(dateRange[0].startDate).toISOString().split("T")[0],
      endDate: new Date(dateRange[0].endDate).toISOString().split("T")[0],
    });
  };

  const toggleNavbar = () => {
    setNavbarCollapsed(!navbarCollapsed);
  };

  const baseUrl = window.location.origin;

  const handleClick = () => {
    history.push(`/${window?.contextPath}/${userInfoType}/home/dashboard/adiary`);
  };

  const { data: kibanaData, isLoading: isDashboardJobIDsLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "kibana",
    [{ name: "dashboards" }, { name: "reports" }],
    {
      select: (data) => {
        return data?.kibana || [];
      },
    }
  );
  const sortedDashboardJobIDs = Array.isArray(kibanaData?.dashboards) ? [...kibanaData?.dashboards].sort((a, b) => a.id - b.id) : [];
  const sortedReports = Array.isArray(kibanaData?.reports) ? [...kibanaData?.reports].sort((a, b) => a.id - b.id) : [];
  const handleDownload = async (downloadLink, index) => {
    setDownloadingIndices((prev) => [...prev, index]);
    setDownloadTimers((prev) => ({ ...prev, [index]: 0 }));

    const credentials = btoa(`${"anonymous"}:${"Beehyv@123"}`);
    const config = {
      headers: {
        "kbn-xsrf": "",
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    };

    const pollInterval = 10000;
    const maxWaitTime = 3 * 60 * 1000;
    const maxAttempts = maxWaitTime / pollInterval;

    let attemptCount = 0;
    let pollTimer;
    let timer;

    try {
      const response = await axios.post(downloadLink, null, config);

      if (!response.data?.path) {
        showToast("error", t("ERR_REPORT_PATH"), 50000);
        console.error("Report path not found in the response");
        setDownloadingIndices((prev) => prev.filter((i) => i !== index));
        setDownloadTimers((prev) => {
          const newTimers = { ...prev };
          delete newTimers[index];
          return newTimers;
        });
        return;
      }

      const reportUrl = `${baseUrl}${response.data.path}`;

      timer = setInterval(() => {
        setDownloadTimers((prev) => {
          const newTime = (prev[index] || 0) + 1;
          return { ...prev, [index]: newTime };
        });
      }, 1000);

      const tryDownload = async () => {
        try {
          const csvResponse = await axios.get(reportUrl, {
            ...config,
            responseType: "blob",
          });

          if (csvResponse.status === 200 && csvResponse.data.size > 0) {
            clearInterval(pollTimer);
            clearInterval(timer);

            const blob = new Blob([csvResponse.data], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `${t(sortedReports[index]["code"])}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            setDownloadingIndices((prev) => prev.filter((i) => i !== index));
            setDownloadTimers((prev) => {
              const newTimers = { ...prev };
              delete newTimers[index];
              return newTimers;
            });
          }
        } catch (err) {
          attemptCount++;
          if (attemptCount >= maxAttempts) {
            clearInterval(pollTimer);
            clearInterval(timer);

            showToast("error", t("ERR_REPORT_TIMEOUT"), 50000);
            console.error("Report not ready after max attempts");

            setDownloadingIndices((prev) => prev.filter((i) => i !== index));
            setDownloadTimers((prev) => {
              const newTimers = { ...prev };
              delete newTimers[index];
              return newTimers;
            });
          } else {
            console.log(`Attempt ${attemptCount}: Report not ready yet.`);
          }
        }
      };

      pollTimer = setInterval(tryDownload, pollInterval);
    } catch (error) {
      showToast("error", t("ERR_REPORT_DOWNLOAD"), 50000);
      console.error("Error generating or downloading report:", error);
      setDownloadingIndices((prev) => prev.filter((i) => i !== index));
      setDownloadTimers((prev) => {
        const newTimers = { ...prev };
        delete newTimers[index];
        return newTimers;
      });
    }
  };

  const DashboardBreadCrumb = ({ location }) => {
    const { t } = useTranslation();
    const userInfo = window?.Digit?.UserService?.getUser()?.info;
    const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);

    const crumbs = [
      {
        path: `/${window?.contextPath}/${userType}/home/home-pending-task`,
        content: t("ES_COMMON_HOME"),
        show: true,
      },
      {
        path: `/${window?.contextPath}/${userType}`,
        content: t(location.pathname.split("/").pop()),
        show: true,
        isLast: true,
      },
    ];
    const bredCrumbStyle = { maxWidth: "min-content" };

    return <BreadCrumb crumbs={crumbs} spanStyle={bredCrumbStyle} />;
  };

  const getIcon = (key, stroke = null) => {
    switch (key) {
      case "CASE_DS":
        return <CaseDynamicsIcon className="icon" stroke={stroke} />;
      case "HEARINGS_DS":
        return <ThreeUserIcon className="icon" stroke={stroke} />;
      default:
        return <MailBoxIcon className="icon" stroke={stroke} />;
    }
  };

  return (
    <div className="dashboard">
      <React.Fragment>
        <DashboardBreadCrumb location={window.location} />
      </React.Fragment>

      <div className="dashboard-container">
        <div className={`dashboardSidebar ${navbarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-nav">
            <React.Fragment>
              {Array.isArray(sortedDashboardJobIDs) &&
                sortedDashboardJobIDs.map((data) => {
                  const isActive = stepper === 1 && jobId === data.jobId;
                  return (
                    <button
                      className={`dashboard-btn ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setStepper(1);
                        setHeadingTxt(data.code + "_HEADING");
                        setJobID(data.jobId);
                      }}
                    >
                      {getIcon(data.code, isActive ? "#007E7E" : "#77787B")} {!navbarCollapsed && t(data.code)}
                    </button>
                  );
                })}
              <button
                className={`dashboard-btn ${stepper === 2 ? "active" : ""}`}
                onClick={() => {
                  setStepper(2);
                  setHeadingTxt("AVAILABLE_REPORTS");
                }}
              >
                <DocumentIcon className="icon" stroke={stepper === 2 ? "#007E7E" : "#3D3C3C"} /> {!navbarCollapsed && t("DASHBOARD_REPORTS")}
              </button>
            </React.Fragment>
          </div>
          <div className={`sidebar-toggle  ${navbarCollapsed ? "collapsed" : ""}`} onClick={toggleNavbar}>
            {navbarCollapsed ? (
              <ExpandIcon />
            ) : (
              <React.Fragment>
                <span> {t("NAVBAR_TEXT")}</span> <CollapseIcon />{" "}
              </React.Fragment>
            )}
          </div>
        </div>

        <div className={`main-content ${navbarCollapsed ? "collapsed" : ""}`}>
          {!isNaN(stepper) && headingTxt?.trim() && (
            <div className="dashboardTopbar">
              <h2 style={{ fontWeight: "bold", margin: "10px" }}>{t(headingTxt)}</h2>
            </div>
          )}

          <div className="dashboard-content">
            {stepper === 1 && (
              <div className="date-filter">
                <CustomDateRangePicker setDateRange={setDateRange} dateRange={dateRange} showPicker={showPicker} setShowPicker={setShowPicker} />
                <button onClick={handleSubmit} className="filter-button">
                  <FilterIcon /> {t("ADD_FILTER")}
                </button>
              </div>
            )}
            <div className="content-area">
              {stepper === 1 && (
                <iframe
                  src={`${baseUrl}/kibana/app/dashboards#/view/${jobId}?embed=true&_g=(refreshInterval:(pause:!t,value:60000),time:(from:'${selectedRange.startDate}',to:'${selectedRange.endDate}'))&_a=()&hide-filter-bar=true`}
                  height="600"
                  width="100%"
                  title="case"
                ></iframe>
              )}{" "}
              {stepper === 2 && (
                <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 4 }}>
                    <div className="download-report" onClick={handleClick}>
                      <span>{t("A_DIARY_REGISTER")}</span>
                    </div>
                    {sortedReports.map((option, index) => (
                      <div key={index} className="download-report">
                        <span>{option.code}</span>
                        <button
                          onClick={() => handleDownload(option?.url, index)}
                          disabled={downloadingIndices.includes(index)}
                          style={{ display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          {downloadingIndices.includes(index) ? (
                            <div style={{ display: "flex" }}>
                              {t("REPORT_DOWNLOAD_TXT")} {downloadTimers[index]}s
                            </div>
                          ) : (
                            <DownloadIcon />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* <div style={{ flex: 2 }}>
                    <TasksComponent
                      taskType={taskType}
                      setTaskType={setTaskType}
                      isLitigant={userRoles.includes("CITIZEN")}
                      uuid={userInfo?.uuid}
                      userInfoType={userInfoType}
                      hideFilters={true}
                      isDiary={true}
                    />
                  </div> */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {toastMsg && (
        <Toast
          error={toastMsg.key === "error"}
          label={t(toastMsg.action)}
          onClose={() => setToastMsg(null)}
          isDleteBtn={true}
          style={{ maxWidth: "500px" }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
