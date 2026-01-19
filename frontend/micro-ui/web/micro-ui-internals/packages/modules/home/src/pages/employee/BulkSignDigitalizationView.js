import { Toast, CloseSvg, InboxSearchComposer, SubmitBar, Loader, Banner } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { bulkSignFormsConfig } from "../../configs/BulkSignFormsConfig";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { digitalizationService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import qs from "qs";
import { HomeService } from "../../hooks/services";
import DigitalDocumentSignModal from "./DigitalDocumentSignModal";
import { numberToWords } from "@egovernments/digit-ui-module-orders/src/utils";

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
  const [seletedDigitalizationDocument, setSeletedDigitalizationDocument] = useState(
    sessionStorage.getItem("bulkDigitalDocumentSignSelectedItem") ? JSON.parse(sessionStorage.getItem("bulkDigitalDocumentSignSelectedItem")) : null
  );
  const [showBulkSignModal, setShowBulkSignModal] = useState(sessionStorage.getItem("bulkDigitalDocumentSignSelectedItem") ? true : false);
  const [needConfigRefresh, setNeedConfigRefresh] = useState(false);
  const [digitalDocumentPaginationData, setDigitalDocumentPaginationData] = useState({});
  const [counter, setCounter] = useState(0);
  const isPleaApprover = useMemo(() => roles?.some((role) => role?.code === "PLEA_APPROVER"), [roles]);
  const isExaminationApprover = useMemo(() => roles?.some((role) => role?.code === "EXAMINATION_APPROVER"), [roles]);
  const isMediationApprover = useMemo(() => roles?.some((role) => role?.code === "MEDIATION_APPROVER"), [roles]);
  const hasSignFormsAccess = useMemo(() => {
    return isPleaApprover || isExaminationApprover || isMediationApprover;
  }, [isPleaApprover, isExaminationApprover, isMediationApprover]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;

  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

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
      } else {
        setShowBulkSignModal(true);
        setSeletedDigitalizationDocument(document);
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
        search: {
          ...bulkSignFormsConfig.sections.search,
          uiConfig: {
            ...bulkSignFormsConfig.sections.search.uiConfig,
            defaultValues: {
              ...bulkSignFormsConfig.sections.search.uiConfig.defaultValues,
              tenantId: tenantId,
              caseTitle: sessionStorage.getItem("bulkDigitalDocumentSignCaseTitle") ? sessionStorage.getItem("bulkDigitalDocumentSignCaseTitle") : "",
            },
          },
        },
      },
      additionalDetails: {
        setbulkDigitizationSignList: setBulkSignList,
        setDigitizationPaginationData: setDigitalDocumentPaginationData,
        setNeedConfigRefresh: setNeedConfigRefresh,
      },
    };
  }, [courtId, needConfigRefresh]);

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
        const response = await axiosInstance.post(bulkSignUrl, formData, {
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

  const handleBulkSignConfirm = async () => {
    setShowBulkSignConfirmModal(false);
    setIsLoading(true);
    const criteriaList = bulkSignList
      ?.filter((data) => data?.isSelected)
      ?.map((document) => {
        return {
          fileStoreId: document?.businessObject?.digitalizedDocumentDetails?.documents?.[0]?.fileStore || "",
          documentNumber: document?.businessObject?.digitalizedDocumentDetails?.documentNumber,
          placeholder: "Signature of Magistrate",
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
      await fetchResponseFromXmlRequest(response?.documentList)?.then(async (responseArray) => {
        const updateDocumentResponse = await digitalizationService.updateSignedDigitalizedDocuments(
          {
            signedDocuments: responseArray,
          },
          {}
        );
        const signedList = updateDocumentResponse?.documents;

        if (signedList?.length === 0) {
          setShowErrorToast({
            label: t("FAILED_TO_PERFORM_BULK_SIGN"),
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

  const handleBulkSign = async () => {
    const notAllowedItems = bulkSignList
      ?.filter((data) => data?.isSelected)
      ?.filter((doc) => {
        if (doc?.businessObject?.digitalizedDocumentDetails?.type === "PLEA" && !isPleaApprover) return true;
        if (doc?.businessObject?.digitalizedDocumentDetails?.type === "EXAMINATION_OF_ACCUSED" && !isExaminationApprover) return true;
        if (doc?.businessObject?.digitalizedDocumentDetails?.type === "MEDIATION" && !isMediationApprover) return true;
        return false;
      });

    if (notAllowedItems?.length > 0) {
      const notAllowedTypes = [...new Set(notAllowedItems?.map((doc) => t(doc?.businessObject?.digitalizedDocumentDetails?.type)))];
      const msg = t("FOLLOWING_DOCUMENTS_CANNOT_BE_SIGNED") + notAllowedTypes?.join(", ");
      setShowErrorToast({
        label: msg,
        error: true,
      });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
      return;
    }
    setShowBulkSignConfirmModal(true);
  };

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <div className={"bulk-esign-order-view select title"}>
            <div className="header">{t("CS_HOME_SIGN_FORMS")}</div>
            <InboxSearchComposer
              key={`witness-deposition-${counter}`}
              customStyle={sectionsParentStyle}
              configs={config}
              onFormValueChange={onFormValueChange}
            ></InboxSearchComposer>{" "}
          </div>
          {hasSignFormsAccess && (
            <div className="bulk-submit-bar">
              <SubmitBar
                label={t("SIGN_SELECTED_DIGITALIZATION_FORMS")}
                submit="submit"
                disabled={!bulkSignList || bulkSignList?.length === 0 || bulkSignList?.every((item) => !item?.isSelected)}
                onSubmit={handleBulkSign}
              />
            </div>
          )}
        </React.Fragment>
      )}
      {showBulkSignModal && (
        <DigitalDocumentSignModal
          selectedDigitizedDocument={seletedDigitalizationDocument}
          setShowBulkSignModal={setShowBulkSignModal}
          digitalDocumentPaginationData={digitalDocumentPaginationData}
          setShowErrorToast={setShowErrorToast}
          setCounter={setCounter}
        />
      )}
      {showBulkSignConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_SIGN")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignConfirmModal(false)} />}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => setShowBulkSignConfirmModal(false)}
          actionSaveLabel={t("CS_FORM_BULK_SIGN")}
          actionSaveOnSubmit={handleBulkSignConfirm}
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
      {showBulkSignSuccessModal && (
        <Modal
          actionSaveLabel={t("BULK_SUCCESS_CLOSE")}
          actionSaveOnSubmit={() => history.replace(homePath)}
          className={"orders-issue-bulk-success-modal"}
        >
          <div>
            <Banner
              whichSvg={"tick"}
              successful={true}
              message={`${t("YOU_HAVE_SUCCESSFULLY_SIGNED_BULK_DOCUMENTS")} ${numberToWords(signedList?.length)} ${t("SIGNED_FORM_DOCUEMNTS")} `}
              headerStyles={{ fontSize: "32px" }}
              style={{ minWidth: "100%" }}
            ></Banner>
          </div>
        </Modal>
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
}

export default BulkSignDigitalizationView;
