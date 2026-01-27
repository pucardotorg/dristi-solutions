import { InboxSearchComposer, Loader, SubmitBar } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { temaplateOrConfigurationConfig } from "../../configs/TemplateOrConfigurationConfig";

const TemplateOrConfigurationPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [addTemplateModalOpen, setAddTemplateModalOpen] = useState(false);

  const handleTemplateTitleClick = (rowData) => {
    console.log("Template title clicked:", rowData);
  };

  const modifiedConfig = useMemo(() => {
    return {
      ...temaplateOrConfigurationConfig,
      sections: {
        ...temaplateOrConfigurationConfig.sections,
        searchResult: {
          ...temaplateOrConfigurationConfig.sections.searchResult,
          uiConfig: {
            ...temaplateOrConfigurationConfig.sections.searchResult.uiConfig,
            columns: temaplateOrConfigurationConfig.sections.searchResult.uiConfig.columns.map((column) => {
              return column.label === "TEMPLATE_OR_PROCESS_TITLE"
                ? {
                    ...column,
                    clickFunc: handleTemplateTitleClick,
                  }
                : column;
            }),
          },
        },
      },
    };
  }, []);

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <div className={`bulk-esign-order-view`}>
            <div className="header" style={{ paddingLeft: "0px", paddingBottom: "24px" }}>
              {t("TEMPLATES")}
            </div>
            <div className="review-process-page inbox-search-wrapper">
              <InboxSearchComposer showTab={false} configs={modifiedConfig} />
            </div>
          </div>
          <div className={"bulk-submit-bar"}>
            <div style={{ justifyContent: "space-between", width: "fit-content", display: "flex", gap: 20 }}>
              <SubmitBar
                label={t("ADD_NEW_TEMPLATE")}
                onSubmit={() => {
                  setAddTemplateModalOpen(true);
                }}
                style={{ width: "auto" }}
              />
            </div>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default TemplateOrConfigurationPage;
