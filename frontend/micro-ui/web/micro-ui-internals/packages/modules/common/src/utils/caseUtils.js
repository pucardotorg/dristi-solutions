export const getAllAssignees = (caseDetails, getAdvocates = true, getLitigent = true) => {
  const representatives = caseDetails?.representatives;
  if (representatives?.length > 0) {
    return representatives
      ?.reduce((res, curr) => {
        if (getAdvocates && curr?.additionalDetails?.uuid) {
          res.push(curr?.additionalDetails?.uuid);
        }
        const representing = curr?.representing;
        if (getLitigent && representing?.length > 0) {
          const representingUuids = representing?.reduce((result, current) => {
            if (current?.additionalDetails?.uuid) {
              result.push(current?.additionalDetails?.uuid);
            }
            return result;
          }, []);
          res.push(representingUuids);
        }
        return res;
      }, [])
      ?.flat();
  }

  const litigants = caseDetails?.litigants;
  if (litigants?.length > 0) {
    return litigants
      ?.reduce((res, curr) => {
        if (curr?.additionalDetails?.uuid) {
          res.push(curr?.additionalDetails?.uuid);
        }
        return res;
      }, [])
      ?.flat();
  }
  return null;
};

export const getAdvocates = (caseDetails) => {
  let litigants = {};
  let list = [];

  caseDetails?.litigants?.forEach((litigant) => {
    const poaHolder = (caseDetails?.poaHolders || [])
      ?.filter((holder) => holder?.representingLitigants?.some((lit) => lit?.individualId === litigant?.individualId))
      ?.map((holder) => holder?.additionalDetails?.uuid);

    list = caseDetails?.representatives
      ?.filter((item) => {
        return item?.representing?.some((lit) => lit?.individualId === litigant?.individualId) && item?.additionalDetails?.uuid;
      })
      .map((item) => item?.additionalDetails?.uuid);
    if (list?.length > 0) {
      litigants[litigant?.additionalDetails?.uuid] = list;
    } else {
      litigants[litigant?.additionalDetails?.uuid] = [litigant?.additionalDetails?.uuid, ...(poaHolder?.length > 0 ? poaHolder : [])];
    }
  });
  return litigants;
};
