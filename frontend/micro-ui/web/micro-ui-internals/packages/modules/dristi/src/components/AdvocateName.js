import React from "react";
import PropTypes from "prop-types";

const getSuffix = (arr) => {
  if (arr?.length === 2) return " + 1 Other";
  if (arr?.length > 2) return ` + ${arr.length - 1} others`;
  return "";
};

export const AdvocateName = ({ value = "" }) => {
  return (
    <div>
      <p data-tip data-for={`hearing-list`}>
        {value?.complainant?.length > 0 && `${value?.complainant?.[0]}(C)${getSuffix(value?.complainant)}`}
      </p>
      <p data-tip data-for={`hearing-list`}>
        {value?.accused?.length > 0 && `${value?.accused?.[0]}(A)${getSuffix(value?.accused)}`}
      </p>
    </div>
  );
};

AdvocateName.propTypes = {
  value: PropTypes.shape({
    complainant: PropTypes.arrayOf(PropTypes.string),
    accused: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default AdvocateName;
