import React, { useEffect, useState } from "react";

/* ---------- STYLES ---------- */

const styles = {
  panel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45vh",
    background: "#0f172a",
    color: "#e5e7eb",
    fontFamily: "monospace",
    fontSize: 12,
    borderTop: "1px solid #334155",
    zIndex: 2147483647,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "6px 10px",
    background: "#020617",
    borderBottom: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabs: {
    display: "flex",
    gap: 12,
    marginBottom: 6,
  },
  tab: function (active) {
    return {
      cursor: "pointer",
      padding: "4px 6px",
      borderBottom: active ? "2px solid #38bdf8" : "2px solid transparent",
      color: active ? "#38bdf8" : "#94a3b8",
    };
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  list: {
    width: "40%",
    borderRight: "1px solid #334155",
    overflowY: "auto",
  },
  details: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
  },
  row: {
    padding: "6px 10px",
    cursor: "pointer",
    borderBottom: "1px solid #1e293b",
  },
  badge: function (status) {
    return { color: status >= 400 ? "#f87171" : "#4ade80" };
  },
};

/* ---------- TABLE HELPER ---------- */

function Table({ columns, data }) {
  if (!data || data.length === 0) {
    return React.createElement("div", null, "No data available");
  }

  return React.createElement(
    "div",
    {
      style: {
        maxHeight: "400px",
        overflowY: "auto",
        border: "1px solid #e2e8f0",
        borderRadius: "4px",
      },
    },
    React.createElement(
      "table",
      { style: { width: "100%", borderCollapse: "collapse" } },
      React.createElement(
        "thead",
        { style: { position: "sticky", top: 0, background: "lightGrey", zIndex: 1 } },
        React.createElement(
          "tr",
          null,
          columns.map(function (col) {
            return React.createElement(
              "th",
              { key: col, style: { padding: "8px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "black" } },
              col
            );
          })
        )
      ),
      React.createElement(
        "tbody",
        null,
        data.map(function (row, i) {
          return React.createElement(
            "tr",
            { key: i, style: {} },
            columns.map(function (col) {
              return React.createElement(
                "td",
                { key: col, style: { padding: "8px", borderBottom: "0.5px solid rgba(226, 232, 240, 0.2)" } },
                row[col] !== undefined ? row[col] : "-"
              );
            })
          );
        })
      )
    )
  );
}

/* ---------- MAIN COMPONENT ---------- */

function ApiMonitorPanel() {
  // Initialize state from localStorage for persistence across refreshes
  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem("apiMonitorPanelOpen");
    return savedState === "true";
  });
  const [tab, setTab] = useState("stats");
  const [statsTab, setStatsTab] = useState("overview");
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);

  // Save panel state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("apiMonitorPanelOpen", open.toString());
  }, [open]);

  useEffect(
    function () {
      if (!open) return;

      const interval = setInterval(function () {
        if (!window.apiMonitor) return;

        if (tab === "calls") setCalls(window.apiMonitor.getAllCalls());
        if (tab === "stats") setStats(window.apiMonitor.getStats());
      }, 1000);

      return function () {
        clearInterval(interval);
      };
    },
    [open, tab]
  );

  if (!open) {
    return React.createElement(
      "button",
      {
        onClick: function () {
          setOpen(true);
        },
        style: {
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 2147483647,
          padding: "8px 12px",
          background: "#020617",
          color: "#38bdf8",
          border: "1px solid #334155",
          borderRadius: 6,
          cursor: "pointer",
        },
      },
      "API"
    );
  } else {
    return React.createElement(
      "div",
      { style: styles.panel },

      /* ---------- HEADER ---------- */
      React.createElement(
        "div",
        { style: styles.header },
        React.createElement("strong", null, "📡 API Monitor"),
        React.createElement(
          "div",
          { style: styles.tabs },
          ["stats", "calls", "export"].map(function (t) {
            return React.createElement(
              "div",
              {
                key: t,
                style: styles.tab(tab === t),
                onClick: function () {
                  setTab(t);
                },
              },
              t.toUpperCase()
            );
          })
        ),
        React.createElement(
          "button",
          {
            onClick: function () {
              setOpen(false);
            },
          },
          "Close"
        )
      ),

      /* ---------- CALLS TAB ---------- */
      tab === "calls"
        ? React.createElement(
            "div",
            { style: styles.body },
            React.createElement(
              "div",
              { style: styles.list },
              calls.map(function (call) {
                return React.createElement(
                  "div",
                  {
                    key: call.id,
                    style: styles.row,
                    onClick: function () {
                      setSelected(call);
                    },
                  },
                  React.createElement("div", null, React.createElement("strong", null, call.method), " ", call.endpoint),
                  React.createElement("div", { style: styles.badge(call.status) }, call.status || "PENDING", " · ", call.duration || "-", "ms")
                );
              })
            ),
            React.createElement(
              "div",
              { style: styles.details },
              selected ? React.createElement("pre", null, JSON.stringify(selected, null, 2)) : React.createElement("div", null, "Select a request")
            )
          )
        : /* ---------- STATS TAB ---------- */
        tab === "stats"
        ? React.createElement(
            "div",
            { style: styles.details },

            React.createElement(
              "div",
              { style: styles.tabs },
              ["overview", "slowest", "mostCalled", "raw"].map(function (t) {
                return React.createElement(
                  "div",
                  {
                    key: t,
                    style: styles.tab(statsTab === t),
                    onClick: function () {
                      setStatsTab(t);
                    },
                  },
                  t.toUpperCase()
                );
              })
            ),

            stats &&
              (statsTab === "overview"
                ? React.createElement(Table, {
                    columns: [
                      "urlPath",
                      "totalCalls",
                      "uniqueEndpoints",
                      "totalNetworkTime",
                      "totalRequestSizeKB",
                      "totalResponseSizeKB",
                      "totalErrors",
                    ],
                    data: [stats.summary || {}],
                  })
                : statsTab === "byPage"
                ? React.createElement(Table, {
                    columns: ["page", "callCount", "uniqueEndpoints", "totalSizeKB", "avgResponseSizeKB"],
                    data: stats.byPage,
                  })
                : statsTab === "heaviest"
                ? React.createElement(Table, {
                    columns: ["endpoint", "callCount", "totalSizeKB", "avgApiLatency", "maxDuration"],
                    data: stats.heaviestEndpoints,
                  })
                : statsTab === "slowest"
                ? React.createElement(Table, {
                    columns: ["endpoint", "callCount", "avgApiLatency", "maxDuration"],
                    data: stats.slowestEndpoints,
                  })
                : statsTab === "mostCalled"
                ? React.createElement(Table, {
                    columns: ["endpoint", "callCount", "avgApiLatency"],
                    data: stats.mostCalledEndpoints,
                  })
                : React.createElement("pre", null, JSON.stringify(stats, null, 2)))
          )
        : /* ---------- CONTROLS TAB ---------- */
        tab === "controls"
        ? React.createElement(
            "div",
            { style: styles.details },
            React.createElement(
              "button",
              {
                onClick: function () {
                  window.apiMonitor.start();
                },
              },
              "▶ Start"
            ),
            " ",
            React.createElement(
              "button",
              {
                onClick: function () {
                  window.apiMonitor.stop();
                },
              },
              "⏸ Stop"
            ),
            " ",
            React.createElement(
              "button",
              {
                onClick: function () {
                  window.apiMonitor.clear();
                },
              },
              "🗑 Clear"
            )
          )
        : /* ---------- EXPORT TAB ---------- */
          React.createElement(
            "div",
            { style: styles.details },
            React.createElement(
              "button",
              {
                onClick: function () {
                  window.apiMonitor.downloadReport();
                },
              },
              "⬇ JSON"
            ),
            " ",
            React.createElement(
              "button",
              {
                onClick: function () {
                  window.apiMonitor.downloadCSV();
                },
              },
              "⬇ CSV"
            )
          )
    );
  }
}

export default ApiMonitorPanel;
