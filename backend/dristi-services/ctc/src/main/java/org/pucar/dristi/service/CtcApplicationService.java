package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.enrichment.CtcApplicationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CtcApplicationRepository;
import org.pucar.dristi.util.EtreasuryUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.IndexerUtils;
import org.pucar.dristi.validators.CtcApplicationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    @Autowired
    public CtcApplicationService(CtcApplicationRepository ctcApplicationRepository, CtcApplicationEnrichment ctcApplicationEnrichment, WorkflowService workflowService, Configuration config, Producer producer, EtreasuryUtil etreasuryUtil, FileStoreUtil fileStoreUtil, IndexerUtils indexerUtils, CtcApplicationValidator ctcApplicationValidator, CacheService cacheService, ObjectMapper objectMapper) {
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
    }

    public CtcApplication createApplication(CtcApplicationRequest request) {

        log.info("createApplication method in progress");

        CtcApplication application = request.getCtcApplication();

        ctcApplicationValidator.validateCreateRequest(request);

        ctcApplicationEnrichment.enrichOnCreateCtcApplication(request.getRequestInfo(), application);

        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        producer.push(config.getSaveCtcApplicationTopic(), request);

        saveInRedisCache(application);

        log.info("createApplication method completed");

        return stripCaseBundles(application);
    }

    public CtcApplication updateApplication(CtcApplicationRequest request) {

        log.info("updateApplication method in progress for id {}", request.getCtcApplication().getId());

        CtcApplication application = request.getCtcApplication();

        ctcApplicationValidator.validateUpdateRequest(request);

        ctcApplicationEnrichment.enrichOnUpdateCtcApplication(request.getRequestInfo(), application);

        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        if (request.getCtcApplication().getWorkflow() != null && (request.getCtcApplication().getWorkflow().getAction().equalsIgnoreCase(E_SIGN)
                || request.getCtcApplication().getWorkflow().getAction().equalsIgnoreCase(UPLOAD_SIGNED_COPY))) {
            //change logic for calculating payment through payment calculator if required
            if (request.getCtcApplication().getTotalPages() == null) {
                List<String> acceptedFileStoreIds = getFileStoreIds(request);
                int totalPages = fileStoreUtil.getTotalPageCount(request.getCtcApplication().getTenantId(), acceptedFileStoreIds);
                request.getCtcApplication().setTotalPages(totalPages);
                log.info("Calculated totalPages={} from {} accepted documents for application: {}",
                        totalPages, acceptedFileStoreIds.size(), request.getCtcApplication().getCtcApplicationNumber());
            }

            Double totalAmount = 20 + request.getCtcApplication().getTotalPages() * 1.5;

            Calculation calculation = Calculation.builder()
                    .totalAmount(totalAmount)
                    .tenantId(request.getCtcApplication().getTenantId())
                    .breakDown(getBreakDown(totalAmount))
                    .build();
            etreasuryUtil.createDemand(request, application.getCtcApplicationNumber() + CTC_APPLICATION_FEE, calculation);
        }
        if (PENDING_ISSUE.equalsIgnoreCase(request.getCtcApplication().getStatus())) {
            indexerUtils.pushIssueCtcDocumentsToIndex(application);
            indexerUtils.deactivateTracker(application.getCtcApplicationNumber());
        }

        producer.push(config.getUpdateCtcApplicationTopic(), request);

        saveInRedisCache(application);

        log.info("updateApplication method completed for id {}", request.getCtcApplication().getId());

        return stripCaseBundles(application);
    }

    private List<String> getFileStoreIds(CtcApplicationRequest request) {
        List<String> acceptedFileStoreIds = new ArrayList<>();
        if (request.getCtcApplication().getSelectedCaseBundle() != null) {
            for (SelectedCaseBundleNode parentNode : request.getCtcApplication().getSelectedCaseBundle()) {
                if (parentNode.getChildren() != null) {
                    for (SelectedCaseBundleNode child : parentNode.getChildren()) {
                        if (child.getFileStoreId() != null) {
                            acceptedFileStoreIds.add(child.getFileStoreId());
                        }
                    }
                }
            }
        }
        return acceptedFileStoreIds;
    }

    public List<CtcApplication> searchApplications(CtcApplicationSearchRequest ctcApplicationSearchRequest) {
        String ctcApplicationNumber = ctcApplicationSearchRequest.getCriteria() != null
                ? ctcApplicationSearchRequest.getCriteria().getCtcApplicationNumber() : null;

        // Try Redis first if searching by ctcApplicationNumber
        if (ctcApplicationNumber != null) {
            CtcApplication cached = searchRedisCache(ctcApplicationNumber);
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
                saveInRedisCache(app);
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

            // Process each document sequentially
            for (DocumentActionItem item : docs) {
                String ctcApplicationNumber = item.getCtcApplicationNumber();
                String docId = item.getDocId();

                // 1. Update this document's status in ES
                indexerUtils.updateDocStatus(docId, docStatus);
                log.info("Updated doc {} to status {} for application: {}", docId, docStatus, ctcApplicationNumber);

                // 2. Fetch fresh CTC application (re-fetch each time since previous iteration may have updated it)
                CtcApplication ctcApplication = fetchCtcApplication(ctcApplicationNumber, item.getFilingNumber(), courtId);

                // 3. If ISSUE: enrich the matching selectedCaseBundle child's fileStoreId from caseBundles
                if (ServiceConstants.ACTION_ISSUE.equalsIgnoreCase(action)) {
                    enrichFileStoreIdFromCaseBundles(ctcApplication, docId);
                }

                // 4. Determine workflow action from current ES doc status counts
                Map<String, Integer> statusCounts = indexerUtils.getDocStatusCounts(ctcApplicationNumber);
                int totalDocs = statusCounts.values().stream().mapToInt(Integer::intValue).sum();
                int totalIssued = statusCounts.getOrDefault(ServiceConstants.STATUS_ISSUED, 0);
                int totalRejected = statusCounts.getOrDefault(ServiceConstants.STATUS_REJECTED, 0);
                int totalPending = statusCounts.getOrDefault("PENDING", 0);

                String workflowAction = determineWorkflowAction(totalDocs, totalIssued, totalRejected, totalPending);

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

                log.info("Processed doc {} for application: {}, workflowAction: {}", docId, ctcApplicationNumber, workflowAction);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing bulk issue/reject for documents", e);
            throw new CustomException(ServiceConstants.CTC_ISSUE_DOCUMENTS_UPDATE_EXCEPTION,
                    "Error processing bulk issue/reject: " + e.getMessage());
        }
    }

    private CtcApplication fetchCtcApplication(String ctcApplicationNumber, String filingNumber, String courtId) {
        // Try Redis first
        if (ctcApplicationNumber != null) {
            CtcApplication cached = searchRedisCache(ctcApplicationNumber);
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
        return ctcApplications.get(0);
    }

    private void enrichFileStoreIdFromCaseBundles(CtcApplication ctcApplication, String docId) {
        // Build id -> fileStoreId map from caseBundles for O(1) lookup
        Map<String, String> bundleFileStoreMap = buildBundleFileStoreMap(ctcApplication.getCaseBundles());
        String fileStoreId = bundleFileStoreMap.get(docId);

        if (fileStoreId == null) {
            log.warn("No fileStoreId found in caseBundles for docId: {} in application: {}", docId, ctcApplication.getCtcApplicationNumber());
            return;
        }

        // Build id -> SelectedCaseBundleNode map from selectedCaseBundle for O(1) update
        Map<String, SelectedCaseBundleNode> selectedNodeMap = buildSelectedNodeMap(ctcApplication.getSelectedCaseBundle());
        SelectedCaseBundleNode targetNode = selectedNodeMap.get(docId);

        if (targetNode != null) {
            targetNode.setFileStoreId(fileStoreId);
            log.info("Enriched fileStoreId for doc {} in application {}", docId, ctcApplication.getCtcApplicationNumber());
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

    private Map<String, SelectedCaseBundleNode> buildSelectedNodeMap(List<SelectedCaseBundleNode> selectedCaseBundle) {
        Map<String, SelectedCaseBundleNode> map = new HashMap<>();
        if (selectedCaseBundle == null) return map;
        for (SelectedCaseBundleNode parentNode : selectedCaseBundle) {
            if (parentNode.getId() != null) {
                map.put(parentNode.getId(), parentNode);
            }
            if (parentNode.getChildren() != null) {
                for (SelectedCaseBundleNode child : parentNode.getChildren()) {
                    if (child.getId() != null) {
                        map.put(child.getId(), child);
                    }
                }
            }
        }
        return map;
    }

    private String determineWorkflowAction(int totalDocs, int totalIssued, int totalRejected, int totalPending) {
        // CMO not approved any document → Pending (no workflow transition)
        if (totalIssued == 0 && totalRejected == 0) {
            return null;
        }

        // CMO accepted all documents → Issued
        if (totalPending == 0 && totalRejected == 0 && totalIssued > 0) {
            return "ISSUE_ALL";
        }

        // CMO rejected all docs → Rejected by CMO
        if (totalPending == 0 && totalIssued == 0 && totalRejected > 0) {
            return "REJECT_ALL";
        }

        // All docs processed (mix of issued/rejected, none pending) → Issued
        if (totalPending == 0 && totalIssued > 0 && totalRejected > 0) {
            return "ISSUE_ALL";
        }

        // CMO partially accepted documents (some issued, some still pending) → Partially Issued
        if (totalIssued > 0 && totalPending > 0) {
            return "ISSUE";
        }

        // Few documents rejected, few no action (some rejected, some still pending) → Partially Rejected
        if (totalRejected > 0 && totalPending > 0) {
            return "REJECT";
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

    private String getRedisKey(String ctcApplicationNumber) {
        return "ctc:" + ctcApplicationNumber;
    }

    private void saveInRedisCache(CtcApplication application) {
        try {
            if (application.getCtcApplicationNumber() != null) {
                cacheService.save(getRedisKey(application.getCtcApplicationNumber()), application);
                log.info("Saved CTC application in Redis cache: {}", application.getCtcApplicationNumber());
            }
        } catch (Exception e) {
            log.error("Error saving CTC application to Redis cache: {}", e.getMessage());
        }
    }

    private CtcApplication searchRedisCache(String ctcApplicationNumber) {
        try {
            Object value = cacheService.findById(getRedisKey(ctcApplicationNumber));
            if (value != null) {
                String json = objectMapper.writeValueAsString(value);
                return objectMapper.readValue(json, CtcApplication.class);
            }
            return null;
        } catch (JsonProcessingException e) {
            log.error("Error reading CTC application from Redis cache: {}", e.getMessage());
            return null;
        }
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
}
