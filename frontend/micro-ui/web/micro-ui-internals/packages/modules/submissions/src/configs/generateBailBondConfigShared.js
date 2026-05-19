/** Shared surety field definitions for generateBailBondConfig.js */

const bailBondNameValidation = {
  isRequired: true,
  pattern: /^[^{0-9}^\$\"<>?\\\\~!@#$%^()+={}\[\]*,/_:;“”‘’]{1,50}$/i,
  errMsg: "CORE_COMMON_APPLICANT_NAME_INVALID",
  minLength: 1,
};

export const bailBondSuretyPopulatorInputs = [
  {
    label: "FULL_NAME",
    isMandatory: true,
    key: "name",
    type: "text",
    name: "name",
    placeholder: "Ex: Raj Kumar Singh",
    validation: bailBondNameValidation,
  },
  {
    label: "FATHER_NAME",
    isMandatory: true,
    key: "fatherName",
    type: "text",
    name: "fatherName",
    placeholder: "Ex: Raj Kumar Singh",
    validation: bailBondNameValidation,
  },
  {
    name: "mobileNumber",
    key: "mobileNumber",
    type: "text",
    error: "ERR_HRMS_INVALID_MOB_NO",
    label: "PARTY_PHONE_NUMBER",
    placeholder: "Ex: 1234567890",
    validation: {
      pattern: "^[6-9][0-9]{0,9}$",
      isNumber: true,
      isRequired: true,
      maxLength: 10,
      minLength: 10,
    },
    isMandatory: true,
    componentInFront: "+91",
  },
  {
    type: "infoBox",
    name: "infoBox",
    showTooltip: true,
    infoHeader: "CS_PLEASE_COMMON_NOTE",
    infoText: "BAIL_BOND_NOTE",
  },
  {
    name: "email",
    key: "email",
    type: "text",
    error: "ERR_HRMS_INVALID_MOB_NO",
    label: "E-Mail Address",
    isMandatory: false,
    isOptional: true,
    validation: {
      isRequired: false,
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/,
      errMsg: "PLEASE_ENTER_VALID_EMAIL",
    },
  },
];

export const bailBondSuretyAddressInput = {
  key: "address",
  type: "component",
  label: "ADDRESS",
  component: "AddressBailBond",
  isMandatory: true,
  populators: {
    inputs: [
      {
        name: "locality",
        type: "text",
        label: "ADDRESS_LINE_1",
        validation: {
          errMsg: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
          maxlength: 256,
          minlength: 2,
          isRequired: true,
        },
        isMandatory: true,
        isFormatRequired: true,
        inputFieldClassName: "user-details-form-style",
      },
      {
        name: "city",
        type: "text",
        label: "CITY/TOWN",
        validation: {
          title: "",
          errMsg: "CORE_COMMON_APPLICANT_CITY_INVALID",
          isRequired: true,
          patternType: "Name",
        },
        isMandatory: true,
        inputFieldClassName: "user-details-form-style",
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
        name: "district",
        type: "text",
        label: "DISTRICT",
        validation: {
          title: "",
          errMsg: "CORE_COMMON_APPLICANT_DISTRICT_INVALID",
          isRequired: true,
          patternType: "Name",
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
          isRequired: true,
          patternType: "Name",
        },
        isMandatory: true,
        inputFieldClassName: "user-details-form-style",
      },
    ],
    validation: {},
  },
  withoutLabel: true,
};

const bailBondUploadLabelStyle = {
  fontSize: "16px",
  fontWeight: 400,
  marginBottom: "8px",
};

export const buildBailBondSuretyUploadInput = (key, documentHeader, isMandatory, isOptional) => ({
  type: "component",
  key,
  component: "SelectMultiUpload",
  disable: false,
  populators: {
    inputs: [
      {
        name: "document",
        isMandatory,
        ...(isOptional ? { isOptional } : {}),
        documentHeader,
        fileTypes: ["JPG", "PDF", "PNG", "JPEG"],
        uploadGuidelines: "UPLOAD_DOC_10",
        maxFileSize: 10,
        maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
        isMultipleUpload: true,
        labelStyle: bailBondUploadLabelStyle,
        ...(isOptional
          ? {
              documentOptionalStyle: {
                marginBottom: "8px",
              },
            }
          : {}),
      },
    ],
  },
});
