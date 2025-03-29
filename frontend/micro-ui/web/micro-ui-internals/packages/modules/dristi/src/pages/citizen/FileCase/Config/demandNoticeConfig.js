const demandNoticeFormConfig = [
  {
    body: [
      {
        type: "date",
        label: "CS_DATE_OF_DISPATCH_LDN",
        populators: {
          name: "dateOfDispatch",
          validation: {
            max: {
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
              patternType: "date",
            },
          },
        },
        isMandatory: true,
        labelChildren: "OutlinedInfoIcon",
      },
    ],
  },
  {
    body: [
      {
        key: "legalDemandNoticeFileUpload",
        type: "component",
        label: "LEGAL_DEMAND_NOTICE",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              maxFileSize: 50,
              documentHeader: "LEGAL_DEMAND_NOTICE",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
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
        key: "proofOfDispatchFileUpload",
        type: "component",
        label: "PROOF_OF_DISPATCH_LDN",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              maxFileSize: 50,
              documentHeader: "PROOF_OF_DISPATCH_LDN",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
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
        key: "proofOfService",
        type: "radio",
        label: "CS_DELAY_APPLICATION_TYPE",
        populators: {
          name: "proofOfService",
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "CS_DELAY_APPLICATION_TYPE",
          options: [
            {
              code: "YES",
              name: "YES",
              isEnabled: true,
              showProofOfAcknowledgment: true,
            },
            {
              code: "NO",
              name: "NO",
              isEnabled: true,
              isVerified: true,
              hasBarRegistrationNo: true,
              showProofOfAcknowledgment: false,
            },
          ],
          required: false,
          optionsKey: "name",
          isDependent: true,
          isMandatory: true,
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "date",
        label: "CS_DATE_OF_SERVICE_LDN",
        populators: {
          name: "dateOfService",
          validation: {
            max: {
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
              patternType: "date",
            },
          },
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        key: "proofOfAcknowledgmentFileUpload",
        type: "component",
        label: "PROOF_LEGAL_DEMAND_NOTICE",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              maxFileSize: 50,
              documentHeader: "PROOF_LEGAL_DEMAND_NOTICE",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_50",
              documentHeaderStyle: {
                textAlign: "left",
              },
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
            },
          ],
        },
        isMandatory: true,
        withoutLabel: true,
        isDocDependentOn: "proofOfService",
        isDocDependentKey: "showProofOfAcknowledgment",
      },
    ],
  },
  {
    body: [
      {
        key: "proofOfReply",
        type: "radio",
        label: "CS_REPLY_NOTICE",
        populators: {
          name: "proofOfReply",
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "CS_REPLY_NOTICE",
          options: [
            {
              code: "YES",
              name: "YES",
              isEnabled: true,
              showProofOfReply: true,
            },
            {
              code: "NO",
              name: "NO",
              isEnabled: true,
              isVerified: true,
              showProofOfReply: false,
              hasBarRegistrationNo: true,
            },
          ],
          required: false,
          optionsKey: "name",
          isDependent: true,
          isMandatory: true,
        },
        isMandatory: true,
      },
    ],
  },
  {
    body: [
      {
        type: "date",
        label: "CS_DATE_OF_REPLY_LDN",
        populators: {
          name: "dateOfReply",
          validation: {
            max: {
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
              patternType: "date",
            },
          },
        },
        isMandatory: true,
      },
    ],
    dependentKey: {
      proofOfReply: ["showProofOfReply"],
    },
  },
  {
    body: [
      {
        key: "proofOfReplyFileUpload",
        type: "component",
        label: "CS_PROOF_TO_REPLY_DEMAND_NOTICE",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
              isOptional: "CS_IS_OPTIONAL",
              maxFileSize: 50,
              documentHeader: "CS_PROOF_TO_REPLY_DEMAND_NOTICE",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_50",
              maxFileErrorMessage: "CS_FILE_LIMIT_50_MB",
            },
          ],
        },
        isMandatory: false,
        withoutLabel: true,
        isDocDependentOn: "proofOfReply",
        isDocDependentKey: "showProofOfReply",
      },
    ],
  },
  {
    body: [
      {
        key: "causeOfActionNote",
        type: "component",
        component: "SelectCustomNote",
        populators: {
          inputs: [
            {
              type: "InfoComponent",
              infoText: "CAUSE_OF_ACTION_FROM_DELIVERY",
              infoHeader: "CS_COMMON_NOTE",
              infoTooltipMessage: "CAUSE_OF_ACTION_FROM_DELIVERY",
            },
          ],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "date",
        label: "CS_DATE_OF_ACCRUAL_LDN",
        populators: {
          name: "dateOfAccrual",
          customClass: "date-of-accrual",
          validation: {
            max: {
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
              patternType: "date",
            },
          },
        },
        isMandatory: true,
        labelChildren: "OutlinedInfoIcon",
      },
    ],
  },
];

export const demandNoticeConfig = {
  formconfig: demandNoticeFormConfig,
  header: "CS_DEMAND_NOTICE_HEADING",
  subtext: "CS_COMPLAINT_DATA_ENTRY_INFO",
  isOptional: false,
  addFormText: "ADD_DEMAND_NOTICE",
  formItemName: "CS_DEMAND_NOTICE",
  className: "demand-notice",
  selectDocumentName: {
    proofOfReplyFileUpload: "CS_PROOF_TO_REPLY_DEMAND_NOTICE_FILE_NAME",
    proofOfDispatchFileUpload: "PROOF_OF_DISPATCH_FILE_NAME",
    legalDemandNoticeFileUpload: "LEGAL_DEMAND_NOTICE",
    proofOfAcknowledgmentFileUpload: "PROOF_LEGAL_DEMAND_NOTICE_FILE_NAME",
  },
};
