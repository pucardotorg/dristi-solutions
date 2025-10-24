import React, { useState, useEffect, useMemo } from "react";
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
  const [step, setStep] = useState(null);
  const caseName = "XYZ"; // This would typically come from props or context

  // Mock notice data to be passed to CourierSelectionPage
  const [noticeData, setNoticeData] = useState([
    {
      id: 1,
      title: "Pending Payment",
      subtitle: "Notice for {Account 1}",
      courierOptions: [
        { id: "registeredPost1", name: "Registered Post", code: "INR 40", deliveryTime: "10-15 days delivery", selected: true },
        { id: "epost1", name: "E-Post", code: "INR 50", deliveryTime: "3-5 days delivery", selected: false },
      ],
      addresses: [
        { id: 1, text: "1008 L Tower, Amrapali City, Noida, Uttar Pradesh, 201301", selected: true },
        { id: 2, text: "1008 L Tower, Amrapali City, Noida, Uttar Pradesh, 201301", selected: true },
        { id: 3, text: "1008 L Tower, Amrapali City, Noida, Uttar Pradesh, 201301", selected: true },
      ],
    },
    {
      id: 2,
      title: "Pending Payment",
      subtitle: "Notice for {Account 2}",
      courierOptions: [
        { id: "registeredPost2", name: "Registered Post", code: "INR 40", deliveryTime: "10-15 days delivery", selected: false },
        { id: "epost2", name: "E-Post", code: "INR 50", deliveryTime: "3-5 days delivery", selected: false },
      ],
      addresses: [
        { id: 4, text: "1008 L Tower, Amrapali City, Noida, Uttar Pradesh, 201301", selected: false },
        { id: 5, text: "1008 L Tower, Amrapali City, Noida, Uttar Pradesh, 201301", selected: false },
        { id: 6, text: "1008 L Tower, Amrapali City, Noida, Uttar Pradesh, 201301", selected: false },
      ],
    },
  ]);

  // TODO: fetch order details using orderNumber and case Details

  const handleProceedToPaymentPage = () => {
    // TODO: task api will be integrated here before proceeding to payment page
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  // may be no need of paymentDetails props here, bcse only one payment option is there
  const handlePyament = (paymentDetails) => {
    // TODO: Payment gateway integration will be done here
    setStep(step + 1);
  };

  const handleDownloadReciept = () => {
    // TODO: Download receipt functionality will be implemented here
    // No need to proceed to next step after downloading receipt already handleNext is there
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleClose = () => {
    // Redirect to some other page or close the modal
    history.replace(`/${window?.contextPath}/citizen/dristi/home/login`);
  };

  // TODO : need to update successModalData based on different scenarios
  const successModalData = useMemo(() => {
    let statusData = {
      status: "",
      messageKey: "",
      subMessageKey: "",
    };

    // if payment is already done and we are setting step to 4 directly then status will be completed
    // statusData = {
    //   status: "success",
    //   messageKey: "YOU_ARE_ALL_SET",
    //   subMessageKey : "PAYMENT_COMPLETED_SUCCESSFULLY",
    // }

    // Check if any Registered Post (RPAD) option is selected
    // may be this condition need to be checked for first contion as well based on requirement
    const isAnyRpadSelected = noticeData?.some((notice) =>
      notice?.courierOptions?.some((option) => option?.name === "Registered Post" && option?.selected)
    );

    if (isAnyRpadSelected) {
      statusData = {
        status: "IsRpad",
        messageKey: "NOTICE_DISPATCHED",
        subMessageKey: "NOTICE_WILL_BE_SENT_BY_RPAD",
      };
    } else {
      // No RPAD selected, different message
      statusData = {
        status: "success",
        messageKey: "PAYMENT_SUCCESSFUL",
        subMessageKey: "NOTICE_PROCESSING_INITIATED",
      };
    }

    return statusData;
  }, [noticeData]);

  // TODO : check if all process of payment is completed then set step to 4 else step 1
  useEffect(() => {
    setStep(1);
  }, []);

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
        <CourierSelectionPage t={t} onNext={handleProceedToPaymentPage} noticeData={noticeData} setNoticeData={setNoticeData} />
      ) : step === 2 ? (
        <PaymentPage
          t={t}
          onPrevious={handlePrevious}
          paymentStatus={"PENDING"}
          paymentCardButtonLabel={"CS_PAY_ONLINE"}
          paymentDetails={{}}
          handlePayment={handlePyament}
        />
      ) : step === 3 ? (
        <PaymentPage
          t={t}
          paymentStatus={"PAYMENTDONE"}
          paymentCardButtonLabel={"DOWNLOAD_RECIEPT"}
          paymentDetails={{}}
          handleDownloadReciept={handleDownloadReciept}
          onNext={handleNext}
        />
      ) : step === 4 ? (
        <PaymentStatusMessage
          t={t}
          statusType={successModalData?.status}
          messageKey={successModalData?.messageKey}
          subMessageKey={successModalData?.subMessageKey}
          onClose={handleClose}
        />
      ) : null}
    </div>
  );
};

export default SmsPaymentPage;
