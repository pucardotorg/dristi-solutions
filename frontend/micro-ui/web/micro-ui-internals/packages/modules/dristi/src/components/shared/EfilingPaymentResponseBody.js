import React from "react";
import { Banner, CardLabel } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import CustomCopyTextDiv from "../CustomCopyTextDiv";
import SelectCustomNote from "../SelectCustomNote";
import useDownloadCasePdf from "../../hooks/dristi/useDownloadCasePdf";

const customNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "CS_COMMON_NOTE",
        infoText: "PAYMENT_FAILED_NOTE_MSG",
        infoTooltipMessage: "CS_NOTE_TOOLTIP_CASE_TYPE",
      },
    ],
  },
};

/**
 * Shared body for EFiling payment response screen. Hosts decide how to wire
 * retry / go-home / print-receipt button click handlers (e.g. with or without
 * survey trigger).
 */
const EfilingPaymentResponseBody = ({
  isSuccess,
  receiptData,
  fileStoreId,
  caseId,
  submitModalInfo,
  onRetry,
  onPrintReceipt,
  onGoHome,
}) => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { downloadPdf } = useDownloadCasePdf();

  const commonProps = {
    whichSvg: "tick",
    headerStyles: { fontSize: "32px" },
    style: { minWidth: "100%", marginTop: "10px" },
  };

  const bannerProps = isSuccess
    ? {
        ...commonProps,
        successful: true,
        message: t(submitModalInfo?.header),
      }
    : {
        ...commonProps,
        successful: false,
        message: t("CS_PAYMENT_FAILED"),
      };

  const handlePrintReceipt = () => {
    if (onPrintReceipt) {
      onPrintReceipt();
      return;
    }
    downloadPdf(tenantId, fileStoreId);
  };

  return (
    <div className="e-filing-payment" style={{ minHeight: "100%", height: "100%" }}>
      <Banner {...bannerProps} />
      {submitModalInfo?.subHeader && isSuccess && <CardLabel className={"e-filing-card-label"}>{t(submitModalInfo?.subHeader)}</CardLabel>}
      {receiptData ? (
        <CustomCopyTextDiv
          t={t}
          keyStyle={{ margin: "8px 0px" }}
          valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
          data={receiptData?.caseInfo}
          tableDataClassName={"e-filing-table-data-style"}
          tableValueClassName={"e-filing-table-value-style"}
        />
      ) : (
        <SelectCustomNote t={t} config={customNoteConfig} />
      )}
      <div className="button-field" style={{ width: "100%", marginTop: 16 }}>
        {!fileStoreId && caseId ? (
          <Button
            variation={"secondary"}
            className={"secondary-button-selector"}
            label={t("Retry Payment")}
            labelClassName={"secondary-label-selector"}
            onButtonClick={onRetry}
          />
        ) : (
          <Button
            style={{
              display: "flex",
              color: "#505A5F",
              textDecoration: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            variation={"secondary"}
            className={"secondary-button-selector"}
            label={t("CS_PRINT_RECEIPT")}
            labelClassName={"secondary-label-selector"}
            onButtonClick={handlePrintReceipt}
          />
        )}

        <Button
          className={"tertiary-button-selector"}
          label={t("CS_GO_TO_HOME")}
          labelClassName={"tertiary-label-selector"}
          onButtonClick={onGoHome}
        />
      </div>
    </div>
  );
};

export default EfilingPaymentResponseBody;
