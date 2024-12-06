const submissionDocumentConfig = [
  {
    body: [
      {
        isMandatory: true,
        key: "documentType",
        type: "dropdown",
        label: "Document Type",
        populators: {
          name: "documentType",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          options: [
            {
              code: "MEMO",
              name: "MEMO",
            },
            {
              code: "RECIEPT",
              name: "RECIEPT",
            },
            {
              code: "XYZ",
              name: "XYZ",
            },
            {
              code: "ABC",
              name: "ABC",
            },
            {
              code: "CDE",
              name: "CDE",
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
      {
        isMandatory: true,
        key: "documentSubType",
        type: "dropdown",
        label: "Document Sub Type",
        populators: {
          name: "documentSubType",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          options: [
            {
              code: "MEMO",
              name: "MEMO",
            },
            {
              code: "RECIEPT",
              name: "RECIEPT",
            },
            {
              code: "XYZ",
              name: "XYZ",
            },
            {
              code: "ABC",
              name: "ABC",
            },
            {
              code: "CDE",
              name: "CDE",
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
      {
        label: "Document Title (Optional)",
        isMandatory: false,
        key: "documentTitle",
        type: "text",
        populators: { name: "documentTitle", customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" } },
      },
      {
        type: "component",
        key: "submissionDocuments",
        component: "SelectMultiUpload",
        disable: false,
        populators: {
          inputs: [
            {
              name: "uploadedDocs",
              isMandatory: true,
              textAreaHeader: "Documents",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileSize: 50,
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
              textAreaStyle: {
                fontSize: "16px",
                fontWeight: 400,
                marginBottom: "8px",
              },
            },
          ],
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "reasonForFiling",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaHeader: "Reason For Filing",
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
      },
    ],
  },
];

export const submissionDocumentDetailsConfig = {
  formConfig: submissionDocumentConfig,
  header: "Submit Documents",
  subText1: "Use this form to submit Memos, Affidavits, and other documents regarding your case to the court.",
  subText2: "Upload all related documents (e.g., Affidavit, ID card etc ) under the same document head. The system will merge them.",
};
