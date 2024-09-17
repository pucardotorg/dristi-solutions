import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import { Banner, Button, DownloadIcon } from "@egovernments/digit-ui-react-components";
import { FileIcon, PrintIcon } from "@egovernments/digit-ui-react-components";
import React from "react";
import { Urls } from "../hooks/services/Urls";

const CustomStepperSuccess = ({
  successMessage,
  bannerSubText,
  closeButtonAction,
  submitButtonAction,
  t,
  submissionData,
  documents,
  deliveryChannel,
  submitButtonText,
  closeButtonText,
}) => {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const fileStore = localStorage.getItem("SignedFileStoreID");
  return (
    <div className="custom-stepper-modal-success" style={{ padding: "0px 20px" }}>
      <Banner
        whichSvg={"tick"}
        successful={true}
        message={successMessage ? t(successMessage) : ""}
        headerStyles={{ fontSize: "32px" }}
        style={{ minWidth: "100%", marginTop: "32px", marginBottom: "20px" }}
      ></Banner>
      {bannerSubText ? <p>{t(bannerSubText)}</p> : ""}
      {submissionData && (
        <CustomCopyTextDiv
          t={t}
          keyStyle={{ margin: "8px 0px" }}
          valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
          data={submissionData}
          tableDataClassName={"e-filing-table-data-style"}
          tableValueClassName={"e-filing-table-value-style"}
        />
      )}
      {fileStore && (
        <div className="print-documents-box-div">
          <div className="print-documents-box-text">
            <FileIcon />
            <div style={{ marginLeft: "0.5rem" }}>Summons Document</div>
          </div>
          <button className="print-button" disabled={!fileStore}>
            <PrintIcon />
            {fileStore ? (
              <a
                href={`${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStore}`}
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: "0.5rem", color: "#007E7E" }}
              >
                Print
              </a>
            ) : (
              <span style={{ marginLeft: "0.5rem", color: "grey" }}>Print</span>
            )}
          </button>
        </div>
      )}

      {(closeButtonAction || submitButtonAction) && (
        <div className="action-button-success">
          {closeButtonAction && (
            <Button
              className={"selector-button-border"}
              label={closeButtonText}
              icon={documents ? undefined : <DownloadIcon />}
              onButtonClick={() => {
                // closeModal();
                // refreshInbox();
                // if (documents) closeButtonAction();
                closeButtonAction();
              }}
            />
          )}
          {submitButtonAction && (
            <Button
              className={"selector-button-primary"}
              label={submitButtonText}
              onButtonClick={() => {
                // if (!documents) closeButtonAction();
                submitButtonAction();
              }}
            >
              {/* <RightArrow /> */}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomStepperSuccess;
