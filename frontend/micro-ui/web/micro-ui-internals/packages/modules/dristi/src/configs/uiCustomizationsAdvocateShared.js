import React from "react";
import { removeInvalidNameParts } from "../Utils";

const advocateSearchBaseRequest = () => ({
  url: "/advocate/v1/status/_search",
  params: { status: "ACTIVE", tenantId: window?.Digit.ULBService.getStateId(), offset: 0, limit: 1000 },
  body: {
    tenantId: window?.Digit.ULBService.getStateId(),
  },
});

const buildAdvocateIconRow = (adv) => (
  <span className="icon" style={{ display: "flex", justifyContent: "space-between" }}>
    <span className="icon">{adv?.barRegistrationNumber}</span>
    <span className="icon" style={{ justifyContent: "end" }}>
      {removeInvalidNameParts(adv?.additionalDetails?.username)}
    </span>
  </span>
);

export const mapAdvocateForBarRegistrationSearch = (adv) => ({
  icon: buildAdvocateIconRow(adv),
  barRegistrationNumber: `${adv?.barRegistrationNumber} (${removeInvalidNameParts(adv?.additionalDetails?.username)})`,
  advocateName: removeInvalidNameParts(adv?.additionalDetails?.username),
  advocateId: adv?.id,
  barRegistrationNumberOriginal: adv?.barRegistrationNumber,
  advocateUuid: adv?.auditDetails?.createdBy,
  individualId: adv?.individualId,
});

export const mapAdvocateForBarRegistrationJoinCase = (adv) => ({
  icon: buildAdvocateIconRow(adv),
  barRegistrationNumber: `${adv?.barRegistrationNumber}`,
  advocateName: removeInvalidNameParts(adv?.additionalDetails?.username),
  advocateId: adv?.id,
  barRegistrationNumberOriginal: adv?.barRegistrationNumber,
  data: adv,
});

export const buildAdvocateBarRegistrationGetNames = (mapAdvocate, { filterAdvocates } = {}) => ({
  getNames: (props) => {
    const removeOptions = props?.removeOptions ? props?.removeOptions : [];
    const removeOptionsKey = props?.removeOptionsKey || "";
    return {
      ...advocateSearchBaseRequest(),
      config: {
        select: (data) => {
          let advocates = data.advocates;
          if (filterAdvocates) {
            advocates = advocates.filter((adv) => !removeOptions?.includes(adv?.[removeOptionsKey]));
          }
          return advocates.map(mapAdvocate);
        },
      },
    };
  },
});
