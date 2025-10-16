import React, { useState, useCallback } from "react";
import { surveyConfig } from "../../configs/InPortalSurveyConfig";
import InPortalSurveyModal from "../../components/InPortalSurvey/InPortalSurveyModal";
import InPortalSurveyRes from "../../components/InPortalSurvey/InPortalSurveyRes";
import { DRISTIService } from "../../services";

export const useSurveyManager = () => {
  const [surveyData, setSurveyData] = useState(null);
  const [isSurveyOpen, setSurveyOpen] = useState(false);
  const [isResultOpen, setResultOpen] = useState(false);
  const [surveyResult, setSurveyResult] = useState(null);
  const [customOnClose, setCustomOnClose] = useState(() => () => {});

  // Call backend to check eligibility
  const checkEligibility = async () => {
    try {
      const {data, isLoading, error} = await DRISTIService.getInportalEligibility();
      return data?.Eligibility?.isEligible;
    } catch (err) {
      console.error("Survey eligibility check failed:", err);
      return false;
    }
  };

  // Entry function called by trigger points
  const triggerSurvey = useCallback(async (context, onClose) => {
    setCustomOnClose(() => onClose);

    try {
      const eligible = await checkEligibility();
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
    } catch (err) {
      console.error("Error during survey trigger:", err);
      onClose?.();
      return;
    } 
  }, []);

  // Handle survey submission
  const handleSurveySubmit = async ({context, rating, feedback}) => {
    try {
      const {data, isLoading, error} = await DRISTIService.postInportalFeedback({
        catagory: context,
        rating,
        feedback
      });

      setSurveyOpen(false);
      setResultOpen(true);
      setSurveyResult("success");
    } catch (err) {
      console.error("Survey submission failed:", err);
      setSurveyOpen(false);
      setResultOpen(true);
      setSurveyResult("error");
    }
  };

  const handleRemindMeLater = async () => {
    try {
      const {data, isLoading, error} = await DRISTIService.postInportalRemindMeLater();
    } catch (err) {
      console.error("Survey submission failed:", err);
    } finally {
      setResultOpen(false);
      setSurveyResult(null);
      setSurveyData(null);
      customOnClose?.();
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
          onRemindMeLater={handleRemindMeLater}
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
