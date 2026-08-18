import React from "react";
import Modal from "./Modal";
import { CloseBtn, Heading } from "./ModalComponents";

const InfoModal = ({
  t,
  heading,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  className,
  isDisabled = false,
  showCloseIcon = true,
  children,
}) => {
  const translate = (key) => (t && key ? t(key) : key);

  return (
    <Modal
      headerBarMain={<Heading label={translate(heading)} />}
      headerBarEnd={showCloseIcon ? <CloseBtn onClick={onSecondaryClick} /> : null}
      actionCancelLabel={secondaryLabel ? translate(secondaryLabel) : null}
      actionCancelOnSubmit={onSecondaryClick}
      actionSaveLabel={primaryLabel ? translate(primaryLabel) : null}
      actionSaveOnSubmit={onPrimaryClick}
      isDisabled={isDisabled}
      className={className}
    >
      {children || (message && <p className="info-modal-message">{translate(message)}</p>)}
    </Modal>
  );
};

export default InfoModal;
