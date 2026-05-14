const prayerAndSwornFormConfig = [
  {
    body: [
      {
        key: "prayerAndSwornNote",
        type: "component",
        component: "SelectCustomNote",
        populators: {
          inputs: [
            {
              type: "InfoComponent",
              infoText: "CS_NOTETEXT_PRAYER_AND_SWORN",
              infoHeader: "CS_COMMON_NOTE",
              infoTooltipMessage: "CS_NOTETEXT_PRAYER_AND_SWORN",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        key: "prayerAndSwornStatementType",
        type: "radio",
        label: "CS_PRAYER_AND_SWORN_STATEMENT_TYPE",
        populators: {
          name: "prayerAndSwornStatementType",
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "SELECT_PRAYER_AND_SWORN_STATEMENT_TYPE",
          options: [
            {
              code: "YES",
              name: "YES",
            },
            {
              code: "NO",
              name: "NO",
            },
            {
              code: "MAYBE",
              name: "Maybe",
            },
          ],
          required: false,
          optionsKey: "name",
          isDependent: true,
          isMandatory: false,
        },
        isMandatory: false,
        labelChildren: "optional",
      },
    ],
  },
  {
    body: [
      {
        key: "synopsis",
        type: "component",
        label: "CS_SYNOPSIS_HEADER",
        component: "SelectCustomFormatterTextArea",
        populators: {
          inputs: [
            {
              name: "text",
              rows: 15,
              type: "TextAreaComponent",
              maxLength: 50000,
              textAreaSubHeader: "CS_SYNOPSIS_HEADER",
            },
          ],
        },
        isMandatory: true,
        withoutLabel: true,
      },
      {
        key: "memorandumOfComplaint",
        type: "component",
        label: "CS_MEMORANDUM_OF_COMPLAINT_HEADER",
        component: "SelectCustomFormatterTextArea",
        populators: {
          inputs: [
            {
              name: "text",
              rows: 15,
              type: "TextAreaComponent",
              maxLength: 50000,
              textAreaSubHeader: "COMPLAINT_TEXT_AREA_SUBHEADER",
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
        key: "swornStatement",
        type: "component",
        label: "CS_SWORN_STATEMENT_HEADER",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              isMandatory: true,
              maxFileSize: 10,
              documentHeader: "CS_SWORN_STATEMENT_HEADER",
              documentSubText: "CS_SWORN_STATEMENT_SUBTEXT",
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
        key: "prayer",
        type: "component",
        label: "CS_PRAYER",
        component: "SelectCustomFormatterTextArea",
        populators: {
          inputs: [
            {
              name: "text",
              rows: 5,
              type: "TextAreaComponent",
              maxLength: 50000,
              textAreaSubHeader: "CS_PRAYER",
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
        key: "additionalDetails",
        type: "component",
        label: "CS_ADDITIONAL_DETAILS",
        component: "SelectCustomFormatterTextArea",
        populators: {
          inputs: [
            {
              name: "text",
              type: "TextAreaComponent",
              isOptional: true,
              textAreaSubHeader: "CS_ADDITIONAL_DETAILS",
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
        key: "SelectUploadDocWithName",
        type: "component",
        component: "SelectUploadDocWithName",
        populators: {
          inputs: [
            {
              name: "docName",
              type: "text",
              label: "DOCUMENT_LABEL_NAME",
              validation: {
                title: "",
                errMsg: "CORE_COMMON_DOCUMENT_NAME_INVALID",
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "docName",
                },
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
            },
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              isMandatory: true,
              maxFileSize: 10,
              documentHeader: "CS_SWORN_ADDITIONAL_ACTS_DOCUMENT_HEADER",
              isMultipleUpload: false,
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
    ],
  },
];

export const prayerAndSwornConfig = {
  formconfig: prayerAndSwornFormConfig,
  header: "CS_PRAYER_AND_SWORN_STATEMENT_HEADING",
  // addFormText: "ADD_DOCUMENT",
  className: "prayer-and-sworm",
  selectDocumentName: {
    swornStatement: "CS_SWORN_STATEMENT_HEADER",
  },
  subtext: "CS_COMPLAINT_DATA_ENTRY_INFO",
};
