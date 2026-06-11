import { CheckBox, FormStep } from "@egovernments/digit-ui-react-components";
import React from "react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const SelectMobileNumber = ({
  t,
  onSelect,
  mobileNumber,
  onMobileChange,
  config,
  canSubmit,
  handleRememberMeChange,
  isRememberMe,
}) => {
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  if (isUserLoggedIn) {
    history.push(`/${window.contextPath}/citizen/dristi/home`);
  }
  return (
    <FormStep
      isDisabled={!(mobileNumber.length === 10 && canSubmit)}
      onSelect={onSelect}
      config={config}
      t={t}
      componentInFront="+91"
      onChange={onMobileChange}
      value={mobileNumber}
      cardStyle={{ minWidth: "100%" }}
    >
      <CheckBox
        onChange={handleRememberMeChange}
        checked={isRememberMe}
        label={"Remember me"}
        name={"Checkbox"}
        styles={{ alignItems: "center", textAlign: "center" }}
      />
    </FormStep>
  );
};

SelectMobileNumber.propTypes = {
  t: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  mobileNumber: PropTypes.string,
  onMobileChange: PropTypes.func.isRequired,
  config: PropTypes.object,
  canSubmit: PropTypes.bool,
  handleRememberMeChange: PropTypes.func,
  isRememberMe: PropTypes.bool,
};

export default SelectMobileNumber;
