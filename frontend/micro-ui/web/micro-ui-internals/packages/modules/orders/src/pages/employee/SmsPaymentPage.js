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
import { getFormattedName, getSuffixByBusinessCode } from "../../utils";
import { openApiService } from "../../hooks/services";
import { prepareTaskPayload, formDataKeyMap, formatAddress } from "../../utils/PaymentUtitls";
import useOpenApiPaymentProcess from "../../hooks/SmsPayment/useOpenApiPaymentProcess";
import { useOpenApiDownloadFile } from "../../hooks/SmsPayment/useOpenApiDownloadFile";
import { filterValidAddresses } from "@egovernments/digit-ui-module-home/src/utils";

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
  const [paymentBreakDown, setPaymentBreakDown] = useState({});
  const [receiptFilstoreId, setReceiptFilstoreId] = useState(null);
  const [isPaymentLocked, setIsPaymentLocked] = useState(false);
  const { download } = useOpenApiDownloadFile();
  const scenario = "EfillingCase";
  const path = "";

  const { data: paymentTypeData, isLoading: isPaymentTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "payment",
    [{ name: "paymentType" }],
    {
      select: (data) => {
        return data?.payment?.paymentType || [];
      },
    }
  );

  const suffix = useMemo(() => getSuffixByBusinessCode(paymentTypeData, "task-management-payment"), [paymentTypeData]);

  const { data: orderDataResponse, isLoading: isOrderDataLoading } = useOpenApiOrderSearch(
    { orderNumber, tenantId, referenceId, orderItemId, filingNumber, mobileNumber },
    { tenantId },
    `${orderNumber}_${referenceId}_${orderItemId}`,
    Boolean(orderNumber && referenceId)
  );

  const { data: taskManagementData, isLoading: isTaskManagementLoading, refetch: refetchTaskManagement } = useOpenApiTaskManagementSearch(
    { criteria: { orderNumber, referenceId, orderItemId, tenantId } },
    { tenantId },
    `${orderNumber}_${referenceId}_${orderItemId}`,
    Boolean(orderNumber && referenceId)
  );

  const taskManagementList = useMemo(() => {
    return taskManagementData?.taskManagementRecords;
  }, [taskManagementData]);

  const orderData = useMemo(() => {
    let orderDetails = orderDataResponse;
    // Handle composite order
    if (orderDetails?.orderCategory === "COMPOSITE") {
      const orderItem = orderDataResponse?.compositeItems?.find((item) => item?.id === orderItemId);

      if (orderItem) {
        orderDetails = {
          ...orderDataResponse,
          additionalDetails: orderItem?.orderSchema?.additionalDetails,
          orderType: orderItem?.orderType,
          orderDetails: orderItem?.orderSchema?.orderDetails,
          orderItemId: orderItem?.id,
        };
      }
    }

    return orderDetails;
  }, [orderDataResponse, orderItemId]);

  const taskManagement = useMemo(() => taskManagementList?.find((task) => task?.taskType === orderData?.orderType), [
    taskManagementList,
    orderData?.orderType,
  ]);

  const processCourierData = useMemo(() => {
    if (!orderData) return null;
    const orderDetails = orderData;
    const orderType = orderDetails?.orderType;
    const parties = orderData?.partyDetails || [];

    const formattedParties = parties?.map((party, index) => {
      const taskManagement = taskManagementList?.find((task) => task?.taskType === orderType);

      const partyDetails = taskManagement?.partyDetails?.find((lit) => {
        if (party?.partyType === "Respondent" || party?.partyType === "Accused") {
          return party?.uniqueId === lit?.respondentDetails?.uniqueId;
        } else {
          return (party?.data?.uniqueId || party?.uniqueId) === lit?.witnessDetails?.uniqueId;
        }
      });

      const addressFromOrder = party?.address || [];
      const addressFromTask = partyDetails?.addresses || [];

      // Merge addresses safely
      const mergedAddresses = (() => {
        const result = [];

        addressFromOrder?.forEach((addr) => {
          const match = addressFromTask?.find((p) => p?.id === addr?.id);
          result.push({
            id: addr?.id,
            text: formatAddress(addr),
            selected: addressFromTask?.length ? !!match : true,
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

      let name = "";
      if (party?.partyType === "Respondent" || party?.partyType === "Accused") {
        name = party?.partyName;
      } else {
        name =
          party?.partyName?.trim() && party?.witnessDesignation
            ? `${party?.partyName?.trim()} (${party?.witnessDesignation})`
            : party?.partyName?.trim() || party?.witnessDesignation;
      }

      return {
        id: index + 1,
        title: orderType?.toLowerCase() === "summons" ? t("SUMMONS") : t("NOTICE"),
        subtitle: `${party?.partyType || "Party"} - ${name || ""}`,
        partyName: party?.partyName,
        orderType,
        addresses: filterValidAddresses(mergedAddresses),
        partyUniqueId: party?.uniqueId,
        partyType: party?.partyType,
      };
    });

    return {
      uniqueId: orderDetails?.orderItemId || orderItemId,
      orderType,
      notices: formattedParties,
      addressDetails: formattedParties?.flatMap((p) => p?.addresses) || [],
    };
  }, [orderData, orderItemId, t, taskManagementList]);

  // This memo acts as the single source of truth for all downstream payment calculations.
  // It safely switches between the stable initial data (processCourierData) and the
  // user-modified state (noticeData), preventing an infinite loop.
  const liveCourierData = useMemo(() => {
    if (noticeData && noticeData.length > 0) {
      const noticeAddress = noticeData?.flatMap((p) => p?.addresses) || [];
      if (noticeAddress.length > processCourierData?.addressDetails?.length) {
        return {
          ...processCourierData,
          notices: noticeData,
          addressDetails: noticeAddress,
        };
      }
    }
    return processCourierData;
  }, [processCourierData, noticeData]);

  const paymentCriteriaList = useMemo(() => {
    if (!liveCourierData?.addressDetails?.length) return [];

    const channels = ["RPAD"]; // add EPOST when needed
    const taskTypes = [liveCourierData?.orderType];

    return liveCourierData?.addressDetails?.flatMap((addr) =>
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
  }, [liveCourierData?.addressDetails, liveCourierData?.orderType, tenantId]);

  const { data: breakupResponse, isLoading: isBreakUpLoading } = useOpenApiSummonsPaymentBreakUp(
    {
      Criteria: paymentCriteriaList,
    },
    {},
    `PAYMENT-${liveCourierData?.uniqueId}-${liveCourierData?.addressDetails?.length}`,
    Boolean(paymentCriteriaList?.length > 0)
  );

  const courierBreakupOptions = useMemo(() => {
    if (!breakupResponse?.Calculation?.length) return [];

    const checkedAddressIds = liveCourierData?.addressDetails?.filter((addr) => addr?.selected || addr?.checked)?.map((addr) => addr?.id) || [];
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
      deliveryChannelName: `${t(item?.channelCode)} (INR ${item?.fees}) • ${t(item?.channelDeliveryTime)}`,
      selected: true, // make it false when epost or other delievry channels added
    }));

    return options;
  }, [breakupResponse?.Calculation, liveCourierData?.addressDetails, t]);

  useEffect(() => {
    if (!liveCourierData?.notices?.length) return;

    const updatedNotices = liveCourierData?.notices?.map((notice) => {
      const noticeAddressIds = notice?.addresses?.map((addr) => addr?.id);

      // Use the stable orderType property from liveCourierData
      const taskManagement = taskManagementList?.find((task) => task?.taskType === liveCourierData?.orderType);

      const partyDetails = taskManagement?.partyDetails?.find((lit) => {
        if (notice?.partyType === "Respondent" || notice?.partyType === "Accused") {
          return notice?.partyUniqueId === lit?.respondentDetails?.uniqueId;
        } else {
          return notice?.partyUniqueId === lit?.witnessDetails?.uniqueId;
        }
      });
      const existingDeliveryChannels = partyDetails?.deliveryChannels || [];

      const noticeBreakupOptions = courierBreakupOptions?.filter(
        (opt) => opt?.taskType === notice?.orderType && noticeAddressIds?.includes(opt?.addressId)
      );

      const aggregatedOptionsMap = noticeBreakupOptions?.reduce((acc, current) => {
        const key = current?.channelId;

        if (!acc[key]) {
          acc[key] = {
            ...current,
            fees: 0,
            deliveryChannelName: t(current?.channelCode),
          };
        }
        acc[key].fees += current?.fees || 0;
        return acc;
      }, {});

      const breakupOptions = Object.values(aggregatedOptionsMap || {}).map((item) => ({
        ...item,
        deliveryChannelName: `${t(item?.channelCode)} (INR ${item?.fees}) • ${t(item?.channelDeliveryTime)}`,
      }));

      const mergedOptions = breakupOptions?.map((opt) => {
        const currentlySelectedInState = notice?.courierOptions?.find((c) => c?.channelId === opt?.channelId)?.selected || true; // when other delievery channels then set it to false
        const alreadySelectedInTask = existingDeliveryChannels?.some((ch) => ch?.channelId === opt?.channelId);

        return {
          ...opt,
          selected: currentlySelectedInState || alreadySelectedInTask,
        };
      });

      const dedupedOptions = mergedOptions?.reduce((acc, curr) => {
        if (!acc.some((o) => o.channelId === curr.channelId)) acc.push(curr);
        return acc;
      }, []);

      return {
        ...notice,
        courierOptions: dedupedOptions || [],
      };
    });

    // below check to restrict infinite loop
    const currentNotices = liveCourierData?.notices;
    let areOptionsTheSame = true;

    if (updatedNotices?.length === currentNotices?.length) {
      for (let i = 0; i < currentNotices?.length || 0; i++) {
        if (JSON.stringify(currentNotices?.[i]?.courierOptions) !== JSON?.stringify(updatedNotices?.[i]?.courierOptions)) {
          areOptionsTheSame = false;
          break;
        }
      }
    } else {
      areOptionsTheSame = false;
    }

    if (areOptionsTheSame) {
      return;
    }

    setNoticeData(updatedNotices);
  }, [breakupResponse, liveCourierData, taskManagementList, t, courierBreakupOptions]);

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
        orderItemId: orderItemId,
        courtId: orderData?.courtId,
      });
      let updatedTaskResponse = {};
      if (existingTask) {
        updatedTaskResponse = await openApiService.updateTaskManagementService({ taskManagement: getPayload });
      } else {
        updatedTaskResponse = await openApiService.createTaskManagementService({ taskManagement: getPayload });
      }
      const paymentResponse = await openApiService.getTreasuryPaymentBreakup(
        { tenantId: tenantId },
        {
          consumerCode: updatedTaskResponse?.taskManagement?.taskManagementNumber + `_${suffix}`,
        },
        "dristi",
        true
      );
      await refetchTaskManagement();
      setPaymentBreakDown(paymentResponse?.TreasuryHeadMapping?.calculation);
      setStep(step + 1);
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

  const totalAmount = useMemo(() => {
    const totalAmount = paymentBreakDown?.totalAmount || 0;
    return parseFloat(totalAmount)?.toFixed(2);
  }, [paymentBreakDown?.totalAmount]);

  const { fetchBill, openPaymentPortal } = useOpenApiPaymentProcess({
    tenantId,
    consumerCode: taskManagement?.taskManagementNumber + `_${suffix}`,
    service: "task-management-payment",
    path,
    caseDetails: {},
    totalAmount: totalAmount,
    scenario,
  });

  const showToast = (type, message, duration = 5000) => {
    setShowErrorToast({ error: type, label: message });
    setTimeout(() => {
      setShowErrorToast(null);
    }, duration);
  };

  const handlePyament = async () => {
    try {
      setLoader(true);
      const bill = await fetchBill(taskManagement?.taskManagementNumber + `_${suffix}`, tenantId, "task-management-payment");
      if (!bill?.Bill?.length) {
        showToast("success", t("CS_NO_PENDING_PAYMENT"), 5000);
        setIsPaymentLocked(true);
        setStep(4);
        return;
      }
      const caseLockStatus = await openApiService.getPaymentLockStatus(
        {},
        {
          uniqueId: taskManagement?.taskManagementNumber,
          tenantId: tenantId,
          mobileNumber,
        }
      );
      if (caseLockStatus?.Lock?.isLocked) {
        setIsPaymentLocked(true);
        showToast("success", t("CS_CASE_LOCKED_BY_ANOTHER_USER"), 5000);
        return;
      }
      await openApiService.setCaseLock(
        { Lock: { uniqueId: taskManagement?.taskManagementNumber, tenantId: tenantId, lockType: "PAYMENT", mobileNumber } },
        { mobileNumber }
      );
      const paymentStatus = await openPaymentPortal(bill);
      await openApiService.setCaseUnlock({}, { uniqueId: taskManagement?.taskManagementNumber, tenantId: tenantId, mobileNumber });
      const success = Boolean(paymentStatus);
      if (success) {
        const response = await openApiService.fetchBillFileStoreId({}, { billId: bill?.Bill?.[0]?.id, tenantId });
        const fileStoreId = response?.Document?.fileStore;
        if (fileStoreId) {
          setReceiptFilstoreId(fileStoreId);
        }
        setStep(step + 1);
      }
    } catch (error) {
      console.error("Error in proceeding to payment:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleDownloadReciept = async () => {
    try {
      setLoader(true);
      const fileName = `${orderData?.orderType ? t(orderData?.orderType) + "-" : ""}${t("PAY_RECIEPT_FILENAME")}.pdf`;
      await download(receiptFilstoreId, tenantId, "treasury", fileName);
    } catch (err) {
      console.error("Error in downloading reciept:", err);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleClose = () => {
    // Redirect to some other page or close the modal
    window.location.replace(process.env.REACT_APP_PROXY_API || "https://oncourts.kerala.gov.in");
  };

  // TODO : need to update successModalData based on different scenarios
  const successModalData = useMemo(() => {
    let statusData = {
      status: "",
      messageKey: "",
      subMessageKey: "",
    };

    const isAnyRpadSelected = noticeData?.some((notice) =>
      notice?.courierOptions?.some((option) => option?.channelCode === "REGISTERED_POST" && option?.selected)
    );

    if (taskManagementList?.length > 0 && taskManagementList?.[0]?.status !== "PENDING_PAYMENT") {
      statusData = {
        status: "success",
        messageKey: "YOU_ARE_ALL_SET",
        subMessageKey: "PAYMENT_COMPLETED_SUCCESSFULLY",
      };
    } else if (isAnyRpadSelected) {
      statusData = {
        status: "IsRpad",
        messageKey: "NOTICE_DISPATCHED",
        subMessageKey: "NOTICE_WILL_BE_SENT_BY_RPAD",
      };
    } else {
      statusData = {
        status: "success",
        messageKey: "PAYMENT_SUCCESSFUL",
        subMessageKey: "NOTICE_PROCESSING_INITIATED",
      };
    }

    return statusData;
  }, [noticeData, taskManagementList]);

  // TODO : check if all process of payment is completed then set step to 4 else step 1
  useEffect(() => {
    if (taskManagementList?.length > 0 && taskManagementList?.[0]?.status !== "PENDING_PAYMENT") {
      setStep(4);
    } else {
      setStep(1);
    }
  }, [taskManagementList, taskManagementList?.length]);

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

  if (isOrderDataLoading || isTaskManagementLoading || step === null || isPaymentTypeLoading) {
    return <Loader />;
  }

  return (
    <div className="sms-payment-container">
      {(loader || isBreakUpLoading) && (
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
      {orderData?.caseTitle && (
        <div className="sms-payment-header">
          <h1>{`${t("TAKE_STEPS_FOR_CASE")} ${orderData?.caseTitle || "XYZ"}`}</h1>
        </div>
      )}
      {step === 1 ? (
        <CourierSelectionPage
          t={t}
          onNext={handleProceedToPaymentPage}
          noticeData={noticeData}
          setNoticeData={setNoticeData}
          breakupResponse={breakupResponse}
          tenantId={tenantId}
          filingNumber={filingNumber}
          setShowErrorToast={setShowErrorToast}
        />
      ) : step === 2 ? (
        <PaymentPage
          t={t}
          onPrevious={handlePrevious}
          paymentStatus={"PENDING"}
          paymentCardButtonLabel={"CS_PAY_ONLINE"}
          paymentDetails={paymentBreakDown}
          handlePayment={handlePyament}
          isPaymentLocked={isPaymentLocked}
        />
      ) : step === 3 ? (
        <PaymentPage
          t={t}
          paymentStatus={"PAYMENTDONE"}
          paymentCardButtonLabel={"DOWNLOAD_RECIEPT"}
          paymentDetails={paymentBreakDown}
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
