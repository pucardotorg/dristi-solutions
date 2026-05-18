/** Repeated application form blocks in submissionsCreateConfig.js */

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

export const submissionExtensionBenefitSection = {
  body: [
    {
      inline: true,
      type: "component",
      component: "SelectCustomTextArea",
      key: "extensionBenefit",
      schemaKeyPath: "applicationDetails.benefitOfExtension",
      transformer: "customTextArea",
      isMandatory: true,
      isInfinite: true,
      populators: {
        inputs: [
          {
            name: "text",
            textAreaHeader: "EXTENSION_BENEFIT",
            headerClassName: "dristi-font-big-bold",
            placeholder: "TYPE_HERE_PLACEHOLDER",
            type: "TextAreaComponent",
          },
        ],
      },
    },
  ],
};

export const submissionDocumentPurposeSection = {
  body: [
    {
      inline: true,
      type: "component",
      component: "SelectCustomTextArea",
      key: "extensionBenefit",
      isMandatory: true,
      isInfinite: true,
      populators: {
        inputs: [
          {
            name: "text",
            textAreaHeader: "PURPOSE_FOR_DOCUMENT_SUBMISSION",
            placeholder: "TYPE_HERE_PLACEHOLDER",
            type: "TextAreaComponent",
            textAreaStyle: {
              fontSize: "16px",
              fontWeight: 400,
              marginBottom: 0,
            },
          },
        ],
        customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
      },
    },
  ],
};

export const submissionAdditionalInformationValidatedField = {
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
    validation: {
      customValidationFn: {
        moduleName: "dristiSubmissions",
        masterName: "alphaNumericValidation",
      },
    },
    customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  },
};

export const submissionPoaCommentsSection = {
  body: [
    {
      inline: true,
      type: "component",
      component: "SelectCustomTextArea",
      key: "comments",
      transformer: "customTextArea",
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
    },
  ],
};

export const submissionReasonForRequestField = {
  inline: true,
  type: "component",
  component: "SelectCustomTextArea",
  key: "reasonForRequest",
  schemaKeyPath: "applicationDetails.reasonForRequest",
  transformer: "customTextArea",
  isMandatory: true,
  isInfinite: true,
  withoutLabel: true,
  populators: {
    inputs: [
      {
        name: "text",
        textAreaSubHeader: "REASON_FOR_REQUEST",
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
    validation: {
      customValidationFn: {
        moduleName: "dristiSubmissions",
        masterName: "alphaNumericValidation",
      },
    },
    customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  },
};

export const submissionReasonForRequestSection = {
  body: [submissionReasonForRequestField],
};
