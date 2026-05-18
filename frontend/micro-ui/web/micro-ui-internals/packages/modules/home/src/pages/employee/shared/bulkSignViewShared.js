import React from "react";
import { CloseSvg, Loader, SubmitBar, Banner } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";

export const parseSignedXml = (xmlString, tagName) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  const element = xmlDoc.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : null;
};

export const bulkSignSectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

export const BulkSignHeading = (props) => <span className="heading-m">{props.label}</span>;

export const BulkSignCloseBtn = (props) => (
  <div onClick={props.onClick}>
    <span className="icon-circle">
      <CloseSvg />
    </span>{" "}
  </div>
);

export const BulkSignLoadingOverlay = ({ show }) => {
  if (!show) return null;
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        zIndex: "10001",
        position: "fixed",
        right: "0",
        display: "flex",
        top: "0",
        background: "rgb(234 234 245 / 50%)",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="submit-loader"
    >
      <Loader />
    </div>
  );
};

export const BulkSignSubmitBar = ({ show, label, onSubmit, disabled }) => {
  if (!show) return null;
  return (
    <div className="bulk-submit-bar">
      <SubmitBar label={label} submit="submit" disabled={disabled} onSubmit={onSubmit} />
    </div>
  );
};

export const BulkSignConfirmModal = ({ open, onCancel, onConfirm, t, headerLabel = "CONFIRM_BULK_SIGN", confirmText, backLabel = "CS_BULK_BACK", saveLabel = "CS_BULK_SIGN_AND_PUBLISH" }) => {
  if (!open) return null;
  return (
    <Modal
      headerBarMain={<BulkSignHeading label={t(headerLabel)} />}
      headerBarEnd={<BulkSignCloseBtn onClick={onCancel} />}
      actionCancelLabel={t(backLabel)}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t(saveLabel)}
      actionSaveOnSubmit={onConfirm}
      style={{ height: "40px", background: "#007E7E" }}
      popupStyles={{ width: "35%" }}
      className={"review-order-modal"}
      children={
        <div className="delete-warning-text">
          <h3 style={{ margin: "12px 24px" }}>{t(confirmText)}</h3>
        </div>
      }
    />
  );
};

export const BulkSignSuccessModal = ({ open, onClose, modalInfo, t }) => {
  if (!open) return null;
  return (
    <Modal actionSaveLabel={t("BULK_SUCCESS_CLOSE")} actionSaveOnSubmit={onClose} className={"orders-issue-bulk-success-modal"}>
      <div>
        <Banner
          whichSvg={"tick"}
          successful={true}
          message={modalInfo?.header}
          headerStyles={{ fontSize: "32px" }}
          style={{ minWidth: "100%" }}
        ></Banner>
        {
          <CustomCopyTextDiv
            t={t}
            keyStyle={{ margin: "8px 0px" }}
            valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
            data={modalInfo?.caseInfo}
          />
        }
      </div>
    </Modal>
  );
};
