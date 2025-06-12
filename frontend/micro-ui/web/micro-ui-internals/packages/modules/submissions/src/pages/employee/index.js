import { AppContainer, PrivateRoute } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "react-router-dom";
import SubmissionsResponse from "./SubmissionsResponse";
import SubmissionsCreate from "./SubmissionsCreate";
import SubmissionsSearch from "./SubmissionsSearch";
import SubmissionDocuments from "./SubmissionDocuments";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import BreadCrumbSubmissions from "../../components/BreadCrumbSubmissions";
const bredCrumbStyle = { maxWidth: "min-content" };

const ProjectBreadCrumb = ({ location }) => {
  const userInfo = Digit?.UserService?.getUser()?.info;
  const roles = userInfo?.roles;
  const isJudge = useMemo(() => roles.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const isBenchClerk = useMemo(() => roles.some((role) => role.code === "BENCH_CLERK"), [roles]);
  // Access the breadcrumb context to get case navigation data
  const { BreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId, filingNumber } = BreadCrumbsParamsData;

  const isTypist = useMemo(() => roles.some((role) => role.code === "TYPIST_ROLE"), [roles]);

  let userType = "employee";
  if (userInfo) {
    userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }
  const { t } = useTranslation();
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (isJudge || isTypist || isBenchClerk) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const crumbs = [
    {
      path: homePath,
      content: t("CS_HOME"),
      show: true,
    },
    // Conditionally add the View Case breadcrumb if case data is available in context
    ...(caseId && filingNumber
      ? [
          {
            path: `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Overview`,
            content: t("VIEW_CASE"),
            show: true,
          },
        ]
      : []),
    {
      path: `/${window?.contextPath}/${userType}`,
      content: t(location.pathname.split("/").pop()),
      show: true,
    },
  ];
  return <BreadCrumbSubmissions crumbs={crumbs} spanStyle={bredCrumbStyle} />;
};

const App = ({ path, stateCode, userType, tenants }) => {
  const history = useHistory();
  const Digit = useMemo(() => window?.Digit || {}, []);
  const userInfo = Digit?.UserService?.getUser()?.info;
  const hasCitizenRoute = useMemo(() => path?.includes(`/${window?.contextPath}/citizen`), [path]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);

  if (isCitizen && !hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
  } else if (!isCitizen && hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/employee/home/home-pending-task`);
  }
  return (
    <Switch>
      <AppContainer className="ground-container submission-main">
        <React.Fragment>
          <ProjectBreadCrumb location={window.location} />
        </React.Fragment>
        <PrivateRoute path={`${path}/submissions-response`} component={() => <SubmissionsResponse></SubmissionsResponse>} />
        <PrivateRoute path={`${path}/submissions-create`} component={() => <SubmissionsCreate path={path} />} />
        <PrivateRoute path={`${path}/submit-document`} component={() => <SubmissionDocuments path={path} />} />
        <PrivateRoute path={`${path}/submissions-search`} component={() => <SubmissionsSearch></SubmissionsSearch>} />
      </AppContainer>
    </Switch>
  );
};

export default App;
