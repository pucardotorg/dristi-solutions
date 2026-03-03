import { InboxSearchComposer, SubmitBar, Loader } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { bulkIssueCTCConfig } from "../../configs/BulkIssueCTCConfig";
import IssueCTCModal from "./IssueCTCModal";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const BulkIssueCTC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getStateId();

  const [isLoading, setIsLoading] = useState(false);
  const [bulkIssueList, setBulkIssueList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);

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

  const handleBulkIssue = () => {
  };

  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <div className={"bulk-esign-order-view select"}>
            <div className="header" style={{ marginBottom: "20px", fontSize: "2rem", fontWeight: "700" }}>{t("Issue Certified True Copy")}</div>
            <div className="review-process-page inbox-search-wrapper">
              {" "}
              <InboxSearchComposer
                key={`update_key`}
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
      )}
      {showModal && (
        <IssueCTCModal
          rowData={selectedRowData}
          setShowModal={setShowModal}
          handleIssue={(rowData) => {
            // Add issue logic here for the 'Issue' button inside the modal
            console.log("Issuing specific item: ", rowData);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default BulkIssueCTC;