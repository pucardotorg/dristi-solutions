import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import { PrivateRoute } from "@egovernments/digit-ui-react-components";
import EditProfile from "./EditProfile";
import AdmittedCaseJudge from "../../employee/AdmittedCases/AdmittedCaseJudge";

const ViewCase = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <PrivateRoute path={`${path}/edit-profile`} component={EditProfile} />
      <PrivateRoute exact path={path}>
        <AdmittedCaseJudge isJudge={false} />
      </PrivateRoute>
    </Switch>
  );
};

export default ViewCase;
