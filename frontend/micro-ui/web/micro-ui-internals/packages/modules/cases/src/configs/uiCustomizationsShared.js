import { Link } from "react-router-dom";
import React from "react";

export const CASES_SEARCH_CUSTOM_COLUMN_STYLE = { whiteSpace: "nowrap" };

export const casesSearchDateRangeCustomValidationCheck = (data) => {
  const { createdFrom, createdTo } = data;
  if ((createdFrom === "" && createdTo !== "") || (createdFrom !== "" && createdTo === "")) {
    return { warning: true, label: "ES_COMMON_ENTER_DATE_RANGE" };
  }
  return false;
};

export const casesSearchNoOpPreProcess = (data) => data;

export const casesSearchStandardMobileDetailsOnClick = (row, tenantId) => {
  let link;
  Object.keys(row).map((key) => {
    if (key === "MASTERS_WAGESEEKER_ID") {
      link = `/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${tenantId}&wageseekerId=${row[key]}`;
    }
  });
  return link;
};

export const casesSearchStandardAdditionalValidations = (type, data, keys) => {
  if (type === "date") {
    return data[keys.start] && data[keys.end]
      ? () => new Date(data[keys.start]).getTime() <= new Date(data[keys.end]).getTime()
      : true;
  }
};

/**
 * @param {{ actionProceedSegment?: string }} options e.g. `search-case` or `advocate-vakalath`. When set, `action` column renders Proceed; otherwise NA.
 * Pathname is resolved at render time so `window.contextPath` stays current.
 */
export function buildCasesSearchAdditionalCustomizations(options = {}) {
  const { actionProceedSegment } = options;
  const customColumnStyle = CASES_SEARCH_CUSTOM_COLUMN_STYLE;

  return (row, key, column, value, t, searchResult) => {
    switch (key) {
      case "MASTERS_WAGESEEKER_ID":
        return (
          <span className="link">
            <Link to={`/${window.contextPath}/employee/masters/view-wageseeker?tenantId=${row?.tenantId}&individualId=${value}`}>
              {String(value ? (column.translate ? t(column.prefix ? `${column.prefix}${value}` : value) : value) : t("ES_COMMON_NA"))}
            </Link>
          </span>
        );

      case "MASTERS_SOCIAL_CATEGORY":
        return value ? <span style={customColumnStyle}>{String(t(`MASTERS_${value}`))}</span> : t("ES_COMMON_NA");

      case "CORE_COMMON_PROFILE_CITY":
        return value ? <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getCityLocale(value)))}</span> : t("ES_COMMON_NA");

      case "MASTERS_WARD":
        return value ? (
          <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getMohallaLocale(value, row?.tenantId)))}</span>
        ) : (
          t("ES_COMMON_NA")
        );

      case "MASTERS_LOCALITY":
        return value ? (
          <span style={customColumnStyle}>{String(t(Digit.Utils.locale.getMohallaLocale(value, row?.tenantId)))}</span>
        ) : (
          t("ES_COMMON_NA")
        );

      case "action": {
        if (!actionProceedSegment) {
          return t("ES_COMMON_NA");
        }
        return (
          <Link
            to={{
              pathname: `/${window.contextPath}/employee/cases/${actionProceedSegment}`,
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
  };
}
