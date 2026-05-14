import { Loader } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useRouteMatch } from "react-router-dom";
import OrdersCard from "./components/OrdersCard";
import DeliveryChannels from "./pageComponents/DeliveryChannels";
import { default as EmployeeApp } from "./pages/employee";
import { overrideHooks, updateCustomConfigs } from "./utils";
import { OrderWorkflowAction, OrderWorkflowState } from "./utils/orderWorkflow";
import { ordersService } from "./hooks/services";
import OrderReviewModal from "./pageComponents/OrderReviewModal";
import AddSubmissionDocument from "./components/AddSubmissionDocument";
import CustomInfo from "./components/CustomInfo";
import SummonsOrderComponent from "./components/SummonsOrderComponent";
import ReIssueSummonsModal from "./components/ReIssueSummonsModal";
import PaymentForSummonModal from "./pages/employee/PaymentForSummonModal";
import PaymentForRPADModal from "./pages/employee/PaymentForRPADModal";
import PaymentForSummonModalSMSAndEmail from "./pages/employee/PaymentForSummonModalSMSAndEmail";
import SBIEpostPayment from "./pages/employee/SBIEpostPayment";
import SBIPaymentStatus from "./components/SBIPaymentStatus";
import WarrantOrderComponent from "./components/WarrantOrderComponent";
import OrderTypeControls from "./components/OrderTypeControls";
import OrderTypeControlItem from "./components/OrderTypeControlItem";
import EpostTrackingPage from "./pages/employee/E-PostTracking";
import PaymentLoginPage from "./pages/employee/PaymentLoginPage";
import SmsPaymentPage from "./pages/employee/SmsPaymentPage";
import NoticeSummonPartyComponent from "./components/NoticeSummonPartyComponent";
import MediationFormSignaturePage from "@egovernments/digit-ui-module-dristi/src/pages/employee/AdmittedCases/MediationFormSignaturePage";
import SelectAddreseeCustomComponent from "./components/SelectAddreseeCustomComponent";
import MultiPartyAddressSelector from "./components/MultiPartyAddressSelector";

export const OrdersModule = ({ stateCode, userType, tenants }) => {
  const { path } = useRouteMatch();
  const moduleCode = ["orders", "hearings", "common", "case", "workflow"];
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading } = Digit.Services.useStore({
    stateCode,
    moduleCode,
    language,
  });

  if (isLoading) {
    return <Loader />;
  }
  return <EmployeeApp path={path} stateCode={stateCode} userType={userType} tenants={tenants} />;
};

const componentsToRegister = {
  OrdersModule,
  OrdersCard,
  DeliveryChannels,
  OrderWorkflowActionEnum: OrderWorkflowAction,
  OrderWorkflowStateEnum: OrderWorkflowState,
  OrdersService: ordersService,
  OrderReviewModal,
  AddSubmissionDocument,
  CustomInfo,
  SummonsOrderComponent,
  ReIssueSummonsModal,
  PaymentForSummonModal,
  PaymentForSummonModalSMSAndEmail,
  SBIEpostPayment,
  SBIPaymentStatus,
  PaymentForRPADModal,
  WarrantOrderComponent,
  OrderTypeControls,
  OrderTypeControlItem,
  EpostTrackingPage,
  PaymentLoginPage,
  SmsPaymentPage,
  NoticeSummonPartyComponent,
  MediationFormSignaturePage,
  SelectAddreseeCustomComponent,
  MultiPartyAddressSelector,
};

export const initOrdersComponents = () => {
  overrideHooks();
  updateCustomConfigs();
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
