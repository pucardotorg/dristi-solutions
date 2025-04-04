import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import { PrivateRoute } from "@egovernments/digit-ui-react-components";
import EditProfile from "./EditProfile";
import AdmittedCases from "../../employee/AdmittedCases/AdmittedCase";

const ViewCase = () => {
  const { path } = useRouteMatch();
  
  return (
    <Switch>
      <PrivateRoute path={`${path}/edit-profile`} component={EditProfile} />
      <PrivateRoute exact path={path}>
        <AdmittedCases isJudge={false} />
      </PrivateRoute>
    </Switch>
  );
};

export default ViewCase;
