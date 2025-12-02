import { Card } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { useTranslation } from "react-i18next";
import AuthenticatedLink from "../../Utils/authenticatedLink";
import { Urls } from "../../hooks";

const mimeToExt = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/html": "html",
};

const extractFileType = (name) => {
  if (!name || !name.includes(".")) return null;
  return name.split(".").pop().toLowerCase();
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
  preview,
  pdfZoom = 1.1,
  isLocalizationRequired = true,
  handleImageModalOpen,
}) => {

  const Digit = window?.Digit || {};
  const { t } = useTranslation();

  const token = localStorage.getItem("token");
  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;
  const headers = { "auth-token": `${token}` };

  const [isFileValid, setIsFileValid] = useState(true);
  const [fileType, setFileType] = useState(null);
  const [realFilename, setRealFilename] = useState(displayFilename || "file");

  // STEP 1 — Determine fileType from MIME response if filename missing
  useEffect(() => {
    const checkFileMime = async () => {
      if (!fileStoreId) return;

      try {
        const response = await fetch(uri, { headers });
        const contentType = response.headers.get("Content-Type");


        // If response is JSON — this is an error
        if (contentType?.includes("application/json")) {
          console.error("MIME received:", contentType, uri);
          setIsFileValid(false);
          return;
        }

        // Lookup extension from MIME
        const ext = mimeToExt[contentType] || null;

        if (ext) {
          setFileType(ext);

          // If filename missing → reconstruct name properly
          if (!displayFilename) {
            setRealFilename(`file.${ext}`);
          }
        } else {
          console.error("Unknown MIME:", contentType);
          setFileType(extractFileType(realFilename));  // fallback to filename
        }

        setIsFileValid(true);

      } catch (err) {
        console.error("⚠️ MIME detection error:", err);
        setIsFileValid(false);
      }
    };

    checkFileMime();
  }, [fileStoreId]);

  // STEP 2 — Ensure selected file uploads still use extension detection
  useEffect(() => {
    if (displayFilename) {
      setFileType(extractFileType(displayFilename));
    }
  }, [displayFilename]);

  // STEP 3 — Build documents prop
  const documents = fileStoreId
    ? [{
        uri: uri,
        fileName: realFilename,
        fileType: fileType,
      }]
    : selectedDocs.map((file) => ({
        uri: window.URL.createObjectURL(file),
        fileName: file?.name,
        fileType: extractFileType(file?.name),
      }));

  return (
    <div className="docviewer-wrapper" id="docviewer-id">
      <Card
        className={docViewerCardClassName}
        style={docViewerStyle}
        onClick={handleImageModalOpen ? () => handleImageModalOpen(fileStoreId, displayFilename) : undefined}
      >

        {/* If file is not valid */}
        {(!isFileValid) && (
          <div style={{ padding: 12 }}>
            <h4 style={{ color: "red" }}>
              {t("FILE_PREVIEW_FAILED")}
            </h4>
          </div>
        )}

        {/* If file is ok → show DocViewer */}
        {(isFileValid && documents?.length !== 0) && (
          <DocViewer
            className="docViewer-image"
            documents={documents}
            pluginRenderers={DocViewerRenderers}
            prefetchMethod="GET"
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
              header: {
                disableHeader: true,
                disableFileName: true,
                retainURLParams: true,
              },
              csvDelimiter: ",",
              pdfZoom: {
                defaultZoom: pdfZoom,
                zoomJump: 0.2,
              },
              pdfVerticalScrollByDefault: !preview,
            }}
          />
        )}
      </Card>

      {showDownloadOption && (
        <AuthenticatedLink t={t} uri={uri} displayFilename={displayFilename} />
      )}

      {documentName && (
        <p
          style={{
            display: "flex",
            color: "#505A5F",
            width: 250,
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
