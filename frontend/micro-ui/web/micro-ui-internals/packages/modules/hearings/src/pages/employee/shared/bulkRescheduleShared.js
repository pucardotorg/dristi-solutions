import React from "react";
import { Button, Loader } from "@egovernments/digit-ui-react-components";
import { InfoCard } from "@egovernments/digit-ui-components";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { UploadModal } from "@egovernments/digit-ui-module-common";

const BULK_RESCHEDULE_SESSION_FIELDS = [
  { key: "bulkNotificationStepper", parse: (v) => parseInt(v), defaultValue: null },
  { key: "bulkNotificationFormData", parse: JSON.parse, defaultValue: null },
  { key: "bulkOldHearingData", parse: JSON.parse, defaultValue: null },
  { key: "bulkNewHearingData", parse: JSON.parse, defaultValue: [] },
  { key: "bulkNotificationNumber", parse: JSON.parse, defaultValue: null },
  { key: "bulkNotificationFileStoreId", parse: JSON.parse, defaultValue: null },
];

const BULK_RESCHEDULE_HOME_EXTRA_FIELDS = [{ key: "bulkAllHearingsData", parse: JSON.parse, defaultValue: null }];

export const loadBulkRescheduleSession = ({ includeHomeFields = false } = {}) => {
  const fields = includeHomeFields ? [...BULK_RESCHEDULE_SESSION_FIELDS, ...BULK_RESCHEDULE_HOME_EXTRA_FIELDS] : BULK_RESCHEDULE_SESSION_FIELDS;
  return fields.reduce((acc, field) => {
    const raw = sessionStorage.getItem(field.key);
    acc[field.key] = raw ? field.parse(raw) : field.defaultValue;
    return acc;
  }, {});
};

export const clearBulkRescheduleSession = ({ includeHomeFields = false } = {}) => {
  BULK_RESCHEDULE_SESSION_FIELDS.forEach((field) => sessionStorage.removeItem(field.key));
  if (includeHomeFields) {
    BULK_RESCHEDULE_HOME_EXTRA_FIELDS.forEach((field) => sessionStorage.removeItem(field.key));
    sessionStorage.removeItem("homeActiveTab");
  }
};

export const saveBulkRescheduleSession = ({
  stepper,
  formData,
  oldHearingData,
  newHearingData,
  notificationNumber,
  fileStoreId,
  allHearingsData,
  homeActiveTab,
}) => {
  sessionStorage.setItem("bulkNotificationStepper", parseInt(stepper));
  sessionStorage.setItem("bulkNotificationFormData", JSON.stringify(formData));
  sessionStorage.setItem("bulkOldHearingData", JSON.stringify(oldHearingData));
  sessionStorage.setItem("bulkNewHearingData", JSON.stringify(newHearingData));
  sessionStorage.setItem("bulkNotificationNumber", JSON.stringify(notificationNumber));
  sessionStorage.setItem("bulkNotificationFileStoreId", JSON.stringify(fileStoreId));
  if (allHearingsData !== undefined) {
    sessionStorage.setItem("bulkAllHearingsData", JSON.stringify(allHearingsData));
  }
  if (homeActiveTab) {
    sessionStorage.setItem("homeActiveTab", homeActiveTab);
  }
};

export const bulkRescheduleSignatureOnSelect = (setSignFormData, setIsSigned, setFileUploadError) => (key, value) => {
  if (value?.Signature === null) {
    setSignFormData({});
    setIsSigned(false);
  } else {
    setSignFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  }
  setFileUploadError(null);
};

export const NotificationSignatureInfoCard = ({ t, marginBottom = "16px", extraStyle }) => (
  <InfoCard
    variant={"default"}
    label={t("PLEASE_NOTE")}
    additionalElements={[
      <p key="note">
        {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}
        <span style={{ fontWeight: "bold" }}>{`${t("NOTIFICATION")}`}</span>
      </p>,
    ]}
    inline
    style={{ marginBottom, ...extraStyle }}
    textStyle={{}}
    className={`custom-info-card`}
  />
);

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

const BulkNotificationUnsignedBody = ({ t, onBeforeEsign, setOpenUploadSignatureModal, uri }) => (
  <div className="add-signature-main-div">
    <div className="not-signed">
      <NotificationSignatureInfoCard t={t} marginBottom="10px" extraStyle={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }} />
      <h1>{t("YOUR_SIGNATURE")}</h1>
      <div className="sign-button-wrap">
        <Button label={t("CS_ESIGN")} onButtonClick={onBeforeEsign} className="aadhar-sign-in" labelClassName="aadhar-sign-in" />
        <Button
          icon={<FileUploadIcon />}
          label={t("UPLOAD_DIGITAL_SIGN_CERTI")}
          onButtonClick={() => setOpenUploadSignatureModal(true)}
          className="upload-signature"
          labelClassName="upload-signature-label"
        />
      </div>
      <div className="donwload-submission">
        <h2>{t("DOWNLOAD_NOTIFICATION_TEXT")}</h2>
        <AuthenticatedLink
          uri={uri}
          style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }}
          displayFilename={"CLICK_HERE"}
          t={t}
          pdf={true}
        />
      </div>
    </div>
  </div>
);

const BulkNotificationSignedBody = ({ t }) => (
  <div className="add-signature-main-div">
    <NotificationSignatureInfoCard t={t} />
    <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
      <h1 style={signedTitleStyle}>{t("YOUR_SIGNATURE")}</h1>
      <h2 style={signedLabelStyle}>{t("SIGNED")}</h2>
    </div>
  </div>
);

/**
 * Stepper step 3: unsigned picker, upload modal, and signed confirmation.
 * Shared by hearings BulkReschedule and home NewBulkRescheduleTab.
 */
export const BulkNotificationSignatureModals = ({
  stepper,
  t,
  Modal,
  onCancel,
  openUploadSignatureModal,
  setOpenUploadSignatureModal,
  isSigned,
  uploadSignedPdf,
  onBeforeEsign,
  uri,
  name,
  signFormData,
  onSelect,
  onUploadSubmit,
  issignLoader,
  fileUploadError,
  setFileUploadError,
  isLoading,
}) => {
  if (stepper !== 3) {
    return null;
  }

  return (
    <>
      {!openUploadSignatureModal && !isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={onCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={onCancel}
          actionSaveLabel={t("CS_COMMON_SUBMIT")}
          isDisabled={!isSigned}
          actionSaveOnSubmit={uploadSignedPdf}
          className="add-signature-modal"
        >
          <BulkNotificationUnsignedBody t={t} onBeforeEsign={onBeforeEsign} setOpenUploadSignatureModal={setOpenUploadSignatureModal} uri={uri} />
        </Modal>
      )}
      {openUploadSignatureModal && (
        <UploadModal
          t={t}
          key={name}
          name={name}
          onClose={() => setOpenUploadSignatureModal(false)}
          onSelect={onSelect}
          formData={signFormData}
          onSubmit={onUploadSubmit}
          isDisabled={issignLoader}
          isParentLoading={issignLoader}
          fileUploadError={fileUploadError}
          setFileUploadError={setFileUploadError}
        />
      )}
      {!openUploadSignatureModal && isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={onCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={onCancel}
          actionSaveLabel={t("SUBMIT_BUTTON")}
          actionSaveOnSubmit={uploadSignedPdf}
          className="add-signature-modal"
        >
          {isLoading ? <Loader /> : <BulkNotificationSignedBody t={t} />}
        </Modal>
      )}
    </>
  );
};
