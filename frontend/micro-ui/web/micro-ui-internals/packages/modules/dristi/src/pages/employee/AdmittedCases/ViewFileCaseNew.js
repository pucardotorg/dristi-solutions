import React, { useState, useEffect, useMemo } from "react";
import { CustomArrowDownIcon, CustomArrowUpIcon } from "../../../icons/svgIndex";
import DocViewerWrapper from "../docViewerWrapper";
import { caseFileLabels } from "../../../Utils";
import { useTranslation } from "react-i18next";
import { useQueries } from "react-query";
import { DRISTIService } from "../../../services";
import { set } from "lodash";
const MemoDocViewerWrapper = React.memo(DocViewerWrapper);

function ViewCaseFileNew({ caseDetails, tenantId, filingNumber }) {
  const [expandedItems, setExpandedItems] = useState({
    "initial-filing": false,
    cheque: false,
    affidavit: false,
    "pending-application": false,
  });

  const [selectedDocument, setSelectedDocument] = useState("complaint");
  const [selectedFileStoreId, setSelectedFileStoreId] = useState(null);
  const [disposedApplicationChildren, setDisposedApplicationChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishedOrderData, setPublishedOrderData] = useState([]);

  const { t } = useTranslation();

  const courtId = localStorage.getItem("courtId");
  useEffect(() => {
    const complaintDoc = caseDetails?.documents.find((d) => d.documentType === "case.complaint.signed");
    if (complaintDoc?.fileStore && !selectedFileStoreId) {
      setSelectedFileStoreId(complaintDoc.fileStore);
    }
  }, [caseDetails, selectedFileStoreId]);

  const collectDescendantIds = (item) => {
    let ids = [];
    if (item.hasChildren && item.children) {
      for (const child of item.children) {
        ids.push(child.id);
        if (child.hasChildren) {
          ids = ids.concat(collectDescendantIds(child));
        }
      }
    }
    return ids;
  };

  const toggleExpanded = (item) => {
    setExpandedItems((prev) => {
      const currentlyExpanded = !!prev[item.id];

      if (currentlyExpanded) {
        const descendants = collectDescendantIds(item);
        const newState = { ...prev, [item.id]: false };
        descendants.forEach((id) => {
          delete newState[id];
        });
        return newState;
      } else {
        return { ...prev, [item.id]: true };
      }
    });
  };

  const handleDocumentSelect = (docId, fileStoreId, title) => {
    console.log("Selected Document ID:", title);
    setSelectedDocument(docId);
    setSelectedFileStoreId(fileStoreId);
  };

  const { data: applicationData, isLoading: isApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        status: "PENDINGREVIEW",
        courtId: courtId,
        filingNumber: filingNumber,
        tenantId,
      },
      pagination: {
        sortBy: "applicationCMPNumber",
        order: "asc",
      },
    },
    {},
    filingNumber + "allApplications",
    filingNumber
  );

  const applicationList = useMemo(() => applicationData?.applicationList, [applicationData]);

  const { data: directEvidenceData } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        courtId: courtId,
        filingNumber: filingNumber,
        filingType: "DIRECT",
        evidenceStatus: false,
        isVoid: false,
        tenantId,
      },
      pagination: {
        sortBy: "createdTime",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "directEvidence",
    filingNumber
  );

  const { data: applicationEvidenceData } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        courtId: courtId,
        filingNumber: filingNumber,
        filingType: "APPLICATION",
        evidenceStatus: false,
        isVoid: false,
        tenantId,
      },
      pagination: {
        sortBy: "createdTime",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "applicationEvidence",
    filingNumber
  );

  const directEvidenceList = directEvidenceData?.artifacts;
  const applicationEvidenceList = applicationEvidenceData?.artifacts;
  const newEvidenceList = [...(directEvidenceList || []), ...(applicationEvidenceList || [])];
  const combinedEvidenceList = newEvidenceList.sort((a, b) => a?.auditDetails?.createdTime - b?.auditDetails?.createdTime);

  const { data: ordersData } = Digit.Hooks.dristi.useGetOrders(
    {
      criteria: {
        filingNumber: filingNumber,
        courtId: courtId,
        orderType: "MANDATORY_SUBMISSIONS_RESPONSES",
        status: "PUBLISHED",
        tenantId,
      },
      pagination: {
        sortBy: "createdTime",
        order: "asc",
      },
    },
    {},
    filingNumber + "ordersData",
    filingNumber
  );

  const orderList = Array.isArray(ordersData?.list) ? ordersData.list : [];

  const { data: complaintEvidenceData } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        courtId: courtId,
        filingNumber: filingNumber,
        sourceType: "COMPLAINANT",
        evidenceStatus: true,
        isVoid: false,
        tenantId,
      },
      pagination: {
        sortBy: "publishedDate",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "complaintEvidenceData",
    filingNumber
  );

  const { data: accusedEvidenceData } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        courtId: courtId,
        filingNumber: filingNumber,
        sourceType: "ACCUSED",
        evidenceStatus: true,
        isVoid: false,
        tenantId,
      },
      pagination: {
        sortBy: "publishedDate",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "accusedEvidenceData",
    filingNumber
  );

  const { data: courtEvidenceData } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        courtId: courtId,
        filingNumber: filingNumber,
        sourceType: "COURT",
        evidenceStatus: true,
        isVoid: false,
        tenantId,
      },
      pagination: {
        sortBy: "publishedDate",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "courtEvidenceData",
    filingNumber
  );

  const { data: courtEvidenceDepositionData } = Digit.Hooks.submissions.useSearchEvidenceService(
    {
      criteria: {
        courtId: courtId,
        filingNumber: filingNumber,
        sourceType: "COURT",
        artifactType: "WITNESS_DEPOSITION",
        isVoid: false,
        tenantId,
      },
      pagination: {
        sortBy: "createdDate",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "courtEvidenceDepositionData",
    filingNumber
  );

  const { data: disposedApplicationData } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        status: "COMPLETED",
        courtId: courtId,
        filingNumber: filingNumber,
        tenantId,
      },
      pagination: {
        sortBy: "applicationCMPNumber",
        order: "asc",
      },
    },
    {},
    filingNumber + "allApplications",
    filingNumber
  );

  const disposedApplicationList = useMemo(() => disposedApplicationData?.applicationList, [disposedApplicationData]);

  const productionQueries = useQueries(
    orderList.map((order) => ({
      queryKey: ["productionOfDocumentApplications", order.id],
      queryFn: () =>
        DRISTIService.searchSubmissions({
          criteria: {
            status: "COMPLETED",
            courtId,
            filingNumber,
            referenceId: order.id,
            applicationType: "PRODUCTION_DOCUMENTS",
            tenantId,
          },
          pagination: {
            sortBy: "createdTime",
            order: "asc",
          },
        }),
      enabled: !!order.id,
    }))
  );

  const generatePendingApplicationStructure = (applications) => {
    return applications.map((application) => {
      const signedDoc = application?.documents?.find((doc) => doc?.documentType === "SIGNED" || doc?.documentType === "CONDONATION_DOC");

      const validObjectionComments = (application?.comment || []).filter((comment) => comment?.additionalDetails?.commentDocumentId);

      const children = [];

      if (signedDoc?.fileStore) {
        children.push({
          id: `${application?.applicationNumber}-signed`,
          title: "Signed PDF",
          fileStoreId: signedDoc?.fileStore,
          hasChildren: false,
        });
      }

      if (validObjectionComments.length > 0) {
        const objectionChildren = validObjectionComments.map((comment, objIndex) => ({
          id: `${application?.applicationNumber}-objection-${objIndex}`,
          title: `Objection ${objIndex + 1}`,
          fileStoreId: comment?.additionalDetails?.commentDocumentId,
          hasChildren: false,
        }));

        children.push({
          id: `${application?.applicationNumber}-objections`,
          title: "Objections",
          hasChildren: true,
          children: objectionChildren,
        });
      }

      return {
        id: application?.applicationNumber,
        title: application?.applicationType,
        hasChildren: children.length > 0,
        children: children,
      };
    });
  };

  const generateVakalatnamaStructure = (caseDetails) => {
    if (!caseDetails?.litigants) return [];

    const fileStoreIds = new Set();

    const litigants = caseDetails.litigants.map((litigant) => ({
      ...litigant,
      representatives: caseDetails.representatives?.filter((rep) => rep?.representing?.some((c) => c?.individualId === litigant?.individualId)) || [],
    }));

    litigants.forEach((litigant) => {
      const litigantFileStoreId = litigant?.documents?.[0]?.fileStore;
      if (!litigant.representatives.length && litigantFileStoreId) {
        fileStoreIds.add(litigantFileStoreId);
      }

      for (const rep of litigant.representatives) {
        const updatedLitigant = rep?.representing?.find((lit) => lit?.individualId === litigant?.individualId);
        const repFileStoreId = updatedLitigant?.documents?.[0]?.fileStore;
        if (repFileStoreId) {
          fileStoreIds.add(repFileStoreId);
        }
      }
    });

    return Array.from(fileStoreIds).map((fileStoreId, index) => ({
      id: `vakalatnama-${index}`,
      title: `Vakalatnama ${index + 1}`,
      fileStoreId,
      hasChildren: false,
    }));
  };

  const generateEvidenceStructure = (combinedList) => {
    if (!Array.isArray(combinedList) || combinedList.length === 0) return [];

    return combinedList
      .map((evidence, index) => {
        const evidenceFileStoreId = evidence?.file?.fileStore;

        if (!evidenceFileStoreId) return null;

        return {
          id: `evidence-${index}`,
          title: `Additional Filing ${index + 1}`,
          fileStoreId: evidenceFileStoreId,
          hasChildren: false,
        };
      })
      .filter((item) => item !== null);
  };

  const mandatorySubmissionsChildren = useMemo(() => {
    let applicationCounter = 0;
    const children = [];

    productionQueries.forEach((query) => {
      const applicationList = query.data?.applicationList || [];

      applicationList.forEach((application) => {
        if (application?.documents?.length > 0) {
          const signed = [];
          const others = [];

          application.documents.forEach((document) => {
            if (document?.fileStore) {
              if (document.documentType === "SIGNED") {
                signed.push(document.fileStore);
              } else {
                others.push(document.fileStore);
              }
            }
          });

          applicationCounter++;

          const prodDocChildren = [];

          signed.forEach((signedFileStoreId, idx) => {
            prodDocChildren.push({
              id: `${application.applicationNumber}-signed-${idx}`,
              title: `Application (SIGNED)`,
              fileStoreId: signedFileStoreId,
              hasChildren: false,
            });
          });

          if (others.length > 0) {
            const otherChildren = others.map((fileStoreId, idx) => ({
              id: `${application.applicationNumber}-other-${idx}`,
              title: `Document`,
              fileStoreId,
              hasChildren: false,
            }));

            prodDocChildren.push({
              id: `${application.applicationNumber}-others`,
              title: `Other Documents ${applicationCounter}`,
              hasChildren: true,
              children: otherChildren,
            });
          }

          children.push({
            id: `${application.applicationNumber}-prod-${applicationCounter}`,
            title: `Production of documents ${applicationCounter}`,
            hasChildren: true,
            number: applicationCounter,
            children: prodDocChildren,
          });
        }
      });
    });

    return children;
  }, [productionQueries]);

  const evidenceChildren = generateEvidenceStructure(combinedEvidenceList);

  const generateCompliantEvidenceStructure = (complaintEvidenceData) => {
    if (!complaintEvidenceData?.artifacts || !Array.isArray(complaintEvidenceData.artifacts)) return [];
    return complaintEvidenceData.artifacts
      .filter((artifact) => artifact?.file?.fileStore)
      .map((artifact, idx) => ({
        id: `complaint-evidence-${idx}`,
        title: `Evidence ${idx + 1}`,
        fileStoreId: artifact.file.fileStore,
        hasChildren: false,
      }));
  };

  const generateAccusedEvidenceStructure = (accusedEvidenceData) => {
    if (!accusedEvidenceData?.artifacts || !Array.isArray(accusedEvidenceData.artifacts)) return [];
    return accusedEvidenceData.artifacts
      .filter((artifact) => artifact?.file?.fileStore)
      .map((artifact, idx) => ({
        id: `accused-evidence-${idx}`,
        title: `Evidence ${idx + 1}`,
        fileStoreId: artifact.file.fileStore,
        hasChildren: false,
      }));
  };

  const generateCourtEvidenceStructure = (courtEvidenceData, courtEvidenceDepositionData) => {
    // "Depositions" children from courtEvidenceDepositionData
    const depositions = Array.isArray(courtEvidenceDepositionData?.artifacts)
      ? courtEvidenceDepositionData.artifacts
          .filter((artifact) => artifact?.file?.fileStore)
          .map((artifact, idx) => ({
            id: `court-deposition-${idx}`,
            title: `Deposition ${idx + 1}`,
            fileStoreId: artifact.file.fileStore,
            hasChildren: false,
          }))
      : [];

    // "Evidences" children from courtEvidenceData
    const evidences = Array.isArray(courtEvidenceData?.artifacts)
      ? courtEvidenceData.artifacts
          .filter((artifact) => artifact?.file?.fileStore)
          .map((artifact, idx) => ({
            id: `court-evidence-${idx}`,
            title: `Evidence ${idx + 1}`,
            fileStoreId: artifact.file.fileStore,
            hasChildren: false,
          }))
      : [];

    return [
      {
        id: "court-depositions",
        title: "Depositions",
        hasChildren: depositions.length > 0,
        children: depositions,
      },
      {
        id: "court-evidences",
        title: "Evidences",
        hasChildren: evidences.length > 0,
        children: evidences,
      },
    ];
  };

  useEffect(() => {
    const generateDisposedApplicationStructure = async () => {
      if (!disposedApplicationList?.length) return;

      setLoading(true);
      const childrenItems = [];

      await Promise.all(
        disposedApplicationList.map(async (application, index) => {
          const applicationNumber = application?.applicationNumber;
          const referenceId = application?.referenceId;

          try {
            const orderPromises = [];

            if (referenceId) {
              orderPromises.push(
                DRISTIService.searchOrders({
                  criteria: {
                    courtId,
                    filingNumber,
                    id: referenceId,
                    status: "PUBLISHED",
                    tenantId,
                  },
                  pagination: {},
                })
              );
            }

            if (applicationNumber) {
              orderPromises.push(
                DRISTIService.searchOrders({
                  criteria: {
                    courtId,
                    filingNumber,
                    applicationNumber,
                    status: "PUBLISHED",
                    tenantId,
                  },
                  pagination: {},
                })
              );
            }

            const orderResponses = await Promise.all(orderPromises);

            const combinedOrders = orderResponses.flatMap((res) => res?.list || []);

            // Signed
            const signedDoc = application?.documents?.find((doc) => doc?.documentType === "SIGNED" || doc?.documentType === "CONDONATION_DOC");

            const signedSubitem = signedDoc?.fileStore
              ? {
                  id: `${applicationNumber}-signed`,
                  title: "Signed PDF",
                  fileStoreId: signedDoc.fileStore,
                  hasChildren: false,
                }
              : null;

            // Objections
            const validObjectionComments = (application?.comment || []).filter((comment) => comment?.additionalDetails?.commentDocumentId);

            const objectionChildren = validObjectionComments.map((comment, objIndex) => ({
              id: `${applicationNumber}-objection-${objIndex}`,
              title: `Objection ${objIndex + 1}`,
              fileStoreId: comment.additionalDetails.commentDocumentId,
              hasChildren: false,
            }));

            const objectionsSubitem =
              objectionChildren.length > 0
                ? {
                    id: `${applicationNumber}-objections`,
                    title: "Objections",
                    hasChildren: true,
                    children: objectionChildren,
                  }
                : null;

            // Orders
            const orderFileStoreIds = [];

            combinedOrders.forEach((order) => {
              const document = order?.documents?.find((doc) => doc?.documentType === "SIGNED");
              if (document?.fileStore) {
                orderFileStoreIds.push(document.fileStore);
              }
            });

            const orderChildren = orderFileStoreIds.map((fsId, idx) => ({
              id: `${applicationNumber}-order-${idx}`,
              title: `Order ${idx + 1}`,
              fileStoreId: fsId,
              hasChildren: false,
            }));

            const ordersSubitem =
              orderChildren.length > 0
                ? {
                    id: `${applicationNumber}-orders`,
                    title: "Orders",
                    hasChildren: true,
                    children: orderChildren,
                  }
                : null;

            // --- Final structure per application ---
            const childItems = [signedSubitem, objectionsSubitem, ordersSubitem].filter(Boolean);

            childrenItems.push({
              id: applicationNumber,
              title: application.applicationType,
              hasChildren: childItems.length > 0,
              number: `11.${index + 1}`,
              children: childItems,
            });
          } catch (error) {
            console.error("Error fetching orders for:", applicationNumber, error);
          }
        })
      );

      setDisposedApplicationChildren(childrenItems);
      setLoading(false);
    };

    generateDisposedApplicationStructure();
  }, [disposedApplicationList, courtId, filingNumber, tenantId]);

  useEffect(() => {
    const getOrder = async () => {
      try {
        const response = await DRISTIService.searchOrders({
          criteria: {
            filingNumber: filingNumber,
            status: "PUBLISHED",
            tenantId,
            courtId,
          },
          pagination: {
            sortBy: "createdDate",
            order: "asc",
          },
        });
        const orderData = response?.list || [];
        setPublishedOrderData(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    };

    getOrder();
  }, [filingNumber, tenantId, courtId]);

  const generatePublishedOrderChildren = (publishedOrderList) => {
    return publishedOrderList.map((order, index) => {
      const signedDoc = order?.documents?.find((doc) => doc?.documentType === "SIGNED");
      const fileStoreId = signedDoc?.fileStore;

      return {
        id: `published-order-${index}`,
        title: `Order ${index + 1}`,
        fileStoreId: fileStoreId,
        hasChildren: false,
      };
    });
  };
  const publishedOrderChildren = useMemo(() => generatePublishedOrderChildren(publishedOrderData), [publishedOrderData]);
  const generateCaseFileStructure = (docs) => {
    const groupedDocs = {};

    docs.forEach((doc) => {
      const labelKey = Object.keys(caseFileLabels).find((key) => key === doc.documentType);
      if (labelKey) {
        const title = caseFileLabels[labelKey];
        const parentKey = doc.documentType;

        if (!groupedDocs[parentKey]) {
          groupedDocs[parentKey] = [];
        }

        groupedDocs[parentKey].push({
          id: doc.documentUid,
          title: groupedDocs[parentKey].length > 0 ? `${title} ${groupedDocs[parentKey].length + 1}` : title,
          fileStoreId: doc.fileStore,
          hasChildren: false,
        });
      }
    });

    // Convert groupedDocs into structured format for Initial Filing children
    const initialFilingChildren = Object.entries(groupedDocs).map(([docType, entries]) => {
      const label = caseFileLabels[docType];
      if (entries.length === 1) {
        return {
          ...entries[0],
        };
      } else {
        return {
          id: docType,
          title: label,
          hasChildren: true,
          children: entries,
        };
      }
    });

    // Get specific document file store IDs
    const getFileStoreByType = (type) => {
      const doc = docs.find((d) => d.documentType === type);
      return doc ? doc.fileStore : null;
    };

    const pendingApplicationChildren = generatePendingApplicationStructure(applicationList);
    const vakalatnamaChildren = generateVakalatnamaStructure(caseDetails);
    const complaintEvidenceChildren = generateCompliantEvidenceStructure(complaintEvidenceData);
    const accusedEvidenceChildren = generateAccusedEvidenceStructure(accusedEvidenceData);
    const courtEvidenceChildren = generateCourtEvidenceStructure(courtEvidenceData, courtEvidenceDepositionData);
    // const disposedApplicationChildren = generateDisaposedApplicationStructure(disposedApplicationList, combinedOrderList);

    // Main structure with fixed items
    const mainStructure = [
      {
        id: "complaint",
        title: "Complaint",
        fileStoreId: getFileStoreByType("case.complaint.signed"),
        hasChildren: false,
        number: 1,
      },
      {
        id: "pending-application",
        title: "Pending Application",
        hasChildren: pendingApplicationChildren.length > 0,
        number: 2,
        children: pendingApplicationChildren,
      },
      {
        id: "initial-filing",
        title: "Initial Filing",
        hasChildren: true,
        number: 3,
        children: initialFilingChildren,
      },
      {
        id: "affidavits",
        title: "Affidavits",
        hasChildren: true,
        number: 4,
        children: [
          {
            id: "affidavit-225bnss",
            title: "Affidavit under Section 225 BNSS",
            fileStoreId: getFileStoreByType("case.affidavit.225bnss"),
            hasChildren: false,
          },
          {
            id: "affidavit-223bnss",
            title: "Affidavit under Section 223 BNSS",
            fileStoreId: getFileStoreByType("case.affidavit.223bnss"),
            hasChildren: false,
          },
        ].filter((child) => child?.fileStoreId), // Only include if fileStoreId exists
      },
      {
        id: "vakalatnama",
        title: "Vakalats",
        hasChildren: vakalatnamaChildren.length > 0,
        number: 5,
        children: vakalatnamaChildren,
      },
      {
        id: "evidence",
        title: "Additional Filing",
        hasChildren: evidenceChildren.length > 0,
        number: 6,
        children: evidenceChildren,
      },
      {
        id: "mandatory-submissions-responses",
        title: "Mandatory Submissions",
        hasChildren: ordersData?.list?.length > 0,
        number: 7,
        children: mandatorySubmissionsChildren,
      },
      {
        id: "complaint-evidence",
        title: "Evidence by Complainant",
        hasChildren: complaintEvidenceData?.artifacts?.length > 0,
        number: 8,
        children: complaintEvidenceChildren,
      },
      {
        id: "accused-evidence",
        title: "Evidence by Accused",
        hasChildren: accusedEvidenceData?.artifacts?.length > 0,
        number: 9,
        children: accusedEvidenceChildren,
      },
      {
        id: "court-evidence",
        title: "Court Evidence",
        hasChildren: courtEvidenceData?.artifacts?.length > 0,
        number: 10,
        children: courtEvidenceChildren,
      },
      {
        id: "disposed-applications",
        title: "Disposed Applications",
        hasChildren: disposedApplicationList?.length > 0,
        number: 11,
        children: disposedApplicationChildren,
      },
      {
        id: "payment-receipt",
        title: "Payment Receipt",
        fileStoreId: getFileStoreByType("PAYMENT_RECEIPT"),
        hasChildren: false,
        number: 12,
      },
      {
        id: "orders",
        title: "Orders",
        hasChildren: publishedOrderData.length > 0,
        number: 13,
        children: publishedOrderChildren,
      },
    ];

    return mainStructure;
  };

  const dynamicCaseFileStructure = generateCaseFileStructure(caseDetails?.documents || []);
  const renderMenuItem = (item, level = 0, parentNumber = "") => {
    const isExpanded = expandedItems[item.id];
    const isSelected = selectedDocument === item.id;
    const paddingLeft = level * 20 + 16;

    // Generate display number and title
    let displayNumber = "";
    if (level === 0) {
      displayNumber = item.number.toString();
    } else {
      displayNumber = parentNumber;
    }

    const displayTitle = level === 0 ? `${displayNumber}. ${t(item.title)}` : `${displayNumber} ${t(item.title)}`;

    return (
      <div key={item.id}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            minHeight: "47px",
            width: "272px",
            cursor: "pointer",
            backgroundColor: isSelected ? "#E8E8E8" : "transparent",
            paddingLeft: `${paddingLeft}px`,
            borderBottom: "1px solid #E8E8E8",
            transition: "background-color 0.2s ease",
          }}
          onClick={() => {
            if (item.hasChildren) {
              console.log("Toggling expanded state for:", item.id);
              toggleExpanded(item);
            } else if (item.fileStoreId && item.id !== selectedDocument) {
              handleDocumentSelect(item.id, item.fileStoreId, displayTitle);
            }
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isSelected ? "#E8E8E8" : "#f9fafb")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? "#E8E8E8" : "transparent")}
        >
          <span
            style={{
              fontFamily: "Roboto",
              fontWeight: isSelected ? 700 : 400,
              fontSize: "16px",
              lineHeight: "1.2",
              letterSpacing: "0%",
              flex: 1,
              color: "#77787B",
              textIndent: "-1.7em",
              paddingLeft: "2em",
              wordWrap: "break-word",
            }}
          >
            {displayTitle}
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
    <div style={{ display: "flex", height: "846px", backgroundColor: "#F9FAFB", gap: "16px" }}>
      {/* Left Sidebar */}
      <div style={{ width: "272px", backgroundColor: "#f9fafb", borderRight: "1px solid #e5e7eb", overflowX: "hidden", padding: "8px 8px 8px 0" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
          <h2
            style={{
              fontFamily: "Roboto",
              fontWeight: 700,
              fontSize: "24px",
              lineHeight: "100%",
              letterSpacing: "0%",
              color: "#1f2937",
            }}
          >
            Case File
          </h2>
        </div>

        <div>{dynamicCaseFileStructure.map((item) => renderMenuItem(item))}</div>
      </div>

      {/* Right Content Area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <MemoDocViewerWrapper tenantId={tenantId} fileStoreId={selectedFileStoreId} showDownloadOption={false} docHeight="600px" docWidth="900px" />
      </div>
    </div>
  );
}

export default ViewCaseFileNew;
