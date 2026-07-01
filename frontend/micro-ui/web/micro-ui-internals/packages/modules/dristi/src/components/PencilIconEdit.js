import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { EditPencilIcon } from "../icons/svgIndex";

export const Context = React.createContext();

const PencilIconEdit = ({ column, row, master, module, customDropdownItems = [], position = "absolute", textStyle = {} }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const actionItemsArray = master ? Digit.Customizations[master]?.[module]?.actionItems?.(row, column, t) || [] : customDropdownItems || [];

  const actionItem = actionItemsArray[0];

  return (
    <div style={{ position: position, display: "flex", justifyContent: "center", alignItems: "center", width: "40px", height: 0 }}>
      <div
        style={{
          cursor: "pointer",
        }}
        onClick={() => {
          return !actionItem.disabled && actionItem.action(history, column, row, actionItem);
        }}
      >
        <EditPencilIcon />
      </div>
    </div>
  );
};

export default PencilIconEdit;
