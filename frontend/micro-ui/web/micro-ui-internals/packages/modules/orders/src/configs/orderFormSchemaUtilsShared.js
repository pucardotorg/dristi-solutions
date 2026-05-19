import get from "lodash/get";
import set from "lodash/set";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { schemaToFormMdmsMatch } from "./schemaToFormMdmsShared";

export const orderFormMdmsDropdownTransformer = {
  formToSchema: (option) => option?.code,
  schemaToForm: async (value, mdmsConfig) => schemaToFormMdmsMatch(value, mdmsConfig, "code"),
};

export const orderFormAdrDropdownTransformer = {
  formToSchema: (option) => option?.name,
  schemaToForm: async (value, mdmsConfig) => schemaToFormMdmsMatch(value, mdmsConfig, "name"),
};

export const orderFormDateTransformer = {
  formToSchema: (dateString) => (dateString ? new Date(dateString).getTime() : null),
  schemaToForm: (date) => (date ? new Date(date).toISOString().split("T")[0] : null),
};

export const orderFormCustomDateTransformer = {
  formToSchema: (dateString) => (dateString ? DateUtils.getFormattedDate(new Date(dateString), "DD-MM-YYYY") : null),
  schemaToForm: (date) => (date ? new Date(date).toISOString().split("T")[0] : null),
};

export const orderFormCustomDropdownTransformer = {
  formToSchema: (optionOrOptions) => {
    if (Array.isArray(optionOrOptions)) {
      return optionOrOptions.map((party) => party.name);
    }
    return optionOrOptions?.name;
  },
  schemaToForm: (value) => {
    if (Array.isArray(value)) {
      return value.map((party) => ({ name: party }));
    }
    return { name: value };
  },
};

export const orderFormCustomTextAreaTransformer = {
  formToSchema: (obj) => obj?.text || "",
  schemaToForm: (text) => ({ text: text || "" }),
};

export const orderFormDefaultTransformer = {
  formToSchema: (obj) => obj,
  schemaToForm: (obj) => obj,
};

export const orderFormToSchema = (formData, formConfig, transformers) => {
  const transformedFormData = {};
  formConfig.forEach((section) => {
    section.body.forEach((field) => {
      const schemaKeyPath = field.schemaKeyPath;
      if (!schemaKeyPath) {
        return;
      }
      if (typeof schemaKeyPath === "string") {
        const transformer = transformers[field.transformer]?.formToSchema;
        set(transformedFormData, schemaKeyPath, transformer ? transformer(get(formData, field.key)) : get(formData, field.key));
        return;
      }
      if (typeof schemaKeyPath === "object") {
        Object.entries(schemaKeyPath).forEach(([key, value]) => {
          const transformer = transformers[value.transformer]?.formToSchema;
          set(
            transformedFormData,
            value.value,
            transformer ? transformer(get(formData, [field.key, key].join("."))) : get(formData, [field.key, key].join("."))
          );
        });
      }
    });
  });
  return transformedFormData;
};

export const orderSchemaToForm = async (schemaData, formConfig, transformers) => {
  const transformedSchemaData = {};
  const usedMdmsMasters = {};
  formConfig.forEach((section) => {
    section.body.forEach((field) => {
      if (field.populators?.mdmsConfig) {
        usedMdmsMasters[field.populators.mdmsConfig.moduleName] = usedMdmsMasters[field.populators.mdmsConfig.moduleName] || [];
        usedMdmsMasters[field.populators.mdmsConfig.moduleName].push(field.populators.mdmsConfig.masterName);
      }
    });
  });
  const mdmsValuesFetchPromises = [];
  for (const moduleName in usedMdmsMasters) {
    const promise = await Digit.MDMSService.getDataByCriteria(
      Digit.ULBService.getCurrentTenantId(),
      { details: { moduleDetails: [{ moduleName, masterDetails: usedMdmsMasters[moduleName].map((masterName) => ({ name: masterName })) }] } },
      moduleName
    );
    mdmsValuesFetchPromises.push(promise);
  }
  await Promise.all(mdmsValuesFetchPromises);

  const transformPromises = [];
  formConfig.forEach((section) => {
    section.body.forEach(async (field) => {
      const schemaKeyPath = field.schemaKeyPath || field.key;
      if (!schemaKeyPath || field.populators.hideInForm) {
        return;
      }
      const transformer = transformers[field.transformer]?.schemaToForm;

      if (transformer) {
        const transformedValue = await transformer(get(schemaData, schemaKeyPath), field.populators?.mdmsConfig);
        transformPromises.push(transformedValue);
        set(transformedSchemaData, field.key, transformedValue);
      } else {
        set(transformedSchemaData, field.key, get(schemaData, schemaKeyPath));
      }
    });
  });
  await Promise.all(transformPromises);

  return transformedSchemaData;
};
