import get from "lodash/get";
import { getFormattedName } from "../utils";
import {
  orderFormAdrDropdownTransformer,
  orderFormCustomDateTransformer,
  orderFormCustomDropdownTransformer,
  orderFormCustomTextAreaTransformer,
  orderFormDateTransformer,
  orderFormDefaultTransformer,
  orderFormMdmsDropdownTransformer,
  orderFormToSchema,
  orderSchemaToForm,
} from "./orderFormSchemaUtilsShared";

const orderFormSharedTransformers = {
  mdmsDropdown: orderFormMdmsDropdownTransformer,
  adrDropDown: orderFormAdrDropdownTransformer,
  date: orderFormDateTransformer,
  customDate: orderFormCustomDateTransformer,
  customDropdown: orderFormCustomDropdownTransformer,
  customTextArea: orderFormCustomTextAreaTransformer,
  default: orderFormDefaultTransformer,
};

const orderFormTransformers = {
  ...orderFormSharedTransformers,
  summonsOrderPartyName: {
    formToSchema: (value) => {
      try {
        const isWitness = value?.party?.data?.partyType?.toLowerCase() === "witness";
        const partyTypeLabel = isWitness ? "(witness)" : null;
        return getFormattedName(
          value?.party?.data?.firstName,
          value?.party?.data?.middleName,
          value?.party?.data?.lastName,
          isWitness ? value?.party?.data?.witnessDesignation : null,
          partyTypeLabel
        );
      } catch (error) {
        console.error("Error in parsing party name", error);
        return;
      }
    },
    schemaToForm: () => {
      throw new Error("Not implemented");
    },
  },
  noticeOrderPartyName: {
    formToSchema: (value) => {
      try {
        if (!Array?.isArray(value?.party) || value?.party?.length === 0) return [];

        return value?.party?.map((p) => {
          const isWitness = p?.data?.partyType?.toLowerCase() === "witness";
          const partyTypeLabel = isWitness ? "(witness)" : null;

          return getFormattedName(
            p?.data?.firstName,
            p?.data?.middleName,
            p?.data?.lastName,
            isWitness ? p?.data?.witnessDesignation : null,
            partyTypeLabel
          );
        });
      } catch (error) {
        console.error("Error in parsing party name", error);
        return [];
      }
    },
  },
};

const applicationFormTransformers = {
  ...orderFormSharedTransformers,
  applicationDocuments: {
    formToSchema: (obj) => {
      return (
        obj?.submissionDocuments?.map((item) => ({
          fileName: item?.document?.additionalDetails?.name,
          fileStore: item?.document?.fileStore,
          documentType: item?.documentType?.code,
          documentTitle: item?.documentTitle,
        })) ||
        obj?.map((item) => ({
          fileName: item?.submissionDocuments?.uploadedDocs?.[0]?.additionalDetails?.name,
          fileStore: item?.submissionDocuments?.uploadedDocs?.[0]?.fileStore,
          documentType: item?.documentType?.code,
          documentTitle: item?.documentTitle,
        })) ||
        []
      );
    },
    schemaToForm: (arr) => {
      const submissionDocuments =
        arr.map((item) => ({
          document: {
            fileStore: item?.fileStore,
            additionalDetails: { name: item?.fileName },
          },
          documentType: {
            code: item?.documentType,
          },
          documentTitle: item?.documentTitle,
        })) || [];
      return { submissionDocuments };
    },
  },
};

export const UICustomizations = {
  minTodayDateValidation: () => ({
    min: new Date().toISOString().split("T")[0],
  }),
  maxTodayDateValidation: () => ({
    max: new Date().toISOString().split("T")[0],
  }),

  orderTitleValidation: () => ({
    pattern: /^(\b\w+\b\s*){0,15}$/i,
  }),

  alphaNumericValidation: () => ({
    pattern: /[^a-zA-Z0-9\s]/g,
  }),

  alphaNumericInputTextValidation: () => ({
    pattern: /^[a-zA-Z0-9 ]+$/i,
  }),

  OrderFormSchemaUtils: {
    transformers: orderFormTransformers,
    formToSchema: (formData, formConfig) => orderFormToSchema(formData, formConfig, orderFormTransformers),
    schemaToForm: (schemaData, formConfig) => orderSchemaToForm(schemaData, formConfig, orderFormTransformers),
  },

  ApplicationFormSchemaUtils: {
    transformers: applicationFormTransformers,
    formToSchema: (formData, formConfig) => orderFormToSchema(formData, formConfig, applicationFormTransformers),
    schemaToForm: (schemaData, formConfig) => orderSchemaToForm(schemaData, formConfig, applicationFormTransformers),
  },
};
