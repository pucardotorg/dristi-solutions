import React, { useState, useMemo, useCallback } from "react";
import CourierSelectionPage from "../../pageComponents/CourierSelectionPage";
import PaymentPage from "../../pageComponents/PaymentPage";
import PaymentStatusMessage from "./PaymentStatusMessage";
// Import useTranslation when needed for localization
import { useTranslation } from "react-i18next";

const SmsPaymentPage = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const caseName = "XYZ"; // This would typically come from props or context

  const handleNext = () => {
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

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
