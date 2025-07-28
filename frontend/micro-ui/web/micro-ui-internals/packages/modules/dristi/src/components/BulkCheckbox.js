import React, { useState } from "react";
import { OrderWorkflowState } from "../Utils/orderWorkflow";

export const BulkCheckBox = ({ rowData, colData, isBailBond }) => {
  const [checked, setChecked] = useState(true);

  return rowData?.businessObject?.orderNotification?.status === OrderWorkflowState.PENDING_BULK_E_SIGN || isBailBond ? (
    <input
      type="checkbox"
      className="custom-checkbox"
      onChange={() => {
        setChecked(!checked);
        colData?.updateOrderFunc(rowData, !checked);
      }}
      checked={checked}
      style={{ cursor: "pointer", width: "24px", height: "24px", marginLeft: "15px" }}
    />
  ) : null;
};
