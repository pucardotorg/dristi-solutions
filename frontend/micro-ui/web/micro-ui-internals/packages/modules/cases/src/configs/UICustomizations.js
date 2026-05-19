import {
  buildCasesSearchAdditionalCustomizations,
  casesSearchDateRangeCustomValidationCheck,
  casesSearchNoOpPreProcess,
  casesSearchStandardAdditionalValidations,
  casesSearchStandardMobileDetailsOnClick,
} from "./uiCustomizationsShared";

//create functions here based on module name set in mdms(eg->SearchProjectConfig)
//how to call these -> Digit?.Customizations?.[masterName]?.[moduleName]
// these functions will act as middlewares
// var Digit = window.Digit || {};

export const UICustomizations = {
  SearchCasesConfig: {
    customValidationCheck: casesSearchDateRangeCustomValidationCheck,
    preProcess: casesSearchNoOpPreProcess,
    additionalCustomizations: buildCasesSearchAdditionalCustomizations(),
    MobileDetailsOnClick: casesSearchStandardMobileDetailsOnClick,
    additionalValidations: casesSearchStandardAdditionalValidations,
  },
  joinCaseSearchCasesConfig: {
    customValidationCheck: casesSearchDateRangeCustomValidationCheck,
    preProcess: casesSearchNoOpPreProcess,
    additionalCustomizations: buildCasesSearchAdditionalCustomizations({
      actionProceedSegment: "search-case",
    }),
    MobileDetailsOnClick: casesSearchStandardMobileDetailsOnClick,
    additionalValidations: casesSearchStandardAdditionalValidations,
  },
  advocateSearchconfig: {
    customValidationCheck: casesSearchDateRangeCustomValidationCheck,
    preProcess: casesSearchNoOpPreProcess,
    additionalCustomizations: buildCasesSearchAdditionalCustomizations({
      actionProceedSegment: "advocate-vakalath",
    }),
    MobileDetailsOnClick: casesSearchStandardMobileDetailsOnClick,
    additionalValidations: casesSearchStandardAdditionalValidations,
  },
};
