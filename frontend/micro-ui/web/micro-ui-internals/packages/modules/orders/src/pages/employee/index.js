import { AppContainer, PrivateRoute } from "@egovernments/digit-ui-react-components";
// Import the breadcrumb context from core module
import { BreadCrumbsParamsDataContext } from "@egovernments/digit-ui-module-core";
// Import the custom breadcrumb component that supports dynamic navigation
import BreadCrumb from "../../components/BreadCrumbsNew";
import React, { useMemo, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "react-router-dom";
import OrdersResponse from "./OrdersResponse";
// import OrdersCreate from "./OrdersCreate";
import OrdersHome from "./OrdersHome";
import GenerateOrdersV2 from "./GenerateOrdersV2";
import PaymentStatus from "../../components/PaymentStatus";
import EpostTrackingPage from "./E-PostTracking";
import PaymentForSummonModal from "./PaymentForSummonModal";
import ReviewSummonsNoticeAndWarrant from "./ReviewSummonsNoticeAndWarrant";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
const bredCrumbStyle = { maxWidth: "min-content" };

/**
 * Custom breadcrumb component for the Orders module
 * Displays navigation path based on current location and case context
 */
const ProjectBreadCrumb = ({ location }) => {
  const { pathname } = useLocation();
  // Access the breadcrumb context to get case navigation data
  const { BreadCrumbsParamsData } = useContext(BreadCrumbsParamsDataContext);
  const { caseId, filingNumber } = BreadCrumbsParamsData;

  const roles = Digit.UserService.getUser()?.info?.roles;
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const userInfo = Digit?.UserService?.getUser()?.info;
  let userType = "employee";
  if (userInfo) {
    userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }
  const { t } = useTranslation();
  const isProcessViewer = useMemo(() => roles?.some((role) => role.code === "PROCESS_VIEWER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  if (isProcessViewer) homePath = `/${window?.contextPath}/${userType}/orders/Summons&Notice`;

  const pathTokeyMap = {
    "generate-order": "CS_GENERATE_ORDER",
  };
  const crumbs = useMemo(
    () => [
      {
        path: isEpostUser ? pathname : homePath,
        content: t("ES_COMMON_HOME"),
        show: true,
      },

      // Conditionally add the View Case breadcrumb if case data is available in context
      ...(caseId && filingNumber && !pathname.includes("Summons&Notice")
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
        content: t(pathTokeyMap[pathname.split("/").pop()] || pathname.split("/").pop()),
        show: true,
      },
    ],
    // Added caseId and filingNumber as dependencies to update breadcrumbs when they change
    [isEpostUser, location.pathname, pathname, t, userType, caseId, filingNumber]
  );
  return <BreadCrumb crumbs={crumbs} spanStyle={bredCrumbStyle} style={{ color: "rgb(0, 126, 126)" }} />;
};

const App = ({ path, stateCode, userType, tenants }) => {
  const history = useHistory();
  const Digit = useMemo(() => window?.Digit || {}, []);
  const userInfo = Digit?.UserService?.getUser()?.info;
  const hasCitizenRoute = useMemo(() => path?.includes(`/${window?.contextPath}/citizen`), [path]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  if (isCitizen && !hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
  } else if (!isCitizen && hasCitizenRoute && Boolean(userInfo)) {
    if (!isEpostUser) {
      history.push(`/${window?.contextPath}/employee/home/home-screen`);
    } else history.push(`/${window?.contextPath}/employee/home/home-pending-task`);
  }
  const isProcessViewer = useMemo(() => roles?.some((role) => role.code === "PROCESS_VIEWER"), [roles]);

  return (
    <Switch>
      <AppContainer className="ground-container order-submission">
        <React.Fragment>{isProcessViewer ? null : <ProjectBreadCrumb location={window.location} />}</React.Fragment>
        <PrivateRoute path={`${path}/orders-response`} component={() => <OrdersResponse></OrdersResponse>} />
        {/* <PrivateRoute path={`${path}/orders-create`} component={() => <OrdersCreate />} /> */}
        <PrivateRoute path={`${path}/orders-home`} component={() => <OrdersHome />} />
        <PrivateRoute path={`${path}/generate-order`} component={() => <GenerateOrdersV2 />} />
        {/* <PrivateRoute path={`${path}/make-submission`} component={() => <MakeSubmission />} /> */}
        <PrivateRoute path={`${path}/Summons&Notice`} component={() => <ReviewSummonsNoticeAndWarrant />} />
        <PrivateRoute path={`${path}/payment-screen`} component={() => <PaymentStatus />} />
        <PrivateRoute path={`${path}/payment-modal`} component={() => <PaymentForSummonModal />} />
        {/* <PrivateRoute path={`${path}/tracking`} component={() => <EpostTrackingPage />} /> */}
      </AppContainer>
    </Switch>
  );
};

export default App;
