import { Link } from "react-router-dom";
import React from "react";

//create functions here based on module name set in mdms(eg->SearchProjectConfig)
//how to call these -> Digit?.Customizations?.[masterName]?.[moduleName]
// these functions will act as middlewares
const customColumnStyle = { whiteSpace: "nowrap" };

function formatWageseekerCellText(value, column, t) {
  if (!value) {
    return t("ES_COMMON_NA");
  }
  if (column.translate) {
    return t(column.prefix ? `${column.prefix}${value}` : value);
  }
  return value;
}

function renderMohallaCell(row, value, t) {
  if (!value) {
    return t("ES_COMMON_NA");
  }
  return <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getMohallaLocale(value, row?.tenantId)))}</span>;
}

function buildWageseekerMobileLink(row, tenantId) {
  if (row?.MASTERS_WAGESEEKER_ID == null) {
    return undefined;
  }
  return `/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${tenantId}&wageseekerId=${row.MASTERS_WAGESEEKER_ID}`;
}

/** Returns `true` when no deferred check is needed, otherwise a validator function used by inbox search composers. */
function dateAdditionalValidationPayload(data, keys) {
  const startKey = keys?.start;
  const endKey = keys?.end;
  if (!data?.[startKey] || !data?.[endKey]) {
    return true;
  }
  const start = data[startKey];
  const end = data[endKey];
  return () => new Date(start).getTime() <= new Date(end).getTime();
}

export const UICustomizations = {
  SearchCasesConfig: {
    customValidationCheck: (data) => {
      const { createdFrom, createdTo } = data;
      if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === "")) {
        return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };
      }
      return false;
    },
    preProcess: (data) => data,
    additionalCustomizations: (row, key, column, value, t, _searchResult) => {
      switch (key) {
        case "MASTERS_WAGESEEKER_ID":
          return (
            <span className="link">
              <Link to={`/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${row?.tenantId}&individualId=${value}`}>
                {String(formatWageseekerCellText(value, column, t))}
              </Link>
            </span>
          );

        case "MASTERS_SOCIAL_CATEGORY":
          return value ? <span style={customColumnStyle}>{String(t(`MASTERS_${value}`))}</span> : t("ES_COMMON_NA");

        case "CORE_COMMON_PROFILE_CITY":
          return value ? <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getCityLocale(value)))}</span> : t("ES_COMMON_NA");

        case "MASTERS_WARD":
        case "MASTERS_LOCALITY":
          return renderMohallaCell(row, value, t);
        default:
          return t("ES_COMMON_NA");
      }
    },
    MobileDetailsOnClick: (row, tenantId) => buildWageseekerMobileLink(row, tenantId),
    additionalValidations: (type, data, keys) => {
      if (type !== "date") {
        return true;
      }
      return dateAdditionalValidationPayload(data, keys);
    },
  },
  joinCaseSearchCasesConfig: {
    customValidationCheck: (data) => {
      const { createdFrom, createdTo } = data;
      if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === "")) {
        return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };
      }
      return false;
    },
    preProcess: (data) => data,
    additionalCustomizations: (row, key, column, value, t, _searchResult) => {
      switch (key) {
        case "MASTERS_WAGESEEKER_ID":
          return (
            <span className="link">
              <Link to={`/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${row?.tenantId}&individualId=${value}`}>
                {String(formatWageseekerCellText(value, column, t))}
              </Link>
            </span>
          );

        case "MASTERS_SOCIAL_CATEGORY":
          return value ? <span style={customColumnStyle}>{String(t(`MASTERS_${value}`))}</span> : t("ES_COMMON_NA");

        case "CORE_COMMON_PROFILE_CITY":
          return value ? <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getCityLocale(value)))}</span> : t("ES_COMMON_NA");

        case "MASTERS_WARD":
        case "MASTERS_LOCALITY":
          return renderMohallaCell(row, value, t);
        case "action": {
          return (
            <Link
              to={{
                pathname: `/${window.contextPath}/employee/cases/search-case`,
                state: row,
              }}
            >
              Proceed
            </Link>
          );
        }
        default:
          return t("ES_COMMON_NA");
      }
    },
    MobileDetailsOnClick: (row, tenantId) => buildWageseekerMobileLink(row, tenantId),
    additionalValidations: (type, data, keys) => {
      if (type !== "date") {
        return true;
      }
      return dateAdditionalValidationPayload(data, keys);
    },
  },
  advocateSearchconfig: {
    customValidationCheck: (data) => {
      const { createdFrom, createdTo } = data;
      if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === "")) {
        return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };
      }
      return false;
    },
    preProcess: (data) => data,
    additionalCustomizations: (row, key, column, value, t, _searchResult) => {
      switch (key) {
        case "MASTERS_WAGESEEKER_ID":
          return (
            <span className="link">
              <Link to={`/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${row?.tenantId}&individualId=${value}`}>
                {String(formatWageseekerCellText(value, column, t))}
              </Link>
            </span>
          );

        case "MASTERS_SOCIAL_CATEGORY":
          return value ? <span style={customColumnStyle}>{String(t(`MASTERS_${value}`))}</span> : t("ES_COMMON_NA");

        case "CORE_COMMON_PROFILE_CITY":
          return value ? <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getCityLocale(value)))}</span> : t("ES_COMMON_NA");

        case "MASTERS_WARD":
        case "MASTERS_LOCALITY":
          return renderMohallaCell(row, value, t);
        case "action": {
          return (
            <Link
              to={{
                pathname: `/${window.contextPath}/employee/cases/advocate-vakalath`,
                state: row,
              }}
            >
              Proceed
            </Link>
          );
        }
        default:
          return t("ES_COMMON_NA");
      }
    },
    MobileDetailsOnClick: (row, tenantId) => buildWageseekerMobileLink(row, tenantId),
    additionalValidations: (type, data, keys) => {
      if (type !== "date") {
        return true;
      }
      return dateAdditionalValidationPayload(data, keys);
    },
  },
};
