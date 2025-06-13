import React, { useState, useEffect, useMemo } from "react";
import { CustomArrowDownIcon, CustomArrowUpIcon } from "../../../icons/svgIndex";
import DocViewerWrapper from "../docViewerWrapper";
import { caseFileLabels } from "../../../Utils";
import { useTranslation } from "react-i18next";
import { useQueries } from "react-query";
import { DRISTIService } from "../../../services";
import { Urls } from "../../../hooks";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import { Loader } from "@egovernments/digit-ui-react-components";

function CaseBundleView({ caseDetails, tenantId, filingNumber }) {
  const [expandedItems, setExpandedItems] = useState({
    "initial-filing": false,
    cheque: false,
    affidavit: false,
    "pending-application": false,
  });
  const reqEvidenceUpdate = {
    url: Urls.dristi.evidenceUpdate,
    params: {},
    body: {},
    config: {
      enable: false,
    },
  };

  const userInfo = Digit.UserService.getUser()?.info;
  const isJudge = useMemo(() => userInfo?.roles?.some((role) => ["JUDGE_ROLE"].includes(role?.code)), [userInfo?.roles]);
  const [selectedDocument, setSelectedDocument] = useState("complaint");
  const [selectedFileStoreId, setSelectedFileStoreId] = useState(null);
  const [disposedApplicationChildren, setDisposedApplicationChildren] = useState([]);
  const [bailApplicationChildren, setBailApplicationChildren] = useState([]);
  const [processChildren, setProcessChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishedOrderData, setPublishedOrderData] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const { downloadPdf } = useDownloadCasePdf();
  const evidenceUpdateMutation = Digit.Hooks.useCustomAPIMutationHook(reqEvidenceUpdate);

  const { t } = useTranslation();

  const courtId = caseDetails?.courtId;
  useEffect(() => {
    const complaintDoc = caseDetails?.documents?.find((d) => d?.documentType === "case.complaint.signed");
    if (complaintDoc?.fileStore && !selectedFileStoreId) {
      setSelectedFileStoreId(complaintDoc?.fileStore);
    }
  }, [caseDetails, selectedFileStoreId]);

  const collectDescendantIds = (item) => {
    let ids = [];
    if (item?.hasChildren && item?.children) {
      for (const child of item?.children) {
        ids.push(child?.id);
        if (child?.hasChildren) {
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

  const extractNumber = (cmpNumber) => {
    const parts = cmpNumber.split("/");
    return parts.length > 1 ? parseInt(parts[1], 10) : cmpNumber;
  };

  const handleDocumentSelect = (docId, fileStoreId) => {
    setSelectedDocument(docId);
    setSelectedFileStoreId(fileStoreId);
  };
  const { data: hearingDetails, isLoading: isHearingLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        courtId: courtId,
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber && courtId)
  );

  const { data: pendingReviewApplicationData, isLoading: isPendingReviewApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
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
        limit: 100,
      },
    },
    {},
    `${filingNumber}-PENDINGREVIEW-application`,
    Boolean(filingNumber)
  );

  const { data: pendingApprovalApplicationData, isLoading: isPendingApprovalApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        status: "PENDINGAPPROVAL",
        courtId: courtId,
        filingNumber: filingNumber,
        tenantId,
      },
      pagination: {
        sortBy: "applicationCMPNumber",
        order: "asc",
        limit: 100,
      },
    },
    {},
    `${filingNumber}-PENDINGAPPROVAL-application`,
    Boolean(filingNumber)
  );

  const {
    data: pendingDocUploadApplicationData,
    isLoading: isPendingDocUploadApplicationLoading,
  } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        status: "DOCUMENT_UPLOAD",
        courtId: courtId,
        filingNumber: filingNumber,
        tenantId,
      },
      pagination: {
        sortBy: "applicationCMPNumber",
        order: "asc",
        limit: 100,
      },
    },
    {},
    `${filingNumber}-DOCUMENT_UPLOAD-application`,
    Boolean(filingNumber)
  );

  const applicationList = useMemo(() => {
    const pendingReviewList = pendingReviewApplicationData?.applicationList || [];
    const pendingApprovalList = pendingApprovalApplicationData?.applicationList || [];
    const pendingDocUploadList = pendingDocUploadApplicationData?.applicationList || [];

    const applicationList = [...pendingReviewList, ...pendingApprovalList, ...pendingDocUploadList]?.sort((a, b) => {
      if (!a?.applicationCMPNumber && !b?.applicationCMPNumber) return 0;
      if (!a?.applicationCMPNumber) return 1;
      if (!b?.applicationCMPNumber) return -1;

      const aNum = extractNumber(a?.applicationCMPNumber);
      const bNum = extractNumber(b?.applicationCMPNumber);

      return aNum - bNum;
    });
    return applicationList;
  }, [pendingReviewApplicationData, pendingApprovalApplicationData, pendingDocUploadApplicationData]);

  const {
    data: directEvidenceData,
    isLoading: isDirectEvidenceLoading,
    refetch: directEvidenceRefetch,
  } = Digit.Hooks.submissions.useSearchEvidenceService(
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

  const {
    data: applicationEvidenceData,
    isLoading: isApplicationEvidenceLoading,
    refetch: applicationEvidenceRefetch,
  } = Digit.Hooks.submissions.useSearchEvidenceService(
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

  const combinedEvidenceList = useMemo(() => {
    const directEvidenceList = directEvidenceData?.artifacts || [];
    const applicationEvidenceList = applicationEvidenceData?.artifacts || [];

    const newEvidenceList = [...directEvidenceList, ...applicationEvidenceList];

    return newEvidenceList.sort((a, b) => a?.auditdetails?.createdTime - b?.auditdetails?.createdTime);
  }, [directEvidenceData, applicationEvidenceData]);

  const { data: ordersData, isLoading: isMandatoryOrdersLoading } = Digit.Hooks.dristi.useGetOrders(
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
        limit: 100,
      },
    },
    {},
    filingNumber + "ordersData",
    filingNumber
  );

  const orderList = Array.isArray(ordersData?.list) ? ordersData?.list : [];

  const {
    data: complaintEvidenceData,
    isLoading: isComplaintEvidenceLoading,
    refetch: complainantEvidenceRefetch,
  } = Digit.Hooks.submissions.useSearchEvidenceService(
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

  const {
    data: accusedEvidenceData,
    isLoading: isAccusedEvidenceLoading,
    refetch: accusedEvidenceRefetch,
  } = Digit.Hooks.submissions.useSearchEvidenceService(
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

  const {
    data: courtEvidenceData,
    isLoading: isCourtEvidenceLoading,
    refetch: courtEvidenceRefetch,
  } = Digit.Hooks.submissions.useSearchEvidenceService(
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

  const {
    data: courtEvidenceDepositionData,
    isLoading: isCourtDepositionEvidenceLoading,
    refetch: courtDepositionRefetch,
  } = Digit.Hooks.submissions.useSearchEvidenceService(
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

  const { data: completedApplicationData, isLoading: isCompletedApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
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
        limit: 100,
      },
    },
    {},
    `${filingNumber}-COMPLETED-application`,
    Boolean(filingNumber)
  );

  const { data: rejectedApplicationData, isLoading: isRejectedApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        status: "REJECTED",
        courtId: courtId,
        filingNumber: filingNumber,
        tenantId,
      },
      pagination: {
        sortBy: "applicationCMPNumber",
        order: "asc",
        limit: 100,
      },
    },
    {},
    `${filingNumber}-REJECTED-application`,
    Boolean(filingNumber)
  );

  const disposedApplicationList = useMemo(() => {
    const completedList = completedApplicationData?.applicationList || [];
    const rejectedList = rejectedApplicationData?.applicationList || [];

    const applicationList = [...completedList, ...rejectedList]?.sort((a, b) => {
      if (!a?.applicationCMPNumber && !b?.applicationCMPNumber) return 0;
      if (!a?.applicationCMPNumber) return 1;
      if (!b?.applicationCMPNumber) return -1;

      const aNum = extractNumber(a?.applicationCMPNumber);
      const bNum = extractNumber(b?.applicationCMPNumber);

      return aNum - bNum;
    });
    return applicationList;
  }, [completedApplicationData, rejectedApplicationData]);

  const { data: bailApplicationsData, isLoading: isBailApplicationLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        status: "COMPLETED",
        courtId: courtId,
        filingNumber: filingNumber,
        applicationType: "REQUEST_FOR_BAIL",
        tenantId,
      },
      pagination: {
        sortBy: "applicationCMPNumber",
        order: "asc",
        limit: 100,
      },
    },
    {},
    filingNumber + "bailApplicationsData",
    Boolean(filingNumber)
  );

  const bailApplicationsList = useMemo(() => bailApplicationsData?.applicationList, [bailApplicationsData]);

  useEffect(() => {
    const fetchProcessData = async () => {
      try {
        setLoading(true);
        const resTask = await DRISTIService.customApiService("/task/v1/table/search", {
          criteria: {
            completeStatus: [
              "ISSUE_SUMMON",
              "ISSUE_NOTICE",
              "ISSUE_WARRANT",
              "OTHER",
              "ABATED",
              "SUMMON_SENT",
              "EXECUTED",
              "NOT_EXECUTED",
              "WARRANT_SENT",
              "DELIVERED",
              "UNDELIVERED",
              "NOTICE_SENT",
            ],
            searchText: caseDetails?.cnrNumber || caseDetails?.cmpNumber || caseDetails?.courtCaseNumber,
            courtId: caseDetails?.courtId,
            tenantId,
          },
          pagination: {
            sortBy: "createdDate",
            order: "asc",
            limit: 100,
          },
        });

        const taskList = resTask?.list || [];

        const groupedTasks = {
          NOTICE: [],
          WARRANT: [],
          SUMMONS: [],
        };

        taskList?.forEach((task) => {
          const expectedType = task?.documentStatus === "SIGN_PENDING" ? "GENERATE_TASK_DOCUMENT" : "SIGNED_TASK_DOCUMENT";

          const fileStoreId = task?.documents?.find((doc) => doc?.documentType === expectedType)?.fileStore;

          if (fileStoreId && groupedTasks[task.orderType]) {
            groupedTasks[task?.orderType]?.push(fileStoreId);
          }
        });

        const processItems = Object.entries(groupedTasks)
          ?.filter(([_, files]) => files?.length > 0)
          ?.map(([type, files], index) => ({
            id: `process-${type?.toLowerCase()}`,
            title: type,
            hasChildren: true,
            children: files?.map((fileStoreId, idx) => ({
              id: `process-${type?.toLowerCase()}-${idx + 1}`,
              title: `${t(type)} ${idx + 1}`,
              fileStoreId,
              hasChildren: false,
            })),
          }));

        setProcessChildren(processItems);
      } catch (error) {
        console.error("Error fetching process data:", error);
        setProcessChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProcessData();
  }, [caseDetails, t, tenantId]);

  const productionQueries = useQueries(
    orderList?.map((order) => ({
      queryKey: ["productionOfDocumentApplications", order?.id],
      queryFn: () =>
        DRISTIService.searchSubmissions({
          criteria: {
            status: "COMPLETED",
            courtId,
            filingNumber,
            referenceId: order?.id,
            applicationType: "PRODUCTION_DOCUMENTS",
            tenantId,
          },
          pagination: {
            sortBy: "createdTime",
            order: "asc",
            limit: 100,
          },
        }),
      enabled: !!order?.id,
    }))
  );

  const generateAffidavitStructure = (docs) => {
    const affidavit225List = docs.filter((doc) => doc?.documentType === "case.affidavit.225bnss" && doc?.fileStore);

    const affidavit223 = docs.find((doc) => doc?.documentType === "case.affidavit.223bnss" && doc?.fileStore);

    const structure = [];

    if (affidavit223) {
      structure.push({
        id: "affidavit-223bnss",
        title: "AFFIDAVIT_UNDER_SECTION_223_BNSS",
        fileStoreId: affidavit223.fileStore,
        hasChildren: false,
      });
    }

    if (affidavit225List.length > 0) {
      structure.push({
        id: "affidavit-225bnss",
        title: "AFFIDAVIT_UNDER_225",
        hasChildren: true,
        children: affidavit225List.map((doc, index) => ({
          id: `affidavit-225-${index + 1}`,
          title: `${t("AFFIDAVIT")} ${index + 1}`,
          fileStoreId: doc.fileStore,
          hasChildren: false,
        })),
      });
    }

    return structure;
  };

  const generatePendingApplicationStructure = (applications) => {
    return applications?.map((application) => {
      const signedDoc = application?.documents?.find((doc) => doc?.documentType === "SIGNED" || doc?.documentType === "CONDONATION_DOC");

      const validObjectionComments = (application?.comment || [])?.filter((comment) => comment?.additionalDetails?.commentDocumentId);

      const children = [];

      if (signedDoc?.fileStore) {
        children?.push({
          id: `${application?.applicationNumber}-signed`,
          title: "APPLICATION_PDF_HEADING",
          fileStoreId: signedDoc?.fileStore,
          hasChildren: false,
        });
      }

      if (validObjectionComments?.length > 0) {
        const objectionChildren = validObjectionComments?.map((comment, objIndex) => ({
          id: `${application?.applicationNumber}-objection-${objIndex}`,
          title: `${t("OBJECTION_APPLICATION")} ${objIndex + 1}`,
          fileStoreId: comment?.additionalDetails?.commentDocumentId,
          hasChildren: false,
        }));

        children?.push({
          id: `${application?.applicationNumber}-objections`,
          title: "OBJECTION_APPLICATION_HEADING",
          hasChildren: true,
          children: objectionChildren,
        });
      }

      return {
        id: application?.applicationNumber,
        title: application?.applicationType,
        hasChildren: children?.length > 0,
        children: children,
      };
    });
  };

  const generateVakalatnamaStructure = (caseDetails) => {
    if (!caseDetails?.litigants) return [];

    const fileStoreRecords = [];

    const litigants = caseDetails?.litigants?.map((litigant) => ({
      ...litigant,
      representatives:
        caseDetails?.representatives?.filter((rep) => rep?.representing?.some((c) => c?.individualId === litigant?.individualId)) || [],
    }));

    const addedFileStoreIds = new Set();

    litigants?.forEach((litigant) => {
      const litigantFileStoreId = litigant?.documents?.[0]?.fileStore;
      if (!litigant?.representatives?.length && litigantFileStoreId && !addedFileStoreIds.has(litigantFileStoreId)) {
        fileStoreRecords?.push({ fileStoreId: litigantFileStoreId, isPip: true, dateOfAddition: litigant?.auditDetails?.createdTime });
        addedFileStoreIds?.add(litigantFileStoreId);
      }

      for (const rep of litigant.representatives) {
        const updatedLitigant = rep?.representing?.find((lit) => lit?.individualId === litigant?.individualId);
        const repFileStoreId = updatedLitigant?.documents?.[0]?.fileStore;
        if (repFileStoreId && !addedFileStoreIds?.has(repFileStoreId)) {
          fileStoreRecords?.push({ fileStoreId: repFileStoreId, isPip: false, dateOfAddition: rep?.auditDetails?.createdTime });
          addedFileStoreIds?.add(repFileStoreId);
        }
      }
    });

    fileStoreRecords.sort((a, b) => a?.dateOfAddition - b?.dateOfAddition);

    let vakalatnamaCounter = 1;
    let pipCounter = 1;

    return fileStoreRecords.map(({ fileStoreId, isPip }, index) => ({
      id: `vakalatnama-${index}`,
      title: isPip ? `${t("PIP_AFFIDAVIT_HEADING")} ${pipCounter++}` : `${t("VAKALATNAMA_HEADING")} ${vakalatnamaCounter++}`,
      fileStoreId,
      hasChildren: false,
    }));
  };

  const generateEvidenceStructure = (combinedList) => {
    if (!Array.isArray(combinedList) || combinedList?.length === 0) return [];

    return combinedList
      ?.map((evidence, index) => {
        const evidenceFileStoreId = evidence?.file?.fileStore;

        if (!evidenceFileStoreId) return null;

        return {
          id: `evidence-${index}`,
          title: t(evidence?.artifactType),
          fileStoreId: evidenceFileStoreId,
          hasChildren: false,
          isEvidence: evidence?.isEvidence,
          artifactNumber: evidence?.artifactNumber,
          artifactList: evidence,
        };
      })
      ?.filter((item) => item !== null);
  };

  const mandatorySubmissionsChildren = useMemo(() => {
    let applicationCounter = 0;
    const children = [];

    productionQueries.forEach((query) => {
      const applicationList = query?.data?.applicationList || [];

      applicationList?.forEach((application) => {
        if (application?.documents?.length > 0) {
          const signed = [];
          const otherDocument = [];

          application?.documents?.forEach((document) => {
            if (document?.fileStore) {
              if (document?.documentType === "SIGNED") {
                signed?.push(document?.fileStore);
              } else {
                otherDocument?.push(document);
              }
            }
          });

          applicationCounter++;

          const prodDocChildren = [];

          signed?.forEach((signedFileStoreId, idx) => {
            prodDocChildren?.push({
              id: `${application.applicationNumber}-signed-${idx}`,
              title: `APPLICATION_PDF_HEADING`,
              fileStoreId: signedFileStoreId,
              hasChildren: false,
            });
          });

          if (otherDocument?.length > 0) {
            const otherChildren = otherDocument?.map((doc, idx) => ({
              id: `${application?.applicationNumber}-other-${idx}`,
              title: doc?.additionalDetails?.name?.split(".")[0],
              fileStoreId: doc?.fileStore,
              hasChildren: false,
            }));

            prodDocChildren?.push({
              id: `${application?.applicationNumber}-others`,
              title: `OTHER_DOCUMENTS_HEADING`,
              hasChildren: true,
              children: otherChildren,
            });
          }

          children?.push({
            id: `${application?.applicationNumber}-prod-${applicationCounter}`,
            title: `${t(application?.applicationType)} ${applicationCounter}`,
            hasChildren: true,
            number: applicationCounter,
            children: prodDocChildren,
          });
        }
      });
    });

    return children;
  }, [productionQueries, t]);

  const evidenceChildren = generateEvidenceStructure(combinedEvidenceList);

  const generateCompliantEvidenceStructure = (complaintEvidenceData) => {
    if (!complaintEvidenceData?.artifacts || !Array.isArray(complaintEvidenceData?.artifacts)) return [];
    return complaintEvidenceData?.artifacts
      ?.filter((artifact) => artifact?.file?.fileStore)
      ?.map((artifact, idx) => ({
        id: `complaint-evidence-${idx}`,
        title: t(artifact?.artifactType),
        fileStoreId: artifact?.file?.fileStore,
        hasChildren: false,
      }));
  };

  const generateAccusedEvidenceStructure = (accusedEvidenceData) => {
    if (!accusedEvidenceData?.artifacts || !Array.isArray(accusedEvidenceData?.artifacts)) return [];
    return accusedEvidenceData?.artifacts
      ?.filter((evidence) => evidence?.file?.fileStore)
      ?.map((evidence, idx) => ({
        id: `accused-evidence-${idx}`,
        title: t(evidence?.artifactType),
        fileStoreId: evidence?.file?.fileStore,
        hasChildren: false,
      }));
  };

  const generateCourtEvidenceStructure = (courtEvidenceData, courtEvidenceDepositionData) => {
    // "Depositions" children from courtEvidenceDepositionData
    const depositions = Array.isArray(courtEvidenceDepositionData?.artifacts)
      ? courtEvidenceDepositionData?.artifacts
          ?.filter((artifact) => artifact?.file?.fileStore)
          ?.map((artifact, idx) => ({
            id: `court-deposition-${idx}`,
            title: artifact?.artifactType,
            fileStoreId: artifact?.file?.fileStore,
            hasChildren: false,
          }))
      : [];

    // "Evidences" children from courtEvidenceData
    const evidences = Array.isArray(courtEvidenceData?.artifacts)
      ? courtEvidenceData?.artifacts
          ?.filter((artifact) => artifact?.file?.fileStore)
          ?.map((artifact, idx) => ({
            id: `court-evidence-${idx}`,
            title: artifact?.artifactType,
            fileStoreId: artifact?.file?.fileStore,
            hasChildren: false,
          }))
      : [];

    const result = [];

    if (depositions?.length > 0) {
      result.push({
        id: "court-depositions",
        title: "DEPOSITIONS_PDF_HEADING",
        hasChildren: true,
        children: depositions,
      });
    }

    if (evidences?.length > 0) {
      result.push({
        id: "court-evidences",
        title: "EVIDENCES_PDF_HEADING",
        hasChildren: evidences?.length > 0,
        children: evidences,
      });
    }

    return result;
  };

  useEffect(() => {
    const generateDisposedApplicationStructure = async () => {
      if (!disposedApplicationList?.length) return;

      setLoading(true);
      const childrenItems = await Promise.all(
        disposedApplicationList?.map(async (application, index) => {
          const applicationNumber = application?.applicationNumber;
          const referenceId = application?.referenceId;

          try {
            const orderPromises = [];

            if (referenceId) {
              orderPromises?.push(
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
              orderPromises?.push(
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

            const combinedOrders = orderResponses?.flatMap((res) => res?.list || []);

            const signedDoc = application?.documents?.find((doc) => doc?.documentType === "SIGNED" || doc?.documentType === "CONDONATION_DOC");

            const signedSubitem = signedDoc?.fileStore
              ? {
                  id: `${applicationNumber}-signed`,
                  title: "APPLICATION_PDF_HEADING",
                  fileStoreId: signedDoc?.fileStore,
                  hasChildren: false,
                }
              : null;

            const validObjectionComments = (application?.comment || [])?.filter((comment) => comment?.additionalDetails?.commentDocumentId);

            const objectionChildren = validObjectionComments?.map((comment, objIndex) => ({
              id: `${applicationNumber}-objection-${objIndex}`,
              title: `${t("OBJECTION_APPLICATION")} ${objIndex + 1}`,
              fileStoreId: comment.additionalDetails?.commentDocumentId,
              hasChildren: false,
            }));

            const objectionsSubitem =
              objectionChildren?.length > 0
                ? {
                    id: `${applicationNumber}-objections`,
                    title: "OBJECTION_APPLICATION_HEADING",
                    hasChildren: true,
                    children: objectionChildren,
                  }
                : null;

            const orderChildren = combinedOrders?.map((order, idx) => {
              const document = order?.documents?.find((doc) => doc?.documentType === "SIGNED")?.fileStore;
              if (!document) return null;
              return {
                id: `${applicationNumber}-order-${idx}`,
                title: order?.orderTitle,
                fileStoreId: document,
                hasChildren: false,
              };
            });

            const ordersSubitem =
              orderChildren?.length > 0
                ? {
                    id: `${applicationNumber}-orders`,
                    title: "ORDERS_APPLICATION_HEADING",
                    hasChildren: true,
                    children: orderChildren,
                  }
                : null;

            const childItems = [signedSubitem, objectionsSubitem, ordersSubitem]?.filter(Boolean);

            return {
              id: applicationNumber,
              title: application?.applicationType,
              hasChildren: childItems?.length > 0,
              number: `11.${index + 1}`,
              children: childItems,
            };
          } catch (error) {
            console.error("Error fetching orders for:", applicationNumber, error);
          }
        })
      );

      setDisposedApplicationChildren(childrenItems);
      setLoading(false);
    };

    generateDisposedApplicationStructure();
  }, [disposedApplicationList, courtId, filingNumber, tenantId, t]);

  useEffect(() => {
    const buildBailApplicationStructure = async () => {
      if (!bailApplicationsList || bailApplicationsList.length === 0) return;

      setLoading(true);
      const children = await Promise.all(
        bailApplicationsList?.map(async (application, index) => {
          const signed = [];
          const otherDocument = [];

          application?.documents?.forEach((doc) => {
            if (doc?.fileStore) {
              if (doc?.documentType === "SIGNED") signed?.push(doc?.fileStore);
              else otherDocument?.push(doc);
            }
          });

          const signedNode = {
            id: `${application?.applicationNumber}-signed`,
            title: "APPLICATION_PDF_HEADING",
            hasChildren: false,
            fileStoreId: signed[0] || null,
          };

          const otherDocsChildren = otherDocument?.map((doc, i) => ({
            id: `${application?.applicationNumber}-other-${i}`,
            title: doc?.additionalDetails?.name?.split(".")[0],
            fileStoreId: doc?.fileStore,
            hasChildren: false,
          }));

          const otherDocsNode = {
            id: `${application?.applicationNumber}-others`,
            title: "OTHER_DOCUMENTS_HEADING",
            hasChildren: otherDocsChildren?.length > 0,
            children: otherDocsChildren,
          };

          let submitBailNode = null;
          try {
            const resOrder = await DRISTIService.searchOrders({
              criteria: {
                courtId,
                filingNumber,
                applicationNumber: application?.applicationNumber,
                status: "PUBLISHED",
                orderType: "SET_BAIL_TERMS",
                tenantId,
              },
            });

            const orderList = resOrder?.list || [];

            if (orderList?.length > 0) {
              const resSubmissions = await DRISTIService.searchSubmissions({
                criteria: {
                  courtId,
                  filingNumber,
                  referenceId: orderList[0]?.id,
                  applicationType: "SUBMIT_BAIL_DOCUMENTS",
                  status: "COMPLETED",
                  tenantId,
                },
              });

              const submitApps = resSubmissions?.applicationList || [];

              if (submitApps.length > 0) {
                const docs = submitApps[0]?.documents || [];
                const submitSigned = [];
                const submitOtherDocument = [];

                docs.forEach((doc) => {
                  if (doc?.fileStore) {
                    if (doc?.documentType === "SIGNED") submitSigned?.push(doc?.fileStore);
                    else submitOtherDocument?.push(doc);
                  }
                });

                const submitChildren = [];

                submitSigned?.forEach((fsId, i) =>
                  submitChildren?.push({
                    id: `${application?.applicationNumber}-submit-signed-${i}`,
                    title: "APPLICATION_PDF_HEADING",
                    fileStoreId: fsId,
                    hasChildren: false,
                  })
                );

                if (submitOtherDocument.length > 0) {
                  const othersChildren = submitOtherDocument?.map((doc, j) => ({
                    id: `${application?.applicationNumber}-submit-other-${j}`,
                    title: doc?.additionalDetails?.name?.split(".")[0],
                    fileStoreId: doc?.fileStore,
                    hasChildren: false,
                  }));

                  submitChildren.push({
                    id: `${application?.applicationNumber}-submit-other-group`,
                    title: "OTHER_DOCUMENTS_HEADING",
                    hasChildren: true,
                    children: othersChildren,
                  });
                }

                submitBailNode = {
                  id: `${application?.applicationNumber}-submit-bail`,
                  title: submitApps[0]?.applicationType,
                  hasChildren: true,
                  children: submitChildren,
                };
              }
            }
          } catch (e) {
            console.error("Error fetching Submit Bail Documents for", application?.applicationNumber, e);
          }

          const appChildren = [signedNode, otherDocsNode];
          if (submitBailNode) appChildren?.push(submitBailNode);

          return {
            id: application?.applicationNumber,
            title: t(application?.applicationType) + " " + (index + 1),
            hasChildren: appChildren?.length > 0,
            children: appChildren,
          };
        })
      );
      setLoading(false);
      setBailApplicationChildren(children);
    };

    buildBailApplicationStructure();
  }, [bailApplicationsList, tenantId, courtId, filingNumber, t]);

  useEffect(() => {
    const getOrder = async () => {
      try {
        setLoading(true);
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
            limit: 100,
          },
        });
        const orderData = response?.list || [];
        setLoading(false);
        setPublishedOrderData(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    };

    getOrder();
  }, [filingNumber, tenantId, courtId]);

  const handleMarkAsEvidence = async () => {
    try {
      await evidenceUpdateMutation
        .mutateAsync({
          url: Urls.dristi.evidenceUpdate,
          params: {},
          body: {
            artifact: {
              ...contextMenu?.artifactList,
              isEvidence: true,
            },
          },
          config: {
            enable: true,
          },
        })
        .then(async () => {
          const nextHearing = hearingDetails?.HearingList?.filter((hearing) => hearing?.status === "SCHEDULED");

          await DRISTIService.addADiaryEntry({
            diaryEntry: {
              courtId,
              businessOfDay: `${contextMenu?.artifactNumber} marked as evidence`,
              tenantId,
              entryDate: new Date().setHours(0, 0, 0, 0),
              caseNumber: caseDetails?.cmpNumber,
              referenceId: contextMenu?.artifactNumber,
              referenceType: "Documents",
              hearingDate: (Array.isArray(nextHearing) && nextHearing?.length > 0 && nextHearing[0]?.startTime) || null,
              additionalDetails: {
                filingNumber,
              },
            },
          });
          directEvidenceRefetch();
          applicationEvidenceRefetch();
          complainantEvidenceRefetch();
          accusedEvidenceRefetch();
          courtEvidenceRefetch();
          courtDepositionRefetch();
        });
    } catch (error) {
      console.error("error: ", error);
    }

    setContextMenu(null);
  };

  const generatePublishedOrderChildren = (publishedOrderList) => {
    return publishedOrderList?.map((order, index) => {
      const signedDoc = order?.documents?.find((doc) => doc?.documentType === "SIGNED");
      const fileStoreId = signedDoc?.fileStore;

      return {
        id: `published-order-${index}`,
        title: order?.orderTitle,
        fileStoreId: fileStoreId,
        hasChildren: false,
      };
    });
  };
  const publishedOrderChildren = useMemo(() => generatePublishedOrderChildren(publishedOrderData), [publishedOrderData]);
  const generateCaseFileStructure = (docs) => {
    const groupedDocs = {};

    docs.forEach((doc) => {
      const labelKey = Object?.keys(caseFileLabels)?.find((key) => key === doc?.documentType);
      if (labelKey) {
        const title = caseFileLabels[labelKey];
        const parentKey = doc?.documentType;

        if (!groupedDocs[parentKey]) {
          groupedDocs[parentKey] = [];
        }

        groupedDocs[parentKey].push({
          id: doc?.id,
          title: groupedDocs[parentKey]?.length > 0 ? `${title} ${groupedDocs[parentKey]?.length + 1}` : title,
          fileStoreId: doc?.fileStore,
          hasChildren: false,
        });
      }
    });

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

    const getFileStoreByType = (type) => {
      const doc = docs.find((d) => d?.documentType === type);
      return doc ? doc?.fileStore : null;
    };

    const affidavitChildren = generateAffidavitStructure(docs);
    const pendingApplicationChildren = generatePendingApplicationStructure(applicationList);
    const vakalatnamaChildren = generateVakalatnamaStructure(caseDetails);
    const complaintEvidenceChildren = generateCompliantEvidenceStructure(complaintEvidenceData);
    const accusedEvidenceChildren = generateAccusedEvidenceStructure(accusedEvidenceData);
    const courtEvidenceChildren = generateCourtEvidenceStructure(courtEvidenceData, courtEvidenceDepositionData);

    const casePaymentFilestoreId = getFileStoreByType("PAYMENT_RECEIPT");

    const paymentReceiptsChildren = casePaymentFilestoreId
      ? [
          {
            id: "PAYMENT_RECEIPT",
            title: "CASE_FILING_PAYMENT_RECEIPT",
            fileStoreId: casePaymentFilestoreId,
            hasChildren: false,
          },
        ]
      : [];

    const mainStructureRaw = [
      {
        id: "complaint",
        title: "COMPLAINT_PDF",
        fileStoreId: getFileStoreByType("case.complaint.signed"),
        hasChildren: false,
      },
      {
        id: "pending-application",
        title: "PENDING_APPLICATION",
        hasChildren: pendingApplicationChildren?.length > 0,
        children: pendingApplicationChildren,
      },
      {
        id: "initial-filing",
        title: "INITIAL_FILINGS",
        hasChildren: initialFilingChildren?.length > 0,
        children: initialFilingChildren,
      },
      {
        id: "affidavits",
        title: "AFFIDAVITS_PDF",
        hasChildren: affidavitChildren.length > 0,
        children: affidavitChildren,
      },

      {
        id: "vakalatnama",
        title: "VAKALATS",
        hasChildren: vakalatnamaChildren?.length > 0,
        children: vakalatnamaChildren,
      },
      {
        id: "evidence",
        title: "ADDITIONAL_FILINGS",
        hasChildren: evidenceChildren?.length > 0,
        children: evidenceChildren,
      },
      {
        id: "mandatory-submissions-responses",
        title: "MANDATORY_SUBMISSIONS",
        hasChildren: ordersData?.list?.length > 0,
        children: mandatorySubmissionsChildren,
      },
      {
        id: "complaint-evidence",
        title: "EVIDENCE_OF_COMPLAINANT",
        hasChildren: complaintEvidenceData?.artifacts?.length > 0,
        children: complaintEvidenceChildren,
      },
      {
        id: "accused-evidence",
        title: "EVIDENCE_OF_ACCUSED",
        hasChildren: accusedEvidenceData?.artifacts?.length > 0,
        children: accusedEvidenceChildren,
      },
      {
        id: "court-evidence",
        title: "COURT_EVIDENCE",
        hasChildren: courtEvidenceData?.artifacts?.length > 0 || courtEvidenceDepositionData?.artifacts?.length > 0,
        children: courtEvidenceChildren,
      },
      {
        id: "disposed-applications",
        title: "DISPOSED_APPLICATIONS_PDF",
        hasChildren: disposedApplicationList?.length > 0,
        children: disposedApplicationChildren,
      },
      {
        id: "bail-applications",
        title: "BAIL_APPLICATIONS_PDF",
        hasChildren: bailApplicationsList?.length > 0,
        children: bailApplicationChildren,
      },
      {
        id: "processes",
        title: "PROCESSES_CASE_PDF",
        hasChildren: processChildren?.length > 0,
        children: processChildren,
      },
      {
        id: "payment-receipt",
        title: "PAYMENT_RECEIPT_CASE_PDF",
        hasChildren: paymentReceiptsChildren?.length > 0,
        children: paymentReceiptsChildren,
      },
      {
        id: "orders",
        title: "ORDERS_CASE_PDF",
        hasChildren: publishedOrderData?.length > 0,
        children: publishedOrderChildren,
      },
    ];

    // Filter and assign correct numbers
    const mainStructure = mainStructureRaw
      ?.filter((item) => {
        // If it has children, make sure they exist
        if (item?.hasChildren && Array.isArray(item?.children)) {
          return item?.children?.length > 0;
        }
        // For leaf nodes, check fileStoreId
        if (!item?.hasChildren && item?.fileStoreId) {
          return true;
        }
        return false;
      })
      ?.map((item, index) => ({
        ...item,
        number: index + 1,
      }));

    return mainStructure;
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window?.addEventListener("click", handleClickOutside);
    return () => window?.removeEventListener("click", handleClickOutside);
  }, []);
  const MemoDocViewerWrapper = useMemo(
    () => (
      <DocViewerWrapper
        key={"selectedFileStoreId"}
        tenantId={tenantId}
        fileStoreId={selectedFileStoreId}
        showDownloadOption={false}
        docHeight="100%"
        docWidth="100%"
        docViewerStyle={{ maxWidth: "100%" }}
      />
    ),
    [selectedFileStoreId, tenantId]
  );

  const dynamicCaseFileStructure = generateCaseFileStructure(caseDetails?.documents || []);

  if (
    loading ||
    isDirectEvidenceLoading ||
    isApplicationEvidenceLoading ||
    isBailApplicationLoading ||
    isComplaintEvidenceLoading ||
    isCompletedApplicationLoading ||
    isRejectedApplicationLoading ||
    isPendingDocUploadApplicationLoading ||
    isAccusedEvidenceLoading ||
    isComplaintEvidenceLoading ||
    isCourtEvidenceLoading ||
    isCourtDepositionEvidenceLoading ||
    isBailApplicationLoading ||
    isHearingLoading ||
    isPendingReviewApplicationLoading ||
    isPendingApprovalApplicationLoading ||
    isMandatoryOrdersLoading
  ) {
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
          onContextMenu={(e) => {
            e.preventDefault();
            if (item.fileStoreId) {
              setContextMenu({
                mouseX: e.clientX + 2,
                mouseY: e.clientY - 6,
                fileStoreId: item?.fileStoreId,
                isEvidence: item?.isEvidence,
                artifactNumber: item?.artifactNumber,
                artifactList: item?.artifactList,
                isEvidenceMenu: item?.id?.startsWith("evidence") || false,
              });
            }
          }}
        >
          <span className="menu-item-title" style={{ color: isSelected ? "#3D3C3C" : "#77787B", fontWeight: isSelected ? 700 : 400 }}>
            <span className="menu-item-number">{level === 0 ? displayNumber + "." : displayNumber}</span>
            <span className="menu-item-text">{` ${t(item.title)}`}</span>
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
      <div className="doc-viewer-container">{MemoDocViewerWrapper}</div>
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.mouseY,
            left: contextMenu.mouseX,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div
            style={{ padding: "10px", cursor: "pointer" }}
            onClick={() => {
              downloadPdf(tenantId, contextMenu.fileStoreId);
              setContextMenu(null);
            }}
          >
            {t("DOWNLOAD_PDF")}
          </div>
          {isJudge && contextMenu?.isEvidenceMenu && contextMenu?.isEvidence === false && (
            <div style={{ padding: "10px", cursor: "pointer" }} onClick={handleMarkAsEvidence}>
              {t("MARK_AS_EVIDENCE")}
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
}

export default CaseBundleView;
