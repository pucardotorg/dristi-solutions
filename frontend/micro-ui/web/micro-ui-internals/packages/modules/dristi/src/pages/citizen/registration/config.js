export const userTypeOptions = [
  {
    code: "LITIGANT",
    name: "LITIGANT_TEXT",
    showBarDetails: false,
    isVerified: false,
    role: [
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "DEPOSITION_CREATOR",
      "DEPOSITION_VIEWER",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "CASE_RESPONDER",
      "HEARING_ACCEPTOR",
      "ADVOCATE_VIEWER",
      "PENDING_TASK_CREATOR",
    ],
    subText: "LITIGANT_SUB_TEXT",
  },
  {
    code: "ADVOCATE",
    name: "ADVOCATE_TEXT",
    showBarDetails: true,
    isVerified: true,
    hasBarRegistrationNo: true,
    role: [
      "ADVOCATE_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "DEPOSITION_CREATOR",
      "DEPOSITION_VIEWER",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "CASE_RESPONDER",
      "HEARING_ACCEPTOR",
      "ADVOCATE_VIEWER",
      "ADVOCATE_APPLICATION_VIEWER",
      "PENDING_TASK_CREATOR",
    ],
    apiDetails: {
      serviceName: "/advocate/v1/_create",
      requestKey: "advocate",
      AdditionalFields: ["barRegistrationNumber"],
    },
    subText: "ADVOCATE_SUB_TEXT",
  },
  {
    code: "ADVOCATE_CLERK",
    name: "ADVOCATE_CLERK_TEXT",
    showBarDetails: true,
    hasStateRegistrationNo: true,
    isVerified: true,
    role: [
      "ADVOCATE_CLERK_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "DEPOSITION_CREATOR",
      "DEPOSITION_VIEWER",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "CASE_RESPONDER",
      "HEARING_ACCEPTOR",
      "ADVOCATE_VIEWER",
      "PENDING_TASK_CREATOR",
    ],
    apiDetails: {
      serviceName: "/advocate/clerk/v1/_create",
      requestKey: "clerk",
      AdditionalFields: ["stateRegnNumber"],
    },

    subText: "ADVOCATE_CLERK_SUB_TEXT",
  },
];

export const newConfig = [
  {
    body: [
      {
        type: "text",
        label: "FIRST_NAME",
        isMandatory: true,
        populators: {
          name: "firstName",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              value: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
            },
            title: "",
            patternType: "Name",
            minLength: 2,
          },
        },
      },
      {
        type: "text",
        label: "MIDDLE_NAME",
        populators: {
          name: "middleName",
          error: "ERR_HRMS_INVALID_MIDDLE_NAME",
          validation: {
            pattern: {
              message: "ERR_HRMS_INVALID_MIDDLE_NAME",
              value: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
            },
            title: "",
            patternType: "Name",
          },
        },
      },
      {
        type: "text",
        label: "LAST_NAME",
        isMandatory: true,
        populators: {
          name: "lastName",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              value: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
            },
            title: "",
            patternType: "Name",
            minLength: 1,
          },
        },
      },
    ],
  },
  {
    head: "CS_ENTER_ADDRESS",
    body: [
      {
        type: "component",
        component: "AddressComponent",
        key: "addressDetails",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "PINCODE",
              type: "text",
              name: "pincode",
              validation: {
                minlength: 6,
                maxlength: 6,
                patternType: "Pincode",
                pattern: "[0-9]+",
                max: "9999999",
                errMsg: "ADDRESS_PINCODE_INVALID",
                isRequired: true,
                title: "",
              },
              isMandatory: true,
            },
            {
              label: "STATE",
              type: "text",
              name: "state",
              validation: {
                isRequired: true,
                pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
                errMsg: "CORE_COMMON_APPLICANT_STATE_INVALID",
                patternType: "Name",
                title: "",
              },
              isMandatory: true,
            },
            {
              label: "DISTRICT",
              type: "text",
              name: "district",
              validation: {
                isRequired: true,
                pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
                errMsg: "CORE_COMMON_APPLICANT_DISTRICT_INVALID",
                patternType: "Name",
                title: "",
              },
              isMandatory: true,
            },
            {
              label: "CITY/TOWN",
              type: "text",
              name: "city",
              validation: {
                isRequired: true,
              },
              isMandatory: true,
            },
            {
              label: "LOCALITY",
              type: "text",
              name: "locality",
              validation: {
                isRequired: true,
                minlength: 2,
                maxlength: 256,
              },
              isMandatory: true,
            },
            {
              label: "BUILDING_NAME",
              type: "text",
              name: "buildingName",
              validation: {
                errMsg: "ADDRESS_BUILDING_NAME_INVALID",
                minlength: 1,
                title: "",
              },
            },
            {
              label: "DOOR_NUMBER",
              type: "text",
              name: "doorNo",
              validation: {
                errMsg: "DOOR_NUMBER_ERROR_MESSAGE",
                pattern: /^[^\$\"'<>?~`!@$%^={}\[\]*:;“”‘’]{0,100}$/i,
                minlength: 1,
                maxlength: 16,
                title: "",
              },
            },
          ],
          validation: {},
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "CustomRadioCard",
        key: "clientDetails",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "SELECT_USER_TYPE_TEXT",
              subLabel: "SELECT_USER_TYPE_SUB_TEXT",
              type: "radioButton",
              name: "selectUserType",
              optionsKey: "name",
              error: "CORE_REQUIRED_FIELD_ERROR",
              required: false,
              isMandatory: true,
              clearFields: { stateOfRegistration: "", barRegistrationNumber: "", barCouncilId: [], stateRegnNumber: "" },
              options: userTypeOptions,
              styles: { flexDirection: "column" },
            },
          ],
        },
      },
    ],
  },
  {
    head: "CS_ENTER_NAME",
    subHead: "CS_ENTER_NAME_SUB_TEXT",
    headId: "select-name-subtext", // for css
    body: [
      {
        type: "text",
        label: "FIRST_NAME",
        isMandatory: true,
        populators: {
          name: "firstName",
          error: "FIRST_LAST_NAME_MANDATORY_MESSAGE_ONE_CHAR",
          validation: {
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              value: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
            },
            minLength: 1,
            title: "",
            patternType: "Name",
          },
        },
      },
      {
        type: "text",
        label: "CORE_COMMON_MIDDLE_NAME",
        populators: {
          name: "middleName",
          validation: {
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              value: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
            },
            title: "",
            patternType: "Name",
          },
        },
      },
      {
        type: "text",
        label: "CORE_LAST_NAME",
        populators: {
          name: "lastName",
          validation: {
            pattern: {
              message: "CORE_COMMON_APPLICANT_NAME_INVALID",
              value: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
            },
            title: "",
            patternType: "Name",
          },
        },
      },
    ],
  },
  {
    texts: {
      // header: "CS_LOGIN_OTP",
      cardText: "CS_LOGIN_OTP_TEXT",
    },
  },
  {
    texts: {
      header: "CS_ENTER_MOBILE",
      cardText: "CS_ENTER_MOBILE_SUB_TEXT",
      submitBarLabel: "CS_COMMON_CONTINUE",
      submitInForm: true,
    },
    inputs: [
      {
        label: "CORE_COMMON_MOBILE_NUMBER",
        type: "text",
        name: "mobileNumber",
        error: "ERR_HRMS_INVALID_MOB_NO",
        validation: {
          required: true,
          minlength: 10,
          maxlength: 10,
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "CustomRadioCard",
        key: "IdVerification",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "CS_VERFIY_IDENTITY",
              subLabel: "CS_VERFIY_IDENTITY_SUB_TEXT",
              type: "radioButton",
              name: "selectIdType",
              optionsKey: "name",
              error: "CORE_REQUIRED_FIELD_ERROR",
              validation: {},
              clearFields: { aadharNumber: "" },
              isMandatory: true,
              disableMandatoryFieldFor: ["aadharNumber"],
              disableFormValidation: false,
              optionsCustomStyle: {
                top: "40px",
              },
              styles: { flexDirection: "column" },
            },
          ],
          validation: {},
        },
      },
    ],
  },
  {
    head: "CS_ENTER_ADHAAR",
    subHead: "CS_ENTER_ADHAAR_TEXT",
    body: [
      {
        type: "component",
        component: "AdhaarInput",
        key: "AdhaarInput",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "ENTER_AADHAR_NUMBER",
              type: "text",
              name: "aadharNumber",
              validation: {
                minlength: 12,
                maxlength: 12,
                patternType: "AadharNo",
                pattern: "[0-9]+",
                errMsg: "AADHAR_NUMBER_INVALID",
                title: "",
              },
              clearFields: { ID_Proof: [], selectIdTypeType: "" },
              clearFieldsType: { ID_Proof: "documentUpload" },
              disableMandatoryFieldFor: ["ID_Proof", "selectIdTypeType"],
              isMandatory: true,
            },
          ],
          validation: {},
        },
      },
    ],
  },
  {
    texts: {
      header: "CS_AADHAR_OTP",
      cardText: "CS_AADHAR_OTP_TEXT",
      nextText: "CS_COMMONS_NEXT",
      submitBarLabel: "CS_COMMONS_NEXT",
    },
  },
  {
    head: "UPLOAD-ID",
    subHead: "UPLOAD_SUBTEXT",
    body: [
      {
        type: "component",
        component: "SelectUserTypeComponent",
        key: "SelectUserTypeComponent",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "CS_ID_TYPE",
              type: "dropdown",
              name: "selectIdType",
              optionsKey: "type",
              error: "CORE_REQUIRED_FIELD_ERROR",
              validation: {},
              clearFields: { aadharNumber: "", ID_Proof: [] },
              clearFieldsType: { ID_Proof: "documentUpload" },
              isMandatory: true,
              disableMandatoryFieldFor: ["aadharNumber"],
              disableFormValidation: false,
              mdmsConfig: {
                masterName: "IdentifierType",
                moduleName: "User Registration",
                select: "(data) => {return data['User Registration'].IdentifierType?.map((item) => {return item;});}",
              },
              optionsCustomStyle: {
                top: "40px",
              },
            },
            {
              label: "CS_UPLOAD_PROOF",
              type: "documentUpload",
              name: "ID_Proof",
              validation: {},
              clearFields: { aadharNumber: "" },
              allowedFileTypes: /(.*?)(png|jpg|pdf|jpeg)$/i,
              isMandatory: true,
              disableMandatoryFieldFor: ["aadharNumber"],
              errorMessage: "CUSTOM_DOCUMENT_ERROR_MSG",
              disableFormValidation: false,
            },
          ],
          validation: {},
        },
      },
    ],
  },
  {
    body: [
      {
        type: "component",
        component: "CustomCheckBoxCard",
        key: "terms_condition",
        withoutLabel: true,
        populators: {
          inputs: [
            {
              label: "ES_COMMON_USER_TERMS_AND_CONDITIONS",
              subLabel: "CS_VERFIY_IDENTITY_SUB_TEXT",
              type: "multiple",
              name: "terms_condition",
              optionsKey: "name",
              error: "CORE_REQUIRED_FIELD_ERROR",
              isMandatory: true,
              disableFormValidation: false,
              options: [
                {
                  code: "AGREE_MESSAGE",
                  name:
                    "FIRST_TERMS_AND_CONDITIONS",
                },
                {
                  code: "PRIVACY_MESSAGE",
                  name:
                    "SECOND_TERMS_AND_CONDITIONS",
                },
                {
                  code: "LAWFUL_MESSAGE",
                  name:
                    "THIRD_TERMS_AND_CONDITIONS",
                },
                {
                  code: "MODIFICATION_MESSAGE",
                  name:
                    "FOURTH_TERMS_AND_CONDITIONS",
                },
              ],
            },
          ],
        },
      },
    ],
  },
];

export const termsAndConditionConfig = [
  {
    body: [
      {
        type: "checkbox",
        key: "Terms_Conditions",
        populators: {
          title: "FIRST_TERMS_AND_CONDITIONS",
          name: "Terms_Conditions",
          styles: { minWidth: "100%" },
          labelStyles: { padding: "8px" },
          customStyle: { minWidth: "100%" },
        },
      },
    ],
  },
];

export const advocateClerkConfig = [
  {
    body: [
      {
        type: "component",
        component: "AdvocateDetailComponent",
        key: "clientDetails",
        // header: "Verify your identity",
        // withoutLabel: true,
        // subLabel: "Before diving in, we'll need to verify your identity for account setup",
        populators: {
          inputs: [
            {
              label: "BAR_REGISTRATION_NUMBER",
              type: "text",
              name: "barRegistrationNumber",
              validation: {
                isRequired: true,
                // pattern: "[A-Z]/\\d{6}/\\d{4}",
                errMsg: "BAR_REGISTRATION_NUMBER_INVALID_PATTERN",
                maxlength: 20,
                minlength: 1,
              },
              isMandatory: true,
              isDependentOn: "selectUserType",
              clearFields: { stateRegnNumber: "" },
              dependentKey: { selectUserType: ["showBarDetails", "hasBarRegistrationNo"] },
            },

            {
              label: "BAR_COUNCIL_ID",
              type: "documentUpload",
              name: "barCouncilId",
              validation: {
                isRequired: true,
              },
              isMandatory: true,
              allowedFileTypes: /(.*?)(png|jpeg|jpg|pdf)$/i,
              isDependentOn: "selectUserType",
              dependentKey: { selectUserType: ["showBarDetails"] },
            },
          ],
        },
      },
    ],
  },
];
