const pleaSubmissionConfig = [
  {
    body: [
      {
        label: "CS_RESPONDENT_NAME",
        isMandatory: true,
        type: "dropdown",
        key: "accusedDetails",
        populators: {
          optionsKey: "name",
          required: true,
          isMandatory: true,
          error: "CORE_REQUIRED_FIELD_ERROR",
          name: "accusedDetails",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        label: "FATHER_NAME",
        isMandatory: true,
        key: "fatherName",
        type: "text",
        populators: {
          name: "fatherName",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
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
      },
      {
        label: "VILLAGE",
        isMandatory: true,
        key: "village",
        type: "text",
        populators: {
          name: "village",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
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
      },
      {
        label: "TALUK",
        isMandatory: true,
        key: "taluk",
        type: "text",
        populators: {
          name: "taluk",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
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
      },
      {
        label: "CASTE",
        isMandatory: true,
        key: "caste",
        type: "text",
        populators: {
          name: "caste",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
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
      },
      {
        label: "CALLING",
        isMandatory: true,
        key: "calling",
        type: "text",
        populators: {
          name: "calling",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
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
      },
      {
        label: "RELIGION",
        isMandatory: true,
        key: "religion",
        type: "text",
        populators: {
          name: "religion",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
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
      },
      {
        type: "text",
        label: "AGE",
        populators: {
          name: "age",
          error: "AGE_VALIDATION",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          validation: {
            maxLength: 3,
            minLength: 2,
            pattern: "[0-9]+",
            patternType: "Number",
          },
        },
        isMandatory: true,
      },
      {
        label: "Has the accused understood the charges as read out to them?",
        isMandatory: true,
        key: "chargesUnderstood",
        type: "radio",
        populators: {
          name: "chargesUnderstood",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          options: [
            {
              code: "YES",
              name: "YES",
            },
            {
              code: "NO",
              name: "NO",
            },
          ],
        },
      },
      {
        label: "Does the accused plead guilty to the charges?",
        isMandatory: true,
        key: "pleadGuilty",
        type: "radio",
        populators: {
          name: "pleadGuilty",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          options: [
            {
              code: "YES",
              name: "YES",
            },
            {
              code: "NO",
              name: "NO",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "remarks",
        isMandatory: true,
        isInfinite: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "Magistrate’s Remarks",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: false,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const pleaSubmissionDetailConfig = {
  formConfig: pleaSubmissionConfig,
  header: "PLEA_SUBMISSION",
};
