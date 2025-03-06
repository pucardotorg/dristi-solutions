export const sideMenuConfig = [
  {
    isOpen: false,
    isDisabled: false,
    title: "CS_LITIGENT_DETAILS",
    key: "litigentDetails",
    children: [
      {
        key: "complainantDetails",
        label: "CS_COMPLAINT_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "complainantDetailsConfig",
              },
            ],
          },
        ],
        mandatoryFields: [
          "complainantType",
          "complainantId.complainantId",
          "firstName",
          // "dateOfBirth",
          "complainantVerification.otpNumber", // checkThis- make sure to unset otpNumber if otp model is closed or canceled.
        ],
        initialMandatoryFieldCount: 10,
        dependentMandatoryFields: [
          { field: "addressCompanyDetails-select.pincode", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "addressCompanyDetails-select.state", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "addressCompanyDetails-select.district", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "addressCompanyDetails-select.city", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "addressDetails-select.pincode", dependentOn: "complainantType", dependentOnKey: "isIndividual" },
          { field: "addressDetails-select.state", dependentOn: "complainantType", dependentOnKey: "isIndividual" },
          { field: "addressDetails-select.district", dependentOn: "complainantType", dependentOnKey: "isIndividual" },
          { field: "addressDetails-select.city", dependentOn: "complainantType", dependentOnKey: "isIndividual" },
          { field: "complainantCompanyName", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "complainantTypeOfEntity", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
        ],
        optionalFields: ["middleName", "lastName", "complainantAge", "addressCompanyDetails-select.locality", "addressDetails-select.locality"],
        initialOptionalFieldCount: 5,
        dependentOptionalFields: [
          { field: "addressCompanyDetails-select.locality", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "companyDetailsUpload.document", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "complainantDesignation", dependentOn: "complainantType", dependentOnKey: "showCompanyDetails" },
          { field: "addressDetails-select.locality", dependentOn: "complainantType", dependentOnKey: "isIndividual" },
        ],
      },
      {
        key: "respondentDetails",
        label: "CS_RESPONDENT_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "respondentConfig",
              },
            ],
          },
        ],
        mandatoryFields: ["respondentType", "respondentFirstName"],
        ifMultipleAddressLocations: {
          // using this for counting mandatory fields in case of multiple locations .
          dataKey: "addressDetails",
          mandatoryFields: ["addressDetails.pincode", "addressDetails.state", "addressDetails.district", "addressDetails.city"],
        },
        initialMandatoryFieldCount: 10,
        dependentMandatoryFields: [
          { field: "respondentCompanyName", dependentOn: "respondentType", dependentOnKey: "showCompanyDetails" },
          { field: "respondentTypeOfEntity", dependentOn: "respondentType", dependentOnKey: "showCompanyDetails" },
        ],
        optionalFields: [
          "middleName",
          "respondentLastName",
          "respondentAge",
          "phonenumbers.mobileNumber",
          "emails.emailId",
          "inquiryAffidavitFileUpload.document",
          "addressDetails.locality",
        ],
        dependentOptionalFields: [
          { field: "companyDetailsUpload.document", dependentOn: "respondentType", dependentOnKey: "showCompanyDetails" },
          { field: "respondentDesignation", dependentOn: "respondentType", dependentOnKey: "showCompanyDetails" },
        ],
        initialOptionalFieldCount: 6,
      },
    ],
  },
  {
    isOpen: false,
    isDisabled: false,
    title: "CS_CASE_SPECIFIC_DETAILS",
    key: "caseSpecificDetails",
    children: [
      {
        key: "chequeDetails",
        label: "CS_CHEQUE_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "chequeDetailsConfig",
              },
            ],
          },
        ],
        mandatoryFields: [
          "chequeSignatoryName",
          "bouncedChequeFileUpload.document",
          "name",
          "chequeNumber",
          "issuanceDate",
          "payeeBankName",
          "payeeBranchName",
          "payerBankName",
          "payerBranchName",
          "delayReason.reasonForReturnCheque",
          "ifsc",
          "chequeAmount",
          "policeStation",
          "depositDate",
          "returnMemoFileUpload.document",
        ],
        dependentMandatoryFields: [],
        initialMandatoryFieldCount: 12,
        optionalFields: ["chequeAdditionalDetails", "depositChequeFileUpload.document"],
        dependentOptionalFields: [],
        initialOptionalFieldCount: 1,
      },
      {
        key: "debtLiabilityDetails",
        label: "CS_DEBT_LIABILITY_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "debtLiabilityConfig",
              },
            ],
          },
        ],
        mandatoryFields: ["liabilityNature", "liabilityType"],
        initialMandatoryFieldCount: 2,
        dependentMandatoryFields: [{ field: "totalAmount", dependentOn: "liabilityType", dependentOnKey: "showAmountCovered" }],
        optionalFields: ["debtLiabilityFileUpload.document", "additionalDebtLiabilityDetails.text"],
        dependentOptionalFields: [],
        initialOptionalFieldCount: 2,
      },
      {
        key: "demandNoticeDetails",
        label: "CS_DEMAND_NOTICE_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "demandNoticeConfig",
              },
            ],
          },
        ],
        mandatoryFields: [
          "dateOfDispatch",
          "legalDemandNoticeFileUpload.document",
          "proofOfDispatchFileUpload.document",
          "proofOfService",
          "proofOfReply",
          "dateOfAccrual",
        ],
        initialMandatoryFieldCount: 9,
        dependentMandatoryFields: [
          { field: "dateOfService", dependentOn: "proofOfService", dependentOnKey: "showProofOfAcknowledgment" },
          {
            field: "proofOfAcknowledgmentFileUpload.document",
            dependentOn: "proofOfService",
            dependentOnKey: "showProofOfAcknowledgment",
          },
        ],
        optionalFields: [],
        dependentOptionalFields: [
          { field: "dateOfReply", dependentOn: "proofOfReply", dependentOnKey: "showProofOfReply" },
          {
            field: "proofOfReplyFileUpload.document",
            dependentOn: "proofOfReply",
            dependentOnKey: "showProofOfReply",
          },
        ],
        initialOptionalFieldCount: 0,
      },
      {
        key: "delayApplications",
        label: "CS_DELAY_APPLICATIONS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "delayApplicationFormConfig",
              },
            ],
          },
        ],
        mandatoryFields: ["delayCondonationType"],
        initialMandatoryFieldCount: 1,
        dependentMandatoryFields: [
          {
            field: "condonationFileUpload.document",
            dependentOn: "isDcaSkippedInEFiling",
            dependentOnKey: "showDcaFileUpload",
          },
        ],
        optionalFields: [],
        dependentOptionalFields: [],
        initialOptionalFieldCount: 0,
      },
    ],
    checked: false,
    isCompleted: 0,
  },
  {
    isOpen: false,
    isDisabled: false,
    title: "CS_ADDITIONAL_DETAILS",
    key: "additionalDetails",
    children: [
      {
        key: "witnessDetails",
        label: "CS_WITNESS_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "witnessConfig",
              },
            ],
          },
        ],
        anyOneOfTheseMandatoryFields: [["firstName", "witnessDesignation"]],
        initialMandatoryFieldCount: 0,
        dependentMandatoryFields: [],
        optionalFields: [
          "middleName",
          "lastName",
          "phonenumbers.mobileNumber",
          "emails.emailId",
          "witnessAdditionalDetails.text",
          "addressDetails.pincode",
          "addressDetails.state",
          "addressDetails.district",
          "addressDetails.city",
          "addressDetails.locality",
        ],
        dependentOptionalFields: [],
        initialOptionalFieldCount: 4,
      },
      {
        key: "prayerSwornStatement",
        label: "CS_PRAYER_SWORN_STATEMENT",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "prayerAndSwornConfig",
              },
            ],
          },
        ],
        mandatoryFields: ["memorandumOfComplaint.text"],
        anyOneOfTheseMandatoryFields: ["swornStatement.document"],
        initialMandatoryFieldCount: 2,
        dependentMandatoryFields: [],
        optionalFields: [
          "prayerAndSwornStatementType",
          "additionalDetails.text",
          "SelectUploadDocWithName.docName",
          "SelectUploadDocWithName.document",
        ],
        dependentOptionalFields: [],
        initialOptionalFieldCount: 6,
      },
      {
        key: "advocateDetails",
        label: "CS_ADVOCATE_DETAILS",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "advocateDetailsConfig",
              },
            ],
          },
        ],
        mandatoryFields: [],
        // We are not specifying mandatory fields here because whole form
        // is a custom component and it is not possible to show fields in that manner.
        // the counting logic is written directly for Advocate Details page.
        initialMandatoryFieldCount: 2,
        optionalFields: [],
        dependentOptionalFields: [],
        dependentMandatoryFields: [],
        optionalFields: [],
        dependentOptionalFields: [],
        initialOptionalFieldCount: 0,
      },
    ],
  },
  {
    isOpen: false,
    isDisabled: false,
    title: "CS_REVIEW_SIGN",
    key: "reviewcasedetails",
    children: [
      {
        key: "reviewCaseFile",
        label: "CS_REVIEW_CASE_FILE",
        checked: false,
        isCompleted: false,
        isDisabled: false,
        pageConfig: [
          {
            moduleName: "commonUiConfig",
            masterDetails: [
              {
                name: "reviewCaseFileConfig",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const documentTypeMapping = {
  bouncedChequeFileUpload: "BOUNCED_CHEQUE",
  depositChequeFileUpload: "PROOF_OF_DEPOSIT_OF_CHEQUE",
  returnMemoFileUpload: "RETURN_MEMO",
  debtLiabilityFileUpload: "DEBT_LIABILITY",
  legalDemandNoticeFileUpload: "DEMAND_NOTICE",
  proofOfAcknowledgmentFileUpload: "PROOF_OF_ACK_OF_LEGAL_NOTICE",
  proofOfDispatchFileUpload: "PROOF_OF_DISPATCH_OF_LEGAL_NOTICE",
  proofOfReplyFileUpload: "PROOF_OF_REPLY_TO_LEGAL_NOTICE",
  swornStatement: "SWORN_STATEMENT",
  inquiryAffidavitFileUpload: "AFFIDAVIT_UNDER_225",
  vakalatnamaFileUpload: "VAKALATNAMA",
  pipAffidavitFileUpload: "COMPLAINANT_PIP_AFFIDAVIT",
};
