/** Shared party form field definitions (FileCase + view-case edit). Preserve validation/CSS classes exactly. */

export const verificationDisableConfigFields = [
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
];

const userNamePatternValidation = {
  title: "",
  pattern: {
    message: "CORE_COMMON_APPLICANT_NAME_INVALID",
    masterName: "commonUiConfig",
    moduleName: "patternValidation",
    patternType: "userName",
  },
  patternType: "Name",
};

const optionalUserNameValidation = {
  title: "",
  pattern: {
    message: "CORE_COMMON_APPLICANT_NAME_INVALID",
    masterName: "commonUiConfig",
    moduleName: "patternValidation",
    patternType: "userName",
  },
  patternType: "Name",
};

export const buildPartyFirstNameField = (populatorName) => ({
  type: "text",
  label: "FIRST_NAME",
  populators: {
    name: populatorName,
    error: "FIRST_LAST_NAME_MANDATORY_MESSAGE",
    validation: {
      ...userNamePatternValidation,
      minLength: 1,
    },
  },
  isMandatory: true,
});

export const buildPartyMiddleNameField = (populatorName) => ({
  type: "text",
  label: "MIDDLE_NAME",
  populators: {
    name: populatorName,
    validation: optionalUserNameValidation,
  },
  isMandatory: false,
  labelChildren: "optional",
});

export const buildPartyLastNameField = (populatorName) => ({
  type: "text",
  label: "LAST_NAME",
  populators: {
    name: populatorName,
    validation: optionalUserNameValidation,
  },
  isMandatory: false,
  labelChildren: "optional",
});

/** Complainant / entity name fields (firstName, middleName, lastName). */
export const complainantStandardNameFields = [
  buildPartyFirstNameField("firstName"),
  buildPartyMiddleNameField("middleName"),
  buildPartyLastNameField("lastName"),
];

const respondentNameFieldsOnly = [
  buildPartyFirstNameField("respondentFirstName"),
  buildPartyMiddleNameField("respondentMiddleName"),
  buildPartyLastNameField("respondentLastName"),
];

/** Respondent name fields (FileCase respondentConfig). */
export const respondentStandardNameFields = [
  ...respondentNameFieldsOnly,
  {
    type: "text",
    label: "AGE",
    populators: {
      name: "respondentAge",
      validation: {
        maxLength: 3,
        patternType: "Number",
      },
    },
    isMandatory: false,
    labelChildren: "optional",
  },
];

/** Respondent name fields (view-case editRespondent — AGE validation differs). */
export const respondentEditNameFields = [
  ...respondentNameFieldsOnly,
  {
    type: "text",
    label: "AGE",
    populators: {
      name: "respondentAge",
      validation: {
        maxLength: 3,
        minLength: 2,
        pattern: "[0-9]+",
        patternType: "Number",
      },
    },
    isMandatory: false,
    labelChildren: "optional",
  },
];

/** Pincode → locality inputs for FileCase permanent address (user-details-form-style). */
export const fileCaseAddressLineInputs = [
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
];

export const fileCaseAddressMatchIdNote = {
  key: "personalDetailsNote",
  type: "component",
  styles: {
    marginBottom: "20px",
  },
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
};

export const editProfileTypeOfAddressInput = {
  name: "typeOfAddress",
  type: "Radio",
  label: "CS_TYPE_OF_ADDRESS",
  options: [],
  showOptional: true,
};
