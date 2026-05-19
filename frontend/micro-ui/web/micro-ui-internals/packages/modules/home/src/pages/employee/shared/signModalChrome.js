import React from "react";
import { CloseSvg } from "@egovernments/digit-ui-components";
import CustomChip from "@egovernments/digit-ui-module-dristi/src/components/CustomChip";

export const SignModalCloseBtn = (props) => (
  <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
    <CloseSvg />
  </div>
);

export const SignModalHeading = ({ label, status }) => (
  <div className="evidence-title">
    <h1 className="heading-m">{label}</h1>
    {status ? <CustomChip text={status} shade={"green"} /> : null}
  </div>
);
