import React, { useState } from "react";
import { OrderWorkflowState } from "../Utils/orderWorkflow";

export const BulkCheckBox = ({ rowData, colData, isBailBond, defaultChecked = true }) => {
  const [checked, setChecked] = useState(defaultChecked);

  return rowData?.businessObject?.orderNotification?.status === OrderWorkflowState.PENDING_BULK_E_SIGN || isBailBond ? (
    <input
      type="checkbox"
      className="custom-checkbox"
      onChange={(e) => {
        e.stopPropagation(); // Prevent row click event
        setChecked(!checked);
        colData?.updateOrderFunc(rowData, !checked);
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent row click event
      }}
      checked={checked}
      style={{ cursor: "pointer", width: "20px", height: "20px" }}
    />
  ) : null;
};
