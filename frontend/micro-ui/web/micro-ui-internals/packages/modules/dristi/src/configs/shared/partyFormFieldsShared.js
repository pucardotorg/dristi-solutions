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

export const respondentTypeFormStep = {
  body: [
    {
      key: "respondentType",
      type: "radio",
      populators: {
        type: "radioButton",
        error: "CORE_REQUIRED_FIELD_ERROR",
        label: "SELECT_RESPONDENT_TYPE",
        required: false,
        mdmsConfig: {
          select: "(data) => {return data['case'].ComplainantRespondentType?.map((item) => {return item;});}",
          masterName: "ComplainantRespondentType",
          moduleName: "case",
        },
        optionsKey: "code",
        isDependent: true,
        isMandatory: true,
      },
      isMandatory: true,
      withoutLabel: true,
    },
  ],
  head: "CS_RESPONDENT_TYPE",
};

export const respondentEntityTypeFormStep = {
  body: [
    {
      key: "respondentTypeOfEntity",
      type: "dropdown",
      label: "TYPE_OF_ENTITY",
      populators: {
        name: "respondentTypeOfEntity",
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
    respondentType: ["showCompanyDetails"],
  },
};

const buildCompanyDocumentDragDropInput = (isEditProfile) => {
  const base = {
    name: "document",
    type: "DragDropComponent",
    isOptional: "CS_IS_OPTIONAL",
    documentHeader: "COMPANY_DOCUMENT_DETAILS",
    isMultipleUpload: true,
    documentHeaderStyle: {
      textAlign: "start",
    },
  };
  if (isEditProfile) {
    return {
      ...base,
      fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
      isMandatory: false,
      maxFileSize: 10,
      uploadGuidelines: "UPLOAD_DOC_10",
      maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
    };
  }
  return base;
};

export const buildRespondentCompanyDetailStep = (isEditProfile = false) => ({
  body: [
    {
      key: "respondentCompanyName",
      type: "text",
      label: "company_Name",
      populators: {
        name: "respondentCompanyName",
        title: "FIRST_TERMS_AND_CONDITIONS",
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
        inputs: [buildCompanyDocumentDragDropInput(isEditProfile)],
      },
      isMandatory: false,
      withoutLabel: true,
    },
  ],
  head: "CS_RESPONDENT_COMPANY_DETAIL",
  dependentKey: {
    respondentType: ["showCompanyDetails"],
  },
});

export const buildRespondentNameFormStep = (nameFields) => ({
  body: [...nameFields],
  head: "CS_RESPONDENT_NAME",
  updateLabel: {
    key: "head",
    value: "CS_COMMON_ENTITY_DETAIL",
  },
  defaultLabel: {
    key: "head",
    value: "CS_RESPONDENT_NAME",
  },
  dependentKey: {
    respondentType: ["commonFields"],
  },
  updateLabelOn: "respondentType.showCompanyDetails",
});

export const respondentDesignationFormStep = {
  body: [
    {
      type: "text",
      label: "DESIGNATION",
      populators: {
        name: "respondentDesignation",
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
    respondentType: ["showCompanyDetails"],
  },
};

export const respondentInquiryAffidavitUploadStep = {
  body: [
    {
      key: "inquiryAffidavitFileUpload",
      type: "component",
      label: "AFFIDAVIT_UNDER_SECTION_225_BNSS",
      component: "SelectCustomDragDrop",
      populators: {
        inputs: [
          {
            name: "document",
            type: "DragDropComponent",
            isOptional: "CS_IS_OPTIONAL",
            documentHeader: "AFFIDAVIT_UNDER_SECTION_225_BNSS",
            isMultipleUpload: true,
            infoTooltipMessage: "AFFIDAVIT_UNDER_SECTION_225_BNSS_TOOLTIP_MSG",
          },
        ],
      },
      withoutLabel: true,
    },
  ],
  dependentKey: {
    respondentType: ["commonFields"],
  },
};

export const editRespondentProfileChangeSteps = [
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
        key: "comments",
        withoutLabel: true,
        isMandatory: false,
        isInfinite: true,
        populators: {
          inputs: [
            {
              name: "text",
              textAreaSubHeader: "COMMENTS",
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
              errorStyle: {
                fontSize: "14px",
                fontWeight: 400,
                paddingTop: "20px",
                color: "#d4351c",
              },
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
              isOptional: "CS_IS_OPTIONAL",
              uploadGuidelines: "UPLOAD_DOC_10",
              maxFileSize: 10,
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

export const buildBulkPhoneFormStep = ({
  head,
  subHead,
  mobileInputClassName,
  useArrayValidation = false,
}) => ({
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
            label: "CORE_COMMON_PHONE_NUMBER",
            ...(mobileInputClassName ? { className: mobileInputClassName } : {}),
            validation: {
              ...(useArrayValidation ? { isArray: true } : {}),
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
    },
  ],
  head,
  ...(subHead ? { subHead } : {}),
});

export const buildBulkEmailFormStep = ({ head, emailInputClassName, useArrayValidation = false, maxLength = 150 }) => ({
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
            label: "CORE_COMMON_EMAILS",
            ...(emailInputClassName ? { className: emailInputClassName } : {}),
            validation: {
              ...(useArrayValidation ? { isArray: true } : {}),
              pattern: {
                masterName: "commonUiConfig",
                moduleName: "patternValidation",
                patternType: "email",
              },
              required: true,
              ...(maxLength ? { maxLength } : {}),
            },
            isMandatory: true,
          },
        ],
        validation: {},
      },
      withoutLabel: true,
    },
  ],
  head,
});

export const witnessPhoneFormStep = buildBulkPhoneFormStep({
  head: "CS_WITNESS_CONTACT_DETAILS",
  subHead: "CS_WITNESS_NOTE",
  mobileInputClassName: "mobile-number",
  useArrayValidation: false,
});

export const witnessEmailFormStep = buildBulkEmailFormStep({
  head: " ",
  emailInputClassName: "email-address",
  useArrayValidation: false,
  maxLength: undefined,
});

export const witnessAddressLineInputs = [
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
];

export const witnessAddressDetailsField = {
  key: "addressDetails",
  type: "component",
  error: "CORE_REQUIRED_FIELD_ERROR",
  formType: "Witness",
  required: false,
  component: "SelectComponentsMulti",
  populators: {
    inputs: witnessAddressLineInputs,
    validation: {},
  },
  withoutLabel: true,
};

const complainantTypePopulators = {
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
};

export const fileCaseComplainantTypeFormStep = {
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
      populators: complainantTypePopulators,
      isMandatory: true,
      withoutLabel: true,
      resetFormData: true,
      noteDependentOn: "complainantVerification.individualDetails",
    },
  ],
};

export const editComplainantTypeFormStep = {
  body: [
    {
      key: "complainantType",
      head: "SELECT_COMPLAINANT_TYPE",
      name: "complainantType",
      type: "component",
      component: "CustomRadioInfoComponent",
      populators: complainantTypePopulators,
      isMandatory: true,
      withoutLabel: true,
      resetFormData: true,
      noteDependentOn: "complainantVerification.individualDetails",
      isProfileEdit: true,
    },
  ],
};

export const complainantEntityTypeFormStep = {
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
};

export const complainantVerificationFormStep = {
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
      disableConfigFields: verificationDisableConfigFields,
      isVerifiedOtpDisabledKey: "isDuplicateNumber",
    },
  ],
  dependentKey: {
    complainantType: ["commonFields"],
  },
};

export const complainantIdFormStep = {
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
};

const fileCaseComplainantAgeField = {
  type: "text",
  label: "AGE",
  populators: {
    name: "complainantAge",
    error: "AGE_VALIDATION",
    validation: {
      maxLength: 3,
      patternType: "Number",
    },
  },
  isMandatory: true,
};

const editComplainantAgeField = {
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
};

export const buildComplainantNameAgeFormStep = (ageField) => ({
  body: [...complainantStandardNameFields, ageField],
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
});

export const fileCaseComplainantNameAgeFormStep = buildComplainantNameAgeFormStep(fileCaseComplainantAgeField);
export const editComplainantNameAgeFormStep = buildComplainantNameAgeFormStep(editComplainantAgeField);

export const complainantDesignationFormStep = {
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
};

export const buildComplainantCompanyDetailStep = (isEditProfile = false) => ({
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
        inputs: [buildCompanyDocumentDragDropInput(isEditProfile)],
      },
      isMandatory: false,
      withoutLabel: true,
    },
  ],
  head: "CS_RESPONDENT_COMPANY_DETAIL",
  dependentKey: {
    complainantType: ["showCompanyDetails"],
  },
});

export const fileCaseComplainantAddressFormStep = {
  body: [
    {
      key: "addressDetails",
      type: "component",
      label: "PERMANENT_ADDRESS",
      notes: fileCaseAddressMatchIdNote,
      addUUID: true,
      component: "SelectComponents",
      populators: {
        inputs: fileCaseAddressLineInputs,
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
        inputs: fileCaseCurrentResidentialAddressInputs,
        validation: {},
      },
      withoutLabel: true,
    },
  ],
  head: "COMPLAINANT_ADDRESS",
  dependentKey: {
    complainantType: ["complainantLocation"],
  },
};

export const editComplainantAddressFormStep = {
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
        inputs: [editProfileTypeOfAddressInput, ...fileCaseAddressLineInputs],
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
        inputs: fileCaseCurrentResidentialAddressInputs,
        validation: {},
      },
      withoutLabel: true,
    },
  ],
  head: "CS_COMPLAINANT_LOCATION",
  dependentKey: {
    complainantType: ["complainantLocation"],
  },
};

export const fileCaseComplainantCompanyAddressFormStep = {
  body: [
    {
      key: "addressCompanyDetails",
      type: "component",
      addUUID: true,
      component: "SelectComponents",
      populators: {
        inputs: fileCaseCompanyAddressLineInputs,
        validation: {},
      },
      withoutLabel: true,
    },
  ],
  head: "CS_COMPANY_LOCATION",
  dependentKey: {
    complainantType: ["showCompanyDetails"],
  },
};

export const editComplainantCompanyAddressFormStep = {
  body: [
    {
      key: "addressCompanyDetails",
      type: "component",
      addUUID: true,
      component: "SelectComponents",
      populators: {
        inputs: [editProfileTypeOfAddressInput, ...fileCaseCompanyAddressLineInputs],
        validation: {},
      },
      withoutLabel: true,
    },
  ],
  head: "CS_COMPANY_LOCATION",
  dependentKey: {
    complainantType: ["showCompanyDetails"],
  },
};

export const editComplainantProfileChangeSteps = [
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
