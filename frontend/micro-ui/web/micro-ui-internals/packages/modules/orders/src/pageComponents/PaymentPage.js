import React, { useState } from "react";
import { InfoToolTipIcon } from "../../../dristi/src/icons/svgIndex";

const PaymentPage = ({ t, paymentStatus, onPrevious, paymentCardButtonLabel }) => {
  // Mock data for payment sections - this would come from props or API in a real implementation
  const [paymentData, setPaymentData] = useState([
    {
      id: 1,
      title: "Fees",
      status: paymentStatus || "Pending",
      totalAmount: "Rs XX.00",
      fees: [
        { id: 1, name: "Court Fee", amount: "Rs 13.00" },
        { id: 2, name: "Court Fee - Delay Notice", amount: "Rs 13.00" },
        { id: 3, name: "Delivery Partner Fee - Delay Notice (E-Post)", amount: "Rs 13.00" },
      ],
    },
  ]);

  const handlePayment = (paymentId) => {
    setPaymentData(
      paymentData.map((section) => {
        if (section.id === paymentId) {
          return {
            ...section,
            status: "Processing",
          };
        }
        return section;
      })
    );
  };

  return (
    <div className="sms-payment-details-page">
      <div className="info-section">
        <div className="info-header">
          <InfoToolTipIcon />
          <h3>{t("IMPORTANT_INFORMTION")}</h3>
        </div>
        <div className="info-content">
          <p>{t("PAYMENT_REDIRECT_INFO")}</p>
        </div>
      </div>

      <div className="payment-section">
        {paymentData.map((section) => (
          <div key={section.id} className="fee-section">
            <div className="fee-header">
              <h3>{section.title}</h3>
              <span className={`status-tag ${section.status.toLowerCase()}`}>{section.status}</span>
              <span className="total-amount">{section.totalAmount}</span>
            </div>

            <div className="fee-details">
              {section.fees.map((fee) => (
                <div key={fee.id} className="fee-item">
                  <span className="fee-name">{fee.name}</span>
                  <span className="fee-amount">{fee.amount}</span>
                </div>
              ))}
            </div>

            <button className="pay-online-button" onClick={() => handlePayment(section.id)}>
              {t(paymentCardButtonLabel || "Pay Online")}
            </button>
          </div>
        ))}
      </div>

      <div className="navigation-buttons">
        <button className="back-button" onClick={onPrevious}>
          {t("CS_BACK")}
        </button>
        <button className="next-button disabled">{t("CS_COMMONS_NEXT")}</button>
      </div>
    </div>
  );
};

export default PaymentPage;
