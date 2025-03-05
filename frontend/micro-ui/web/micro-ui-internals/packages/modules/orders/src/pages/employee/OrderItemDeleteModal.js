import { CloseSvg, Modal } from "@egovernments/digit-ui-react-components";
import React from "react";

const Heading = (props) => {
  return (
    <h1 className="heading-m" style={{ marginLeft: "24px" }}>
      {props.label}
    </h1>
  );
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

function OrderItemDeleteModal({ t, deleteOrderItemIndex, setDeleteOrderItemIndex, handleDeleteOrderItem }) {
  const handleOnClose = () => {
    setDeleteOrderItemIndex(null);
  };

  return (
    <Modal
      headerBarMain={<Heading label={t("CONFIRM_DELETE_ITEM")} />}
      headerBarEnd={<CloseBtn onClick={handleOnClose} />}
      actionSaveLabel={t("DELETE_ORDER_ITEM")}
      actionSaveOnSubmit={() => handleDeleteOrderItem(deleteOrderItemIndex)}
      actionCancelOnSubmit={handleOnClose}
      actionCancelLabel={t("CS_BACK")}
      popUpStyleMain={{ zIndex: "1000" }}
    >
      <div>
        <h2>{t("ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_ITEM")}</h2>
      </div>
    </Modal>
  );
}

export default OrderItemDeleteModal;
