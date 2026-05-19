import React, { useState } from "react";
import { CardHeader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { submissionService } from "../../hooks/services";
import CitizenOpenApiMobileLoginPage from "../../components/CitizenOpenApiMobileLoginPage";

const DigitizedDocumentLoginPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { documentNumber, type } = Digit.Hooks.useQueryParams();
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const handleSubmit = async () => {
    try {
      const res = await submissionService.searchOpenApiDigitizedDocument({
        tenantId,
        documentNumber: documentNumber,
        mobileNumber: mobileNumber,
      });
      if (!res || Object.keys(res).length === 0) {
        setError(true);
        return;
      }
      const isMediation = type === "MEDIATION" && res?.documents?.[0]?.type === "MEDIATION";

      const basePath = `/${window?.contextPath}/citizen/dristi/home`;

      const route = isMediation ? "mediation-form-sign" : "digitalized-document-sign";

      const queryParams = new URLSearchParams({
        tenantId,
        digitalizedDocumentId: documentNumber,
        ...(isMediation ? {} : { type: res?.documents?.[0]?.type }),
      }).toString();

      history.replace(`${basePath}/${route}?${queryParams}`, {
        mobileNumber,
        tenantId,
        isAuthorised: true,
      });
    } catch (error) {
      setError(true);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("DIGITIZED_DOCUMENT_LOGIN_FAILED"), error: true, errorId });
      return;
    }
  };

  return (
    <CitizenOpenApiMobileLoginPage
      t={t}
      cardHeader={
        <CardHeader styles={{ lineHeight: 1 }}>
          {type === "PLEA" ? t("SIGN_PLEA") : type === "MEDIATION" ? t("SIGN_MEDIATION") : t("SIGN_EXAMINATION_OF_ACCUSED")}
        </CardHeader>
      }
      mobileNumber={mobileNumber}
      setMobileNumber={setMobileNumber}
      error={error}
      setError={setError}
      errorMessageTranslationKey="ERROR_LOGIN_NUMBER_UNAUTHORIZED"
      submitLabel={t("PROCEED")}
      onSubmit={handleSubmit}
      showToast={showToast}
      setShowToast={setShowToast}
    />
  );
};

export default DigitizedDocumentLoginPage;
