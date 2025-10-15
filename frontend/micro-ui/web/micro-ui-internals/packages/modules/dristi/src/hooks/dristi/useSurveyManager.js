// useSurveyManager.js
import React, { useState, useCallback } from "react";
import { surveyConfig } from "../../configs/InPortalSurveyConfig";
import InPortalSurveyModal from "../../components/InPortalSurvey/InPortalSurveyModal";
import InPortalSurveyRes from "../../components/InPortalSurvey/InPortalSurveyRes";

export const useSurveyManager = () => {
  const [surveyData, setSurveyData] = useState(null);
  const [isSurveyOpen, setSurveyOpen] = useState(false);
  const [isResultOpen, setResultOpen] = useState(false);
  const [surveyResult, setSurveyResult] = useState(null);
  const [customOnClose, setCustomOnClose] = useState(() => () => {});

  // Call backend to check eligibility
  const checkEligibility = async (context) => {
    try {
      // const res = await fetch(`/api/survey/eligibility?context=${context}`);
      // const data = await res.json();
      // return data?.eligible;
      return true; // For demo purposes, assume always eligible
    } catch (err) {
      console.error("Survey eligibility check failed:", err);
      return false;
    }
  };

  // Entry function called by trigger points
  const triggerSurvey = useCallback(async (context, onClose) => {
    setCustomOnClose(() => onClose);
    debugger;
    const eligible = await checkEligibility(context);

    if (eligible) {
      const question = surveyConfig.contexts[context]?.question;
      if (!question) {
        console.warn(`No question found for context: ${context}`);
        onClose?.();
        return;
      }

      setSurveyData({ context });
      setSurveyOpen(true);
    } else {
      onClose?.();
    }
  }, []);

  // Handle survey submission
  const handleSurveySubmit = async (payload) => {
    try {
      // const res = await fetch("/api/survey/submit", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });

      // const data = await res.json();
      setSurveyOpen(false);
      setResultOpen(true);
      // setSurveyResult(data?.success ? "success" : "error");
      setSurveyResult(true); // For demo purposes, assume success
    } catch (err) {
      console.error("Survey submission failed:", err);
      setSurveyOpen(false);
      setResultOpen(true);
      setSurveyResult("error");
    }
  };

  const handleResultClose = () => {
    setResultOpen(false);
    setSurveyResult(null);
    setSurveyData(null);
    customOnClose?.();
  };

  const SurveyUI = (
    <React.Fragment>
      {isSurveyOpen && surveyData && (
        <InPortalSurveyModal
          context={surveyData.context}
          onClose={handleResultClose}
          onSubmit={handleSurveySubmit}
        />
      )}
      {isResultOpen && (
        <InPortalSurveyRes
          status={surveyResult}
          onClose={handleResultClose}
        />
      )}
    </React.Fragment>
  );

  return { triggerSurvey, SurveyUI };
};
