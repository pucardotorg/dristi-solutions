import React from "react";
import { downloadBlobFromAuthenticatedUrl } from "./downloadBlobFromUrl";

const AuthenticatedLink = ({ t, uri, displayFilename = false, pdf = false, name = "downloadedFile" }) => {
  const handleClick = (e) => {
    e.preventDefault();
    const authToken = localStorage.getItem("token");
    downloadBlobFromAuthenticatedUrl(uri, name, {
      pdf,
      headers: { "auth-token": `${authToken}` },
    });
  };

  return (
    <span
      onClick={handleClick}
      style={{
        display: "flex",
        color: "#007e7e",
        maxWidth: "250px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer",
        textDecoration: "underline",
        marginLeft: "5px",
      }}
    >
      {displayFilename ? t(displayFilename) : t("CS_CLICK_TO_DOWNLOAD")}
    </span>
  );
};

export default AuthenticatedLink;
