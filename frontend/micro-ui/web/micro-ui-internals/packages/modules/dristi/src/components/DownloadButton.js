import React from "react";

const DownloadButton = ({ onClick, label = "DOWNLOAD_PDF", t, iconColor = "#007E7E", customStyle = {} }) => {
  return (
    <button className="download-button-container" onClick={onClick} style={customStyle}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16L12 8" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M9 13L12 16L15 13" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 20H16" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {t ? t(label) : label}
    </button>
  );
};

export default DownloadButton;
