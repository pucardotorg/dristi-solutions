import React, { useState, useCallback, useMemo } from "react";
import Modal from "../../../components/Modal";
import { Dropdown, Loader, CloseSvg, TextArea, TextInput, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";
import { DRISTIService } from "../../../services";
import { Urls } from "../../../hooks";
import { sanitizeData } from "../../../Utils";

const INITIAL_PAYMENT_ITEM = { type: "", amount: "" };
const MIN_AMOUNT = 0;

const Heading = React.memo(({ label }) => <h1 className="heading-m">{label}</h1>);

const CloseBtn = React.memo(({ onClick, backgroundColor }) => (
  <div
    onClick={onClick}
    style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      paddingRight: "20px",
      cursor: "pointer",
      ...(backgroundColor && { backgroundColor }),
    }}
  >
    <CloseSvg />
  </div>
));

const CustomDeleteIcon = React.memo(() => (
  <svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 18.5C2.45 18.5 1.97917 18.3042 1.5875 17.9125C1.19583 17.5208 1 17.05 1 16.5V3.5H0V1.5H5V0.5H11V1.5H16V3.5H15V16.5C15 17.05 14.8042 17.5208 14.4125 17.9125C14.0208 18.3042 13.55 18.5 13 18.5H3ZM13 3.5H3V16.5H13V3.5ZM5 14.5H7V5.5H5V14.5ZM9 14.5H11V5.5H9V14.5Z"
      fill="#C62326"
    />
  </svg>
));

const PaymentItem = React.memo(({ item, index, paymentItems, paymentTypeOptions, amountError, t, onRemove, onChange }) => {
  const handleAmountKeyPress = useCallback((e) => {
    if (!/[0-9]/.test(e.key) && e.key !== "Backspace") {
      e.preventDefault();
    }
    if (e.target.value.length >= 8) {
      e.preventDefault();
    }
  }, []);

  return (
    <div className="payment-item">
      <div
        className="payment-item-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0px",
          borderBottom: "1px solid #BBBBBD",
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: "bold" }}>
          {t("ITEM")} {index + 1}
        </h1>
        {paymentItems.length > 1 && (
          <span
            onClick={() => onRemove(index)}
            className="item-delete-icon"
            style={{
              cursor: "pointer",
              color: "red",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CustomDeleteIcon />
          </span>
        )}
      </div>

      <LabelFieldPair>
        <CardLabel className="case-input-label">{t("Payment Type")}</CardLabel>
        <Dropdown
          t={t}
          option={paymentTypeOptions || []}
          optionKey="name"
          selected={item.type}
          select={(value) => onChange(index, "type", value)}
          style={{ marginBottom: "1px", width: "220px" }}
        />
      </LabelFieldPair>

      <LabelFieldPair>
        <CardLabel className="case-input-label">{t("Amount")}</CardLabel>
        <TextInput
          type="number"
          value={item.amount}
          onChange={(e) => onChange(index, "amount", e.target.value)}
          onKeyPress={handleAmountKeyPress}
          style={{ minWidth: 120, textAlign: "start" }}
        />
        {amountError[index] && <div style={{ color: "red", fontSize: "12px" }}>{t("CS_COMMON_AMOUNT_ERROR")}</div>}
      </LabelFieldPair>
    </div>
  );
});

const PaymentDemandModal = ({
  t,
  setShowPaymentDemandModal,
  setShowPaymentConfirmationModal,
  joinedLitigants,
  showPaymentConfirmationModal,
  showPaymentDemandModal,
  caseDetails,
  tenantId,
}) => {
  const [paymentItems, setPaymentItems] = useState([INITIAL_PAYMENT_ITEM]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [amountError, setAmountError] = useState({});
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stateId = useMemo(() => Digit.ULBService.getStateId(), []);

  const totalAmount = useMemo(() => paymentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0), [paymentItems]);
  const tomorrowDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  }, []);
  const isFormValid = useMemo(() => {
    const dueDateIsValid = dueDate && new Date(dueDate).getTime() >= new Date(tomorrowDate).getTime();
    return (
      selectedParty && dueDateIsValid && totalAmount < 100000000 && paymentItems.every((item) => item.type && parseFloat(item.amount) > MIN_AMOUNT)
    );
  }, [dueDate, tomorrowDate, selectedParty, totalAmount, paymentItems]);

  const { data: paymentTypeOptions, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(stateId, "payment", [{ name: "paymentDemandType" }], {
    select: (data) => data?.payment?.paymentDemandType || [],
  });

  const addItem = useCallback(() => {
    setPaymentItems((prev) => [...prev, { ...INITIAL_PAYMENT_ITEM }]);
  }, []);

  const removeItem = useCallback((index) => {
    setPaymentItems((prev) => prev.filter((_, i) => i !== index));
    setAmountError((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  }, []);

  const handleItemChange = useCallback((index, field, value) => {
    setPaymentItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });

    if (field === "amount") {
      setAmountError((prev) => ({
        ...prev,
        [index]: parseFloat(value) <= MIN_AMOUNT,
      }));
    }
  }, []);

  const handleModalClose = useCallback(() => {
    setShowPaymentDemandModal(false);
  }, [setShowPaymentDemandModal]);

  const handleProceed = useCallback(() => {
    if (isFormValid) {
      setShowPaymentDemandModal(false);
      setShowPaymentConfirmationModal(true);
    }
  }, [isFormValid, setShowPaymentDemandModal, setShowPaymentConfirmationModal]);

  const handleConfirmationClose = useCallback(() => {
    setShowPaymentConfirmationModal(false);
    setShowPaymentDemandModal(true);
  }, [setShowPaymentConfirmationModal, setShowPaymentDemandModal]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const breakDown = paymentItems.map((item) => ({
        code: item?.type?.code,
        name: item?.type?.name,
        amount: item?.amount,
        additionalParams: {},
      }));

      const dueDateTimestamp = new Date(dueDate).setHours(0, 0, 0, 0);

      const response = await DRISTIService.customApiService(Urls.case.taskCreate, {
        task: {
          workflow: {
            action: "CREATE",
            additionalDetails: {
              litigants: [selectedParty?.individualId],
            },
          },
          status: "",
          filingNumber: caseDetails?.filingNumber,
          cmpNumber: caseDetails?.cmpNumber,
          courtCaseNumber: (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) || caseDetails?.courtCaseNumber,
          taskDescription: comments || null,
          taskType: "GENERIC",
          duedate: dueDateTimestamp,
          tenantId,
          taskDetails: {
            genericTaskDetails: {
              feeBreakDown: {
                applicationId: null,
                tenantId: tenantId,
                totalAmount,
                breakDown,
              },
            },
          },
          assignedTo: [{ uuid: selectedParty?.partyUuid }, ...(selectedParty?.poaUuid ? [{ uuid: selectedParty?.poaUuid }] : [])],
        },
        tenantId,
      });

      setShowPaymentConfirmationModal(false);
    } catch (error) {
      console.error("Error creating payment demand:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, paymentItems, dueDate, caseDetails, tenantId, totalAmount, selectedParty, comments, setShowPaymentConfirmationModal]);

  const handleCommentChage = (e) => {
    const val = sanitizeData(e.target.value);
    setComments(val);
  };

  if (isOptionsLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      {showPaymentDemandModal && (
        <Modal
          headerBarMain={<Heading label={t("GENERATE_PAYMENT_DEMAND")} />}
          className="payment-demand-modal"
          popupModuleMianClassName="payment-demand-modal-main"
          headerBarEnd={<CloseBtn onClick={handleModalClose} />}
          actionSaveLabel={t("PROCEED")}
          actionCancelLabel={t("CS_EDIT_BACK")}
          isDisabled={!isFormValid}
          actionCancelOnSubmit={handleModalClose}
          actionSaveOnSubmit={handleProceed}
          style={{ backgroundColor: "#007E7E" }}
        >
          <div className="payment-demand-modal-body-main">
            <LabelFieldPair className="case-label-field-pair payment-demand" style={{ marginTop: "1px" }}>
              <CardLabel className="case-input-label">{t("PARTY")}</CardLabel>
              <Dropdown
                t={t}
                option={joinedLitigants || []}
                selected={selectedParty}
                optionKey="name"
                select={setSelectedParty}
                topbarOptionsClassName="top-bar-option"
                style={{ marginBottom: "1px", width: "220px" }}
              />
            </LabelFieldPair>

            {paymentItems.map((item, index) => (
              <PaymentItem
                key={index}
                item={item}
                index={index}
                paymentItems={paymentItems}
                paymentTypeOptions={paymentTypeOptions}
                amountError={amountError}
                t={t}
                onRemove={removeItem}
                onChange={handleItemChange}
              />
            ))}

            <button onClick={addItem} className="add-link">
              + Add Item
            </button>

            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("TOTAL_AMOUNT_DUE")}</CardLabel>
              <TextInput className="disabled" type="text" value={totalAmount} disabled style={{ minWidth: 120, textAlign: "start" }} />
              {totalAmount >= 100000000 && <div style={{ color: "red", fontSize: "12px" }}>{t("TOTAL_AMOUNT_EXCEEDS_LIMIT")}</div>}
            </LabelFieldPair>

            <LabelFieldPair className="case-label-field-pair">
              <CardLabel className="case-input-label">{t("DUE_DATE")}</CardLabel>
              <div className="date-arrow-group">
                <TextInput
                  className="home-input"
                  type="date"
                  min={tomorrowDate}
                  defaultValue={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ minWidth: 120, textAlign: "start" }}
                />
              </div>
              {dueDate && new Date(dueDate).getTime() < new Date(tomorrowDate).getTime() && (
                <div style={{ color: "red", fontSize: "12px" }}>{t("INVALID_DATE")}</div>
              )}
            </LabelFieldPair>

            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("OPTIONAL_COMMENTS")}</CardLabel>
              <TextArea rows="6" value={comments} onChange={handleCommentChage} style={{ maxWidth: "100%", height: "100px" }} />
            </LabelFieldPair>
          </div>
        </Modal>
      )}

      {showPaymentConfirmationModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_CREATION")} />}
          headerBarEnd={<CloseBtn onClick={isSubmitting ? null : handleConfirmationClose} is />}
          actionSaveLabel={t("EDIT_CONFIRM")}
          actionCancelLabel={t("CS_EDIT_BACK")}
          actionCancelOnSubmit={handleConfirmationClose}
          isBackButtonDisabled={isSubmitting}
          actionSaveOnSubmit={handleSubmit}
          isDisabled={isSubmitting}
          style={{ backgroundColor: "#007E7E" }}
        >
          {isSubmitting ? <Loader /> : <div style={{ margin: "16px 0px" }}>{t("CONFIRMATION_MSG")}</div>}
        </Modal>
      )}
    </React.Fragment>
  );
};

export default PaymentDemandModal;
