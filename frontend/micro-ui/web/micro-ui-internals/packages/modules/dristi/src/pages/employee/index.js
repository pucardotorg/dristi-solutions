import { BackButton, HelpOutlineIcon, PrivateRoute, Toast } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "react-router-dom";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import Breadcrumb from "../../components/BreadCrumb";
import { useToast } from "../../components/Toast/useToast";
import AdmittedCases from "./AdmittedCases/AdmittedCase";
import ApplicationDetails from "./ApplicationDetails";
import EFilingPaymentResponse from "./Payment/EFilingPaymentResponse";
import PaymentInbox from "./Payment/PaymentInbox";
import ViewPaymentDetails from "./Payment/ViewPaymentDetails";
import CaseFileAdmission from "./admission/CaseFileAdmission";
import Home from "./home";
import ViewCaseFile from "./scrutiny/ViewCaseFile";
import ReviewLitigantDetails from "./AdmittedCases/ReviewLitigantDetails";
import EmployeeProfileEdit from "../../components/EmployeeProfileEdit/EmployeeProfileEdit";
import AdmittedCaseJudge from "./AdmittedCases/AdmittedCaseJudge";

const EmployeeApp = ({ path, url, userType, tenants, parentRoute, result, fileStoreId }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const { toastMessage, toastType, closeToast } = useToast();
  const Inbox = window?.Digit?.ComponentRegistryService?.getComponent("Inbox");
  const hideHomeCrumb = [`${path}/cases`];
  const roles = window?.Digit.UserService.getUser()?.info?.roles;
  const isJudge = roles.some((role) => role.code === "CASE_APPROVER");
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const eSignWindowObject = sessionStorage.getItem("eSignWindowObject");
  const retrievedObject = JSON.parse(eSignWindowObject);

  const isJudgeView = roles.some((role) => ["CASE_APPROVER", "BENCH_CLERK"].includes(role.code));

  const employeeCrumbs = [
    {
      path: `/${window?.contextPath}/employee`,
      content: t("ES_COMMON_HOME"),
      show: !hideHomeCrumb.includes(location.pathname),
      isLast: false,
    },
    {
      path: `${path}/home/view-case`,
      content: t("VIEW_CASE"),
      show: location.pathname.includes("/view-case"),
      isLast: !location.pathname.includes("/review-litigant-details"),
    },
    {
      path: `${path}/home/view-case/review-litigant-details`,
      content: t("REVIEW_LITIGANT_DETAILS"),
      show: location.pathname.includes("/review-litigant-details"),
      isLast: true,
    },
    {
      path: `${path}/registration-requests`,
      content: t("ES_REGISTRATION_REQUESTS"),
      show: location.pathname.includes("/registration-requests"),
      isLast: !location.pathname.includes("/details"),
    },
    {
      path: `${path}/pending-payment-inbox`,
      content: t("CS_PENDING_PAYMENT_INBOX"),
      show: location.pathname.includes("/pending-payment-inbox"),
      isLast: !location.pathname.includes("/pending-payment-inbox"),
    },
    {
      path: `${path}/pending-payment-inbox/pending-payment-details`,
      content: t("CS_PENDING_PAYMENT_DETAILS"),
      show: location.pathname.includes("/pending-payment-details"),
      isLast: true,
    },
    {
      path: `${path}/registration-requests/details`,
      content: t("ES_APPLICATION_DETAILS"),
      show: location.pathname.includes("/registration-requests/details"),
      isLast: true,
    },
  ];
  const showBreadCrumbs = useMemo(
    () =>
      location.pathname.includes("/review-litigant-details")
        ? true
        : location.pathname.includes("/view-case")
        ? false
        : location.pathname.includes("/pending-payment-inbox") || location.pathname.includes("/view-case") || true,
    [location.pathname]
  );
  if (result) {
    sessionStorage.setItem("isSignSuccess", result);
  }
  if (fileStoreId) {
    sessionStorage.setItem("fileStoreId", fileStoreId);
  }
  if (isUserLoggedIn && retrievedObject) {
    history.push(`${retrievedObject?.path}${retrievedObject?.param}`);
    sessionStorage.removeItem("eSignWindowObject");
  }
  return (
    <Switch>
      <React.Fragment>
        <div className="ground-container dristi-employee-main">
          {!location.pathname.endsWith("/registration-requests") &&
            !location.pathname.includes("/pending-payment-inbox") &&
            !location.pathname.includes("/case") &&
            location.search.includes("?caseId") &&
            !location.pathname.includes("/employee/dristi/admission") &&
            !location.pathname.includes("/view-case") && (
              <div className="back-button-home">
                <BackButton />
                {!isJudge && (
                  <span style={{ display: "flex", justifyContent: "right", gap: "5px" }}>
                    <span style={{ color: "#f47738" }}>Help</span>
                    <HelpOutlineIcon />
                  </span>
                )}
              </div>
            )}
          {showBreadCrumbs && <Breadcrumb crumbs={employeeCrumbs} breadcrumbStyle={{ paddingLeft: 20 }}></Breadcrumb>}
          <PrivateRoute exact path={`${path}/registration-requests`} component={Inbox} />
          <PrivateRoute exact path={`${path}/registration-requests/details`} component={(props) => <ApplicationDetails {...props} />} />
          <PrivateRoute exact path={`${path}/pending-payment-inbox`} component={PaymentInbox} />
          <PrivateRoute exact path={`${path}/pending-payment-inbox/response`} component={EFilingPaymentResponse} />
          <PrivateRoute exact path={`${path}/pending-payment-inbox/pending-payment-details`} component={ViewPaymentDetails} />
          <div className={location.pathname.endsWith("employee/dristi/cases") ? "file-case-main" : ""}></div>
          <PrivateRoute exact path={`${path}/cases`} component={Home} />
          <PrivateRoute exact path={`${path}/admission`} component={(props) => <CaseFileAdmission {...props} t={t} path={path} />} />
          <PrivateRoute
            exact
            path={`${path}/home/view-case`}
            component={isJudgeView ? (props) => <AdmittedCaseJudge /> : (props) => <AdmittedCases />}
          />
          <PrivateRoute exact path={`${path}/home/view-case/review-litigant-details`} component={(props) => <ReviewLitigantDetails />} />
          <PrivateRoute exact path={`${path}/case`} component={(props) => <ViewCaseFile {...props} t={t} />} />
          <PrivateRoute exact path={`${path}/home/edit-profile`}>
            <EmployeeProfileEdit />
          </PrivateRoute>
        </div>
        {toastMessage && (
          <Toast
            style={{ right: 24, left: "unset" }}
            label={toastMessage}
            onClose={closeToast}
            {...(toastType !== "success" && { [toastType]: true })}
          />
        )}
      </React.Fragment>
    </Switch>
  );
};

export default EmployeeApp;
