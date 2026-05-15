export const admittedCasesDefaultSearchValues = {
  owner: {},
  parties: {},
  hearingType: {},
  orderType: {},
  status: {},
  orderNumber: "",
  applicationType: {},
  applicationCMPNumber: "",
  artifactType: {},
  artifactNumber: "",
};

export const admittedCasesOrderSearchValues = {
  parties: "",
  status: "",
  id: "",
  type: "",
};

export const buildAdmittedCasesSearchSection = (fields, defaultValues) => ({
  uiConfig: {
    formClassName: "custom-both-clear-search",
    primaryLabel: "ES_COMMON_SEARCH",
    secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
    minReqFields: 0,
    defaultValues,
    fields,
  },
  show: true,
});

export const buildAdmittedCasesSearchResult = (columns, resultsJsonPath) => ({
  tenantId: Digit.ULBService.getCurrentTenantId(),
  uiConfig: {
    columns,
    enableColumnSort: true,
    resultsJsonPath,
  },
  show: true,
});

export const buildAdmittedCasesTabShell = (label, displayLabel, sections, extra = {}) => ({
  label,
  displayLabel,
  type: "search",
  ...extra,
  sections,
});

export const admittedCasesHearingsSearchFields = [
  {
    label: "TYPE",
    isMandatory: false,
    key: "hearingType",
    type: "dropdown",
    populators: {
      name: "hearingType",
      optionsKey: "type",
      options: [],
    },
  },
];

export const admittedCasesHearingsResultColumns = [
  {
    label: "HEARING_TYPE",
    jsonPath: "hearingType",
    additionalCustomization: true,
  },
  {
    label: "PARTIES",
    jsonPath: "attendees",
    additionalCustomization: true,
  },
  {
    label: "STATUS",
    jsonPath: "status",
    additionalCustomization: true,
  },
  {
    label: "DATE",
    jsonPath: "startTime",
    additionalCustomization: true,
  },
  {
    label: "CS_ACTIONS",
    additionalCustomization: true,
  },
];

export const admittedCasesOrdersSearchFields = [
  {
    label: "TYPE",
    isMandatory: false,
    key: "type",
    type: "dropdown",
    populators: {
      name: "type",
      optionsKey: "type",
      options: [],
    },
  },
  {
    label: "STATUS",
    isMandatory: false,
    key: "status",
    type: "dropdown",
    populators: {
      name: "status",
      optionsKey: "type",
      mdmsConfig: {
        masterName: "OrderStatus",
        moduleName: "Order",
        select: `(data) => {
                      return data['Order'].OrderStatus
                      ?.filter(item => !['ABATED', 'PENDINGSTAMPING'].includes(item.code))
                        ?.map((item) => {
                          return item;
                        })
                        .sort((a, b) => (a.type || "").localeCompare(b.type || ""));
                    }`,
      },
    },
  },
  {
    label: "PARTIES",
    isMandatory: false,
    key: "parties",
    type: "dropdown",
    populators: {},
  },
  {
    label: "SEARCH_ID",
    isMandatory: false,
    key: "id",
    type: "text",
    populators: {
      name: "id",
    },
  },
];

export const admittedCasesOrdersResultColumns = [
  {
    label: "ORDER_TITLE",
    jsonPath: "businessObject.orderNotification.title",
    additionalCustomization: true,
  },
  {
    label: "NOTIFICATION_ORDER_ID",
    jsonPath: "businessObject.orderNotification.id",
  },
  {
    label: "PARTIES",
    jsonPath: "businessObject.orderNotification.parties",
    additionalCustomization: true,
  },
  {
    label: "STATUS",
    jsonPath: "businessObject.orderNotification.status",
    additionalCustomization: true,
  },
  {
    label: "DATE_ISSUED",
    jsonPath: "businessObject.orderNotification.date",
    additionalCustomization: true,
  },
  {
    label: "CS_ACTIONS",
    jsonPath: "businessObject.orderNotification",
    additionalCustomization: true,
  },
];

export const admittedCasesSubmissionsSearchFields = [
  {
    label: "TYPE",
    isMandatory: false,
    key: "applicationType",
    type: "dropdown",
    populators: {
      name: "applicationType",
      optionsKey: "type",
      options: [],
    },
  },
  {
    label: "STATUS",
    isMandatory: false,
    key: "status",
    type: "dropdown",
    populators: {
      name: "status",
      optionsKey: "type",
      mdmsConfig: {
        masterName: "ApplicationStatus",
        moduleName: "Application",
        select: `(data) => {
                      return data['Application'].ApplicationStatus
                        ?.map((item) => {
                          return item;
                        })
                        .sort((a, b) => (a.type || "").localeCompare(b.type || ""));
                    }`,
      },
    },
  },
  {
    label: "SEARCH_SUBMISSION_ID",
    isMandatory: false,
    key: "applicationCMPNumber",
    type: "text",
    populators: {
      name: "applicationCMPNumber",
    },
  },
];

export const admittedCasesSubmissionsResultColumns = [
  {
    label: "SUBMISSION_TYPE",
    jsonPath: "applicationType",
    additionalCustomization: true,
  },
  {
    label: "SUBMISSION_ID",
    jsonPath: "applicationCMPNumber",
    additionalCustomization: true,
  },
  {
    label: "STATUS",
    jsonPath: "status",
    additionalCustomization: true,
  },
  {
    label: "OWNER",
    jsonPath: "additionalDetails.owner",
    additionalCustomization: true,
  },
  {
    label: "DATE_ADDED",
    jsonPath: "auditDetails.createdTime",
    additionalCustomization: true,
  },
  {
    label: "DOCUMENT_TEXT",
    jsonPath: "documents",
    additionalCustomization: true,
  },
  {
    label: "CS_ACTIONS",
    jsonPath: "applicationDraftDelete",
    additionalCustomization: true,
  },
];

export const admittedCasesDocumentsSearchFields = [
  {
    label: "TYPE",
    isMandatory: false,
    key: "artifactType",
    type: "dropdown",
    populators: {
      name: "artifactType",
      optionsKey: "name",
      mdmsConfig: {
        masterName: "EvidenceType",
        moduleName: "Evidence",
        localePrefix: "EVIDENCE_TYPE",
        select:
          "(data) => {return data['Evidence'].EvidenceType?.map((item) => {return { ...item, name: item.subtype && item.subtype.trim() !== '' ? `${item.type}_${item.subtype}` : item.type };});}",
      },
    },
  },
  {
    label: "SEARCH_ARTIFACT_NUMBER",
    isMandatory: false,
    key: "artifactNumber",
    type: "text",
    populators: {
      name: "artifactNumber",
    },
  },
];

export const admittedCasesDocumentsResultColumns = [
  {
    label: "FILING_NAME",
    jsonPath: "artifactType",
    additionalCustomization: true,
  },
  {
    label: "FILING_ID",
    jsonPath: "artifactNumber",
  },
  {
    label: "EVIDENCE_NUMBER",
    jsonPath: "evidenceNumber",
    additionalCustomization: true,
  },
  {
    label: "TYPE",
    additionalCustomization: true,
  },
  {
    label: "STATUS",
    additionalCustomization: true,
  },
  {
    label: "REPRESENTATIVES",
    jsonPath: "sourceType",
    additionalCustomization: true,
  },
  {
    label: "CS_ACTIONS",
    additionalCustomization: true,
  },
];
