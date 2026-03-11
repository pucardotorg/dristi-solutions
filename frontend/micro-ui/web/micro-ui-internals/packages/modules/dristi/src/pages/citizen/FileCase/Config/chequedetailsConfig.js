export const chequeDetailsFormConfig = [
  {
    body: [
      {
        type: "text",
        label: "CS_SIGNATORY_NAME_BRACKETS",
        populators: {
          name: "chequeSignatoryName",
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
      },
    ],
  },
  {
    body: [
      {
        key: "bouncedChequeFileUpload",
        type: "component",
        label: "CS_BOUNCED_CHEQUE",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              isMandatory: true,
              maxFileSize: 10,
              documentHeader: "CS_BOUNCED_CHEQUE",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
        },
        isMandatory: true,
        withoutLabel: true,
      },
    ],
  },
  {
    body: [
      {
        type: "text",
        label: "CS_PAYEE_NAME_BRACKETS",
        populators: {
          name: "name",
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
      },
    ],
  },
  {
    body: [
      {
        key: "payeeIfscField",
        type: "component",
        component: "InputWithSearch",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "payeeIfsc",
              label: "CS_PAYEE_IFSC_CODE_BRACKETS",
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
  },
  {
    body: [
      {
        type: "text",
        label: "CS_PAYEE_BANK_NAME_BRACKETS",
        populators: {
          name: "payeeBankName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          disable: "{{payeeIfscField.BankReadOnly}}",
          isDependent: true,
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "text",
        label: "CS_PAYEE_BRANCH_NAME_BRACKETS",
        populators: {
          name: "payeeBranchName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          disable: "{{payeeIfscField.BranchReadOnly}}",
          isDependent: true,
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "text",
        label: "CS_CHEQUE_NUMBER",
        populators: {
          name: "chequeNumber",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            minLength: 6,
          },
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "date",
        label: "CS_DATE_OF_ISSUANCE",
        populators: {
          name: "issuanceDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            max: {
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
              patternType: "date",
            },
          },
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        key: "payerIfscField",
        type: "component",
        component: "InputWithSearch",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "payerIfsc",
              label: "CS_PAYER_IFSC_CODE_BRACKETS",
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
  },
  {
    body: [
      {
        type: "text",
        label: "CS_PAYER_BANK_NAME_BRACKETS",
        populators: {
          name: "payerBankName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          disable: "{{payerIfscField.BankReadOnly}}",
          isDependent: true,
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "text",
        label: "CS_PAYER_BRANCH_NAME_BRACKETS",
        populators: {
          name: "payerBranchName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          disable: "{{payerIfscField.BranchReadOnly}}",
          isDependent: true,
        },
        isMandatory: true,
      },
    ],
  },

  {
    body: [
      {
        type: "amount",
        label: "CS_CHEQUE_AMOUNT",
        populators: {
          name: "chequeAmount",
          error: "CORE_REQUIRED_FIELD_ERROR",
          prefix: "",
          intlConfig: {
            locale: "en-IN",
            currency: "INR",
          },
          componentInFront: "₹",
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        key: "policeStationJurisDictionCheque",
        type: "dropdown",
        label: "POLICE_STATION_JURISDICTION_CHEQUE",
        populators: {
          name: "policeStationJurisDictionCheque",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: {
            maxWidth: "100%",
            marginBottom: "10px",
          },
          required: false,
          mdmsConfig: {
            select:
              "(data) => { const list = data['case'].PoliceStation || []; return [...list].sort((a,b) => ((a?.name || '').toUpperCase()).localeCompare((b?.name || '').toUpperCase())); }",
            masterName: "PoliceStation",
            moduleName: "case",
          },
          optionsKey: "name",
          isMandatory: true,
          optionsCustomStyle: {
            height: "30vh",
            marginTop: "42px",
            overflowY: "auto",
          },
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "date",
        label: "CS_DATE_OF_CHEQUE_DEPOSIT",
        populators: {
          name: "depositDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            max: {
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
              patternType: "date",
            },
          },
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        key: "depositChequeFileUpload",
        type: "component",
        label: "CS_PROOF_DEPOSIT_CHEQUE",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              isOptional: "CS_IS_OPTIONAL",
              isMandatory: false,
              maxFileSize: 10,
              documentHeader: "CS_PROOF_DEPOSIT_CHEQUE",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
        },
        isMandatory: false,
        withoutLabel: true,
      },
    ],
  },
  {
    body: [
      {
        key: "delayReason",
        type: "component",
        component: "SelectCustomTextArea",
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "reasonForReturnCheque",
              type: "TextAreaComponent",
              errorStyle: {
                paddingTop: "20px",
              },
              textAreaSubHeader: "REASON_FOR_RETURN_CHEQUE",
            },
          ],
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        key: "returnMemoFileUpload",
        type: "component",
        label: "CS_CHEQUE_RETURN_MEMO",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              maxFileSize: 10,
              documentHeader: "CS_CHEQUE_RETURN_MEMO",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
        },
        isMandatory: true,
        withoutLabel: true,
      },
    ],
  },
  {
    body: [
      {
        key: "chequeAdditionalDetails",
        type: "component",
        label: "CS_CHEQUE_ADDITIONAL_DETAILS",
        component: "SelectCustomFormatterTextArea",
        populators: {
          inputs: [
            {
              name: "text",
              type: "TextAreaComponent",
              isOptional: true,
              textAreaSubHeader: "CS_CHEQUE_ADDITIONAL_DETAILS",
            },
          ],
        },
        withoutLabel: true,
      },
    ],
  },
];

export const chequeDetailsConfig = {
  formconfig: chequeDetailsFormConfig,
  header: "CS_CHEQUE_DETAILS_HEADING",
  subtext: "CS_CHEQUE_DETAILS_SUBTEXT",
  isOptional: false,
  addFormText: "ADD_CHEQUE",
  formItemName: "CS_CHEQUE",
  className: "cheque",
  selectDocumentName: {
    bouncedChequeFileUpload: "CS_BOUNCED_CHEQUE",
    depositChequeFileUpload: "CS_PROOF_DEPOSIT_CHEQUE",
    returnMemoFileUpload: "CS_CHEQUE_RETURN_MEMO",
  },
};
