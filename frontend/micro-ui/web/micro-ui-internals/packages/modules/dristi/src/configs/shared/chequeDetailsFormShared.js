/** Shared cheque detail form field builders (FileCase). */

export const buildChequeMandatoryNameField = (label, name) => ({
  type: "text",
  label,
  populators: {
    name,
    error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
    validation: {
      pattern: {
        message: "CORE_COMMON_APPLICANT_NAME_INVALID",
        masterName: "commonUiConfig",
        moduleName: "patternValidation",
        patternType: "userName",
      },
      minLength: 1,
      patternType: "Name",
    },
  },
  isMandatory: true,
});

export const buildChequeIfscFieldStep = ({ fieldKey, inputName, label }) => ({
  body: [
    {
      key: fieldKey,
      type: "component",
      component: "InputWithSearch",
      isMandatory: true,
      populators: {
        inputs: [
          {
            name: inputName,
            label,
            validation: {
              pattern: {
                masterName: "commonUiConfig",
                moduleName: "patternValidation",
                patternType: "ifsc",
              },
              minLength: 11,
            },
            errorStyle: {
              paddingTop: "20px",
              marginBottom: "0px",
              fontSize: "12px",
              width: "70%",
            },
          },
        ],
      },
    },
  ],
});

export const buildChequeBankNameField = (label, name, ifscFieldKey) => ({
  type: "text",
  label,
  populators: {
    name,
    error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
    disable: `{{${ifscFieldKey}.BankReadOnly}}`,
    isDependent: true,
  },
  isMandatory: true,
});

export const buildChequeBranchNameField = (label, name, ifscFieldKey) => ({
  type: "text",
  label,
  populators: {
    name,
    error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
    disable: `{{${ifscFieldKey}.BranchReadOnly}}`,
    isDependent: true,
  },
  isMandatory: true,
});

export const buildChequeDocumentUploadStep = ({
  uploadKey,
  label,
  documentHeader,
  isMandatory,
  isOptional = false,
}) => ({
  body: [
    {
      key: uploadKey,
      type: "component",
      label,
      component: "SelectCustomDragDrop",
      populators: {
        inputs: [
          {
            name: "document",
            type: "DragDropComponent",
            fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
            ...(isOptional ? { isOptional: "CS_IS_OPTIONAL", isMandatory: false } : {}),
            maxFileSize: 10,
            documentHeader,
            isMultipleUpload: true,
            uploadGuidelines: "UPLOAD_DOC_10",
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
          },
        ],
      },
      isMandatory,
      withoutLabel: true,
    },
  ],
});
