import { InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { CTCApplicationsConfig } from "../../configs/CTCApplicationsConfig";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const CTCApplications = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getStateId();

  const [isLoading, setIsLoading] = useState(false);
  const [bulkIssueList, setBulkIssueList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const EvidenceModal = window?.Digit?.ComponentRegistryService?.getComponent("EvidenceModal");
  const [updateCounter, setUpdateCounter] = useState(0);

  const handleUpdateApplication = (applicationData, checked) => {
    setBulkIssueList((prev) => {
      if (!prev || prev.length === 0) {
        return [{ ...applicationData, isSelected: checked }];
      }

      const updated = prev?.map((item) => {
        if (item?.businessObject?.applicationNumber !== applicationData?.businessObject?.applicationNumber) return item;
        return {
          ...item,
          isSelected: checked,
        };
      });

      const hasMatch = prev.some((item) => item?.businessObject?.applicationNumber === applicationData?.businessObject?.applicationNumber);
      if (!hasMatch) {
        updated.push({ ...applicationData, isSelected: checked });
      }

      return updated.filter(
        (item) => item.isSelected || item?.businessObject?.applicationNumber === applicationData?.businessObject?.applicationNumber
      );
    });
  };

  const handleRowClick = (rowData) => {
    setSelectedRowData(rowData?.original);
    setShowModal(true);
  };

  const config = useMemo(() => {
    return {
      ...CTCApplicationsConfig,
      apiDetails: {
        ...CTCApplicationsConfig.apiDetails,
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

  const handleCTCApplications = (data, type) => {
    // based on type we will accept or reject applications
  };

  const handleBulkAccept = () => {
    // you have bulk list and then do the things
  };

  console.log(bulkIssueList, "klkl");

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
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
      )}
      {showModal && (
        <EvidenceModal
          documentSubmission={[]} // prepare the data for evidenceModal
          setShow={setShowModal}
          userRoles={userRoles}
          modalType={"CTC_APPLICATIONS"}
          setUpdateCounter={setUpdateCounter}
          handleCTCApplications={handleCTCApplications}
          // add based on usage
        />
      )}
    </React.Fragment>
  );
};

export default CTCApplications;
