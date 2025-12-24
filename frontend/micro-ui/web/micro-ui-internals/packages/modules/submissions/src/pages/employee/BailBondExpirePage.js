import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const BailBondLinkExpiredPage = () => {
  const { t } = useTranslation();

  const handleBackToHome = () => {
    window.location.replace(process.env.REACT_APP_PROXY_API || "https://oncourts.kerala.gov.in");
  };

  return (
    <div
      className="expired-page-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "1rem",
        background: "#f2f2f2",
      }}
    >
      <div
        className="expired-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#BB2C2F", marginBottom: "1rem", fontSize: "1.4rem" }}>{t("LINK_EXPIRED")}</h1>

        <p style={{ fontSize: "0.95rem", color: "#444", lineHeight: "1.5" }}>{t("LINK_EXPIRED_INFO")}</p>

        <button
          onClick={handleBackToHome}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            padding: "0.9rem",
            backgroundColor: "teal",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {t("ACTION_TEST_HOME")}
        </button>
      </div>
    </div>
  );
};

export default BailBondLinkExpiredPage;
