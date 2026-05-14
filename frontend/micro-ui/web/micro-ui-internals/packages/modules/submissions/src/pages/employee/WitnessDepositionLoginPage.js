import React, { useState } from "react";
import { CardHeader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { submissionService } from "../../hooks/services";
import CitizenOpenApiMobileLoginPage from "../../components/CitizenOpenApiMobileLoginPage";

const WitnessDepositionLoginPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { artifactNumber } = Digit.Hooks.useQueryParams();
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const handleSubmit = async () => {
    try {
      const res = await submissionService.searchOpenApiWitnessDeposition({
        tenantId,
        artifactNumber: artifactNumber,
        mobileNumber: mobileNumber,
      });
      if (!res || Object.keys(res).length === 0) {
        setError(true);
        return;
      }
      history.replace(`/${window?.contextPath}/citizen/dristi/home/evidence-sign?tenantId=${tenantId}&artifactNumber=${artifactNumber}`, {
        mobileNumber: mobileNumber,
        tenantId: tenantId,
        isAuthorised: true,
      });
    } catch (error) {
      setError(true);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("WITNESS_DEPOSITION_LOGIN_FAILED"), error: true, errorId });
      return;
    }
  };

  return (
    <CitizenOpenApiMobileLoginPage
      t={t}
      cardHeader={<CardHeader>{t("Sign Witness Deposition")}</CardHeader>}
      mobileNumber={mobileNumber}
      setMobileNumber={setMobileNumber}
      error={error}
      setError={setError}
      errorMessageTranslationKey="ERROR_WITNESS_DEPOSITION_LOGIN_NUMBER"
      submitLabel={t("PROCEED")}
      onSubmit={handleSubmit}
      showToast={showToast}
      setShowToast={setShowToast}
    />
  );
};

export default WitnessDepositionLoginPage;
