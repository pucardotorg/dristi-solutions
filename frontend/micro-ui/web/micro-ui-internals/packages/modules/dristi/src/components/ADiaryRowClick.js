import React from "react";
import { useTranslation } from "react-i18next";

export const ADiaryRowClick = ({ rowData, colData, value = "" }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        textDecoration: "underline",
        cursor: "pointer",
      }}
      onClick={() => colData?.clickFunc(rowData)}
    >
      {t(value)}
    </div>
  );
};
