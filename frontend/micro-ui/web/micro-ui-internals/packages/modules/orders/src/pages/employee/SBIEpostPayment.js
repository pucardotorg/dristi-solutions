import React, { useState, useCallback, useEffect } from "react";
import { Loader } from "@egovernments/digit-ui-components";
import { useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { SBIPaymentService } from "../../hooks/services";
import { Modal, Button, CardText, RadioButtons, CardLabel, LabelFieldPair } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";

const modeOptions = [
  { label: "Net Banking", value: "NB" },
  { label: "Credit Card", value: "CC" },
  { label: "Debit Card", value: "DC" },
  { label: "Wallet", value: "WALLET" },
  { label: "Prepaid Cards", value: "PC" },
  { label: "PayPal", value: "PAYPAL" },
  { label: "UPI", value: "UPI" },
];

const SBIEpostPayment = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [selectedOption, setSelectedOption] = useState({});
  const [optionLoader, setOptionLoader] = useState(true);
  const [paymentLoader, setPaymentLoader] = useState(false);
  const bill = location.state.state.billData;
  const serviceNumber = location?.state?.state?.serviceNumber;
  const businessService = location?.state?.state?.businessService;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info;
  const caseDetails = location?.state?.state?.caseDetails;
  const orderData = location?.state?.state?.orderData;
  const partyIndex = location?.state?.state?.partyIndex;
  const consumerCode = location?.state?.state?.consumerCode;
  const filteredTasks = location?.state?.state?.filteredTasks;
  const filingNumber = location?.state?.state?.filingNumber;
  const isCourtBillPaid = location?.state?.state?.isCourtBillPaid;
  const hearingId = location?.state?.state?.hearingId;
  const orderType = location?.state?.state?.orderType;
  const [isCaseLocked, setIsCaseLocked] = useState(false);
  const [payOnlineButtonTitle, setPayOnlineButtonTitle] = useState("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");

  let history = useHistory();

  const { data: ePostBillResponse, isLoading: isEPOSTBillLoading, refetch: refetchBill } = Digit.Hooks.dristi.useBillSearch(
    {},
    {
      tenantId,
      consumerCode: consumerCode,
      service: bill?.Bill?.[0]?.businessService,
    },
    `${consumerCode}_POST_PROCESS_${bill?.Bill?.[0]?.businessService}`,
    Boolean(orderType)
  );
  const fetchCaseLockStatus = useCallback(async () => {
    try {
      const status = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: caseDetails?.filingNumber,
          tenantId: tenantId,
        }
      );
      setIsCaseLocked(status?.Lock?.isLocked);
    } catch (error) {
      console.error("Error fetching case lock status", error);
    }
  });
  useEffect(() => {
    if (caseDetails?.filingNumber) {
      fetchCaseLockStatus();
    }
  }, [caseDetails?.filingNumber]);

  const onSBIPayment = async () => {
    setPaymentLoader(true);
    let status;
    try {
      const { data: freshBillResponse } = await refetchBill();
      if (freshBillResponse?.Bill?.[0]?.status === "PAID") {
        setIsCaseLocked(true);
        setPayOnlineButtonTitle("CS_BUTTON_PAY_ONLINE_NO_PENDING_PAYMENT");
        return;
      }
      const caseLockStatus = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: caseDetails?.filingNumber,
          tenantId: tenantId,
        }
      );
      if (caseLockStatus?.Lock?.isLocked) {
        setIsCaseLocked(true);
        setPayOnlineButtonTitle("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");
        return;
      }
      await DRISTIService.setCaseLock({ Lock: { uniqueId: caseDetails?.filingNumber, tenantId: tenantId, lockType: "PAYMENT" } }, {});

      const gateway = await SBIPaymentService.SBIPayment(
        {
          TransactionDetails: {
            OperatingMode: "DOM",
            MerchantCountry: "IN",
            MerchantCurrency: "INR",
            PostingAmount: bill?.Bill?.[0]?.totalAmount,
            OtherDetails: "NA",
            PayMode: "NB",
            billId: bill?.Bill?.[0]?.billDetails?.[0]?.billId,
            tenantId: "kl",
            totalDue: bill?.Bill?.[0]?.totalAmount,
            businessService: businessService,
            serviceNumber: serviceNumber,
            mobileNumber: userInfo?.mobileNumber,
            paidBy: userInfo?.name,
            payerName: userInfo?.name,
            amountDetails: [
              {
                accountIdentifier: "GRPT",
                postingAmount: bill?.Bill?.[0]?.totalAmount,
                merchantCurrency: "INR",
              },
            ],
          },
        },
        {}
      );
      await DRISTIService.setCaseUnlock({}, { uniqueId: caseDetails?.filingNumber, tenantId: tenantId });

      if (gateway) {
        const receiptData = {
          caseInfo: [
            {
              key: "Case Name & ID",
              value: `${caseDetails?.caseTitle} & ${caseDetails?.filingNumber}`,
              copyData: false,
            },
            {
              key: "ORDER ID",
              value: orderData?.list?.[0]?.orderNumber,
              copyData: false,
            },
          ],
          isArrow: false,
          showTable: true,
          showCopytext: true,
          service: businessService,
          consumerCode: consumerCode,
          filingNumber: filingNumber,
          filteredTasks: filteredTasks,
          orderNumber: orderData?.list?.[0]?.orderNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCourtBillPaid: isCourtBillPaid,
          hearingId: hearingId,
          orderType: orderType,
          partyIndex: orderType === "NOTICE" && partyIndex,
        };

        sessionStorage.setItem("paymentReceiptData", JSON.stringify({ receiptData }));
        await handleButtonClick(gateway?.transactionUrl, gateway.encryptedMultiAccountString, gateway?.encryptedString, gateway?.merchantId);
        setPaymentLoader(false);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleButtonClick = (transactionalUrl, multiAccountInstructionDtls, encryptedString, merchantId) => {
    return new Promise((resolve) => {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = transactionalUrl;

      const inputDataField = document.createElement("input");
      inputDataField.type = "hidden";
      inputDataField.name = "MultiAccountInstructionDtls";
      inputDataField.value = multiAccountInstructionDtls;
      form.appendChild(inputDataField);

      const inputDataField2 = document.createElement("input");
      inputDataField2.type = "hidden";
      inputDataField2.name = "EncryptTrans";
      inputDataField2.value = encryptedString;
      form.appendChild(inputDataField2);

      const inputHeadersField = document.createElement("input");
      inputHeadersField.type = "hidden";
      inputHeadersField.name = "merchIdVal";
      inputHeadersField.value = merchantId;
      form.appendChild(inputHeadersField);

      window.document.body.appendChild(form);
      form.submit();

      setPaymentLoader(true);
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  };

  return (
    <div>
      {paymentLoader ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Loader />
        </div>
      ) : (
        <div className="payment-for-summon">
          <LabelFieldPair className="case-label-field-pair">
            <div className="join-case-tooltip-wrapper">
              <CardLabel className="case-input-label">{t("Select preferred mode of Payment")}</CardLabel>
            </div>
            <RadioButtons
              options={modeOptions}
              optionsKey={"label"}
              onSelect={(value) => {
                setSelectedOption(value);
              }}
              selectedOption={selectedOption}
              disabled={false}
            />
          </LabelFieldPair>
          <ButtonSelector
            style={{ border: "1px solid" }}
            label={t("SBI_PAYMENT")}
            onSubmit={onSBIPayment}
            isDisabled={paymentLoader || isCaseLocked}
            title={isCaseLocked ? t(payOnlineButtonTitle) : ""}
            textStyles={{ margin: "0px" }}
          />
        </div>
      )}
    </div>
  );
};

export default SBIEpostPayment;
