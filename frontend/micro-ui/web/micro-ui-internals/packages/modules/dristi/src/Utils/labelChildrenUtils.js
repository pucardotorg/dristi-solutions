/**
 * Shared form-config `labelChildren` transformers.
 *
 * Several form-config processing flows (EditProfile, EFilingCases, GenerateOrdersV2) expand
 * the sentinel string values `"optional"` and `"OutlinedInfoIcon"` set on a body/input's
 * `labelChildren` property into the actual JSX they should render. Those expansions were
 * copy-pasted 6+ times across the codebase and were a major source of Sonar-detected
 * duplication. They live here in a single place now.
 */

import React from "react";
import ReactTooltip from "react-tooltip";
import { OutlinedInfoIcon } from "../icons/svgIndex";

export const buildOutlinedInfoLabelChildren = (item, t) => (
  <React.Fragment>
    <span style={{ color: "#77787B", position: "relative" }} data-tip data-for={`${item.label}-tooltip`}>
      {" "}
      <OutlinedInfoIcon />
    </span>
    <ReactTooltip id={`${item.label}-tooltip`} place="bottom" content={item?.tooltipValue || ""}>
      {t(item?.tooltipValue || item.label)}
    </ReactTooltip>
  </React.Fragment>
);

export const applyOutlinedInfoLabelChildren = (item, t) => {
  if (item?.labelChildren === "OutlinedInfoIcon") {
    item.labelChildren = buildOutlinedInfoLabelChildren(item, t);
  }
};

export const applyOptionalLabelChildren = (item, t) => {
  if (item?.labelChildren === "optional") {
    item.labelChildren = <span style={{ color: "#77787B" }}>&nbsp;{`${t("CS_IS_OPTIONAL")}`}</span>;
  }
};
