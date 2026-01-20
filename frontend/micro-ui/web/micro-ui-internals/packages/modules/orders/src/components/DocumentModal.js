import { CloseSvg } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";

const submitButtonTextStyle = {
  fontFamily: "Roboto",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "18.75px",
  textAlign: "center",
  margin: "0px",
};

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer", ...props?.style }}
    >
      <CloseSvg />
    </div>
  );
};
const Heading = ({ heading, isStatus = true }) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{heading.label}</h1>
      {isStatus && <h3 className={heading.isStatusRed ? "status-false" : "status"}>{heading?.status}</h3>}
    </div>
  );
};
const DocumentModal = ({ config, setShow, currentStep, documentStyle = {}, disableCancel = false }) => {
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const [step, setStep] = useState(currentStep || 0);
  // const [isDisabled, setIsDisabled] = useState(false);

  const isDisabled = useMemo(() => {
    if (config?.isStepperModal) return config?.steps[step]?.isDisabled;
    return config?.isDisabled;
  }, [config?.isDisabled, config?.isStepperModal, config?.steps, step]);

  const actionSaveOnSubmit = async () => {
    let action = {};
    if (config?.isStepperModal && config?.steps[step]?.actionSaveOnSubmit) {
      if (config?.steps?.[step]?.async === true) {
        action = await config?.steps[step]?.actionSaveOnSubmit();
      } else config?.steps[step]?.actionSaveOnSubmit();
    } else if (config?.actionSaveOnSubmit) config?.actionSaveOnSubmit();
    if (step + 1 < config?.steps?.length) {
      if (config?.steps?.[step]?.async === true) {
        if (action?.continue === true) setStep(step + 1);
      } else setStep(step + 1);
    }
  };

  const actionCancelOnSubmit = () => {
    if (disableCancel) return;
    if (config?.isStepperModal) {
      const { actionCancelType, actionCancelOnSubmit, jumpValue } = config?.steps[step] || {};

      if (actionCancelType === "SKIP") {
        setStep(step + 1);
      } else {
        if (actionCancelOnSubmit) actionCancelOnSubmit();

        if (actionCancelType === "JUMP" && jumpValue && jumpValue > 0) {
          const newStep = step - jumpValue;
          setStep(newStep >= 0 ? newStep : 0);
        } else {
          const newStep = step - 1;
          setStep(newStep >= 0 ? newStep : 0);
        }
      }
    } else {
      if (config?.actionCancelOnSubmit) config?.actionCancelOnSubmit();
      const newStep = step - 1;
      setStep(newStep >= 0 ? newStep : 0);
    }
  };

  const modalClassName =
    config?.className ||
    (config?.isStepperModal
      ? config.steps[step]?.type === "document"
        ? "custom-modal-stepper"
        : config.steps[step]?.type === "modal" || config.steps[step]?.type === "payment"
        ? config.steps[step]?.className
        : "custom-modal-stepper-non-doc"
      : config?.type === "document"
      ? "custom-modal-stepper"
      : "custom-modal-stepper-non-doc");

  return (
    <Modal
      headerBarEnd={
        (config?.isStepperModal && (config?.steps[step]?.handleClose || config?.handleClose)) || (!config?.isStepperModal && config?.handleClose) ? (
          <CloseBtn
            onClick={!disableCancel && (config?.isStepperModal ? config?.steps[step]?.handleClose || config?.handleClose : config?.handleClose)}
            style={config?.isStepperModal ? config?.steps[step]?.closeBtnStyle || config?.closeBtnStyle : config?.closeBtnStyle}
          />
        ) : undefined
      }
      actionSaveLabel={config?.isStepperModal ? config?.steps[step]?.actionSaveLabel || config?.actionSaveLabel : config?.actionSaveLabel}
      actionSaveOnSubmit={actionSaveOnSubmit}
      hideSubmit={config?.isStepperModal ? config?.steps[step]?.hideSubmit || config?.hideSubmit : config?.hideSubmit}
      hideCancel={config?.isStepperModal ? config?.steps[step]?.hideCancel || config?.hideCancel : config?.hideCancel}
      actionCancelLabel={config?.isStepperModal ? config?.steps[step]?.actionCancelLabel || config?.actionCancelLabel : config?.actionCancelLabel}
      actionCancelOnSubmit={actionCancelOnSubmit}
      cancelTheme={config?.isStepperModal ? config?.steps[step]?.cancelTheme || config?.cancelTheme : config?.cancelTheme}
      formId="modal-action"
      headerBarMain={
        config?.isStepperModal && config?.steps[step]?.type !== "success" ? (
          <Heading heading={config?.steps[step]?.heading || config?.heading} isStatus={config?.steps[step]?.isStatus} />
        ) : !config?.isStepperModal ? (
          <Heading heading={config?.heading} />
        ) : (
          ""
        )
      }
      hideModalActionbar={config?.isStepperModal ? config?.steps[step]?.hideModalActionbar || false : config?.hideModalActionbar || false}
      className={modalClassName}
      popUpStyleMain={documentStyle}
      isDisabled={isDisabled}
      textStyle={submitButtonTextStyle}
      style={
        config?.isStepperModal ? (config.steps[step]?.actionSaveLableType === "WARNING" ? { backgroundColor: "#BB2C2F", border: "none" } : {}) : {}
      }
    >
      {config?.isStepperModal ? config?.steps[step]?.modalBody || config?.modalBody : config?.modalBody}
    </Modal>
  );
};

export default DocumentModal;
