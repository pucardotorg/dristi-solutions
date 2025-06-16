import React, { useState, useEffect } from "react";
import Modal from "../../../components/Modal";
import { Toast, Loader, CloseSvg } from "@egovernments/digit-ui-react-components";
import { Dropdown, TextInput, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};
const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};
const CustomDeleteIcon = () => (
  <svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 18.5C2.45 18.5 1.97917 18.3042 1.5875 17.9125C1.19583 17.5208 1 17.05 1 16.5V3.5H0V1.5H5V0.5H11V1.5H16V3.5H15V16.5C15 17.05 14.8042 17.5208 14.4125 17.9125C14.0208 18.3042 13.55 18.5 13 18.5H3ZM13 3.5H3V16.5H13V3.5ZM5 14.5H7V5.5H5V14.5ZM9 14.5H11V5.5H9V14.5Z"
      fill="#C62326"
    />
  </svg>
);
const PaymentDemandModal = ({ t, setShowPaymentDemandModal, setShowPaymentConfirmationModal, joinedLitigants }) => {
  const [paymentItems, setPaymentItems] = useState([{ type: "", amount: "" }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedParty, setSelectedParty] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [amountError, setAmountError] = useState({});

  const addItem = () => {
    setPaymentItems([...paymentItems, { type: "", amount: "" }]);
  };

  const removeItem = (index) => {
    const newItems = paymentItems.filter((_, i) => i !== index);
    setPaymentItems(newItems);
  };

  const handleChange = (index, field, value) => {
    const newItems = [...paymentItems];
    newItems[index][field] = value;
    setPaymentItems(newItems);

    if (field === "amount") {
      if (parseFloat(value) <= 0) {
        setAmountError((prev) => ({ ...prev, [index]: true }));
      } else {
        setAmountError((prev) => ({ ...prev, [index]: false }));
      }
    }
  };

  useEffect(() => {
    const total = paymentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setTotalAmount(total);
  }, [paymentItems]);

  const stateId = React.useMemo(() => Digit.ULBService.getStateId(), []);

  const { data: paymentTypeOptions, isLoading: isOptionsLoading } = Digit.Hooks.useCustomMDMS(stateId, "payment", [{ name: "paymentDemandType" }], {
    select: (data) => {
      return data?.payment?.paymentDemandType || [];
    },
  });

  const isFormValid = () => {
    return selectedParty && dueDate && paymentItems.every((item) => item.type && parseFloat(item.amount) > 0);
  };

  return (
    <Modal
      headerBarMain={<Heading label={t("GENERATE_PAYMENT_DEMAND")} />}
      className={"payment-demand-modal"}
      popupModuleMianClassName={"payment-demand-modal-main"}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowPaymentDemandModal(false);
          }}
        />
      }
      actionSaveLabel={t("EDIT_CONFIRM")}
      actionCancelLabel={t("CS_EDIT_BACK")}
      isDisabled={!isFormValid()}
      actionCancelOnSubmit={() => {
        setShowPaymentDemandModal(false);
      }}
      style={{
        backgroundColor: "#007E7E",
      }}
      actionSaveOnSubmit={() => {
        if (isFormValid()) {
          setShowPaymentDemandModal(false);
          setShowPaymentConfirmationModal(true);
        }
      }}
    >
      {isOptionsLoading ? (
        <Loader />
      ) : (
        <div className="payment-demand-modal-body-main">
          <LabelFieldPair className={`case-label-field-pair payment-demand `} style={{ marginTop: "1px" }}>
            <CardLabel className="case-input-label">{`${t("PARTY")}`}</CardLabel>
            <Dropdown
              t={t}
              option={joinedLitigants ? joinedLitigants : []}
              selected={selectedParty}
              optionKey={"name"}
              select={(e) => {
                setSelectedParty(e);
              }}
              topbarOptionsClassName={"top-bar-option"}
              style={{
                marginBottom: "1px",
                width: "220px",
              }}
            />
          </LabelFieldPair>

          {paymentItems.map((item, index) => (
            <div key={index} className="payment-item">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0px",
                }}
              >
                <h1 style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {t("ITEM")} {index + 1}
                </h1>
                {paymentItems.length > 1 && (
                  <span
                    onClick={() => removeItem(index)}
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
                <CardLabel className="case-input-label">{`${t("Payment Type")}`}</CardLabel>
                <Dropdown
                  t={t}
                  option={paymentTypeOptions || []}
                  optionKey={"name"}
                  select={(e) => handleChange(index, "type", e)}
                  style={{ marginBottom: "1px", width: "220px" }}
                />
              </LabelFieldPair>
              <LabelFieldPair>
                <CardLabel className="case-input-label">{`${t("Amount")}`}</CardLabel>
                <TextInput
                  type="number"
                  value={item.amount}
                  onChange={(e) => handleChange(index, "amount", e.target.value)}
                  onKeyPress={(e) => {
                    if (!/[0-9.]/.test(e.key) && e.key !== "Backspace") {
                      e.preventDefault();
                    }
                    if (e.key === "." && item.amount.includes(".")) {
                      e.preventDefault();
                    }
                  }}
                  style={{ minWidth: 120, textAlign: "center" }}
                />
                {amountError[index] && <div style={{ color: "red", fontSize: "12px" }}>Amount should be more than 0</div>}
              </LabelFieldPair>
            </div>
          ))}
          <button onClick={addItem} className="add-link">
            {"+   Add Item"}
          </button>

          <LabelFieldPair className={`case-label-field-pair `}>
            <CardLabel className="case-input-label" style={{ paddingLeft: "30px" }}>{`${t("Date")}`}</CardLabel>
            <div className="date-arrow-group">
              <TextInput
                className="home-input"
                key={"date"}
                type={"date"}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setDueDate(e.target.value);
                }}
                style={{ minWidth: 120, textAlign: "center" }}
              />
            </div>
          </LabelFieldPair>
          <LabelFieldPair>
            <CardLabel className="case-input-label">{`${t("Total Amount Due")}`}</CardLabel>
            <TextInput className="disabled" type="text" value={totalAmount} disabled style={{ minWidth: 120, textAlign: "center" }} />
          </LabelFieldPair>
        </div>
      )}
    </Modal>
  );
};

export default PaymentDemandModal;
