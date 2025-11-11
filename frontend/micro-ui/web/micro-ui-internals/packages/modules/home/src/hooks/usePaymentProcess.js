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
      return false;
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
                  resolve(true);
                } else {
                  retryCount++;
                  if (retryCount >= maxRetries) {
                    setPaymentLoader(false);
                    popup?.close();
                    clearInterval(intervalId);
                    resolve(false);
                  }
                }
              } catch (error) {
                console.error("Error checking bill status:", error);
                retryCount++;
                if (retryCount >= maxRetries) {
                  setPaymentLoader(false);
                  popup?.close();
                  clearInterval(intervalId);
                  resolve(false);
                }
              }
            }, 10000);
          });
        } catch (error) {
          console.error(error);
          setPaymentLoader(false);
          popup?.close();
          return false;
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
        let retryCount = 0;
        const maxRetries = 3;
        const checkPopupClosed = setInterval(async () => {
          if (popup.closed) {
            setPaymentLoader(false);
            if (retryCount < maxRetries) {
              retryCount++;
              const billAfterPayment = await DRISTIService.callSearchBill(
                {},
                { tenantId, consumerCode: consumerCode || billConsumerCode, service: service || billBusinessService }
              );
              if (billAfterPayment?.Bill?.[0]?.status === "PAID") {
                clearInterval(checkPopupClosed);
                resolve(true);
              } else if (retryCount === maxRetries) {
                clearInterval(checkPopupClosed);
                resolve(false);
              }
            } else {
              clearInterval(checkPopupClosed);
              resolve(false);
            }
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
