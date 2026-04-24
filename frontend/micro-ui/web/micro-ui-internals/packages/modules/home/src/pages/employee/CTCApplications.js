import { InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CTCApplicationsConfig } from "../../configs/CTCApplicationsConfig";
import { HomeService } from "../../hooks/services";
import RejectCTCApplicationReasonModal from "../../components/RejectCTCApplicationReasonModal";
import GenericPreviewModal from "@egovernments/digit-ui-module-dristi/src/components/GenericPreviewModal";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const CTCApplications = ({ refetch }) => {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();

  const [isLoading, setIsLoading] = useState(false);
  const [bulkIssueList, setBulkIssueList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRowApplicationData, setShowSelectedApplicationData] = useState({});
  const [updateCounter, setUpdateCounter] = useState(0);
  const courtId = localStorage.getItem("courtId");
  const [showToast, setShowToast] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingRejectData, setPendingRejectData] = useState(null);

  const handleUpdateApplication = (applicationData, checked) => {
    setBulkIssueList((prev) => {
      if (!prev || prev.length === 0) {
        return [{ ...applicationData, isSelected: checked }];
      }

      const updated = prev?.map((item) => {
        if (item?.businessObject?.ctcApplicationNumber !== applicationData?.businessObject?.ctcApplicationNumber) return item;
        return {
          ...item,
          isSelected: checked,
        };
      });

      const hasMatch = prev.some((item) => item?.businessObject?.ctcApplicationNumber === applicationData?.businessObject?.ctcApplicationNumber);
      if (!hasMatch) {
        updated.push({ ...applicationData, isSelected: checked });
      }

      return updated.filter((item) => item?.isSelected);
    });
  };

  const handleRowClick = async (rowData) => {
    try {
      setIsLoading(true);
      const applicationNumber = rowData?.original?.businessObject?.ctcApplicationNumber;
      const data = await HomeService.searchCTCApplication({
        criteria: { tenantId, ctcApplicationNumber: applicationNumber },
        pagination: {},
      });
      const application = data?.ctcApplications?.[0] || null;
      setShowSelectedApplicationData(application);
      setShowModal(true);
    } catch (error) {
      console.error("handleRowClick error:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("CTC_SEARCH_APPLICATION_FAILED"), error: true, errorId });
    } finally {
      setIsLoading(false);
    }
  };

  const config = useMemo(() => {
    return {
      ...CTCApplicationsConfig,
      apiDetails: {
        ...CTCApplicationsConfig.apiDetails,
      },
      additionalDetails: {
        setCount: () => {
          if (refetch) refetch();
        },
      },
      sections: {
        ...CTCApplicationsConfig.sections,
        searchResult: {
          ...CTCApplicationsConfig.sections.searchResult,
          uiConfig: {
            ...CTCApplicationsConfig.sections.searchResult.uiConfig,
            columns: CTCApplicationsConfig.sections.searchResult.uiConfig.columns.map((column) => {
              if (column.label === "SELECT") {
                return {
                  ...column,
                  updateOrderFunc: handleUpdateApplication,
                };
              }
              if (column.label === "APPLICATION_NUMBER") {
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
    // Logic for fetching custom API or Inbox data will be handled by Composer/UICustomizations preProcess
    // Here we might just want to track form selections if needed
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

  const handleCTCApplications = async (data, type) => {
    if (type === "reject") {
      // Close the EvidenceModal and open the reason modal
      setPendingRejectData(data);
      setRejectReason("");
      setShowModal(false);
      setShowRejectModal(true);
      return;
    }
    try {
      setIsLoading(true);
      const applicationData = data || data?.businessObject;
      const payload = {
        courtId: courtId,
        action: "APPROVE",
        tenantId: tenantId,
        applications: [
          {
            ctcApplicationNumber: applicationData?.ctcApplicationNumber,
            filingNumber: applicationData?.filingNumber,
            comments: "",
          },
        ],
      };
      await HomeService.updateBulkCTCApplications(payload);
      setShowModal(false);
      setUpdateCounter((prev) => prev + 1);
      setShowToast({ label: t("CTC_APPLICATION_ACCEPTED"), error: false });
    } catch (error) {
      console.error("handleCTCApplications error:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("CTC_APPLICATION_APPROVE_FAILED"), error: true, errorId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReject = async (reason) => {
    try {
      setIsLoading(true);
      const applicationData = pendingRejectData || pendingRejectData?.businessObject;
      const payload = {
        courtId: courtId,
        action: "REJECT",
        tenantId: tenantId,
        applications: [
          {
            ctcApplicationNumber: applicationData?.ctcApplicationNumber,
            filingNumber: applicationData?.filingNumber,
            comments: reason,
          },
        ],
      };
      await HomeService.updateBulkCTCApplications(payload);
      setShowRejectModal(false);
      setShowModal(false);
      setPendingRejectData(null);
      setRejectReason("");
      setUpdateCounter((prev) => prev + 1);
      setShowToast({ label: t("CTC_APPLICATION_REJECTED"), error: false });
    } catch (error) {
      console.error("handleConfirmReject error:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("CTC_APPLICATION_REJECT_FAILED"), error: true, errorId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAccept = async () => {
    // you have bulk list and then do the things
    try {
      setIsLoading(true);
      const bulkUpdate = bulkIssueList?.map((data) => {
        return {
          ctcApplicationNumber: data?.businessObject?.ctcApplicationNumber,
          filingNumber: data?.businessObject?.filingNumber,
          comments: "",
        };
      });
      const payload = {
        courtId: courtId,
        action: "APPROVE",
        tenantId: tenantId,
        applications: bulkUpdate,
      };
      await HomeService.updateBulkCTCApplications(payload);
      setShowToast({ label: t("BULK_ACCEPT_DONE"), error: false });
      setUpdateCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to process bulk CTC applications:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("BULK_ACCEPT_FAILED"), error: true, errorId });
    } finally {
      setIsLoading(false);
    }
  };

  const previewConfig = useMemo(() => {
    if (!selectedRowApplicationData) return [];
    const app = selectedRowApplicationData;
    const applicationType = t("APPLICATION_FOR_CERTIFIED_TRUE_COPY");
    const submissionDate = app?.auditDetails?.createdTime
      ? new Date(app.auditDetails.createdTime).toLocaleDateString("en-IN").replace(/\//g, "-")
      : "";
    const applicantName = app?.applicantName || "NA";

    return [
      { key: t("APPLICATION_TYPE"), value: applicationType },
      { key: t("SUBMISSION_DATE"), value: submissionDate },
      { key: t("APPLICATION_FILER"), value: applicantName },
    ];
  }, [selectedRowApplicationData, t]);

  const documentsForPreview = useMemo(() => {
    if (!selectedRowApplicationData) return [];
    const app = selectedRowApplicationData;
    const selectedDoc = app?.documents?.find?.((doc) => doc?.documentType === "SIGNED_CTC_APPLICATION");
    const primaryFileStore = selectedDoc?.fileStore || app?.documents?.[0]?.fileStore || null;

    const primaryDocType = selectedDoc?.documentType || app?.documents?.[0]?.documentType || "CTC Document";

    const affidavitfileStoreId = app?.affidavitDocument?.fileStore || null;
    const affidavitName = app?.affidavitDocument?.documentType || "Affadavit";

    return primaryFileStore
      ? [
          { fileStore: primaryFileStore, name: t(primaryDocType) },
          { fileStore: affidavitfileStoreId, name: t(affidavitName) },
        ]
      : [];
  }, [selectedRowApplicationData, t]);

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
          <div className="header">{t("Applications")}</div>
          <div className="review-process-page inbox-search-wrapper">
            {" "}
            <InboxSearchComposer
              key={`update_key_${updateCounter}`}
              customStyle={sectionsParentStyle}
              configs={config}
              onFormValueChange={onFormValueChange}
            ></InboxSearchComposer>{" "}
          </div>
        </div>
        <div className="bulk-submit-bar">
          <SubmitBar
            label={t("Accept Applications")}
            submit="submit"
            disabled={!bulkIssueList || bulkIssueList?.length === 0 || bulkIssueList?.every((item) => !item?.isSelected)}
            onSubmit={handleBulkAccept}
          />
        </div>
      </React.Fragment>
      {showModal && (
        <GenericPreviewModal
          t={t}
          header={"REVIEW_APPLICATION"}
          config={previewConfig}
          documents={documentsForPreview}
          handleBack={() => setShowModal(false)}
          saveLabel={"ACCEPT"}
          cancelLabel={"REJECT"}
          onSubmit={() => handleCTCApplications(selectedRowApplicationData, "accept")}
          onCancel={() => handleCTCApplications(selectedRowApplicationData, "reject")}
          showCustomChip={true}
          customChipText={selectedRowApplicationData?.status}
        />
      )}
      {showRejectModal && (
        <RejectCTCApplicationReasonModal
          t={t}
          onGoBack={() => {
            setShowRejectModal(false);
            setRejectReason("");
            setShowModal(true); // reopen EvidenceModal
          }}
          onReject={handleConfirmReject}
          reason={rejectReason}
          setReason={setRejectReason}
          isDisabled={isLoading}
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
      )}
    </React.Fragment>
  );
};

export default CTCApplications;
