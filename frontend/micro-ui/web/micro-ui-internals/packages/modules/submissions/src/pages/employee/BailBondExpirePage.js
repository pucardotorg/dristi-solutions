import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const BailBondLinkExpiredPage = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const handleBackToHome = () => {
    history.push(`/${window?.contextPath}/citizen/dristi/home/login`);
  };

  return (
    <div className="user-registration">
      <div className="citizen-form-wrapper">
        <div className="login-form" style={{ width: "40vw" }}>
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <h1 style={{ color: "#BB2C2F" }}>{t("LINK_EXPIRED")}</h1>
            <p>{t("LINK_EXPIRED_INFO")}</p>
            <button
              onClick={handleBackToHome}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "teal",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {t("ACTION_TEST_HOME")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BailBondLinkExpiredPage;
