const demandNoticeFormConfig = [
  {
    body: [
      {
        type: "date",
        label: "CS_DATE_OF_DISPATCH_LDN_BRACKETS",
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
              documentHeader: "LEGAL_DEMAND_NOTICE",
              isMultipleUpload: true,
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
              documentHeader: "PROOF_OF_DISPATCH_LDN",
              isMultipleUpload: true,
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
              isOptional: "CS_IS_OPTIONAL",
              documentHeader: "PROOF_LEGAL_DEMAND_NOTICE",
              isMultipleUpload: true,
              documentHeaderStyle: {
                textAlign: "left",
              },
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
              isOptional: "CS_IS_OPTIONAL",
              documentHeader: "CS_PROOF_TO_REPLY_DEMAND_NOTICE",
              isMultipleUpload: true,
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
          validation: {
            max: {
              masterName: "commonUiConfig",
              moduleName: "maxDateValidation",
              patternType: "date",
            },
          },
          customClass: "date-of-accrual",
        },
        isMandatory: true,
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
