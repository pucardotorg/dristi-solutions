import React from "react";
import { Button } from "@egovernments/digit-ui-react-components";
import { InfoCard } from "@egovernments/digit-ui-components";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { SignModalCloseBtn, SignModalHeading } from "./signModalChrome";

const signedLabelStyle = {
  margin: 0,
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "16.41px",
  textAlign: "center",
  color: "#00703c",
  padding: "6px",
  backgroundColor: "#e4f2e4",
  borderRadius: "999px",
};

const signedTitleStyle = {
  margin: 0,
  fontFamily: "Roboto",
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: "28.13px",
  textAlign: "left",
  color: "#3d3c3c",
};

/**
 * Shared stepper step: choose e-sign or upload (witness deposition, bail bond, digital document).
 */
export const DocumentSignaturePickerModal = ({
  Modal,
  t,
  onCancel,
  noteElement,
  onESignClick,
  onOpenUpload,
  downloadHeadingKey,
  uri,
  downloadFileName,
}) => (
  <Modal
    headerBarMain={<SignModalHeading label={t("ADD_SIGNATURE")} />}
    headerBarEnd={<SignModalCloseBtn onClick={onCancel} />}
    actionCancelLabel={t("CS_COMMON_BACK")}
    actionCancelOnSubmit={onCancel}
    actionSaveLabel={t("CS_COMMON_SUBMIT")}
    isDisabled
    actionSaveOnSubmit={() => {}}
    className="add-signature-modal"
  >
    <div className="add-signature-main-div">
      <div className="not-signed">
        <InfoCard variant={"default"} label={t("PLEASE_NOTE")} additionalElements={[noteElement]} inline textStyle={{}} className={`custom-info-card`} />
        <h1>{t("YOUR_SIGNATURE")}</h1>
        <div className="sign-button-wrap">
          <Button label={t("CS_ESIGN")} onButtonClick={onESignClick} className="aadhar-sign-in" labelClassName="aadhar-sign-in" />
          <Button
            icon={<FileUploadIcon />}
            label={t("UPLOAD_DIGITAL_SIGN_CERTI")}
            onButtonClick={onOpenUpload}
            className="upload-signature"
            labelClassName="upload-signature-label"
          />
        </div>
        {downloadHeadingKey && uri ? (
          <div className="donwload-submission">
            <h2>{t(downloadHeadingKey)}</h2>
            <AuthenticatedLink
              uri={uri}
              style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }}
              displayFilename={"CLICK_HERE"}
              t={t}
              pdf={true}
              name={downloadFileName}
            />
          </div>
        ) : null}
      </div>
    </div>
  </Modal>
);

/**
 * Shared stepper step: signature captured, ready to submit.
 */
export const DocumentSignatureSignedModal = ({ Modal, t, onCancel, onSubmit, noteElement }) => (
  <Modal
    headerBarMain={<SignModalHeading label={t("ADD_SIGNATURE")} />}
    headerBarEnd={<SignModalCloseBtn onClick={onCancel} />}
    actionCancelLabel={t("CS_COMMON_BACK")}
    actionCancelOnSubmit={onCancel}
    actionSaveLabel={t("SUBMIT_BUTTON")}
    actionSaveOnSubmit={onSubmit}
    className="add-signature-modal"
  >
    <div className="add-signature-main-div">
      <InfoCard variant={"default"} label={t("PLEASE_NOTE")} additionalElements={[noteElement]} inline textStyle={{}} className={`custom-info-card`} />
      <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
        <h1 style={signedTitleStyle}>{t("YOUR_SIGNATURE")}</h1>
        <h2 style={signedLabelStyle}>{t("SIGNED")}</h2>
      </div>
    </div>
  </Modal>
);
