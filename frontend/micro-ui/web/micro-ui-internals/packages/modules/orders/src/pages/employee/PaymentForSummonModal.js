import React from "react";
import { Loader } from "@egovernments/digit-ui-components";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import DocumentModal from "../../components/DocumentModal";
import { useTaskOrderPaymentModal } from "./shared/useTaskOrderPaymentModal";

const PaymentForSummonModal = () => {
  const { isLoading, paymentForSummonModalConfig, showToast, setShowToast } = useTaskOrderPaymentModal("POST");

  if (isLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <DocumentModal config={paymentForSummonModalConfig} />
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </React.Fragment>
  );
};

export default PaymentForSummonModal;
