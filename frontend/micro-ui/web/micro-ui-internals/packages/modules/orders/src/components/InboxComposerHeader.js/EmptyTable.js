import React from "react";

const EmptyTable = ({ t, config, message = "No data to display.", subText = "Please refine search." }) => {
  const columns = config?.sections?.searchResult?.uiConfig?.columns || [];

  return (
    <div className="inbox-search-component-wrapper">
      <div className="sections-parent search">
        <div style={{ overflowX: "auto" }}>
          <div style={{ width: "100%" }}>
            <span className="search-component-table">
              <table className="table" role="table">
                <thead>
                  <tr role="row">
                    {columns.map((col, index) => (
                      <th
                        key={index}
                        colSpan="1"
                        role="columnheader"
                        title="Toggle SortBy"
                        style={{
                          verticalAlign: "top",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: "16px",
                          padding: "20px 18px",
                          backgroundColor: "#fff",
                        }}
                      >
                        {t(col.label)}
                        <span></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr role="row">
                    <td
                      colSpan={columns.length}
                      style={{
                        textAlign: "center",
                        padding: "40px 18px",
                        whiteSpace: "normal",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "20px", color: "black" }}>{t(message)}</div>
                      <div style={{ fontSize: "16px", color: "black", marginTop: "6px", fontWeight: 400 }}>{t(subText)}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .table {
          width: 100%;
          border-collapse: collapse;
          background-color: #fff;
        }
      `}</style>
    </div>
  );
};

export default EmptyTable;
