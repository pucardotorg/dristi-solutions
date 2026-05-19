import {
  buildOrderRefApplicationIdField,
  buildOrderOriginalHearingDateField,
  buildOrderNewHearingDateField,
  orderRejectApplicationReferenceFields,
  orderRescheduleHearingReferenceFields,
  orderFormCommentsSection,
  orderFormAdditionalCommentsAdmitDismissCaseField,
  orderFormAdditionalCommentsTermsOfBailField,
  orderFormAttachmentTextField,
  orderFormBailSummaryCircumstancesRejectField,
  orderFormBailSummaryCircumstancesRejectSection,
  orderFormBailSummaryCircumstancesTermsField,
  orderFormBailSummaryCircumstancesTermsSection,
  orderFormChargeDaysField,
  orderFormDistrictField,
  orderFormGroundsSection,
  orderFormHearingSummarySection,
  orderFormLawSectionsSection,
  orderFormLongPendingCommentsField,
  orderFormOrderAdditionalNotesSection,
  orderFormOtherDetailsSection,
  orderFormOutOfLongPendingCommentsSection,
  orderFormProclamationTextField,
  orderFormReasonForAdmitDismissCaseField,
  orderFormReasonForLitigantDetailsChangeField,
  orderFormReasonForLitigantDetailsChangeSection,
  orderFormSentenceSection,
  orderFormVillageField,
  orderFormWarrantTextField,
  orderFormWarrantTextSection,
  orderFormDateForHearingDisabledMaxValidation,
  orderFormApplicationStatusField,
  buildOrderFormApplicationStatusField,
  orderFormNatureOfDisposalField,
  orderFormTransferSeekedToField,
  orderFormCaseTransferredToField,
  orderMinTodayDateValidation,
} from "./ordersCreateConfigShared";

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
  },orderFormOrderAdditionalNotesSection,
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
  },orderFormLawSectionsSection,
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
          validation: orderMinTodayDateValidation,
        },
      },
    ],
  },
];

export const configsOrderMandatorySubmissions = [
  {
    body: [
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
          validation: orderMinTodayDateValidation,
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
    ],
  },
];

export const configsOrderSubmissionExtension = [
  {
    body: [
      buildOrderRefApplicationIdField(),
      orderFormApplicationStatusField,
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
          validation: orderMinTodayDateValidation,
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
          validation: orderMinTodayDateValidation,
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
          validation: orderMinTodayDateValidation,
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
];

export const configsScheduleNextHearingDate = [
  {
    body: [
      buildOrderRefApplicationIdField(),
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
          validation: orderMinTodayDateValidation,
        },
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
  orderFormHearingSummarySection,
  orderFormCommentsSection,
];

export const configsRejectRescheduleHeadingDate = [
  {
    body: [...orderRejectApplicationReferenceFields],
  },
  orderFormCommentsSection,
];

export const configsRejectCheckout = [
  {
    body: [...orderRejectApplicationReferenceFields],
  },
  orderFormCommentsSection,
];

export const configsRescheduleHearingDate = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
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
      buildOrderOriginalHearingDateField({ isMandatory: false }),
      buildOrderNewHearingDateField(),
    ],
  },
];

export const configCheckout = [
  {
    body: [...orderRescheduleHearingReferenceFields],
  },
  orderFormCommentsSection,
];

export const configsInitiateRescheduleHearingDate = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
      buildOrderOriginalHearingDateField({ isMandatory: false }),
    ],
  },
];

export const configsAssignDateToRescheduledHearing = [
  {
    body: [
      buildOrderNewHearingDateField({
        schemaKeyPath: "orderDetails.newHearingDate",
      }),
    ],
  },
  orderFormCommentsSection,
];

export const configsAssignNewHearingDate = [
  {
    body: [
      buildOrderNewHearingDateField({
        schemaKeyPath: "orderDetails.newHearingDate",
        disable: true,
      }),
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
    body: [buildOrderRefApplicationIdField()],
  },
];
export const configsVoluntarySubmissionStatus = [
  {
    body: [
      buildOrderRefApplicationIdField(),
    ],
  },
];

export const configsCaseTransfer = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
      orderFormApplicationStatusField,
      orderFormTransferSeekedToField,
    ],
  },
  orderFormGroundsSection,
  {
    body: [
      orderFormCaseTransferredToField,
    ],
  },
  orderFormCommentsSection,
];

export const configsCaseTransferAccept = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
      orderFormApplicationStatusField,
      orderFormTransferSeekedToField,
    ],
  },
  orderFormGroundsSection,
  {
    body: [
      orderFormCaseTransferredToField,
      orderFormNatureOfDisposalField,
    ],
  },
];

export const configsCaseTransferReject = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
      orderFormApplicationStatusField,
      orderFormTransferSeekedToField,
    ],
  },
  orderFormGroundsSection,
  {
    body: [
      orderFormCaseTransferredToField,
    ],
  },
];

export const configsCaseSettlementAccept = [
  {
    body: [
      buildOrderRefApplicationIdField(),
      orderFormApplicationStatusField,
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
      orderFormNatureOfDisposalField,
    ],
  },
];

export const configsCaseSettlementReject = [
  {
    body: [
      buildOrderRefApplicationIdField(),
      orderFormApplicationStatusField,
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
];

export const configsIssueSummons = [
  {
    body: [
      orderFormDateForHearingDisabledMaxValidation,
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
    ],
  },
];

export const configsIssueNotice = [
  {
    body: [
      orderFormDateForHearingDisabledMaxValidation,
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
    ],
  },
];

export const configsIssueOfWarrants = [
  {
    body: [
      buildOrderRefApplicationIdField(),
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
    ],
  },
  orderFormCommentsSection,
];
export const configsCaseWithdrawal = [
  {
    body: [
      buildOrderRefApplicationIdField(),
      buildOrderFormApplicationStatusField({ isMandatory: false }),
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
      buildOrderRefApplicationIdField(),
      buildOrderFormApplicationStatusField({ isMandatory: false }),
      orderFormNatureOfDisposalField,
    ],
  },
];

export const configsCaseWithdrawalReject = [
  {
    body: [
      buildOrderRefApplicationIdField(),
      buildOrderFormApplicationStatusField({ isMandatory: false }),
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
  },orderFormOtherDetailsSection,
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
      buildOrderRefApplicationIdField(),
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
      orderFormApplicationStatusField,
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
      orderFormWarrantTextField,
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
      orderFormNatureOfDisposalField,
    ],
  },orderFormSentenceSection,
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
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
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
    ],
  },
];

export const configsIssueBailReject = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
      orderFormBailSummaryCircumstancesRejectField,
    ],
  },
];

export const configsSetTermBail = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
      {
        key: "partyId",
        type: "component",
        withoutLabel: true,
        component: "SelectEmptyComponent",
        populators: {},
      },
      orderFormBailSummaryCircumstancesTermsField,
      orderFormAdditionalCommentsTermsOfBailField,
    ],
  },
];

export const configsAcceptRejectDelayCondonation = [
  {
    body: [
      buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
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
      },orderFormReasonForAdmitDismissCaseField,orderFormAdditionalCommentsAdmitDismissCaseField,
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
    ],
  },
];

export const configsAdmitCase = [
  {
    body: [],
  },
];

export const configsDismissCase = [
  {
    body: [
      orderFormNatureOfDisposalField,
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
      buildOrderRefApplicationIdField(),
      orderFormReasonForLitigantDetailsChangeField,
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
      },orderFormProclamationTextField,
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
          customStyle: { display: "none" },
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
      },orderFormChargeDaysField,orderFormDistrictField,orderFormVillageField,orderFormAttachmentTextField,
    ],
  },
];

export const configsMoveCaseToLongPendingRegister = [
  {
    body: [orderFormLongPendingCommentsField,
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

export const configsMoveCaseOutOfLongPendingRegister = [orderFormOutOfLongPendingCommentsSection,
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
          validation: orderMinTodayDateValidation,
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
          validation: orderMinTodayDateValidation,
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
      buildOrderRefApplicationIdField({ hideInForm: true }),
      {
        label: "REF_APPLICATION_ID",
        isMandatory: false,
        key: "originalHearingPurpose",
        disable: true,
        type: "text",
        schemaKeyPath: "orderDetails.originalHearingPurpose",
        populators: { name: "originalHearingPurpose", customStyle: { display: "none" } },
      },
      buildOrderOriginalHearingDateField({ isMandatory: true }),
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
        type: "date",
        label: "Date for Hearing",
        key: "dateOfHearing",
        schemaKeyPath: "orderDetails.hearingDate",
        transformer: "date",
        labelChildren: "OutlinedInfoIcon",
        isMandatory: true,
        disable: true,
        populators: {
          name: "dateOfHearing",
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
        label: "SELECT_MISCELLANEOUS_TEMPLATE",
        isMandatory: true,
        key: "processTemplate",
        schemaKeyPath: "orderDetails.processTemplate",
        transformer: "default",
        type: "dropdown",
        populators: {
          styles: { maxWidth: "100%" },
          name: "processTemplate",
          optionsKey: "processTitleLabel",
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
    ],
  },
];
