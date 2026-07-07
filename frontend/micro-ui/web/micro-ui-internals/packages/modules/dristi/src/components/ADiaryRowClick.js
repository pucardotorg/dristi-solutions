import React from "react";

export const ADiaryRowClick = ({ rowData, colData, value = "" }) => {
  return (
    <div
      style={{
        textDecoration: "underline",
        cursor: "pointer",
      }}
      onClick={() => colData?.clickFunc(rowData)}
    >
      {value}
    </div>
  );
};
