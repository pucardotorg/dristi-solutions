import { AppContainer, PrivateRoute } from "@egovernments/digit-ui-react-components";
import React, { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "react-router-dom";
import AdjournHearing from "./AdjournHearing";
import MonthlyCalendar from "./CalendarView";
import EndHearing from "./EndHearing";
import InsideHearingMainPage from "./InsideHearingMainPage";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
import BreadCrumbHearings from "../../components/BreadCrumbHearings";
import { useLocation } from "react-router-dom";

const bredCrumbStyle = { maxWidth: "min-content" };

const ProjectBreadCrumb = ({ location }) => {
  const { t } = useTranslation();
  const userInfo = window?.Digit?.UserService?.getUser?.()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const { BreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId, filingNumber } = BreadCrumbsParamsData;

  const locationHome = useLocation();
  const isFromHome = locationHome.state?.fromHome;

  const crumbs = [
    {
      path: homePath,
      content: t("ES_COMMON_HOME"),
      show: true,
    },
    ...(!isFromHome
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
      content: t(location.pathname.split("/").filter(Boolean).pop()),
      show: true,
    },
  ];
  return <BreadCrumbHearings crumbs={crumbs} spanStyle={bredCrumbStyle} />;
};

const App = ({ path }) => {
  const history = useHistory();
  const Digit = useMemo(() => window?.Digit || {}, []);
  const userInfo = Digit?.UserService?.getUser()?.info;
  const hasCitizenRoute = useMemo(() => path?.includes(`/${window?.contextPath}/citizen`), [path]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  if (isCitizen && !hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
  } else if (!isCitizen && hasCitizenRoute && Boolean(userInfo)) {
    history.push(homePath);
  }

  return (
    <Switch>
      <AppContainer className="ground-container hearing-action-block">
        <React.Fragment>
          <ProjectBreadCrumb location={window.location} />
        </React.Fragment>
        <PrivateRoute path={`${path}/inside-hearing`} component={() => <InsideHearingMainPage />} />
        <PrivateRoute path={`${path}/end-hearing`} component={() => <EndHearing />} />
        <PrivateRoute path={`${path}/adjourn-hearing`} component={() => <AdjournHearing />} />
        <PrivateRoute exact path={`${path}/`} component={() => <MonthlyCalendar />} />
      </AppContainer>
    </Switch>
  );
};

export default App;
