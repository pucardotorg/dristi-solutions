import { InboxSearchComposer, Loader, SubmitBar, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { temaplateOrConfigurationConfig } from "../../configs/TemplateOrConfigurationConfig";
import AddTemplateModal from "../../components/AddTemplateModal";
import { AddTeamplateFormConfig, coverLetterTextConfig } from "../../configs/AddTeamplateFormConfig";
import { HomeService, Urls } from "../../hooks/services";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

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
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const accessToken = window.localStorage.getItem("token");
  const userInfo = Digit.UserService.getUser()?.info;
  const [pdfData, setPdfFile] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const getTemplatePdfHelper = useCallback(async (rowData) => {
    try {
      const { auditDetails, id, isActive, ...rest } = rowData;
      const response = await axiosInstance.post(
        Urls.searchTemplatePdf,
        {
          RequestInfo: {
            authToken: accessToken,
            userInfo: userInfo,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Dristi",
          },
          templateConfiguration: { ...rest },
        },
        {
          params: { tenantId, qrCode: false, courtId },
          responseType: "blob",
        }
      );
  
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition ? contentDisposition.split("filename=")[1]?.replace(/['"]/g, "") : "template-configuration.pdf";
  
      return new File([response?.data], filename, { type: "application/pdf" });
    } catch (error) {
      console.error("Error while fetching pdf:", error);
      throw error;
    }
  }, [accessToken, courtId, tenantId, userInfo]);

  const handleActionClick = useCallback(
    async (rowData, actionType) => {
      if (actionType === "EDIT") {
        setRowData(rowData);
        setStepper(1);
      } else if (actionType === "DELETE") {
        try {
          setIsLoading(true);
          const payload = {
            templateConfiguration: {
              ...rowData,
              isActive: false,
            },
          };

          await HomeService.updateTemplate(payload, { tenantId });
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error("Delete failed", error);
          setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [t, tenantId]
  );

  const handleTemplateTitleClick = useCallback(async (rowData) => {
    try {
      setIsLoading(true);
      setIsViewOnly(true);
      const file = await getTemplatePdfHelper(rowData);
      if (file) {
        setPdfFile(file);
        setStepper(3);
      } else {
        setShowErrorToast({ label: t("ERROR_OPENING_TEMPLATE"), error: true });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [getTemplatePdfHelper, t]);

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
  }, [handleActionClick, handleTemplateTitleClick]);

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
        return convertToFormData(t, rowData);
      }
      return {
        isCoverLetterRequired: { code: "YES", name: "YES" },
      };
    } else if (stepper === 2) {
      return {
        coverLetterText: { text: rowData?.coverLetterText || "" },
      };
    }
  }, [rowData, stepper, t]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const isCoverLetterRequired = formdata?.isCoverLetterRequired?.code === "YES";

      const payload = {
        templateConfiguration: {
          ...(rowData || {}),
          tenantId: tenantId,
          courtId: courtId,
          processTitle: formdata?.processTitle,
          isCoverLetterRequired: isCoverLetterRequired,
          addressee: formdata?.selectAddressee?.code,
          orderText: formdata?.orderText?.text || "",
          processText: formdata?.processText?.text || "",
          addresseeName: formdata?.addresseeName || "",
        },
      };

      let res = null;
      if (!rowData) {
        res = await HomeService.createTeamplate(payload, { tenantId });
      } else {
        res = await HomeService.updateTemplate(payload, { tenantId });
      }

      if (res?.templateConfiguration) {
        setRowData(res.templateConfiguration);
        if (isCoverLetterRequired) {
          setStepper(2);
        } else {
          // Fetch PDF before moving to Step 3
          const file = await getTemplatePdfHelper(res.templateConfiguration);
          if (file) {
            setPdfFile(file);
            setStepper(3);
          } else {
            setShowErrorToast({ label: t("ERROR_GENERATING_PREVIEW"), error: true });
          }
        }
      }
    } catch (error) {
      console.error("Error while Updating....", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCoverLetterText = async () => {
    try {
      setIsLoading(true);
      const payload = {
        templateConfiguration: {
          ...rowData,
          coverLetterText: coverLetterText?.coverLetterText?.text || "",
        },
      };

      const res = await HomeService.updateTemplate(payload, { tenantId });
      if (res?.templateConfiguration) {
        setRowData(res.templateConfiguration);

        const file = await getTemplatePdfHelper(res.templateConfiguration);
        if (file) {
          setPdfFile(file);
          setStepper(3);
        } else {
          setShowErrorToast({ label: t("ERROR_GENERATING_PREVIEW"), error: true });
        }
      }
    } catch (error) {
      console.log("Error whle Updating....", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setIsLoading(false);
    }
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  return (
    <React.Fragment>
      {isLoading && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "100001",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      <div className={`bulk-esign-order-view`}>
        <div className="header" style={{ paddingLeft: "0px", paddingBottom: "24px" }}>
          {t("TEMPLATES")}
        </div>
        <div className="review-process-page inbox-search-wrapper">
          <InboxSearchComposer key={`inbox-${refreshKey}`} showTab={false} configs={modifiedConfig} />
        </div>
      </div>
      <div className={"bulk-submit-bar"}>
        <div style={{ justifyContent: "space-between", width: "fit-content", display: "flex", gap: 20 }}>
          <SubmitBar
            label={t("ADD_NEW_TEMPLATE")}
            onSubmit={() => {
              setRowData(null);
              setStepper(1);
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
      {stepper === 3 && (
        <AddTemplateModal
          t={t}
          headerLabel={"ADD_NEW_TEMPLATE"}
          handleCancel={() => {
            if (isViewOnly) {
              setStepper(0);
              setIsViewOnly(false);
            } else {
              setStepper(rowData?.isCoverLetterRequired ? 2 : 1);
            }
          }}
          saveLabel={"NEXT"}
          cancelLabel={"GO_BACK"}
          handleSubmit={() => setStepper(0)}
          isPdfLoading={isLoading}
          previewPdf={pdfData}
          isShowPdf={true}
        />
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default TemplateOrConfigurationPage;
