import { Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useTranslation } from "react-i18next";
import { BreadCrumb } from "@egovernments/digit-ui-react-components";
import { MailBoxIcon, CaseDynamicsIcon, ThreeUserIcon, DownloadIcon, ExpandIcon, CollapseIcon, FilterIcon, DocumentIcon } from "../../../homeIcon";

const METABASE_URL = "https://oncourts.kerala.gov.in/pucar-dashboard/public/dashboard/981a30b4-c33a-4f11-96a6-1242d95717e2";

const DashboardPage = () => {
  const { t } = useTranslation();
  const { select } = Digit.Hooks.useQueryParams();
  const history = useHistory();
  const [stepper, setStepper] = useState(Number(select) || 0);
  const [downloadingIndices, setDownloadingIndices] = useState([]);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const [jobId, setJobID] = useState("");
  const [headingTxt, setHeadingTxt] = useState("");
  const [metabaseUrl, setMetabaseUrl] = useState(METABASE_URL);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  const autoLogin = useCallback(() => {
    const iframe = document.querySelector("iframe");
    setTimeout(() => {
      try {
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        const usernameField = iframeDoc?.querySelector(".euiFieldText");
        const passwordField = iframeDoc?.querySelector(".euiFieldPassword");
        const submitButton = iframeDoc?.querySelector(".euiButton");

        if (usernameField && passwordField && submitButton) {
          usernameField.value = process.env.REACT_APP_KIBANA_USERNAME;
          passwordField.value = process.env.REACT_APP_KIBANA_PASSWORD;
          usernameField.dispatchEvent(new Event("input", { bubbles: true }));
          usernameField.dispatchEvent(new Event("change", { bubbles: true }));
          passwordField.dispatchEvent(new Event("input", { bubbles: true }));
          passwordField.dispatchEvent(new Event("change", { bubbles: true }));
          submitButton.click();
        }
      } catch (err) {
        console.error("Login failed due to cross-origin access issue", err);
      }
    }, 1000); // 1 second delay
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 30;
    const interval = setInterval(() => {
      retryCount++;
      const iframe = document.querySelector("iframe");
      if (iframe) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

          // Inject custom styles
          const style = iframeDoc.createElement("style");
          style.textContent = ".embPanel__optionsMenuButton { display: none !important; }";
          iframeDoc.head.appendChild(style);

          // Perform auto-login if needed
          if (stepper === 1) {
            const passwordField = iframeDoc.querySelector(".euiFieldPassword");
            if (passwordField) {
              autoLogin();
            }
          }

          clearInterval(interval);
        } catch (err) {
          console.warn("Cross-origin issue or iframe still not loaded");
        }
      }

      if (retryCount >= maxRetries) {
        clearInterval(interval);
        console.warn("Iframe not ready within 30 seconds");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stepper, autoLogin]);

  useEffect(() => {
    setStepper(Number(select));
    if (Number(select) === 2) {
      setHeadingTxt("AVAILABLE_REPORTS");
    }
  }, [select]);

  const toggleNavbar = () => {
    setNavbarCollapsed(!navbarCollapsed);
  };

  const baseUrl = window.location.origin;

  const handleClick = () => {
    history.push(`/${window?.contextPath}/employee/home/home-screen`, { homeActiveTab: "CS_HOME_A_DAIRY" });
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
  const sortedDashboards = useMemo(() => (Array.isArray(kibanaData?.dashboards) ? [...kibanaData?.dashboards].sort((a, b) => a.id - b.id) : []), [
    kibanaData?.dashboards,
  ]);
  const sortedReports = Array.isArray(kibanaData?.reports) ? [...kibanaData?.reports].sort((a, b) => a.id - b.id) : [];
  useEffect(() => {
    if (isNaN(stepper) && Array.isArray(sortedDashboards) && sortedDashboards.length > 0) {
      const data = sortedDashboards[0];
      setStepper(1);
      setHeadingTxt(data.code + "_HEADING");
      setJobID(data.jobId);
    }
  }, [sortedDashboards, stepper]);
  const handleDownload = async (downloadLink, index) => {
    setDownloadingIndices((prev) => [...prev, index]);
    const username = process.env.REACT_APP_KIBANA_USERNAME || "anonymous";
    const password = process.env.REACT_APP_KIBANA_PASSWORD || "Beehyv@123";
    const credentials = btoa(`${username}:${password}`);
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
      const response = await axiosInstance.post(downloadLink, null, config);
      if (!response.data?.path) {
        showToast("error", t("ERR_REPORT_PATH"), 50000);
        console.error("Report path not found in the response");
        setDownloadingIndices((prev) => prev.filter((i) => i !== index));
        return;
      }
      const reportUrl = `${baseUrl}${response.data.path}`;
      const tryDownload = async () => {
        try {
          const csvResponse = await axiosInstance.get(reportUrl, {
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
          }
        } catch (err) {
          attemptCount++;
          if (attemptCount >= maxAttempts) {
            clearInterval(pollTimer);
            clearInterval(timer);

            showToast("error", t("ERR_REPORT_TIMEOUT"), 50000);
            console.error("Report not ready after max attempts");

            setDownloadingIndices((prev) => prev.filter((i) => i !== index));
          }
        }
      };

      pollTimer = setInterval(tryDownload, pollInterval);
    } catch (error) {
      showToast("error", t("ERR_REPORT_DOWNLOAD"), 50000);
      console.error("Error generating or downloading report:", error);
      setDownloadingIndices((prev) => prev.filter((i) => i !== index));
    }
  };

  const DashboardBreadCrumb = ({ location }) => {
    const { t } = useTranslation();
    const userInfo = window?.Digit?.UserService?.getUser()?.info;
    const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
    const roles = useMemo(() => userInfo?.roles, [userInfo]);
    const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

    let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
    if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
    const crumbs = [
      {
        path: homePath,
        content: t("ES_COMMON_HOME"),
        show: true,
      },
      {
        path: `/${window?.contextPath}/${userType}`,
        content: t("ES_DASHBOARD"),
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

  const customStyles = `
  .content-area{
   .embPanel__optionsMenuButton {
    display:none !important;
  }
`;

  return (
    <div className="dashboard">
      <React.Fragment>
        <DashboardBreadCrumb location={window.location} />
      </React.Fragment>

      <div className="dashboard-container">
        <div className={`dashboardSidebar ${navbarCollapsed ? "collapsed" : ""}`}>
          <div className="sidebar-nav">
            <React.Fragment>
              {Array.isArray(sortedDashboards) &&
                sortedDashboards.map((data) => {
                  const isActive = stepper === 1 && jobId === data.jobId;
                  return (
                    <button
                      className={`dashboard-btn ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setStepper(1);
                        setHeadingTxt(data.code + "_HEADING");
                        setMetabaseUrl(data.code === "HEARINGS_DS" ? `${METABASE_URL}?tab=122-hearings-progress` : METABASE_URL);
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
          {headingTxt === "AVAILABLE_REPORTS" && !isNaN(stepper) && headingTxt?.trim() && (
            <div className="dashboardTopbar">
              <h2 style={{ fontWeight: "bold", margin: "10px" }}>{t(headingTxt)}</h2>
            </div>
          )}

          <div className="dashboard-content">
            <div className="content-area">
              <style>{customStyles}</style>
              {stepper === 1 && <iframe src={metabaseUrl} height="700" width="100%"></iframe>}{" "}
              {stepper === 2 && (
                <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 4 }}>
                    <div className="download-report" onClick={handleClick}>
                      <span>{t("A_DIARY_REGISTER")}</span>
                    </div>
                    {sortedReports.map((option, index) => (
                      <div
                        key={index}
                        className="download-report"
                        onClick={() => {
                          !downloadingIndices.includes(index) && handleDownload(`${baseUrl}/${option?.url}`, index);
                        }}
                      >
                        <span>{option.code}</span>
                        <button disabled={downloadingIndices.includes(index)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          {downloadingIndices.includes(index) ? <Loader /> : <DownloadIcon />}
                        </button>
                      </div>
                    ))}
                  </div>
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
