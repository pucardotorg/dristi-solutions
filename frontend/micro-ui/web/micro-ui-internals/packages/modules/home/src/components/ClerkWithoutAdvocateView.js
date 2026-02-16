import React from "react";
import { useTranslation } from "react-i18next";
import { NoAdvocateIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

const ClerkWithoutAdvocateView = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "40px 0 0",
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid #E8E8E8",
        padding: "48px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <NoAdvocateIcon />
      </div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#D4351C",
          margin: "0 0 16px",
          fontFamily: "Roboto, sans-serif",
        }}
      >
        {t("NO_ADVOCATES_LINKED") || "No Advocates Linked"}
      </h2>
      <p
        style={{
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "24px",
          color: "#231F20",
          margin: 0,
          maxWidth: "560px",
          fontFamily: "Roboto, sans-serif",
        }}
      >
        {t("NO_ADVOCATES_LINKED_DESCRIPTION") ||
          'No advocate has added you to their profile. In case you\'re working with an advocate practicing cases in ON Court please request them to go to "Manage Office" on their portal and add you'}
      </p>
    </div>
  );
};

export default ClerkWithoutAdvocateView;
