import React, { useMemo } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
function OrderDeleteModal({ setDeleteOrderIndex, deleteOrderIndex, handleDeleteOrder, t }) {
  const deleteWarningText = useMemo(() => {
    return (
      <div className="delete-warning-text">
        <h3>{`${t("THIS_CAN_NOT_BE_REVERSED")}`}</h3>
      </div>
    );
  }, []);
  
  return (
    <Modal
      headerBarMain={<Heading label={t("ARE_YOU_SURE_TO_DELETE_ORDER")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setDeleteOrderIndex(null);
          }}
        />
      }
      actionCancelLabel={t("CS_COMMON_CANCEL")}
      actionCancelOnSubmit={() => {
        setDeleteOrderIndex(null);
      }}
      actionSaveLabel={t("DELETE_ORDER")}
      children={deleteWarningText}
      actionSaveOnSubmit={() => {
        handleDeleteOrder(deleteOrderIndex);
      }}
      style={{ height: "40px" }}
    ></Modal>
  );
}

export default OrderDeleteModal;
