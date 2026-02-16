export const submissionTypeConfig = [
  {
    body: [
      {
        isMandatory: true,
        key: "submissionType",
        type: "dropdown",
        label: "SUBMISSION_TYPE",
        disable: true,
        populators: {
          name: "submissionType",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          options: [
            {
              code: "APPLICATION",
              name: "APPLICATION",
            },
            {
              code: "DOCUMENT",
              name: "DOCUMENT",
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
    ],
  },
];

export const applicationTypeConfig = [
  {
    body: [
      {
        isMandatory: true,
        key: "applicationType",
        type: "dropdown",
        label: "APPLICATION_TYPE",
        disable: false,
        populators: {
          name: "applicationType",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            masterName: "ApplicationType",
            moduleName: "Application",
            select: `(data) => {
              return data['Application'].ApplicationType
                ?.filter((item) => ![
                  'ADDING_WITNESSES',
                  'EXTENSION_SUBMISSION_DEADLINE',
                  'DOCUMENT',
                  'RE_SCHEDULE',
                  'CHECKOUT_REQUEST',
                  'SUBMIT_BAIL_DOCUMENTS',
                  'APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS'
                ].includes(item.type))
                .map((item) => {
                  return { ...item, name: item.type === 'REQUEST_FOR_BAIL' ? 'BAIL' : item.type };
                })
                .sort((a, b) => a.name.localeCompare(b.name)); 
            }`,
          },
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
    ],
  },
];

export const configsRescheduleRequest = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REF_ORDER_ID",
        disable: true,
        isMandatory: false,
        key: "refOrderId",
        type: "text",
        populators: { name: "refOrderId", hideInForm: true },
      },
      {
        inline: true,
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        inline: true,
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        inline: true,
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "DATE_OF_APPLICATION",
        disable: true,
        isMandatory: true,
        key: "applicationDate",
        type: "date",
        populators: { name: "applicationDate" },
      },
      {
        inline: true,
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        inline: true,
        label: "PARTY_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "partyType",
        populators: {
          optionsKey: "name",
          hideInForm: true,
          options: [
            {
              code: "complainant",
              name: "Complainant",
            },
            {
              code: "respondant",
              name: "Respondant",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REPRESENTED_BY",
        isMandatory: true,
        key: "representedBy",
        type: "text",
        populators: { name: "representedBy", hideInForm: true },
      },
      {
        inline: true,
        label: "INITIAL_HEARING_DATE",
        disable: true,
        isMandatory: true,
        key: "initialHearingDate",
        schemaKeyPath: "applicationDetails.initialHearingDate",
        transformer: "date",
        type: "date",
        populators: {
          name: "initialHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
        },
      },
      {
        inline: true,
        label: "RESCHEDULING_REASON",
        isMandatory: true,
        key: "reschedulingReason",
        schemaKeyPath: "applicationDetails.reasonForApplication",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "reschedulingReason",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Application",
            masterName: "ReschedulingReason",
            select:
              "(data) => {return data['Application'].ReschedulingReason?.map((item) => {return item;}).sort((a, b) => a.name.localeCompare(b.name));}",
          },
        },
      },
      {
        inline: true,
        label: "PROPOSED_DATE",
        isMandatory: true,
        key: "changedHearingDate",
        schemaKeyPath: "applicationDetails.newHearingScheduledDate",
        transformer: "date",
        type: "date",
        populators: {
          name: "changedHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiSubmissions",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        schemaKeyPath: "applicationDetails.additionalComments",
        transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsCheckoutRequest = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REF_ORDER_ID",
        disable: true,
        isMandatory: false,
        key: "refOrderId",
        type: "text",
        populators: { name: "refOrderId" },
      },
      {
        inline: true,
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        inline: true,
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        inline: true,
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "DATE_OF_APPLICATION",
        disable: true,
        isMandatory: true,
        key: "applicationDate",
        type: "date",
        populators: { name: "applicationDate" },
      },
      {
        inline: true,
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        inline: true,
        label: "PARTY_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "partyType",
        populators: {
          optionsKey: "name",
          hideInForm: true,
          options: [
            {
              code: "complainant",
              name: "Complainant",
            },
            {
              code: "respondant",
              name: "Respondant",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REPRESENTED_BY",
        isMandatory: true,
        key: "representedBy",
        type: "text",
        populators: { name: "representedBy", hideInForm: true },
      },
      {
        inline: true,
        label: "INITIAL_HEARING_DATE",
        disable: true,
        isMandatory: true,
        schemaKeyPath: "applicationDetails.initialHearingDate",
        transformer: "date",
        key: "initialHearingDate",
        type: "date",
        populators: {
          name: "initialHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
        },
      },
      {
        inline: true,
        label: "RESCHEDULING_REASON",
        isMandatory: true,
        schemaKeyPath: "applicationDetails.reasonForApplication",
        transformer: "mdmsDropdown",
        key: "reschedulingReason",
        type: "dropdown",
        populators: {
          name: "reschedulingReason",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Application",
            masterName: "ReschedulingReason",
            select:
              "(data) => {return data['Application'].ReschedulingReason?.map((item) => {return item;}).sort((a, b) => a.name.localeCompare(b.name));}",
          },
        },
      },
      {
        inline: true,
        label: "PROPOSED_DATE",
        isMandatory: true,
        schemaKeyPath: "applicationDetails.newHearingScheduledDate",
        transformer: "date",
        key: "changedHearingDate",
        type: "date",
        populators: {
          name: "changedHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiSubmissions",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
    ],
  },
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        type: "component",
        component: "SelectCustomTextArea",
        schemaKeyPath: "applicationDetails.additionalComments",
        transformer: "customTextArea",
        key: "comments",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsExtensionSubmissionDeadline = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REF_ORDER_ID",
        isMandatory: false,
        disable: true,
        key: "refOrderId",
        type: "text",
        populators: { name: "refOrderId" },
      },
      {
        inline: true,
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        inline: true,
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        inline: true,
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "DATE_OF_APPLICATION",
        disable: true,
        isMandatory: true,
        key: "applicationDate",
        type: "date",
        populators: {
          name: "applicationDate",
        },
      },
      {
        inline: true,
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        inline: true,
        label: "PARTY_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "partyType",
        populators: {
          optionsKey: "name",
          hideInForm: true,
          options: [
            {
              code: "complainant",
              name: "Complainant",
            },
            {
              code: "respondant",
              name: "Respondant",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REPRESENTED_BY",
        isMandatory: true,
        key: "representedBy",
        type: "text",
        populators: { name: "representedBy", hideInForm: true },
      },
      {
        inline: true,
        label: "DOCUMENT_TYPE",
        isMandatory: true,
        disable: true,
        type: "dropdown",
        key: "documentType",
        populators: {
          name: "documentType",
          optionsKey: "value",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Submission",
            masterName: "DocumentType",
            localePrefix: "",
          },
        },
      },
      {
        inline: true,
        label: "SUBMISSION_DATE",
        isMandatory: true,
        disable: true,
        key: "initialSubmissionDate",
        schemaKeyPath: "applicationDetails.originalSubmissionDate",
        transformer: "date",
        type: "date",
        populators: {
          name: "initialSubmissionDate",
        },
      },
      {
        inline: true,
        label: "REQUESTED_DATE",
        isMandatory: true,
        key: "changedSubmissionDate",
        schemaKeyPath: "applicationDetails.requestedExtensionDate",
        transformer: "date",
        type: "date",
        populators: {
          name: "changedSubmissionDate",
        },
      },
      {
        inline: true,
        label: "EXTENSION_REASON",
        isMandatory: true,
        key: "extensionReason",
        schemaKeyPath: "applicationDetails.reasonForApplication",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "extensionReason",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Application",
            masterName: "ExtensionReason",
            select:
              "(data) => {return data['Application'].ExtensionReason?.map((item) => {return item;}).sort((a, b) => a.name.localeCompare(b.name));}",
          },
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "extensionBenefit",
        schemaKeyPath: "applicationDetails.benefitOfExtension",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaHeader: "EXTENSION_BENEFIT",
              headerClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        schemaKeyPath: "applicationDetails.additionalComments",
        transformer: "customTextArea",
        key: "comments",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsDocumentSubmission = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "DOCUMENT_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "documentType",
        populators: {
          name: "documentType",
          optionsKey: "value",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Submission",
            masterName: "DocumentType",
            localePrefix: "",
          },
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },

      {
        inline: true,
        label: "SUBMISSION_TITLE",
        isMandatory: true,
        key: "submissionTitle",
        type: "text",
        populators: {
          name: "submissionTitle",
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
    ],
  },
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "extensionBenefit",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaHeader: "PURPOSE_FOR_DOCUMENT_SUBMISSION",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              textAreaStyle: {
                fontSize: "16px",
                fontWeight: 400,
                marginBottom: 0,
              },
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomDragDrop",
        key: "submissionDocuments",
        isMandatory: true,
        populators: {
          inputs: [
            {
              isMandatory: true,
              name: "documents",
              documentHeader: "DOCUMENT",
              documentHeaderStyle: { fontSize: "16px", fontWeight: 400, marginBottom: 0 },
              type: "DragDropComponent",
              maxFileSize: 10,
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              fileTypes: ["TXT", "DOC", "PDF", "DOCX", "PNG", "JPG", "JPEG"],
              isMultipleUpload: false,
              uploadGuidelines: "UPLOAD_DOC_10",
              headerClassName: "dristi-font-bold",
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
    ],
  },
];

export const configsProductionOfDocuments = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REF_ORDER_ID",
        isMandatory: false,
        disable: true,
        key: "refOrderId",
        type: "text",
        populators: { name: "refOrderId" },
      },
      {
        inline: true,
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        inline: true,
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        inline: true,
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "DATE_OF_APPLICATION",
        disable: true,
        isMandatory: true,
        key: "applicationDate",
        type: "date",
        populators: {
          name: "applicationDate",
        },
      },
      {
        inline: true,
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        inline: true,
        label: "PARTY_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "partyType",
        populators: {
          optionsKey: "name",
          hideInForm: true,
          options: [
            {
              code: "complainant",
              name: "Complainant",
            },
            {
              code: "respondant",
              name: "Respondant",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REPRESENTED_BY",
        isMandatory: true,
        key: "representedBy",
        type: "text",
        populators: { name: "representedBy", hideInForm: true },
      },
      {
        type: "component",
        component: "AddSubmissionDocument",
        key: "submissionDocuments",
        schemaKeyPath: "applicationDetails.applicationDocuments",
        transformer: "applicationDocuments",
        inline: false,
        populators: {
          inputs: [
            {
              isMandatory: true,
              key: "documentType",
              type: "dropdown",
              label: "DOCUMENT_TYPE",
              name: "documentType",
              disable: false,
              populators: {
                name: "documentType",
                styles: { maxWidth: "100%" },
                optionsKey: "name",
                required: true,
                mdmsConfig: {
                  moduleName: "Submission",
                  masterName: "SubmissionDocumentType",
                  select:
                    "(data) => {return data['Submission'].SubmissionDocumentType?.map((item) => {return item;}).sort((a, b) => a.name.localeCompare(b.name));}",
                },
              },
            },
            {
              label: "DOCUMENT_TITLE",
              type: "text",
              key: "documentTitle",
              name: "documentTitle",
              textInputStyle: { maxWidth: "100%" },
              validation: {
                isRequired: true,
                pattern: /^[0-9A-Z/]{0,20}$/,
                errMsg: "",
              },
              isMandatory: true,
            },
            {
              key: "submissionDocuments",
              label: "DOCUMENT_ATTACHMENT",
              type: "documentUpload",
              name: "document",
              uploadDivStyle: { maxWidth: "100%" },
              validation: {
                isRequired: true,
              },
              isMandatory: true,
              allowedFileTypes: /(.*?)(png|jpeg|jpg|pdf)$/i,
            },
          ],
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        schemaKeyPath: "applicationDetails.reasonForApplication",
        transformer: "customTextArea",
        key: "reasonForApplication",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_FOR_APPLICATION",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: false,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        schemaKeyPath: "applicationDetails.additionalComments",
        transformer: "customTextArea",
        key: "comments",
        isMandatory: false,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsCaseWithdrawal = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REF_ORDER_ID",
        isMandatory: false,
        disable: true,
        key: "refOrderId",
        type: "text",
        populators: { name: "refOrderId" },
      },
      {
        inline: true,
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        inline: true,
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        inline: true,
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "DATE_OF_APPLICATION",
        disable: true,
        isMandatory: true,
        key: "applicationDate",
        type: "date",
        populators: {
          name: "applicationDate",
        },
      },
      {
        inline: true,
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        inline: true,
        label: "PARTY_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "partyType",
        populators: {
          optionsKey: "name",
          hideInForm: true,
          options: [
            {
              code: "complainant",
              name: "Complainant",
            },
            {
              code: "respondant",
              name: "Respondant",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REPRESENTED_BY",
        isMandatory: true,
        key: "representedBy",
        type: "text",
        populators: { name: "representedBy", hideInForm: true },
      },
      {
        inline: true,
        label: "REASON_FOR_WITHDRAWAL",
        isMandatory: true,
        type: "dropdown",
        key: "reasonForWithdrawal",
        schemaKeyPath: "applicationDetails.reasonForWithdrawal",
        transformer: "mdmsDropdown",
        populators: {
          name: "reasonForWithdrawal",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          styles: { maxWidth: "100%" },
          mdmsConfig: {
            moduleName: "Application",
            masterName: "ReasonForWithdrawal",
            select:
              "(data) => {return data['Application'].ReasonForWithdrawal?.map((item) => {return item;}).sort((a, b) => a.name.localeCompare(b.name));}",
          },
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        schemaKeyPath: "applicationDetails.additionalComments",
        transformer: "customTextArea",
        key: "comments",
        isMandatory: false,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsCaseTransfer = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REF_ORDER_ID",
        isMandatory: false,
        disable: true,
        key: "refOrderId",
        type: "text",
        populators: { name: "refOrderId" },
      },
      {
        inline: true,
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        inline: true,
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        inline: true,
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "DATE_OF_APPLICATION",
        disable: true,
        isMandatory: true,
        key: "applicationDate",
        type: "date",
        populators: {
          name: "applicationDate",
        },
      },
      {
        inline: true,
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        inline: true,
        label: "PARTY_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "partyType",
        populators: {
          optionsKey: "name",
          hideInForm: true,
          options: [
            {
              code: "complainant",
              name: "Complainant",
            },
            {
              code: "respondant",
              name: "Respondant",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REPRESENTED_BY",
        isMandatory: true,
        key: "representedBy",
        type: "text",
        populators: { name: "representedBy", hideInForm: true },
      },
      {
        inline: true,
        label: "REQUESTED_COURT",
        schemaKeyPath: "applicationDetails.selectRequestedCourt",
        isMandatory: true,
        disable: false,
        key: "requestedCourt",
        type: "text",
        populators: { name: "requestedCourt" },
      },
      {
        inline: true,
        label: "GROUNDS_FOR_SEEKING_TRANSFER",
        isMandatory: true,
        key: "groundsForTransfer",
        type: "text",
        schemaKeyPath: "applicationDetails.groundsForSeekingTransfer",
        populators: {
          name: "groundsForTransfer",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiSubmissions",
              masterName: "alphaNumericInputTextValidation",
            },
          },
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "comments",
        schemaKeyPath: "applicationDetails.additionalComments",
        transformer: "customTextArea",
        isMandatory: false,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsSettlement = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REF_ORDER_ID",
        isMandatory: false,
        disable: true,
        key: "refOrderId",
        type: "text",
        populators: { name: "refOrderId" },
      },
      {
        inline: true,
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        inline: true,
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        inline: true,
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        inline: true,
        label: "DATE_OF_APPLICATION",
        disable: true,
        isMandatory: true,
        key: "applicationDate",
        type: "date",
        populators: {
          name: "applicationDate",
        },
      },
      {
        inline: true,
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        inline: true,
        label: "PARTY_TYPE",
        isMandatory: true,
        type: "dropdown",
        key: "partyType",
        populators: {
          optionsKey: "name",
          hideInForm: true,
          options: [
            {
              code: "complainant",
              name: "Complainant",
            },
            {
              code: "respondant",
              name: "Respondant",
            },
          ],
        },
      },
      {
        inline: true,
        label: "REPRESENTED_BY",
        isMandatory: true,
        key: "representedBy",
        type: "text",
        populators: { name: "representedBy", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        schemaKeyPath: "applicationDetails.additionalComments",
        transformer: "customTextArea",
        key: "comments",
        isMandatory: false,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsOthers = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        label: "APPLICATION_TITLE",
        isMandatory: true,
        key: "applicationTitle",
        schemaKeyPath: "applicationDetails.applicationTitle",
        type: "text",
        populators: {
          name: "applicationTitle",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiSubmissions",
              masterName: "alphaNumericInputTextValidation",
            },
          },
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomDragDrop",
        key: "othersDocument",
        isMandatory: false,
        populators: {
          inputs: [
            {
              isMandatory: false,
              name: "documents",
              documentHeader: "OTHERS_DOCUMENT",
              documentHeaderStyle: { fontSize: "19px", fontWeight: 700 },
              type: "DragDropComponent",
              maxFileSize: 10,
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              fileTypes: ["PDF", "JPEG", "PNG", "JPG"],
              uploadGuidelines: "UPLOAD_PDF_JPEG_50",
              headerClassName: "dristi-font-bold",
              isOptional: "CS_IS_OPTIONAL",
            },
          ],
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        type: "component",
        component: "SelectCustomFormatterTextArea",
        schemaKeyPath: "applicationDetails.reasonForApplication",
        transformer: "customTextArea",
        key: "applicationDetails",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "DETAILS",
              subHeaderClassName: "dristi-font-big-bold",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const requestForBail = [
  {
    body: [
      {
        inline: true,
        label: "PETITIONER_NAME",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        key: "refOrderId",
        type: "component",
        withoutLabel: true,
        component: "SelectEmptyComponent",
        populators: {},
      },
      {
        label: "PETITIONER_FATHER_NAME",
        isMandatory: true,
        key: "litigantFatherName",
        type: "text",
        populators: {
          name: "litigantFatherName",
          error: "CORE_REQUIRED_FIELD_ERROR",
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
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "reasonForApplicationOfBail",
        schemaKeyPath: "applicationDetails.reasonForApplicationOfBail",
        transformer: "customTextArea",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "GROUND_REASON_BAIL",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        label: "DO_YOU_WANT_TO_ADD_SURETY",
        key: "addSurety",
        type: "radio",
        isMandatory: true,
        populators: {
          name: "addSurety",
          optionsKey: "name",
          options: [
            { code: "YES", name: "Yes", showSurety: true },
            { code: "NO", name: "No", showSurety: false },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        key: "sureties",
        component: "SuretyComponent",
        // schemaKeyPath: "applicationDetails.applicationDocuments",
        // transformer: "applicationDocuments",
        name: "BAIL_SURETY",
        disable: false,
        show: (form) => {
          const addSurety = form?.addSurety;
          if (!addSurety) return false;
          if (typeof addSurety === "object") {
            if (typeof addSurety.showSurety === "boolean") return addSurety.showSurety;
            return addSurety?.code === "YES";
          }
          return addSurety === "YES" || addSurety === true;
        },
        isMandatory: false,
        populators: {
          hideInForm: false,
          inputs: [
            {
              label: "FULL_NAME",
              isMandatory: true,
              key: "name",
              type: "text",
              name: "name",
              placeholder: "Ex: Raj Kumar Singh",
              validation: {
                isRequired: true,
                pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
                errMsg: "CORE_COMMON_APPLICANT_NAME_INVALID",
                minLength: 1,
              },
            },
            {
              label: "FATHER_NAME",
              isMandatory: true,
              key: "fatherName",
              type: "text",
              name: "fatherName",
              placeholder: "Ex: Raj Kumar Singh",
              validation: {
                isRequired: true,
                pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
                errMsg: "CORE_COMMON_APPLICANT_NAME_INVALID",
                minLength: 1,
              },
            },
            {
              name: "mobileNumber",
              key: "mobileNumber",
              type: "text",
              error: "ERR_HRMS_INVALID_MOB_NO",
              label: "PARTY_PHONE_NUMBER",
              placeholder: "Ex: 1234567890",
              validation: {
                pattern: "^[6-9][0-9]{0,9}$",
                isNumber: true,
                isRequired: true,
                maxLength: 10,
                minLength: 10,
              },
              isMandatory: true,
              componentInFront: "+91",
            },
            {
              type: "infoBox",
              name: "infoBox",
              showTooltip: true,
              infoHeader: "CS_PLEASE_COMMON_NOTE",
              infoText: "BAIL_BOND_NOTE",
            },
            {
              name: "email",
              key: "email",
              type: "text",
              error: "ERR_HRMS_INVALID_MOB_NO",
              label: "E-Mail Address",
              isMandatory: false,
              isOptional: true,
              validation: {
                isRequired: false,
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/,
                errMsg: "PLEASE_ENTER_VALID_EMAIL",
              },
            },
            {
              key: "address",
              type: "component",
              label: "ADDRESS",
              component: "AddressBailBond",
              isMandatory: true,
              populators: {
                inputs: [
                  {
                    name: "locality",
                    type: "text",
                    label: "ADDRESS_LINE_1",
                    validation: {
                      errMsg: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
                      // pattern: {
                      //   masterName: "commonUiConfig",
                      //   moduleName: "patternValidation",
                      //   patternType: "address",
                      // },
                      maxlength: 256,
                      minlength: 2,
                      isRequired: true,
                    },
                    isMandatory: true,
                    isFormatRequired: true,
                    inputFieldClassName: "user-details-form-style",
                  },
                  {
                    name: "city",
                    type: "text",
                    label: "CITY/TOWN",
                    validation: {
                      title: "",
                      errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
                      // pattern: {
                      //   masterName: "commonUiConfig",
                      //   moduleName: "patternValidation",
                      //   patternType: "name",
                      // },
                      isRequired: true,
                      patternType: "Name",
                    },
                    isMandatory: true,
                    inputFieldClassName: "user-details-form-style",
                  },
                  {
                    name: "pincode",
                    type: "text",
                    label: "PINCODE",
                    validation: {
                      max: "999999",
                      title: "",
                      errMsg: "ADDRESS_PINCODE_INVALID",
                      pattern: "[0-9]+",
                      maxlength: 6,
                      minlength: 6,
                      isRequired: true,
                      patternType: "Pincode",
                    },
                    isMandatory: true,
                    inputFieldClassName: "user-details-form-style",
                  },
                  {
                    name: "district",
                    type: "text",
                    label: "DISTRICT",
                    validation: {
                      title: "",
                      errMsg: "CORE_COMMON_APPLICANT_DISTRICT_INVALID",
                      // pattern: {
                      //   masterName: "commonUiConfig",
                      //   moduleName: "patternValidation",
                      //   patternType: "name",
                      // },
                      isRequired: true,
                      patternType: "Name",
                    },
                    isMandatory: true,
                    inputFieldClassName: "user-details-form-style",
                  },
                  {
                    name: "state",
                    type: "text",
                    label: "STATE",
                    validation: {
                      title: "",
                      errMsg: "CORE_COMMON_APPLICANT_STATE_INVALID",
                      // pattern: {
                      //   masterName: "commonUiConfig",
                      //   moduleName: "patternValidation",
                      //   patternType: "name",
                      // },
                      isRequired: true,
                      patternType: "Name",
                    },
                    isMandatory: true,
                    inputFieldClassName: "user-details-form-style",
                  },
                ],
                validation: {},
              },
              withoutLabel: true,
            },
            {
              type: "component",
              key: "identityProof",
              component: "SelectMultiUpload",
              disable: false,
              populators: {
                inputs: [
                  {
                    name: "document",
                    isMandatory: true,
                    documentHeader: "IDENTITY_PROOF",
                    fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
                    uploadGuidelines: "UPLOAD_DOC_10",
                    maxFileSize: 10,
                    maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
                    isMultipleUpload: true,
                    labelStyle: {
                      fontSize: "16px",
                      fontWeight: 400,
                      marginBottom: "8px",
                    },
                  },
                ],
              },
            },
            {
              type: "component",
              key: "proofOfSolvency",
              component: "SelectMultiUpload",
              disable: false,
              populators: {
                inputs: [
                  {
                    name: "document",
                    isMandatory: true,
                    documentHeader: `PROOF_OF_SOLVENCY`,
                    fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
                    uploadGuidelines: "UPLOAD_DOC_10",
                    maxFileSize: 10,
                    maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
                    isMultipleUpload: true,
                    labelStyle: {
                      fontSize: "16px",
                      fontWeight: 400,
                      marginBottom: "8px",
                    },
                  },
                ],
              },
            },
            {
              type: "component",
              key: "otherDocuments",
              component: "SelectMultiUpload",
              disable: false,
              populators: {
                inputs: [
                  {
                    name: "document",
                    isMandatory: false,
                    isOptional: "CS_IS_OPTIONAL",
                    documentHeader: "OTHER_DOCUMENTS_HEADING",
                    fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
                    uploadGuidelines: "UPLOAD_DOC_10",
                    maxFileSize: 10,
                    maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
                    isMultipleUpload: true,
                    labelStyle: {
                      fontSize: "16px",
                      fontWeight: 400,
                      marginBottom: "8px",
                    },
                    documentOptionalStyle: {
                      marginBottom: "8px",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
    dependentKey: {
      addSurety: ["showSurety"],
    },
  },
];

export const submitDocsForBail = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        key: "refOrderId",
        type: "component",
        withoutLabel: true,
        component: "SelectEmptyComponent",
        populators: {},
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalInformation",
        schemaKeyPath: "applicationDetails.additionalInformation",
        transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADDITIONAL_INFO",
              isOptional: true,
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        type: "component",
        component: "CustomInfo",
        key: "suretyDocuments",
        inline: false,
        isMandatory: false,
        populators: {
          inputs: [
            {
              infoHeader: "INFO",
              infoText: "SURETY_DOCUMENTS_INFO_TEXT",
              infoTooltipMessage: "CS_NOTETOOLTIP_RESPONDENT_PERSONAL_DETAILS",
              type: "InfoComponent",
              linkText: "CLICK_HERE",
              modalHeading: "LIST_OF_SURETY_DOCUMENT",
              modalData: [],
            },
          ],
        },
      },
      {
        type: "component",
        key: "supportingDocuments",
        component: "SupportingDocsComponent",
        schemaKeyPath: "applicationDetails.applicationDocuments",
        transformer: "applicationDocuments",
        name: "SUPPORTING_DOCS",
        disable: false,
        isMandatory: true,
        populators: {
          inputs: [
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
                // need to change
                mdmsConfig: {
                  moduleName: "Submission",
                  masterName: "SubmissionDocumentType",
                  select:
                    "(data) => {return data['Submission'].SubmissionDocumentType?.map((item) => {return item;}).sort((a, b) => a.code.localeCompare(b.code));}",
                },
                customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
              },
            },
            {
              label: "DOCUMENT_TITLE",
              labelChildren: "optional",
              isMandatory: false,
              key: "documentTitle",
              type: "text",
              name: "documentTitle",
              validation: {
                isRequired: false,
                pattern: /^[0-9A-Z/]{0,20}$/,
                errMsg: "",
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
          ],
        },
      },
    ],
  },
];

export const submitDelayCondonation = [
  {
    body: [
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        key: "refOrderId",
        type: "component",
        withoutLabel: true,
        component: "SelectEmptyComponent",
        populators: {},
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "reasonForDelay",
        schemaKeyPath: "applicationDetails.reasonForDelay",
        transformer: "customTextArea",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "Reason for Delay",
              isOptional: false,
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              textAreaStyle: {
                fontSize: "16px",
                fontWeight: 400,
                marginBottom: 0,
              },
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        schemaKeyPath: "applicationDetails.prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
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
      {
        inline: true,
        type: "component",
        component: "SelectCustomFormatterTextArea",
        key: "additionalInformation",
        schemaKeyPath: "applicationDetails.additionalInformation",
        transformer: "customTextArea",
        isMandatory: false,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADDITIONAL_INFO",
              isOptional: true,
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              textAreaStyle: {
                fontSize: "16px",
                fontWeight: 400,
                marginBottom: 0,
              },
            },
          ],
          customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
        },
      },
      {
        type: "component",
        key: "supportingDocuments",
        component: "SupportingDocsComponent",
        schemaKeyPath: "applicationDetails.applicationDocuments",
        transformer: "applicationDocuments",
        name: "SUPPORTING_DOCS",
        disable: false,
        isMandatory: true,
        populators: {
          inputs: [
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
                // need to change
                mdmsConfig: {
                  moduleName: "Submission",
                  masterName: "SubmissionDocumentType",
                  select:
                    "(data) => {return data['Submission'].SubmissionDocumentType?.map((item) => {return item;}).sort((a, b) => a.code.localeCompare(b.code));}",
                },
                customStyle: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
              },
            },
            {
              label: "DOCUMENT_TITLE_OPTIONAL",
              labelChildren: "optional",
              isMandatory: false,
              key: "documentTitle",
              type: "text",
              name: "documentTitle",
              validation: {
                isRequired: false,
                pattern: /^[0-9A-Z/]{0,20}$/,
                errMsg: "",
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
          ],
        },
      },
    ],
  },
];

export const poaClaimingConfig = [
  {
    body: [
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              textAreaStyle: {
                fontSize: "16px",
                fontWeight: 400,
                marginBottom: 0,
              },
              errorStyle: {
                marginTop: "5px",
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

export const configsAdvancementOrAdjournment = [
  {
    body: [
      {
        label: "refHearingId",
        isMandatory: false,
        key: "refHearingId",
        disable: true,
        type: "text",
        schemaKeyPath: "applicationDetails.refHearingId",
        populators: { name: "refHearingId", customStyle: { display: "none" } },
      },
      {
        inline: true,
        label: "CHOOSE_COMPLAINANT",
        isMandatory: true,
        type: "dropdown",
        key: "selectComplainant",
        populators: {
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          options: [
            {
              code: "complainantOne",
              name: "ComplainantOne",
            },
          ],
        },
      },
      {
        inline: true,
        label: "ORIGINAL_HEARING_DATE",
        disable: true,
        isMandatory: true,
        key: "initialHearingDate",
        schemaKeyPath: "applicationDetails.initialHearingDate",
        transformer: "date",
        type: "date",
        populators: {
          name: "initialHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
        },
      },
      {
        type: "component",
        component: "SelectCustomNote",
        key: "bulkDateInputNote",
        populators: {
          inputs: [
            {
              infoHeader: "CS_COMMON_NOTE",
              infoText: "SELECT_MULTIPLE_DATE_INFO_MESSAGE",
              showTooltip: true,
              type: "InfoComponent",
            },
          ],
        },
      },
      {
        key: "newHearingDates",
        type: "component",
        label: "SUGGESTED_NEW_HEARING_DATES",
        component: "SelectBulkDateInputs",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "newHearingDates",
              error: "ERR_HRMS_INVALID_MOB_NO",
              label: "SUGGESTED_NEW_HEARING_DATES",
              isMandatory: true,
              placeholder: "DD/MM/YYYY",
              customStyleLabelField: { display: "flex", justifyContent: "space-between" },
              maxSelected: 5,
              isShowHearing: false,
              validation: {
                isRequired: true,
                minDate: new Date().toISOString().split("T")[0],
                errMsg: "CORE_REQUIRED_FIELD_ERROR",
              },
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
      {
        label: "HAVE_ALL_PARTIES_AGREED",
        isMandatory: true,
        key: "isAllPartiesAgreed",
        type: "radio",
        schemaKeyPath: "applicationDetails.isAllPartiesAgreed",
        transformer: "customDropdown",
        populators: {
          name: "isAllPartiesAgreed",
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
        inline: true,
        type: "component",
        component: "SelectCustomTextArea",
        key: "reasonForRequest",
        schemaKeyPath: "applicationDetails.reasonForRequest",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_FOR_REQUEST",
              subHeaderClassName: "dristi-font-big-bold",
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
      {
        type: "component",
        key: "supportingDocuments",
        component: "SelectMultiUpload",
        disable: false,
        isMandatory: false,
        populators: {
          inputs: [
            {
              name: "uploadedDocs",
              isMandatory: false,
              isOptional: true,
              label: "Supporting Documents",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileSize: 10,
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
        },
      },
    ],
  },
];
