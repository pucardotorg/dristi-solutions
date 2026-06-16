import { AppContainer } from "@egovernments/digit-ui-react-components";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom/cjs/react-router-dom.min";
import CaseType from "./CaseType";
import EFilingCases from "./EFilingCases";
import EFilingPayment from "./EFilingPayment";
import EFilingPaymentResponse from "./EFilingPaymentResponse";
import ComplainantSignature from "./ComplainantSignature";

function FileCase({ t }) {
  const { path } = useRouteMatch();

  return (
    <div className="citizen-form-wrapper" style={{ minWidth: "100%" }}>
      <Switch>
        <AppContainer>
          <Route path={`${path}`} exact>
            <CaseType t={t} />
          </Route>
          <Route path={`${path}/case`}>
            <EFilingCases t={t} path={path} />
          </Route>
          <Route path={`${path}/e-filing-payment`}>
            <EFilingPayment t={t} path={path} />
          </Route>
          <Route path={`${path}/e-filing-payment-response`}>
            <EFilingPaymentResponse t={t} />
          </Route>
          <Route path={`${path}/sign-complaint`}>
            <ComplainantSignature path={path} />
          </Route>
        </AppContainer>
      </Switch>
    </div>
  );
}

export default FileCase;
