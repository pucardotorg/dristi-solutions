import React, { useState, useEffect, useMemo } from "react";
import CourierSelectionPage from "../../pageComponents/CourierSelectionPage";
import PaymentPage from "../../pageComponents/PaymentPage";
import PaymentStatusMessage from "./PaymentStatusMessage";
// Import useTranslation when needed for localization
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { Loader, Toast } from "@egovernments/digit-ui-react-components";
import useOpenApiOrderSearch from "../../hooks/SmsPayment/useOpenApiOrderSearch";
import useOpenApiTaskManagementSearch from "../../hooks/SmsPayment/useOpenApiTaskManagementSearch";
import useOpenApiSummonsPaymentBreakUp from "../../hooks/SmsPayment/useOpenApiSummonsPaymentBreakup";
import { getFormattedName } from "../../utils";
import { openApiService } from "../../hooks/services";
import { prepareTaskPayload, formDataKeyMap, formatAddress } from "../../utils/PaymentUtitls";

const SmsPaymentPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { orderNumber, referenceId, orderItemId, tenantId } = Digit.Hooks.useQueryParams();
  // const tenantId = Digit.ULBService.getCurrentTenantId();
  const isAuthorised = location?.state?.isAuthorised;
  const mobileNumber = location?.state?.mobileNumber;
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const [step, setStep] = useState(null);
  const [loader, setLoader] = useState(false);
  const [noticeData, setNoticeData] = useState([]);
  const filingNumber = orderNumber?.split("-OR")?.[0] || "";
  const [showErrorToast, setShowErrorToast] = useState(null);

  const { data: orderData, isLoading: isOrderDataLoading } = useOpenApiOrderSearch(
    { orderNumber, tenantId, referenceId, orderItemId, filingNumber },
    { tenantId },
    `${orderNumber}_${referenceId}_${orderItemId}`,
    Boolean(orderNumber && referenceId)
  );

  const { data: taskManagementData, isLoading: isTaskManagementLoading } = useOpenApiTaskManagementSearch(
    { criteria: { orderNumber, referenceId, orderItemId, tenantId } },
    { tenantId },
    `${orderNumber}_${referenceId}_${orderItemId}`,
    Boolean(orderNumber && referenceId)
  );

  const taskManagementList = useMemo(() => {
    return taskManagementData?.taskManagementRecords;
  }, [taskManagementData]);

  const processCourierData = useMemo(() => {
    if (!orderData || !taskManagementList?.length) return null;

    let orderDetails = orderData;
    // Handle composite order
    if (orderData?.orderCategory === "COMPOSITE") {
      const orderItem = orderData?.compositeItems?.find((item) => item?.id === orderItemId);

      if (orderItem) {
        orderDetails = {
          ...orderData,
          additionalDetails: orderItem?.orderSchema?.additionalDetails,
          orderType: orderItem?.orderType,
          orderDetails: orderItem?.orderSchema?.orderDetails,
          orderItemId: orderItem?.id,
        };
      }
    }

    const orderType = orderDetails?.orderType;
    const formDataKey = formDataKeyMap?.[orderType];
    const parties = orderDetails?.additionalDetails?.formdata?.[formDataKey]?.party || [];

    const formattedParties = parties?.map((party, index) => {
      const taskManagement = taskManagementList?.find((task) => task?.taskType === orderType);

      const partyDetails = taskManagement?.partyDetails?.find((lit) => {
        if (party?.data?.partyType === "Respondent") {
          return party?.uniqueId === lit?.respondentDetails?.uniqueId;
        } else {
          return party?.data?.uniqueId === lit?.witnessDetails?.uniqueId;
        }
      });

      const addressFromOrder = party?.data?.addressDetails || [];
      const addressFromTask = partyDetails?.addresses || [];

      // Merge addresses safely
      const mergedAddresses = (() => {
        const result = [];

        addressFromOrder?.forEach((addr) => {
          const match = addressFromTask?.find((p) => p?.id === addr?.id);
          result.push({
            id: addr?.id,
            text: formatAddress(addr),
            selected: !!match,
            addressDetails: addr,
          });
        });

        // Add addresses from task data that aren't in order
        addressFromTask?.forEach((addr) => {
          const exists = addressFromOrder?.some((a) => a?.id === addr?.id);
          if (!exists) {
            result.push({
              id: addr?.id,
              text: formatAddress(addr),
              selected: true,
              addressDetails: addr,
            });
          }
        });

        return result;
      })();

      return {
        id: index + 1,
        title: orderType === "SUMMONS" ? "Summons Notice" : "Notice",
        subtitle: `${party?.data?.partyType || "Party"} - ${
          getFormattedName(party?.data?.firstName, party?.data?.middleName, party?.data?.lastName) || ""
        }`,
        // courierOptions,
        orderType,
        addresses: mergedAddresses,
        partyUniqueId: party?.data?.uniqueId,
        partyType: party?.data?.partyType,
      };
    });

    return {
      uniqueId: orderDetails?.orderItemId,
      orderType,
      notices: formattedParties,
      addressDetails: formattedParties?.flatMap((p) => p?.addresses) || [],
    };
  }, [orderData, taskManagementList, orderItemId]);

  const paymentCriteriaList = useMemo(() => {
    if (!processCourierData?.addressDetails?.length) return [];

    const channels = ["RPAD", "EPOST"];
    const taskTypes = [processCourierData?.orderType];

    return processCourierData?.addressDetails?.flatMap((addr) =>
      taskTypes?.flatMap((taskType) =>
        channels?.map((channelId) => ({
          channelId,
          receiverPincode: addr?.addressDetails?.addressDetails?.pincode,
          tenantId,
          id: `${taskType}_${channelId}_${addr?.id}`,
          taskType,
        }))
      )
    );
  }, [processCourierData, tenantId]);

  const { data: breakupResponse, isLoading: isBreakUpLoading } = useOpenApiSummonsPaymentBreakUp(
    {
      Criteria: paymentCriteriaList,
    },
    {},
    `PAYMENT-${processCourierData?.uniqueId}-${paymentCriteriaList?.length > 0}`,
    Boolean(paymentCriteriaList?.length > 0)
  );

  const courierBreakupOptions = useMemo(() => {
    if (!breakupResponse?.Calculation?.length) return [];

    const checkedAddressIds = processCourierData?.addressDetails?.filter((addr) => addr?.selected || addr?.checked)?.map((addr) => addr?.id) || [];
    const grouped = breakupResponse?.Calculation?.reduce((acc, item) => {
      const [taskType, channelId, addressId] = item?.applicationId?.split("_") || [];
      const key = `${taskType}_${channelId}_${addressId}`;
      const isAddressChecked = checkedAddressIds?.includes(addressId);

      if (!acc[key]) {
        acc[key] = {
          channelId,
          taskType,
          fees: 0,
          channelCode: channelId === "RPAD" ? "REGISTERED_POST" : "E_POST",
          channelDeliveryTime: channelId === "RPAD" ? "RPAD_DELIVERY_TIME" : "EPOST_DELIVERY_TIME",
          addressId,
        };
      }

      if (isAddressChecked) {
        acc[key].fees += item?.totalAmount || 0;
      }

      return acc;
    }, {});

    // Create translated and display-friendly options
    const options = Object?.values(grouped)?.map((item) => ({
      ...item,
      name: item?.channelCode,
      fees: item?.fees || 0,
      deliveryTime: item?.channelDeliveryTime,
      channelName: `${t(item?.channelCode)} (INR ${item?.fees}) • ${t(item?.channelDeliveryTime)}`,
      selected: false,
    }));

    return options;
  }, [breakupResponse, processCourierData, t]);

  useEffect(() => {
    if (!processCourierData?.notices?.length || !courierBreakupOptions?.length) return;

    const updatedNotices = processCourierData?.notices?.map((notice) => {
      const noticeAddressIds = notice?.addresses?.map((addr) => addr?.id);
      const taskManagement = taskManagementList?.find((task) => task?.taskType === orderData?.orderType);
      const partyDetails = taskManagement?.partyDetails?.find((lit) => {
        if (notice?.partyType === "Respondent") {
          return notice?.partyUniqueId === lit?.respondentDetails?.uniqueId;
        } else {
          return notice?.partyUniqueId === lit?.witnessDetails?.uniqueId;
        }
      });
      const existingDeliveryChannels = partyDetails?.deliveryChannels || [];

      // Step 1: collect breakup-based courier options for this notice
      const breakupOptions = courierBreakupOptions
        ?.filter((opt) => opt?.taskType === notice?.orderType && noticeAddressIds?.includes(opt?.addressId))
        ?.reduce((acc, current) => {
          const exists = acc?.some((item) => item?.channelId === current?.channelId);
          if (!exists) acc.push(current);
          return acc;
        }, []);

      // Step 2: merge with already selected delivery channels
      const mergedOptions = breakupOptions?.map((opt) => {
        const alreadySelected = existingDeliveryChannels?.some((ch) => ch?.channelId === opt?.channelId);
        return {
          ...opt,
          selected: alreadySelected || opt?.selected || false,
        };
      });

      // Step 3: ensure each channelId appears only once
      const dedupedOptions = mergedOptions?.reduce((acc, curr) => {
        if (!acc.some((o) => o.channelId === curr.channelId)) acc.push(curr);
        return acc;
      }, []);

      return {
        ...notice,
        courierOptions: dedupedOptions || [],
      };
    });

    setNoticeData(updatedNotices);
  }, [processCourierData, courierBreakupOptions, taskManagementList, orderData?.orderType]);

  const handleProceedToPaymentPage = async () => {
    try {
      setLoader(true);
      const orderType = orderData?.orderType;
      const formDataKey = formDataKeyMap[orderType];
      const formData = orderData?.additionalDetails?.formdata?.[formDataKey]?.party;
      const existingTask = taskManagementList?.find((item) => item?.taskType === orderType);

      const getPayload = await prepareTaskPayload({
        noticeData,
        taskSearchData: existingTask,
        formData,
        filingNumber,
        tenantId,
        taskType: orderType,
        orderNumber,
        orderItemId: orderData?.orderItemId,
        courtId: orderData?.courtId,
      });

      if (existingTask) {
        await openApiService.updateTaskManagementService({ taskManagement: getPayload });
      } else {
        await openApiService.createTaskManagementService({ taskManagement: getPayload });
      }
      setStep(step + 1);
      // TODO : fetch bill Api Call
    } catch (error) {
      console.error("Error in proceeding to payment:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
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

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    if (!isUserLoggedIn && !isAuthorised) {
      const baseUrl = `/${window?.contextPath}/citizen/dristi/home/payment-login`;
      const queryParams = new URLSearchParams({
        tenantId,
        referenceId,
        orderNumber,
      });

      if (orderItemId) queryParams.append("orderItemId", orderItemId);

      history.replace(`${baseUrl}?${queryParams.toString()}`);
    }

    if (!orderNumber && !referenceId) {
      history.replace(`/${window?.contextPath}/citizen/dristi/home/login`);
    }
  }, [history, isAuthorised, isUserLoggedIn, orderItemId, orderNumber, referenceId, tenantId]);

  if (isOrderDataLoading || isTaskManagementLoading || step === null || isBreakUpLoading) {
    return <Loader />;
  }

  return (
    <div className="sms-payment-container">
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "9999",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      <div className="sms-payment-header">
        <h1>{`${t("TAKE_STEPS_FOR_CASE")} ${orderData?.caseTitle || "XYZ"}`}</h1>
      </div>
      {step === 1 ? (
        <CourierSelectionPage
          t={t}
          onNext={handleProceedToPaymentPage}
          noticeData={noticeData}
          setNoticeData={setNoticeData}
          breakupResponse={breakupResponse}
        />
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
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default SmsPaymentPage;
