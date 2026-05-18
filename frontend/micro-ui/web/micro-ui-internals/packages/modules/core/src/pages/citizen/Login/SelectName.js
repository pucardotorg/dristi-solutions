import { FormStep } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React from "react";

const SelectName = ({ config, onSelect, t, isDisabled }) => {
  return <FormStep config={config} onSelect={onSelect} t={t} isDisabled={isDisabled} />;
};

SelectName.propTypes = {
  config: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
};

export default SelectName;
