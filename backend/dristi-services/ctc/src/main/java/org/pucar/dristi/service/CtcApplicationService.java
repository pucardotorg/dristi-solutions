package org.pucar.dristi.service;

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

    @Autowired
    public CtcApplicationService(CtcApplicationRepository ctcApplicationRepository, CtcApplicationEnrichment ctcApplicationEnrichment, WorkflowService workflowService, Configuration config, Producer producer, EtreasuryUtil etreasuryUtil, FileStoreUtil fileStoreUtil, IndexerUtils indexerUtils, CtcApplicationValidator ctcApplicationValidator) {
        this.ctcApplicationRepository = ctcApplicationRepository;
        this.ctcApplicationEnrichment = ctcApplicationEnrichment;
        this.workflowService = workflowService;
        this.config = config;
        this.producer = producer;
        this.etreasuryUtil = etreasuryUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.indexerUtils = indexerUtils;
        this.ctcApplicationValidator = ctcApplicationValidator;
    }

    public CtcApplication createApplication(CtcApplicationRequest request) {

        log.info("createApplication method in progress");

        CtcApplication application = request.getCtcApplication();

        ctcApplicationValidator.validateCreateRequest(request);

        ctcApplicationEnrichment.enrichOnCreateCtcApplication(request.getRequestInfo(), application);

        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        producer.push(config.getSaveCtcApplicationTopic(), request);

        log.info("createApplication method completed");

        return application;
    }

    public CtcApplication updateApplication(CtcApplicationRequest request) {

        log.info("updateApplication method in progress for id {}", request.getCtcApplication().getId());

        CtcApplication application = request.getCtcApplication();

        ctcApplicationValidator.validateUpdateRequest(request);

        ctcApplicationEnrichment.enrichOnUpdateCtcApplication(request.getRequestInfo(), application);

        workflowService.updateWorkflowStatus(request.getCtcApplication(), request.getRequestInfo());

        if (request.getCtcApplication().getWorkflow() != null && (request.getCtcApplication().getWorkflow().getAction().equalsIgnoreCase("ESIGN")
                || request.getCtcApplication().getWorkflow().getAction().equalsIgnoreCase("UPLOAD_SIGNED_COPY"))) {
            //change logic for calculating payment through payment calculator if required
            if (request.getCtcApplication().getTotalPages() == null) {
                List<String> acceptedFileStoreIds = getFileStoreIds(request);
                int totalPages = fileStoreUtil.getTotalPageCount(request.getCtcApplication().getTenantId(), acceptedFileStoreIds);
                request.getCtcApplication().setTotalPages(totalPages);
                log.info("Calculated totalPages={} from {} accepted documents for application: {}",
                        totalPages, acceptedFileStoreIds.size(), request.getCtcApplication().getCtcApplicationNumber());
            }
            Calculation calculation = Calculation.builder().totalAmount(20 + request.getCtcApplication().getTotalPages() * 1.5).tenantId(request.getCtcApplication().getTenantId()).build();
            etreasuryUtil.createDemand(request, application.getCtcApplicationNumber() + "_APPLICATION_FEE", calculation);
        }
        if ("PENDING_ISSUE".equalsIgnoreCase(request.getCtcApplication().getStatus())) {
            indexerUtils.pushIssueCtcDocumentsToIndex(application);
        }

        producer.push(config.getUpdateCtcApplicationTopic(), request);

        log.info("updateApplication method completed for id {}", request.getCtcApplication().getId());

        return application;
    }

    private List<String> getFileStoreIds(CtcApplicationRequest request) {
        List<String> acceptedFileStoreIds = new ArrayList<>();
        if (request.getCtcApplication().getCaseBundleNodes() != null) {
            for (CaseBundleNode parentNode : request.getCtcApplication().getCaseBundleNodes()) {
                if (parentNode.getChildren() != null) {
                    for (CaseBundleNode child : parentNode.getChildren()) {
                        if (child.isSelected() && child.getFileStoreId() != null) {
                            acceptedFileStoreIds.add(child.getFileStoreId());
                        }
                    }
                }
            }
        }
        return acceptedFileStoreIds;
    }

    public List<CtcApplication> searchApplications(CtcApplicationSearchRequest ctcApplicationSearchRequest) {
        List<CtcApplication> applications = ctcApplicationRepository.getCtcApplication(ctcApplicationSearchRequest);
        if (applications == null) {
            return new ArrayList<>();
        }
        return applications;
    }

    public void markDocumentsAsIssuedOrReject(IssueCtcDocumentUpdateRequest request) {
        try {
            List<DocumentActionItem> docs = request.getDocs();
            String courtId = request.getCourtId();
            RequestInfo requestInfo = request.getRequestInfo();

            // 1. Update each document's status in ES based on its action
            for (DocumentActionItem item : docs) {
                String status = ServiceConstants.ACTION_ISSUE.equalsIgnoreCase(item.getAction())
                        ? ServiceConstants.STATUS_ISSUED
                        : ServiceConstants.STATUS_REJECTED;
                indexerUtils.updateDocStatus(item.getDocId(), status);
                log.info("Updated doc {} to status {} for application: {}", item.getDocId(), status, item.getCtcApplicationNumber());
            }

            // 2. Group documents by ctcApplicationNumber
            Map<String, List<DocumentActionItem>> groupedByApp = docs.stream()
                    .collect(Collectors.groupingBy(DocumentActionItem::getCtcApplicationNumber));

            // 3. Process each ctcApplicationNumber
            for (Map.Entry<String, List<DocumentActionItem>> entry : groupedByApp.entrySet()) {
                String ctcApplicationNumber = entry.getKey();
                String filingNumber = entry.getValue().get(0).getFilingNumber();
                processApplicationWorkflow(ctcApplicationNumber, filingNumber, courtId, requestInfo);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing bulk issue/reject for documents", e);
            throw new CustomException(ServiceConstants.CTC_ISSUE_DOCUMENTS_UPDATE_EXCEPTION,
                    "Error processing bulk issue/reject: " + e.getMessage());
        }
    }

    private void processApplicationWorkflow(String ctcApplicationNumber, String filingNumber, String courtId, RequestInfo requestInfo) throws Exception {
        // Fetch the CTC application from DB
        CtcApplicationSearchRequest ctcApplicationSearchRequest = CtcApplicationSearchRequest.builder()
                .criteria(CtcApplicationSearchCriteria.builder()
                        .ctcApplicationNumber(ctcApplicationNumber)
                        .filingNumber(filingNumber)
                        .courtId(courtId)
                        .build())
                .build();
        List<CtcApplication> ctcApplications = ctcApplicationRepository.getCtcApplication(ctcApplicationSearchRequest);
        if (ctcApplications == null || ctcApplications.isEmpty()) {
            throw new CustomException(ServiceConstants.CTC_ISSUE_DOCUMENTS_UPDATE_EXCEPTION,
                    "CTC application not found: " + ctcApplicationNumber);
        }
        CtcApplication ctcApplication = ctcApplications.get(0);

        // Count total accepted children from caseBundleNodes
        int totalAccepted = countAcceptedDocs(ctcApplication);

        // Query ES for issued and rejected counts
        int totalIssued = indexerUtils.getIssuedDocCount(ctcApplicationNumber);
        int totalRejected = indexerUtils.getRejectedDocCount(ctcApplicationNumber);
        int totalProcessed = totalIssued + totalRejected;

        // Determine workflow action
        String workflowAction = determineWorkflowAction(totalAccepted, totalIssued, totalRejected, totalProcessed);

        // Update workflow
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(workflowAction);
        ctcApplication.setWorkflow(workflow);
        workflowService.updateWorkflowStatus(ctcApplication, requestInfo);

        // Persist the updated application
        CtcApplicationRequest ctcApplicationRequest = CtcApplicationRequest.builder()
                .requestInfo(requestInfo)
                .ctcApplication(ctcApplication)
                .build();
        producer.push(config.getUpdateCtcApplicationTopic(), ctcApplicationRequest);

        log.info("Processed application: {}, issued: {}, rejected: {}, totalAccepted: {}, workflowAction: {}",
                ctcApplicationNumber, totalIssued, totalRejected, totalAccepted, workflowAction);
    }

    private int countAcceptedDocs(CtcApplication ctcApplication) {
        int totalAccepted = 0;
        if (ctcApplication.getCaseBundleNodes() != null) {
            for (CaseBundleNode parentNode : ctcApplication.getCaseBundleNodes()) {
                if (parentNode.getChildren() != null) {
                    for (CaseBundleNode child : parentNode.getChildren()) {
                        if ("accepted".equalsIgnoreCase(child.getStatus())) {
                            totalAccepted++;
                        }
                    }
                }
            }
        }
        return totalAccepted;
    }

    private String determineWorkflowAction(int totalAccepted, int totalIssued, int totalRejected, int totalProcessed) {
        if (totalAccepted > 0 && totalProcessed >= totalAccepted) {
            // All docs have been processed
            if (totalRejected >= totalAccepted) {
                return "REJECT_ALL";
            }
            return "ISSUE_ALL";
        }
        // Partial processing
        if (totalIssued > 0) {
            return "ISSUE";
        }
        return "REJECT";
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

}
