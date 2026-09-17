import React from "react";
import Modal from "../../../dristi/src/components/Modal";
import CustomCopyTextDiv from "../../../dristi/src/components/CustomCopyTextDiv";
import { FileDownloadIcon } from "../../../dristi/src/icons/svgIndex";
import { Banner, CardLabel } from "@egovernments/digit-ui-react-components";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";

function SubmissionDocumentSuccessModal({ documentSubmissionNumber, t, handleSuccessDownloadSubmission, handleClose }) {
  const submissionModalInfo = {
    header: "DOCUMENT_SUBMISSION_SUCCESSFUL",
    subHeader: "",
    caseInfo: [
      {
        key: t("DOCUMENT_SUBMISSION_DATE"),
        value: DateUtils.getFormattedDate(new Date()),
        copyData: false,
      },
      {
        key: `${t("DOCUMENT_SUBMISSION_FILING_ID")}`,
        value: documentSubmissionNumber,
        copyData: true,
      },
    ],
  };

  return (
    <Modal
      actionCancelLabel={t("DOWNLOAD_DOCUMENT_SUBMISSION")}
      actionCancelOnSubmit={handleSuccessDownloadSubmission}
      actionSaveLabel={t("CS_CLOSE")}
      actionSaveOnSubmit={handleClose}
      className={"orders-success-modal"}
      popupStyles={{ width: "50%" }}
      cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
    >
      <div style={{ padding: "0px 0px 45px 0px" }}>
        <div>
          <Banner
            whichSvg={"tick"}
            successful={true}
            message={t(submissionModalInfo?.header)}
            headerStyles={{ fontSize: "32px" }}
            style={{ minWidth: "100%" }}
          ></Banner>
          {submissionModalInfo?.subHeader && <CardLabel>{t(submissionModalInfo?.subHeader)}</CardLabel>}
          {
            <CustomCopyTextDiv
              t={t}
              keyStyle={{ margin: "8px 0px" }}
              valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
              data={submissionModalInfo?.caseInfo}
            />
          }
        </div>
      </div>
    </Modal>
  );
}

export default SubmissionDocumentSuccessModal;
