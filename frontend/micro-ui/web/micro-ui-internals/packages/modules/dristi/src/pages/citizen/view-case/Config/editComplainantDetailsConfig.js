const editComplainantDetailsFormConfig = [
  {
    body: [
      {
        key: "complainantType",
        head: "SELECT_COMPLAINANT_TYPE",
        name: "complainantType",
        type: "component",
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
        isProfileEdit: true,
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
    dependentKey: { complainantType: ["commonFields"] },
    body: [
      {
        type: "component",
        component: "VerificationComponent",
        key: "complainantId",
        withoutLabel: true,
        isMandatory: true,
        populators: {
          name: "complainantId",
          inputs: [
            {
              label: "COMPLAINANT_ID",
              updateLabelOn: "complainantType.showCompanyDetails",
              updateLabel: { key: "label", value: "CS_ENTITY_ID" },
              defaultLabel: { key: "label", value: "COMPLAINANT_ID" },
              name: "complainantId",
              verificationOn: "complainantVerification.individualDetails",
            },
          ],
          customStyle: {
            marginTop: 20,
          },
        },
      },
    ],
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
        addUUID: true,
        component: "SelectComponents",
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
          withoutLabel: true,
        },
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
      {
        key: "currentAddressDetails",
        type: "component",
        label: "CURRENT_RESIDENTIAL_ADDRESS",
        addUUID: true,
        component: "SelectComponents",
        populators: {
          inputs: [
            {
              name: "isCurrAddrSame",
              type: "Radio",
              label: "IS_CURRENT_ADDRESS_SAME",
              options: [
                {
                  code: "YES",
                  name: "YES"
                },
                {
                  code: "NO",
                  name: "NO"
                }
              ],
              required: true,
              optionsKey: "code",
              isMandatory: true
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
                patternType: "Pincode"
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style"
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
                  patternType: "name"
                },
                isRequired: true,
                patternType: "Name"
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style"
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
                  patternType: "name"
                },
                isRequired: true,
                patternType: "Name"
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style"
            },
            {
              name: "city",
              type: "text",
              label: "CITY/TOWN",
              validation: {
                errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
                isRequired: true,
                patternType: "Name"
              },
              isMandatory: true,
              inputFieldClassName: "user-details-form-style"
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
                  patternType: "address"
                },
                maxlength: 256,
                minlength: 2,
                isRequired: true
              },
              isMandatory: true,
              isFormatRequired: true,
              inputFieldClassName: "user-details-form-style"
            }
          ],
          validation: {}
        },
        withoutLabel: true
      }
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
        key: "reasonDetailsSeparator",
        type: "component",
        sublabel: "REQUEST_DETAILS",
        component: "OrSeparator",
        populators: {
          inputs: [],
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "SelectCustomTextArea",
        key: "prayer",
        withoutLabel: true,
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "PRAYER",
              type: "TextAreaComponent",
              isOptional: true,
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
        key: "reasonForChange",
        label: "CS_REASON_FOR_CHANGE",
        withoutLabel: true,
        isMandatory: true,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "CS_REASON_FOR_CHANGE",
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
        component: "SelectCustomDragDrop",
        key: "supportingDocument",
        isMandatory: false,
        withoutLabel: true,
        populators: {
          inputs: [
            {
              name: "document",
              documentHeader: "SUPPORTING_DOCUMENT",
              type: "DragDropComponent",
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileSize: 10,
              isOptional: "CS_IS_OPTIONAL",
              maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
              fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
              isMultipleUpload: false,
              documentHeaderStyle: {
                margin: "0px",
              },
            },
          ],
        },
      },
    ],
  },
];

export const editComplainantDetailsConfig = {
  formconfig: editComplainantDetailsFormConfig,
  header: "CS_COMPLAINT_DETAIL_HEADING",
  subtext: "CS_COMPLAINANT_DETAIL_SUBTEXT",
  isOptional: false,
  // addFormText: "ADD_COMPLAINANT",
  // formItemName: "CS_COMPLAINANT",
  className: "complainant-edit",
};
