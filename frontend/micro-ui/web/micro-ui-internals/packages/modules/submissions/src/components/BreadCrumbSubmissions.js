import React from "react";
import AppBreadcrumb from "@egovernments/digit-ui-module-dristi/src/components/AppBreadcrumb";

const formatCrumbText = (text) => {
  if (!text || typeof text !== "string") return text;

  return text
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Submissions module breadcrumb — uses the shared `AppBreadcrumb` with the same cyan tint as
 * hearings and additionally title-cases dash-separated crumb labels.
 */
const BreadCrumbSubmissions = (props) => (
  <AppBreadcrumb {...props} liColor="rgb(0, 126, 126)" formatContent={formatCrumbText} />
);

BreadCrumbSubmissions.defaultProps = {
  successful: true,
};

export default BreadCrumbSubmissions;
