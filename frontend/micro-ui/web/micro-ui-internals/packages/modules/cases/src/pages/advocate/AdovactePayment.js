import { Button } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useHistory } from "react-router-dom";

const AdvocatePayment = () => {
  const history = useHistory();
  const handleNavigate = (path) => {
    const contextPath = window?.contextPath || "";
    history.push(`/${contextPath}${path}`);
  };

  /* Placeholder screen until payment APIs are wired. */

  return (
    <div>
      Payment Description Page
      <Button label={"Make payment"} onButtonClick={() => handleNavigate("/employee/cases/advocate-join-case")}></Button>
    </div>
  );
};
export default AdvocatePayment;
