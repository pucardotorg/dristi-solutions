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

const InboxSearchPlayground = () => {
  const { t } = useTranslation();

  // ============ STEP 6: CUSTOM CELL RENDERING ============
  // Format Status column to display nicely instead of backend codes
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
        <h3>Step 6: Custom Cell Rendering (additionalCustomizations)</h3>
        <p><strong>NEW:</strong> Format Status column from <code>CASE_ADMITTED</code> → <code>Case Admitted</code></p>
        <p><strong>Key Learning:</strong></p>
        <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
          <li><code>additionalCustomization: true</code> on column config</li>
          <li><code>additionalCustomizations(row, key, column, value, t)</code> in UICustomizations</li>
          <li>Return JSX or formatted value for custom display</li>
          <li>Can add colors, badges, icons, links, etc.</li>
        </ul>
        <p><strong>Notice:</strong> Status column now shows "Case Admitted" instead of "CASE_ADMITTED"</p>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "20px", backgroundColor: "#fafafa" }}>
        <InboxSearchComposer configs={minimalConfig} />
      </div>

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
