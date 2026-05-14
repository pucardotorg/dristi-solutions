import React, { useState } from "react";
import PropTypes from "prop-types";
import { OrderWorkflowState } from "../Utils/orderWorkflow";

export const BulkCheckBox = ({ rowData, colData, isBailBond, defaultChecked = true }) => {
  const [checked, setChecked] = useState(defaultChecked);

  return rowData?.businessObject?.orderNotification?.status === OrderWorkflowState.PENDING_BULK_E_SIGN || isBailBond ? (
    <input
      type="checkbox"
      className="custom-checkbox"
      onChange={(e) => {
        e.stopPropagation();
        setChecked(!checked);
        colData?.updateOrderFunc(rowData, !checked);
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      checked={checked}
      style={{ cursor: "pointer", width: "20px", height: "20px" }}
    />
  ) : null;
};

BulkCheckBox.propTypes = {
  rowData: PropTypes.shape({
    businessObject: PropTypes.shape({
      orderNotification: PropTypes.shape({
        status: PropTypes.string,
      }),
    }),
  }),
  colData: PropTypes.shape({
    updateOrderFunc: PropTypes.func,
  }),
  isBailBond: PropTypes.bool,
  defaultChecked: PropTypes.bool,
};

export default BulkCheckBox;
