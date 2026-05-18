import React from "react";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import EfilingPaymentResponseBody from "@egovernments/digit-ui-module-dristi/src/components/shared/EfilingPaymentResponseBody";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";

const mockSubmitModalInfo = {
  header: "CS_PAYMENT_SUCCESSFUL",
  subHeader: "CS_PAYMENT_SUCCESSFUL_SUB_TEXT",
  backButtonText: "Back to Home",
  nextButtonText: "Schedule next hearing",
  isArrow: false,
  showTable: true,
};

function EFilingPaymentResponse({ setShowModal, header, subHeader, submitModalInfo = mockSubmitModalInfo, amount = 2000, path }) {
  const history = useHistory();
  const location = useLocation();
  const receiptData = location.state.state.receiptData;
  const isSuccess = location.state.state.success;
  const fileStoreId = location.state.state.fileStoreId;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const caseId = location.state.state.caseId;
  const { downloadPdf } = useDownloadCasePdf();

  return (
    <div className=" user-registration">
      <EfilingPaymentResponseBody
        isSuccess={isSuccess}
        receiptData={receiptData}
        fileStoreId={fileStoreId}
        caseId={caseId}
        submitModalInfo={submitModalInfo}
        onRetry={() => {
          history.push(`${path}/e-filing-payment?caseId=${caseId}`);
        }}
        onPrintReceipt={() => {
          downloadPdf(tenantId, fileStoreId);
        }}
        onGoHome={() => {
          history.push(`/${window?.contextPath}/citizen/dristi/home`);
        }}
      />
    </div>
  );
}

export default EFilingPaymentResponse;
