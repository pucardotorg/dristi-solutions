/**
 * Repeated "comments" SelectCustomTextArea sections from ordersCreateConfig.js (Sonar dedupe).
 * Export both full `{ body: [ field ] }` steps and bare field objects for inline use inside larger bodies.
 */

export const orderFormCommentsTextAreaField = {
  type: "component",
  component: "SelectCustomTextArea",
  key: "comments",
  isMandatory: false,
  isInfinite: true,
  populators: {
    inputs: [
      {
        name: "text",
        textAreaSubHeader: "COMMENTS",
        placeholder: "TYPE_HERE_PLACEHOLDER",
        isOptional: true,
        type: "TextAreaComponent",
      },
    ],
  },
};

export const orderFormCommentsTextAreaFieldHideInForm = {
  type: "component",
  component: "SelectCustomTextArea",
  key: "comments",
  isMandatory: false,
  isInfinite: true,
  populators: {
    inputs: [
      {
        name: "text",
        textAreaSubHeader: "COMMENTS",
        placeholder: "TYPE_HERE_PLACEHOLDER",
        isOptional: true,
        type: "TextAreaComponent",
      },
    ],
    hideInForm: true,
  },
};

export const orderFormRejectionReasonTextAreaField = {
  type: "component",
  component: "SelectCustomTextArea",
  key: "comments",
  isMandatory: false,
  isInfinite: true,
  populators: {
    hideInForm: true,
    inputs: [
      {
        name: "text",
        textAreaSubHeader: "REASON_FOR_REJECTION_SUBMISSION",
        placeholder: "TYPE_HERE_PLACEHOLDER",
        type: "TextAreaComponent",
      },
    ],
  },
};

export const orderFormCommentsSection = {
  body: [orderFormCommentsTextAreaField],
};

export const orderFormCommentsSectionHideInForm = {
  body: [orderFormCommentsTextAreaFieldHideInForm],
};

export const orderFormRejectionReasonCommentsSection = {
  body: [orderFormRejectionReasonTextAreaField],
};
