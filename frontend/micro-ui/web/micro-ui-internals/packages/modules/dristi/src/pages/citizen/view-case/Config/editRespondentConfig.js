import {
  buildRespondentAddressDetailsField,
  respondentEditGeoLocationConfig,
  respondentEditMultiAddressLineInputs,
  respondentEditNameFields,
  respondentEmailFormStep,
  respondentPersonalDetailsNoteStep,
  respondentPhoneFormStep,
} from "../../../../configs/shared/partyFormFieldsShared";

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
    body: [...respondentEditNameFields],
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
  respondentPersonalDetailsNoteStep,
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
  respondentPhoneFormStep,
  respondentEmailFormStep,
  {
    body: [
      buildRespondentAddressDetailsField(respondentEditGeoLocationConfig, {
        isProfileEditing: true,
        addressInputs: respondentEditMultiAddressLineInputs,
      }),
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

export const editRespondentConfig = {
  formconfig: editRespondentFormconfig,
  header: "CS_RESPONDENT_DETAIL_HEADING",
  subtext: "CS_RESPONDENT_DETAIL_SUBTEXT",
  isOptional: false,
  addFormText: "ADD_RESPONDENT",
  formItemName: "CS_RESPONDENT",
  className: "respondent-edit",
};
