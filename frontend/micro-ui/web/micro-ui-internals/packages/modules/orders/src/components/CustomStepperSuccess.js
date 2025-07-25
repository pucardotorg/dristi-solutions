import CustomCopyTextDiv from "@egovernments/digit-ui-module-dristi/src/components/CustomCopyTextDiv";
import { Banner, Button, DownloadIcon } from "@egovernments/digit-ui-react-components";
import { FileIcon, PrintIcon } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { Urls } from "../hooks/services/Urls";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";

const submitButtonStyle = {
  fontFamily: "Roboto",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "18.75px",
  textAlign: "center",
  color: "#FFFFFF",
};

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
  orderType,
  isSubmitting = false,
}) => {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const fileStore = sessionStorage.getItem("SignedFileStoreID");

  const documentType = useMemo(() => {
    let txt = "";
    if (orderType === "SUMMONS") {
      txt = "Summons";
    } else if (orderType === "WARRANT") {
      txt = "Warrant";
    } else {
      txt = "Notice";
    }
    return `${txt} Document`;
  }, [orderType]);

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
            <div style={{ marginLeft: "0.5rem" }}>{documentType}</div>
          </div>
          <button className="print-button" disabled={!fileStore}>
            <PrintIcon />
            {fileStore ? (
              <AuthenticatedLink
                uri={`${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStore}`}
                t={t}
                style={{ marginLeft: "0.5rem", color: "#007E7E" }}
                displayFilename={"PRINT"}
              />
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
              label={t(closeButtonText)}
              icon={documents ? <DownloadIcon /> : undefined}
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
              label={t(submitButtonText)}
              onButtonClick={() => {
                if (submitButtonText === "CS_CLOSE") {
                  closeButtonAction();
                  return;
                }
                submitButtonAction();
              }}
              textStyles={submitButtonStyle}
              isDisabled={submitButtonText !== "CS_CLOSE" && isSubmitting}
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
