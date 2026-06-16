export { getAllAssignees, getAdvocates } from "@egovernments/digit-ui-module-common";

export const getAdvocatesNames = (caseDetails) => {
  let litigants = {};
  let list = [];

  caseDetails?.litigants?.forEach((litigant) => {
    const poaHolder = (caseDetails?.poaHolders || [])
      ?.filter((holder) => holder?.representingLitigants?.some((lit) => lit?.individualId === litigant?.individualId))
      ?.map((holder) => holder?.additionalDetails?.advocateName);

    list = caseDetails?.representatives
      ?.filter((item) => {
        return item?.representing?.some((lit) => lit?.individualId === litigant?.individualId) && item?.additionalDetails?.uuid;
      })
      .map((item) => item?.additionalDetails?.advocateName);
    if (list?.length > 0) {
      litigants[litigant?.additionalDetails?.uuid] = list;
    } else {
      litigants[litigant?.additionalDetails?.uuid] = [litigant?.additionalDetails?.fullName, ...(poaHolder?.length > 0 ? poaHolder : [])];
    }
  });
  return litigants;
};

export const getuuidNameMap = (caseDetails) => {
  return caseDetails?.representatives?.reduce((acc, item) => {
    acc[item?.additionalDetails?.uuid] = item?.additionalDetails?.advocateName;
    item?.representing?.forEach((rep) => {
      acc[rep?.additionalDetails?.uuid] = rep?.additionalDetails?.fullName;
    });
    return acc;
  }, {});
};
