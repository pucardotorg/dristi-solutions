import { AppContainer, BreadCrumb, PrivateRoute } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, useLocation } from "react-router-dom";
import JoinCaseHome from "./JoinCaseHome";

const bredCrumbStyle = { maxWidth: "min-content" };

function ProjectBreadCrumb({ location }) {
  const { t } = useTranslation();
  const crumbs = [
    {
      path: `/${window?.contextPath}/litigant`,
      content: t("HOME"),
      show: true,
    },
    {
      path: `/${window?.contextPath}/litigant`,
      content: t(location.pathname.split("/").pop()),
      show: true,
    },
  ];
  return <BreadCrumb crumbs={crumbs} spanStyle={bredCrumbStyle} />;
}

ProjectBreadCrumb.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

const App = ({ path, stateCode, userType, tenants }) => {
  const location = useLocation();
  return (
    <Switch>
      <AppContainer className="ground-container">
        <ProjectBreadCrumb location={location} />
        <PrivateRoute path={`${path}/join-case`} component={JoinCaseHome} />
      </AppContainer>
    </Switch>
  );
};

App.propTypes = {
  path: PropTypes.string.isRequired,
  stateCode: PropTypes.string,
  userType: PropTypes.string,
  tenants: PropTypes.array,
};

export default App;
