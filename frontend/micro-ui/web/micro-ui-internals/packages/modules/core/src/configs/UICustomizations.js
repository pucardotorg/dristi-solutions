import React from "react";

/**
 * UICustomizations for Core Module
 * 
 * Contains preProcess functions for InboxSearchComposer configs
 * used in playground and other core components.
 */

export const UICustomizations = {
  // Playground config for learning InboxSearchComposer
  playgroundCaseSearch: {
    preProcess: (requestCriteria, additionalDetails) => {
      const tenantId = Digit.ULBService.getCurrentTenantId();
      
      // Extract search form values
      const searchForm = requestCriteria?.state?.searchForm || {};
      
      // Transform dropdown values from { code, name } to array of codes
      // API expects: status: ["CASE_ADMITTED"] (array of strings)
      const transformedCriteria = {
        tenantId: tenantId,
        ...(searchForm.filingNumber && { filingNumber: searchForm.filingNumber }),
        ...(searchForm.caseNumber && { caseNumber: searchForm.caseNumber }),
        // Extract code from dropdown and wrap in array (API expects array of strings)
        ...(searchForm.status?.code && { status: [searchForm.status.code] }),
        pagination: {
          limit: requestCriteria?.state?.tableForm?.limit || 10,
          offSet: requestCriteria?.state?.tableForm?.offset || 0,
        },
      };

      return {
        ...requestCriteria,
        body: {
          apiOperation: "SEARCH",
          Individual: { tenantId: tenantId },
          criteria: [transformedCriteria],
        },
      };
    },

    // Step 6: Custom cell rendering for table columns
    // Called when column has additionalCustomization: true
    additionalCustomizations: (row, key, column, value, t, searchResult) => {
      // key is the LABEL of the column (e.g., "Status"), NOT jsonPath!
      switch (key) {
        case "Status":  // NOTE: key is the column LABEL, not jsonPath!
          // Format backend code to readable string
          // "CASE_ADMITTED" → "Case Admitted"
          if (!value) return "-";
          
          const formatted = value
            .split("_")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
          
          // Return styled JSX with color based on status
          const statusColors = {
            "CASE_ADMITTED": { bg: "#e8f5e9", color: "#2e7d32" },
            "PENDING_REGISTRATION": { bg: "#fff3e0", color: "#ef6c00" },
            "PENDING_ADMISSION": { bg: "#e3f2fd", color: "#1565c0" },
            "PENDING_RESPONSE": { bg: "#fce4ec", color: "#c2185b" },
            "PENDING_NOTICE": { bg: "#f3e5f5", color: "#7b1fa2" },
          };
          
          const style = statusColors[value] || { bg: "#f5f5f5", color: "#616161" };
          
          return (
            <span style={{
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: style.bg,
              color: style.color,
              fontWeight: "500",
              fontSize: "12px",
            }}>
              {formatted}
            </span>
          );
        
        default:
          return value || "-";
      }
    },
  },
};
