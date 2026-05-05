import { Card } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useHistory } from "react-router-dom";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { useTranslation } from "react-i18next";
import { Urls } from "../../hooks";
import AuthenticatedLink from "../../Utils/authenticatedLink";
import { DocumentViewErrorIcon } from "../../icons/svgIndex";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

// Global cache: fileStoreId -> { blobUrl, fetchPromise }
// Attached to window to ensure a single shared instance across all bundles/chunks
if (!window.__docViewerFileStoreCache) {
  window.__docViewerFileStoreCache = new Map();
}
const fileStoreCache = window.__docViewerFileStoreCache;

// Revoke all cached blob URLs and clear the cache
const clearFileStoreCache = () => {
  for (const [key, entry] of fileStoreCache) {
    if (entry.blobUrl) {
      URL.revokeObjectURL(entry.blobUrl);
    }
  }
  fileStoreCache.clear();
};

const DocViewerWrapper = ({
  style,
  fileStoreId,
  tenantId,
  displayFilename,
  documentName,
  selectedDocs = [],
  docViewerCardClassName,
  docViewerStyle,
  showDownloadOption = true,
  docWidth = "262px",
  docHeight = "206px",
  errorHeight = "440px",
  errorStyleSmallType = null,
  preview,
  pdfZoom = 1.1,
  isLocalizationRequired = true,
  handleImageModalOpen,
  disableInnerViewerScroll = false,
}) => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");
  const history = useHistory();

  // Track current filingNumber to detect case switches
  const prevFilingNumberRef = useRef(new URLSearchParams(window.location.search).get("filingNumber"));

  // Clear cache when user navigates away from case view pages or switches to a different case
  useEffect(() => {
    const unlisten = history.listen((location) => {
      const newParams = new URLSearchParams(location.search);
      const newFilingNumber = newParams.get("filingNumber");

      if (!location.pathname.includes("view-case")) {
        // Left case view entirely
        clearFileStoreCache();
        prevFilingNumberRef.current = null;
      } else if (prevFilingNumberRef.current && newFilingNumber && newFilingNumber !== prevFilingNumberRef.current) {
        // Still on view-case but switched to a different case
        clearFileStoreCache();
        prevFilingNumberRef.current = newFilingNumber;
      } else {
        prevFilingNumberRef.current = newFilingNumber;
      }
    });
    return () => unlisten();
  }, [history]);

  const [docUrl, setDocUrl] = useState(() => {
    // Initialize from cache if blob is already available
    const cached = fileStoreId && fileStoreCache.get(fileStoreId);
    return cached?.blobUrl || null;
  });
  const [docError, setDocError] = useState(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const uri = fileStoreId && `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;

  const headers = { "auth-token": token };

  // Creates the actual fetch, stores it as a shared promise in the cache
  const doFetch = useCallback(async () => {
    const fetchPromise = (async () => {
      const res = await axiosInstance.get(uri, {
        headers,
        responseType: "blob",
      });
      if (res.status < 200 || res.status >= 300) {
        const error = new Error("Error fetching file");
        error.status = res.status;
        throw error;
      }
      const blob = res.data;
      return URL.createObjectURL(blob);
    })();

    // Store the promise in cache so other instances can await it
    const entry = fileStoreCache.get(fileStoreId) || {};
    entry.fetchPromise = fetchPromise;
    fileStoreCache.set(fileStoreId, entry);

    return fetchPromise;
  }, [fileStoreId, uri]);

  // Fetch or reuse cached result
  const fetchRemoteDoc = useCallback(async () => {
    if (!fileStoreId) return;

    const cached = fileStoreCache.get(fileStoreId);

    // 1. Already have blob URL cached — use it
    if (cached?.blobUrl) {
      setDocUrl(cached.blobUrl);
      return;
    }

    setLoading(true);
    setDocError(null);

    try {
      let blobUrl;

      // 2. Another instance already started fetching — await the same promise
      if (cached?.fetchPromise) {
        blobUrl = await cached.fetchPromise;
      } else {
        // 3. First fetch — start it and share the promise
        blobUrl = await doFetch();
      }

      // Store the resolved blobUrl in cache
      const entry = fileStoreCache.get(fileStoreId) || {};
      entry.blobUrl = blobUrl;
      fileStoreCache.set(fileStoreId, entry);

      if (mountedRef.current) setDocUrl(blobUrl);
    } catch (err) {
      // Clear the failed promise from cache so retry can work
      const entry = fileStoreCache.get(fileStoreId);
      if (entry) {
        entry.fetchPromise = null;
        fileStoreCache.set(fileStoreId, entry);
      }
      if (mountedRef.current) {
        setDocError({
          status: err.status || err?.response?.status,
          message: err.message,
        });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fileStoreId, doFetch]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    fetchRemoteDoc();

    return () => {
      mountedRef.current = false;
      // Do NOT clear cache on unmount — the remounted instance needs it
    };
  }, [fileStoreId]);

  // DOCUMENT LIST (LOCAL OR REMOTE)
  const documents = fileStoreId
    ? docUrl
      ? [{ uri: docUrl, fileName: displayFilename || "document" }]
      : []
    : selectedDocs.map((file) => ({
        uri: window.URL.createObjectURL(file),
        fileName: file?.name,
      }));


  return (
    <div className={`docviewer-wrapper ${disableInnerViewerScroll ? "single-scroll-doc-viewer" : ""}`} id="docviewer-id">
      <Card
        className={docViewerCardClassName}
        style={{ ...docViewerStyle, border: "none", backgroundColor: docError ? " #F9FAFB" : "white" }}
        onClick={handleImageModalOpen ? () => handleImageModalOpen(fileStoreId, displayFilename) : undefined}
      >
        {/* SKELETON LOADER (REPLACES 'Loading...' TEXT)          */}
        {loading && (
          <div
            style={{
              width: docWidth,
              height: docHeight,
              background: "#e5e7eb",
              borderRadius: "6px",
              animation: "pulse 1.5s infinite",
            }}
          />
        )}

        <style>
          {`
            @keyframes pulse {
              0% { opacity: .6; }
              50% { opacity: 1; }
              100% { opacity: .6; }
            }
            .single-scroll-doc-viewer #react-doc-viewer,
            .single-scroll-doc-viewer .react-doc-viewer,
            .single-scroll-doc-viewer .react-pdf__Document {
              overflow-y: visible !important;
              max-height: none !important;
            }
          `}
        </style>

        {/* ERROR STATE WITH RETRY BUTTON                         */}
        {docError && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: docWidth,
              height: errorStyleSmallType ? "206px" : errorHeight,
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "red",
              textAlign: "center",
              ...style,
            }}
          >
            <div
              style={{
                borderRadius: "100px",
                backgroundColor: "#FFE2E2",

                ...(errorStyleSmallType ? { margin: "8px 0", padding: "14px 16px" } : { margin: "8px 0", padding: "24px" }),
              }}
            >
              <DocumentViewErrorIcon width={errorStyleSmallType ? "32" : "48"} height={errorStyleSmallType ? "32" : "48"}></DocumentViewErrorIcon>
            </div>
            <p
              style={{
                color: "#101828",
                fontWeight: "500",
                ...(errorStyleSmallType
                  ? { fontSize: "18px", lineHeight: "24px", margin: "4px 0" }
                  : { fontSize: "24px", lineHeight: "36px", margin: "4px 0", letterSpacing: "0.07px" }),
              }}
            >
              {t("Unable to load Document")}
            </p>
            <p
              style={{
                color: "#4A5565",
                ...(errorStyleSmallType
                  ? { fontSize: "12px", lineHeight: "16px", margin: "4px 0" }
                  : { fontSize: "16px", lineHeight: "24px", margin: "4px 0", letterSpacing: "-0.31px" }),
              }}
            >
              {t("Please retry loading the document")}
            </p>

            {/* Retry Button */}
            <button
              onClick={fetchRemoteDoc}
              style={{
                background: "white",
                color: "#007E7E",
                border: "solid 1px #007E7E",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                ...(errorStyleSmallType
                  ? { fontSize: "14px", lineHeight: "24px", margin: "2px 0", padding: "2px 12px", marginTop: "10px" }
                  : { fontSize: "16px", lineHeight: "24px", margin: "4px 0", padding: "8px 24px", marginTop: "10px" }),
              }}
            >
              {t("Retry")}
            </button>
          </div>
        )}

        {/* DOCVIEWER (ONLY IF SUCCESSFUL)                        */}
        {!loading && !docError && documents?.length > 0 && (
          <DocViewer
            className="docViewer-image"
            documents={documents}
            pluginRenderers={DocViewerRenderers}
            requestHeaders={headers}
            style={{ width: docWidth, height: docHeight, ...style }}
            theme={{
              primary: "#F47738",
              secondary: "#feefe7",
              tertiary: "#feefe7",
              textPrimary: "#0B0C0C",
              textSecondary: "#505A5F",
              textTertiary: "#00000099",
              disableThemeScrollbar: true,
            }}
            config={{
              header: { disableHeader: true, disableFileName: true, retainURLParams: true },
              csvDelimiter: ",",
              pdfZoom: { defaultZoom: pdfZoom, zoomJump: 0.2 },
              pdfVerticalScrollByDefault: !preview,
            }}
          />
        )}
      </Card>

      {/* DOWNLOAD LINK                                         */}
      {showDownloadOption && fileStoreId && <AuthenticatedLink t={t} uri={uri} displayFilename={displayFilename} />}

      {/* DOCUMENT NAME                                         */}
      {documentName && (
        <p
          style={{
            display: "flex",
            color: "#505A5F",
            width: "fit-content",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            margin: 8,
          }}
        >
          {isLocalizationRequired ? t(documentName) : documentName}
        </p>
      )}
    </div>
  );
};

export default DocViewerWrapper;
