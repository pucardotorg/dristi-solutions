import React, { useMemo, useState, useEffect, useCallback } from "react";
import HomeHeader from "../../components/HomeHeader";
import { useTranslation } from "react-i18next";
import HomeSidebar from "../../components/HomeSidebar";
import { homeHearingsConfig } from "../../configs/HearingsConfig";
import { labelToConfigMapping } from "../../configs/MainHomeScreenConfig";
import { set } from "lodash";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const MainHomeScreen = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("HEARINGS_TAB");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [hearingCount, setHearingCount] = useState(0);
  const [config, setConfig] = useState({ ...homeHearingsConfig, additionalDetails: { setCount: setHearingCount } });
  const [registerCount, setRegisterCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);

  // Custom filter state
  const [filters, setFilters] = useState({
    date: "",
    status: "",
    purpose: "",
    caseQuery: "",
  });
  const [tableData, setTableData] = useState([]); // Data to render in table
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUpdateCounter((prev) => prev + 1);
  }, [config]);

  const modifiedConfig = useMemo(() => {
    return { ...config };
  }, [config]);
  const options = {
    REGISTRATION: {
      name: "Registrater Cases",
      count: registerCount,
      func: setRegisterCount,
    },
    REVIEW_PROCESS: {
      name: "Review Process",
      count: reviewCount,
      func: setReviewCount,
    },
    VIEW_APPLICATION: {
      name: "View Application",
      count: applicationCount,
      func: setApplicationCount,
    },
    SCHEDULE_HEARING: {
      name: "Schedule Hearing",
      count: scheduleCount,
      func: setScheduleCount,
    },
  };
  const handleTabChange = (title, label, func) => {
    let updatedConfig = labelToConfigMapping?.find((config) => config?.label === title)?.config;
    if (label) {
      setActiveTab(label);
      updatedConfig = {
        ...updatedConfig,
        apiDetails: {
          ...updatedConfig.apiDetails,
          requestBody: {
            ...updatedConfig.apiDetails.requestBody,
            moduleSearchCriteria: {
              ...updatedConfig.apiDetails.requestBody.moduleSearchCriteria,
              hearingType: "APPLICATION_REVIEW",
            },
          },
        },
        additionalDetails: {
          setCount: func,
        },
      };
    } else {
      setActiveTab(title);
      updatedConfig = { ...updatedConfig, additionalDetails: { setCount: setHearingCount } };
    }
    setConfig(updatedConfig);
  };

  // Handlers for filter/search/clear
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ date: "", status: "", purpose: "", caseQuery: "" });
    fetchData({});
  }, []);

  const handleSearch = useCallback(() => {
    fetchData(filters);
  }, [filters]);

  // Placeholder for API call
  const fetchData = useCallback(async (appliedFilters) => {
    setLoading(true);
    // TODO: Replace with actual API call
    // Simulate API call
    setTimeout(() => {
      // Example: setTableData(response.data)
      setTableData([
        {
          sno: 1,
          caseName: "Sanjeev New vs Hyf",
          caseNumber: "ST/92/2025",
          advocates: "KL-001695-2025-HR2",
          status: "Scheduled",
          purpose: "APPEARANCE",
        },
        {
          sno: 2,
          caseName: "GURU LIT vs DEV SANITY CHECK",
          caseNumber: "ST/93/2025",
          advocates: "KL-001645-2025-HR2",
          status: "Scheduled",
          purpose: "APPEARANCE",
        },
        {
          sno: 3,
          caseName: "WArHorse vs AccZZZ",
          caseNumber: "CMP/563/2025",
          advocates: "KL-001569-2025-HR2",
          status: "In Progress",
          purpose: "REGISTRATION",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // Memoized table rows
  const tableRows = useMemo(() => {
    return tableData.map((row) => (
      <tr key={row.sno}>
        <td>{row.sno}</td>
        <td style={{ color: "#1a0dab", cursor: "pointer" }}>{row.caseName}</td>
        <td>{row.caseNumber}</td>
        <td>{row.advocates}</td>
        <td>
          <span
            style={{
              background: row.status === "In Progress" ? "#fff4e5" : "#f5f5f5",
              color: row.status === "In Progress" ? "#9e400a" : "#333",
              padding: "2px 10px",
              borderRadius: 12,
              fontSize: 14,
            }}
          >
            {row.status}
          </span>
        </td>
        <td>{row.purpose}</td>
        <td>Actions</td>
      </tr>
    ));
  }, [tableData]);

  useEffect(() => {
    fetchData({}); // Initial load
  }, [fetchData]);

  return (
    <React.Fragment>
      <HomeHeader t={t} />
      <div
        className="main-home-screen orders-tab-inbox-wrapper"
        style={{ display: "flex", borderTop: "1px #e8e8e8 solid", width: "100vw", minHeight: ` calc(100vh - 251px) ` }}
      >
        <HomeSidebar
          t={t}
          onTabChange={handleTabChange}
          activeTab={activeTab}
          options={options}
          isOptionsLoading={false}
          hearingCount={hearingCount}
        />
        <div className="inbox-search-wrapper" style={{ width: "100%", padding: "20px 30px" }}>
          {/* Custom Filter/Search Bar */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleInputChange}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
            <select
              name="status"
              value={filters.status}
              onChange={handleInputChange}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            >
              <option value="">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Scheduled">Scheduled</option>
            </select>
            <select
              name="purpose"
              value={filters.purpose}
              onChange={handleInputChange}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            >
              <option value="">All Purposes</option>
              <option value="REGISTRATION">REGISTRATION</option>
              <option value="APPEARANCE">APPEARANCE</option>
            </select>
            <input
              type="text"
              name="caseQuery"
              placeholder="Case ID, Name, Advocate"
              value={filters.caseQuery}
              onChange={handleInputChange}
              style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4, minWidth: 200 }}
            />
            <button onClick={handleSearch} style={{ padding: "8px 16px", background: "#008080", color: "#fff", border: "none", borderRadius: 4 }}>
              Search
            </button>
            <button
              onClick={handleClear}
              style={{ padding: "8px 16px", background: "#f5f5f5", color: "#333", border: "1px solid #ccc", borderRadius: 4 }}
            >
              Clear
            </button>
          </div>
          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8e8e8" }}>
                <th>S.NO</th>
                <th>CASE_NAME</th>
                <th>Case Number</th>
                <th>ADVOCATES</th>
                <th>Status</th>
                <th>PURPOSE</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    Loading...
                  </td>
                </tr>
              ) : tableRows.length > 0 ? (
                tableRows
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </React.Fragment>
  );
};

export default MainHomeScreen;
