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
          options: [],
        },
      },
      {
        label: "ACCUSED_FATHER_NAME",
        isMandatory: true,
        key: "fatherName",
        type: "text",
        populators: {
          name: "fatherName",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          validation: {
            pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]+$/i,
            minLength: 1,
            patternType: "Name",
          },
        },
      },
      {
        label: "VILLAGE",
        isMandatory: false,
        labelChildren: "optional",
        key: "village",
        type: "text",
        populators: {
          name: "village",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          validation: {
            pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]+$/i,
            minLength: 1,
            patternType: "Name",
          },
        },
      },
      {
        label: "TALUK",
        isMandatory: false,
        labelChildren: "optional",
        key: "taluk",
        type: "text",
        populators: {
          name: "taluk",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          validation: {
            pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]+$/i,
            minLength: 1,
            patternType: "Name",
          },
        },
      },
      {
        label: "CALLING",
        isMandatory: false,
        labelChildren: "optional",
        key: "calling",
        type: "text",
        populators: {
          name: "calling",
          error: "CORE_REQUIRED_FIELD_ERROR",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
          validation: {
            pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]+$/i,
            minLength: 1,
            patternType: "Name",
          },
        },
      },
      {
        type: "text",
        label: "AGE",
        key: "age",
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
        label: "ACCUSED_CHARGED_UNDERSTOOD",
        isMandatory: true,
        key: "isChargesUnderstood",
        type: "radio",
        populators: {
          name: "isChargesUnderstood",
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
        label: "PLEA_GUILTY_CHARGES",
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
        key: "magistrateRemarks",
        isMandatory: true,
        isInfinite: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "MEGISTRATE_REMARKS",
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
