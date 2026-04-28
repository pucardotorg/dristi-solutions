import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import React, { useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
const EnterAdhaar = ({ t, onSelect, config, params, pathOnRefresh }) => {
  const history = useHistory();
  const [showToast, setShowToast] = useState(null);
  const validateFormData = (data) => {
    let isValid = true;
    if (!(data?.AdhaarInput?.aadharNumber.length === 12)) {
      isValid = false;
    }

    return isValid;
  };

  if (!params?.indentity) {
    history.push(pathOnRefresh);
  }

  return (
    <div className="enter-addhar">
      <FormComposerV2
        config={config}
        t={t}
        noBoxShadow
        inline
        label={t("GET_OTP")}
        onSecondayActionClick={() => {}}
        onSubmit={(data) => {
          if (!validateFormData(data)) {
            setShowToast({ label: t("INVALID_AADHAAR_ERROR_MESSAGE"), error: true, errorId: null });
          } else {
            onSelect(data?.AdhaarInput?.aadharNumber);
          }
          return;
        }}
        defaultValues={{ AdhaarInput: { aadharNumber: params?.adhaarNumber } }}
        submitInForm
      ></FormComposerV2>

      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </div>
  );
};

export default EnterAdhaar;
