//package org.pucar.dristi.enrichment;
//
//import org.egov.common.contract.request.RequestInfo;
//import org.pucar.dristi.config.ServiceConstants;
//import org.pucar.dristi.service.WorkflowService;
//import org.pucar.dristi.util.IdgenUtil;
//import org.pucar.dristi.web.models.CtcApplication;
//import org.pucar.dristi.web.models.CtcApplicationRequest;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Component;
//
//import java.math.BigDecimal;
//import java.util.List;
//import java.util.UUID;
//
//@Component
//public class CtcApplicationEnrichment {
//
//    @Autowired
//    private IdgenUtil idgenUtil;
//
//    @Autowired
//    private WorkflowService workflowService;
//
//    public void enrichCreateApplication(CtcApplicationRequest request) {
//        CtcApplication application = request.getCtcApplication();
//        RequestInfo requestInfo = request.getRequestInfo();
//
//        // Generate application ID
//        if (application.getId() == null) {
//            application.setId(UUID.randomUUID().toString());
//        }
//
//        // Set audit details
//        setAuditDetails(application, requestInfo, true);
//
//        // Set default values
//        setDefaultValues(application);
//
//        // Calculate fee if documents are selected
//        calculateFee(application);
//
//        // Initialize workflow if needed
//        if (application.getWorkflow() == null) {
//            application.setWorkflow(workflowUtil.getWorkflowForCtcApplication(application, requestInfo));
//        }
//    }
//
//    public void enrichUpdateApplication(CtcApplicationRequest request) {
//        CtcApplication application = request.getCtcApplication();
//        RequestInfo requestInfo = request.getRequestInfo();
//
//        // Update audit details
//        setAuditDetails(application, requestInfo, false);
//
//        // Recalculate fee if documents changed
//        if (application.getSelectedDocuments() != null) {
//            calculateFee(application);
//        }
//
//        // Update workflow if needed
//        if (application.getWorkflow() != null) {
//            workflowUtil.updateWorkflowForCtcApplication(application, requestInfo);
//        }
//    }
//
//    public void enrichSearchResults(List<CtcApplication> applications) {
//        // Add any additional enrichment needed for search results
//        // For example, populate derived fields, format dates, etc.
//        applications.forEach(this::enrichApplicationForResponse);
//    }
//
//    private void setAuditDetails(CtcApplication application, RequestInfo requestInfo, boolean isCreate) {
//        String userId = requestInfo.getUserInfo().getUuid();
//        long currentTime = System.currentTimeMillis();
//
//        if (application.getAuditDetails() == null) {
//            application.setAuditDetails(AuditDetails.builder().build());
//        }
//
//        if (isCreate) {
//            application.getAuditDetails().setCreatedBy(userId);
//            application.getAuditDetails().setCreatedTime(currentTime);
//        }
//
//        application.getAuditDetails().setLastModifiedBy(userId);
//        application.getAuditDetails().setLastModifiedTime(currentTime);
//    }
//
//    private void setDefaultValues(CtcApplication application) {
//        // Set default status if not provided
//        if (application.getStatus() == null) {
//            application.setStatus(ServiceConstants.CTC_STATUS_PENDING);
//        }
//
//        // Set default payment status if not provided
//        if (application.getPaymentStatus() == null) {
//            application.setPaymentStatus(ServiceConstants.CTC_STATUS_PAYMENT_PENDING);
//        }
//
//        // Set default judge approval status if not provided
//        if (application.getJudgeApprovalStatus() == null) {
//            application.setJudgeApprovalStatus(application.getIsPartyToCase() ?
//                ServiceConstants.CTC_STATUS_APPROVED : ServiceConstants.CTC_STATUS_PENDING);
//        }
//    }
//
//    private void calculateFee(CtcApplication application) {
//        if (application.getSelectedDocuments() == null || application.getSelectedDocuments().isEmpty()) {
//            return;
//        }
//
//        // Calculate total pages
//        int totalPages = application.getSelectedDocuments().stream()
//            .mapToInt(doc -> doc.getPages() != null ? doc.getPages() : 0)
//            .sum();
//
//        application.setTotalPages(totalPages);
//
//        // Calculate fee: Base fee (20) + (Total pages * 1.5)
//        BigDecimal baseFee = new BigDecimal(ServiceConstants.CTC_BASE_FEE);
//        BigDecimal pageFee = new BigDecimal(totalPages).multiply(new BigDecimal(ServiceConstants.CTC_PER_PAGE_FEE));
//        BigDecimal totalFee = baseFee.add(pageFee);
//
//        application.setBaseFee(baseFee);
//        application.setPageFee(pageFee);
//        application.setFeeAmount(totalFee);
//    }
//
//    private String generateApplicationNumber(String tenantId, RequestInfo requestInfo) {
//        // Generate application number in format: CA/{sequence}/{year}
//        // This should use the actual ID generation service
//        try {
//            List<String> applicationNumbers = idgenUtil.getIdList(requestInfo, tenantId,
//                ServiceConstants.CTC_APPLICATION_NUMBER_PREFIX);
//            if (!applicationNumbers.isEmpty()) {
//                return applicationNumbers.get(0);
//            }
//        } catch (Exception e) {
//            // Fallback to manual generation
//        }
//
//        // Fallback format
//        int year = java.time.Year.now().getValue();
//        return ServiceConstants.CTC_APPLICATION_NUMBER_PREFIX + "/1/" + year;
//    }
//
//    private void enrichApplicationForResponse(CtcApplication application) {
//        // Add any response-specific enrichment
//        // For example, mask sensitive data, format display fields, etc.
//
//        // Ensure fee details are populated
//        if (application.getFeeAmount() != null && application.getBaseFee() == null) {
//            calculateFee(application);
//        }
//
//        // Format application number for display
//        if (application.getApplicationNumber() != null) {
//            // Ensure consistent formatting
//        }
//    }
//}
