import React from "react";
import AppBreadcrumb from "@egovernments/digit-ui-module-dristi/src/components/AppBreadcrumb";

/**
 * Orders module breadcrumb — uses the shared `AppBreadcrumb` without any colour tint, matching
 * the previous standalone implementation.
 */
const Breadcrumb = (props) => <AppBreadcrumb {...props} />;

Breadcrumb.defaultProps = {
  successful: true,
};

export default Breadcrumb;
