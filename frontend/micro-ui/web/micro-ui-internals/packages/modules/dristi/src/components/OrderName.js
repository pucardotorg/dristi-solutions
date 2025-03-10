import React from "react";
import { useTranslation } from "react-i18next";

export const OrderName = ({ rowData, colData, value = "" }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        textDecoration: "underline",
        cursor: "pointer",
      }}
      onClick={() => colData?.clickFunc(rowData)}
    >
      {value}
      {/* {rowData?.orderCategory === "COMPOSITE" ? rowData?.orderTitle : t(`ORDER_TYPE_${rowData?.orderType?.toUpperCase()}`)} */}
    </div>
  );
};
