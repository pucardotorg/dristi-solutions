package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.enrichment.CtcApplicationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validators.CtcApplicationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class CtcApplicationService {

    private final CtcApplicationRepository ctcApplicationRepository;

    private final CtcApplicationEnrichment ctcApplicationEnrichment;

    private final WorkflowService workflowService;

    private final Configuration config;

    private final Producer producer;

    private final EtreasuryUtil etreasuryUtil;

    private final FileStoreUtil fileStoreUtil;

    private final IndexerUtils indexerUtils;

    private final CtcApplicationValidator ctcApplicationValidator;

    private final CacheService cacheService;

    private final ObjectMapper objectMapper;

    private final ESignUtil eSignUtil;

    private final CipherUtil cipherUtil;

    private final XmlRequestGenerator xmlRequestGenerator;

    private final EgovPdfUtil egovPdfUtil;

    @Autowired
    public CtcApplicationService(CtcApplicationRepository ctcApplicationRepository, CtcApplicationEnrichment ctcApplicationEnrichment, WorkflowService workflowService, Configuration config, Producer producer, EtreasuryUtil etreasuryUtil, FileStoreUtil fileStoreUtil, IndexerUtils indexerUtils, CtcApplicationValidator ctcApplicationValidator, CacheService cacheService, ObjectMapper objectMapper, ESignUtil eSignUtil, CipherUtil cipherUtil, XmlRequestGenerator xmlRequestGenerator, EgovPdfUtil egovPdfUtil) {
        this.ctcApplicationRepository = ctcApplicationRepository;
        this.ctcApplicationEnrichment = ctcApplicationEnrichment;
        this.workflowService = workflowService;
        this.config = config;
        this.producer = producer;
        this.etreasuryUtil = etreasuryUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.indexerUtils = indexerUtils;
        this.ctcApplicationValidator = ctcApplicationValidator;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
        this.eSignUtil = eSignUtil;
        this.cipherUtil = cipherUtil;
        this.xmlRequestGenerator = xmlRequestGenerator;
        this.egovPdfUtil = egovPdfUtil;
    }

    public CtcApplication createApplication(CtcApplicationRequest request) {

        log.info("createApplication method in progress");

        CtcApplication application = request.getCtcApplication();

        ctcApplicationValidator.validateCreateRequest(request);

        ctcApplicationEnrichment.enrichOnCreateCtcApplication(request.getRequestInfo(), application);

        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        producer.push(config.getSaveCtcApplicationTopic(), request);

        cacheService.saveInRedisCache(application);

        log.info("createApplication method completed");

        return stripCaseBundles(application);
    }

    public CtcApplication updateApplication(CtcApplicationRequest request) {

        log.info("updateApplication method in progress for id {}", request.getCtcApplication().getId());

        CtcApplication application = request.getCtcApplication();

        List<String> inactiveFileStoreIds = new ArrayList<>();
        ctcApplicationValidator.validateUpdateRequest(request,inactiveFileStoreIds);

        ctcApplicationEnrichment.enrichOnUpdateCtcApplication(request.getRequestInfo(), application);

        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        if (request.getCtcApplication().getWorkflow() != null && (request.getCtcApplication().getWorkflow().getAction().equalsIgnoreCase(E_SIGN)
                || request.getCtcApplication().getWorkflow().getAction().equalsIgnoreCase(UPLOAD_SIGNED_COPY))) {
            //change logic for calculating payment through payment calculator if required
            List<String> acceptedFileStoreIds = getFileStoreIds(request);
            int totalPages = fileStoreUtil.getTotalPageCount(request.getCtcApplication().getTenantId(), acceptedFileStoreIds);
            request.getCtcApplication().setTotalPages(totalPages);
            log.info("Calculated totalPages={} from {} accepted documents for application: {}",
                    totalPages, acceptedFileStoreIds.size(), request.getCtcApplication().getCtcApplicationNumber());

            Double totalAmount = 20 + request.getCtcApplication().getTotalPages() * 1.5;

            Calculation calculation = Calculation.builder()
                    .totalAmount(totalAmount)
                    .tenantId(request.getCtcApplication().getTenantId())
                    .breakDown(getBreakDown(totalAmount))
                    .build();
            etreasuryUtil.createDemand(request, application.getCtcApplicationNumber() + CTC_APPLICATION_FEE, calculation);
        }

        filterAndDeleteInactiveDocuments(application,inactiveFileStoreIds);

        producer.push(config.getUpdateCtcApplicationTopic(), request);

        cacheService.saveInRedisCache(application);

        log.info("updateApplication method completed for id {}", request.getCtcApplication().getId());

        return stripCaseBundles(application);
    }

    private List<String> getFileStoreIds(CtcApplicationRequest request) {
        List<String> acceptedFileStoreIds = new ArrayList<>();
        CtcApplication application = request.getCtcApplication();

        if (application.getSelectedCaseBundle() == null) {
            return acceptedFileStoreIds;
        }

        if (Boolean.TRUE.equals(application.getIsPartyToCase())) {
            // Party to case: fileStoreIds are directly available in selectedCaseBundle
            for (CaseBundleNode node : application.getSelectedCaseBundle()) {
                collectFileStoreIds(node, acceptedFileStoreIds, null);
            }
        } else {
            // Not party to case: build lookup map from caseBundles for fallback (similar to collectDocuments in IndexerUtils)
            Map<String, String> fileStoreIdMap = new HashMap<>();
            if (application.getCaseBundles() != null) {
                for (CaseBundleNode bundleNode : application.getCaseBundles()) {
                    buildFileStoreIdMap(bundleNode, fileStoreIdMap);
                }
            }
            for (CaseBundleNode node : application.getSelectedCaseBundle()) {
                collectFileStoreIds(node, acceptedFileStoreIds, fileStoreIdMap);
            }
        }

        return acceptedFileStoreIds;
    }

    private void collectFileStoreIds(CaseBundleNode node, List<String> fileStoreIds, Map<String, String> fileStoreIdMap) {
        if (node == null) return;

        // Use fileStoreId from selectedCaseBundle, fallback to caseBundles lookup if map is provided
        String fileStoreId = node.getFileStoreId();
        if (fileStoreId == null && fileStoreIdMap != null) {
            fileStoreId = fileStoreIdMap.get(node.getId());
        }

        if (fileStoreId != null) {
            fileStoreIds.add(fileStoreId);
        }

        if (node.getChildren() != null) {
            for (CaseBundleNode child : node.getChildren()) {
                collectFileStoreIds(child, fileStoreIds, fileStoreIdMap);
            }
        }
    }

    private void buildFileStoreIdMap(CaseBundleNode node, Map<String, String> fileStoreIdMap) {
        if (node == null) return;
        if (node.getId() != null && node.getFileStoreId() != null) {
            fileStoreIdMap.put(node.getId(), node.getFileStoreId());
        }
        if (node.getChildren() != null) {
            for (CaseBundleNode child : node.getChildren()) {
                buildFileStoreIdMap(child, fileStoreIdMap);
            }
        }
    }

    public List<CtcApplication> searchApplications(CtcApplicationSearchRequest ctcApplicationSearchRequest) {
        String ctcApplicationNumber = ctcApplicationSearchRequest.getCriteria() != null
                ? ctcApplicationSearchRequest.getCriteria().getCtcApplicationNumber() : null;

        // Try Redis first if searching by ctcApplicationNumber
        if (ctcApplicationNumber != null) {
            CtcApplication cached = cacheService.searchRedisCache(ctcApplicationNumber);
            if (cached != null) {
                log.info("CTC application found in Redis cache for ctcApplicationNumber: {}", ctcApplicationNumber);
                return Collections.singletonList(cached);
            }
        }

        enrichSearchCriteriaForCitizen(ctcApplicationSearchRequest);
        List<CtcApplication> applications = ctcApplicationRepository.getCtcApplication(ctcApplicationSearchRequest);
        if (applications == null) {
            return new ArrayList<>();
        }

        // Save results in Redis
        for (CtcApplication app : applications) {
            if (app.getCtcApplicationNumber() != null) {
                cacheService.saveInRedisCache(app);
            }
        }

        applications.forEach(this::stripCaseBundles);
        return applications;
    }

    private CtcApplication stripCaseBundles(CtcApplication application) {
        application.setCaseBundles(null);
        return application;
    }

    private void enrichSearchCriteriaForCitizen(CtcApplicationSearchRequest request) {
        if (request.getRequestInfo() != null && request.getRequestInfo().getUserInfo() != null) {
            boolean isCitizen = request.getRequestInfo().getUserInfo().getRoles().stream()
                    .anyMatch(role -> ServiceConstants.CITIZEN_ROLE.equalsIgnoreCase(role.getCode()));

            if (isCitizen && request.getCriteria() != null) {
                String userUuid = request.getRequestInfo().getUserInfo().getUuid();
                request.getCriteria().setCreatedBy(userUuid);
            }
        }
    }

    public void markDocumentsAsIssuedOrReject(IssueCtcDocumentUpdateRequest request) {
        try {
            List<DocumentActionItem> docs = request.getDocs();
            String courtId = request.getCourtId();
            String action = request.getAction();
            RequestInfo requestInfo = request.getRequestInfo();

            // Determine status based on request-level action
            String docStatus = ServiceConstants.ACTION_ISSUE.equalsIgnoreCase(action)
                    ? ServiceConstants.STATUS_ISSUED
                    : ServiceConstants.STATUS_REJECTED;

            Map<String, Map<String, Integer>> ctcApplicationNumberToDocActionItems = new HashMap<>();
            docs.forEach(doc -> {
                String ctcApplicationNumber = doc.getCtcApplicationNumber();

                if (!ctcApplicationNumberToDocActionItems.containsKey(ctcApplicationNumber)) {
                    // 4. Determine current ES doc status counts
                    Map<String, Integer> statusCounts = null;
                    try {
                        statusCounts = indexerUtils.getDocStatusCounts(ctcApplicationNumber);

                    } catch (Exception e) {
                        log.error("Error getting doc status counts for ctcApplicationNumber: {}", ctcApplicationNumber, e);
                        throw new CustomException("EXCEPTION_OCCURED_WHILE_GETTING_COUNT", e.getMessage());
                    }
                    ctcApplicationNumberToDocActionItems.put(
                            doc.getCtcApplicationNumber(),
                            statusCounts != null ? statusCounts : new HashMap<>()
                    );
                }
            });

            // Process each document sequentially
            for (DocumentActionItem item : docs) {
                try {
                    String ctcApplicationNumber = item.getCtcApplicationNumber();
                    String docId = item.getDocId();

                    Document document = null;
                    if (!CollectionUtils.isEmpty(item.getDocuments())) {
                        document = item.getDocuments().get(0);
                    }

                    // 2. Fetch fresh CTC application (re-fetch each time since previous iteration may have updated it)
                    CtcApplication ctcApplication = fetchCtcApplication(ctcApplicationNumber, item.getFilingNumber(), courtId);

                    // 3. If ISSUE: enrich the matching selectedCaseBundle child's fileStoreId
                    if (ServiceConstants.ACTION_ISSUE.equalsIgnoreCase(action)) {
                        enrichFileStoreIdFromCaseBundles(ctcApplication, docId, document);
                    } else {
                        enrichStatusInCaseBundles(ctcApplication, docId);
                    }

                    Integer totalIssued = ctcApplicationNumberToDocActionItems.get(ctcApplicationNumber).getOrDefault(STATUS_ISSUED, 0);
                    Integer totalRejected = ctcApplicationNumberToDocActionItems.get(ctcApplicationNumber).getOrDefault(STATUS_REJECTED, 0);
                    Integer totalPending = ctcApplicationNumberToDocActionItems.get(ctcApplicationNumber).getOrDefault(STATUS_PENDING, 0);

                    String workflowAction = null;
                    if (ServiceConstants.ACTION_ISSUE.equalsIgnoreCase(action)) {
                        workflowAction = determineWorkflowAction(ctcApplication.getStatus(), totalIssued + 1, totalRejected, totalPending);
                    } else {
                        workflowAction = determineWorkflowAction(ctcApplication.getStatus(), totalIssued, totalRejected + 1, totalPending);
                    }

                    if (workflowAction != null) {
                        WorkflowObject workflow = new WorkflowObject();
                        workflow.setAction(workflowAction);
                        ctcApplication.setWorkflow(workflow);
                    }

                    // 5. Call updateApplication to persist changes
                    CtcApplicationRequest updateRequest = CtcApplicationRequest.builder()
                            .requestInfo(requestInfo)
                            .ctcApplication(ctcApplication)
                            .build();
                    updateApplication(updateRequest);

                    Map<String, Integer> statusCounts = ctcApplicationNumberToDocActionItems.get(ctcApplicationNumber);
                    if (ServiceConstants.ACTION_ISSUE.equalsIgnoreCase(action)) {
                        statusCounts.put(STATUS_ISSUED, totalIssued + 1);
                    } else {
                        statusCounts.put(STATUS_REJECTED, totalRejected + 1);
                    }
                    // 1. Update this document's status and documents in ES
                    indexerUtils.updateDocStatus(docId, ctcApplicationNumber, docStatus, item.getDocuments());

                    log.info("Processed doc {} for application: {}, workflowAction: {}", docId, ctcApplicationNumber, workflowAction);
                } catch (Exception e) {
                    log.error("Error processing issue/reject for document {}", item);
                }
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing bulk issue/reject for documents", e);
            throw new CustomException(ServiceConstants.CTC_ISSUE_DOCUMENTS_UPDATE_EXCEPTION,
                    "Error processing bulk issue/reject: " + e.getMessage());
        }
    }

    public CtcApplication fetchCtcApplication(String ctcApplicationNumber, String filingNumber, String courtId) {
        // Try Redis first
        if (ctcApplicationNumber != null) {
            CtcApplication cached = cacheService.searchRedisCache(ctcApplicationNumber);
            if (cached != null) {
                log.info("CTC application found in Redis cache for ctcApplicationNumber: {}", ctcApplicationNumber);
                return cached;
            }
        }

        // Fallback to DB
        CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                .criteria(CtcApplicationSearchCriteria.builder()
                        .ctcApplicationNumber(ctcApplicationNumber)
                        .filingNumber(filingNumber)
                        .courtId(courtId)
                        .build())
                .build();
        List<CtcApplication> ctcApplications = ctcApplicationRepository.getCtcApplication(searchRequest);
        if (ctcApplications == null || ctcApplications.isEmpty()) {
            throw new CustomException(ServiceConstants.CTC_ISSUE_DOCUMENTS_UPDATE_EXCEPTION,
                    "CTC application not found: " + ctcApplicationNumber);
        }
        cacheService.saveInRedisCache(ctcApplications.get(0));
        return ctcApplications.get(0);
    }

    private void enrichFileStoreIdFromCaseBundles(CtcApplication ctcApplication, String docId, Document document) {

        // Build id -> CaseBundleNode map from selectedCaseBundle for O(1) update
        Map<String, CaseBundleNode> selectedNodeMap = buildSelectedNodeMap(ctcApplication.getSelectedCaseBundle());
        CaseBundleNode targetNode = selectedNodeMap.get(docId);

        if (targetNode != null) {
            targetNode.setIssuedFileStoreId(document.getFileStore());
            targetNode.setStatus("ACCEPTED");
            log.info("Enriched fileStoreId for doc {} in application {}", docId, ctcApplication.getCtcApplicationNumber());
        }
    }

    private void enrichStatusInCaseBundles(CtcApplication ctcApplication, String docId) {

        // Build id -> CaseBundleNode map from selectedCaseBundle for O(1) update
        Map<String, CaseBundleNode> selectedNodeMap = buildSelectedNodeMap(ctcApplication.getSelectedCaseBundle());
        CaseBundleNode targetNode = selectedNodeMap.get(docId);

        if (targetNode != null) {
            targetNode.setStatus("REJECTED");
        }
    }

    private Map<String, String> buildBundleFileStoreMap(List<CaseBundleNode> caseBundles) {
        Map<String, String> map = new HashMap<>();
        if (caseBundles == null) return map;
        for (CaseBundleNode parentNode : caseBundles) {
            if (parentNode.getId() != null && parentNode.getFileStoreId() != null) {
                map.put(parentNode.getId(), parentNode.getFileStoreId());
            }
            if (parentNode.getChildren() != null) {
                for (CaseBundleNode child : parentNode.getChildren()) {
                    if (child.getId() != null && child.getFileStoreId() != null) {
                        map.put(child.getId(), child.getFileStoreId());
                    }
                }
            }
        }
        return map;
    }

    private Map<String, CaseBundleNode> buildSelectedNodeMap(List<CaseBundleNode> selectedCaseBundle) {
        Map<String, CaseBundleNode> map = new HashMap<>();
        if (selectedCaseBundle == null) return map;
        for (CaseBundleNode parentNode : selectedCaseBundle) {
            if (parentNode.getId() != null) {
                map.put(parentNode.getId(), parentNode);
            }
            if (parentNode.getChildren() != null) {
                for (CaseBundleNode child : parentNode.getChildren()) {
                    if (child.getId() != null) {
                        map.put(child.getId(), child);
                    }
                }
            }
        }
        return map;
    }

    private String determineWorkflowAction(String currentStatus, int totalIssued, int totalRejected, int totalPending) {
        if (totalIssued == 0 && totalRejected == 0) {
            return null;
        }

        if (PENDING_ISSUE.equalsIgnoreCase(currentStatus)) {
            // At least one issued → move to PARTIALLY_ISSUED
            if (totalIssued > 0) {
                return WF_ACTION_ISSUE;
            }
            // All rejected, none pending → REJECT_ALL (terminal)
            if (totalRejected > 0 && totalPending == 0) {
                return WF_ACTION_REJECT_ALL;
            }
            // Some rejected, still pending → REJECT (stay in PENDING_ISSUE)
            if (totalRejected > 0 && totalPending > 0) {
                return WF_ACTION_REJECT;
            }
        }

        if (PARTIALLY_ISSUED.equalsIgnoreCase(currentStatus)) {
            // All docs processed → ISSUE_ALL (terminal)
            if (totalPending == 0) {
                return WF_ACTION_ISSUE_ALL;
            }
            // Still pending docs → ISSUE (stay in PARTIALLY_ISSUED)
            return WF_ACTION_ISSUE;
        }

        return null;
    }

    public List<CtcApplication> reviewApplications(CtcApplicationReviewRequest request) {
        String action = request.getAction();
        String courtId = request.getCourtId();
        RequestInfo requestInfo = request.getRequestInfo();
        List<CtcApplication> updatedApplications = new ArrayList<>();

        for (ReviewItem item : request.getApplications()) {
            log.info("Reviewing CTC application: {}, action: {}", item.getCtcApplicationNumber(), action);

            // Fetch the CTC application from DB
            CtcApplicationSearchRequest searchRequest = CtcApplicationSearchRequest.builder()
                    .criteria(CtcApplicationSearchCriteria.builder()
                            .ctcApplicationNumber(item.getCtcApplicationNumber())
                            .filingNumber(item.getFilingNumber())
                            .courtId(courtId)
                            .build())
                    .build();
            List<CtcApplication> ctcApplications = ctcApplicationRepository.getCtcApplication(searchRequest);
            if (ctcApplications == null || ctcApplications.isEmpty()) {
                throw new CustomException("CTC_REVIEW_APPLICATION_ERROR",
                        "CTC application not found: " + item.getCtcApplicationNumber());
            }
            CtcApplication ctcApplication = ctcApplications.get(0);

            // Enrich with review fields
            ctcApplication.setJudgeComments(item.getComments());

            // Enrich audit details
            ctcApplicationEnrichment.enrichOnUpdateCtcApplication(requestInfo, ctcApplication);

            // Set workflow action
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(action);
            ctcApplication.setWorkflow(workflow);
            workflowService.updateWorkflowStatus(ctcApplication, requestInfo);
            Long date = System.currentTimeMillis();
            if (PENDING_ISSUE.equalsIgnoreCase(ctcApplication.getStatus())) {
                indexerUtils.pushIssueCtcDocumentsToIndex(ctcApplication);
                indexerUtils.updateTrackerStatus(ctcApplication.getCtcApplicationNumber(), "APPROVED", date);
                ctcApplication.setDateOfApplicationApproval(date);
            }
            if ("REJECTED".equalsIgnoreCase(ctcApplication.getStatus())) {
                indexerUtils.updateTrackerStatus(ctcApplication.getCtcApplicationNumber(), "REJECTED", null);
                ctcApplication.getSelectedCaseBundle().forEach(node -> {
                    node.setStatus("REJECTED");
                });
            }

            // Persist the updated application
            CtcApplicationRequest ctcApplicationRequest = CtcApplicationRequest.builder()
                    .requestInfo(requestInfo)
                    .ctcApplication(ctcApplication)
                    .build();
            producer.push(config.getUpdateCtcApplicationTopic(), ctcApplicationRequest);

            log.info("Reviewed CTC application: {}, action: {}", item.getCtcApplicationNumber(), action);
            updatedApplications.add(ctcApplication);
        }

        return updatedApplications;
    }

    public ValidateUserInfo validateUser(ValidateUserRequest request) {
        CtcApplication application = CtcApplication.builder()
                .filingNumber(request.getFilingNumber())
                .courtId(request.getCourtId())
                .mobileNumber(request.getMobileNumber())
                .build();

        ctcApplicationValidator.validateAndEnrichUser(request.getRequestInfo(), application);

        return ValidateUserInfo.builder()
                .userName(application.getApplicantName())
                .designation(application.getPartyDesignation())
                .mobileNumber(request.getMobileNumber())
                .filingNumber(request.getFilingNumber())
                .courtId(request.getCourtId())
                .isPartyToCase(application.getIsPartyToCase())
                .build();
    }

    private CtcApplication filterAndDeleteInactiveDocuments(CtcApplication application, List<String> inactiveFileStoreIds) {

        if (application == null) {
            return null;
        }

        List<String> finalStatus = Arrays.asList("REJECT_ALL", "ISSUED","PARTIALLY_ISSUED");

        if (application.getDocuments() != null) {

            List<Document> filteredDocs = application.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .filter(doc -> {

                        // Remove inactive documents
                        if (Boolean.FALSE.equals(doc.getIsActive())) {
                            if (doc.getFileStore() != null) {
                                inactiveFileStoreIds.add(doc.getFileStore());
                            }
                            return false;
                        }

                        // Remove MERGED_FILE when application is final
                        if (finalStatus.contains(application.getStatus()) && ("merged_file".equals(doc.getDocumentType()) || "sealed_file".equals(doc.getDocumentType()))) {

                            if (doc.getFileStore() != null) {
                                inactiveFileStoreIds.add(doc.getFileStore());
                            }
                            return false;
                        }

                        return true;
                    })
                    .collect(Collectors.toList());

            application.setDocuments(filteredDocs);
        }

        if (!inactiveFileStoreIds.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(inactiveFileStoreIds, application.getTenantId());
            log.info("Deleted files from file store: {}", inactiveFileStoreIds);
        }

        return application;
    }


    private List<BreakDown> getBreakDown(Double totalAmount) {
        BreakDown breakDown = new BreakDown();
        breakDown.setCode(config.getBreakDownCode());
        breakDown.setType(config.getBreakDownType());
        breakDown.setAmount(totalAmount);

        List<BreakDown> breakDownList = new ArrayList<>();
        breakDownList.add(breakDown);
        return breakDownList;
    }

    public List<DocToSign> createDocsToSignRequest(DocsToSignRequest request) {
        log.info("Creating docs to sign request, criteria count: {}", request.getCriteria().size());

        List<CoordinateCriteria> coordinateCriteria = new ArrayList<>();
        Map<String, DocsToSignCriteria> criteriaMap = new HashMap<>();

        request.getCriteria().forEach(criterion -> {

            String sealedTemplateFileStoreId = null;
            CtcApplication ctcApplication = fetchCtcApplication(criterion.getCtcApplicationNumber(), criterion.getFilingNumber(), criterion.getCourtId());
            sealedTemplateFileStoreId = egovPdfUtil.getSealedTemplateFileStoreId(request.getRequestInfo(), ctcApplication, criterion.getDocTitle());
            log.info("sealedTemplateFileStoreId for docId {} in application {}", criterion.getDocId(), criterion.getCtcApplicationNumber());

            String mergedFileStoreId = fileStoreUtil.mergeFiles(sealedTemplateFileStoreId, criterion.getFileStoreId(), criterion.getTenantId());

            log.info("mergedFileStoreId {}", mergedFileStoreId);

            // Create documents for sealed template and merged file
            List<Document> documents = ctcApplication.getDocuments();
            if (documents == null) {
                documents = new ArrayList<>();
                ctcApplication.setDocuments(documents);
            }

            // Add sealed template document
            Document sealedDocument = Document.builder()
                    .documentType("sealed_file")
                    .fileStore(sealedTemplateFileStoreId)
                    .documentUid(UUID.randomUUID().toString())
                    .isActive(true)
                    .build();
            documents.add(sealedDocument);

            // Add merged file document
            Document mergedDocument = Document.builder()
                    .documentType("merged_file")
                    .fileStore(mergedFileStoreId)
                    .documentUid(UUID.randomUUID().toString())
                    .isActive(true)
                    .build();
            documents.add(mergedDocument);

            // Update ctcApplication in database with new documents
            CtcApplicationRequest updateRequest = CtcApplicationRequest.builder()
                    .requestInfo(request.getRequestInfo())
                    .ctcApplication(ctcApplication)
                    .build();
            producer.push(config.getUpdateCtcDocumentsTopic(), updateRequest);
            log.info("Updated ctcApplication {} with sealed and merged documents", ctcApplication.getCtcApplicationNumber());
            cacheService.saveInRedisCache(ctcApplication);

            CoordinateCriteria cc = new CoordinateCriteria();
            cc.setFileStoreId(mergedFileStoreId);
            cc.setPlaceholder(criterion.getPlaceholder());
            cc.setTenantId(criterion.getTenantId());
            coordinateCriteria.add(cc);
            criteriaMap.put(mergedFileStoreId, criterion);
        });

        CoordinateRequest coordinateRequest = CoordinateRequest.builder()
                .requestInfo(request.getRequestInfo())
                .criteria(coordinateCriteria).build();
        List<Coordinate> coordinates = eSignUtil.getCoordinateForSign(coordinateRequest);

        if (coordinates.isEmpty() || coordinates.size() != request.getCriteria().size()) {
            throw new CustomException(COORDINATES_ERROR, "Error in co-ordinates");
        }

        List<DocToSign> docsToSign = new ArrayList<>();
        for (Coordinate coordinate : coordinates) {
            Resource resource;
            try {
                resource = fileStoreUtil.fetchFileStoreObjectById(coordinate.getFileStoreId(), coordinate.getTenantId());
            } catch (Exception e) {
                throw new CustomException(FILE_STORE_UTILITY_EXCEPTION, "Something went wrong while fetching file for signing");
            }
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int) Math.floor(coordinate.getX()) + "," + (int) Math.floor(coordinate.getY());
                String txnId = UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                ZonedDateTime timestamp = ZonedDateTime.now(ZoneId.of(config.getZoneId()));

                String xmlRequest = generateSignRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                String docId = criteriaMap.get(coordinate.getFileStoreId()).getDocId();
                String ctcApplicationNumber = criteriaMap.get(coordinate.getFileStoreId()).getCtcApplicationNumber();
                String filingNumber = criteriaMap.get(coordinate.getFileStoreId()).getFilingNumber();

                DocToSign docToSign = DocToSign.builder()
                        .docId(docId)
                        .ctcApplicationNumber(ctcApplicationNumber)
                        .filingNumber(filingNumber)
                        .request(xmlRequest)
                        .build();
                docsToSign.add(docToSign);
            } catch (Exception e) {
                throw new CustomException(CTC_SIGN_ERROR, "Something went wrong while preparing sign request");
            }
        }
        log.info("Created docs to sign request successfully, count: {}", docsToSign.size());
        return docsToSign;
    }

    public void updateDocsWithSignedCopy(UpdateSignedDocsRequest request) {
        log.info("Updating docs with signed copies, count: {}", request.getSignedDocs().size());
        try {

            RequestInfo requestInfo = request.getRequestInfo();
            List<DocumentActionItem> docs = new ArrayList<>();

            for (SignedDoc signedDoc : request.getSignedDocs()) {
                String docId = signedDoc.getDocId();
                String signedDocData = signedDoc.getSignedDocData();
                Boolean isSigned = signedDoc.getSigned();
                String tenantId = signedDoc.getTenantId();
                String ctcApplicationNumber = signedDoc.getCtcApplicationNumber();
                String filingNumber = signedDoc.getFilingNumber();

                if (Boolean.TRUE.equals(isSigned)) {
                    try {
                        MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedDocData, CTC_DOC_PDF_NAME);
                        String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                        Document document = Document.builder()
                                .documentType(SIGNED)
                                .fileStore(fileStoreId)
                                .isActive(true)
                                .additionalDetails(Map.of(NAME, CTC_DOC_PDF_NAME))
                                .build();

                        docs.add(DocumentActionItem.builder()
                                .docId(docId)
                                .documents(List.of(document))
                                .ctcApplicationNumber(ctcApplicationNumber)
                                .filingNumber(filingNumber)
                                .build());

                    } catch (Exception e) {
                        log.error("Error while updating CTC docId {}, ctcApplicationNumber: {}", docId, ctcApplicationNumber);
                    }
                }
            }

            IssueCtcDocumentUpdateRequest issueCtcDocumentUpdateRequest = IssueCtcDocumentUpdateRequest.builder()
                    .requestInfo(requestInfo)
                    .action("ISSUE")
                    .courtId(request.getCourtId())
                    .docs(docs)
                    .build();
            markDocumentsAsIssuedOrReject(issueCtcDocumentUpdateRequest);
            log.info("Issued CTC applications with signed doc");

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException(CTC_BULK_SIGN_EXCEPTION, "Error while processing CTC doc: " + e.getMessage());
        }
    }

    private String generateSignRequest(String base64Doc, String timeStamp, String txnId, String coordination, String pageNumber) {
        log.info("Generating sign request, txnId: {}, coordination: {}, pageNumber: {}", txnId, coordination, pageNumber);
        Map<String, Object> requestData = new LinkedHashMap<>();

        requestData.put(COMMAND, PKI_NETWORK_SIGN);
        requestData.put(TIME_STAMP, timeStamp);
        requestData.put(TXN, txnId);

        List<Map<String, Object>> certificateAttributes = new ArrayList<>();
        certificateAttributes.add(createAttribute("CN", ""));
        certificateAttributes.add(createAttribute("O", ""));
        certificateAttributes.add(createAttribute("OU", ""));
        certificateAttributes.add(createAttribute("T", ""));
        certificateAttributes.add(createAttribute("E", ""));
        certificateAttributes.add(createAttribute("SN", ""));
        certificateAttributes.add(createAttribute("CA", ""));
        certificateAttributes.add(createAttribute("TC", "SG"));
        certificateAttributes.add(createAttribute("AP", "1"));
        requestData.put(CERTIFICATE, certificateAttributes);

        Map<String, Object> file = new LinkedHashMap<>();
        file.put(ATTRIBUTE, Map.of(NAME, TYPE, VALUE, PDF));
        requestData.put(FILE, file);

        Map<String, Object> pdf = new LinkedHashMap<>();
        pdf.put(PAGE, pageNumber);
        pdf.put(CO_ORDINATES, coordination);
        pdf.put(SIZE, config.getEsignSignatureWidth() + "," + config.getEsignSignatureHeight());
        pdf.put(DATE_FORMAT, ESIGN_DATE_FORMAT);
        requestData.put(PDF, pdf);

        requestData.put(DATA, base64Doc);

        return xmlRequestGenerator.createXML("request", requestData);
    }

    private Map<String, Object> createAttribute(String name, String value) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        Map<String, String> attrData = new LinkedHashMap<>();
        attrData.put(NAME, name);
        attrData.put(VALUE, value);
        attribute.put(ATTRIBUTE, attrData);
        return attribute;
    }
}
