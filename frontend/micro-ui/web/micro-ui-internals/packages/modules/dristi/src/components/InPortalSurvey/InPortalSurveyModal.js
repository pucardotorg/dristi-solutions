import React, { useState } from "react";
import { surveyConfig } from "../../configs/InPortalSurveyConfig";

const InPortalSurveyModal = ({ context, onRemindMeLater, onSubmit }) => {
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);

    try {
      await onSubmit({
        context,
        rating,
        feedback: feedback.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="survey-modal-overlay">
      <div className="survey-modal-container">
        <h3 className="survey-question">{surveyConfig.contexts[context]?.question}</h3>

        <div className="survey-options">
          {surveyConfig.ratings.map((opt) => (
            <button
              key={opt.value}
              className={`option-btn ${rating === opt.value ? "selected" : ""}`}
              onClick={() => setRating(opt.value)}
              disabled={loading}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <textarea
          placeholder={surveyConfig.feedbackPlaceholder}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="survey-textarea"
          disabled={loading}
        />

        <div className="survey-actions">
          <button className="remind-btn" onClick={onRemindMeLater} disabled={loading}>
            {surveyConfig.buttons.remindLater}
          </button>

          <button
            className={`submit-btn ${!rating ? "disabled" : ""}`}
            onClick={handleSubmit}
            disabled={!rating || loading}
          >
            {loading ? "Submitting..." : surveyConfig.buttons.submit}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InPortalSurveyModal;
