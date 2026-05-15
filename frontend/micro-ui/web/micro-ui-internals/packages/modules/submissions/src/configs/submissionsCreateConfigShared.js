/** Repeated application comments textarea blocks in submissionsCreateConfig.js */

const submissionCommentsInput = {
  name: "text",
  textAreaSubHeader: "COMMENTS",
  subHeaderClassName: "dristi-font-big-bold",
  placeholder: "TYPE_HERE_PLACEHOLDER",
  isOptional: true,
  type: "TextAreaComponent",
};

export const submissionAdditionalCommentsTextAreaField = {
  inline: true,
  type: "component",
  component: "SelectCustomTextArea",
  key: "comments",
  schemaKeyPath: "applicationDetails.additionalComments",
  transformer: "customTextArea",
  isMandatory: false,
  isInfinite: true,
  populators: {
    inputs: [submissionCommentsInput],
  },
};

export const submissionAdditionalCommentsFormatterField = {
  inline: true,
  type: "component",
  component: "SelectCustomFormatterTextArea",
  key: "comments",
  schemaKeyPath: "applicationDetails.additionalComments",
  transformer: "customTextArea",
  isMandatory: false,
  populators: {
    inputs: [submissionCommentsInput],
  },
};

export const submissionAdditionalCommentsTextAreaSection = {
  body: [submissionAdditionalCommentsTextAreaField],
};

export const submissionAdditionalCommentsFormatterSection = {
  body: [submissionAdditionalCommentsFormatterField],
};

export const submissionAdditionalInformationField = {
  inline: true,
  type: "component",
  component: "SelectCustomTextArea",
  key: "additionalInformation",
  schemaKeyPath: "applicationDetails.additionalInformation",
  transformer: "customTextArea",
  isMandatory: false,
  isInfinite: true,
  populators: {
    inputs: [
      {
        name: "text",
        textAreaSubHeader: "ADDITIONAL_INFO",
        isOptional: true,
        subHeaderClassName: "dristi-font-big-bold",
        placeholder: "TYPE_HERE_PLACEHOLDER",
        type: "TextAreaComponent",
        textAreaStyle: {
          fontSize: "16px",
          fontWeight: 400,
          marginBottom: 0,
        },
      },
    ],
  },
};

export const submissionAdditionalInformationSection = {
  body: [submissionAdditionalInformationField],
};
