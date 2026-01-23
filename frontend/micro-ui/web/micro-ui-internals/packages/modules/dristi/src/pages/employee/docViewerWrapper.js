import { Card, DownloadImgIcon } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState, useCallback } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { useTranslation } from "react-i18next";
import { Urls } from "../../hooks";
import AuthenticatedLink from "../../Utils/authenticatedLink";
import { DocumentViewErrorIcon } from "../../icons/svgIndex";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

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
}) => {
  const { t } = useTranslation();
  const token = localStorage.getItem("token");

  const [docUrl, setDocUrl] = useState(null);
  const [docError, setDocError] = useState(null);
  const [loading, setLoading] = useState(false);

  const uri = fileStoreId && `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;

  const headers = { "auth-token": token };

  // FETCH FUNCTION WITH RETRY SUPPORT
  const fetchRemoteDoc = useCallback(async () => {
    if (!fileStoreId) return;

    setLoading(true);
    setDocError(null);

    try {
      const res = await axiosInstance.get(uri, {
        headers,
        responseType: "blob",
      });

      // Axios does not have res.ok, so we emulate it
      if (res.status < 200 || res.status >= 300) {
        const error = new Error("Error fetching file");
        error.status = res.status;
        throw error;
      }

      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      setDocUrl(blobUrl);
    } catch (err) {
      setDocError({
        status: err.status || err?.response?.status,
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [fileStoreId, uri]);

  // Initial fetch
  useEffect(() => {
    fetchRemoteDoc();

    return () => {
      if (docUrl) URL.revokeObjectURL(docUrl);
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

  const handleLocalDownload = (file) => {
    if (!file) return;
    console.log("Downloading local file:", file);
    const reader = new FileReader();

    reader.onload = () => {
      const a = document.createElement("a");
      a.href = reader.result;
      a.download = file.name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="docviewer-wrapper" id="docviewer-id">
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
      {(showDownloadOption || !fileStoreId) &&
        (fileStoreId ? (
          <AuthenticatedLink t={t} uri={uri} displayFilename={displayFilename} />
        ) : (
          selectedDocs?.length > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleLocalDownload(selectedDocs[0]);
              }}
            >
              {/* Hiding the previous download icon when download option is shown for local files */}
              <style>
                {`
                  .header-wrap .header-end .close-icon:first-child {
                    display: none !important;
                  }
              `}
              </style>
              <div className="custom-download-icon">
                <DownloadImgIcon />
              </div>
            </div>
          )
        ))}

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
