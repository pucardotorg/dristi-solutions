import get from "lodash/get";

/**
 * Resolve MDMS dropdown value back to the option object (used by Order/Application form schema transformers).
 * @param {string} value
 * @param {object} mdmsConfig
 * @param {"code" | "name"} matchProp
 */
export const schemaToFormMdmsMatch = async (value, mdmsConfig, matchProp) => {
  if (!(mdmsConfig && mdmsConfig.moduleName && mdmsConfig.masterName)) {
    return;
  }

  const mdmsData = await Digit.MDMSService.getDataByCriteria(
    Digit.ULBService.getCurrentTenantId(),
    { details: { moduleDetails: [{ moduleName: mdmsConfig.moduleName, masterDetails: [{ name: mdmsConfig.masterName }] }] } },
    mdmsConfig.moduleName
  );

  const select = mdmsConfig?.select
    ? Digit.Utils.createFunction(mdmsConfig?.select)
    : (data) => {
        const optionsData = get(data, `${mdmsConfig?.moduleName}.${mdmsConfig?.masterName}`, []);
        return optionsData
          .filter((opt) => (opt?.hasOwnProperty("active") ? opt.active : true))
          .map((opt) => ({ ...opt, name: `${mdmsConfig?.localePrefix}_${Digit.Utils.locale.getTransformedLocale(opt.code)}` }));
      };

  return select(mdmsData).find((option) => option[matchProp] === value);
};
