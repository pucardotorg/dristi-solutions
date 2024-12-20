export const applicationTypeConfig = [
  {
    body: [
      {
        isMandatory: true,
        key: "orderType",
        type: "dropdown",
        label: "ORDER_TYPE",
        schemaKeyPath: "orderType",
        transformer: "mdmsDropdown",
        disable: false,
        populators: {
          name: "orderType",
          optionsKey: "name",
          error: "required ",
          styles: { maxWidth: "100%" },
          mdmsConfig: {
            moduleName: "Order",
            masterName: "OrderType",
            localePrefix: "ORDER_TYPE",
            select:
              "(data) => {return data['Order'].OrderType?.filter((item)=>[`SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}",
          },
        },
      },
    ],
  },
];
export const configs = [
  {
    body: [
      {
        isMandatory: true,
        key: "orderType",
        type: "dropdown",
        label: "ORDER_TYPE",
        disable: false,
        populators: {
          name: "orderType",
          optionsKey: "name",
          error: "required ",
          mdmsConfig: {
            moduleName: "Order",
            masterName: "OrderType",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      {
        isMandatory: true,
        key: "documentType",
        type: "dropdown",
        label: "DOCUMENT_TYPE",
        disable: false,
        populators: {
          name: "DocumentType",
          optionsKey: "name",
          error: "required ",
          mdmsConfig: {
            moduleName: "Order",
            masterName: "DocumentType",
            localePrefix: "",
          },
        },
      },
      {
        isMandatory: true,
        key: "partyToMakeSubmission",
        type: "dropdown",
        label: "PARTIES_TO_MAKE_SUBMISSION",
        disable: false,
        populators: {
          name: "genders",
          optionsKey: "name",
          error: "required ",
          mdmsConfig: {
            moduleName: "Order",
            masterName: "SubmissionName",
            localePrefix: "",
          },
        },
      },
      {
        label: "DEADLINE_FOR_SUBMISSION",
        isMandatory: false,
        key: "deadlineForSubmission",
        type: "date",
        disable: false,
        populators: {
          name: "submissionDeadlineDate",
          error: "Required",
          mdmsConfig: {
            moduleName: "Order",
            masterName: "DeadlineForSubmission",
            localePrefix: "",
          },
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "orderAdditionalNotes",
        populators: {
          inputs: [
            {
              textAreaSubHeader: "CS_ORDER_ADDITIONAL_NOTES",
              type: "TextAreaComponent",
              isOptional: true,
            },
          ],
          mdmsConfig: {
            moduleName: "Order",
            masterName: "", // TO DO: ADD CONFIG IN MDMS
            localePrefix: "",
          },
        },
      },
    ],
  },
  {
    body: [
      {
        type: "radio",
        key: "isResponseRequired",
        label: "IS_RESPONSE_REQUIRED",
        isMandatory: true,
        populators: {
          label: "IS_RESPONSE_REQUIRED",
          type: "radioButton",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: false,
          isMandatory: true,
          // isDependent: true,
          options: [
            {
              code: "YES",
              name: "YES",
              showForm: true,
              isEnabled: true,
            },
            {
              code: "NO",
              name: "NO",
              showForm: false,
              // isVerified: true,
              isEnabled: true,
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        isMandatory: true,
        key: "partiesToRespond",
        type: "dropdown",
        label: "PARTIES_TO_RESPOND",
        disable: false,
        populators: {
          name: "genders",
          optionsKey: "name",
          error: "required ",
          mdmsConfig: {
            moduleName: "Order",
            masterName: "PartyToRespond",
            localePrefix: "",
          },
        },
      },
      {
        label: "DEADLINE_TO_RESPOND",
        isMandatory: false,
        key: "deadlineToRespond",
        type: "date",
        disable: false,
        populators: {
          name: "respondDeadlineDate",
          error: "Required",
          mdmsConfig: {
            moduleName: "Order",
            masterName: "", // TO DO: ADD MDMS CONFIG
            localePrefix: "",
          },
        },
      },
    ],
  },
];

export const configsOrderSection202CRPC = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
      {
        label: "DISTRICT",
        isMandatory: true,
        key: "district",
        type: "text",
        populators: { name: "district", hideInForm: true },
      },
      {
        label: "STATE",
        isMandatory: true,
        key: "state",
        type: "text",
        populators: { name: "state", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        schemaKeyPath: "caseDetails.cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "FILING_YEAR",
        isMandatory: true,
        key: "filingYear",
        type: "text",
        populators: { name: "filingYear", hideInForm: true },
      },
      {
        label: "APPLICATION_FILLED_BY",
        isMandatory: true,
        key: "applicationFilledBy",
        schemaKeyPath: "orderDetails.applicationFilledBy",
        transformer: "customDropdown",
        type: "radio",
        populators: {
          name: "applicationFilledBy",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "COMPLAINANT_1",
              name: "COMPLAINANT_1",
            },
            {
              code: "COMPLAINANT_2",
              name: "COMPLAINANT_2",
            },
            {
              code: "COMPLAINANT_3",
              name: "COMPLAINANT_3",
            },
          ],
        },
      },
      {
        label: "DETAILS_SEEKED_OF",
        isMandatory: true,
        key: "detailsSeekedOf",
        schemaKeyPath: "orderDetails.soughtOfDetails",
        transformer: "customDropdown",
        type: "radio",
        populators: {
          name: "detailsSeekedOf",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "RESPONDANT_1",
              name: "RESPONDANT_1",
            },
            {
              code: "RESPONDANT_2",
              name: "RESPONDANT_2",
            },
            {
              code: "RESPONDANT_3",
              name: "RESPONDANT_3",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "lawSections",
        schemaKeyPath: "orderDetails.sectionOfLaw",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "LAW_SECTIONS",
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
        label: "RESPONSE_REQUIRED_BY",
        isMandatory: true,
        key: "responseRequiredBy",
        schemaKeyPath: "orderDetails.responseRequiredByDate",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "responseRequiredBy",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_PAST_DATES_ARE_ALLOWED",
        populators: {
          name: "dateOfOrder",
          hideInForm: true,
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "maxTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsOrderMandatorySubmissions = [
  {
    body: [
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_PAST_DATES_ARE_ALLOWED",
        populators: {
          name: "dateOfOrder",
          hideInForm: true,
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "maxTodayDateValidation",
            },
          },
        },
      },
      {
        label: "DOCUMENT_TYPE",
        isMandatory: true,
        key: "documentType",
        schemaKeyPath: "orderDetails.documentType",
        type: "dropdown",
        populators: {
          name: "documentType",
          optionsKey: "value",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "DocumentType",
            localePrefix: "",
          },
        },
      },
      {
        label: "DOCUMENT_NAME",
        isMandatory: true,
        key: "documentName",
        schemaKeyPath: "orderDetails.documentName",
        type: "text",
        populators: {
          name: "documentName",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
        },
      },
      {
        label: "SUBMISSION_PARTY",
        isMandatory: true,
        key: "submissionParty",
        schemaKeyPath: "orderDetails.partyDetails.partyToMakeSubmission",
        transformer: "customDropdown",
        type: "dropdown",
        populators: {
          allowMultiSelect: true,
          name: "submissionParty",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          selectedText: "party(s)",
          options: [
            {
              code: "PARTY_1",
              name: "PARTY_1",
            },
            {
              code: "PARTY_2",
              name: "PARTY_2",
            },
            {
              code: "PARTY_3",
              name: "PARTY_3",
            },
          ],
        },
      },
      {
        label: "SUBMISSION_DEADLINE",
        isMandatory: true,
        key: "submissionDeadline",
        schemaKeyPath: "orderDetails.dates.submissionDeadlineDate",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "submissionDeadline",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
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
        type: "component",
        component: "SelectTranscriptTextArea",
        key: "additionalComments",
        populators: {
          input: {
            name: "text",
            textAreaSubHeader: "ADDITIONAL_COMMENTS",
            type: "TranscriptionTextAreaComponent",
            placeholder: "TYPE_HERE_PLACEHOLDER",
            isOptional: true,
          },
        },
      },
    ],
  },
  {
    body: [
      {
        isMandatory: true,
        type: "component",
        component: "SelectUserTypeComponent",
        key: "responseInfo",
        schemaKeyPath: {
          isResponseRequired: { value: "orderDetails.isResponseRequired" },
          respondingParty: { value: "orderDetails.partyDetails.partiesToRespond", transformer: "customDropdown" },
          responseDeadline: { value: "orderDetails.dates.responseDeadlineDate", transformer: "date" },
        },
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "IS_RESPONSE_REQUIRED",
              type: "radioButton",
              name: "isResponseRequired",
              optionsKey: "name",
              error: "CORE_REQUIRED_FIELD_ERROR",
              validation: {},
              styles: {
                marginBottom: 0,
              },
              clearFields: { respondingParty: [], responseDeadline: "" },
              isMandatory: true,
              disableFormValidation: false,
              options: [
                {
                  code: true,
                  name: "ES_COMMON_YES",
                },
                {
                  code: false,
                  name: "ES_COMMON_NO",
                },
              ],
            },
            {
              label: "RESPONDING_PARTY",
              type: "dropdown",
              name: "respondingParty",
              optionsKey: "name",
              error: "CORE_REQUIRED_FIELD_ERROR",
              allowMultiSelect: true,
              required: true,
              isMandatory: true,
              selectedText: "party(s)",
              disableFormValidation: false,
              isDependentOn: "isResponseRequired",
              dependentKey: {
                isResponseRequired: ["code"],
              },
              styles: {
                marginBottom: 0,
              },
              options: [
                {
                  code: "PARTY_1",
                  name: "PARTY_1",
                },
                {
                  code: "PARTY_2",
                  name: "PARTY_2",
                },
                {
                  code: "PARTY_3",
                  name: "PARTY_3",
                },
              ],
            },
            {
              label: "RESPONSE_DEADLINE",
              type: "date",
              name: "responseDeadline",
              labelChildren: "OutlinedInfoIcon",
              tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
              isDependentOn: "isResponseRequired",
              dependentKey: {
                isResponseRequired: ["code"],
              },
              error: "CORE_REQUIRED_FIELD_ERROR",
              textInputStyle: { maxWidth: "100%" },
              validation: {
                min: new Date().toISOString().split("T")[0],
              },
              isMandatory: true,
              disableFormValidation: false,
            },
          ],
        },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
];

export const configsOrderSubmissionExtension = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "APPLICATION_STATUS",
        isMandatory: true,
        key: "applicationStatus",
        schemaKeyPath: "orderDetails.applicationStatus",
        type: "text",
        disable: true,
        populators: { name: "applicationStatus" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "EXTENSION_DOCUMENT_NAME",
        isMandatory: false,
        key: "documentName",
        schemaKeyPath: "orderDetails.documentName",
        disable: true,
        type: "text",
        populators: { name: "documentName" },
      },
      {
        label: "ADVOCATE_NAME",
        isMandatory: true,
        key: "advocateName",
        schemaKeyPath: "orderDetails.advocateName",
        type: "text",
        populators: { name: "advocateName", hideInForm: true },
      },
      {
        label: "APPLICATION_DATE",
        isMandatory: true,
        key: "applicationDate",
        schemaKeyPath: "orderDetails.applicationDate",
        transformer: "date",
        type: "date",
        populators: { name: "applicationDate", hideInForm: true },
      },
      {
        label: "ORIGINAL_SUBMISSION_ORDER_DATE",
        isMandatory: false,
        key: "originalSubmissionOrderDate",
        disable: true,
        type: "date",
        populators: {
          name: "originalSubmissionOrderDate",
        },
      },
      {
        label: "ORIGINAL_DEADLINE",
        isMandatory: false,
        key: "originalDeadline",
        schemaKeyPath: "orderDetails.originalDocSubmissionDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: {
          name: "originalDeadline",
        },
      },
      {
        label: "PROPOSED_SUBMISSION_DATE",
        isMandatory: false,
        key: "proposedSubmissionDate",
        disable: true,
        type: "date",
        schemaKeyPath: "orderDetails.proposedSubmissionDate",
        transformer: "date",
        populators: {
          name: "proposedSubmissionDate",
        },
      },
      {
        label: "NEW_SUBMISSION_DATE",
        isMandatory: true,
        key: "newSubmissionDate",
        type: "date",
        schemaKeyPath: "orderDetails.newSubmissionDate",
        transformer: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "newSubmissionDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsOrderTranferToADR = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "FILING_NUMBER",
        isMandatory: true,
        key: "filingNumber",
        type: "text",
        populators: { name: "filingNumber", hideInForm: true },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "ADR_MODE",
        isMandatory: true,
        key: "ADRMode",
        schemaKeyPath: "orderDetails.adrMode",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "ADRMode",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "ADRMode",
            select: "(data) => {return data['Order'].ADRMode?.map((item) => {return item;});}",
          },
        },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsScheduleHearingDate = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId", hideInForm: true },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "HEARING_PURPOSE",
        isMandatory: true,
        key: "hearingPurpose",
        schemaKeyPath: "orderDetails.purposeOfHearing",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "hearingPurpose",
          optionsKey: "code",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          hideInForm: false,
          mdmsConfig: {
            masterName: "HearingType",
            moduleName: "Hearing",
            localePrefix: "HEARING_PURPOSE",
          },
        },
      },
      {
        label: "HEARING_DATE",
        isMandatory: true,
        key: "hearingDate",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "hearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
      {
        label: "NAMES_OF_PARTIES_REQUIRED",
        isMandatory: true,
        key: "namesOfPartiesRequired",
        schemaKeyPath: "orderDetails.partyName",
        transformer: "customDropdown",
        type: "dropdown",
        populators: {
          name: "namesOfPartiesRequired",
          allowMultiSelect: true,
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          selectedText: "party(s)",
          options: [
            {
              code: "PARTY_1",
              name: "PARTY_1",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomNote",
        key: "unjoinedPartiesNote",
        populators: {
          inputs: [
            {
              infoHeader: "CS_COMMON_NOTE",
              infoText: "FOLLOWING_PARTIES_HAVE_NOT_JOINED",
              infoTooltipMessage: "FOLLOWING_PARTIES_HAVE_NOT_JOINED",
              type: "InfoComponent",
              children: "unjoinedParties",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsScheduleNextHearingDate = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "HEARING_PURPOSE",
        isMandatory: true,
        key: "hearingPurpose",
        schemaKeyPath: "orderDetails.purposeOfHearing",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "hearingPurpose",
          optionsKey: "code",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          hideInForm: false,
          styles: { maxWidth: "100%" },
          mdmsConfig: {
            masterName: "HearingType",
            moduleName: "Hearing",
            localePrefix: "HEARING_PURPOSE",
          },
        },
      },
      {
        label: "HEARING_DATE",
        isMandatory: true,
        key: "hearingDate",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "hearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
      {
        label: "NAMES_OF_PARTIES_REQUIRED",
        isMandatory: true,
        schemaKeyPath: "orderDetails.partyName",
        transformer: "customDropdown",
        key: "namesOfPartiesRequired",
        type: "dropdown",
        populators: {
          name: "namesOfPartiesRequired",
          allowMultiSelect: true,
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          selectedText: "party(s)",
          options: [
            {
              code: "PARTY_1",
              name: "PARTY_1",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomNote",
        key: "unjoinedPartiesNote",
        populators: {
          inputs: [
            {
              infoHeader: "CS_COMMON_NOTE",
              infoText: "FOLLOWING_PARTIES_HAVE_NOT_JOINED",
              infoTooltipMessage: "FOLLOWING_PARTIES_HAVE_NOT_JOINED",
              type: "InfoComponent",
              children: "unjoinedParties",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "lastHearingTranscript",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "LAST_HEARING_TRANSCRIPT",
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
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsRejectRescheduleHeadingDate = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "ORIGINAL_HEARING_DATE",
        isMandatory: true,
        key: "originalHearingDate",
        schemaKeyPath: "orderDetails.originalHearingDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: {
          name: "originalHearingDate",
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsRejectCheckout = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "ORIGINAL_HEARING_DATE",
        isMandatory: true,
        key: "originalHearingDate",
        schemaKeyPath: "orderDetails.originalHearingDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: {
          name: "originalHearingDate",
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsRescheduleHearingDate = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        schemaKeyPath: "orderDetails.refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: {
          name: "dateOfOrder",
          hideInForm: true,
        },
      },
      {
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        label: "RESCHEDULING_REASON",
        isMandatory: true,
        key: "reschedulingReason",
        type: "text",
        populators: { name: "reschedulingReason", hideInForm: true },
      },
      {
        label: "APPLICATION_STATUS",
        isMandatory: true,
        key: "applicationStatus",
        schemaKeyPath: "orderDetails.applicationStatus",
        type: "text",
        disable: true,
        populators: { name: "applicationStatus", hideInForm: true },
      },
      {
        label: "ORIGINAL_HEARING_DATE",
        isMandatory: false,
        key: "originalHearingDate",
        schemaKeyPath: "orderDetails.originalHearingDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: {
          name: "originalHearingDate",
        },
      },
      {
        label: "NEW_HEARING_DATE",
        isMandatory: true,
        key: "newHearingDate",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "newHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configCheckout = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        schemaKeyPath: "orderDetails.refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: {
          name: "dateOfOrder",
          hideInForm: true,
        },
      },
      {
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        label: "RESCHEDULING_REASON",
        isMandatory: true,
        key: "reschedulingReason",
        type: "text",
        populators: { name: "reschedulingReason", hideInForm: true },
      },
      {
        label: "APPLICATION_STATUS",
        isMandatory: true,
        key: "applicationStatus",
        schemaKeyPath: "orderDetails.applicationStatus",
        type: "text",
        disable: true,
        populators: { name: "applicationStatus", hideInForm: true },
      },
      {
        label: "ORIGINAL_HEARING_DATE",
        isMandatory: false,
        key: "originalHearingDate",
        schemaKeyPath: "orderDetails.originalHearingDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: {
          name: "originalHearingDate",
        },
      },
      {
        label: "NEW_HEARING_DATE",
        isMandatory: true,
        key: "newHearingDate",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "newHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsInitiateRescheduleHearingDate = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        schemaKeyPath: "orderDetails.refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: {
          name: "dateOfOrder",
          hideInForm: true,
        },
      },
      {
        label: "RESCHEDULING_REASON",
        isMandatory: true,
        key: "reschedulingReason",
        schemaKeyPath: "orderDetails.rescheduleReason",
        type: "text",
        populators: { name: "reschedulingReason", hideInForm: true },
      },
      {
        label: "ORIGINAL_HEARING_DATE",
        isMandatory: false,
        key: "originalHearingDate",
        schemaKeyPath: "orderDetails.originalHearingDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: {
          name: "originalHearingDate",
        },
      },
      {
        label: "REASON_FOR_RESCHEDULING",
        isMandatory: true,
        key: "reasonForRescheduling",
        type: "text",
        schemaKeyPath: "orderDetails.reasonForReschedule",
        populators: {
          name: "reasonForRescheduling",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "alphaNumericInputTextValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsAssignDateToRescheduledHearing = [
  {
    body: [
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: {
          name: "dateOfOrder",
          hideInForm: true,
        },
      },
      {
        label: "NEW_HEARING_DATE",
        isMandatory: true,
        key: "newHearingDate",
        type: "date",
        schemaKeyPath: "orderDetails.newHearingDate",
        transformer: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "newHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsAssignNewHearingDate = [
  {
    body: [
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: {
          name: "dateOfOrder",
          hideInForm: true,
        },
      },
      {
        label: "NEW_HEARING_DATE",
        isMandatory: true,
        key: "newHearingDate",
        type: "date",
        schemaKeyPath: "orderDetails.newHearingDate",
        transformer: "date",
        disable: true,
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "newHearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "minTodayDateValidation",
            },
          },
        },
      },
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
];

export const configsAcceptSubmission = [
  {
    body: [
      {
        label: "SUBMISSION_ID",
        isMandatory: true,
        key: "submissionId",
        type: "dropdown",
        populators: {
          name: "settlementMechanism",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "0001",
              name: "0001",
            },
            {
              code: "0002",
              name: "0002",
            },
            {
              code: "0003",
              name: "0003",
            },
          ],
        },
      },
    ],
  },
];

export const configRejectSubmission = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        disable: true,
        key: "refApplicationId",
        type: "text",
        populators: { name: "refApplicationId" },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_FOR_REJECTION_SUBMISSION",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];
export const configsVoluntarySubmissionStatus = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "APPLICANT_NAME",
        isMandatory: true,
        key: "applicantName",
        type: "text",
        populators: { name: "applicantName", hideInForm: true },
      },
      {
        label: "SUBMISSION_DATE",
        isMandatory: true,
        key: "submissionDate",
        type: "date",
        populators: { name: "submissionDate", hideInForm: true },
      },
      {
        label: "SUBMISSION_ID",
        isMandatory: true,
        key: "submissionID",
        type: "text",
        populators: { name: "submissionID", hideInForm: true },
      },
      {
        label: "SUBMISSION_TYPE",
        isMandatory: true,
        key: "submissionType",
        type: "date",
        populators: { name: "submissionType", hideInForm: true },
      },
      {
        label: "APPROVAL_STATUS",
        isMandatory: false,
        key: "approvalStatus",
        type: "text",
        disable: true,
        populators: { name: "approvalStatus", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
  {
    body: [
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
];

export const configsCaseTransfer = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        schemaKeyPath: "orderDetails.refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "COMPLAINANT_NAME",
        isMandatory: true,
        key: "complainantName",
        schemaKeyPath: "complainantDetails.name",
        type: "textarea",
        populators: { name: "complainantName", hideInForm: true },
      },
      {
        label: "COMPLAINANT_ADDRESS",
        isMandatory: true,
        key: "complainantAddress",
        type: "text",
        populators: { name: "complainantAddress", hideInForm: true },
      },
      {
        label: "APPLICATION_STATUS",
        isMandatory: true,
        key: "applicationStatus",
        schemaKeyPath: "orderDetails.applicationStatus",
        type: "text",
        disable: true,
        populators: { name: "applicationStatus" },
      },
      {
        label: "TRANSFER_SEEKED_TO",
        isMandatory: true,
        key: "transferSeekedTo",
        type: "text",
        populators: {
          name: "transferSeekedTo",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
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
        component: "SelectCustomTextArea",
        key: "grounds",
        schemaKeyPath: "orderDetails.grounds",
        transformer: "customTextArea",
        isMandatory: true,
        disable: false,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "GROUNDS",
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
        label: "APPROVAL_STATUS",
        isMandatory: false,
        key: "approvalStatus",
        type: "text",
        disable: true,
        populators: { name: "approvalStatus", hideInForm: true },
      },
      {
        label: "CASE_TRANSFERRED_TO",
        isMandatory: true,
        key: "caseTransferredTo",
        disable: false,
        type: "text",
        populators: {
          name: "caseTransferredTo",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
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
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
  {
    body: [
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
];

export const configsCaseSettlement = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_PAST_DATES_ARE_ALLOWED",
        populators: {
          name: "dateOfOrder",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "maxTodayDateValidation",
            },
          },
          hideInForm: true,
        },
      },
      {
        label: "APPLICATION_STATUS",
        isMandatory: true,
        key: "applicationStatus",
        schemaKeyPath: "orderDetails.applicationStatus",
        type: "text",
        disable: true,
        populators: { name: "applicationStatus" },
      },
      {
        label: "SETTLEMENT_AGREEMENT_DATE",
        isMandatory: true,
        key: "settlementAgreementDate",
        schemaKeyPath: "orderDetails.settlementDate",
        transformer: "date",
        type: "date",
        populators: {
          name: "settlementAgreementDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
        },
      },
      {
        label: "SETTLEMENT_MECHANISM",
        isMandatory: true,
        key: "settlementMechanism",
        schemaKeyPath: "orderDetails.settlementMechanism",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "settlementMechanism",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "SettlementMechanism",
            select: "(data) => {return data['Order'].SettlementMechanism?.map((item) => {return item;});}",
          },
        },
      },
      {
        label: "SETTLEMENT_IMPLEMETED",
        isMandatory: true,
        key: "settlementImplemented",
        schemaKeyPath: "orderDetails.isSettlementImplemented",
        transformer: "customDropdown",
        type: "radio",
        populators: {
          name: "settlementImplemented",
          optionsKey: "name",
          title: "",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "Yes",
              name: "ES_COMMON_YES",
            },
            {
              code: "No",
              name: "ES_COMMON_NO",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
  {
    body: [
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
];

export const configsIssueSummons = [
  {
    body: [
      {
        type: "date",
        label: "Date for Hearing",
        key: "dateForHearing",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        labelChildren: "OutlinedInfoIcon",
        isMandatory: true,
        disable: true,
        populators: {
          name: "dateForHearing",
          validation: {
            max: {
              patternType: "date",
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
            },
          },
        },
      },
      {
        isMandatory: true,
        type: "component",
        component: "SummonsOrderComponent",
        key: "SummonsOrder",
        schemaKeyPath: "orderDetails.respondentName",
        transformer: "summonsOrderPartyName",
        label: "PARTY_TO_SUMMON",
        populators: {
          inputs: [
            {
              name: "select party",
              type: "dropdown",
            },
            {
              name: "select deleivery channels",
              type: "checkbox",
            },
          ],
        },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "ISSUE_SUMMONS_TO",
        isMandatory: true,
        key: "issueSummonsTo",
        type: "text",
        populators: { name: "issueSummonsTo", hideInForm: true },
      },
      {
        label: "HEARING_DATE",
        isMandatory: true,
        key: "hearingDate",
        type: "date",
        populators: { name: "hearingDate", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
  {
    body: [
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
];

export const configsIssueNotice = [
  {
    body: [
      {
        type: "date",
        label: "Date for Hearing",
        key: "dateForHearing",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        labelChildren: "OutlinedInfoIcon",
        isMandatory: true,
        disable: true,
        populators: {
          name: "dateForHearing",
          validation: {
            max: {
              patternType: "date",
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
            },
          },
        },
      },
      {
        isMandatory: true,
        type: "dropdown",
        key: "noticeType",
        label: "NOTICE_TYPE",
        schemaKeyPath: "orderDetails.noticeType",
        transformer: "mdmsDropdown",
        populators: {
          name: "noticeType",
          optionsKey: "type",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          styles: { maxWidth: "100%" },
          mdmsConfig: {
            moduleName: "Notice",
            masterName: "NoticeType",
            select: "(data) => {return data?.['Notice']?.NoticeType?.map((item) => {return {...item, code: item?.type}})}",
          },
        },
      },
      {
        isMandatory: true,
        type: "component",
        component: "SummonsOrderComponent",
        key: "noticeOrder",
        schemaKeyPath: "orderDetails.respondentName",
        transformer: "summonsOrderPartyName",
        label: "PARTY_TO_NOTICE",
        populators: {
          inputs: [
            {
              name: "select party",
              type: "dropdown",
            },
            {
              name: "select deleivery channels",
              type: "checkbox",
            },
          ],
        },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "ISSUE_SUMMONS_TO",
        isMandatory: true,
        key: "issueSummonsTo",
        type: "text",
        populators: { name: "issueSummonsTo", hideInForm: true },
      },
      {
        label: "HEARING_DATE",
        isMandatory: true,
        key: "hearingDate",
        type: "date",
        populators: { name: "hearingDate", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
  {
    body: [
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
];

export const configsIssueOfWarrants = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "ISSUE_WARRANTS_FOR",
        isMandatory: true,
        key: "issueWarrantsFor",
        type: "text",
        populators: { name: "issueWarrantsFor", hideInForm: true },
      },
      {
        label: "REASON_FOR_WARRANT",
        isMandatory: true,
        key: "reasonForWarrant",
        type: "text",
        populators: {
          name: "reasonForWarrant",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "alphaNumericInputTextValidation",
            },
          },
        },
      },
      {
        label: "HEARING_DATE",
        isMandatory: true,
        key: "hearingDate",
        type: "date",
        populators: { name: "hearingDate", hideInForm: true },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
        isMandatory: false,
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
    ],
  },
  {
    body: [
      {
        label: "JUDGE_NAME",
        isMandatory: true,
        key: "judgeName",
        type: "text",
        populators: { name: "judgeName", hideInForm: true },
      },
      {
        label: "JUDGE_DESIGNATION",
        isMandatory: true,
        key: "judgeDesignation",
        type: "text",
        populators: { name: "judgeDesignation", hideInForm: true },
      },
    ],
  },
];
export const configsCaseWithdrawal = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "APPLICATION_STATUS",
        isMandatory: false,
        key: "applicationStatus",
        schemaKeyPath: "orderDetails.applicationStatus",
        disable: true,
        type: "text",
        populators: { name: "applicationStatus" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "APPLICATION_ON_BEHALF_OF",
        isMandatory: false,
        key: "applicationOnBehalfOf",
        schemaKeyPath: "orderDetails.appFilledOnBehalfOf",
        disable: true,
        type: "text",
        populators: { name: "applicationOnBehalfOf" },
      },
      {
        label: "PARTY_TYPE",
        isMandatory: false,
        key: "partyType",
        schemaKeyPath: "orderDetails.partyType",
        disable: true,
        type: "text",
        populators: { name: "partyType" },
      },
      {
        label: "REASON_FOR_WITHDRAWAL",
        isMandatory: false,
        key: "reasonForWithdrawal",
        disable: true,
        type: "text",
        populators: { name: "reasonForWithdrawal" },
      },
    ],
  },
];

export const configsOthers = [
  {
    body: [
      {
        label: "ORDER_TITLE",
        isMandatory: true,
        key: "orderTitle",
        type: "text",
        populators: {
          name: "orderTitle",
          error: "MAX_15_WORDS_ARE_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "orderTitleValidation",
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
        component: "SelectCustomTextArea",
        key: "otherDetails",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaHeader: "CS_DETAILS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsBail = [
  {
    defaultValues: {
      orderType: {
        id: 9,
        type: "BAIL",
        isactive: true,
        code: "BAIL",
      },
    },
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "COURT_NAME",
        isMandatory: true,
        key: "courtName",
        type: "text",
        populators: { name: "courtName", hideInForm: true },
      },
      {
        label: "CASE_NAME",
        isMandatory: true,
        key: "caseName",
        type: "text",
        populators: { name: "caseName", hideInForm: true },
      },
      {
        label: "CNR_NUMBER",
        isMandatory: true,
        key: "cnrNumber",
        type: "text",
        populators: { name: "cnrNumber", hideInForm: true },
      },
      {
        label: "DATE_OF_ORDER",
        isMandatory: true,
        key: "dateOfOrder",
        type: "date",
        populators: { name: "dateOfOrder", hideInForm: true },
      },
      {
        label: "BAIL_OF",
        isMandatory: true,
        key: "bailOf",
        disable: true,
        type: "text",
        populators: {
          name: "bailOf",
        },
      },
      {
        label: "SUMMARY",
        isMandatory: true,
        key: "summary",
        type: "textarea",
        populators: { name: "summary", hideInForm: true },
      },
      {
        label: "ATTACHED_DOCUMENTS",
        isMandatory: true,
        key: "attachedDocuments",
        type: "textarea",
        populators: { name: "attachedDocuments", hideInForm: true },
      },
      {
        label: "BAIL_TYPE",
        isMandatory: true,
        key: "bailType",
        disable: true,
        type: "dropdown",
        populators: {
          name: "bailType",
          optionsKey: "type",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          mdmsConfig: {
            masterName: "BailType",
            moduleName: "Order",
            localePrefix: "BAIL_TYPE",
          },
        },
      },
      {
        label: "APPLICATION_STATUS",
        isMandatory: true,
        key: "applicationStatus",
        schemaKeyPath: "orderDetails.applicationStatus",
        type: "text",
        disable: true,
        populators: { name: "applicationStatus" },
      },
      {
        type: "component",
        component: "AddSubmissionDocument",
        key: "submissionDocuments",
        inline: false,
        disable: true,
        populators: {
          inputs: [
            {
              isMandatory: true,
              key: "documentType",
              type: "dropdown",
              label: "Document Type",
              name: "documentType",
              disable: false,
              populators: {
                name: "documentType",
                optionsKey: "name",
                required: true,
                mdmsConfig: {
                  moduleName: "Application",
                  masterName: "DocumentType",
                  select: "(data) => {return data['Application'].DocumentType?.map((item) => {return item;});}",
                },
              },
            },
            {
              label: "Document Title",
              type: "text",
              name: "documentTitle",
              validation: {
                isRequired: true,
                pattern: /^[0-9A-Z/]{0,20}$/,
                errMsg: "",
              },
              isMandatory: true,
            },
            {
              label: "Attachment",
              type: "documentUpload",
              name: "document",
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
        label: "Brief Summary",
        type: "textarea",
        key: "briefSummary",
        isMandatory: true,
        populators: {
          name: "briefSummary",
        },
      },
    ],
  },
];

export const configsCreateOrderSchedule = [
  {
    defaultValues: {
      orderType: {
        id: 8,
        type: "NEXT_HEARING",
        isactive: true,
        code: "NEXT_HEARING",
      },
    },
    body: [
      {
        isMandatory: true,
        key: "Order Type",
        type: "dropdown",
        label: "ORDER_TYPE",
        disable: true,
        populators: {
          name: "orderType",
          optionsKey: "code",
          error: "required ",
          mdmsConfig: {
            masterName: "OrderType",
            moduleName: "Order",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      {
        isMandatory: true,
        key: "Hearing Type",
        type: "dropdown",
        label: "HEARING_TYPE",
        disable: false,
        populators: {
          name: "hearingType",
          optionsKey: "code",
          error: "required ",
          mdmsConfig: {
            masterName: "HearingType",
            moduleName: "Hearing",
            localePrefix: "HEARING_TYPE",
          },
        },
      },
      {
        isMandatory: true,
        key: "Parties to Attend",
        type: "dropdown",
        label: "PARTIES_TO_ATTEND",
        disable: false,
        populators: {
          name: "hearingType",
          optionsKey: "code",
          error: "required ",
          mdmsConfig: {
            masterName: "HearingType",
            moduleName: "Hearing",
            localePrefix: "HEARING_TYPE",
          },
        },
      },
      {
        label: "DATE_OF_HEARING",
        isMandatory: true,
        key: "dateOfHearing",
        type: "date",
        disable: false,
        populators: {
          name: "dateOfHearing",
          error: "Required",
        },
      },
      {
        label: "Purpose of Hearing",
        isMandatory: true,
        description: "",
        type: "textarea",
        disable: false,
        populators: { name: "purpose", error: "Error!" },
      },
      {
        label: "Additional notes (optional)",
        isMandatory: true,
        description: "",
        type: "textarea",
        disable: false,
        populators: { name: "additionalNotes", error: "Error!" },
      },
    ],
  },
];

export const configsCreateOrderWarrant = [
  {
    defaultValues: {
      orderType: {
        id: 5,
        type: "WARRANT",
        isactive: true,
        code: "WARRANT",
      },
    },
    body: [
      {
        isMandatory: true,
        key: "Order Type",
        type: "dropdown",
        label: "ORDER_TYPE",
        disable: true,
        populators: {
          name: "orderType",
          optionsKey: "code",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          mdmsConfig: {
            masterName: "OrderType",
            moduleName: "Order",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      {
        label: "DATE_OF_HEARING",
        isMandatory: true,
        key: "dateOfHearing",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        type: "date",
        disable: true,
        populators: {
          name: "dateOfHearing",
          error: "CORE_REQUIRED_FIELD_ERROR",
        },
      },
      {
        isMandatory: true,
        key: "warrantFor",
        type: "dropdown",
        label: "WARRANT_FOR_PARTY",
        schemaKeyPath: "orderDetails.respondentName",
        disable: true,
        populators: {
          name: "warrantFor",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
        },
      },
      {
        isMandatory: true,
        key: "warrantType",
        type: "dropdown",
        schemaKeyPath: "orderDetails.warrantType",
        transformer: "mdmsDropdown",
        label: "WARRANT_TYPE",
        disable: false,
        populators: {
          name: "warrantType",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          mdmsConfig: {
            moduleName: "Order",
            masterName: "WarrantType",
            select: "(data) => {return data['Order'].WarrantType?.map((item) => {return item;});}",
          },
        },
      },
      {
        isMandatory: true,
        type: "component",
        component: "SelectUserTypeComponent",
        key: "bailInfo",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "IS_WARRANT_BAILABLE",
              type: "radioButton",
              name: "isBailable",
              optionsKey: "name",
              error: "CORE_REQUIRED_FIELD_ERROR",
              validation: {},
              styles: {
                marginBottom: 0,
              },
              clearFields: { noOfSureties: "", bailableAmount: "" },
              isMandatory: true,
              disableFormValidation: false,
              options: [
                {
                  code: true,
                  name: "ES_COMMON_YES",
                },
                {
                  code: false,
                  name: "ES_COMMON_NO",
                },
              ],
            },
            {
              label: "NO_OF_SURETIES",
              type: "radioButton",
              name: "noOfSureties",
              optionsKey: "name",
              error: "CORE_REQUIRED_FIELD_ERROR",
              validation: {},
              isMandatory: true,
              disableFormValidation: false,
              isDependentOn: "isBailable",
              dependentKey: {
                isBailable: ["code"],
              },
              styles: {
                marginBottom: 0,
              },
              options: [
                {
                  code: 1,
                  name: "One",
                },
                {
                  code: 2,
                  name: "Two",
                },
              ],
            },
            {
              label: "BAILABLE_AMOUNT",
              type: "text",
              name: "bailableAmount",
              error: "CORE_REQUIRED_FIELD_ERROR",
              textInputStyle: { maxWidth: "100%" },
              isDependentOn: "isBailable",
              dependentKey: {
                isBailable: ["code"],
              },
              validation: {
                isDecimal: true,
                regex: /^\d+(\.\d{0,2})?$/,
                errMsg: "CS_VALID_AMOUNT_DECIMAL",
              },
              isMandatory: true,
              disableFormValidation: false,
            },
          ],
          validation: {},
        },
      },
      // {
      //   isMandatory: true,
      //   key: "Document Type",
      //   type: "dropdown",
      //   label: "document type",
      //   disable: false,
      //   populators: {
      //     name: "genders",
      //     optionsKey: "name",
      //     error: "required ",
      //     mdmsConfig: {
      //       masterName: "GenderType",
      //       moduleName: "common-masters",
      //       localePrefix: "COMMON_GENDER",
      //     },
      //   },
      // },
      // {
      //   isMandatory: true,
      //   key: "Party / parties to make submission",
      //   type: "dropdown",
      //   label: "Order for document Submission",
      //   disable: false,
      //   populators: {
      //     name: "genders",
      //     optionsKey: "name",
      //     error: "required ",
      //     mdmsConfig: {
      //       masterName: "GenderType",
      //       moduleName: "common-masters",
      //       localePrefix: "COMMON_GENDER",
      //     },
      //   },
      // },
      // {
      //
      //   label: "deadline for submission",
      //   isMandatory: false,
      //   key: "dob",
      //   type: "date",
      //   disable: false,
      //   populators: { name: "dob", error: "Required"},
      // },

      //   {
      //     label: "Additional notes",
      //     isMandatory: true,
      //     key: "phno",
      //     type: "number",
      //     disable: false,
      //     populators: { name: "phno", error: "Required", validation: { min: 0, max: 9999999999 } },
      //   },
    ],
  },
];

export const configsCreateOrderSummon = [
  {
    defaultValues: {
      orderType: {
        id: 4,
        type: "SUMMONS",
        isactive: true,
        code: "SUMMONS",
      },
    },
    body: [
      {
        isMandatory: true,
        key: "Order Type",
        type: "dropdown",
        label: "ORDER_TYPE",
        disable: true,
        populators: {
          name: "orderType",
          optionsKey: "code",
          error: "required ",
          mdmsConfig: {
            masterName: "OrderType",
            moduleName: "Order",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      {
        label: "DATE_OF_HEARING",
        isMandatory: true,
        key: "dateOfHearing",
        type: "date",
        disable: false,
        populators: {
          name: "dateOfHearing",
          error: "Required",
        },
      },
      {
        isMandatory: true,
        key: "Parties to SUMMON",
        type: "dropdown",
        label: "PARTIES_TO_SUMMON",
        disable: false,
        populators: {
          name: "partyToSummon",
          optionsKey: "code",
          error: "required ",
          mdmsConfig: {
            masterName: "HearingType",
            moduleName: "Hearing",
            localePrefix: "HEARING_TYPE",
          },
        },
      },
      {
        isMandatory: false,
        key: "deliveryChannels",
        type: "component", // for custom component
        component: "DeliveryChannels", // name of the component as per component registry
        withoutLabel: true,
        disable: false,
        customProps: {},
        populators: {
          name: "deliveryChannels",
          required: true,
        },
      },
    ],
  },
];

export const configsCreateOrderReIssueSummon = [
  {
    body: [
      {
        isMandatory: true,
        key: "Order Type",
        type: "dropdown",
        label: "order type",
        disable: false,
        populators: {
          name: "genders",
          optionsKey: "name",
          error: "required ",
          mdmsConfig: {
            masterName: "OrderType",
            moduleName: "Order",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      // {
      //   isMandatory: true,
      //   key: "Document Type",
      //   type: "dropdown",
      //   label: "document type",
      //   disable: false,
      //   populators: {
      //     name: "genders",
      //     optionsKey: "name",
      //     error: "required ",
      //     mdmsConfig: {
      //       masterName: "GenderType",
      //       moduleName: "common-masters",
      //       localePrefix: "COMMON_GENDER",
      //     },
      //   },
      // },
      // {
      //   isMandatory: true,
      //   key: "Party / parties to make submission",
      //   type: "dropdown",
      //   label: "Order for document Submission",
      //   disable: false,
      //   populators: {
      //     name: "genders",
      //     optionsKey: "name",
      //     error: "required ",
      //     mdmsConfig: {
      //       masterName: "GenderType",
      //       moduleName: "common-masters",
      //       localePrefix: "COMMON_GENDER",
      //     },
      //   },
      // },
      //   {
      //
      //     label: "deadline for submission",
      //     isMandatory: false,
      //     key: "dob",
      //     type: "date",
      //     disable: false,
      //     populators: { name: "dob", error: "Required"},
      //   },

      //   {
      //     label: "Additional notes",
      //     isMandatory: true,
      //     key: "phno",
      //     type: "number",
      //     disable: false,
      //     populators: { name: "phno", error: "Required", validation: { min: 0, max: 9999999999 } },
      //   },
    ],
  },
];

export const configsJudgement = [
  {
    body: [
      {
        label: "CASE_NUMBER",
        isMandatory: false,
        key: "caseNumber",
        disable: true,
        type: "text",
        populators: { name: "caseNumber" },
      },
      {
        label: "DATE_OF_JUDGEMENT",
        isMandatory: false,
        key: "dateOfJudgement",
        schemaKeyPath: "judgementDetails.issueDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateOfJudgement", hideInForm: true },
      },
      {
        label: "NAME_OF_JUDGE",
        isMandatory: false,
        key: "nameOfJudge",
        schemaKeyPath: "caseDetails.judgeName",
        disable: true,
        type: "text",
        populators: { name: "nameOfJudge" },
      },
      {
        label: "NAME_OF_COURT",
        isMandatory: false,
        key: "nameOfCourt",
        schemaKeyPath: "caseDetails.courtName",
        disable: true,
        type: "text",
        populators: { name: "nameOfCourt" },
      },
      {
        label: "DESCRIPTION_OF_ACCUSED",
        isMandatory: false,
        disable: false,
        key: "nameofRespondent",
        schemaKeyPath: "respondentDetails.name",
        type: "text",
        populators: {
          name: "nameofRespondent",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "alphaNumericInputTextValidation",
            },
          },
        },
      },
      {
        label: "DESCRIPTION_OF_ACCUSED_RESIDENCE",
        isMandatory: false,
        key: "addressRespondant",
        schemaKeyPath: "respondentDetails.address",
        disable: true,
        type: "text",
        populators: { name: "addressRespondant" },
      },
      {
        label: "DATE_OF_OCCURENCE",
        isMandatory: false,
        key: "dateChequeReturnMemo",
        schemaKeyPath: "dates.occurenceDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateChequeReturnMemo" },
      },
      {
        label: "DATE_COMPLAINT",
        isMandatory: false,
        key: "dateFiling",
        schemaKeyPath: "dates.complaintDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateFiling" },
      },
      {
        label: "DATE_OF_APPREHENSION",
        isMandatory: false,
        key: "dateApprehension",
        schemaKeyPath: "dates.apprehensionDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateApprehension" },
      },
      {
        label: "DATE_OF_RELEASE_ON_BAIL",
        isMandatory: false,
        key: "dateofReleaseOnBail",
        schemaKeyPath: "dates.bailDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateofReleaseOnBail" },
      },
      {
        label: "DATE_OF_COMMENCEMENT_TRIAL",
        isMandatory: false,
        key: "dateofCommencementTrial",
        schemaKeyPath: "dates.trailCommencementDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateofCommencementTrial" },
      },
      {
        label: "DATE_OF_CLOSE_TRIAL",
        isMandatory: false,
        key: "dateofCloseTrial",
        schemaKeyPath: "dates.trailClosureDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateofCloseTrial" },
      },
      {
        label: "DATE_OF_SENTENCE",
        isMandatory: false,
        key: "dateofSentence",
        schemaKeyPath: "dates.sentenceDate",
        transformer: "date",
        disable: true,
        type: "date",
        populators: { name: "dateofSentence" },
      },
      {
        label: "NAME_COMPLAINANT",
        isMandatory: false,
        key: "nameofComplainant",
        disable: true,
        type: "text",
        populators: { name: "nameofComplainant" },
      },
      {
        label: "DESCRIPTION_OF_COMPLAINANT",
        isMandatory: false,
        disable: false,
        key: "descriptionOfComplainant",
        type: "text",
        populators: {
          name: "descriptionOfComplainant",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "alphaNumericInputTextValidation",
            },
          },
        },
      },
      {
        label: "NAME_COMPLAINANT_ADVOCATE",
        isMandatory: false,
        key: "nameofComplainantAdvocate",
        schemaKeyPath: "complainantDetails.advocateName",
        disable: true,
        type: "text",
        populators: { name: "nameofComplainantAdvocate" },
      },
      {
        label: "NAME_RESPONDANT_ADVOCATE",
        isMandatory: false,
        key: "nameofRespondentAdvocate",
        schemaKeyPath: "respondentDetails.advocateName",
        disable: true,
        type: "text",
        populators: { name: "nameofRespondentAdvocate" },
      },
      {
        label: "OFFENSE",
        isMandatory: false,
        key: "offense",
        schemaKeyPath: "caseDetails.offence",
        disable: true,
        type: "text",
        populators: { name: "offense" },
      },
      {
        type: "radio",
        key: "plea",
        schemaKeyPath: "judgementDetails.plea",
        label: "PLEA",
        isMandatory: true,
        populators: {
          label: "PLEA",
          type: "radioButton",
          name: "plea",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "GUILTY",
              name: "GUILTY",
              isEnabled: true,
            },
            {
              code: "NOTGUILTY",
              name: "NOTGUILTY",
              isEnabled: true,
            },
          ],
        },
      },
      {
        type: "dropdown",
        key: "findings",
        label: "FINDING",
        isMandatory: true,
        schemaKeyPath: "caseDetails.finding",
        transformer: "mdmsDropdown",
        populators: {
          label: "PLEA",
          type: "radioButton",
          name: "findings",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "Findings",
            select: "(data) => {return data['Order'].Findings?.map((item) => {return item;});}",
          },
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "sentence",
        schemaKeyPath: "caseDetails.sentence",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "SENTENCE",
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
        type: "component",
        component: "SelectTranscriptTextArea",
        key: "content",
        schemaKeyPath: "caseDetails.content",
        isMandatory: true,
        populators: {
          input: {
            name: "text",
            textAreaSubHeader: "CONTENT",
            placeholder: "TYPE_HERE_PLACEHOLDER",
            type: "TranscriptionTextAreaComponent",
          },
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomNote",
        key: "witnessNote",
        populators: {
          inputs: [
            {
              key: "witnessNote",
              infoHeader: "CS_ORDER_WITNESSES",
              infoText: "CS_ORDER_WITNESSES_SUB_TEXT",
              infoTooltipMessage: "TYPE_HERE_PLACEHOLDER",
              linkText: "CLICK_HERE",
              type: "InfoComponent",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomNote",
        key: "evidenceNote",
        populators: {
          inputs: [
            {
              key: "evidenceNote",
              infoHeader: "CS_ORDER_MARKED_EVIDENCE",
              infoText: "CS_ORDER_MARKED_EVIDENCE_SUB_TEXT",
              infoTooltipMessage: "TYPE_HERE_PLACEHOLDER",
              linkText: "CLICK_HERE",
              type: "InfoComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsIssueBailAcceptance = [
  {
    body: [
      {
        isMandatory: true,
        key: "bailParty",
        type: "dropdown",
        label: "BAIL_PARTY",
        disable: false,
        populators: {
          name: "bailParty",
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          error: "required ",
          // need to update with bail parties mdms config
          mdmsConfig: {
            moduleName: "Order",
            masterName: "OrderType",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      {
        isMandatory: true,
        key: "bailType",
        type: "dropdown",
        label: "BAIL_TYPE",
        disable: false,
        populators: {
          name: "BailType",
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          error: "required ",
          // need to update with bail type mdms config
          mdmsConfig: {
            moduleName: "Order",
            masterName: "OrderType",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      {
        type: "amount",
        component: "CustomInput",
        label: "CS_CHEQUE_AMOUNT",
        populators: {
          componentInFront: "₹",
          name: "chequeAmount",
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "bailSummary",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "CS_BAIL_SUMMARY",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: false,
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "otherConditions",
        isMandatory: false,

        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "CS_OTHER_CONDITIONS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        key: "Documents",
        component: "SelectMultiUpload",
        disable: true,
        populators: {
          inputs: [
            {
              name: "uploadedDocs",
              isMandatory: true,
              textAreaHeader: "CS_DOCUMENT_ATTACHED",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              textAreaStyle: {
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
];

export const configsIssueBailReject = [
  {
    body: [
      {
        isMandatory: true,
        key: "bailParty",
        type: "dropdown",
        label: "BAIL_PARTY",
        disable: false,
        populators: {
          name: "bailParty",
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          error: "required ",
          // need to update with bail parties mdms config
          mdmsConfig: {
            moduleName: "Order",
            masterName: "OrderType",
            localePrefix: "ORDER_TYPE",
          },
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "bailSummaryCircumstances",
        isMandatory: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "CS_BAIL_SUMMARY_CIRCUMSTANCES",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: false,
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        key: "Documents",
        component: "SelectMultiUpload",
        disable: false,
        populators: {
          inputs: [
            {
              name: "uploadedDocs",
              isMandatory: true,
              textAreaHeader: "CS_DOCUMENT",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileSize: 50,
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
              textAreaStyle: {
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
];
