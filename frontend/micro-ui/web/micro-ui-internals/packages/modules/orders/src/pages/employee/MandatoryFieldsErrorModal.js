import { CloseSvg, Modal } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";

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

function MandatoryFieldsErrorModal({ t, showMandatoryFieldsErrorModal, setShowMandatoryFieldsErrorModal }) {
  const handleOnClose = () => {
    setShowMandatoryFieldsErrorModal({ showModal: false, errorsData: [] });
  };

  return (
    <Modal
      headerBarMain={<Heading label={t("PLEASE_CORRECT_THESE_FIELD_BEFORE_REVIEWING_ORDER")} />}
      headerBarEnd={<CloseBtn onClick={handleOnClose} />}
      actionSaveLabel={t("CS_CLOSE")}
      actionSaveOnSubmit={handleOnClose}
      popUpStyleMain={{ zIndex: "1000" }}
    >
      <div>
        {showMandatoryFieldsErrorModal?.errorsData?.map((data) => {
          return data?.errors?.length > 0 ? (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ diaplay: "flex", flexDirection: "row", marginBottom: "5px", fontWeight: "bold" }}>
                <h1>{`${t("ORDER_ITEM")} : ${data?.index + 1}`}</h1>
                <h1>{`${t("ORDER_TYPE")} : ${t(data?.orderType)}`}</h1>
              </div>
              <div>
                {data?.errors?.map((err) => {
                  return (
                    <div>
                      <h1>{`${t("ORDER_FIELD")} : ${t(err?.key)}`}</h1>
                      <h1>{`${t("FIELD_ERROR")} : ${t(err?.errorMessage)}`}</h1>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div></div>
          );
        })}
      </div>
    </Modal>
  );
}

export default MandatoryFieldsErrorModal;
