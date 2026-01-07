import React, { useEffect, useState } from "react";

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
    zIndex: 9999,
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
    return {
      color: status >= 400 ? "#f87171" : "#4ade80",
    };
  },
};

function ApiMonitorPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("calls");
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(
    function () {
      if (!open) return;

      const interval = setInterval(function () {
        if (!window.apiMonitor) return;

        if (tab === "calls") {
          setCalls(window.apiMonitor.getAllCalls());
        }

        if (tab === "stats") {
          setStats(window.apiMonitor.getStats());
        }
      }, 500);

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
          zIndex: 9999,
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

  return React.createElement(
    "div",
    { style: styles.panel },

    /* HEADER */
    React.createElement(
      "div",
      { style: styles.header },
      React.createElement("strong", null, "📡 API Monitor"),

      React.createElement(
        "div",
        { style: styles.tabs },
        React.createElement(
          "div",
          {
            style: styles.tab(tab === "calls"),
            onClick: function () {
              setTab("calls");
            },
          },
          "Calls"
        ),
        React.createElement(
          "div",
          {
            style: styles.tab(tab === "stats"),
            onClick: function () {
              setTab("stats");
            },
          },
          "Stats"
        ),
        React.createElement(
          "div",
          {
            style: styles.tab(tab === "controls"),
            onClick: function () {
              setTab("controls");
            },
          },
          "Controls"
        ),
        React.createElement(
          "div",
          {
            style: styles.tab(tab === "export"),
            onClick: function () {
              setTab("export");
            },
          },
          "Export"
        )
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

    /* BODY */
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
      : tab === "stats"
      ? React.createElement("div", { style: styles.details }, React.createElement("pre", null, JSON.stringify(stats, null, 2)))
      : tab === "controls"
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
      : React.createElement(
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

export default ApiMonitorPanel;
