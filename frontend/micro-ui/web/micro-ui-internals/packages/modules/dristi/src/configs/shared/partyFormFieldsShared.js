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

export const fileCaseIsCurrAddrSameRadioInput = {
  name: "isCurrAddrSame",
  type: "Radio",
  label: "IS_CURRENT_ADDRESS_SAME",
  options: [
    { code: "YES", name: "YES" },
    { code: "NO", name: "NO" },
  ],
  required: true,
  optionsKey: "code",
  isMandatory: true,
};

/** Current residential address inputs (radio + permanent address lines). */
export const fileCaseCurrentResidentialAddressInputs = [
  fileCaseIsCurrAddrSameRadioInput,
  ...fileCaseAddressLineInputs,
];

/** Company address lines (enabled fields for entity flow). */
export const fileCaseCompanyAddressLineInputs = fileCaseAddressLineInputs.map((input) => ({
  ...input,
  shouldBeEnabled: true,
}));

export const respondentPersonalDetailsNoteField = {
  key: "personalDetailsNote",
  type: "component",
  component: "SelectCustomNote",
  populators: {
    inputs: [
      {
        type: "InfoComponent",
        infoText: "CS_NOTETEXT_RESPONDENT_PERSONAL_DETAILS",
        infoHeader: "CS_COMMON_NOTE",
        infoTooltipMessage: "CS_NOTETOOLTIP_RESPONDENT_PERSONAL_DETAILS",
      },
    ],
  },
  withoutLabel: true,
};

export const respondentPhoneNumbersField = {
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
        label: "CORE_COMMON_PHONE_NUMBER",
        validation: {
          isArray: true,
          pattern: {
            masterName: "commonUiConfig",
            moduleName: "patternValidation",
            patternType: "contact",
          },
          isNumber: true,
          required: true,
          maxLength: 10,
          minLength: 10,
        },
        isMandatory: true,
        componentInFront: "+91",
      },
    ],
    validation: {},
  },
  withoutLabel: true,
};

export const respondentEmailsField = {
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
        label: "CORE_COMMON_EMAILS",
        validation: {
          isArray: true,
          pattern: {
            masterName: "commonUiConfig",
            moduleName: "patternValidation",
            patternType: "email",
          },
          required: true,
          maxLength: 150,
        },
        isMandatory: true,
      },
    ],
    validation: {},
  },
  withoutLabel: true,
};

const respondentAddressPincodeInput = {
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
};

export const respondentFileCaseMultiAddressLineInputs = [
  editProfileTypeOfAddressInput,
  respondentAddressPincodeInput,
  {
    name: "state",
    type: "text",
    label: "STATE",
    validation: {
      isRequired: true,
      patternType: "Name",
    },
    isMandatory: true,
  },
  {
    name: "district",
    type: "text",
    label: "DISTRICT",
    validation: {
      isRequired: true,
      patternType: "Name",
    },
    isMandatory: true,
  },
  {
    name: "city",
    type: "text",
    label: "CITY/TOWN",
    validation: {
      isRequired: true,
      patternType: "Name",
    },
    isMandatory: true,
  },
  {
    name: "locality",
    type: "text",
    label: "ADDRESS",
    validation: {
      pattern: {
        masterName: "commonUiConfig",
        moduleName: "patternValidation",
        patternType: "address",
      },
      isRequired: true,
    },
    isMandatory: true,
  },
];

export const respondentEditMultiAddressLineInputs = [
  editProfileTypeOfAddressInput,
  respondentAddressPincodeInput,
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
  {
    name: "locality",
    type: "text",
    label: "ADDRESS",
    validation: {
      isRequired: true,
    },
    isMandatory: true,
  },
];

const respondentGeoLocationConfigBase = {
  key: "geoLocationDetails",
  latitudeInput: {
    name: "latitude",
    type: "text",
    label: "LATITUDE",
    disabled: true,
    validation: {
      required: true,
      precision: 15,
      lowerBound: 8.4,
      upperBound: 37.6,
      errorMessage: "LATITUDE_ERROR_MESSAGE",
    },
  },
  longitudeInput: {
    name: "longitude",
    type: "text",
    label: "LONGITUDE",
    disabled: true,
    validation: {
      required: true,
      precision: 15,
      lowerBound: 68.7,
      upperBound: 97.25,
      errorMessage: "LONGITUDE_ERROR_MESSAGE",
    },
  },
  juridictionRadioButton: {
    name: "jurisdictionKnown",
    type: "Radio",
    label: "KNOW_JURISDICTION_BELONGS_TO",
    options: [
      { code: "YES", name: "ES_COMMON_YES" },
      { code: "NO", name: "NO" },
    ],
    validation: {
      required: true,
      errorMessage: "This field is required.",
    },
    defaultValue: {
      code: "YES",
      name: "ES_COMMON_YES",
    },
  },
};

export const respondentFileCaseGeoLocationConfig = {
  ...respondentGeoLocationConfigBase,
  policeStationDropdown: {
    name: "policeStation",
    type: "dropdown",
    label: "SELECT_POLICE_STATION",
    header: "POLICE_STATION_HEADER",
    optionsKey: "name",
  },
};

export const respondentEditGeoLocationConfig = {
  ...respondentGeoLocationConfigBase,
  policeStationDropdown: {
    name: "policeStation",
    type: "dropdown",
    label: "SELECT_POLICE_STATION",
    header: "POLICE_STATION_HEADER",
    optionsKey: "code",
  },
};

export const buildRespondentAddressDetailsField = (
  geoLocationConfig,
  { isProfileEditing = false, addressInputs = respondentFileCaseMultiAddressLineInputs } = {}
) => ({
  key: "addressDetails",
  type: "component",
  error: "CORE_REQUIRED_FIELD_ERROR",
  required: false,
  component: "SelectComponentsMulti",
  ...(isProfileEditing ? { isProfileEditing: true } : {}),
  populators: {
    inputs: addressInputs,
    validation: {},
  },
  isMandatory: true,
  withoutLabel: true,
  geoLocationConfig,
  isPoliceStationComponent: true,
});

export const respondentPhoneFormStep = {
  body: [respondentPhoneNumbersField],
  head: "CS_RESPONDENT_PHONE",
  updateLabel: {
    key: "head",
    value: "CS_REPRESENTATIVE_PHONE",
  },
  defaultLabel: {
    key: "head",
    value: "CS_RESPONDENT_PHONE",
  },
  dependentKey: {
    respondentType: ["commonFields"],
  },
  updateLabelOn: "respondentType.showCompanyDetails",
};

export const respondentEmailFormStep = {
  body: [respondentEmailsField],
  head: "CS_RESPONDENT_EMAIL",
  updateLabel: {
    key: "head",
    value: "CS_REPRESENTATIVE_EMAIL",
  },
  defaultLabel: {
    key: "head",
    value: "CS_RESPONDENT_EMAIL",
  },
  dependentKey: {
    respondentType: ["commonFields"],
  },
  updateLabelOn: "respondentType.showCompanyDetails",
};

export const respondentPersonalDetailsNoteStep = {
  body: [respondentPersonalDetailsNoteField],
  dependentKey: {
    respondentType: ["commonFields"],
  },
};
