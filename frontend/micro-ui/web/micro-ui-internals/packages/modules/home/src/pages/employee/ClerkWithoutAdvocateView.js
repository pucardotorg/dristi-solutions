import React from "react";
import { useTranslation } from "react-i18next";

const NoAdvocateIcon = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="58" fill="#FFF4FC" stroke="white" strokeWidth="2" />
    <g transform="translate(60, 60) rotate(-12) translate(-24, -28)">
      {/* Back document */}
      <path
        d="M8 8L8 52C8 54.2 9.8 56 12 56L36 56C38.2 56 40 54.2 40 52L40 8C40 5.8 38.2 4 36 4L12 4C9.8 4 8 5.8 8 8Z"
        fill="#EEEEEE"
        stroke="#9E9E9E"
        strokeWidth="1.2"
      />
      {/* Middle document */}
      <path
        d="M14 14L14 50C14 52.2 15.8 54 18 54L34 54C36.2 54 38 52.2 38 50L38 14C38 11.8 36.2 10 34 10L18 10C15.8 10 14 11.8 14 14Z"
        fill="#F5F5F5"
        stroke="#9E9E9E"
        strokeWidth="1.2"
      />
      {/* Front document with A */}
      <path
        d="M20 20L20 48C20 50.2 21.8 52 24 52L28 52C30.2 52 32 50.2 32 48L32 20C32 17.8 30.2 16 28 16L24 16C21.8 16 20 17.8 20 20Z"
        fill="white"
        stroke="#9E9E9E"
        strokeWidth="1.2"
      />
      <path d="M24 24L28 26L24 40M26 32L26 36" stroke="#757575" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const ClerkWithoutAdvocateView = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "800px",
        margin: "40px auto 0",
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
