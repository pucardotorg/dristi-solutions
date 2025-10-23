import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import React, { useCallback } from "react";

const SignatureSuccessModal = ({
  t,
  handleCancel,
  handleSubmit,
  title = "ADD_SIGNATURE",
  cancelLabel = "CS_COMMON_BACK",
  submitLabel = "SUBMIT_BUTTON",
  noteText = "YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE_BAIL_BOND",
  signedText = "SIGNED",
  yourSignatureText = "YOUR_SIGNATURE",
  className = "add-signature-modal",
  containerStyle = {},
  headingStyle = {},
  signedBadgeStyle = {},
  infoCardStyle = {},
}) => {
  const Heading = useCallback((props) => {
    return (
      <div className="evidence-title">
        <h1 className="heading-m">{props.label}</h1>
      </div>
    );
  }, []);

  const CloseBtn = useCallback((props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  }, []);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  return (
    <Modal
      headerBarMain={<Heading label={t(title)} />}
      headerBarEnd={<CloseBtn onClick={handleCancel} />}
      actionCancelLabel={t(cancelLabel)}
      actionCancelOnSubmit={handleCancel}
      actionSaveLabel={t(submitLabel)}
      actionSaveOnSubmit={handleSubmit}
      className={className}
    >
      <div className="add-signature-main-div" style={containerStyle}>
        <InfoCard
          variant={"default"}
          label={t("PLEASE_NOTE")}
          additionalElements={[<p key="note">{t(noteText)}</p>]}
          inline
          textStyle={infoCardStyle}
          className={`custom-info-card`}
        />
        <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "Roboto",
              fontSize: "24px",
              fontWeight: 700,
              lineHeight: "28.13px",
              textAlign: "left",
              color: "#3d3c3c",
              ...headingStyle,
            }}
          >
            {t(yourSignatureText)}
          </h1>
          <h2
            style={{
              margin: 0,
              fontFamily: "Roboto",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "16.41px",
              textAlign: "center",
              color: "#00703c;",
              padding: "6px",
              backgroundColor: "#e4f2e4;",
              borderRadius: "999px",
              ...signedBadgeStyle,
            }}
          >
            {t(signedText)}
          </h2>
        </div>
      </div>
    </Modal>
  );
};

export default SignatureSuccessModal;
