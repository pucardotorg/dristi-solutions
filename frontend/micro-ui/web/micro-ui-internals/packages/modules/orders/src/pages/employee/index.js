import { AppContainer, BreadCrumb, PrivateRoute } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useContext } from "react";
import { BreadCrumbContext, pages } from "@egovernments/digit-ui-module-core";
import { useTranslation } from "react-i18next";
import { Switch } from "react-router-dom";
import OrdersResponse from "./OrdersResponse";
import OrdersCreate from "./OrdersCreate";
import OrdersHome from "./OrdersHome";
import GenerateOrders from "./GenerateOrders";
import PaymentStatus from "../../components/PaymentStatus";
import EpostTrackingPage from "./E-PostTracking";
import PaymentForSummonModal from "./PaymentForSummonModal";
import ReviewSummonsNoticeAndWarrant from "./ReviewSummonsNoticeAndWarrant";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import BreadCrumbNew from "../../components/BreadCrumbNew";

const breadCrumbStyle = { maxWidth: "min-content" };


// const ProjectBreadCrumb = ({ location }) => {
//   const { pathname } = useLocation();
//   const roles = Digit.UserService.getUser()?.info?.roles;
//   const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
//   const userInfo = Digit?.UserService?.getUser()?.info;
//   let userType = "employee";
//   if (userInfo) {
//     userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
//   }
//   const { t } = useTranslation();
//   const crumbs = useMemo(
//     () => [
//       {
//         path: isEpostUser ? pathname : `/${window?.contextPath}/${userType}/home/home-pending-task`,
//         content: t("ES_COMMON_HOME"),
//         show: true,
//       },
//       {
//         path: `/${window?.contextPath}/${userType}`,
//         content: t(location.pathname.split("/").pop()),
//         show: true,
//       },
//     ],
//     [isEpostUser, location.pathname, pathname, t, userType]
//   );
//   return <BreadCrumb crumbs={crumbs} spanStyle={breadCrumbStyle} style={{ color: "rgb(0, 126, 126)" }} />;
// };



const getBreadCrumbsForCasePage = (crumbs) => {
  const index = (crumbs?.routes || []).findIndex((crumb) => crumb.page === pages.ORDERS);
  return [...(crumbs?.routes || []).slice(0, index + 1)];
}

const App = ({ path, stateCode, userType, tenants }) => {
  const history = useHistory();
  const Digit = useMemo(() => window?.Digit || {}, []);
  const userInfo = Digit?.UserService?.getUser()?.info;
  const hasCitizenRoute = useMemo(() => path?.includes(`/${window?.contextPath}/citizen`), [path]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);
  const { breadCrumbs } = useContext(BreadCrumbContext);

  if (isCitizen && !hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
  } else if (!isCitizen && hasCitizenRoute && Boolean(userInfo)) {
    history.push(`/${window?.contextPath}/employee/home/home-pending-task`);
  }

  return (
    <Switch>
      <AppContainer className="ground-container order-submission">
        <React.Fragment>
          {/* <ProjectBreadCrumb location={window.location} /> */}
          <BreadCrumbNew crumbs={getBreadCrumbsForCasePage(breadCrumbs)} breadcrumbStyle={{ paddingLeft: 20 }}></BreadCrumbNew>
        </React.Fragment>
        <PrivateRoute path={`${path}/orders-response`} component={() => <OrdersResponse></OrdersResponse>} />
        <PrivateRoute path={`${path}/orders-create`} component={() => <OrdersCreate />} />
        <PrivateRoute path={`${path}/orders-home`} component={() => <OrdersHome />} />
        <PrivateRoute path={`${path}/generate-orders`} component={() => <GenerateOrders />} />
        {/* <PrivateRoute path={`${path}/make-submission`} component={() => <MakeSubmission />} /> */}
        <PrivateRoute path={`${path}/Summons&Notice`} component={() => <ReviewSummonsNoticeAndWarrant />} />
        <PrivateRoute path={`${path}/payment-screen`} component={() => <PaymentStatus />} />
        <PrivateRoute path={`${path}/payment-modal`} component={() => <PaymentForSummonModal />} />
        <PrivateRoute path={`${path}/tracking`} component={() => <EpostTrackingPage />} />
      </AppContainer>
    </Switch>
  );
};

export default App;
