import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput, Dropdown, DatePicker, Button } from "@egovernments/digit-ui-react-components";
import { useForm, Controller } from "react-hook-form";

const CustomSearchForm = ({ config, onSubmit, onClear, defaultValues, actionComponents }) => {
    const { t } = useTranslation();
    const { control, handleSubmit, reset } = useForm({ defaultValues });

    const handleClear = () => {
        reset(config?.uiConfig?.defaultValues || {});
        onClear();
    };

    const formClassName = config?.uiConfig?.formClassName || "custom-both-clear-search";

    return (
        <div className={`search-form-wrapper ${formClassName}`} style={{ padding: "16px", background: "#fff", marginBottom: "16px", borderRadius: "4px" }}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
                    {config?.uiConfig?.fields?.map((field, index) => {
                        return (
                            <div key={index} style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 auto", ...field?.populators?.style }}>
                                {field?.label && <label style={{ fontWeight: 600, fontSize: "14px", color: "#0B0C0C" }}>{t(field.label)}</label>}
                                <Controller
                                    control={control}
                                    name={field?.populators?.name}
                                    render={({ onChange, value }) => {
                                        if (field?.type === "text") {
                                            return <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder={field?.populators?.placeholder} style={{ width: "100%", margin: 0 }} />;
                                        }
                                        if (field?.type === "dropdown") {
                                            return <Dropdown selected={value} select={onChange} option={field?.populators?.options} optionKey={field?.populators?.optionsKey} style={{ width: "100%", margin: 0 }} />;
                                        }
                                        if (field?.type === "date") {
                                            return <DatePicker date={value} onChange={onChange} style={{ width: "100%", margin: 0 }} />;
                                        }
                                        return <TextInput value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", margin: 0 }} />;
                                    }}
                                />
                            </div>
                        )
                    })}

                    <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "40px" }}>
                        <Button label={t(config?.uiConfig?.primaryLabel || "Search")} onButtonClick={handleSubmit(onSubmit)} variation="primary" />
                        <span onClick={handleClear} style={{ color: "#F47738", cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}>
                            {t(config?.uiConfig?.secondaryLabel || "Clear")}
                        </span>
                    </div>

                    {actionComponents && (
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: "16px" }}>
                            {actionComponents}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CustomSearchForm;
