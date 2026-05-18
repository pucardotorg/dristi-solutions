import React from "react";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import EfilingPaymentResponseBody from "../../../components/shared/EfilingPaymentResponseBody";

const mockSubmitModalInfo = {
  header: "CS_PAYMENT_SUCCESSFUL",
  subHeader: "CS_PAYMENT_SUCCESSFUL_SUB_TEXT",
  backButtonText: "Back to Home",
  nextButtonText: "Schedule next hearing",
  isArrow: false,
  showTable: true,
};

function EFilingPaymentResponse({ t, setShowModal, header, subHeader, submitModalInfo = mockSubmitModalInfo, amount = 2000, path }) {
  const history = useHistory();
  const location = useLocation();
  const receiptData = location.state.state.receiptData;
  const isSuccess = location.state.state.success;
  const fileStoreId = location.state.state.fileStoreId;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const caseId = location.state.state.caseId;
  const { triggerSurvey, SurveyUI } = Digit.Hooks.dristi.useSurveyManager({ tenantId: tenantId });

  const triggerSurveyContext = receiptData?.casePrevStatus === "PENDING_PAYMENT" ? "FILING_PAYMENT" : "DEFECT_CORRECTION_PAYMENT";

  return (
    <div className=" user-registration">
      <EfilingPaymentResponseBody
        isSuccess={isSuccess}
        receiptData={receiptData}
        fileStoreId={fileStoreId}
        caseId={caseId}
        submitModalInfo={submitModalInfo}
        onRetry={() => {
          triggerSurvey(triggerSurveyContext, () => {
            history.push(`${path}/e-filing-payment?caseId=${caseId}`);
          });
        }}
        onGoHome={() => {
          triggerSurvey(triggerSurveyContext, () => {
            history.push(`/${window?.contextPath}/citizen/dristi/home`);
          });
        }}
      />
      {SurveyUI}
    </div>
  );
}

export default EFilingPaymentResponse;
