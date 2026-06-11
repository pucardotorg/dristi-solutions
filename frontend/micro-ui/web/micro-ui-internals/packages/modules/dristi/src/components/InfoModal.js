import PropTypes from "prop-types";
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

InfoModal.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  heading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  isDisabled: PropTypes.bool,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onPrimaryClick: PropTypes.func,
  onSecondaryClick: PropTypes.func.isRequired,
  primaryLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  secondaryLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  showCloseIcon: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default InfoModal;
