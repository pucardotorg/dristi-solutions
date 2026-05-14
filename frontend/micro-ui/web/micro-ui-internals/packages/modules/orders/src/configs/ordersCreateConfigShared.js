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

export const orderFormCommentsSection = {
  body: [orderFormCommentsTextAreaField],
};
