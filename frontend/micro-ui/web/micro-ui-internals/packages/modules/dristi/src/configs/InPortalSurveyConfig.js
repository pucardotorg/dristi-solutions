// survey.config.js
export const surveyConfig = {
  contexts: {
    payment_success: {
      question: "How convenient was your payment experience on the ON Court Platform?",
    },
    case_filing: {
      question: "How convenient was the case filing process on the ON Court Platform?",
    },
    login_flow: {
      question: "How convenient was the login experience on the ON Court Platform?",
    },
  },
  ratings: [
    { label: "Very convenient", value: "very_convenient" },
    { label: "Convenient", value: "convenient" },
    { label: "Moderately convenient", value: "moderate" },
    { label: "Needs improvement", value: "needs_improvement" },
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
