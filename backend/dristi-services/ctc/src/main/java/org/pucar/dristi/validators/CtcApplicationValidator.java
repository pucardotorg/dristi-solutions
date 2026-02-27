package org.pucar.dristi.validators;

import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.web.models.CtcApplication;
import org.pucar.dristi.web.models.CtcApplicationRequest;
import org.pucar.dristi.web.models.CtcApplicationSearchCriteria;
import org.pucar.dristi.web.models.DocumentSelectionRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class CtcApplicationValidator {

    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern CASE_NUMBER_PATTERN = Pattern.compile("^[A-Z]+/\\d+/\\d{4}$");

    public void validateCreateRequest(CtcApplicationRequest request) {
        if (request == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Request cannot be null");
        }

        if (request.getRequestInfo() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "RequestInfo cannot be null");
        }

        if (request.getCtcApplication() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "CTC Application cannot be null");
        }

        CtcApplication application = request.getCtcApplication();
        validateApplication(application);
    }

    public void validateUpdateRequest(CtcApplicationRequest request) {
        if (request == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Request cannot be null");
        }

        if (request.getRequestInfo() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "RequestInfo cannot be null");
        }

        if (request.getCtcApplication() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "CTC Application cannot be null");
        }

        CtcApplication application = request.getCtcApplication();
        
        if (!StringUtils.hasText(application.getId())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Application ID is required for update");
        }

        validateApplication(application);
    }

    public void validateSearchCriteria(CtcApplicationSearchCriteria criteria) {
        if (criteria == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Search criteria cannot be null");
        }

        if (!StringUtils.hasText(criteria.getTenantId())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Tenant ID is required");
        }

        // Validate mobile number if provided
        if (StringUtils.hasText(criteria.getMobileNumber()) && 
            !MOBILE_PATTERN.matcher(criteria.getMobileNumber()).matches()) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Invalid mobile number format");
        }

        // Validate date range
        if (criteria.getFromDate() != null && criteria.getToDate() != null) {
            if (criteria.getFromDate() > criteria.getToDate()) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "From date cannot be after to date");
            }
        }

        // Validate pagination
        if (criteria.getOffset() != null && criteria.getOffset() < 0) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Offset cannot be negative");
        }

        if (criteria.getLimit() != null && criteria.getLimit() <= 0) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Limit must be positive");
        }
    }

    public void validateDocumentSelectionRequest(DocumentSelectionRequest request) {
        if (request == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Request cannot be null");
        }

        if (request.getRequestInfo() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "RequestInfo cannot be null");
        }

        if (!StringUtils.hasText(request.getApplicationNumber())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Application number is required");
        }

        if (request.getSelectedDocuments() == null || request.getSelectedDocuments().isEmpty()) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "At least one document must be selected");
        }

        // Validate each selected document
        for (DocumentSelectionRequest.SelectedDocument doc : request.getSelectedDocuments()) {
            if (!StringUtils.hasText(doc.getDocumentId())) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Document ID is required");
            }

            if (doc.getNumberOfCopies() != null && doc.getNumberOfCopies() <= 0) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "Number of copies must be positive");
            }

            if (doc.getPages() != null && doc.getPages() <= 0) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "Number of pages must be positive");
            }
        }
    }

    private void validateApplication(CtcApplication application) {
        // Validate required fields
        if (!StringUtils.hasText(application.getTenantId())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Tenant ID is required");
        }

        if (!StringUtils.hasText(application.getCaseNumber())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Case number is required");
        }

        if (!StringUtils.hasText(application.getCourtId())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Court ID is required");
        }

        if (!StringUtils.hasText(application.getApplicantName())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Applicant name is required");
        }

        if (!StringUtils.hasText(application.getMobileNumber())) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Mobile number is required");
        }

        if (application.getIsPartyToCase() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Is party to case flag is required");
        }

        // Validate formats
        if (!MOBILE_PATTERN.matcher(application.getMobileNumber()).matches()) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Invalid mobile number format");
        }

        if (StringUtils.hasText(application.getCaseNumber()) && 
            !CASE_NUMBER_PATTERN.matcher(application.getCaseNumber()).matches()) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                "Invalid case number format. Expected format: CASE_TYPE/NUMBER/YEAR");
        }

        // Validate conditional fields
        if (application.getIsPartyToCase()) {
            if (!StringUtils.hasText(application.getPartyDesignation())) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "Party designation is required when applicant is a party to case");
            }
        } else {
            if (!StringUtils.hasText(application.getAffidavitDocumentId())) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "Affidavit document ID is required when applicant is not a party to case");
            }
        }

        // Validate selected documents
        if (application.getSelectedDocuments() != null) {
            validateSelectedDocuments(application.getSelectedDocuments());
        }

        // Validate fee amount
        if (application.getFeeAmount() != null && application.getFeeAmount().doubleValue() < 0) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                "Fee amount cannot be negative");
        }
    }

    private void validateSelectedDocuments(List<CtcApplication.SelectedDocument> documents) {
        if (documents.isEmpty()) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                "At least one document must be selected");
        }

        for (CtcApplication.SelectedDocument doc : documents) {
            if (!StringUtils.hasText(doc.getDocumentId())) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "Document ID is required for selected documents");
            }

            if (doc.getNumberOfCopies() != null && doc.getNumberOfCopies() <= 0) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "Number of copies must be positive");
            }

            if (doc.getPages() != null && doc.getPages() <= 0) {
                throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, 
                    "Number of pages must be positive");
            }
        }
    }
}
