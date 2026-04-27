import React, { useState, useEffect, useMemo } from "react";
import { DRISTIService } from "../../../services";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { Loader } from "@egovernments/digit-ui-react-components";
import DocViewerWrapper from "../docViewerWrapper";
import { modifiedEvidenceNumber } from "../../../Utils";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import useDownloadFiles from "../../../hooks/dristi/useDownloadFiles";
import MarkAsEvidence from "./MarkAsEvidence";
import DownloadButton from "../../../components/DownloadButton";
import CustomChip from "../../../components/CustomChip";
import { CustomArrowDownIcon, CustomArrowUpIcon } from "../../../icons/svgIndex";
import CustomToast from "../../../components/CustomToast";

function CaseBundleView({ caseDetails, tenantId, filingNumber }) {
  const [expandedItems, setExpandedItems] = useState({
    "initial-filing": false,
    cheque: false,
    affidavit: false,
    "pending-application": false,
    bail: false,
  });

  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedFileStoreId, setSelectedFileStoreId] = useState(null);
  const { downloadPdf } = useDownloadCasePdf();
  const { downloadFilesAsZip } = useDownloadFiles();
  const [showEvidenceConfirmationModal, setShowEvidenceConfirmationModal] = useState(false);
  const [counter, setCounter] = useState(0);
  const { t } = useTranslation();
  const [showToast, setShowToast] = useState(null);

  const courtId = caseDetails?.courtId;

  const { data: previewResponse, isLoading: isPreviewLoading } = useQuery(
    ["GET_PREVIEW_DOC", filingNumber, courtId],
    () =>
      DRISTIService.getPreviewDoc({
        tenantId,
        filingNumber,
        courtId,
        isCaseFileView: true,
      }),
    {
      enabled: Boolean(filingNumber && courtId),
    }
  );

  const previewNodes = useMemo(() => previewResponse?.caseBundleNodes || [], [previewResponse]);

  const {
    data: completeEvidenceData,
    isLoading: isCompleteEvidenceLoading,
    refetch: completeEvidenceRefetch,
  } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        courtId: courtId,
        filingNumber: filingNumber,
        tenantId,
        isHideBailCaseBundle: true,
      },
      pagination: {
        sortBy: "createdTime",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "completeEvidence",
    filingNumber
  );

  useEffect(() => {
    completeEvidenceRefetch();
  }, [counter]);

  useEffect(() => {
    if (previewNodes?.length > 0 && !selectedDocument) {
      const firstValidNode = previewNodes.find((node) => node.fileStoreId || (node.children && node.children.length > 0));
      if (firstValidNode) {
        if (firstValidNode.fileStoreId) {
          setSelectedDocument(firstValidNode.id);
          setSelectedFileStoreId(firstValidNode.fileStoreId);
        } else if (firstValidNode.children?.[0]?.fileStoreId) {
          setSelectedDocument(firstValidNode.children[0].id);
          setSelectedFileStoreId(firstValidNode.children[0].fileStoreId);
        }
      }
    }
  }, [previewNodes, selectedDocument]);
  useEffect(() => {
    if (sessionStorage.getItem("markAsEvidenceSelectedItem")) {
      setShowEvidenceConfirmationModal(true);
    }
  }, [setShowEvidenceConfirmationModal]);

  const collectDescendantIds = (item) => {
    let ids = [];
    if (item?.children?.length > 0) {
      for (const child of item?.children) {
        ids.push(child?.id);
        if (child?.children?.length > 0) {
          ids = ids.concat(collectDescendantIds(child));
        }
      }
    }
    return ids;
  };

  const toggleExpanded = (item) => {
    setExpandedItems((prev) => {
      const currentlyExpanded = !!prev[item?.id];

      if (currentlyExpanded) {
        const descendants = collectDescendantIds(item);
        const newState = { ...prev, [item?.id]: false };
        descendants?.forEach((id) => {
          delete newState[id];
        });
        return newState;
      } else {
        return { ...prev, [item?.id]: true };
      }
    });
  };

  const handleDocumentSelect = (docId, fileStoreId) => {
    setSelectedDocument(docId);
    setSelectedFileStoreId(fileStoreId);
  };
  const evidenceFileStoreMap = useMemo(() => {
    const map = new Map();
    if (completeEvidenceData?.artifacts && Array.isArray(completeEvidenceData?.artifacts)) {
      completeEvidenceData.artifacts.forEach((evidence) => {
        if (evidence?.file?.fileStore) {
          map.set(evidence.file.fileStore, evidence);
        }
      });
    }
    return map;
  }, [completeEvidenceData]);

  const dynamicCaseFileStructure = useMemo(() => {
    const processNode = (node) => {
      const processedNode = { ...node };

      if (node?.children?.length > 0) {
        processedNode.children = node.children.map((child) => processNode(child));
        processedNode.hasChildren = true;
      } else {
        processedNode.hasChildren = false;
      }

      return processedNode;
    };

    return previewNodes
      ?.filter((item) => {
        if (item?.children && Array.isArray(item?.children)) {
          return item?.children?.length > 0;
        }
        return item?.fileStoreId;
      })
      ?.map((item, index) => ({
        ...processNode(item),
        number: index + 1,
      }));
  }, [previewNodes]);

  // Handle download for either single PDF or ZIP containing evidence file and seal
  const handleDownload = (fileStoreId) => {
    if (evidenceFileStoreMap?.has(fileStoreId)) {
      const evidenceData = evidenceFileStoreMap.get(fileStoreId);
      // Check if evidence is marked as COMPLETED and has a seal object
      if (evidenceData?.evidenceMarkedStatus === "COMPLETED" && evidenceData?.seal?.fileStore) {
        // Download both evidence and seal files as a ZIP
        const filesToDownload = [
          { fileStoreId: fileStoreId, fileName: `Evidence_${evidenceData.evidenceNumber || "File"}` },
          { fileStoreId: evidenceData.seal.fileStore, fileName: `Seal_${evidenceData.evidenceNumber || "File"}` },
        ];
        downloadFilesAsZip(tenantId, filesToDownload, `Evidence_${evidenceData.evidenceNumber || "Files"}`);
      } else {
        // Normal PDF download if not completed or no seal
        downloadPdf(tenantId, fileStoreId);
      }
    } else {
      // Normal PDF download for non-evidence files
      downloadPdf(tenantId, fileStoreId);
    }
  };

  const localizeTitle = (title) => {
    const match = title.trim().match(/^(.*?)\s+(\d+)$/);
    if (match) {
      const baseTitle = match[1];
      const number = match[2];
      return `${t(baseTitle)} ${number}`;
    }
    return t(title);
  };

  const MemoDocViewerWrapper = useMemo(() => {
    return (
      <React.Fragment>
        <DocViewerWrapper
          key={"selectedFileStoreId"}
          tenantId={tenantId}
          fileStoreId={selectedFileStoreId}
          showDownloadOption={false}
          docHeight="100%"
          docWidth="100%"
          docViewerStyle={{ maxWidth: "100%" }}
        />

        {evidenceFileStoreMap?.get(selectedFileStoreId)?.seal?.fileStore &&
          evidenceFileStoreMap?.get(selectedFileStoreId)?.evidenceMarkedStatus === "COMPLETED" && (
            <DocViewerWrapper
              key={"seal-document"}
              tenantId={tenantId}
              fileStoreId={evidenceFileStoreMap?.get(selectedFileStoreId)?.seal?.fileStore}
              showDownloadOption={false}
              docHeight="100%"
              docWidth="100%"
              docViewerStyle={{ maxWidth: "100%" }}
            />
          )}
      </React.Fragment>
    );
  }, [evidenceFileStoreMap, selectedFileStoreId, tenantId]);

  const selectedDocumentData = useMemo(() => {
    if (!selectedDocument || !dynamicCaseFileStructure) return null;

    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    return findNode(dynamicCaseFileStructure, selectedDocument);
  }, [selectedDocument, dynamicCaseFileStructure]);

  if (isPreviewLoading || isCompleteEvidenceLoading) {
    return (
      <div style={{ width: "100%", paddingTop: "50px" }}>
        <Loader />
      </div>
    );
  }
  const renderMenuItem = (item, level = 0, parentNumber = "") => {
    const isExpanded = expandedItems[item.id];
    const isSelected = selectedDocument === item.id;
    const paddingLeft = level * 20 + 16;

    let displayNumber = "";
    if (level === 0) {
      displayNumber = item.number.toString();
    } else {
      displayNumber = parentNumber;
    }

    return (
      <div key={item.id}>
        <div
          className="menu-item-container"
          style={{ backgroundColor: isSelected ? "#E8E8E8" : "transparent", paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (item.hasChildren) {
              toggleExpanded(item);
            } else if (item.fileStoreId && item.id !== selectedDocument) {
              handleDocumentSelect(item.id, item.fileStoreId);
            }
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isSelected ? "#E8E8E8" : "#F9FAFB")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? "#E8E8E8" : "transparent")}
        >
          <span className="menu-item-title" style={{ color: isSelected ? "#3D3C3C" : "#77787B", fontWeight: isSelected ? 700 : 400 }}>
            <span className="menu-item-number">{level === 0 ? displayNumber + "." : displayNumber}</span>
            <span className="menu-item-text">{` ${localizeTitle(item.title)}`}</span>
          </span>

          {item.hasChildren && <div style={{ marginLeft: "8px" }}>{isExpanded ? <CustomArrowUpIcon /> : <CustomArrowDownIcon />}</div>}
        </div>

        {item.hasChildren && isExpanded && (
          <div>
            {item.children.map((child, index) => {
              const currentNumber = level === 0 ? `${item.number}.${index + 1}` : `${parentNumber}.${index + 1}`;

              return renderMenuItem(
                {
                  ...child,
                  childIndex: index,
                },
                level + 1,
                currentNumber
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <React.Fragment>
      {/* Left Sidebar - Fixed position with its own scrolling */}
      <div className="sidebar-panel">
        <div className="sidebar-header">{t("CASE_FILE_HEADING")}</div>

        <div className="scrollable-container">{dynamicCaseFileStructure?.map((item) => renderMenuItem(item))}</div>
      </div>

      {/* Right Content Area - Independent scrolling */}
      <div className="doc-viewer-container">
        <div
          className="doc-viewer-header-container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0px",
          }}
        >
          <div>
            {selectedDocument && selectedFileStoreId && (
              <span style={{ display: "flex", gap: "10px", fontFamily: "Roboto" }}>
                <span style={{ fontWeight: "700", fontStyle: "bold", fontSize: "20px" }}>
                  {" "}
                  {selectedDocumentData?.title && localizeTitle(selectedDocumentData.title)}
                </span>

                {evidenceFileStoreMap &&
                  evidenceFileStoreMap.has(selectedFileStoreId) &&
                  evidenceFileStoreMap?.get(selectedFileStoreId)?.evidenceMarkedStatus !== null &&
                  (evidenceFileStoreMap.get(selectedFileStoreId)?.evidenceMarkedStatus === "COMPLETED" || userType === "employee") && (
                    <React.Fragment>
                      <CustomChip
                        text={
                          t(
                            evidenceFileStoreMap.get(selectedFileStoreId)?.evidenceMarkedStatus === "COMPLETED"
                              ? "SIGNED"
                              : evidenceFileStoreMap.get(selectedFileStoreId)?.evidenceMarkedStatus
                          ) || ""
                        }
                        shade={evidenceFileStoreMap.get(selectedFileStoreId)?.evidenceMarkedStatus === "COMPLETED" ? "green" : "grey"}
                      />
                      {evidenceFileStoreMap.get(selectedFileStoreId)?.evidenceMarkedStatus === "COMPLETED" && (
                        <span>
                          <span style={{ fontSize: "20px", paddingLeft: "5px", paddingRight: "5px" }}> | </span>
                          <span style={{ fontSize: "14px", fontWeight: "400" }}>
                            {t("EVIDENCE_NUMBER")}:{" "}
                            {modifiedEvidenceNumber(
                              evidenceFileStoreMap.get(selectedFileStoreId)?.evidenceNumber,
                              evidenceFileStoreMap.get(selectedFileStoreId)?.filingNumber
                            )}
                          </span>
                        </span>
                      )}
                    </React.Fragment>
                  )}
              </span>
            )}
          </div>
          {selectedDocument && selectedFileStoreId && (
            <div className="doc-action-buttons" style={{ display: "flex", gap: "10px" }}>
              <DownloadButton onClick={() => handleDownload(selectedFileStoreId)} label="DOWNLOAD_PDF" t={t} />
              {userType === "employee" &&
                selectedFileStoreId &&
                evidenceFileStoreMap.has(selectedFileStoreId) &&
                evidenceFileStoreMap.get(selectedFileStoreId)?.artifactType !== "WITNESS_DEPOSITION" &&
                !evidenceFileStoreMap?.get(selectedFileStoreId)?.isEvidence && (
                  <button
                    className="mark-asevidence-button"
                    onClick={() => {
                      setShowEvidenceConfirmationModal(true);
                    }}
                  >
                    {t("MARK_AS_EVIDENCE")}
                  </button>
                )}
            </div>
          )}
        </div>
        {MemoDocViewerWrapper}
      </div>
      {showEvidenceConfirmationModal && (
        <MarkAsEvidence
          t={t}
          setShowMakeAsEvidenceModal={setShowEvidenceConfirmationModal}
          evidenceDetailsObj={evidenceFileStoreMap.get(selectedFileStoreId)}
          setDocumentCounter={setCounter}
          setShowToast={setShowToast}
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
}

export default CaseBundleView;
