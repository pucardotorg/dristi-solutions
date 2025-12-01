import { Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { bulkSignFormsConfig } from "../../configs/BulkSignFormsConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { digitalizationService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import axios from "axios";
import qs from "qs";
import { HomeService } from "../../hooks/services";
import OrderIssueBulkSuccesModal from "@egovernments/digit-ui-module-orders/src/pageComponents/OrderIssueBulkSuccesModal";

const parseXml = (xmlString, tagName) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const element = xmlDoc.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : null;
};

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

function BulkSignDigitalizationView() {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);

  const [bulkSignList, setBulkSignList] = useState(null);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkSignSuccessModal, setShowBulkSignSuccessModal] = useState(false);
  const [signedList, setSignedList] = useState([]);

  const [showErrorToast, setShowErrorToast] = useState(null);
  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const courtId = localStorage.getItem("courtId");
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const hasOrderEsignAccess = useMemo(() => roles?.some((role) => role.code === "ORDER_ESIGN"), [roles]);

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
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

  const config = useMemo(() => {
    const updateDocumentFunc = async (documentData, checked) => {
      setBulkSignList((prev) => {
        return prev?.map((item, i) => {
          if (
            item?.businessObject?.digitalizedDocumentDetails?.documentNumber !==
            documentData?.businessObject?.digitalizedDocumentDetails?.documentNumber
          )
            return item;

          return {
            ...item,
            isSelected: checked,
          };
        });
      });
    };

    const setDocumentFunc = async (document) => {
      if (document?.businessObject?.digitalizedDocumentDetails?.type === "MEDIATION") {
        history.push(
          `/${window.contextPath}/${userType}/home/mediation-form-sign?filingNumber=${document?.businessObject?.digitalizedDocumentDetails?.caseFilingNumber}&documentNumber=${document?.businessObject?.digitalizedDocumentDetails?.documentNumber}&courtId=${document?.businessObject?.digitalizedDocumentDetails?.courtId}`
        );
      }
    };

    return {
      ...bulkSignFormsConfig,
      apiDetails: {
        ...bulkSignFormsConfig.apiDetails,
        requestBody: {
          ...bulkSignFormsConfig.apiDetails.requestBody,
          inbox: {
            ...bulkSignFormsConfig.apiDetails.requestBody.inbox,
            moduleSearchCriteria: {
              ...bulkSignFormsConfig.apiDetails.requestBody.inbox.moduleSearchCriteria,
              ...(courtId && { courtId }),
            },
          },
        },
      },
      sections: {
        ...bulkSignFormsConfig.sections,
        searchResult: {
          ...bulkSignFormsConfig.sections.searchResult,
          uiConfig: {
            ...bulkSignFormsConfig.sections.searchResult.uiConfig,
            columns: bulkSignFormsConfig.sections.searchResult.uiConfig.columns.map((column) => {
              return column.label === "SELECT"
                ? {
                    ...column,
                    updateOrderFunc: updateDocumentFunc,
                  }
                : column.label === "CASE_TITLE"
                ? {
                    ...column,
                    clickFunc: setDocumentFunc,
                  }
                : column;
            }),
          },
        },
      },
    };
  }, [courtId]);

  const onFormValueChange = async (form) => {
    if (Object.keys(form?.searchForm)?.length > 0) {
      const tenantId = window?.Digit.ULBService.getStateId();
      const caseTitle = form?.searchForm?.caseTitle;
      const type = form?.searchForm?.type;
      const startOfTheDay = form?.searchForm?.startOfTheDay;
      const moduleSearchCriteria = {
        tenantId,
        ...(caseTitle && { caseTitle }),
        status: "PENDING_REVIEW",
        ...(type && { type: type?.code }),
        ...(startOfTheDay && {
          startOfTheDay: new Date(startOfTheDay + "T00:00:00").getTime(),
          endOfTheDay: new Date(startOfTheDay + "T23:59:59.999").getTime(),
        }),
        ...(courtId && { courtId }),
      };
      await HomeService.customApiService(bulkSignFormsConfig?.apiDetails?.serviceName, {
        inbox: {
          limit: form?.tableForm?.limit,
          offset: form?.tableForm?.offset,
          tenantId: tenantId,
          moduleSearchCriteria: moduleSearchCriteria,
          processSearchCriteria: {
            businessService: ["digitalized-document-examination", "digitalized-document-mediation", "digitalized-document-plea"],
            moduleName: "Digitalized Document Service",
          },
        },
      }).then((response) => {
        const updatedData = response?.items?.map((item) => {
          return {
            ...item,
            isSelected: true,
          };
        });
        setBulkSignList(updatedData);
      });
    }
  };

  const fetchResponseFromXmlRequest = async (documentRequestList) => {
    const responses = [];

    const requests = documentRequestList?.map(async (document) => {
      try {
        // URL encoding the XML request
        const formData = qs.stringify({ response: document?.request });
        const response = await axios.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;

        if (parseXml(data, "status") !== "failed") {
          responses.push({
            documentNumber: document?.documentNumber,
            signedDocumentData: parseXml(data, "data"),
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            documentNumber: document?.documentNumber,
            signedDocumentData: parseXml(data, "data"),
            signed: false,
            errorMsg: parseXml(data, "error"),
            tenantId: tenantId,
          });
        }
      } catch (error) {
        console.error(`Error fetching document ${document?.documentNumber}:`, error?.message);
      }
    });

    await Promise.allSettled(requests);
    return responses;
  };

  const handleBulkSign = async () => {
    setShowBulkSignConfirmModal(false);
    setIsLoading(true);
    const criteriaList = bulkSignList
      ?.filter((data) => data?.isSelected)
      ?.map((document) => {
        return {
          fileStoreId:
            document?.businessObject?.digitalizedDocumentDetails?.documents?.find((doc) => doc?.documentType === "UNSIGNED")?.fileStore || "",
          documentNumber: document?.businessObject?.digitalizedDocumentDetails?.documentNumber,
          placeholder: "Signature",
          tenantId: tenantId,
        };
      });
    try {
      const response = await digitalizationService.getDigitalizedDocumentsToSign(
        {
          criteria: criteriaList,
        },
        {}
      );
      await fetchResponseFromXmlRequest(response?.documents).then(async (responseArray) => {
        const updateDocumentResponse = await digitalizationService.updateSignedDigitalizedDocuments(
          {
            signedDocuments: responseArray,
          },
          {}
        );
        const signedList = updateDocumentResponse?.documents;

        if (signedList?.length === 0) {
          setShowErrorToast({
            message: t("FAILED_TO_PERFORM_BULK_SIGN"),
            error: true,
          });
          setTimeout(() => {
            setShowErrorToast(null);
          }, 3000);
          return;
        }

        setSignedList(signedList);
        setShowBulkSignSuccessModal(true);
      });
    } catch (e) {
      setShowErrorToast({ label: t("FAILED_TO_PERFORM_BULK_SIGN"), error: true });
      console.error("Failed to perform bulk sign", e?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <div className={"bulk-esign-order-view select title"}>
            <div className="header">{t("CS_HOME_SIGN_FORMS")}</div>
            <InboxSearchComposer customStyle={sectionsParentStyle} configs={config} onFormValueChange={onFormValueChange}></InboxSearchComposer>{" "}
          </div>
          {hasOrderEsignAccess && (
            <div className="bulk-submit-bar">
              <SubmitBar
                label={t("SIGN_SELECTED_DIGITALIZATION_FORMS")}
                submit="submit"
                disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
                onSubmit={() => setShowBulkSignConfirmModal(true)}
              />
            </div>
          )}
        </React.Fragment>
      )}
      {showBulkSignConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_SIGN")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignConfirmModal(false)} />}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => setShowBulkSignConfirmModal(false)}
          actionSaveLabel={t("CS_FORM_BULK_SIGN")}
          actionSaveOnSubmit={() => handleBulkSign()}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_FORM_BULK_SIGN_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showBulkSignSuccessModal && <OrderIssueBulkSuccesModal t={t} history={history} bulkSignOrderListLength={signedList?.length} />}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
}

export default BulkSignDigitalizationView;
