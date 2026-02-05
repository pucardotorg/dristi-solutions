export const AddTeamplateFormConfig = [
  {
    body: [
      {
        label: "PROCESS_TITLE",
        isMandatory: true,
        key: "processTitle",
        disable: false,
        type: "text",
        populators: { name: "processTitle" },
      },
      {
        label: "IS_COVER_LETTER_REQUIRED",
        isMandatory: true,
        key: "isCoverLetterRequired",
        type: "radio",
        populators: {
          name: "isCoverLetterRequired",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          customStyle: { display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "flex-start", gap: "16px" },
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
        label: "SELECT_ADRESSEE",
        isMandatory: true,
        key: "selectAddressee",
        disable: false,
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "selectAddressee",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "POLICE",
              name: "POLICE",
            },
            {
              code: "OTHER",
              name: "OTHER",
            },
            {
              code: "COMPLAINTANT",
              name: "COMPLAINTANT",
            },
            {
              code: "RESPONDENT",
              name: "RESPONDENT",
            },
          ],
        },
      },
      {
        label: "ADRESSEE_NAME",
        isMandatory: true,
        key: "addresseeName",
        disable: false,
        type: "text",
        populators: { name: "addresseeName" },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "orderText",
        isMandatory: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ORDER_TEXT",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: false,
              type: "TextAreaComponent",
              style: { marginBottom: "20px" },
            },
          ],
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "processText",
        isMandatory: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PROCESS_TEXT",
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

export const coverLetterTextConfig = [
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "coverLetterText",
        isMandatory: true,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COVER_LETTER_TEXT",
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
