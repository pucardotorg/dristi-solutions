import React from "react";
import AppBreadcrumb from "@egovernments/digit-ui-module-dristi/src/components/AppBreadcrumb";

/**
 * Hearings module breadcrumb — thin wrapper around the shared `AppBreadcrumb` that tints
 * non-current crumbs cyan. All other behaviour (last-item handling, redirect, formatting) is
 * inherited from the shared component.
 */
const BreadCrumbHearings = (props) => <AppBreadcrumb {...props} liColor="rgb(0, 126, 126)" />;

BreadCrumbHearings.defaultProps = {
  successful: true,
};

export default BreadCrumbHearings;
