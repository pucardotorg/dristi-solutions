const editRespondentFormconfig = [
  {
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
  },
  {
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
  },
  {
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
          inputs: [
            {
              name: "document",
              type: "DragDropComponent",
              fileTypes: ["JPG", "JPEG", "PDF", "PNG"],
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
      respondentType: ["showCompanyDetails"],
    },
  },
  {
    body: [
      {
        type: "text",
        label: "FIRST_NAME",
        populators: {
          name: "respondentFirstName",
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
          name: "respondentMiddleName",
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
          name: "respondentLastName",
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
    ],
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
  },
  {
    body: [
      {
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
      },
    ],
    dependentKey: {
      respondentType: ["commonFields"],
    },
  },
  {
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
      },
    ],
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
      },
    ],
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
  },
  {
    body: [
      {
        key: "addressDetails",
        type: "component",
        error: "CORE_REQUIRED_FIELD_ERROR",
        required: false,
        component: "SelectComponentsMulti",
        isProfileEditing: true,
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
            {
              name: "locality",
              type: "text",
              label: "ADDRESS",
              validation: {
                isRequired: true,
              },
              isMandatory: true,
            },
          ],
          validation: {},
        },
        isMandatory: true,
        withoutLabel: true,
        geoLocationConfig: {
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
          policeStationDropdown: {
            name: "policeStation",
            type: "dropdown",
            label: "SELECT_POLICE_STATION",
            header: "POLICE_STATION_HEADER",
            optionsKey: "code",
          },
          juridictionRadioButton: {
            name: "jurisdictionKnown",
            type: "Radio",
            label: "KNOW_JURISDICTION_BELONGS_TO",
            options: [
              {
                code: "YES",
                name: "ES_COMMON_YES",
              },
              {
                code: "NO",
                name: "NO",
              },
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
        },
        isPoliceStationComponent: true,
      },
    ],
    dependentKey: {
      respondentType: ["commonFields"],
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

export const editRespondentConfig = {
  formconfig: editRespondentFormconfig,
  header: "CS_RESPONDENT_DETAIL_HEADING",
  subtext: "CS_RESPONDENT_DETAIL_SUBTEXT",
  isOptional: false,
  addFormText: "ADD_RESPONDENT",
  formItemName: "CS_RESPONDENT",
  className: "respondent-edit",
};
