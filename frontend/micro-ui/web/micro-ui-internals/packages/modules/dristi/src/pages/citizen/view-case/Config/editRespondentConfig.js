import {
  buildRespondentAddressDetailsField,
  buildRespondentCompanyDetailStep,
  buildRespondentNameFormStep,
  editRespondentProfileChangeSteps,
  respondentEditGeoLocationConfig,
  respondentEditMultiAddressLineInputs,
  respondentEditNameFields,
  respondentEmailFormStep,
  respondentDesignationFormStep,
  respondentEntityTypeFormStep,
  respondentPersonalDetailsNoteStep,
  respondentPhoneFormStep,
  respondentTypeFormStep,
} from "../../../../configs/shared/partyFormFieldsShared";

const editRespondentFormconfig = [
  respondentTypeFormStep,
  respondentEntityTypeFormStep,
  buildRespondentCompanyDetailStep(true),
  buildRespondentNameFormStep(respondentEditNameFields),
  respondentPersonalDetailsNoteStep,
  respondentDesignationFormStep,
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
  ...editRespondentProfileChangeSteps,
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
