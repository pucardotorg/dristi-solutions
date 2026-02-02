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
          optionsKey: "code",
          error: "required ",
          styles: { maxWidth: "100%" },
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
        isInfinite: true,
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
        label: "COMPLAINANT",
        isMandatory: true,
        key: "applicationFilledBy",
        schemaKeyPath: "orderDetails.applicationFilledBy",
        transformer: "customDropdown",
        type: "dropdown",
        populators: {
          name: "applicationFilledBy",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [],
        },
      },
      {
        label: "CS_RESPONDENT",
        isMandatory: true,
        key: "detailsSeekedOf",
        schemaKeyPath: "orderDetails.soughtOfDetails",
        transformer: "customDropdown",
        type: "dropdown",
        populators: {
          name: "detailsSeekedOf",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [],
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
        isInfinite: true,
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
            select: "(data) => data['Order'].DocumentType?.sort((a,b)=>a.value.localeCompare(b.value)).map(item => item)",
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
          hideInForm: true,
        },
      },
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
          hideInForm: true,
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
        // schemaKeyPath: "orderDetails.proposedSubmissionDate",
        // transformer: "date",
        populators: {
          name: "proposedSubmissionDate",
          hideInForm: true,
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
          hideInForm: true,
        },
      },
    ],
  },
];

export const configsOrderTranferToADR = [
  {
    body: [
      {
        label: "ADR_MODE",
        isMandatory: true,
        key: "ADRMode",
        schemaKeyPath: "orderDetails.adrMode",
        transformer: "adrDropDown",
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
            select: "(data) => {return data['Order'].ADRMode?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
          },
        },
      },
      {
        label: "DATE_END_ADR",
        isMandatory: true,
        key: "dateOfEndADR",
        schemaKeyPath: "orderDetails.dateOfEndADR",
        transformer: "date",
        type: "date",
        populators: {
          name: "dateOfEndADR",
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
        type: "date",
        label: "DATE_OF_NEXT_HEARING",
        key: "hearingDate",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "DATE_OF_NEXT_HEARING_TOOLTIP",
        isMandatory: true,
        disable: true,
        populators: {
          name: "hearingDate",
          error: "CORE_REQUIRED_FIELD_ERROR",
        },
      },
      {
        label: "MEDIATION_CENTRE",
        isMandatory: true,
        key: "mediationCentre",
        schemaKeyPath: "orderDetails.mediationCentre",
        transformer: "customDropdown",
        type: "dropdown",
        populators: {
          name: "mediationCentre",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          options: [
            {
              code: "KOLLAM_MEDIATION_CENTRE",
              name: "KOLLAM_MEDIATION_CENTRE",
            },
          ],
        },
      },
      {
        type: "component",
        component: "CustomText",
        key: "mediationNote",
        populators: {
          customStyle: { marginBottom: "0px" },
          inputs: [
            {
              textStyles: { color: "#2563EB" },
              infoText: "MEDIATION_REFERRAL_FORM_NOTE",
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
        isMandatory: false,
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
          hideInForm: true,
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
          hideInForm: true,
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
        label: "CS_CASE_ATTENDEES",
        schemaKeyPath: "orderDetails.partyName",
        transformer: "customDropdown",
        key: "attendees",
        type: "dropdown",
        populators: {
          name: "attendees",
          allowMultiSelect: true,
          optionsKey: "label",
          error: "CORE_REQUIRED_FIELD_ERROR",
          selectedText: "party(s)",
          options: [
            {
              code: "PARTY_1",
              name: "PARTY_1",
            },
          ],
        },
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
          hideInForm: true,
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
  // {
  //   body: [
  //     {
  //       type: "component",
  //       component: "SelectCustomTextArea",
  //       key: "lastHearingTranscript",
  //       isMandatory: true,
  //       populators: {
  //         inputs: [
  //           {
  //             name: "text",
  //             textAreaSubHeader: "LAST_HEARING_TRANSCRIPT",
  //             placeholder: "TYPE_HERE_PLACEHOLDER",
  //             type: "TextAreaComponent",
  //           },
  //         ],
  //       },
  //     },
  //   ],
  // },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "hearingSummary",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "HEARING_SUMMARY",
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
        },
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
          hideInForm: true,
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
        // schemaKeyPath: "orderDetails.reasonForReschedule",
        populators: {
          name: "reasonForRescheduling",
          error: "CS_ALPHANUMERIC_ALLOWED",
          validation: {
            customValidationFn: {
              moduleName: "dristiOrders",
              masterName: "alphaNumericInputTextValidation",
            },
          },
          hideInForm: true,
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
          hideInForm: true,
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
          hideInForm: true,
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
        isMandatory: false,
        isInfinite: true,
        populators: {
          hideInForm: true,
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
          hideInForm: true,
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
        isInfinite: true,
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

export const configsCaseTransferAccept = [
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
        isInfinite: true,
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
      {
        label: "NATURE_OF_DISPOSAL",
        isMandatory: true,
        key: "natureOfDisposal",
        schemaKeyPath: "orderDetails.natureOfDisposal",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "natureOfDisposal",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "natureOfDisposal",
            select: "(data) => {return data['Order'].natureOfDisposal?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
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
          hideInForm: true,
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

export const configsCaseTransferReject = [
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
        isInfinite: true,
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
          hideInForm: true,
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

export const configsCaseSettlementAccept = [
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
            select: "(data) => {return data['Order'].SettlementMechanism?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
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
      {
        label: "NATURE_OF_DISPOSAL",
        isMandatory: true,
        key: "natureOfDisposal",
        schemaKeyPath: "orderDetails.natureOfDisposal",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "natureOfDisposal",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "natureOfDisposal",
            select: "(data) => {return data['Order'].natureOfDisposal?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
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
          hideInForm: true,
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

export const configsCaseSettlementReject = [
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
            select: "(data) => {return data['Order'].SettlementMechanism?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
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
          hideInForm: true,
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
        component: "NoticeSummonPartyComponent",
        key: "SummonsOrder",
        schemaKeyPath: "orderDetails.respondentName",
        transformer: "noticeOrderPartyName",
        label: "PARTY_TO_SUMMON",
        populators: {
          inputs: [
            {
              name: "select party",
              type: "dropdown",
              addWitness: true,
              allowMultiSelect: true,
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
          hideInForm: true,
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
            select:
              "(data) => {return data?.['Notice']?.NoticeType?.sort((a,b)=>a.type.localeCompare(b.type)).map((item) => {return {...item, code: item?.type}})}",
          },
        },
      },
      {
        isMandatory: true,
        type: "component",
        component: "NoticeSummonPartyComponent",
        key: "noticeOrder",
        schemaKeyPath: "orderDetails.respondentName",
        transformer: "noticeOrderPartyName",
        label: "PARTY_TO_NOTICE",
        populators: {
          inputs: [
            {
              name: "select party",
              type: "dropdown",
              addWitness: false,
              allowMultiSelect: true,
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
          hideInForm: true,
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

export const configsCaseWithdrawalAccept = [
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
        label: "APPLICATION_ON_BEHALF_OF",
        isMandatory: false,
        key: "applicationOnBehalfOf",
        // schemaKeyPath: "orderDetails.appFilledOnBehalfOf",
        disable: true,
        type: "text",
        populators: { name: "applicationOnBehalfOf", hideInForm: true },
      },
      {
        label: "PARTY_TYPE",
        isMandatory: false,
        key: "partyType",
        // schemaKeyPath: "orderDetails.partyType",
        disable: true,
        type: "text",
        populators: { name: "partyType", hideInForm: true },
      },
      {
        label: "REASON_FOR_WITHDRAWAL",
        isMandatory: false,
        key: "reasonForWithdrawal",
        disable: true,
        type: "text",
        populators: { name: "reasonForWithdrawal", hideInForm: true },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
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
          hideInForm: true,
        },
      },
      {
        label: "NATURE_OF_DISPOSAL",
        isMandatory: true,
        key: "natureOfDisposal",
        schemaKeyPath: "orderDetails.natureOfDisposal",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "natureOfDisposal",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "natureOfDisposal",
            select: "(data) => {return data['Order'].natureOfDisposal?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
          },
        },
      },
    ],
  },
];

export const configsCaseWithdrawalReject = [
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
        label: "APPLICATION_ON_BEHALF_OF",
        isMandatory: false,
        key: "applicationOnBehalfOf",
        // schemaKeyPath: "orderDetails.appFilledOnBehalfOf",
        disable: true,
        type: "text",
        populators: { name: "applicationOnBehalfOf", hideInForm: true },
      },
      {
        label: "PARTY_TYPE",
        isMandatory: false,
        key: "partyType",
        // schemaKeyPath: "orderDetails.partyType",
        disable: true,
        type: "text",
        populators: { name: "partyType", hideInForm: true },
      },
      {
        label: "REASON_FOR_WITHDRAWAL",
        isMandatory: false,
        key: "reasonForWithdrawal",
        disable: true,
        type: "text",
        populators: { name: "reasonForWithdrawal", hideInForm: true },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "comments",
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
          hideInForm: true,
        },
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
        isInfinite: true,
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
            select: "(data) => data['Order'].BailType?.sort((a,b)=>a.type.localeCompare(b.type)).map(item => item)",
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
                  select:
                    "(data) => {return data['Application'].DocumentType?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
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
        type: "component",
        component: "WarrantOrderComponent",
        key: "warrantFor",
        schemaKeyPath: "orderDetails.respondentName",
        transformer: "summonsOrderPartyName",
        label: "WARRANT_FOR_PARTY",
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
            select: "(data) => {return data['Order'].WarrantType?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
          },
        },
      },
      {
        isMandatory: true,
        key: "warrantSubType",
        type: "component",
        component: "SelectCustomGroupedDropdown",
        label: "WARRANT_SUB_TYPE",
        disable: false,
        populators: {
          name: "warrantSubType",
          optionsKey: "subType",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          optionsCustomStyle: {
            height: "30vh",
            marginTop: "42px",
            overflowY: "auto",
          },
          options: [],
          // mdmsConfig: {
          //   moduleName: "Order",
          //   masterName: "warrantSubType",
          //   select: `(data) => {
          //     const list = data?.Order?.warrantSubType || [];
          //     return list.sort((a, b) => {
          //       const getPriority = (val) => {
          //         if (val === "NO") return 0;
          //         if (val === "YES") return 2;
          //         return 1;
          //       };
          //       return getPriority(a.belowOthers) - getPriority(b.belowOthers);
          //     });
          //   }`,
          // },
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "warrantText",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "warrantText",
              textAreaSubHeader: "Warrant Text",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
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
            select: "(data) => {return data['Order'].Findings?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
          },
        },
      },
      {
        label: "NATURE_OF_DISPOSAL",
        isMandatory: true,
        key: "natureOfDisposal",
        schemaKeyPath: "orderDetails.natureOfDisposal",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "natureOfDisposal",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "natureOfDisposal",
            select: "(data) => {return data['Order'].natureOfDisposal?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
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
        isInfinite: true,
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
  // {
  //   body: [
  //     {
  //       type: "component",
  //       component: "SelectTranscriptTextArea",
  //       key: "content",
  //       schemaKeyPath: "caseDetails.content",
  //       isMandatory: true,
  //       populators: {
  //         input: {
  //           name: "text",
  //           textAreaSubHeader: "CONTENT",
  //           placeholder: "TYPE_HERE_PLACEHOLDER",
  //           type: "TranscriptionTextAreaComponent",
  //         },
  //       },
  //     },
  //   ],
  // },
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
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        schemaKeyPath: "orderDetails.refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        isMandatory: true,
        key: "bailParty",
        type: "dropdown",
        label: "BAIL_PARTY",
        disable: false,
        // schemaKeyPath: "orderDetails.bailParty",
        populators: {
          required: true,
          isMandatory: true,
          name: "bailParty",
          optionsKey: "name",
          styles: { maxWidth: "100%" },
          error: "required ",
          options: [],
          hideInForm: true,
        },
      },
      {
        label: "BAIL_TYPE",
        isMandatory: true,
        key: "bailType",
        disable: false,
        schemaKeyPath: "orderDetails.bailType",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "bailType",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          defaultValue: { code: "SURETY", name: "SURETY" },
        },
      },
      {
        type: "amount",
        label: "CS_BAIL_CHEQUE_AMOUNT",
        isMandatory: true,
        schemaKeyPath: "orderDetails.chequeAmount",
        key: "chequeAmount",
        populators: {
          error: "CORE_REQUIRED_FIELD_ERROR",
          componentInFront: "₹",
          name: "chequeAmount",
          prefix: "",
        },
      },
      {
        type: "number",
        label: "NO_OF_SURETIES",
        isMandatory: false,
        key: "noOfSureties",
        schemaKeyPath: "orderDetails.noOfSureties",
        populators: {
          error: "CORE_REQUIRED_FIELD_ERROR",
          name: "noOfSureties",
        },
      },
      {
        type: "radio",
        key: "plea",
        schemaKeyPath: "orderDetails.plea",
        transformer: "mdmsDropdown",
        label: "PLEA",
        isMandatory: false,
        populators: {
          label: "PLEA",
          type: "radioButton",
          name: "plea",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: false,
          hideInForm: true,
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
        type: "component",
        component: "SelectCustomTextArea",
        key: "bailSummary",
        // schemaKeyPath: "orderDetails.bailSummary",
        // transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
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
          hideInForm: true,
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "otherConditions",
        isMandatory: false,
        // schemaKeyPath: "orderDetails.otherConditions",
        // transformer: "customTextArea",
        isInfinite: true,
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
          hideInForm: true,
        },
      },
    ],
  },
];

export const configsIssueBailReject = [
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
        isMandatory: true,
        key: "bailParty",
        type: "dropdown",
        label: "BAIL_PARTY",
        schemaKeyPath: "orderDetails.bailParty",
        disable: true,
        populators: {
          hideInForm: true,
          name: "bailParty",
          styles: { maxWidth: "100%" },
          error: "required ",
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "bailSummaryCircumstancesReject",
        schemaKeyPath: "orderDetails.bailSummaryCircumstancesReject",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
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
        key: "submissionDocuments",
        component: "SelectMultiUpload",
        disable: true,
        isMandatory: true,
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
          hideInForm: true,
        },
      },
    ],
  },
];

export const configsSetTermBail = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        schemaKeyPath: "orderDetails.refApplicationId",
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        key: "partyId",
        type: "component",
        withoutLabel: true,
        component: "SelectEmptyComponent",
        populators: {},
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "bailSummaryCircumstancesTerms",
        isMandatory: true,
        schemaKeyPath: "orderDetails.bailSummaryCircumstancesTerms",
        transformer: "customTextArea",
        isInfinite: true,
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
        key: "additionalCommentsTermsOfBail",
        isMandatory: true,
        schemaKeyPath: "orderDetails.additionalCommentsTermsOfBail",
        transformer: "customTextArea",
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADDITIONAL_DOCUMENTS",
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

export const configsAcceptRejectDelayCondonation = [
  {
    body: [
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        schemaKeyPath: "orderDetails.refApplicationId",
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        label: "IS_DELAY_CONDONATION_ACCEPTED_OR_REJECTED",
        isMandatory: true,
        key: "isDcaAcceptedOrRejected",
        schemaKeyPath: "orderDetails.isDcaAcceptedOrRejected",
        transformer: "customDropdown",
        type: "radio",
        disable: true,
        populators: {
          name: "isDcaAcceptedOrRejected",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "ACCEPTED",
              name: "ACCEPTED",
            },
            {
              code: "REJECTED",
              name: "REJECTED",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "reasonForSeekingDca",
        // schemaKeyPath: "orderDetails.reasonForSeekingDca",
        // transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_FOR_SEEKING_DELAY_CONDONATION",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
          hideInForm: true,
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "reasonForAcceptanceOrRejectionDca",
        // schemaKeyPath: "orderDetails.reasonForAcceptanceOrRejectionDca",
        // transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_FOR_ACCEPTANCE_REJECTION",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
          hideInForm: true,
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalCommentsDca",
        // schemaKeyPath: "orderDetails.additionalCommentsDca",
        // transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "DCA_ADDITIONAL_COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              isOptional: true,
              type: "TextAreaComponent",
            },
          ],
          hideInForm: true,
        },
      },
    ],
  },
];

export const configsAdmitDismissCase = [
  {
    body: [
      {
        label: "IS_CASE_ADMITTED_OR_DISMISSED",
        isMandatory: true,
        key: "isCaseAdmittedOrDismissed",
        schemaKeyPath: "orderDetails.isCaseAdmittedOrDismissed",
        transformer: "customDropdown",
        type: "radio",
        disable: true,
        populators: {
          name: "isDelayConAcceptedOrRejected",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "ADMITTED",
              name: "ADMITTED",
            },
            {
              code: "DISMISSED",
              name: "DISMISSED",
            },
          ],
        },
      },
      {
        label: "WAS_ACCUSED_EXAMINED",
        isMandatory: true,
        key: "wasAccusedExamined",
        schemaKeyPath: "orderDetails.wasAccusedExamined",
        transformer: "customDropdown",
        type: "radio",
        populators: {
          name: "wasAccusedExamined",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
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
        key: "reasonForAdmitDismissCase",
        schemaKeyPath: "orderDetails.reasonForAdmitDismissCase",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_ADMIT_DISMISS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalCommentsAdmitDismissCase",
        schemaKeyPath: "orderDetails.additionalCommentsAdmitDismissCase",
        transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADMIT_DISMISS_ADDITIONAL_COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              isOptional: true,
            },
          ],
        },
      },
    ],
  },
];

export const replaceAdvocateConfig = [
  {
    body: [
      {
        label: "ADVOCATE_REPLACEMENT_GRANTED_OR_REJECTED",
        isMandatory: true,
        key: "replaceAdvocateStatus",
        schemaKeyPath: "orderDetails.replaceAdvocateStatus",
        transformer: "customDropdown",
        type: "radio",
        disable: true,
        populators: {
          name: "replaceAdvocateStatus",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "GRANT",
              name: "GRANT",
            },
            {
              code: "REJECT",
              name: "REJECT",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "reasonForWithdrawal",
        schemaKeyPath: "orderDetails.reasonForWithdrawal",
        transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "BRIEF_SUMMARY_OF_REASONS_FOR_WITHDRAWAL",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
          hideInForm: true,
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalComments",
        // schemaKeyPath: "orderDetails.additionalComments",
        // transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADMIT_DISMISS_ADDITIONAL_COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              isOptional: true,
            },
          ],
          hideInForm: true,
        },
      },
    ],
  },
];

export const configsAdmitCase = [
  {
    body: [
      {
        label: "WAS_ACCUSED_EXAMINED",
        isMandatory: true,
        key: "wasExamined",
        // schemaKeyPath: "orderDetails.wasExamined",
        // transformer: "customDropdown",
        type: "radio",
        populators: {
          name: "wasExamined",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          hideInForm: true,
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
        key: "reasonForAdmitCase",
        // schemaKeyPath: "orderDetails.reasonForAdmitCase",
        // transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_ADMIT_DISMISS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
          hideInForm: true,
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalCommentsAdmitCase",
        // schemaKeyPath: "orderDetails.additionalCommentsAdmitCase",
        // transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADMIT_DISMISS_ADDITIONAL_COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              isOptional: true,
            },
          ],
          hideInForm: true,
        },
      },
    ],
  },
];

export const configsDismissCase = [
  {
    body: [
      {
        label: "WAS_ACCUSED_EXAMINED",
        isMandatory: true,
        key: "wasAccusedExamined",
        // schemaKeyPath: "orderDetails.wasAccusedExamined",
        // transformer: "customDropdown",
        type: "radio",
        populators: {
          name: "wasAccusedExamined",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          hideInForm: true,
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
        key: "reasonForDismissCase",
        // schemaKeyPath: "orderDetails.reasonForDismissCase",
        // transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_ADMIT_DISMISS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
          hideInForm: true,
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalCommentsDismissCase",
        // schemaKeyPath: "orderDetails.additionalCommentsDismissCase",
        // transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "ADMIT_DISMISS_ADDITIONAL_COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              isOptional: true,
            },
          ],
          hideInForm: true,
        },
      },
      {
        label: "NATURE_OF_DISPOSAL",
        isMandatory: true,
        key: "natureOfDisposal",
        schemaKeyPath: "orderDetails.natureOfDisposal",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          name: "natureOfDisposal",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: { maxWidth: "100%" },
          required: true,
          isMandatory: true,
          mdmsConfig: {
            moduleName: "Order",
            masterName: "natureOfDisposal",
            select: "(data) => {return data['Order'].natureOfDisposal?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}",
          },
        },
      },
    ],
  },
];

export const configsApproveRejectLitigantDetailsChange = [
  {
    body: [
      {
        label: "GRANTED_REJECTED",
        isMandatory: true,
        key: "applicationGrantedRejected",
        schemaKeyPath: "orderDetails.applicationGrantedRejected",
        transformer: "customDropdown",
        type: "radio",
        populators: {
          name: "applicationGrantedRejected",
          optionsKey: "name",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "GRANTED",
              name: "GRANTED",
            },
            {
              code: "REJECTED",
              name: "REJECTED",
            },
          ],
        },
      },
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "refApplicationId",
        disable: true,
        type: "text",
        populators: { name: "refApplicationId" },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "reasonForLitigantDetailsChange",
        schemaKeyPath: "orderDetails.reasonForLitigantDetailsChange",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "REASON_FOR_LITIGANT_DETAIL_CHANGE",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "additionalCommentsLitigantsDetailChange",
        // schemaKeyPath: "orderDetails.additionalCommentsLitigantsDetailChange",
        // transformer: "customTextArea",
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "LITIGANT_DETAIL_CHANGE_ADDITIONAL_COMMENTS",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
              isOptional: true,
            },
          ],
          hideInForm: true,
        },
      },
    ],
  },
];

export const configsCreateOrderProclamation = [
  {
    body: [
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
        type: "component",
        component: "WarrantOrderComponent",
        key: "proclamationFor",
        schemaKeyPath: "orderDetails.respondentName",
        transformer: "summonsOrderPartyName",
        label: "PROCLAMATION_FOR_PARTY",
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
        type: "component",
        component: "SelectCustomTextArea",
        key: "proclamationText",
        isInfinite: true,
        // isMandatory: true,
        populators: {
          inputs: [
            {
              name: "proclamationText",
              isOptional: true,
              textAreaSubHeader: "Comments",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsCreateOrderAttachment = [
  {
    defaultValues: {
      orderType: {
        id: 43,
        type: "ATTACHMENT",
        isactive: true,
        code: "ATTACHMENT",
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
        type: "component",
        component: "WarrantOrderComponent",
        key: "attachmentFor",
        schemaKeyPath: "orderDetails.respondentName",
        transformer: "summonsOrderPartyName",
        label: "ATTACHMENT_FOR_PARTY",
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
        type: "component",
        component: "SelectCustomTextArea",
        key: "chargeDays",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "chargeDays",
              textAreaSubHeader: "Number of Days for Answering Charge",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "district",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "district",
              textAreaSubHeader: "Name of Accused District",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "village",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "village",
              textAreaSubHeader: "Name of Accused Village",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "attachmentText",
        // isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "attachmentText",
              isOptional: true,
              textAreaSubHeader: "Comments",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const configsMoveCaseToLongPendingRegister = [
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "longPendingComments",
        schemaKeyPath: "orderDetails.comments",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "Reason for Moving Case to Long Pending Register",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
      {
        type: "component",
        key: "lprDocuments",
        component: "SelectMultiUpload",
        disable: false,
        populators: {
          inputs: [
            {
              name: "documents",
              isMandatory: true,
              documentHeader: "IDENTITY_PROOF",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileSize: 10,
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              isMultipleUpload: true,
              popupModuleMianStyles: { maxHeight: "100%" },
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
];

export const configsMoveCaseOutOfLongPendingRegister = [
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "outOfLongPendingComments",
        schemaKeyPath: "orderDetails.comments",
        transformer: "customTextArea",
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "Reason for Moving Case out of Long Pending Register",
              placeholder: "TYPE_HERE_PLACEHOLDER",
              type: "TextAreaComponent",
            },
          ],
        },
      },
    ],
  },
];

export const attendeesOptions = [
  { code: "COMPLAINANT", name: "Complainant" },
  { code: "COMPLAINANT_ADVOCATE", name: "Complainant's Advocate" },
  { code: "ACCUSED", name: "Accused" },
  { code: "ACCUSED_ADVOCATE", name: "Accused Advocate" },
];

export const purposeOfHearingConfig = {
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
  },
};

export const nextDateOfHearing = {
  type: "component",
  component: "CustomDatePicker",
  key: "nextHearingDate",
  label: "NEXT_DATE_OF_HEARING",
  className: "order-date-picker",
  isMandatory: true,
  placeholder: "DD/MM/YYYY",
  customStyleLabelField: { display: "flex", justifyContent: "space-between" },
  populators: {
    name: "nextHearingDate",
    error: "CORE_REQUIRED_FIELD_ERROR",
  },
};

export const itemTextConfig = {
  key: "itemText",
  populators: {
    inputs: [
      {
        name: "itemText",
        rows: 10,
        isOptional: false,
        style: {
          width: "100%",
          minHeight: "30vh",
          fontSize: "large",
        },
      },
    ],
  },
  disableScrutinyHeader: true,
};

export const configsCost = [
  {
    body: [
      {
        label: "PAYMENT_TO_BE_MADE_BY",
        isMandatory: true,
        key: "paymentToBeMadeBy",
        disable: false,
        schemaKeyPath: "orderDetails.paymentToBeMadeBy",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "paymentToBeMadeBy",
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
        label: "PAYMENT_TO_BE_MADE_TO",
        isMandatory: true,
        key: "paymentToBeMadeTo",
        disable: false,
        schemaKeyPath: "orderDetails.paymentToBeMadeTo",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "paymentToBeMadeTo",
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
        type: "amount",
        label: "CS_COST_ORDER_AMOUNT",
        isMandatory: true,
        schemaKeyPath: "orderDetails.amount",
        key: "amount",
        populators: {
          name: "amount",
          error: "CORE_REQUIRED_FIELD_ERROR",
          componentInFront: "₹",
          prefix: "",
          validation: {
            pattern: "^[0-9]+(\\.[0-9]{0,2})?$",
          },
        },
      },
      {
        label: "CS_COST_ORDER_DEADLINE",
        isMandatory: true,
        key: "deadline",
        schemaKeyPath: "orderDetails.deadline",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "deadline",
          error: "CORE_REQUIRED_FIELD_ERROR",
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
];

export const configsWitnessBatta = [
  {
    body: [
      {
        label: "PAYMENT_TO_BE_MADE_BY",
        isMandatory: true,
        key: "paymentToBeMadeBy",
        disable: false,
        schemaKeyPath: "orderDetails.paymentToBeMadeBy",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "paymentToBeMadeBy",
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
        label: "PAYMENT_TO_BE_MADE_TO",
        isMandatory: true,
        key: "paymentToBeMadeTo",
        disable: false,
        schemaKeyPath: "orderDetails.paymentToBeMadeTo",
        transformer: "mdmsDropdown",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "paymentToBeMadeTo",
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
        type: "amount",
        label: "CS_COST_ORDER_AMOUNT",
        isMandatory: true,
        schemaKeyPath: "orderDetails.amount",
        key: "amount",
        populators: {
          name: "amount",
          error: "CORE_REQUIRED_FIELD_ERROR",
          componentInFront: "₹",
          prefix: "",
        },
      },
      {
        label: "CS_COST_ORDER_DEADLINE",
        isMandatory: true,
        key: "deadline",
        schemaKeyPath: "orderDetails.deadline",
        transformer: "date",
        type: "date",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
        populators: {
          name: "deadline",
          error: "CORE_REQUIRED_FIELD_ERROR",
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
];

export const configsAbateCase = [
  {
    body: [
      {
        label: "WAS_DISPOSAL_CONTESTED_OR_UNCONTESTED",
        isMandatory: true,
        key: "natureOfDisposal",
        schemaKeyPath: "orderDetails.natureOfDisposal",
        transformer: "customDropdown",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "natureOfDisposal",
          optionsKey: "code",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [
            {
              code: "CONTESTED",
              name: "Contested",
            },
            {
              code: "UNCONTESTED",
              name: "Uncontested",
            },
          ],
        },
      },
    ],
  },
];

export const configAcceptReschedulingRequest = [
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
        label: "CURRENT_HEARING_DATE",
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
      {
        label: "PURPOSE_OF_NEXT_HEARING",
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
        },
      },
      {
        key: "newHearingDate",
        type: "component",
        component: "SelectCustomHearingDate",
        schemaKeyPath: "orderDetails.newHearingDate",
        transformer: "date",
        withoutLabel: true,
        isMandatory: true,
        label: "SELECT_FINAL_DATE_HEARING",
        populators: {
          inputs: [
            {
              name: "newHearingDate",
              options: [],
              validation: {
                minDate: "2024-03-17",
              },
            },
          ],
        },
      },
    ],
  },
];

export const configMiscellaneousProcess = [
  {
    body: [
      {
        label: "SELECT_MISCELLANEOUS_TEMPLATE",
        isMandatory: true,
        key: "processTemplate",
        schemaKeyPath: "orderDetails.processTemplate",
        transformer: "default",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "processTemplate",
          optionsKey: "processTitle",
          error: "CORE_REQUIRED_FIELD_ERROR",
          required: true,
          isMandatory: true,
          options: [],
        },
      },
      {
        isMandatory: true,
        type: "component",
        component: "SelectAddreseeCustomComponent",
        key: "selectAddresee",
        schemaKeyPath: "orderDetails.selectAddresee",
        transformer: "default",
        label: "SELECT_ADDRESSEE",
        populators: {
          options: [],
          optionsKey: "name",
          disable: false,
        },
      },
      {
        isMandatory: true,
        type: "component",
        component: "MultiPartyAddressSelector",
        key: "selectedPartiesDetails",
        schemaKeyPath: "orderDetails.selectedPartiesDetails",
        transformer: "default",
        withoutLabel: true,
        populators: {
          options: [],
          partyOptionsKey : "name",
          optionsKey: "formattedAddress",
          addressOptionKey: "partyUniqueId",
          hideInForm: true,
        },
      },
    ],
  },
];
