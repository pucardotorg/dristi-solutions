const createWitnessConfig = (index) => [
  {
    body: [
      {
        type: "text",
        label: "FIRST_NAME",
        populators: {
          name: "firstName",
        },
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
        key: "OrSeparator",
        type: "component",
        sublabel: "OR",
        component: "OrSeparator",
        populators: {
          inputs: [],
        },
      },
      {
        type: "text",
        label: "WITNESS_DESIGNATION",
        populators: {
          name: "witnessDesignation",
        },
      },
      {
        type: "text",
        label: "AGE",
        populators: {
          name: "witnessAge",
          error: "CORE_REQUIRED_FIELD_ERROR",
          validation: {
            maxLength: 3,
            patternType: "Number",
          },
        },
        isMandatory: false,
        labelChildren: "optional",
      },
    ],
    head: "WITNESS_BASIC_DETAILS",
  },
  {
    body: [
      {
        key: "phonenumbers",
        type: "component",
        label: "CORE_COMMON_PHONE_NUMBER",
        component: "SelectBulkInputs",
        populators: {
          inputs: [
            {
              name: "mobileNumber",
              type: "text",
              error: "ERR_HRMS_INVALID_MOB_NO",
              errorStyle: { width: "100%", color: "red" },
              label: "CORE_COMMON_PHONE_NUMBER",
              className: "mobile-number",
              validation: {
                pattern: /^[6-9]\d{9}$/,
                isNumber: true,
                required: true,
                maxLength: 10,
                minLength: 10,
              },
              componentInFront: "+91",
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
    ],
    head: "CS_WITNESS_CONTACT_DETAILS",
    subHead: "CS_WITNESS_NOTE",
  },
  {
    body: [
      {
        key: "emails",
        type: "component",
        label: "CORE_COMMON_EMAILS",
        component: "SelectBulkInputs",
        populators: {
          inputs: [
            {
              name: "emailId",
              type: "text",
              error: "ERR_HRMS_INVALID_MOB_NO",
              errorStyle: { width: "100%", color: "red" },
              label: "CORE_COMMON_EMAILS",
              className: "email-address",
              validation: {
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                required: true,
              },
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
    ],
    head: " ",
  },
  {
    body: [
      {
        key: "addressDetails",
        type: "component",
        error: "CORE_REQUIRED_FIELD_ERROR",
        formType: "Witness",
        required: false,
        component: "SelectComponentsMulti",
        populators: {
          inputs: [
            {
              name: "pincode",
              type: "text",
              label: "PINCODE",
              validation: {
                max: "9999999",
                title: "",
                errMsg: "ADDRESS_PINCODE_INVALID",
                pattern: "[0-9]+",
                maxlength: 7,
                minlength: 6,
                isRequired: true,
                patternType: "Pincode",
              },
              isMandatory: true,
            },
            {
              name: "state",
              type: "text",
              label: "STATE",
              validation: {
                isRequired: true,
              },
              isMandatory: true,
            },
            {
              name: "district",
              type: "text",
              label: "DISTRICT",
              validation: {
                isRequired: true,
              },
              isMandatory: true,
            },
            {
              name: "city",
              type: "text",
              label: "CITY/TOWN",
              validation: {
                isRequired: true,
              },
              isMandatory: true,
            },
          ],
          validation: {},
        },
        withoutLabel: true,
      },
    ],
  },
  {
    body: [
      {
        key: "witnessAdditionalDetails",
        type: "component",
        label: "CS_TEXTAREA_WITNESS_ADDITIONAL_DETAIL",
        component: "SelectCustomTextArea",
        populators: {
          inputs: [
            {
              name: "text",
              type: "TextAreaComponent",
              isOptional: true,
              placeholder: "CS_TEXTAREA_PLACEHOLDER_ADDITIONAL_DETAIL",
              textAreaSubHeader: "CS_TEXTAREA_WITNESS_ADDITIONAL_DETAIL",
              subHeaderClassName: "dristi-font-bold",
            },
          ],
        },
        withoutLabel: true,
      },
    ],
  },
];

export default createWitnessConfig;
