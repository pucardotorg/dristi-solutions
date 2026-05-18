import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

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

function buildTableRowKey(row, columns) {
  return columns
    .map(function (col) {
      return String(col) + ":" + String(row[col] ?? "");
    })
    .join("|");
}

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
              {
                key: col,
                style: { padding: "8px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "black" },
              },
              col
            );
          })
        )
      ),
      React.createElement(
        "tbody",
        null,
        data.map(function (row) {
          return React.createElement(
            "tr",
            { key: buildTableRowKey(row, columns), style: {} },
            columns.map(function (col) {
              return React.createElement(
                "td",
                { key: col, style: { padding: "8px", borderBottom: "0.5px solid rgba(226, 232, 240, 0.2)" } },
                row[col] === undefined ? "-" : row[col]
              );
            })
          );
        })
      )
    )
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function renderStatsTables(stats, statsTab) {
  if (!stats) return null;

  if (statsTab === "overview") {
    return React.createElement(Table, {
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
    });
  }

  if (statsTab === "byPage") {
    return React.createElement(Table, {
      columns: ["page", "callCount", "uniqueEndpoints", "totalSizeKB", "avgResponseSizeKB"],
      data: stats.byPage || [],
    });
  }

  if (statsTab === "heaviest") {
    return React.createElement(Table, {
      columns: ["endpoint", "callCount", "totalSizeKB", "avgApiLatency", "maxDuration"],
      data: stats.heaviestEndpoints || [],
    });
  }

  if (statsTab === "slowest") {
    return React.createElement(Table, {
      columns: ["endpoint", "callCount", "avgApiLatency", "maxDuration"],
      data: stats.slowestEndpoints || [],
    });
  }

  if (statsTab === "mostCalled") {
    return React.createElement(Table, {
      columns: ["endpoint", "callCount", "avgApiLatency"],
      data: stats.mostCalledEndpoints || [],
    });
  }

  return React.createElement("pre", null, JSON.stringify(stats, null, 2));
}

function renderCallsTab({ calls, selected, setSelected }) {
  return React.createElement(
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
  );
}

function renderStatsTab(stats, statsTab, setStatsTab) {
  return React.createElement(
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
    renderStatsTables(stats, statsTab)
  );
}

function renderControlsTab() {
  return React.createElement(
    "div",
    { style: styles.details },
    React.createElement(
      "button",
      {
        type: "button",
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
        type: "button",
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
        type: "button",
        onClick: function () {
          window.apiMonitor.clear();
        },
      },
      "🗑 Clear"
    )
  );
}

function renderExportTab() {
  return React.createElement(
    "div",
    { style: styles.details },
    React.createElement(
      "button",
      {
        type: "button",
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
        type: "button",
        onClick: function () {
          window.apiMonitor.downloadCSV();
        },
      },
      "⬇ CSV"
    )
  );
}

/* ---------- MAIN COMPONENT ---------- */

function ApiMonitorPanel() {
  const [open, setOpen] = useState(function () {
    const savedState = localStorage.getItem("apiMonitorPanelOpen");
    return savedState === "true";
  });
  const [tab, setTab] = useState("stats");
  const [statsTab, setStatsTab] = useState("overview");
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(function () {
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
        type: "button",
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
  }

  let mainContent;
  if (tab === "calls") {
    mainContent = renderCallsTab({ calls, selected, setSelected });
  } else if (tab === "stats") {
    mainContent = renderStatsTab(stats, statsTab, setStatsTab);
  } else if (tab === "controls") {
    mainContent = renderControlsTab();
  } else {
    mainContent = renderExportTab();
  }

  const headerEl = React.createElement(
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
        type: "button",
        onClick: function () {
          setOpen(false);
        },
      },
      "Close"
    )
  );

  return React.createElement("div", { style: styles.panel }, headerEl, mainContent);
}

export default ApiMonitorPanel;
