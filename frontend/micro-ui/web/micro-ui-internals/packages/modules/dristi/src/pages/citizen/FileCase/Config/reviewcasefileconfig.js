export const reviewCaseFileFormConfig = [
  {
    body: [
      {
        type: "component",
        component: "SelectReviewAccordion",
        key: "litigentDetails",
        label: "CS_LITIGENT_DETAILS",
        number: 1,
        withoutLabel: true,
        textAreaMaxLength: "255",
        populators: {
          inputs: [
            {
              key: "complainantDetails",
              name: "complainantDetails",
              label: "CS_COMPLAINT_DETAILS",
              icon: "ComplainantDetailsIcon",
              disableScrutiny: true,
              config: [
                {
                  type: "title",
                  value: ["firstName", "lastName"],
                  badgeType: "complainantType.name",
                },
                {
                  type: "phonenumber",
                  label: "PHONE_NUMBER",
                  value: "complainantVerification.mobileNumber",
                },
                {
                  type: "text",
                  label: "AGE",
                  value: "complainantAge",
                },
                {
                  type: "text",
                  label: "DESIGNATION",
                  dependentOn: "complainantType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "complainantVerification.complainantDesignation",
                },
                {
                  type: "image",
                  label: "CS_ID_PROOF",
                  value: ["complainantVerification.individualDetails.document", "companyDetailsUpload.document"],
                  enableScrutinyField: true,
                },
                {
                  type: "address",
                  label: "ADDRESS",
                  dependentOn: "complainantType.code",
                  dependentValue: "INDIVIDUAL",
                  value: "addressDetails",
                },
                {
                  type: "text",
                  label: "TYPE_OF_ENTITY",
                  dependentOn: "complainantType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "complainantTypeOfEntity.name",
                },
                {
                  type: "text",
                  label: "company_Name",
                  dependentOn: "complainantType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "complainantCompanyName",
                },
                {
                  type: "address",
                  label: "COMPANY_ADDRESS",
                  dependentOn: "complainantType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "addressCompanyDetails",
                },
              ],
              data: {},
            },
            {
              key: "respondentDetails",
              name: "respondentDetails",
              label: "CS_RESPONDENT_DETAILS",
              icon: "RespondentDetailsIcon",
              config: [
                {
                  type: "title",
                  value: ["respondentFirstName", "respondentLastName"],
                  badgeType: "respondentType.name",
                },
                {
                  type: "phonenumber",
                  label: "PHONE_NUMBER",
                  value: "phonenumbers.mobileNumber",
                },
                {
                  type: "text",
                  label: "AGE",
                  value: "respondentAge",
                },
                {
                  type: "text",
                  label: "DESIGNATION",
                  dependentOn: "respondentType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "respondentDesignation",
                },
                {
                  type: "text",
                  label: "CS_EMAIL_ID",
                  value: "emails.emailId",
                },
                {
                  type: "address",
                  label: "ADDRESS",
                  dependentOn: "respondentType.code",
                  dependentValue: "INDIVIDUAL",
                  value: "addressDetails",
                },
                {
                  type: "text",
                  label: "TYPE_OF_ENTITY",
                  dependentOn: "respondentType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "respondentTypeOfEntity.name",
                },
                {
                  type: "text",
                  label: "company_Name",
                  dependentOn: "respondentType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "respondentCompanyName",
                },
                {
                  type: "address",
                  label: "COMPANY_ADDRESS",
                  dependentOn: "respondentType.code",
                  dependentValue: "REPRESENTATIVE",
                  value: "addressDetails",
                },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: ["companyDetailsUpload.document", "inquiryAffidavitFileUpload.document"],
                },
              ],
              data: {},
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectReviewAccordion",
        key: "caseSpecificDetails",
        label: "CS_CASE_SPECIFIC_DETAILS",
        number: 2,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              key: "chequeDetails",
              name: "chequeDetails",
              label: "CS_CHECKQUE_DETAILS",
              icon: "ChequeDetailsIcon",
              config: [
                {
                  type: "title",
                  label: "CS_CHEQUE_NO",
                  value: ["chequeNumber"],
                },
                {
                  type: "text",
                  label: "CS_DISHONOURED_CHEQUE_SIGNATORY_NAME",
                  value: "chequeSignatoryName",
                },
                {
                  type: "text",
                  label: "CS_NAME_ON_CHEQUE",
                  value: "name",
                },
                {
                  type: "text",
                  label: "CS_PAYEE_BANK_NAME",
                  value: "payeeBankName",
                },
                {
                  type: "text",
                  label: "CS_PAYEE_BRANCH_NAME",
                  value: "payeeBranchName",
                },
                {
                  type: "date",
                  label: "CS_DATE_OF_ISSUANCE",
                  value: "issuanceDate",
                  dependentFields: [
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "depositDate" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfDispatch" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfService" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfReply" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfAccrual" },
                  ],
                },
                {
                  type: "text",
                  label: "CS_PAYER_BANK_NAME",
                  value: "payerBankName",
                },
                {
                  type: "text",
                  label: "CS_PAYER_BRANCH_NAME",
                  value: "payerBranchName",
                },
                {
                  type: "text",
                  label: "CS_IFSC_CODE",
                  value: "ifsc",
                },
                {
                  type: "amount",
                  label: "CS_CHEQUE_AMOUNT",
                  value: "chequeAmount",
                },
                {
                  type: "text",
                  label: "POLICE_STATION",
                  value: "policeStation.code",
                },
                {
                  type: "date",
                  label: "CS_DATE_OF_CHEQUE_DEPOSIT",
                  value: "depositDate",
                  dependentFields: [
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "issuanceDate" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfDispatch" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfService" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfReply" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfAccrual" },
                  ],
                },
                {
                  type: "text",
                  label: "REASON_FOR_RETURN_CHEQUE",
                  value: "delayReason.reasonForReturnCheque",
                },
                {
                  type: "text",
                  label: "CS_CHEQUE_ADDITIONAL_DETAILS",
                  value: "chequeAdditionalDetails.text",
                },
                {
                  type: "infoBox",
                  value: "infoBoxData",
                },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: ["bouncedChequeFileUpload.document", "depositChequeFileUpload.document", "returnMemoFileUpload.document"],
                },
              ],
              data: {},
            },
            {
              key: "debtLiabilityDetails",
              name: "debtLiabilityDetails",
              label: "CS_DEBT_LIABILITY_DETAILS",
              icon: "DebtLiabilityIcon",
              config: [
                {
                  type: "text",
                  label: "CS_NATURE_DEBT_LIABILITY",
                  value: "liabilityNature",
                },
                {
                  type: "text",
                  label: "CHEQUE_FOR_FULL_OR_PARTIAL_LIABILITY",
                  value: "liabilityType.name",
                },
                {
                  type: "amount",
                  label: "CS_PARIAL_AMOUNT",
                  value: "totalAmount",
                },
                {
                  type: "text",
                  label: "CS_DEBT_ADDITIONAL_DETAILS",
                  value: "additionalDebtLiabilityDetails.text",
                },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: ["debtLiabilityFileUpload.document"],
                },
              ],
              data: {},
            },
            {
              key: "demandNoticeDetails",
              name: "demandNoticeDetails",
              label: "CS_DEMAND_NOTICE_DETAILS",
              icon: "DemandDetailsNoticeIcon",
              config: [
                // {
                //   type: "text",
                //   label: "CS_MODE_OF_DISPATCH",
                //   value: "modeOfDispatchType.modeOfDispatchType.name",
                // },
                {
                  type: "date",
                  label: "CS_DATE_OF_DISPATCH_LDN",
                  value: "dateOfDispatch",
                  dependentFields: [
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "depositDate" },
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "issuanceDate" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfService" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfReply" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfAccrual" },
                  ],
                },
                {
                  type: "date",
                  label: "CS_DATE_OF_SERVICE_LDN",
                  value: "dateOfService",
                  dependentFields: [
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "depositDate" },
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "issuanceDate" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfDispatch" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfReply" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfAccrual" },
                  ],
                },
                {
                  type: "date",
                  label: "CS_DATE_OF_REPLY_LDN",
                  value: "dateOfReply",
                  notAvailable: "NO_REPLY_RECIEVED",
                  dependentFields: [
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "depositDate" },
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "issuanceDate" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfDispatch" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfService" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfAccrual" },
                  ],
                },
                {
                  type: "date",
                  label: "CS_DATE_OF_ACCRUAL_LDN",
                  value: "dateOfAccrual",
                  dependentFields: [
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "depositDate" },
                    { configKey: "caseSpecificDetails", page: "chequeDetails", field: "issuanceDate" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfDispatch" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfService" },
                    { configKey: "caseSpecificDetails", page: "demandNoticeDetails", field: "dateOfReply" },
                  ],
                },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: [
                    "legalDemandNoticeFileUpload.document",
                    "proofOfDispatchFileUpload.document",
                    "proofOfAcknowledgmentFileUpload.document",
                    "proofOfReplyFileUpload.document",
                  ],
                },
              ],
              data: {},
            },
            {
              key: "delayApplications",
              name: "delayApplications",
              label: "CS_DELAY_CONDONATION_APPLICATION",
              icon: "DemandDetailsNoticeIcon",
              config: [
                {
                  type: "text",
                  label: "CS_QUESTION_DELAY_APPLICATION",
                  value: "delayCondonationType.name",
                },
                // {
                //   type: "text",
                //   label: "CS_TEXTAREA_HEADER_DELAY_REASON",
                //   value: "delayApplicationReason.reasonForDelay",
                // },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: ["condonationFileUpload.document"],
                },
              ],
              data: {},
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectReviewAccordion",
        key: "additionalDetails",
        label: "CS_ADDITIONAL_DETAILS",
        number: 3,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              key: "witnessDetails",
              name: "witnessDetails",
              label: "CS_WITNESS_DETAIL_HEADING",
              icon: "WitnessDetailsIcon",
              noDataText: "NO_WITNESSES_ADDED",
              config: [
                {
                  type: "title",
                  value: ["firstName", "lastName"],
                },
                {
                  type: "phonenumber",
                  label: "PHONE_NUMBER",
                  value: "phonenumbers.mobileNumber",
                },
                {
                  type: "text",
                  label: "CS_EMAIL_ID",
                  value: "emails.emailId",
                },
                {
                  type: "text",
                  label: "AGE",
                  value: "witnessAge",
                },
                {
                  type: "address",
                  label: "ADDRESS",
                  value: "addressDetails",
                },
                {
                  type: "text",
                  label: "CS_TEXTAREA_WITNESS_ADDITIONAL_DETAIL",
                  value: "witnessAdditionalDetails.text",
                },
              ],
              data: {},
            },
            {
              key: "prayerSwornStatement",
              name: "prayerSwornStatement",
              label: "CS_PRAYER_AND_SWORN_STATEMENT_HEADING",
              icon: "PrayerSwornIcon",
              config: [
                // {
                //   type: "infoBox",
                //   value: "infoBoxData",
                // },
                // {
                //   type: "text",
                //   label: "CS_CASE_SETTLEMENT_CONDITION_SUBHEADER",
                //   value: "caseSettlementCondition.text",
                // },
                {
                  type: "text",
                  label: "CS_MEMORANDUM_OF_COMPLAINT_HEADER",
                  // textDependentOn: "memorandumOfComplaint.document",
                  // textDependentValue: "DOCUMENT_UPLOADED",
                  value: "memorandumOfComplaint.text",
                },
                // {
                //   type: "text",
                //   label: "CS_PRAYER_FOR_RELIEF_HEADER",
                //   textDependentOn: "prayerForRelief.document",
                //   textDependentValue: "DOCUMENT_UPLOADED",
                //   value: "prayerForRelief.text",
                // },
                {
                  type: "text",
                  label: "CS_SWORN_STATEMENT_HEADER",
                  textDependentOn: "swornStatement.document",
                  textDependentValue: "DOCUMENT_UPLOADED",
                  value: "swornStatement.text",
                },
                {
                  type: "text",
                  label: "CS_ADDITIONAL_DETAILS",
                  value: "additionalDetails.text",
                },
                // {
                //   type: "text",
                //   label: "CS_SWORN_PAGE_ADDITIONAL_ACTS_SECTIONS_HEADER",
                //   value: "additionalActsSections.text",
                // },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: ["swornStatement.document", "SelectUploadDocWithName"],
                },
              ],
              data: {},
            },
            {
              key: "advocateDetails",
              name: "advocateDetails",
              label: "CS_ADVOCATE_DETAILS",
              icon: "AdvocateDetailsIcon",
              disableScrutiny: true,
              config: [
                {
                  type: "title",
                  value: ["advocateName"],
                },
                {
                  type: "text",
                  label: "CS_BAR_REGISTRATION",
                  value: "barRegistrationNumber",
                },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: ["vakalatnamaFileUpload.document", "AdvocateNameDetails.advocateIdProof"],
                  enableScrutinyField: true,
                },
              ],
              data: {},
            },
          ],
        },
      },
      {
        type: "component",
        component: "SelectReviewAccordion",
        key: "submissionFromAccused",
        label: "CS_SUBMISSSIONS_FROM_ACCUSED",
        number: 4,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              key: "submissionFromAccused",
              name: "submissionFromAccused",
              label: "CS_SUBMISSSIONS_FROM_ACCUSED",
              icon: "WitnessDetailsIcon",
              config: [
                {
                  type: "infoBox",
                  value: "infoBoxData",
                },
                {
                  type: "image",
                  label: "CS_DOCUMENT",
                  value: ["vakalatnamaDocument", "responseDocuments"],
                },
              ],
              data: {},
            },
          ],
        },
      },
      {
        key: "scrutinyMessage",
        type: "component",
        withoutLabel: true,
        component: "SelectEmptyComponent",
        populators: {},
      },
    ],
  },
];

export const reviewcasefileconfig = {
  formconfig: reviewCaseFileFormConfig,
  header: "CS_REVIEW_CASE_FILE_HEADING",
  subtext: "CS_REVIEW_CASE_FILE_SUBTEXT",
  className: "review-case-file",
};
