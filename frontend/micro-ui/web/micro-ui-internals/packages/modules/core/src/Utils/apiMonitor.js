/**
 * API Call Monitoring System
 *
 * This module automatically intercepts all Axios requests and responses to provide
 * comprehensive monitoring of API traffic without modifying existing code.
 *
 * Features:
 * - Intercepts all Axios requests and responses
 * - Tracks timing, data volume, and payloads
 * - Logs to console with color coding
 * - Stores detailed call history
 * - Provides analysis functions
 */

import axiosInstance from "./axiosInstance";

// Configuration
const config = {
  maxStoredCalls: 1000, // Maximum number of API calls to store in memory
  logToConsole: true, // Whether to log API calls to console
  warnSlowRequestsMs: 2000, // Threshold for slow request warnings (ms)
  warnLargeResponseKb: 500, // Threshold for large response warnings (KB)
  includeHeaders: true, // Whether to include headers in stored data
  includeFullPayload: true, // Whether to store full request/response bodies
  redactSensitiveInfo: true, // Whether to redact sensitive information (passwords, tokens)
  sensitiveFields: ["password", "token", "authToken", "authorization", "key", "secret"],
};

let interactionPending = false;

// Storage for API call data
const apiCallData = {
  calls: [], // Array of API call objects
  isRecording: true, // Whether monitoring is active
  startTime: Date.now(), // When monitoring started
};

// Get current page path
const getCurrentPage = () => {
  return window.location.pathname;
};

// Format data size for display
const formatDataSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Calculate size of object in bytes (approximate)
const calculateDataSize = (data) => {
  if (!data) return 0;
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch (e) {
    return 0;
  }
};

// Redact sensitive information from objects
const redactSensitiveData = (data) => {
  if (!data || typeof data !== "object" || config.redactSensitiveInfo === false) return data;

  const redacted = { ...data };

  const redactObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    Object.keys(obj).forEach((key) => {
      if (config.sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = "***REDACTED***";
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        redactObject(obj[key]);
      }
    });

    return obj;
  };

  return redactObject(redacted);
};

// Console logging with colors
const logWithColors = (type, method, url, status, duration, requestSize, responseSize, error = null) => {
  if (!config.logToConsole) return;

  const getStatusColor = (status) => {
    if (!status) return "color: #f44336"; // Red for no status (error)
    if (status < 300) return "color: #4caf50"; // Green for 2xx
    if (status < 400) return "color: #ff9800"; // Orange for 3xx
    if (status < 500) return "color: #ff9800"; // Orange for 4xx
    return "color: #f44336"; // Red for 5xx
  };

  const getTypeColor = (type) => {
    if (type === "OUT") return "color: #2196f3"; // Blue for outgoing
    if (type === "IN") return getStatusColor(status);
    return "color: #9c27b0"; // Purple for other
  };

  const typeStyle = getTypeColor(type);
  const statusStyle = getStatusColor(status);

  // Format the log message
  if (type === "OUT") {
    // console.groupCollapsed(`%c[API OUT] ${method} ${url}`, `${typeStyle}; font-weight: bold;`);
    // console.log(`→ Request: ${formatDataSize(requestSize)}`);
    // console.groupEnd();
  } else if (type === "IN") {
    // console.groupCollapsed(`%c[API IN] ${method} ${url} - ${status}`, `${statusStyle}; font-weight: bold;`);
    // console.log(`→ Duration: ${duration}ms | Response: ${formatDataSize(responseSize)} | Total: ${formatDataSize(requestSize + responseSize)}`);
    // console.groupEnd();
  } else if (type === "ERROR") {
    // console.groupCollapsed(`%c[API ERROR] ${method} ${url} - ${status || "FAILED"}`, "color: #f44336; font-weight: bold;");
    // console.log(`→ Error: ${(error && error.message) || "Unknown error"} | Duration: ${duration}ms`);
    // console.groupEnd();
  }

  // Add warnings for slow requests or large responses
  if (duration > config.warnSlowRequestsMs) {
    // console.warn(`⚠️ Slow request detected: ${url} (${duration}ms)`);
  }

  if (responseSize / 1024 > config.warnLargeResponseKb) {
    // console.warn(`⚠️ Large response detected: ${url} (${formatDataSize(responseSize)})`);
  }
};

// Store API call data
const storeApiCall = (callData) => {
  if (!apiCallData.isRecording) return;

  // Add to beginning of array for most recent first
  apiCallData.calls.unshift(callData);

  // Limit stored calls to configured maximum
  if (apiCallData.calls.length > config.maxStoredCalls) {
    apiCallData.calls = apiCallData.calls.slice(0, config.maxStoredCalls);
  }
};

// Set up interceptors
const setupInterceptors = () => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Skip filestore API calls with no fileStoreIds
      const isFileStoreApi = config.url && config.url.includes("/filestore/v1/files/url");
      if (isFileStoreApi && (!config.params || !config.params.fileStoreIds)) {
        // Skip monitoring for these calls
        return config;
      }

      // 🔑 AUTO RESET LOGS ON NEW INTERACTION
      if (interactionPending) {
        apiCallData.calls = [];
        apiCallData.startTime = Date.now();
        interactionPending = false;

        // console.log("%c[API Monitor] New interaction detected → logs reset", "color:#38bdf8;font-weight:bold;");
      }

      // Add timestamp to track duration
      config.metadata = { startTime: Date.now() };

      // Calculate request size
      const requestSize = calculateDataSize(config.data);

      // Store request data
      const page = getCurrentPage();
      const method = (config.method && config.method.toUpperCase()) || "UNKNOWN";
      const url = config.url;

      // Log outgoing request
      logWithColors("OUT", method, url, null, null, requestSize, 0);

      // console.log("config.includeHeaders", config.includeHeaders, "h", config.includeFullPayload);

      // Store initial call data
      const callData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        page,
        method,
        url,
        endpoint: url.split("?")[0], // URL without query params
        requestSize,
        status: null,
        duration: null,
        responseSize: 0,
        error: null,
        // Include full data if configured
        ...(config.includeFullPayload
          ? {
              requestBody: config.redactSensitiveInfo ? redactSensitiveData(config.data) : config.data,
              requestParams: config.params,
            }
          : {}),
        // Include headers if configured
        ...(config.includeHeaders
          ? {
              requestHeaders: config.redactSensitiveInfo ? redactSensitiveData(config.headers) : config.headers,
            }
          : {}),
      };

      // Store call data
      storeApiCall(callData);

      return config;
    },
    (error) => {
      console.error("Request error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      // Skip if no metadata (not tracked by our request interceptor)
      // or if it's a filestore API call with no fileStoreIds
      const isFileStoreApi = response.config.url && response.config.url.includes("/filestore/v1/files/url");
      if (!response.config.metadata || (isFileStoreApi && (!response.config.params || !response.config.params.fileStoreIds))) {
        if (response.config.url && response.config.url.includes("/filestore/v1/files/")) {
        }
        return response;
      }

      try {
        // Calculate timing and sizes
        const duration = Date.now() - response.config.metadata.startTime;

        // Check for Content-Length header for file downloads
        let responseSize = 0;
        const contentLength = response.headers && response.headers["content-length"];
        const contentType = response.headers && response.headers["content-type"];

        // If it's a binary response or has content-length, use that value
        if (contentLength) {
          responseSize = parseInt(contentLength, 10);
        } else if (
          contentType &&
          (contentType.includes("application/pdf") ||
            contentType.includes("image/") ||
            contentType.includes("application/octet-stream") ||
            contentType.includes("application/zip"))
        ) {
          // For binary responses without content-length, try to get size from response data
          if (response.data instanceof Blob || response.data instanceof ArrayBuffer) {
            responseSize = response.data.size || response.data.byteLength || 0;
          } else {
            responseSize = calculateDataSize(response.data);
          }
        } else {
          // Default calculation for JSON/text responses
          responseSize = calculateDataSize(response.data);
        }

        const requestSize = calculateDataSize(response.config.data);

        // Get request details
        const method = (response.config.method && response.config.method.toUpperCase()) || "UNKNOWN";
        const url = response.config.url;
        const status = response.status;

        // Log successful response
        logWithColors("IN", method, url, status, duration, requestSize, responseSize);

        // Find and update the stored call data
        const callIndex = apiCallData.calls.findIndex((call) => call.method === method && call.url === url && !call.status);

        if (callIndex !== -1) {
          apiCallData.calls[callIndex] = {
            ...apiCallData.calls[callIndex],
            status,
            duration,
            responseSize,
            responseTimestamp: Date.now(),
          };
        }
      } catch (e) {
        console.error("Error in API monitor response interceptor:", e);
      }

      // Always return the original response unchanged
      return response;
    },
    (error) => {
      // Handle error response
      try {
        const response = error.response;
        const config = error.config;

        // Skip if no metadata or if it's a filestore API call with no fileStoreIds
        const isFileStoreApi = config && config.url && config.url.includes("/filestore/v1/files/url");
        if (!config || !config.metadata || (isFileStoreApi && (!config.params || !config.params.fileStoreIds))) {
          return Promise.reject(error);
        }

        // Calculate timing
        const duration = Date.now() - config.metadata.startTime;
        const method = (config.method && config.method.toUpperCase()) || "UNKNOWN";
        const url = config.url;
        const status = response && response.status;
        const requestSize = calculateDataSize(config.data);
        const responseSize = calculateDataSize(response && response.data);

        // Log error
        logWithColors("ERROR", method, url, status, duration, requestSize, responseSize, error);

        // Find and update the stored call data
        const callIndex = apiCallData.calls.findIndex((call) => call.method === method && call.url === url && !call.status);

        if (callIndex !== -1) {
          apiCallData.calls[callIndex] = {
            ...apiCallData.calls[callIndex],
            status: status || 0,
            duration,
            responseSize,
            error: {
              message: error.message,
              code: error.code,
              ...(response ? { responseStatus: response.status } : {}),
            },
            responseTimestamp: Date.now(),
          };
        }
      } catch (e) {
        console.error("Error in API monitor error interceptor:", e);
      }

      // Always reject with the original error
      return Promise.reject(error);
    }
  );
};

const setupInteractionListeners = () => {
  const markInteraction = () => {
    interactionPending = true;
  };

  document.addEventListener("click", markInteraction, true);
  document.addEventListener("keydown", markInteraction, true);
  document.addEventListener("change", markInteraction, true);
};

// API Monitor public methods
const apiMonitor = {
  // Initialize the API monitor
  init: () => {
    setupInteractionListeners();
    setupInterceptors();
    // console.log("%c[API Monitor] Initialized and monitoring API calls", "color: #4caf50; font-weight: bold;");
  },

  // Get all recorded API calls
  getAllCalls: () => [...apiCallData.calls],

  // Clear recorded data
  clear: () => {
    apiCallData.calls = [];
    apiCallData.startTime = Date.now();
  },

  // Stop recording
  stop: () => {
    apiCallData.isRecording = false;
  },

  // Start recording
  start: () => {
    apiCallData.isRecording = true;
    console.log("API Monitor: Recording started");
  },

  // Get calls for a specific page
  getCallsForPage: (page) => {
    return apiCallData.calls.filter((call) => call.page === page);
  },

  // Get calls for a specific endpoint
  getCallsForEndpoint: (endpoint) => {
    return apiCallData.calls.filter((call) => call.endpoint === endpoint || call.url === endpoint);
  },

  // Download all data as JSON
  downloadReport: () => {
    const dataStr = JSON.stringify(apiCallData.calls, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportName = `api-monitor-report-${new Date().toISOString()}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  },

  // Download data as CSV
  downloadCSV: () => {
    // Create CSV header
    const headers = ["timestamp", "page", "method", "url", "status", "duration", "requestSize", "responseSize", "error"];

    // Convert calls to CSV rows
    const rows = apiCallData.calls.map((call) => [
      call.timestamp,
      call.page,
      call.method,
      call.url,
      call.status || "",
      call.duration || "",
      call.requestSize,
      call.responseSize || "",
      call.error ? call.error.message : "",
    ]);

    // Combine header and rows
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

    // Create download link
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const exportName = `api-monitor-data-${new Date().toISOString()}.csv`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  },

  // Get statistics and analysis
  getStats: () => {
    const calls = apiCallData.calls;

    // Skip if no data
    if (calls.length === 0) {
      return {
        summary: {
          totalCalls: 0,
          totalErrors: 0,
          errorRate: "0%",
          totalDataKB: "0",
          totalDataMB: "0",
          avgDuration: "0ms",
          avgCallSizeKB: "0",
          totalTime: "0ms",
        },
        byPage: [],
        heaviestEndpoints: [],
        slowestEndpoints: [],
        mostCalledEndpoints: [],
      };
    }

    // Calculate summary statistics
    const completedCalls = calls.filter((call) => call.status !== null);
    const errorCalls = calls.filter((call) => call.error || (call.status && call.status >= 400));

    const totalDataBytes = calls.reduce((sum, call) => sum + call.requestSize + (call.responseSize || 0), 0);
    const totalRequestSize = calls.reduce((sum, call) => sum + call.requestSize, 0);
    const totalResponseSize = calls.reduce((sum, call) => sum + (call.responseSize || 0), 0);
    const totalRequestSizeKB = (totalRequestSize / 1024).toFixed(2);
    const totalResponseSizeKB = (totalResponseSize / 1024).toFixed(2);
    const totalDataKB = (totalDataBytes / 1024).toFixed(2);
    const totalDataMB = (totalDataBytes / (1024 * 1024)).toFixed(2);

    const totalTime = Math.round(completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0));

    const avgDuration =
      completedCalls.length > 0 ? Math.round(completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / completedCalls.length) : 0;

    const avgCallSizeKB =
      completedCalls.length > 0
        ? (completedCalls.reduce((sum, call) => sum + call.requestSize + (call.responseSize || 0), 0) / completedCalls.length / 1024).toFixed(2)
        : 0;

    // Group by page
    const pageMap = {};
    calls.forEach((call) => {
      if (!pageMap[call.page]) {
        pageMap[call.page] = {
          page: call.page,
          calls: [],
          endpoints: new Set(),
        };
      }
      pageMap[call.page].calls.push(call);
      pageMap[call.page].endpoints.add(call.endpoint);
    });

    const byPage = Object.values(pageMap)
      .map((page) => {
        const totalSize = page.calls.reduce((sum, call) => sum + call.requestSize + (call.responseSize || 0), 0);
        const totalSizeKB = (totalSize / 1024).toFixed(2);
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

        const avgResponseSize =
          page.calls.filter((call) => call.responseSize).length > 0
            ? page.calls.filter((call) => call.responseSize).reduce((sum, call) => sum + call.responseSize, 0) /
              page.calls.filter((call) => call.responseSize).length
            : 0;

        return {
          page: page.page,
          callCount: page.calls.length,
          uniqueEndpoints: page.endpoints.size,
          totalSizeKB,
          totalSizeMB: totalSizeMB !== "0.00" ? totalSizeMB : undefined,
          avgResponseSizeKB: (avgResponseSize / 1024).toFixed(2),
        };
      })
      .sort((a, b) => b.callCount - a.callCount);

    // Group by endpoint
    const endpointMap = {};
    calls.forEach((call) => {
      const key = `${call.method} ${call.endpoint}`;
      if (!endpointMap[key]) {
        endpointMap[key] = {
          endpoint: key,
          calls: [],
        };
      }
      endpointMap[key].calls.push(call);
    });

    // Calculate endpoint statistics
    const endpointStats = Object.values(endpointMap).map((endpoint) => {
      const completedEndpointCalls = endpoint.calls.filter((call) => call.status !== null);

      const totalRequestSize = endpoint.calls.reduce((sum, call) => sum + call.requestSize, 0);
      const totalResponseSize = endpoint.calls.reduce((sum, call) => sum + (call.responseSize || 0), 0);
      const totalRequestSizeKB = (totalRequestSize / 1024).toFixed(2);
      const totalResponseSizeKB = (totalResponseSize / 1024).toFixed(2);

      const totalSize = endpoint.calls.reduce((sum, call) => sum + call.requestSize + (call.responseSize || 0), 0);
      const totalSizeKB = (totalSize / 1024).toFixed(2);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

      const avgDuration =
        completedEndpointCalls.length > 0
          ? completedEndpointCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / completedEndpointCalls.length
          : 0;

      const maxDuration = completedEndpointCalls.length > 0 ? Math.max(...completedEndpointCalls.map((call) => call.duration || 0)) : 0;

      const avgResponseSize =
        completedEndpointCalls.filter((call) => call.responseSize).length > 0
          ? completedEndpointCalls.filter((call) => call.responseSize).reduce((sum, call) => sum + call.responseSize, 0) /
            completedEndpointCalls.filter((call) => call.responseSize).length
          : 0;

      return {
        endpoint: endpoint.endpoint,
        callCount: endpoint.calls.length,
        totalSizeKB,
        totalRequestSizeKB,
        totalResponseSizeKB,
        totalSizeMB: totalSizeMB !== "0.00" ? totalSizeMB : undefined,
        avgResponseSizeKB: (avgResponseSize / 1024).toFixed(2),
        avgDuration: Math.round(avgDuration),
        maxDuration,
      };
    });

    // Sort endpoints by different metrics
    const heaviestEndpoints = [...endpointStats].sort((a, b) => parseFloat(b.totalSizeKB) - parseFloat(a.totalSizeKB));

    const slowestEndpoints = [...endpointStats].filter((e) => e.avgDuration > 0).sort((a, b) => b.avgDuration - a.avgDuration);

    const mostCalledEndpoints = [...endpointStats].sort((a, b) => b.callCount - a.callCount);
    return {
      summary: {
        totalCalls: calls.length,
        totalErrors: errorCalls.length,
        errorRate: `${((errorCalls.length / calls.length) * 100).toFixed(2)}%`,
        totalDataKB,
        totalRequestSizeKB,
        totalResponseSizeKB,
        totalDataMB,
        avgDuration: `${avgDuration}ms`,
        avgCallSizeKB,
        totalTime: `${totalTime}ms`,
        urlPath: Object.values(pageMap)[0].page,
        uniqueEndpoints: Object.values(pageMap)[0].endpoints.size,
      },
      byPage,
      heaviestEndpoints,
      slowestEndpoints,
      mostCalledEndpoints,
    };
  },
};

// Expose API monitor to window for console access
window.apiMonitor = apiMonitor;

// Export for module usage
export default apiMonitor;
