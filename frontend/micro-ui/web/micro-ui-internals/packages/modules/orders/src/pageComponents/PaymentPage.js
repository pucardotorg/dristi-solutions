import React, { useMemo } from "react";
import { InfoToolTipIcon } from "../../../dristi/src/icons/svgIndex";

const PaymentPage = ({
  t,
  paymentStatus,
  onPrevious,
  onNext,
  paymentCardButtonLabel,
  paymentDetails,
  handlePayment,
  handleDownloadReciept,
  isPaymentLocked = false,
}) => {
  // Mock data for payment sections - this would come from props or API in a real implementation
  // TODO : useMemo for this and make like this structure based on paymentDetails prop
  const paymentData = useMemo(() => {
    if (!paymentDetails) return [];

    return [
      {
        id: 1,
        title: "Fees",
        status: paymentStatus || "PENDING",
        totalAmount: `Rs ${paymentDetails.totalAmount}.00`,
        fees:
          paymentDetails?.breakDown?.map((item, index) => ({
            id: index + 1,
            name: item.type,
            amount: `Rs ${item.amount}.00`,
          })) || [],
      },
    ];
  }, [paymentStatus, paymentDetails]);

  return (
    <div className="sms-payment-details-page" key={paymentStatus}>
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
        {paymentData?.map((section) => (
          <div key={section.id} className="fee-section">
            <div className="fee-header">
              <h3>{section.title}</h3>
              <span className={`status-tag ${section.status.toLowerCase()}`}>{t(section.status)}</span>
              <span className="total-amount">{section.totalAmount}</span>
            </div>

            <div className="fee-details">
              {section?.fees?.map((fee) => (
                <div key={fee.id} className="fee-item">
                  <span className="fee-name">{fee.name}</span>
                  <span className="fee-amount">{fee.amount}</span>
                </div>
              ))}
            </div>

            {section.status === "PENDING" ? (
              <button className="pay-online-button" onClick={handlePayment} disabled={isPaymentLocked}>
                {t(paymentCardButtonLabel || "Pay Online")}
              </button>
            ) : (
              <button className="pay-online-button download-reciept-button" onClick={handleDownloadReciept}>
                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_8855_624)">
                    <path
                      d="M13.1668 5.33333H3.8335C2.72683 5.33333 1.8335 6.22667 1.8335 7.33333V11.3333H4.50016V14H12.5002V11.3333H15.1668V7.33333C15.1668 6.22667 14.2735 5.33333 13.1668 5.33333ZM11.1668 12.6667H5.8335V9.33333H11.1668V12.6667ZM13.1668 8C12.8002 8 12.5002 7.7 12.5002 7.33333C12.5002 6.96667 12.8002 6.66667 13.1668 6.66667C13.5335 6.66667 13.8335 6.96667 13.8335 7.33333C13.8335 7.7 13.5335 8 13.1668 8ZM12.5002 2H4.50016V4.66667H12.5002V2Z"
                      fill="#007E7E"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_8855_624">
                      <rect width="16" height="16" fill="white" transform="translate(0.5)" />
                    </clipPath>
                  </defs>
                </svg>

                {t(paymentCardButtonLabel || "Download Receipt")}
              </button>
            )}
          </div>
        ))}
      </div>

      {paymentStatus === "PENDING" && (
        <div className="navigation-buttons">
          <button className="back-button" onClick={onPrevious}>
            {t("CS_BACK")}
          </button>
          <button className="next-button disabled" onClick={onNext}>
            {t("CS_COMMONS_NEXT")}
          </button>
        </div>
      )}

      {paymentStatus !== "PENDING" && (
        <div className="navigation-buttons">
          <button className="next-button" onClick={onNext}>
            {t("CS_COMMONS_NEXT")}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
