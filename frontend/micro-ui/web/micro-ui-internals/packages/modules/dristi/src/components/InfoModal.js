import React from "react";
import Modal from "./Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

export const CloseBtn = (props) => {
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
        ...props?.style,
      }}
      className={props?.className}
    >
      <CloseSvg />
    </div>
  );
};

export const Heading = (props) => {
  return (
    <h1 className={props?.className || "heading-m"} style={props?.style}>
      {props.label}
    </h1>
  );
};

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
