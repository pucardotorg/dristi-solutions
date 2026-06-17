import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

export const ADiaryRowClick = ({ rowData, colData, value = "" }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      style={{
        textDecoration: "underline",
        cursor: "pointer",
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
      }}
      onClick={() => colData?.clickFunc(rowData)}
    >
      {t(value)}
    </button>
  );
};

ADiaryRowClick.propTypes = {
  rowData: PropTypes.object,
  colData: PropTypes.shape({ clickFunc: PropTypes.func }),
  value: PropTypes.string,
};
