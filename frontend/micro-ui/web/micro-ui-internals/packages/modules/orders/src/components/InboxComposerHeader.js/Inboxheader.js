import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import SubmitBar from "../SubmitBar";
import { renderField, LinkLabel } from "./RenderFields";

const Inboxheader = ({ config, tabData, onTabChange, onFormSubmit }) => {
  const { t } = useTranslation();
  const { register, setValue, reset, watch, trigger, control } = useForm({
    defaultValues: config?.sections?.search?.uiConfig?.defaultValues,
    mode: config?.sections?.search?.uiConfig?.formMode || "onSubmit",
  });

  const formData = watch();

  useEffect(() => {
    const defaultValues = config?.sections?.search?.uiConfig?.defaultValues || {};
    reset(defaultValues);
  }, [config, reset]);

  const clearSearch = () => {
    const defaultValues = config?.sections?.search?.uiConfig?.defaultValues || {};
    reset(defaultValues);

    Object.keys(defaultValues).forEach((key) => setValue(key, defaultValues[key]));

    if (onFormSubmit && typeof onFormSubmit === "function") {
      onFormSubmit(defaultValues, true);
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (onFormSubmit && typeof onFormSubmit === "function") {
      onFormSubmit(formData, false);
    }
  };
  
  return (
    <React.Fragment>
      <div className="tab-container">
        {tabData?.map((i, num) => (
          <button key={num} className={i?.active ? "search-tab-head-selected" : ""} onClick={() => onTabChange(num)}>
            {t(i?.label)}
          </button>
        ))}
      </div>

      <div className="inbox-search-fields">
        {config?.sections?.search?.customShow && !config?.sections?.search?.show && (
          <form className="form-container" onSubmit={handleSubmitForm}>
            <div className={`${config?.sections?.search?.uiConfig?.formClassName || ""}`}>
              {config?.sections?.search?.uiConfig?.fields?.map((field, index) => (
                <div key={index} className={`label-field-pair ${field?.className || ""}`} style={field?.style || {}}>
                  {field?.label && <label className={`form-label ${field?.labelClassName || ""}`}>{t(field?.label)}</label>}
                  {renderField(t, field, formData, setValue, register, trigger, control)}
                  {field?.populators?.showError && (
                    <p
                      className={`error-message ${config?.sections?.search?.uiConfig?.errorClassName || ""}`}
                      style={{ color: "red", ...config?.sections?.search?.uiConfig?.errorStyle }}
                    >
                      {field?.populators?.errorMessage || t("REQUIRED_FIELD")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div
              className={`search-button-wrapper ${config?.sections?.search?.uiConfig?.searchWrapperClassName || ""}`}
              style={config?.sections?.search?.uiConfig?.searchWrapperStyles || {}}
            >
              {config?.sections?.search?.uiConfig?.secondaryLabel && (
                <LinkLabel
                  style={{ marginBottom: 0, whiteSpace: "nowrap", ...config?.sections?.search?.uiConfig?.secondaryLabelStyle }}
                  onClick={clearSearch}
                  className={config?.sections?.search?.uiConfig?.secondaryLabelClassName || ""}
                >
                  {t(config?.sections?.search?.uiConfig?.secondaryLabel)}
                </LinkLabel>
              )}

              {config?.sections?.search?.uiConfig?.primaryLabel && (
                <SubmitBar
                  label={t(config?.sections?.search?.uiConfig?.primaryLabel)}
                  submit="submit"
                  disabled={config?.sections?.search?.uiConfig?.disableSubmit}
                  className={config?.sections?.search?.uiConfig?.primaryButtonClassName || ""}
                  style={config?.sections?.search?.uiConfig?.primaryButtonStyle || {}}
                />
              )}
            </div>
          </form>
        )}
        {config?.sections?.search?.additionalCustomization?.component && (
          <div className={`additional-customization ${config?.sections?.search?.additionalCustomization?.className || ""}`}>
            {config.sections.search.additionalCustomization.component({ t, formData: watch(), setValue })}
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default Inboxheader;
