import { Modal } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
function MandatoryFieldsErrorModal({ t, showMandatoryFieldsErrorModal, setShowMandatoryFieldsErrorModal }) {
  const handleOnClose = () => {
    setShowMandatoryFieldsErrorModal({ showModal: false, errorsData: [] });
  };

  return (
    <Modal
      headerBarMain={<Heading style={{ marginLeft: "24px" }} label={t("PLEASE_CORRECT_THESE_FIELD_BEFORE_REVIEWING_ORDER")} />}
      headerBarEnd={<CloseBtn onClick={handleOnClose} />}
      actionSaveLabel={t("CS_CLOSE")}
      actionSaveOnSubmit={handleOnClose}
      popUpStyleMain={{ zIndex: "1000" }}
    >
      <div>
        {showMandatoryFieldsErrorModal?.errorsData?.map((data, dataIndex) => {
          return data?.errors?.length > 0 ? (
            <div key={`error-item-${dataIndex}`} style={{ marginBottom: "20px" }} className="orders-mandatory-fields-error-modal">
              <div>
                <span style={{ display: "flex", flexDirection: "row" }}>
                  <h1 style={{ fontWeight: "bold", marginRight: "5px" }}>{`${t("ORDER_ITEM")} :`}</h1>
                  <h1>{`${data?.index + 1}`}</h1>
                </span>
                <span style={{ display: "flex", flexDirection: "row" }}>
                  <h1 style={{ fontWeight: "bold", marginRight: "5px" }}>{`${t("ORDER_TYPE")} :`}</h1>
                  <h1>{`${t(data?.orderType)}`}</h1>
                </span>
              </div>
              <div>
                {data?.errors?.map((err, errIndex) => {
                  return (
                    <div key={`error-detail-${dataIndex}-${errIndex}`}>
                      <div style={{ display: "flex", flexDirection: "row", gap: "10px", height: "35px" }}>
                        <span style={{ display: "flex", flexDirection: "row" }}>
                          <h1 style={{ fontWeight: "bold", marginRight: "5px" }}>{`${t("ORDER_FIELD")} :`}</h1>
                          <h1>{`${t(err?.key)}, `}</h1>
                        </span>
                        <span style={{ display: "flex", flexDirection: "row" }}>
                          <h1 style={{ fontWeight: "bold", marginRight: "5px" }}>{`${t("FIELD_ERROR")} :`}</h1>
                          <h1>{`${t(err?.errorMessage)}`}</h1>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div key={`empty-error-${dataIndex}`}></div>
          );
        })}
      </div>
    </Modal>
  );
}

export default MandatoryFieldsErrorModal;
