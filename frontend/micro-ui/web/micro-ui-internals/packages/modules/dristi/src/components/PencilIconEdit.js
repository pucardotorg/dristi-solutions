import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { EditPencilIcon } from "../icons/svgIndex";

export const Context = React.createContext();

const PencilIconEdit = ({ column, row, master, module, customDropdownItems = [], position = "absolute", textStyle = {} }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const digit = globalThis.Digit ?? window.Digit;
  const actionItemsArray = master ? digit?.Customizations?.[master]?.[module]?.actionItems?.(row, column, t) || [] : customDropdownItems || [];

  const actionItem = actionItemsArray[0];

  return (
    <div style={{ position, display: "flex", justifyContent: "center", alignItems: "center", width: "40px", height: 0 }}>
      <button
        type="button"
        style={{
          cursor: actionItem?.disabled ? "not-allowed" : "pointer",
          background: "none",
          border: "none",
          padding: 0,
          ...textStyle,
        }}
        disabled={Boolean(actionItem?.disabled)}
        aria-label="Edit"
        onClick={() => {
          if (!actionItem || actionItem.disabled) return;
          actionItem.action(history, column, row, actionItem);
        }}
      >
        <EditPencilIcon />
      </button>
    </div>
  );
};

PencilIconEdit.propTypes = {
  column: PropTypes.any,
  row: PropTypes.any,
  master: PropTypes.string,
  module: PropTypes.string,
  customDropdownItems: PropTypes.array,
  position: PropTypes.string,
  textStyle: PropTypes.object,
};

export default PencilIconEdit;
