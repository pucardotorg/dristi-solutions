import PropTypes from "prop-types";
import React from "react";
import { AppModules } from "../../../components/AppModules";

/** Alternate citizen entry reused by legacy routes; forwards to shared module mounting. */
const CitizenAllServices = ({ stateCode, modules, appTenants }) => {
  return <AppModules stateCode={stateCode} userType="citizen" modules={modules} appTenants={appTenants} />;
};

CitizenAllServices.propTypes = {
  stateCode: PropTypes.string,
  modules: PropTypes.arrayOf(PropTypes.any),
  appTenants: PropTypes.arrayOf(PropTypes.any),
};

export default CitizenAllServices;
