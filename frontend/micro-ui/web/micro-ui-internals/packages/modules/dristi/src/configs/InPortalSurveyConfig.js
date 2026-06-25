// survey.config.js
export const surveyConfig = {
  contexts: {
    JOIN_CASE_PAYMENT: {
      question: "How convenient was it for the advocate of the accused to join the case on the ON Court Platform?",
    },
    TASK_PAYMENT: {
      question: "How convenient was it to make payments for notices, summons or warrants?",
    },
    APPLICATION_PAYMENT: {
      question: "How convenient was it to submit application through the ON Court Platform?",
    },
    FILING_PAYMENT: {
      question: "How convenient was the e-Filing process on the ON Court Platform?",
    },
    DEFECT_CORRECTION_PAYMENT: {
      question: "How convenient was defect correction through the ON Court Platform?",
    },
  },
  ratings: [
    { label: "Very convenient", value: "VERY_CONVENIENT" },
    { label: "Convenient", value: "CONVENIENT" },
    { label: "Moderately convenient", value: "MODERATELY_CONVENIENT" },
    { label: "Needs improvement", value: "NEEDS_IMPROVEMENT" },
  ],
  feedbackPlaceholder:
    "Please share any feedback — what worked well or what could be improved? (optional)",
  buttons: {
    remindLater: "Remind me later",
    submit: "Submit",
  },
  success: {
    title: "Thank you for your feedback!",
    message: "Your inputs help make ON Courts better for everyone.",
  },
  error: {
    title: "Something went wrong!",
    message: "Please try again later.",
  },
};
