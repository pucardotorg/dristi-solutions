import { InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { bulkIssueCTCConfig } from "../../configs/BulkIssueCTCConfig";
import IssueCTCModal from "./IssueCTCModal";
import AddSignatureCTCModal from "../../components/AddSignatureCTCModal";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { combineMultipleFiles } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { HomeService } from "../../hooks/services";
import qs from "qs";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

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

const BulkIssueCTC = () => {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();

  const [isLoading, setIsLoading] = useState(false);
  const [bulkIssueList, setBulkIssueList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signedDocumentUploadId, setSignedDocumentUploadID] = useState("");
  const [showToast, setShowToast] = useState(null);
  const courtId = localStorage.getItem("courtId");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdateApplication = (applicationData, checked) => {
    setBulkIssueList((prev) => {
      if (!prev || prev.length === 0) {
        return [{ ...applicationData, isSelected: checked }];
      }

      const isMatch = (item) => {
        return (
          item?.businessObject?.ctcApplicationNumber === applicationData?.businessObject?.ctcApplicationNumber &&
          item?.businessObject?.docId === applicationData?.businessObject?.docId
        );
      };

      const updated = prev?.map((item) => {
        if (!isMatch(item)) return item;
        return {
          ...item,
          isSelected: checked,
        };
      });

      const hasMatch = prev.some(isMatch);
      if (!hasMatch) {
        updated.push({ ...applicationData, isSelected: checked });
      }

      return updated.filter((item) => item?.isSelected);
    });
  };

  const handleRowClick = async (rowData) => {
    try {
      setIsLoading(true);
      const row = rowData?.original;

      const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
      const accessToken = window.localStorage.getItem("token");
      const courtId = window.localStorage.getItem("courtId");

      // Call the PDF generation API
      const response = await axiosInstance.post(
        `/egov-pdf/ctc-certification?tenantId=${tenantId}&qrCode=false&courtId=${courtId}`,
        {
          RequestInfo: {
            authToken: accessToken,
            userInfo: userInfo,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Dristi",
          },
          criteria: {
            tenantId: tenantId,
            courtId: courtId,
            filingNumber: row?.businessObject?.filingNumber,
            ctcApplicationNumber: row?.businessObject?.ctcApplicationNumber,
            caseNumber: row?.businessObject?.caseNumber,
            nameOfApplicant: row?.businessObject?.nameOfApplicant,
            dateOfApplication: row?.businessObject?.dateOfApplication,
            dateOfApplicationApproval: row?.businessObject?.dateOfApplicationApproval || null,
            requestedDocName: t(row?.businessObject?.docTitle),
          },
        },
        { responseType: "blob" }
      );

      // Extract filename from the content-disposition header if available, otherwise fallback
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "CTC_Document.pdf";
      if (contentDisposition && contentDisposition.indexOf("filename=") !== -1) {
        fileName = contentDisposition.split("filename=")[1].replace(/["']/g, "");
      }

      // Find the original document fileStoreId from the application
      const originalFileStoreId = row?.affidavitDocument?.fileStore || row?.documents?.[0]?.fileStore || row?.businessObject?.fileStoreId;

      let combinedBlob = response.data;
      if (originalFileStoreId) {
        try {
          // Combine original document first, then the CTC PDF
          const combinedFiles = await combineMultipleFiles([{ fileStore: originalFileStoreId }, response.data], fileName, "CTC_COMBINED");
          if (combinedFiles && combinedFiles.length > 0) {
            combinedBlob = combinedFiles[0];
          }
        } catch (combineError) {
          console.error("Failed to combine files, falling back to CTC PDF only:", combineError);
          throw combineError;
        }
      }

      // Attach the combined blob and filename to the selected row data so IssueCTCModal can use it
      setSelectedRowData({
        ...row,
        businessObject: {
          ...row?.businessObject,
          downloadedDocument: combinedBlob,
          fileName: fileName,
        },
      });
      setShowModal(true);
    } catch (error) {
      console.error("Failed to generate CTC PDF:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("BULK_CTC_PDF_ISSUE_FAILED"), error: true, errorId });
    } finally {
      setIsLoading(false);
    }
  };

  const config = useMemo(() => {
    return {
      ...bulkIssueCTCConfig,
      apiDetails: {
        ...bulkIssueCTCConfig.apiDetails,
      },
      sections: {
        ...bulkIssueCTCConfig.sections,
        searchResult: {
          ...bulkIssueCTCConfig.sections.searchResult,
          uiConfig: {
            ...bulkIssueCTCConfig.sections.searchResult.uiConfig,
            columns: bulkIssueCTCConfig.sections.searchResult.uiConfig.columns.map((column) => {
              if (column.label === "SELECT") {
                return {
                  ...column,
                  updateOrderFunc: handleUpdateApplication,
                };
              }
              if (column.label === "DOCUMENTS_REQUESTED") {
                return {
                  ...column,
                  clickFunc: handleRowClick,
                };
              }
              return column;
            }),
          },
        },
      },
    };
  }, []);

  const onFormValueChange = async (form) => {
    if (Array.isArray(form?.searchResult) && form.searchResult.length > 0) {
      const updatedData = form.searchResult.map((item) => ({
        ...item,
        isSelected: false,
      }));
      setBulkIssueList(updatedData);
      return;
    }
    setBulkIssueList([]);
  };

  useEffect(() => {
    let isHeaderControlledClick = false;

    const handleHeaderCheckboxClick = (e) => {
      e.stopPropagation();
      const headerCheckbox = e.target;
      const shouldBeChecked = headerCheckbox.checked;

      const tableBody = document.querySelector("tbody");
      if (tableBody) {
        const allRows = tableBody.querySelectorAll("tr");
        const checkboxesToClick = [];

        allRows.forEach((row) => {
          const rowCheckbox = row.querySelector('input[type="checkbox"]');
          if (rowCheckbox && rowCheckbox.checked !== shouldBeChecked) {
            checkboxesToClick.push(rowCheckbox);
          }
        });

        if (checkboxesToClick.length > 0) {
          isHeaderControlledClick = true;

          checkboxesToClick.forEach((checkbox) => {
            checkbox.click();
          });

          setTimeout(() => {
            isHeaderControlledClick = false;
          }, 200);
        }
      }
    };

    const handleRowCheckboxClick = (e) => {
      if (!isHeaderControlledClick) {
        const headerCheckbox = document.querySelector('input[type="checkbox"][data-header-checkbox="true"]');
        if (headerCheckbox && headerCheckbox.checked) {
          headerCheckbox.checked = false;
        }
      }
    };

    const injectHeaderCheckbox = () => {
      const tableHeaders = document.querySelectorAll('th, [role="columnheader"]');
      let selectHeader = null;
      for (let i = 0; i < tableHeaders.length; i++) {
        const header = tableHeaders[i];
        const headerText = header.textContent?.trim() || "";
        if (i === 0 || headerText === "" || headerText.toLowerCase().includes("select")) {
          selectHeader = header;
          break;
        }
      }

      if (selectHeader) {
        const existingCheckbox = selectHeader.querySelector('input[type="checkbox"]');
        if (!existingCheckbox) {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "custom-checkbox header-checkbox";
          checkbox.style.cssText = "cursor: pointer; width: 20px; height: 20px;";
          checkbox.setAttribute("data-header-checkbox", "true");
          checkbox.addEventListener("click", handleHeaderCheckboxClick);

          selectHeader.innerHTML = "";
          selectHeader.appendChild(checkbox);
        } else if (!existingCheckbox.hasAttribute("data-header-checkbox")) {
          existingCheckbox.setAttribute("data-header-checkbox", "true");
          existingCheckbox.addEventListener("click", handleHeaderCheckboxClick);
        }
      }
    };

    const attachRowCheckboxHandlers = () => {
      const tableBody = document.querySelector("tbody");
      if (tableBody) {
        const allRows = tableBody.querySelectorAll("tr");
        allRows.forEach((row) => {
          const rowCheckbox = row.querySelector('input[type="checkbox"]');
          if (rowCheckbox && !rowCheckbox.hasAttribute("data-row-handler-attached")) {
            rowCheckbox.setAttribute("data-row-handler-attached", "true");
            rowCheckbox.addEventListener("click", handleRowCheckboxClick);
          }
        });
      }
    };

    injectHeaderCheckbox();
    attachRowCheckboxHandlers();

    const timeoutId = setTimeout(() => {
      injectHeaderCheckbox();
      attachRowCheckboxHandlers();
    }, 100);

    const observer = new MutationObserver(() => {
      injectHeaderCheckbox();
      attachRowCheckboxHandlers();
    });

    const container = document.querySelector(".inbox-search-wrapper");
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [config]);

  const fetchResponseFromXmlRequest = async (docRequestList) => {
    const responses = [];
    const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";

    const requests = docRequestList?.map(async (docRequest) => {
      try {
        const formData = qs.stringify({ response: docRequest?.request });
        const response = await axiosInstance.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;
        const status = parseXml(data, "status");

        if (status !== "failed") {
          responses.push({
            docId: docRequest?.docId,
            signedDocData: parseXml(data, "data"),
            signed: true,
            tenantId: tenantId,
            ctcApplicationNumber: docRequest?.ctcApplicationNumber,
            filingNumber: docRequest?.filingNumber,
            courtId: docRequest?.courtId || courtId,
            errorMsg: null,
          });
        } else {
          responses.push({
            docId: docRequest?.docId,
            signedDocData: parseXml(data, "data"),
            signed: false,
            tenantId: tenantId,
            ctcApplicationNumber: docRequest?.ctcApplicationNumber,
            filingNumber: docRequest?.filingNumber,
            courtId: docRequest?.courtId || courtId,
            errorMsg: parseXml(data, "error"),
          });
        }
      } catch (error) {
        console.error(`Error fetching document ${docRequest?.docId}:`, error?.message);
      }
    });

    await Promise.allSettled(requests);
    return responses;
  };

  const handleBulkIssue = async () => {
    const selectedDocuments = bulkIssueList?.filter((data) => data?.isSelected);
    if (!selectedDocuments || selectedDocuments.length === 0) {
      setShowToast({ label: t("PLEASE_SELECT_AT_LEAST_ONE_RECORD"), error: true });
      return;
    }

    setIsLoading(true);
    try {
      const criteriaList = selectedDocuments?.map((row) => ({
        fileStoreId: row?.businessObject?.fileStoreId || row?.affidavitDocument?.fileStore || row?.documents?.[0]?.fileStore || "",
        docId: row?.businessObject?.docId || "",
        ctcApplicationNumber: row?.businessObject?.ctcApplicationNumber || "",
        filingNumber: row?.businessObject?.filingNumber || "",
        courtId: courtId,
        placeholder: "Certification Signature",
        tenantId: tenantId,
        docTitle: t(row?.businessObject?.docTitle),
      }));

      const getDocsResponse = await HomeService._getDocsForCTCApplication(
        {
          criteria: criteriaList,
        },
        { tenantId }
      );

      const requestList = getDocsResponse?.docList || [];

      if (!requestList || requestList.length === 0) {
        throw new Error(t("NO_XML_REQUESTS_RECEIVED"));
      }

      const signedResponses = await fetchResponseFromXmlRequest(requestList);

      if (signedResponses.length === 0 || signedResponses.every((res) => !res.signed)) {
        setShowToast({ label: t("FAILED_TO_PERFORM_BULK_SIGN"), error: true });
        setIsLoading(false);
        return;
      }

      const updateResponse = await HomeService.updateSignedDocCTCApplication(
        {
          signedDocs: signedResponses,
        },
        { tenantId }
      );

      if (updateResponse?.ResponseInfo?.status === "SUCCESSFUL" || updateResponse?.ResponseInfo?.status === "successful") {
        setShowToast({ error: false, label: t("CTC_DOCUMENT_ISSUED_SUCCESSFULLY") });
      }
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      console.error("Failed to perform bulk sign", e?.message || e);
      const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("FAILED_TO_PERFORM_BULK_SIGN"), error: true, errorId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCTCDocumentAction = async ({ action, documents = [], successMessage, closeRejectModal = false }) => {
    try {
      setIsLoading(true);

      const docsDetails = {
        docId: selectedRowData?.businessObject?.docId || "",
        ctcApplicationNumber: selectedRowData?.businessObject?.ctcApplicationNumber || "",
        filingNumber: selectedRowData?.businessObject?.filingNumber || "",
        documents,
      };

      const payload = {
        courtId: selectedRowData?.businessObject?.courtId || window.localStorage.getItem("courtId"),
        action,
        docs: [docsDetails],
        status: "PENDING",
      };

      await HomeService.updateCTCDocs(payload, { tenantId });

      sessionStorage.removeItem("fileStoreId");
      setShowSignatureModal(false);
      setSelectedRowData(null);

      if (closeRejectModal) {
        setShowModal(false);
      }

      setShowToast({ error: false, label: t(successMessage) });

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("error while updating", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("BULK_CTC_ISSUE_FAILED"), error: true, errorId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueDocuments = async () => {
    const localStorageID = sessionStorage.getItem("fileStoreId");

    await handleCTCDocumentAction({
      action: "ISSUE",
      documents: [
        {
          documentType: "SIGNED_CTC_APPLICATION",
          fileStore: localStorageID || signedDocumentUploadId,
        },
      ],
      successMessage: "CTC_DOCUMENT_ISSUED_SUCCESSFULLY",
    });
  };

  const handleRejectDocument = async () => {
    await handleCTCDocumentAction({
      action: "REJECT",
      documents: [],
      successMessage: "CTC_DOCUMENT_REJECT_SUCCESSFULLY",
      closeRejectModal: true,
    });
  };

  useEffect(() => {
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const savedOrderPdf = sessionStorage.getItem("docPdf");
    const signedState = JSON.parse(sessionStorage.getItem("ctcSignState"));
    if (isSignSuccess && signedState) {
      setShowSignatureModal(true);
      setSignedDocumentUploadID(savedOrderPdf);
      setSelectedRowData(signedState);

      const cleanupTimer = setTimeout(() => {
        sessionStorage.removeItem("esignProcess");
        sessionStorage.removeItem("docPdf");
        sessionStorage.removeItem("ctcSignState");
        sessionStorage.removeItem("homeActiveTab");
      }, 2000);

      return () => clearTimeout(cleanupTimer);
    }
  }, []);

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
      <React.Fragment>
        <div className={"bulk-esign-order-view select"}>
          <div className="header" style={{ marginBottom: "20px", fontSize: "2rem", fontWeight: "700" }}>
            {t("Issue Certified True Copy")}
          </div>
          <div className="review-process-page inbox-search-wrapper">
            {" "}
            <InboxSearchComposer
              key={`update_key_${refreshKey}`}
              customStyle={sectionsParentStyle}
              configs={config}
              onFormValueChange={onFormValueChange}
            ></InboxSearchComposer>{" "}
          </div>
        </div>
        <div className="bulk-submit-bar" style={{ display: "flex", justifyContent: "flex-end" }}>
          <SubmitBar
            label={t("Issue selected documents")}
            submit="submit"
            disabled={!bulkIssueList || bulkIssueList?.length === 0 || bulkIssueList?.every((item) => !item?.isSelected)}
            onSubmit={handleBulkIssue}
          />
        </div>
      </React.Fragment>
      {showModal && (
        <IssueCTCModal
          rowData={selectedRowData}
          setShowModal={setShowModal}
          handleIssue={(rowData) => {
            setShowModal(false);
            setShowSignatureModal(true);
          }}
          handleCancelSubmit={handleRejectDocument}
        />
      )}
      {showSignatureModal && (
        <AddSignatureCTCModal
          t={t}
          documentBlob={selectedRowData?.businessObject?.downloadedDocument}
          documentName={selectedRowData?.businessObject?.fileName}
          setSignedDocumentUploadID={setSignedDocumentUploadID}
          handleGoBackSignatureModal={async () => {
            sessionStorage.removeItem("ctcSignState");
            sessionStorage.removeItem("fileStoreId");
            if (!(selectedRowData?.businessObject?.downloadedDocument instanceof Blob)) {
              await handleRowClick(selectedRowData);
              setShowSignatureModal(false);
            } else {
              setShowSignatureModal(false);
              setShowModal(true);
            }
          }}
          saveOnsubmitLabel={"CS_ISSUE"}
          handleIssue={handleIssueDocuments}
          selectedRowData={selectedRowData}
        />
      )}
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}{" "}
    </React.Fragment>
  );
};

export default BulkIssueCTC;
