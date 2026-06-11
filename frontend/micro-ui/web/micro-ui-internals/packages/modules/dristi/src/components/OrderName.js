import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";

export const OrderName = ({ rowData, colData, value = "" }) => {
  const { t } = useTranslation();

  const handleActivate = () => {
    colData?.clickFunc(rowData);
  };

  return (
    <button
      type="button"
      style={{
        background: "none",
        border: "none",
        padding: 0,
        textDecoration: "underline",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        textAlign: "left",
      }}
      onClick={handleActivate}
    >
      {t(value)}
    </button>
  );
};

OrderName.propTypes = {
  rowData: PropTypes.object.isRequired,
  colData: PropTypes.shape({
    clickFunc: PropTypes.func,
  }).isRequired,
  value: PropTypes.string,
};
