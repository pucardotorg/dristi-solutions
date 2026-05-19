import React, { useState } from "react";
import { CardHeader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { submissionService } from "../../hooks/services";
import CitizenOpenApiMobileLoginPage from "../../components/CitizenOpenApiMobileLoginPage";

const BailBondLoginPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { bailbondId } = Digit.Hooks.useQueryParams();
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const handleSubmit = async () => {
    try {
      const res = await submissionService.searchOpenApiBailBond({
        tenantId,
        bailId: bailbondId,
        mobileNumber: mobileNumber,
      });
      if (!res || Object.keys(res).length === 0) {
        setError(true);
        return;
      }
      history.replace(`/${window?.contextPath}/citizen/dristi/home/bail-bond-sign?tenantId=${tenantId}&bailbondId=${bailbondId}`, {
        mobileNumber: mobileNumber,
        tenantId: tenantId,
        isAuthorised: true,
      });
    } catch (error) {
      setError(true);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("BAIL_BOND_LOGIN_FAILED"), error: true, errorId });
      return;
    }
  };

  return (
    <CitizenOpenApiMobileLoginPage
      t={t}
      cardHeader={<CardHeader>{t("SIGN_BAIL_BOND")}</CardHeader>}
      mobileNumber={mobileNumber}
      setMobileNumber={setMobileNumber}
      error={error}
      setError={setError}
      errorMessageTranslationKey="ERROR_BAIL_BOND_LOGIN_NUMBER"
      submitLabel={t("CONFIRM")}
      onSubmit={handleSubmit}
      showToast={showToast}
      setShowToast={setShowToast}
    />
  );
};

export default BailBondLoginPage;
