import { Modal } from "@egovernments/digit-ui-react-components";
import React from "react";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
function OrderItemDeleteModal({ t, deleteOrderItemIndex, setDeleteOrderItemIndex, handleDeleteOrderItem }) {
  const handleOnClose = () => {
    setDeleteOrderItemIndex(null);
  };

  return (
    <Modal
      headerBarMain={<Heading style={{ marginLeft: "24px" }} label={t("CONFIRM_DELETE_ITEM")} />}
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
