import {
  buildComplainantCompanyDetailStep,
  complainantEntityTypeFormStep,
  complainantIdFormStep,
  complainantVerificationFormStep,
  complainantDesignationFormStep,
  editComplainantAddressFormStep,
  editComplainantCompanyAddressFormStep,
  editComplainantNameAgeFormStep,
  editComplainantProfileChangeSteps,
  editComplainantTypeFormStep,
} from "../../../../configs/shared/partyFormFieldsShared";

const editComplainantDetailsFormConfig = [
  editComplainantTypeFormStep,
  complainantEntityTypeFormStep,
  complainantVerificationFormStep,
  complainantIdFormStep,
  editComplainantNameAgeFormStep,
  complainantDesignationFormStep,
  buildComplainantCompanyDetailStep(true),
  editComplainantAddressFormStep,
  editComplainantCompanyAddressFormStep,
  ...editComplainantProfileChangeSteps,
];

export const editComplainantDetailsConfig = {
  formconfig: editComplainantDetailsFormConfig,
  header: "CS_COMPLAINT_DETAIL_HEADING",
  subtext: "CS_COMPLAINANT_DETAIL_SUBTEXT",
  isOptional: false,
  className: "complainant-edit",
};
