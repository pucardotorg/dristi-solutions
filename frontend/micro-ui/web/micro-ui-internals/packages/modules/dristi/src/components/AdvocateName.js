import React from "react";

export const AdvocateName = ({ value = "" }) => {
  return (
    <div>
      <p data-tip data-for={`hearing-list`}>
        {value?.complainant?.length > 0 &&
          `${value?.complainant?.[0]}(C)${
            value?.complainant?.length === 2 ? " + 1 Other" : value?.complainant?.length > 2 ? ` + ${value?.complainant?.length - 1} others` : ""
          }`}
      </p>
      <p data-tip data-for={`hearing-list`}>
        {value?.accused?.length > 0 &&
          `${value?.accused?.[0]}(A)${
            value?.accused?.length === 2 ? " + 1 Other" : value?.accused?.length > 2 ? ` + ${value?.accused?.length - 1} others` : ""
          }`}
      </p>
    </div>
  );
};
