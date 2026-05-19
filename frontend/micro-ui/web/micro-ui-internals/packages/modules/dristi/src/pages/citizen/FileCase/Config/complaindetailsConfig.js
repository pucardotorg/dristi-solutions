import {
  buildComplainantCompanyDetailStep,
  complainantEntityTypeFormStep,
  complainantIdFormStep,
  complainantVerificationFormStep,
  complainantDesignationFormStep,
  fileCaseComplainantAddressFormStep,
  fileCaseComplainantCompanyAddressFormStep,
  fileCaseComplainantNameAgeFormStep,
  fileCaseComplainantTypeFormStep,
} from "../../../../configs/shared/partyFormFieldsShared";

const complainantDetailsFormConfig = [
  fileCaseComplainantTypeFormStep,
  complainantEntityTypeFormStep,
  complainantVerificationFormStep,
  complainantIdFormStep,
  fileCaseComplainantNameAgeFormStep,
  complainantDesignationFormStep,
  buildComplainantCompanyDetailStep(false),
  fileCaseComplainantAddressFormStep,
  fileCaseComplainantCompanyAddressFormStep,
  {
    body: [
      {
        key: "transferredPOA",
        type: "radio",
        label: "HAS_LITIGANT_TRANFERRED_POA_TO_SOMEONE",
        populators: {
          name: "transferredPOA",
          type: "radioButton",
          error: "CORE_REQUIRED_FIELD_ERROR",
          styles: {
            maxWidth: "100%",
            marginBottom: "10px",
          },
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
          required: false,
          optionsKey: "code",
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
    body: [
      {
        key: "poaDetailNote",
        type: "component",
        component: "SelectCustomNote",
        populators: {
          inputs: [
            {
              type: "InfoComponent",
              infoText: "ALL_RIGHTS_IN_SYSTEM_WILL_TRANSFER_TO_POA_HOLDER",
              infoHeader: "CS_COMMON_NOTE",
              infoTooltipMessage: "ALL_RIGHTS_IN_SYSTEM_WILL_TRANSFER_TO_POA_HOLDER_TOOLTIP",
            },
          ],
        },
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
              isMandatory: true,
              documentHeader: "POA_AUTHORIZATION_DOCUMENT",
              isMultipleUpload: true,
              documentHeaderStyle: {
                textAlign: "start",
              },
            },
          ],
        },
        isMandatory: true,
        withoutLabel: true,
      },
    ],
    head: "POA_HOLDER_LOCATION",
    dependentKey: {
      transferredPOA: ["showPoaDetails"],
    },
    sectionHeadStyle: {
      marginBottom: 0,
    },
  },

];

export const complaintdetailconfig = {
  formconfig: complainantDetailsFormConfig,
  header: "CS_COMPLAINT_DETAIL_HEADING",
  subtext: "CS_COMPLAINT_DATA_ENTRY_INFO",
  isOptional: false,
  addFormText: "ADD_COMPLAINANT",
  formItemName: "CS_COMPLAINANT",
  className: "complainant",
};
