package org.egov.transformer.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.transformer.models.CourtCase;
import org.egov.transformer.models.digitalized_document.DigitalizedDocument;
import org.egov.transformer.models.digitalized_document.DigitalizedDocumentRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class DigitalizedDocumentService {

    private final CaseService caseService;

    public DigitalizedDocumentService(CaseService caseService) {
        this.caseService = caseService;
    }

    public void enrichDigitalizedDocument(DigitalizedDocumentRequest request){
        DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();
        RequestInfo requestInfo = request.getRequestInfo();
        String filingNumber = digitalizedDocument.getCaseFilingNumber();
        String tenantId = digitalizedDocument.getTenantId();

        CourtCase courtCase = caseService.getCase(filingNumber, tenantId, requestInfo);
        String cmpNumber = courtCase.getCmpNumber();
        String stNumber = courtCase.getCourtCaseNumber();
        String caseNumber = stNumber != null ? stNumber : cmpNumber;
        digitalizedDocument.setCaseTitle(courtCase.getCaseTitle() + ", " + caseNumber);

        List<String> searchableFields = new ArrayList<>();
        searchableFields.add(digitalizedDocument.getCaseTitle());
        searchableFields.add(filingNumber);
        if(digitalizedDocument.getDocuments() != null && !digitalizedDocument.getDocuments().isEmpty()) {
            String documentName = digitalizedDocument.getDocuments().get(0).getDocumentName();
            digitalizedDocument.setTitle(documentName);
        }
        digitalizedDocument.setSearchableFields(searchableFields);

    }
}
