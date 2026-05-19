import {
  buildRespondentAddressDetailsField,
  buildRespondentCompanyDetailStep,
  buildRespondentNameFormStep,
  respondentFileCaseGeoLocationConfig,
  respondentEmailFormStep,
  respondentInquiryAffidavitUploadStep,
  respondentDesignationFormStep,
  respondentEntityTypeFormStep,
  respondentPersonalDetailsNoteStep,
  respondentPhoneFormStep,
  respondentStandardNameFields,
  respondentTypeFormStep,
} from "../../../../configs/shared/partyFormFieldsShared";

const respondentFromconfig = [
  respondentTypeFormStep,
  respondentEntityTypeFormStep,
  buildRespondentCompanyDetailStep(false),
  buildRespondentNameFormStep(respondentStandardNameFields),
  respondentPersonalDetailsNoteStep,
  respondentDesignationFormStep,
  respondentPhoneFormStep,
  respondentEmailFormStep,
  {
    body: [buildRespondentAddressDetailsField(respondentFileCaseGeoLocationConfig)],
    dependentKey: {
      respondentType: ["commonFields"],
    },
  },
  respondentInquiryAffidavitUploadStep,
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
