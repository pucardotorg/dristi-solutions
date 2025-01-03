const delayApplicationFormConfig = [
  {
    body: [
      {
        key: "delayCondonationType",
        type: "component",
        label: "CS_QUESTION_DELAY_APPLICATION",
        notes: {
          key: "personalDetailsNote",
          type: "component",
          component: "SelectCustomNote",
          populators: {
            inputs: [
              {
                type: "InfoComponent",
                infoText: "CS_DELAY_CONDONATION_APPLICATION_NOT_REQUIRED_TEXT",
                infoHeader: "CS_COMMON_NOTE",
                infoTooltipMessage: "CS_NOTE_TOOLTIP_DELAY_CONDONATION_APPLICATION",
              },
            ],
          },
          withoutLabel: true,
        },
        component: "CustomRadioInfoComponent",
        populators: {
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "CS_QUESTION_DELAY_APPLICATION",
          options: [
            {
              code: "YES",
              name: "YES",
              showForm: false,
              isEnabled: true,
            },
            {
              code: "NO",
              name: "NO",
              showForm: true,
              isEnabled: true,
            },
          ],
          required: false,
          optionsKey: "name",
          isDependent: true,
          isMandatory: true,
        },
        isMandatory: true,
        labelStyles: {
          fontWeight: 700,
        },
        withoutLabel: true,
        noteDependentOn: "delayCondonationType.code",
        noteDependentOnValue: "YES",
      },
    ],
  },
  {
    body: [
      {
        key: "isDcaSkippedInEFiling",
        type: "radio",
        label: "SKIP_DELAY_APPLICATION_CONFIRM",
        populators: {
          name: "isDcaSkippedInEFiling",
          type: "radioButton",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "SKIP_DELAY_APPLICATION_CONFIRM",
          options: [
            {
              code: "YES",
              name: "YES",
              showDcaFileUpload: false,
            },
            {
              code: "NO",
              name: "NO",
              showDcaFileUpload: true,
            },
          ],
          isDependent: true,
          isMandatory: true,
        },
        labelStyles: {
          fontWeight: 700,
        },
      },
    ],
    dependentKey: {
      delayCondonationType: ["showForm"],
    },
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalDelayCondonationDetails",
        isMandatory: false,
        populators: {
          isMandatory: false,
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADDITIONAL_INFO",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
    dependentKey: {
      delayCondonationType: ["showForm"],
    },
  },
  {
    body: [
      {
        key: "condonationFileUpload",
        type: "component",
        label: "CS_DELAY_CONDONATION_APPLICATION",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              maxFileSize: 50,
              documentHeader: "CS_DELAY_CONDONATION_APPLICATION",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_50",
              infoTooltipMessage: "CS_DELAY_CONDONATION_APPLICATION",
              maxFileErrorMessage: "CS_FILE_LIMIT_1_MB",
            },
          ],
        },
        isMandatory: true,
        withoutLabel: true,
      },
    ],
    dependentKey: {
      isDcaSkippedInEFiling: ["showDcaFileUpload"],
    },
  },
];

export const delayApplicationConfig = {
  formconfig: delayApplicationFormConfig,
  header: "CS_RESPONDENT_DELAY_APPLICATION_HEADING",
  subtext: "CS_RESPONDENT_DELAY_APPLICATION_SUBTEXT",
  className: "delay-application",
  selectDocumentName: {
    condonationFileUpload: "CS_DELAY_CONDONATION_APPLICATION",
  },
};
