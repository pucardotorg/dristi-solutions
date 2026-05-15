import {
  witnessAddressDetailsField,
  witnessEmailFormStep,
  witnessPhoneFormStep,
} from "../../../../configs/shared/partyFormFieldsShared";

const witnessFormConfig = [
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
  witnessPhoneFormStep,
  witnessEmailFormStep,
  {
    body: [witnessAddressDetailsField],
  },
  {
    body: [
      {
        key: "witnessAdditionalDetails",
        type: "component",
        component: "SelectCustomTextArea",
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              type: "TextAreaComponent",
              isOptional: true,
              textAreaSubHeader: "CS_TEXTAREA_WITNESS_ADDITIONAL_DETAIL",
            },
          ],
        },
      },
    ],
  },
];

export const witnessConfig = {
  formconfig: witnessFormConfig,
  header: "CS_WITNESS_DETAIL_HEADING",
  subtext: "CS_WITNESS_DETAIL_SUBTEXT",
  isOptional: false,
  addFormText: "ADD_WITNESS",
  formItemName: "CS_WITNESS",
  className: "witness-details",
  showOptionalInHeader: true,
};
