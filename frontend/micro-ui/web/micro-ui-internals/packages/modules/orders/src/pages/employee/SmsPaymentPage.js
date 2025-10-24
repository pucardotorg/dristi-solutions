import React, { useState, useMemo, useCallback, useEffect } from "react";
import CourierSelectionPage from "../../pageComponents/CourierSelectionPage";
import PaymentPage from "../../pageComponents/PaymentPage";
import PaymentStatusMessage from "./PaymentStatusMessage";
// Import useTranslation when needed for localization
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";

const SmsPaymentPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { orderNumber } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const isAuthorised = location?.state?.isAuthorised;
  const mobileNumber = location?.state?.mobileNumber;
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);

  const [step, setStep] = useState(1);
  const caseName = "XYZ"; // This would typically come from props or context

  // TODO: fetch order details using orderNumber and case Details

  const handleNext = () => {
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  useEffect(() => {
    if (!isUserLoggedIn && !isAuthorised) {
      history.replace(`/${window?.contextPath}/citizen/dristi/home/payment-login?orderNumber=${orderNumber}`);
    }

    if (!orderNumber) {
      history.replace(`/${window?.contextPath}/citizen/dristi/home/login`);
    }
  }, [history, isAuthorised, isUserLoggedIn, orderNumber, tenantId]);

  return (
    <div className="sms-payment-container">
      <div className="sms-payment-header">
        <h1>{`${t("TAKE_STEPS_FOR_CASE")} ${caseName || "XYZ"}`}</h1>
      </div>
      {step === 1 ? (
        <CourierSelectionPage t={t} onNext={handleNext} />
      ) : step === 2 ? (
        <PaymentPage t={t} onPrevious={handlePrevious} paymentStatus={"pending"} />
      ) : (
        <PaymentStatusMessage t={t} statusType={"IsRpad"} />
      )}
    </div>
  );
};

export default SmsPaymentPage;
