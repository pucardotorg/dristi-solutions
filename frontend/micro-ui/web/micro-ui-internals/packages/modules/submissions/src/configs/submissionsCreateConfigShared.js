/** Repeated application form blocks in submissionsCreateConfig.js (PR-A Sonar dedupe). */

const submissionComplainantOptions = [
  {
    code: "complainantOne",
    name: "ComplainantOne",
  },
];

const submissionPartyTypeOptions = [
  {
    code: "complainant",
    name: "Complainant",
  },
  {
    code: "respondant",
    name: "Respondant",
  },
];

export const submissionAlphaNumericPopulatorValidation = {
  customValidationFn: {
    moduleName: "dristiSubmissions",
    masterName: "alphaNumericValidation",
  },
};

export const submissionChooseComplainantField = ({ withStyles = true } = {}) => ({
  inline: true,
  label: "CHOOSE_COMPLAINANT",
  isMandatory: true,
  type: "dropdown",
  key: "selectComplainant",
  populators: {
    optionsKey: "name",
    ...(withStyles ? { styles: { maxWidth: "100%" } } : {}),
    options: submissionComplainantOptions,
  },
});

export const submissionRefOrderIdField = ({ hideInForm = false } = {}) => ({
  inline: true,
  label: "REF_ORDER_ID",
  disable: true,
  isMandatory: false,
  key: "refOrderId",
  type: "text",
  populators: {
    name: "refOrderId",
    ...(hideInForm ? { hideInForm: true } : {}),
  },
});

export const submissionStandardCaseContextFields = [
  {
    inline: true,
    label: "COURT_NAME",
    isMandatory: true,
    key: "courtName",
    type: "text",
    populators: { name: "courtName", hideInForm: true },
  },
  {
    inline: true,
    label: "CASE_NAME",
    isMandatory: true,
    key: "caseName",
    type: "text",
    populators: { name: "caseName", hideInForm: true },
  },
  {
    inline: true,
    label: "CNR_NUMBER",
    isMandatory: true,
    key: "cnrNumber",
    type: "text",
    populators: { name: "cnrNumber", hideInForm: true },
  },
  {
    inline: true,
    label: "FILING_NUMBER",
    isMandatory: true,
    key: "filingNumber",
    type: "text",
    populators: { name: "filingNumber", hideInForm: true },
  },
  {
    inline: true,
    label: "DATE_OF_APPLICATION",
    disable: true,
    isMandatory: true,
    key: "applicationDate",
    type: "date",
    populators: { name: "applicationDate" },
  },
  {
    inline: true,
    label: "APPLICANT_NAME",
    isMandatory: true,
    key: "applicantName",
    type: "text",
    populators: { name: "applicantName", hideInForm: true },
  },
  {
    inline: true,
    label: "PARTY_TYPE",
    isMandatory: true,
    type: "dropdown",
    key: "partyType",
    populators: {
      optionsKey: "name",
      hideInForm: true,
      options: submissionPartyTypeOptions,
    },
  },
  {
    inline: true,
    label: "REPRESENTED_BY",
    isMandatory: true,
    key: "representedBy",
    type: "text",
    populators: { name: "representedBy", hideInForm: true },
  },
];

/** Ref order + hidden case metadata used across application submission types. */
export const buildSubmissionApplicationContextFields = ({ refOrderIdHideInForm = false } = {}) => [
  submissionRefOrderIdField({ hideInForm: refOrderIdHideInForm }),
  ...submissionStandardCaseContextFields,
];

const defaultTextAreaStyle = {
  fontSize: "16px",
  fontWeight: 400,
  marginBottom: 0,
};

export const buildSubmissionTextAreaField = ({
  component = "SelectCustomTextArea",
  key,
  schemaKeyPath,
  transformer,
  isMandatory = false,
  isInfinite = true,
  inline = true,
  withoutLabel,
  disable,
  textAreaSubHeader,
  textAreaHeader,
  headerClassName,
  subHeaderClassName = "dristi-font-big-bold",
  placeholder = "TYPE_HERE_PLACEHOLDER",
  isOptional,
  inputStyle = defaultTextAreaStyle,
  populatorsValidation,
  populatorsCustomStyle,
} = {}) => ({
  ...(inline ? { inline: true } : {}),
  type: "component",
  component,
  key,
  ...(schemaKeyPath ? { schemaKeyPath } : {}),
  ...(transformer ? { transformer } : {}),
  ...(isMandatory !== undefined ? { isMandatory } : {}),
  ...(isInfinite !== undefined ? { isInfinite } : {}),
  ...(withoutLabel ? { withoutLabel } : {}),
  ...(disable !== undefined ? { disable } : {}),
  populators: {
    inputs: [
      {
        name: "text",
        type: "TextAreaComponent",
        placeholder,
        ...(textAreaSubHeader ? { textAreaSubHeader } : {}),
        ...(textAreaHeader ? { textAreaHeader } : {}),
        ...(headerClassName ? { headerClassName } : {}),
        ...(subHeaderClassName ? { subHeaderClassName } : {}),
        ...(isOptional !== undefined ? { isOptional } : {}),
        ...(inputStyle ? { textAreaStyle: inputStyle } : {}),
      },
    ],
    ...(populatorsValidation ? { validation: populatorsValidation } : {}),
    ...(populatorsCustomStyle ? { customStyle: populatorsCustomStyle } : {}),
  },
});

export const buildSubmissionTextAreaSection = (options) => ({
  body: [buildSubmissionTextAreaField(options)],
});

export const buildSubmissionFormatterTextAreaField = ({
  key,
  schemaKeyPath,
  transformer = "customTextArea",
  textAreaSubHeader,
  textAreaHeader,
  isMandatory = true,
  isOptional,
  subHeaderClassName = "dristi-font-big-bold",
  populatorsCustomStyle,
} = {}) =>
  buildSubmissionTextAreaField({
    component: "SelectCustomFormatterTextArea",
    key,
    schemaKeyPath,
    transformer,
    isMandatory,
    isInfinite: undefined,
    textAreaSubHeader,
    textAreaHeader,
    isOptional,
    subHeaderClassName,
    inputStyle: defaultTextAreaStyle,
    populatorsCustomStyle,
  });

export const submissionDocumentDragDropSection = {
  body: [
    {
      type: "component",
      component: "SelectCustomDragDrop",
      key: "submissionDocuments",
      isMandatory: true,
      populators: {
        inputs: [
          {
            isMandatory: true,
            name: "documents",
            documentHeader: "DOCUMENT",
            documentHeaderStyle: { fontSize: "16px", fontWeight: 400, marginBottom: 0 },
            type: "DragDropComponent",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["TXT", "DOC", "PDF", "DOCX", "PNG", "JPG", "JPEG"],
            isMultipleUpload: false,
            uploadGuidelines: "UPLOAD_DOC_10",
            headerClassName: "dristi-font-bold",
          },
        ],
        customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
      },
    },
  ],
};

export const submissionOthersDragDropSection = {
  body: [
    {
      type: "component",
      component: "SelectCustomDragDrop",
      key: "othersDocument",
      isMandatory: false,
      populators: {
        inputs: [
          {
            isMandatory: false,
            name: "documents",
            documentHeader: "OTHERS_DOCUMENT",
            documentHeaderStyle: { fontSize: "19px", fontWeight: 700 },
            type: "DragDropComponent",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["PDF", "JPEG", "PNG", "JPG"],
            uploadGuidelines: "UPLOAD_PDF_JPEG_50",
            headerClassName: "dristi-font-bold",
            isOptional: "CS_IS_OPTIONAL",
          },
        ],
      },
    },
  ],
};

export const submissionReasonForApplicationFormatterField = buildSubmissionFormatterTextAreaField({
  key: "reasonForApplication",
  schemaKeyPath: "applicationDetails.reasonForApplication",
  textAreaSubHeader: "REASON_FOR_APPLICATION",
  isOptional: false,
});

export const submissionOthersDetailsFormatterField = buildSubmissionFormatterTextAreaField({
  key: "applicationDetails",
  schemaKeyPath: "applicationDetails.reasonForApplication",
  textAreaSubHeader: "DETAILS",
});

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
