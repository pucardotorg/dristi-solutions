import {
  buildRespondentAddressDetailsField,
  respondentFileCaseGeoLocationConfig,
  respondentEmailFormStep,
  respondentPersonalDetailsNoteStep,
  respondentPhoneFormStep,
  respondentStandardNameFields,
} from "../../../../configs/shared/partyFormFieldsShared";

const respondentFromconfig = [
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
              isOptional: "CS_IS_OPTIONAL",
              documentHeader: "COMPANY_DOCUMENT_DETAILS",
              isMultipleUpload: true,
              documentHeaderStyle: {
                textAlign: "start",
              },
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
      ...respondentStandardNameFields,
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
    body: [buildRespondentAddressDetailsField(respondentFileCaseGeoLocationConfig)],
    dependentKey: {
      respondentType: ["commonFields"],
    },
  },
  {
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
  },
];

export const respondentconfig = {
  formconfig: respondentFromconfig,
  header: "CS_RESPONDENT_DETAIL_HEADING",
  subtext: "CS_COMPLAINT_DATA_ENTRY_INFO",
  isOptional: false,
  addFormText: "ADD_RESPONDENT",
  formItemName: "CS_RESPONDENT",
  className: "respondent",
};
