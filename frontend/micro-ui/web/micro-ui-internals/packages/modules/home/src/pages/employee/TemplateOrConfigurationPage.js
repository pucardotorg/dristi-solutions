import { InboxSearchComposer, Loader, SubmitBar } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { temaplateOrConfigurationConfig } from "../../configs/TemplateOrConfigurationConfig";
import AddTemplateModal from "../../components/AddTemplateModal";
import { AddTeamplateFormConfig, coverLetterTextConfig } from "../../configs/AddTeamplateFormConfig";

const convertToFormData = (t, data) => {
  const formData = {
    isCoverLetterRequired: { code: data?.isCoverLetterRequired ? "YES" : "NO", name: data?.isCoverLetterRequired ? "YES" : "NO" },
    orderText: { text: data?.orderText || "" },
    processTitle: data?.processTitle || "",
    selectAddressee: { code: data?.addressee || "", name: data?.addressee || "" },
    processText: { text: data?.processText || "" },
    addresseeName: data?.addresseeName || "",
  };

  return formData;
};

const TemplateOrConfigurationPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [formdata, setFormData] = useState({});
  const [coverLetterText, setCoverLetterText] = useState("");
  const [stepper, setStepper] = useState(0);

  const handleTemplateTitleClick = (rowData) => {
    console.log("Template title clicked:", rowData);
  };

  const handleActionClick = (rowData, actionType) => {
    if (actionType === "EDIT") {
      setRowData(rowData);
      setStepper(1);
    } else if (actionType === "DELETE") {
      // TODO: Implement delete functionality
      console.log("Delete action clicked for:", rowData);
    }
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
                : column.label === "CS_ACTIONS"
                ? {
                    ...column,
                    clickFunc: handleActionClick,
                  }
                : column;
            }),
          },
        },
      },
    };
  }, []);

  const modifiedFormConfig = useMemo(() => {
    const selectedAddresseeCode = formdata?.selectAddressee?.code;

    return AddTeamplateFormConfig.map((section) => {
      return {
        ...section,
        body: section.body.filter((field) => {
          if (field.key === "addresseeName") {
            return selectedAddresseeCode === "OTHER";
          }

          return true;
        }),
      };
    });
  }, [formdata?.selectAddressee]);

  const getDefaultValues = useMemo(() => {
    if (stepper === 1) {
      if (rowData) {
        return convertToFormData(rowData);
      }
      return {
        isCoverLetterRequired: { code: "YES", name: "YES" },
      };
    } else if (stepper === 2) {
      return {
        coverLetterText: { text: rowData?.coverLetterText || "" },
      };
    }
  }, [rowData, stepper]);

  const handleSubmit = () => {
    const isCoverLetterRequired = formdata?.isCoverLetterRequired?.code === "YES" ? true : false;

    if (isCoverLetterRequired) {
      setStepper(2);
    } else {
      setStepper(3);
    }
  };

  const handleUpdateCoverLetterText = () => {
    setStepper(3);
  };

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
                  setStepper(stepper + 1);
                }}
                style={{ width: "auto" }}
              />
            </div>
          </div>
          {stepper === 1 && (
            <AddTemplateModal
              t={t}
              headerLabel={"ADD_NEW_TEMPLATE"}
              handleCancel={() => {
                setStepper(0);
                setRowData(null);
              }}
              config={modifiedFormConfig}
              saveLabel={formdata?.isCoverLetterRequired?.code === "YES" ? "SAVE_AND_PREVIEW" : "NEXT"}
              cancelLabel={"GO_BACK"}
              defaultValues={getDefaultValues}
              formdata={formdata}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
            />
          )}
          {stepper === 2 && (
            <AddTemplateModal
              t={t}
              headerLabel={"ADD_NEW_TEMPLATE"}
              handleCancel={() => {
                setStepper(1);
              }}
              config={coverLetterTextConfig}
              saveLabel={"NEXT"}
              cancelLabel={"GO_BACK"}
              defaultValues={getDefaultValues}
              formdata={coverLetterText}
              setFormData={setCoverLetterText}
              handleSubmit={handleUpdateCoverLetterText}
            />
          )}
          {/* TODO: set Preview Modal */}
          {/* {stepper === 3 &&  */}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default TemplateOrConfigurationPage;
