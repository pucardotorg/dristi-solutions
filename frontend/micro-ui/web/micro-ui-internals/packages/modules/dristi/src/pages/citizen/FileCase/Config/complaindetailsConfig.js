const complainantDetailsFormConfig = [
  {
    body: [
      {
        key: "complainantType",
        head: "SELECT_COMPLAINANT_TYPE",
        name: "complainantType",
        type: "component",
        notes: {
          key: "personalDetailsNote",
          type: "component",
          component: "SelectCustomNote",
          populators: {
            inputs: [
              {
                type: "InfoComponent",
                infoText: "CS_PLEASE_CONTACT_NYAY_MITRA_TEXT",
                infoHeader: "CS_PLEASE_COMMON_NOTE",
                infoTooltipMessage: "CS_NOTE_TOOLTIP_RESPONDENT_PERSONAL_DETAILS",
              },
            ],
          },
          withoutLabel: true,
        },
        component: "CustomRadioInfoComponent",
        populators: {
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "SELECT_COMPLAINANT_TYPE",
          required: false,
          mdmsConfig: {
            select: "(data) => {return data['case'].ComplainantRespondentType?.map((item) => {return item;});}",
            masterName: "ComplainantRespondentType",
            moduleName: "case",
          },
          optionsKey: "code",
          customStyle: {
            gap: "40px",
            alignItems: "center",
            flexDirection: "row",
          },
          isDependent: true,
          isMandatory: true,
        },
        isMandatory: true,
        withoutLabel: true,
        resetFormData: true,
        noteDependentOn: "complainantVerification.individualDetails",
      },
    ],
  },
  {
    body: [
      {
        key: "complainantTypeOfEntity",
        type: "dropdown",
        label: "TYPE_OF_ENTITY",
        populators: {
          name: "complainantTypeOfEntity",
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          label: "SELECT_RESPONDENT_TYPE",
          styles: {
            maxWidth: "100%",
            marginBottom: "10px",
          },
          required: false,
          mdmsConfig: {
            select: "(data) => {return data['case'].TypeOfEntity?.map((item) => {return item;});}",
            masterName: "TypeOfEntity",
            moduleName: "case",
          },
          optionsKey: "code",
          isMandatory: true,
        },
        isMandatory: true,
      },
    ],
    dependentKey: {
      complainantType: ["showCompanyDetails"],
    },
  },
  {
    body: [
      {
        key: "complainantVerification",
        name: "mobileNumber",
        type: "component",
        error: "ERR_HRMS_INVALID_MOB_NO",
        label: "CS_COMPLAINANT_MOBILE_NUMBER",
        component: "VerifyPhoneNumber",
        populators: {},
        validation: {
          pattern: {
            masterName: "commonUiConfig",
            moduleName: "patternValidation",
            patternType: "contact",
          },
          required: true,
          maxLength: 10,
          minLength: 10,
        },
        isMandatory: true,
        updateLabel: {
          key: "label",
          value: "CS_REPRESENTATIVE_MOBILE_NUMBER",
        },
        defaultLabel: {
          key: "label",
          value: "CS_COMPLAINANT_MOBILE_NUMBER",
        },
        withoutLabel: true,
        updateLabelOn: "complainantType.showCompanyDetails",
        componentInFront: "+91",
        disableConfigKey: "individualDetails",
        disableConfigFields: [
          "firstName",
          "middleName",
          "lastName",
          "pincode",
          "pincode",
          "state",
          "district",
          "city",
          "locality",
          "addressDetails",
          "dateOfBirth",
        ],
        isVerifiedOtpDisabledKey: "isDuplicateNumber",
      },
    ],
    dependentKey: {
      complainantType: ["commonFields"],
    },
  },
  {
    body: [
      {
        key: "complainantId",
        type: "component",
        component: "VerificationComponent",
        populators: {
          name: "complainantId",
          inputs: [
            {
              name: "complainantId",
              label: "COMPLAINANT_ID",
              updateLabel: {
                key: "label",
                value: "CS_ENTITY_ID",
              },
              defaultLabel: {
                key: "label",
                value: "COMPLAINANT_ID",
              },
              updateLabelOn: "complainantType.showCompanyDetails",
              verificationOn: "complainantVerification.individualDetails",
            },
          ],
          customStyle: {
            marginTop: 20,
          },
        },
        isMandatory: true,
        withoutLabel: true,
      },
    ],
    dependentKey: {
      complainantType: ["commonFields"],
    },
  },
  {
    body: [
      {
        type: "text",
        label: "FIRST_NAME",
        populators: {
          name: "firstName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          validation: {
            title: "",
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
        isMandatory: true,
      },
      {
        type: "text",
        label: "MIDDLE_NAME",
        populators: {
          name: "middleName",
          validation: {
            title: "",
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "userName",
            },
            patternType: "Name",
          },
        },
        isMandatory: false,
        labelChildren: "optional",
      },
      {
        type: "text",
        label: "LAST_NAME",
        populators: {
          name: "lastName",
          validation: {
            title: "",
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "userName",
            },
            patternType: "Name",
          },
        },
        isMandatory: false,
        labelChildren: "optional",
      },
      {
        type: "text",
        label: "AGE",
        populators: {
          name: "complainantAge",
          error: "AGE_VALIDATION",
          validation: {
            maxLength: 3,
            minLength: 2,
            pattern: "[0-9]+",
            patternType: "Number",
          },
        },
        isMandatory: true,
      },
    ],
    head: "CS_COMMON_COMPLAINANT_DETAIL",
    updateLabel: {
      key: "head",
      value: "CS_COMMON_ENTITY_DETAIL",
    },
    defaultLabel: {
      key: "head",
      value: "CS_COMMON_COMPLAINANT_DETAIL",
    },
    dependentKey: {
      complainantType: ["commonFields"],
    },
    updateLabelOn: "complainantType.showCompanyDetails",
  },
  {
    body: [
      {
        type: "text",
        label: "DESIGNATION",
        populators: {
          name: "complainantDesignation",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            title: "",
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "userName",
            },
            patternType: "Name",
          },
        },
        isMandatory: false,
        labelChildren: "optional",
      },
    ],
    dependentKey: {
      complainantType: ["showCompanyDetails"],
    },
  },
  {
    body: [
      {
        key: "complainantCompanyName",
        type: "text",
        label: "company_Name",
        populators: {
          name: "complainantCompanyName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          styles: {
            minWidth: "100%",
          },
          validation: {
            title: "",
            pattern: {
              message: "CORE_COMMON_NON_NUMERIC_TYPE_IN",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "nonNumericString",
            },
            minLength: 1,
            patternType: "Name",
          },
          customStyle: {
            minWidth: "100%",
          },
          labelStyles: {
            padding: "8px",
          },
        },
        isMandatory: true,
      },
      {
        key: "companyDetailsUpload",
        type: "component",
        label: "COMPANY_DOCUMENT_DETAILS",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "PDF", "PNG"],
              isOptional: "CS_IS_OPTIONAL",
              isMandatory: false,
              maxFileSize: 10,
              documentHeader: "COMPANY_DOCUMENT_DETAILS",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_10",
              documentHeaderStyle: {
                textAlign: "start",
              },
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
        },
        isMandatory: false,
        withoutLabel: true,
      },
    ],
    head: "CS_RESPONDENT_COMPANY_DETAIL",
    dependentKey: {
      complainantType: ["showCompanyDetails"],
    },
  },
  {
    body: [
      {
        key: "addressDetails",
        type: "component",
        notes: {
          key: "personalDetailsNote",
          type: "component",
          component: "SelectCustomNote",
          populators: {
            inputs: [
              {
                type: "InfoComponent",
                infoText: "CS_ADDRESS_MATCHES_ID_PROOF",
                infoHeader: "CS_PLEASE_COMMON_NOTE",
                infoTooltipMessage: "CS_ADDRESS_MATCHES_ID_PROOF",
              },
            ],
          },
          styles: { marginBottom: "20px" },
          withoutLabel: true,
        },
        addUUID: true,
        component: "SelectComponents",
        populators: {
          inputs: [
            {
              name: "typeOfAddress",
              type: "Radio",
              label: "CS_TYPE_OF_ADDRESS",
              options: [],
              showOptional: true,
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
              name: "state",
              type: "text",
              label: "STATE",
              validation: {
                title: "",
                errMsg: "CORE_COMMON_APPLICANT_STATE_INVALID",
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "name",
                },
                isRequired: true,
                patternType: "Name",
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
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "name",
                },
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "city",
              type: "text",
              label: "CITY/TOWN",
              validation: {
                errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "locality",
              type: "text",
              label: "ADDRESS",
              validation: {
                errMsg: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "address",
                },
                maxlength: 256,
                minlength: 2,
                isRequired: true,
              },
              isMandatory: true,
              isFormatRequired: true,
              inputFieldClassName: "user-details-form-style",
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
    ],
    head: "CS_COMPLAINANT_LOCATION",
    dependentKey: {
      complainantType: ["complainantLocation"],
    },
  },
  {
    body: [
      {
        key: "addressCompanyDetails",
        type: "component",
        addUUID: true,
        component: "SelectComponents",
        populators: {
          inputs: [
            {
              name: "typeOfAddress",
              type: "Radio",
              label: "CS_TYPE_OF_ADDRESS",
              options: [],
              showOptional: true,
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
              shouldBeEnabled: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "state",
              type: "text",
              label: "STATE",
              validation: {
                title: "",
                errMsg: "CORE_COMMON_APPLICANT_STATE_INVALID",
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "name",
                },
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
              shouldBeEnabled: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "district",
              type: "text",
              label: "DISTRICT",
              validation: {
                title: "",
                errMsg: "CORE_COMMON_APPLICANT_DISTRICT_INVALID",
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "name",
                },
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
              shouldBeEnabled: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "city",
              type: "text",
              label: "CITY/TOWN",
              validation: {
                errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
              shouldBeEnabled: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "locality",
              type: "text",
              label: "ADDRESS",
              validation: {
                errMsg: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
                isRequired: true,
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "address",
                },
                maxlength: 256,
                minlength: 2,
              },
              isMandatory: true,
              shouldBeEnabled: true,
              isFormatRequired: true,
              inputFieldClassName: "user-details-form-style",
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
    ],
    head: "CS_COMPANY_LOCATION",
    dependentKey: {
      complainantType: ["showCompanyDetails"],
    },
  },
  {
    body: [
      {
        key: "transferredPOA",
        type: "radio",
        labelChildren: "OutlinedInfoIcon",
        tooltipValue: "HAS_LITIGANT_TRANFERRED_POA_TO_SOMEONE_INFO",
        label: "HAS_LITIGANT_TRANFERRED_POA_TO_SOMEONE",
        populators: {
          name: "transferredPOA",
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: {
            maxWidth: "100%",
            marginBottom: "10px",
          },
          required: false,
          optionsKey: "code",
          options: [
            {
              code: "YES",
              name: "YES",
              showPoaDetails: true,
            },
            {
              code: "NO",
              name: "NO",
              showPoaDetails: false,
            },
          ],
          isMandatory: true,
        },
        isMandatory: true,
      },
    ],
    head: "POWER_OF_ATTORNEY_DETAILS",
    dependentKey: {
      complainantType: ["commonFields"],
    },
  },
  {
    dependentKey: { transferredPOA: ["showPoaDetails"] },
    body: [
      {
        type: "component",
        component: "SelectCustomNote",
        key: "poaDetailNote",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              infoHeader: "CS_COMMON_NOTE",
              infoText: "ALL_RIGHTS_IN_SYSTEM_WILL_TRANSFER_TO_POA_HOLDER",
              infoTooltipMessage: "ALL_RIGHTS_IN_SYSTEM_WILL_TRANSFER_TO_POA_HOLDER_TOOLTIP",
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
        key: "poaVerification",
        name: "mobileNumber",
        type: "component",
        error: "ERR_HRMS_INVALID_MOB_NO",
        label: "CS_POA_MOBILE_NUMBER",
        component: "VerifyPhoneNumber",
        populators: {},
        validation: {
          pattern: {
            masterName: "commonUiConfig",
            moduleName: "patternValidation",
            patternType: "contact",
          },
          required: true,
          maxLength: 10,
          minLength: 10,
        },
        isMandatory: true,
        withoutLabel: true,
        componentInFront: "+91",
        disableConfigKey: "individualDetails",
        disableConfigFields: ["firstName", "middleName", "lastName", "pincode", "state", "district", "city", "locality", "addressDetails"],
        isVerifiedOtpDisabledKey: "isDuplicateNumber",
      },
    ],
    dependentKey: {
      transferredPOA: ["showPoaDetails"],
    },
  },
  {
    body: [
      {
        key: "poaComplainantId",
        type: "component",
        component: "VerificationComponent",
        populators: {
          name: "poaComplainantId",
          inputs: [
            {
              name: "poaComplainantId",
              label: "POA_ID",
              verificationOn: "complainantVerification.individualDetails",
            },
          ],
          customStyle: {
            marginTop: 20,
          },
        },
        isMandatory: true,
        withoutLabel: true,
      },
    ],
    dependentKey: {
      transferredPOA: ["showPoaDetails"],
    },
  },
  {
    body: [
      {
        type: "text",
        label: "FIRST_NAME",
        populators: {
          name: "poaFirstName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
          validation: {
            title: "",
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
        isMandatory: true,
      },
      {
        type: "text",
        label: "MIDDLE_NAME",
        populators: {
          name: "poaMiddleName",
          validation: {
            title: "",
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "userName",
            },
            patternType: "Name",
          },
        },
        isMandatory: false,
        labelChildren: "optional",
      },
      {
        type: "text",
        label: "LAST_NAME",
        populators: {
          name: "poaLastName",
          validation: {
            title: "",
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              masterName: "commonUiConfig",
              moduleName: "patternValidation",
              patternType: "userName",
            },
            patternType: "Name",
          },
        },
        isMandatory: false,
        labelChildren: "optional",
      },
      {
        type: "text",
        label: "AGE",
        populators: {
          name: "poaAge",
          error: "AGE_VALIDATION",
          validation: {
            maxLength: 3,
            minLength: 2,
            pattern: "[0-9]+",
            patternType: "Number",
          },
        },
        isMandatory: true,
      },
    ],
    head: "CS_POA_BASIC_DETAILS",
    dependentKey: {
      transferredPOA: ["showPoaDetails"],
    },
  },
  {
    body: [
      {
        key: "poaAddressDetails",
        type: "component",
        addUUID: true,
        component: "SelectComponents",
        populators: {
          inputs: [
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
              name: "state",
              type: "text",
              label: "STATE",
              validation: {
                title: "",
                errMsg: "CORE_COMMON_APPLICANT_STATE_INVALID",
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "name",
                },
                isRequired: true,
                patternType: "Name",
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
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "name",
                },
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "city",
              type: "text",
              label: "CITY/TOWN",
              validation: {
                errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
                isRequired: true,
                patternType: "Name",
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style",
            },
            {
              name: "locality",
              type: "text",
              label: "ADDRESS",
              validation: {
                errMsg: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
                pattern: {
                  masterName: "commonUiConfig",
                  moduleName: "patternValidation",
                  patternType: "address",
                },
                maxlength: 256,
                minlength: 2,
                isRequired: true,
              },
              isMandatory: true,
              isFormatRequired: true,
              inputFieldClassName: "user-details-form-style",
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
      {
        key: "poaAuthorizationDocument",
        type: "component",
        label: "POA_AUTHORIZATION_DOCUMENT",
        component: "SelectCustomDragDrop",
        populators: {
          inputs: [
            {
              name: "poaDocument",
              type: "DragDropComponent",
              fileTypes: ["JPG", "PDF", "PNG"],
              isMandatory: true,
              maxFileSize: 10,
              documentHeader: "POA_AUTHORIZATION_DOCUMENT",
              isMultipleUpload: true,
              uploadGuidelines: "UPLOAD_DOC_10",
              documentHeaderStyle: {
                textAlign: "start",
              },
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            },
          ],
        },
        isMandatory: true,
        withoutLabel: true,
      },
    ],
    head: "POA_HOLDER_LOCATION",
    sectionHeadStyle: { marginBottom: 0 },
    dependentKey: {
      transferredPOA: ["showPoaDetails"],
    },
  },
];

export const complaintdetailconfig = {
  formconfig: complainantDetailsFormConfig,
  header: "CS_COMPLAINT_DETAIL_HEADING",
  subtext: "CS_COMPLAINANT_DETAIL_SUBTEXT",
  isOptional: false,
  addFormText: "ADD_COMPLAINANT",
  formItemName: "CS_COMPLAINANT",
  className: "complainant",
};
