/**
 * Repeated order form blocks from ordersCreateConfig.js (PR-B Sonar dedupe).
 */

export const orderMinTodayDateValidation = {
  customValidationFn: {
    moduleName: "dristiOrders",
    masterName: "minTodayDateValidation",
  },
};

export const buildOrderRefApplicationIdField = ({ withSchemaKeyPath = false, hideInForm = false } = {}) => ({
  label: "REF_APPLICATION_ID",
  isMandatory: false,
  key: "refApplicationId",
  ...(withSchemaKeyPath ? { schemaKeyPath: "orderDetails.refApplicationId" } : {}),
  disable: true,
  type: "text",
  populators: {
    name: "refApplicationId",
    ...(hideInForm ? { customStyle: { display: "none" } } : {}),
  },
});

export const buildOrderOriginalHearingDateField = ({ isMandatory = false } = {}) => ({
  label: "ORIGINAL_HEARING_DATE",
  isMandatory,
  key: "originalHearingDate",
  schemaKeyPath: "orderDetails.originalHearingDate",
  transformer: "date",
  disable: true,
  type: "date",
  populators: {
    name: "originalHearingDate",
  },
});

export const buildOrderNewHearingDateField = ({
  key = "newHearingDate",
  label = "NEW_HEARING_DATE",
  isMandatory = true,
  schemaKeyPath = "orderDetails.hearingDate",
  disable,
} = {}) => ({
  label,
  isMandatory,
  key,
  schemaKeyPath,
  transformer: "date",
  type: "date",
  ...(disable !== undefined ? { disable } : {}),
  labelChildren: "OutlinedInfoIcon",
  tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
  populators: {
    name: key,
    error: "CORE_REQUIRED_FIELD_ERROR",
    validation: orderMinTodayDateValidation,
  },
});

export const orderRejectApplicationReferenceFields = [
  buildOrderRefApplicationIdField(),
  buildOrderOriginalHearingDateField({ isMandatory: true }),
];

export const orderRescheduleHearingReferenceFields = [
  buildOrderRefApplicationIdField({ withSchemaKeyPath: true }),
  buildOrderOriginalHearingDateField({ isMandatory: false }),
  buildOrderNewHearingDateField(),
];

/**
 * Repeated SelectCustomTextArea sections from ordersCreateConfig.js (Sonar dedupe).
 */

export const orderFormCommentsTextAreaField = {
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
};

export const orderFormCommentsSection = {
  body: [orderFormCommentsTextAreaField],
};

export const buildOrderFormTextAreaField = ({
  key,
  textAreaSubHeader,
  textAreaHeader,
  inputName,
  schemaKeyPath,
  transformer,
  isMandatory = false,
  isInfinite = true,
  disable,
  withoutLabel,
  inline,
  placeholder = "TYPE_HERE_PLACEHOLDER",
  isOptional,
  inputStyle,
  populatorsValidation,
  populatorsMdmsConfig,
  populatorsCustomStyle,
} = {}) => {
  const input = {
    type: "TextAreaComponent",
    placeholder,
    ...(textAreaSubHeader ? { textAreaSubHeader } : {}),
    ...(textAreaHeader ? { textAreaHeader } : {}),
    ...(inputName ? { name: inputName } : {}),
    ...(isOptional !== undefined ? { isOptional } : {}),
    ...(inputStyle ? { textAreaStyle: inputStyle } : {}),
  };

  return {
    ...(inline ? { inline: true } : {}),
    type: "component",
    component: "SelectCustomTextArea",
    key,
    ...(schemaKeyPath ? { schemaKeyPath } : {}),
    ...(transformer ? { transformer } : {}),
    ...(isMandatory !== undefined ? { isMandatory } : {}),
    ...(isInfinite !== undefined ? { isInfinite } : {}),
    ...(disable !== undefined ? { disable } : {}),
    ...(withoutLabel ? { withoutLabel } : {}),
    populators: {
      inputs: [input],
      ...(populatorsValidation ? { validation: populatorsValidation } : {}),
      ...(populatorsMdmsConfig ? { mdmsConfig: populatorsMdmsConfig } : {}),
      ...(populatorsCustomStyle ? { customStyle: populatorsCustomStyle } : {}),
    },
  };
};

export const buildOrderFormTextAreaSection = (options) => ({
  body: [buildOrderFormTextAreaField(options)],
});

export const orderFormGroundsSection = buildOrderFormTextAreaSection({
  key: "grounds",
  schemaKeyPath: "orderDetails.grounds",
  transformer: "customTextArea",
  isMandatory: true,
  disable: false,
  textAreaSubHeader: "GROUNDS",
});

export const orderFormOrderAdditionalNotesSection = buildOrderFormTextAreaSection({
  key: "orderAdditionalNotes",
  textAreaSubHeader: "CS_ORDER_ADDITIONAL_NOTES",
  isOptional: true,
  inputName: undefined,
  populatorsMdmsConfig: {
    moduleName: "Order",
    masterName: "",
    localePrefix: "",
  },
});

export const orderFormLawSectionsSection = buildOrderFormTextAreaSection({
  key: "lawSections",
  schemaKeyPath: "orderDetails.sectionOfLaw",
  isMandatory: true,
  textAreaSubHeader: "LAW_SECTIONS",
});

export const orderFormLastHearingTranscriptSection = buildOrderFormTextAreaSection({
  key: "lastHearingTranscript",
  isMandatory: true,
  textAreaSubHeader: "LAST_HEARING_TRANSCRIPT",
});

export const orderFormHearingSummarySection = buildOrderFormTextAreaSection({
  key: "hearingSummary",
  isMandatory: true,
  textAreaSubHeader: "HEARING_SUMMARY",
});

export const orderFormOtherDetailsSection = buildOrderFormTextAreaSection({
  key: "otherDetails",
  isMandatory: true,
  textAreaHeader: "CS_DETAILS",
});

export const orderFormWarrantTextField = buildOrderFormTextAreaField({
  key: "warrantText",
  isMandatory: true,
  textAreaSubHeader: "Warrant Text",
  inputName: "warrantText",
});

export const orderFormWarrantTextSection = buildOrderFormTextAreaSection({
  key: "warrantText",
  isMandatory: true,
  textAreaSubHeader: "Warrant Text",
  inputName: "warrantText",
});

export const orderFormSentenceSection = buildOrderFormTextAreaSection({
  key: "sentence",
  schemaKeyPath: "orderDetails.sentence",
  isMandatory: true,
  textAreaSubHeader: "SENTENCE",
});

export const orderFormBailSummaryCircumstancesRejectField = buildOrderFormTextAreaField({
  key: "bailSummaryCircumstancesReject",
  schemaKeyPath: "orderDetails.bailSummaryCircumstancesReject",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "CS_BAIL_SUMMARY_CIRCUMSTANCES",
  isOptional: false,
});

export const orderFormBailSummaryCircumstancesRejectSection = buildOrderFormTextAreaSection({
  key: "bailSummaryCircumstancesReject",
  schemaKeyPath: "orderDetails.bailSummaryCircumstancesReject",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "CS_BAIL_SUMMARY_CIRCUMSTANCES",
  isOptional: false,
});

export const orderFormBailSummaryCircumstancesTermsField = buildOrderFormTextAreaField({
  key: "bailSummaryCircumstancesTerms",
  schemaKeyPath: "orderDetails.bailSummaryCircumstancesTerms",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "CS_BAIL_SUMMARY",
  isOptional: false,
});

export const orderFormBailSummaryCircumstancesTermsSection = buildOrderFormTextAreaSection({
  key: "bailSummaryCircumstancesTerms",
  schemaKeyPath: "orderDetails.bailSummaryCircumstancesTerms",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "CS_BAIL_SUMMARY",
  isOptional: false,
});

export const orderFormAdditionalCommentsTermsOfBailField = buildOrderFormTextAreaField({
  key: "additionalCommentsTermsOfBail",
  schemaKeyPath: "orderDetails.additionalCommentsTermsOfBail",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "ADDITIONAL_DOCUMENTS",
  isOptional: false,
});

export const orderFormReasonForAdmitDismissCaseField = buildOrderFormTextAreaField({
  key: "reasonForAdmitDismissCase",
  schemaKeyPath: "orderDetails.reasonForAdmitDismissCase",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "REASON_ADMIT_DISMISS",
});

export const orderFormAdditionalCommentsAdmitDismissCaseField = buildOrderFormTextAreaField({
  key: "additionalCommentsAdmitDismissCase",
  schemaKeyPath: "orderDetails.additionalCommentsAdmitDismissCase",
  transformer: "customTextArea",
  isMandatory: false,
  textAreaSubHeader: "ADMIT_DISMISS_ADDITIONAL_COMMENTS",
});

export const orderFormReasonForLitigantDetailsChangeField = buildOrderFormTextAreaField({
  key: "reasonForLitigantDetailsChange",
  schemaKeyPath: "orderDetails.reasonForLitigantDetailsChange",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "REASON_FOR_LITIGANT_DETAIL_CHANGE",
});

export const orderFormReasonForLitigantDetailsChangeSection = buildOrderFormTextAreaSection({
  key: "reasonForLitigantDetailsChange",
  schemaKeyPath: "orderDetails.reasonForLitigantDetailsChange",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "REASON_FOR_LITIGANT_DETAIL_CHANGE",
});

export const orderFormProclamationTextField = buildOrderFormTextAreaField({
  key: "proclamationText",
  isMandatory: true,
  textAreaSubHeader: "Comments",
  inputName: "proclamationText",
  isOptional: true,
});

export const orderFormChargeDaysField = buildOrderFormTextAreaField({
  key: "chargeDays",
  isMandatory: true,
  textAreaSubHeader: "Number of Days for Answering Charge",
  inputName: "chargeDays",
});

export const orderFormDistrictField = buildOrderFormTextAreaField({
  key: "district",
  isMandatory: true,
  textAreaSubHeader: "Name of Accused District",
  inputName: "district",
});

export const orderFormVillageField = buildOrderFormTextAreaField({
  key: "village",
  isMandatory: true,
  textAreaSubHeader: "Name of Accused Village",
  inputName: "village",
});

export const orderFormAttachmentTextField = buildOrderFormTextAreaField({
  key: "attachmentText",
  textAreaSubHeader: "Comments",
  inputName: "attachmentText",
  isOptional: true,
});

export const orderFormLongPendingCommentsField = buildOrderFormTextAreaField({
  key: "longPendingComments",
  schemaKeyPath: "orderDetails.comments",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "Reason for Moving Case to Long Pending Register",
});

export const orderFormOutOfLongPendingCommentsSection = buildOrderFormTextAreaSection({
  key: "outOfLongPendingComments",
  schemaKeyPath: "orderDetails.comments",
  transformer: "customTextArea",
  isMandatory: true,
  textAreaSubHeader: "Reason for Moving Case out of Long Pending Register",
});
