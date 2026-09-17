import React from "react";
import { surveyConfig } from "../../configs/InPortalSurveyConfig";





const SuccessIcon = () => (
  <svg width="94" height="94" viewBox="0 0 94 94" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="47" cy="47" r="47" fill="#007E7E" fill-opacity="0.12" />
    <path d="M47.1111 24.8521C35.1217 24.8521 25.3518 34.622 25.3518 46.6113C25.3518 58.6007 35.1217 68.3706 47.1111 68.3706C59.1004 68.3706 68.8703 58.6007 68.8703 46.6113C68.8703 34.622 59.1004 24.8521 47.1111 24.8521ZM57.512 41.6067L45.1745 53.9442C44.8699 54.2488 44.4564 54.4229 44.0212 54.4229C43.5861 54.4229 43.1726 54.2488 42.868 53.9442L36.7101 47.7863C36.0791 47.1553 36.0791 46.1108 36.7101 45.4798C37.3412 44.8488 38.3856 44.8488 39.0166 45.4798L44.0212 50.4845L55.2055 39.3002C55.8365 38.6692 56.881 38.6692 57.512 39.3002C58.143 39.9312 58.143 40.9539 57.512 41.6067Z" fill="#007E7E" />
  </svg>
);



const InPortalSurveyRes = ({ status, onClose }) => {
  const config = status ? surveyConfig.success : surveyConfig.error;

  return (
    <div className="survey-modal-overlay">
      <div className={`survey-modal-container survey-response ${status ? "success" : "error"}`}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
        <div className="survey-icon">
          {<SuccessIcon />}
        </div>
        <h3>{config.title}</h3>
        <p>{config.message}</p>
      </div>
    </div>
  );
};

export default InPortalSurveyRes;
