import { buildSubmissionFormatterTextAreaField } from "./submissionsCreateConfigShared";

const submissionDocumentReasonForFilingField = buildSubmissionFormatterTextAreaField({
  key: "reasonForFiling",
  textAreaHeader: "REASON_FOR_FILING",
  populatorsCustomStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
});

submissionDocumentReasonForFilingField.populators.validation = {
  customValidationFn: {
    moduleName: "dristiSubmissions",
    masterName: "alphaNumericValidation",
  },
};

const submissionDocumentConfig = [
  {
    body: [
      {
        isMandatory: true,
        key: "documentType",
        type: "dropdown",
        label: "DOCUMENT_TYPE",
        populators: {
          name: "documentType",
          optionsKey: "code",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Submission",
            masterName: "SubmissionDocumentType",
            select:
              "(data) => {return data['Submission'].SubmissionDocumentType?.map((item) => {return item;}).sort((a,b) => a.code.localeCompare(b.code));}",
          },
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
      {
        label: "DOCUMENT_TITLE",
        isMandatory: true,
        key: "documentTitle",
        type: "text",
        populators: {
          name: "documentTitle",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          error: "CORE_REQUIRED_FIELD_ERROR",
        },
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
              label: "CS_DOCUMENT",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileSize: 10,
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              labelStyle: {
                fontSize: "16px",
                fontWeight: 400,
                marginBottom: "8px",
              },
            },
          ],
        },
      },
      submissionDocumentReasonForFilingField,
    ],
  },
];

export const submissionDocumentDetailsConfig = {
  formConfig: submissionDocumentConfig,
  header: "SUBMIT_DOCUMENTS",
  subText1: "SUBMIT_DOC_SUB_TEXT",
  subText11: "SUBMIT_DOC_SUB_TEXT_CLERK",
  subText2: "SUBMIT_DOC_SUB_TEXT_HELP",
};
