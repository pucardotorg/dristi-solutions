import { Button, Header } from "@egovernments/digit-ui-react-components";
import { InboxSearchComposer } from "@egovernments/digit-ui-module-core";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
