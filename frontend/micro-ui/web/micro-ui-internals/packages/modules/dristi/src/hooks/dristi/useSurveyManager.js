import React, { useState, useCallback, useMemo } from "react";
import { surveyConfig } from "../../configs/InPortalSurveyConfig";
import InPortalSurveyModal from "../../components/InPortalSurvey/InPortalSurveyModal";
import InPortalSurveyRes from "../../components/InPortalSurvey/InPortalSurveyRes";
import { DRISTIService } from "../../services";

export const useSurveyManager = (params) => {
  const [surveyData, setSurveyData] = useState(null);
  const [isSurveyOpen, setSurveyOpen] = useState(false);
  const [isResultOpen, setResultOpen] = useState(false);
  const [surveyResult, setSurveyResult] = useState(null);
  const [customOnClose, setCustomOnClose] = useState(() => () => {});

  const userInfo = Digit.UserService.getUser()?.info;
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo]);
  const hasAdvocateRole = useMemo(() => userInfo?.roles?.some((role) => role.code === "ADVOCATE_ROLE"), [userInfo]);
  const isLitigant = useMemo(() => userInfo?.type === "CITIZEN" && !hasAdvocateRole, [userInfo]);

  // Call backend to check eligibility
  const checkEligibility = useCallback(async () => {
    try {
      const data = await DRISTIService.getInportalEligibility(params);
      return data?.Eligibility?.isEligible;
    } catch (err) {
      console.error("Survey eligibility check failed:", err);
      return false;
    }
  }, [params]);

  // Entry function called by trigger points
  const triggerSurvey = useCallback(
    async (context, onClose) => {
      setCustomOnClose(() => onClose);

      if (!isCitizen) {
        onClose?.();
        return;
      }

      if (isLitigant && context === "JOIN_CASE_PAYMENT") {
        onClose?.();
        return;
      }

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
    },
    [checkEligibility]
  );

  // Handle survey submission
  const handleSurveySubmit = async ({ context, rating, feedback }) => {
    try {
      const payload = {
        feedBack: {
          rating,
          category: context,
          feedback,
        },
      };
      const data = await DRISTIService.postInportalFeedback(payload, params);

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
      const data = await DRISTIService.postInportalRemindMeLater(params);
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
        <InPortalSurveyModal context={surveyData.context} onRemindMeLater={handleRemindMeLater} onSubmit={handleSurveySubmit} />
      )}
      {isResultOpen && <InPortalSurveyRes status={surveyResult} onClose={handleResultClose} />}
    </React.Fragment>
  );

  return { triggerSurvey, SurveyUI };
};
