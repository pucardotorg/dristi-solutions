import { useState } from "react";
import { useHistory } from "react-router-dom";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";

const usePaymentProcess = ({ tenantId, consumerCode, service, path, caseDetails, totalAmount, mockSubmitModalInfo, scenario }) => {
  const history = useHistory();
  const toast = useToast();
  const [paymentLoader, setPaymentLoader] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billPaymentStatus, setBillPaymentStatus] = useState();
  const isMockEnabled = window?.globalConfigs?.getConfig("MOCKENABLED") === "true" ? true : false;

  const fetchBill = async (consumerCode, tenantId, service) => {
    return await DRISTIService.callFetchBill({}, { consumerCode: consumerCode, tenantId, businessService: service });
  };
  const userInfo = Digit.UserService.getUser()?.info;
  const openPaymentPortal = async (bill, billAmount = null) => {
    try {
      const gateway = await DRISTIService.callETreasury(
        {
          ChallanData: {
            ChallanDetails: {
              FROM_DATE: "26/02/2020",
              TO_DATE: "26/02/2020",
              PAYMENT_MODE: "E",
              NO_OF_HEADS: "1",
              HEADS_DET: [
                {
                  AMOUNT: "4",
                  HEADID: "00374",
                },
              ],
              CHALLAN_AMOUNT: "4",
              PARTY_NAME: caseDetails?.additionalDetails?.payerName,
              DEPARTMENT_ID: bill?.Bill?.[0]?.billDetails?.[0]?.id,
              TSB_RECEIPTS: "N",
            },
            billId: bill?.Bill?.[0]?.billDetails?.[0]?.billId,
            serviceNumber: consumerCode,
            businessService: service,
            totalDue: billAmount ? billAmount : totalAmount,
            mobileNumber: userInfo?.mobileNumber,
            paidBy: userInfo?.name,
            tenantId: tenantId,
            mockEnabled: isMockEnabled,
          },
        },
        {}
      );
      if (gateway) {
        const status = await handleButtonClick(
          gateway?.payload?.url,
          gateway?.payload?.data,
          gateway?.payload?.headers,
          bill?.Bill?.[0]?.consumerCode,
          bill?.Bill?.[0]?.businessService,
          isMockEnabled,
          gateway
        );
        return status;
      } else {
        handleError("Error calling e-Treasury.");
        return false;
      }
    } catch (e) {
      throw e;
    }
  };

  const handleButtonClick = async (url, data, header, billConsumerCode, billBusinessService, isMockEnabled, gateway) => {
    if (isMockEnabled) {
      const apiUrl = `${window.location.origin}/epayments`;
      let jsonData = JSON.parse(data);
      const currentTimestamp = new Date().toISOString().replace(/\.(\d{3})Z$/, "Z");
      let jsonHeader = JSON.parse(header);

      const apiData = {
        RETURN_PARAMS: JSON.stringify({
          status: true,
          rek: "uL7gLH2LPfpaJOQKiCIFloyGClXDr2CQZ4GYnT5ECR6beeDnLqlMPudXSKtQ8CbX",
          data: JSON.stringify({
            GRN: gateway?.payload?.grn,
            DEPARTMENT_ID: jsonData["DEPARTMENT_ID"],
            CHALLANTIMESTAMP: currentTimestamp,
            BANKREFNO: "BANKREF987654321",
            CIN: "CIN0987654321",
            BANKTIMESTAMP: currentTimestamp,
            AMOUNT: jsonData["CHALLAN_AMOUNT"],
            STATUS: "N",
            BANK_CODE: "HDFC001",
            REMARKS: "Payment processed successfully",
            REMARK_STATUS: "PROCESSED",
            PARTYNAME: jsonData["PARTY_NAME"],
            OFFICECODE: jsonData["OFFICE_CODE"],
            DEFACE_FLAG: "N",
            ERROR: "",
            SERVICE_DEPT_CODE: jsonData["SERVICE_DEPT_CODE"],
          }),
          mockEnabled: true,
          hmac: "YjcxYjdkZDRmNzQ5NGFjODc2ZDhkMTM3NzBmMWViZmY5ODA4Y2ZkYjkzYTk2MzI2NjhkYWYzYTZkNDQzNzc3ZQ==",
        }),
        RETURN_HEADER: JSON.stringify({
          AuthToken: jsonHeader["authToken"],
        }),
      };

      const popup = window.open("", "popupWindow", "width=1000,height=1000,scrollbars=yes");
      if (popup) {
        const title = popup.document.createElement("h2");
        title.textContent = "Mock Payment in Progress. It will take 15-60 seconds";

        const message = popup.document.createElement("p");
        message.textContent = "Please wait while we process your payment. Pop up will close automatically after payment.";
        popup.document.body.appendChild(title);
        popup.document.body.appendChild(message);

        setPaymentLoader(true);
      }

      const checkBillStatus = async () => {
        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          });

          return new Promise((resolve) => {
            let retryCount = 0;
            const maxRetries = 6;

            const intervalId = setInterval(async () => {
              try {
                const billAfterPayment = await DRISTIService.callSearchBill(
                  {},
                  { tenantId, consumerCode: consumerCode || billConsumerCode, service: service || billBusinessService }
                );

                if (billAfterPayment?.Bill?.[0]?.status === "PAID") {
                  setPaymentLoader(false);
                  popup?.close();
                  clearInterval(intervalId);
                  resolve(PAID);
                } else {
                  retryCount++;
                  if (retryCount >= maxRetries) {
                    setPaymentLoader(false);
                    popup?.close();
                    clearInterval(intervalId);
                    resolve("FAILED");
                  }
                }
              } catch (error) {
                console.error("Error checking bill status:", error);
                retryCount++;
                if (retryCount >= maxRetries) {
                  setPaymentLoader(false);
                  popup?.close();
                  clearInterval(intervalId);
                  resolve("FAILED");
                }
              }
            }, 10000);
          });
        } catch (error) {
          console.error(error);
          setPaymentLoader(false);
          popup?.close();
          return "FAILED";
        }
      };

      const status = await checkBillStatus();

      if (!["applicationSubmission", "EfillingCase"?.includes(scenario)]) {
        setShowPaymentModal(false);
      }
      return status;
    } else {
      return new Promise((resolve) => {
        const popup = window.open("", "popupWindow", "width=1000,height=1000,scrollbars=yes");
        if (popup) {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = url;

          const inputDataField = document.createElement("input");
          inputDataField.type = "hidden";
          inputDataField.name = "input_data";
          inputDataField.value = data;
          form.appendChild(inputDataField);

          const inputHeadersField = document.createElement("input");
          inputHeadersField.type = "hidden";
          inputHeadersField.name = "input_headers";
          inputHeadersField.value = header;
          form.appendChild(inputHeadersField);

          popup.document.body.appendChild(form);
          form.submit();
          setPaymentLoader(true);
          popup.document.body.removeChild(form);
        }
        // Poll the bill status every second instead of waiting for the success popup's
        // auto-close. The moment the bill is PAID we close the popup and resolve(true),
        // so the user no longer waits out the success page timer.
        let isResolved = false;
        let pollCount = 0;
        let graceCount = 0;
        const maxPolls = 600; // safety cap (~10 min) so the interval can never run forever
        const graceAfterClose = 5; // keep polling ~5s after the user closes the popup, to let the async reconciliation catch up

        const finish = (intervalId, result) => {
          if (isResolved) return;
          isResolved = true;
          clearInterval(intervalId);
          setPaymentLoader(false);
          popup?.close();
          resolve(result);
        };

        const checkBillStatus = setInterval(async () => {
          pollCount++;
          try {
            const paymentStatusResponse = await DRISTIService.getPaymentStatus({}, { tenantId, consumerCode: consumerCode || billConsumerCode });
            const paymentStatusValue = paymentStatusResponse && paymentStatusResponse.PaymentStatus && paymentStatusResponse.PaymentStatus.status;
            if (paymentStatusValue === "PAID") {
              finish(checkBillStatus, "PAID");
              return;
            } else if (paymentStatusValue === "VERIFICATION_PENDING") {
              finish(checkBillStatus, "VERIFICATION_PENDING");
              return;
            }
          } catch (error) {
            console.error("Error checking bill status:", error);
          }

          // Once the user closes the popup, give the async reconciliation a short grace
          // window to mark the bill PAID before treating the attempt as failed.
          if (popup?.closed) {
            graceCount++;
            if (graceCount >= graceAfterClose) {
              finish(checkBillStatus, "FAILED");
              return;
            }
          }

          if (pollCount >= maxPolls) {
            finish(checkBillStatus, "FAILED");
          }
        }, 1000);
        if (!["applicationSubmission", "EfillingCase"?.includes(scenario)]) {
          setShowPaymentModal(false);
        }
      });
    }
  };
  const handleError = (message) => {
    toast.error(message);
  };

  return { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal, billPaymentStatus };
};

export default usePaymentProcess;
