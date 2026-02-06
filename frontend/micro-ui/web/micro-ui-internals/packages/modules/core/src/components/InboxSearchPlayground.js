import React, { useState, useMemo, Fragment, useEffect } from "react";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";

/**
 * InboxSearchComposer Learning Playground
 * 
 * This is a safe, isolated page for learning InboxSearchComposer.
 * It has NO dependencies on business flows and NO shared state mutations.
 * 
 * Route: /employee/inbox-search-composer-playground
 */

import React from "react";

const InboxSearchPlayground = () => {
  const { t } = useTranslation();
  const [selectedRows, setSelectedRows] = React.useState([]);

  // Handle row selection
  const handleRowSelection = (row, isSelected) => {
    if (isSelected) {
      setSelectedRows(prev => [...prev, row]);
    } else {
      setSelectedRows(prev => prev.filter(r => r.id !== row.id));
    }
  };

  // ============ STEP 7: ACTION BUTTONS ============
  // Add Print action button to each row
  const tenantId = Digit.ULBService.getCurrentTenantId();
  
  const minimalConfig = {
    label: "PLAYGROUND_CASE_SEARCH",
    type: "search",
    apiDetails: {
      serviceName: "/case/v1/_search",
      requestParam: {
        tenantId: tenantId,
        limit: 10,
        offset: 0,
      },
      requestBody: {
        apiOperation: "SEARCH",
        Individual: { tenantId: tenantId },
        criteria: [
          {
            tenantId: tenantId,
            pagination: {
              limit: 10,
              offSet: 0,
            },
          },
        ],
      },
      minParametersForSearchForm: 0,
      masterName: "commonUiConfig",
      moduleName: "playgroundCaseSearch",  // Step 5: Links to UICustomizations.playgroundCaseSearch.preProcess
      tableFormJsonPath: "requestBody.criteria.[0].pagination",
      searchFormJsonPath: "requestBody.criteria.[0]",
    },
    sections: {
      search: {
        uiConfig: {
          primaryLabel: "ES_COMMON_SEARCH",
          secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
          minReqFields: 0,
          defaultValues: {
            filingNumber: "",
            caseNumber: "",
            status: "",  // Step 5: Add default for dropdown
          },
          fields: [
            {
              label: "Filing Number",
              type: "text",
              isMandatory: false,
              key: "filingNumber",
              populators: {
                name: "filingNumber",
              },
            },
            {
              label: "Case Number",
              type: "text",
              isMandatory: false,
              key: "caseNumber",
              populators: {
                name: "caseNumber",
              },
            },
            // ========== STEP 5: DROPDOWN FIELD ==========
            {
              label: "Case Status",
              type: "dropdown",
              isMandatory: false,
              key: "status",
              populators: {
                name: "status",
                optionsKey: "name",           // Which key to display in dropdown
                options: [
                  { code: "PENDING_REGISTRATION", name: "Pending Registration" },
                  { code: "CASE_ADMITTED", name: "Case Admitted" },
                  { code: "PENDING_ADMISSION", name: "Pending Admission" },
                  { code: "PENDING_RESPONSE", name: "Pending Response" },
                  { code: "PENDING_NOTICE", name: "Pending Notice" },
                ],
              },
            },
          ],
        },
        show: true,
      },
      searchResult: {
        uiConfig: {
          columns: [
            {
              label: "",  // Checkbox column
              jsonPath: "id",
              additionalCustomization: true,
              sortable: false,
              width: 50,
            },
            {
              label: "Filing Number",
              jsonPath: "filingNumber",
            },
            {
              label: "Case Number",
              jsonPath: "caseNumber",
            },
            {
              label: "Case Category",
              jsonPath: "caseCategory",
            },
            {
              label: "Status",
              jsonPath: "status",
              additionalCustomization: true,  // Step 6: Enable custom rendering
            },
            {
              label: "Actions",
              jsonPath: "id",
              additionalCustomization: true,  // Enable custom rendering for action buttons
            },
          ],
          enableGlobalSearch: false,
          enableColumnSort: true,
          resultsJsonPath: "criteria.[0].responseList",
        },
        show: true,
      },
    },
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>InboxSearchComposer Learning Playground</h2>
      
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "8px" }}>
        <h3>Step 7: Action Buttons</h3>
        <p><strong>NEW:</strong> Added Print action button to each row</p>
        <p><strong>Key Learning:</strong></p>
        <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
          <li>Add action column with <code>additionalCustomization: true</code></li>
          <li>Return button JSX from <code>additionalCustomizations</code></li>
          <li>Use <code>onClick</code> to handle button actions</li>
          <li>Access row data via first parameter in <code>additionalCustomizations</code></li>
        </ul>
        <p><strong>Try:</strong> Click the Print button on any row!</p>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px", backgroundColor: "#fafafa" }}>
        <InboxSearchComposer 
          configs={{
            ...minimalConfig,
            customProps: { selectedRows, onRowSelect: handleRowSelection }
          }} 
        />
      </div>

      {/* Selected Items Summary */}
      {selectedRows.length > 0 && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1976d2',
          color: 'white',
          padding: '16px',
          marginTop: '20px',
          borderRadius: '8px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>
              {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
            </span>
            <div style={{ fontSize: '14px', marginTop: '4px', opacity: 0.9 }}>
              {selectedRows.map(row => row.caseNumber).join(', ')}
            </div>
          </div>
          <button
            onClick={() => setSelectedRows([])}
            style={{
              backgroundColor: 'white',
              color: '#1976d2',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Clear Selection
          </button>
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3e0", borderRadius: "8px" }}>
        <h4>Current Config (Step 6):</h4>
        <pre style={{ backgroundColor: "#333", color: "#0f0", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
{JSON.stringify(minimalConfig, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default InboxSearchPlayground;
