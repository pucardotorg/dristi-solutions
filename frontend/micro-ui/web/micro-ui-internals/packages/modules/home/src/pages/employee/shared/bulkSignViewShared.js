import React from "react";
import qs from "qs";
import { CloseSvg, Loader, SubmitBar, Banner } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

/**
 * Shared helpers for the home/src/pages/employee/Bulk*View pages.
 *
 * Each bulk-sign page (bail bond, witness deposition, digitalised forms, orders e-sign,
 * CTC issue, etc.) builds the same scaffolding:
 *   1. parse an XML payload from the local bulk-sign service
 *   2. memoise a fixed sectionsParentStyle for the InboxSearchComposer
 *   3. show a confirm modal -> a success modal
 *   4. POST each request to the bulk-sign URL and aggregate signed / failed entries
 * The helpers below extract those identical pieces. Wrappers stay free to bring their own
 * `Heading` / `CloseBtn` markup and their own per-page success modal.
 */

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

export const BulkSignConfirmModal = ({
  open,
  onCancel,
  onConfirm,
  t,
  headerLabel = "CONFIRM_BULK_SIGN",
  confirmText,
  backLabel = "CS_BULK_BACK",
  saveLabel = "CS_BULK_SIGN_AND_PUBLISH",
  HeadingComponent = BulkSignHeading,
  CloseBtnComponent = BulkSignCloseBtn,
}) => {
  if (!open) return null;
  return (
    <Modal
      headerBarMain={<HeadingComponent label={t(headerLabel)} />}
      headerBarEnd={<CloseBtnComponent onClick={onCancel} />}
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
        {modalInfo?.caseInfo && (
          <CustomCopyTextDiv
            t={t}
            keyStyle={{ margin: "8px 0px" }}
            valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
            data={modalInfo?.caseInfo}
          />
        )}
      </div>
    </Modal>
  );
};

/**
 * Runs the per-item bulk-sign POST loop that every Bulk*View used to inline.
 *
 * For each entry in `requestList` the helper:
 *   - serialises `entry.request` as `application/x-www-form-urlencoded` and POSTs to `bulkSignUrl`
 *   - parses the returned XML for `status` (failed?) and `data` (signed payload)
 *   - hands the parsed bits to the caller via `buildSuccessResponse(signedData, entry)` or
 *     `buildFailureResponse(signedData, errorMsg, entry)`
 *   - swallows per-item errors after logging (preserving original `Promise.allSettled` semantics)
 *
 * Callers receive the aggregated array of response entries (same order callers pushed in).
 */
export const buildBulkSignedResponses = async ({
  requestList,
  bulkSignUrl,
  buildSuccessResponse,
  buildFailureResponse,
  logErrorLabel,
  logErrorIdField,
}) => {
  const responses = [];
  const requests = requestList?.map(async (entry) => {
    try {
      const formData = qs.stringify({ response: entry?.request });
      const response = await axiosInstance.post(bulkSignUrl, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      });

      const data = response?.data;
      const signedData = parseSignedXml(data, "data");

      if (parseSignedXml(data, "status") !== "failed") {
        responses.push(buildSuccessResponse(signedData, entry));
      } else {
        const errorMsg = parseSignedXml(data, "error");
        responses.push(buildFailureResponse(signedData, errorMsg, entry));
      }
    } catch (error) {
      const id = logErrorIdField ? entry?.[logErrorIdField] : "";
      console.error(`${logErrorLabel || "Error fetching bulk-sign item"} ${id}:`, error?.message);
    }
  });

  await Promise.allSettled(requests);
  return responses;
};
