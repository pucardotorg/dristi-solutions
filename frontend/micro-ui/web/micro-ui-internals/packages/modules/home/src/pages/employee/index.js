import { AppContainer, BreadCrumb, PrivateRoute } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "react-router-dom";
import HearingsResponse from "./HearingsResponse";
import InsideHearingMainPage from "./InsideHearingMainPage";
import HomeView from "./HomeView";
import ViewHearing from "./ViewHearing";
import HomePopUp from "./HomePopUp";
import EfilingPaymentBreakdown from "../../components/EfilingPaymentBreakdown";
import EFilingPaymentRes from "../../components/EfilingPaymentRes";
import ScheduleHearing from "./ScheduleHearing";
import PaymentStatus from "../../../../orders/src/components/PaymentStatus";
import ScheduleNextHearing from "./ScheduleNextHearing";
import DashboardPage from "./Dashboard";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ADiaryPage from "./ADiaryPage";
import BulkESignView from "./BulkESignView";
import MainHomeScreen from "./MainHomeScreen";
import GeneratePaymentDemandBreakdown from "../../components/GeneratePaymentDemandBreakdown";
import BailBondModal from "./BailBondModal";
import { BailBondSignModal } from "./BailBondSignModal";
import { WitnessDepositionSignModal } from "./WitnessDepositionSignModal";
import MediationFormSignaturePage from "@egovernments/digit-ui-module-dristi/src/pages/employee/AdmittedCases/MediationFormSignaturePage";
import DigitalDocumentSignModal from "./DigitalDocumentSignModal";
const bredCrumbStyle = { maxWidth: "min-content" };

const ProjectBreadCrumb = ({ location }) => {
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  let userType = "employee";
  if (userInfo) {
    userType = userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }
  const { t } = useTranslation();
  const crumbs = [
    {
      path: `/${window?.contextPath}/${userType}/home/home-pending-task`,
      content: t("HOME"),
      show: true,
    },
    {
      path: `/${window?.contextPath}/${userType}`,
      content: t(location.pathname.split("/").pop()),
      show: true,
    },
  ];
  return <BreadCrumb crumbs={crumbs} spanStyle={bredCrumbStyle} />;
};

const App = ({ path, stateCode, userType, tenants }) => {
  const Digit = useMemo(() => window?.Digit || {}, []);
  const SummonsAndWarrantsModal = Digit.ComponentRegistryService.getComponent("SummonsAndWarrantsModal") || <React.Fragment></React.Fragment>;
  const ReIssueSummonsModal = Digit.ComponentRegistryService.getComponent("ReIssueSummonsModal") || <React.Fragment></React.Fragment>;
  const PaymentForSummonModal = Digit.ComponentRegistryService.getComponent("PaymentForSummonModal") || <React.Fragment></React.Fragment>;
  const PaymentForRPADModal = Digit.ComponentRegistryService.getComponent("PaymentForRPADModal") || <React.Fragment></React.Fragment>;
  const SBIPaymentStatus = Digit.ComponentRegistryService.getComponent("SBIPaymentStatus") || <React.Fragment></React.Fragment>;
  const PaymentForSummonModalSMSAndEmail = Digit.ComponentRegistryService.getComponent("PaymentForSummonModalSMSAndEmail") || (
    <React.Fragment></React.Fragment>
  );
  const SBIEpostPayment = Digit.ComponentRegistryService.getComponent("SBIEpostPayment") || <React.Fragment></React.Fragment>;
  const EpostTrackingPage = Digit.ComponentRegistryService.getComponent("EpostTrackingPage") || <React.Fragment></React.Fragment>;

  const history = useHistory();
  const userInfo = Digit?.UserService?.getUser()?.info;
  const hasCitizenRoute = useMemo(() => path?.includes(`/${window?.contextPath}/citizen`), [path]);
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
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
      <AppContainer className="ground-container">
        <PrivateRoute path={`${path}/hearings-response`} component={() => <HearingsResponse></HearingsResponse>} />
        <PrivateRoute path={`${path}/inside-hearing`} component={() => <InsideHearingMainPage />} />
        <PrivateRoute path={`${path}/home-pending-task/e-filing-payment-response`} component={() => <EFilingPaymentRes></EFilingPaymentRes>} />
        <PrivateRoute
          exact
          path={`${path}/home-pending-task/e-filing-payment-breakdown`}
          component={() => <EfilingPaymentBreakdown></EfilingPaymentBreakdown>}
        />
        <PrivateRoute
          exact
          path={`${path}/home-pending-task/case-payment-demand-breakdown`}
          component={() => <GeneratePaymentDemandBreakdown></GeneratePaymentDemandBreakdown>}
        />
        <PrivateRoute
          exact
          path={`${path}/home-pending-task/summons-warrants-modal`}
          component={() => <SummonsAndWarrantsModal></SummonsAndWarrantsModal>}
        />
        <PrivateRoute exact path={`${path}/home-pending-task/reissue-summons-modal`} component={() => <ReIssueSummonsModal></ReIssueSummonsModal>} />
        <PrivateRoute exact path={`${path}/home-pending-task/post-payment-modal`} component={() => <PaymentForSummonModal></PaymentForSummonModal>} />
        <PrivateRoute exact path={`${path}/home-pending-task/rpad-payment-modal`} component={() => <PaymentForRPADModal></PaymentForRPADModal>} />
        <PrivateRoute
          exact
          path={`${path}/home-pending-task/icops-payment-modal`}
          component={() => <PaymentForSummonModalSMSAndEmail></PaymentForSummonModalSMSAndEmail>}
        />
        <PrivateRoute
          exact
          path={`${path}/home-pending-task/sms-payment-modal`}
          component={() => <PaymentForSummonModalSMSAndEmail></PaymentForSummonModalSMSAndEmail>}
        />
        <PrivateRoute
          exact
          path={`${path}/home-pending-task/email-payment-modal`}
          component={() => <PaymentForSummonModalSMSAndEmail></PaymentForSummonModalSMSAndEmail>}
        />
        <PrivateRoute exact path={`${path}/home-pending-task/home-schedule-hearing`} component={() => <ScheduleHearing />} />
        <PrivateRoute exact path={`${path}/home-pending-task/home-set-next-hearing`} component={() => <ScheduleNextHearing />} />
        <PrivateRoute exact path={`${path}/home-pending-task`} component={HomeView} />
        <PrivateRoute exact path={`${path}/home-screen`} component={() => <MainHomeScreen></MainHomeScreen>} />
        {/* <PrivateRoute path={`${path}/bulk-esign-order`} component={() => <BulkESignView></BulkESignView>} /> */}
        {/* <PrivateRoute path={`${path}/dashboard/adiary`} component={() => <ADiaryPage></ADiaryPage>} /> */}
        <PrivateRoute path={`${path}/bail-bond`} component={() => <BailBondModal></BailBondModal>} />
        <PrivateRoute path={`${path}/sign-bail-bond`} component={() => <BailBondSignModal></BailBondSignModal>} />
        <PrivateRoute path={`${path}/sign-witness-deposition`} component={() => <WitnessDepositionSignModal></WitnessDepositionSignModal>} />
        <PrivateRoute exact path={`${path}/dashboard`} component={() => <DashboardPage></DashboardPage>} />
        <PrivateRoute path={`${path}/sbi-epost-payment`} component={() => <SBIEpostPayment></SBIEpostPayment>} />
        <PrivateRoute path={`${path}/post-payment-screen`} component={() => <PaymentStatus></PaymentStatus>} />
        <PrivateRoute path={`${path}/sbi-payment-screen`} component={() => <SBIPaymentStatus />} />
        <PrivateRoute path={`${path}/view-hearing`} component={() => <ViewHearing></ViewHearing>} />
        <PrivateRoute path={`${path}/home-popup`} component={() => <HomePopUp></HomePopUp>} />
        <PrivateRoute exact path={`${path}/epost-home-screen`} component={() => <EpostTrackingPage></EpostTrackingPage>} />
        <PrivateRoute exact path={`${path}/mediation-form-sign`} component={() => <MediationFormSignaturePage />} />
        <PrivateRoute exact path={`${path}/digitized-document-sign`} component={() => <DigitalDocumentSignModal />} />
      </AppContainer>
    </Switch>
  );
};

export default App;
