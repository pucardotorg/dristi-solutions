const debtLiabilityFromconfig = [
  {
    body: [
      {
        type: "text",
        label: "CS_NATURE_DEBT_LIABILITY",
        populators: {
          name: "liabilityNature",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          validation: {
            title: "",
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "debtNature",
            },
            minLength: 1,
            patternType: "Name",
          },
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        key: "liabilityType",
        type: "radio",
        label: "CHEQUE_FOR_FULL_OR_PARTIAL_LIABILITY",
        populators: {
          name: "liabilityType",
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "SELECT_RESPONDENT_TYPE",
          required: false,
          mdmsConfig: {
            select: "(data) => {return data['case'].LiabilityCategory?.map((item) => {return item;});}",
            masterName: "LiabilityCategory",
            moduleName: "case",
          },
          optionsKey: "name",
          isDependent: true,
          isMandatory: true,
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "amount",
        label: "CS_TOTAL_CHEQUE_AMOUNT",
        component: "CustomInput",
        populators: {
          name: "totalAmount",
          prefix: "",
          validation: {
            max: 999999999999,
            maxLength: 12,
          },
          componentInFront: "₹",
        },
        isMandatory: true,
      },
    ],
    dependentKey: {
      liabilityType: ["showAmountCovered"],
    },
  },
  {
    body: [
      {
        key: "addressDetailsNote",
        type: "component",
        component: "SelectCustomNote",
        populators: {
          inputs: [
            {
              type: "InfoComponent",
              infoText: "CS_NOTE_DEBT_LIABILITY",
              infoHeader: "CS_COMMON_NOTE",
              infoTooltipMessage: "CS_NOTE_DEBT_LIABILITY",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        key: "debtLiabilityFileUpload",
        type: "component",
        label: "CS_PROOF_DEBT",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              isOptional: "CS_IS_OPTIONAL",
              maxFileSize: 10,
              documentHeader: "CS_PROOF_DEBT",
              isMultipleUpload: false,
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
        },
        withoutLabel: true,
      },
    ],
  },
  {
    body: [
      {
        key: "additionalDebtLiabilityDetails",
        type: "component",
        label: "CS_DEBT_ADDITIONAL_DETAILS",
        component: "SelectCustomFormatterTextArea",
        populators: {
          inputs: [
            {
              name: "text",
              type: "TextAreaComponent",
              isOptional: true,
              textAreaSubHeader: "CS_DEBT_ADDITIONAL_DETAILS",
            },
          ],
        },
        withoutLabel: true,
      },
    ],
  },
];
export const debtliabilityconfig = {
  formconfig: debtLiabilityFromconfig,
  header: "CS_DEBT_LIABILITY_HEADING",
  subtext: "CS_COMPLAINT_DATA_ENTRY_INFO",
  isOptional: false,
  className: "debt-liability",
  selectDocumentName: {
    debtLiabilityFileUpload: "CS_PROOF_DEBT",
  },
};
