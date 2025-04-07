package org.pucar.dristi.validators;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.util.EvidenceUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class EvidenceValidator {

    private final EvidenceUtil evidenceUtil;

    @Autowired
    public EvidenceValidator(EvidenceUtil evidenceUtil) {
        this.evidenceUtil = evidenceUtil;
    }


    public boolean validateEvidenceCreation(CourtCase courtCase, RequestInfo requestInfo, ReplacementDetails replacementDetails) {

        EvidenceSearchCriteria evidenceSearchCriteria = EvidenceSearchCriteria.builder()
                .caseId(courtCase.getId().toString())
                .filingNumber(courtCase.getFilingNumber())
                .tenantId(courtCase.getTenantId())
                .fileStoreId(replacementDetails.getDocument().getFileStore())
                .build();

        EvidenceSearchRequest evidenceSearchRequest = EvidenceSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(evidenceSearchCriteria)
                .pagination(Pagination.builder()
                        .limit(100)
                        .offSet(0)
                        .build())
                .build();

        EvidenceSearchResponse evidenceSearchResponse = evidenceUtil.searchEvidence(evidenceSearchRequest);

        return !evidenceSearchResponse.getArtifacts().isEmpty();

    }

    public boolean validateEvidenceCreate(CourtCase courtCase, RequestInfo requestInfo, List<Document> documentList) {

        if(documentList!=null && !documentList.isEmpty()){
            EvidenceSearchCriteria evidenceSearchCriteria = EvidenceSearchCriteria.builder()
                    .caseId(courtCase.getId().toString())
                    .filingNumber(courtCase.getFilingNumber())
                    .tenantId(courtCase.getTenantId())
                    .fileStoreId(documentList.get(0).getFileStore())
                    .build();

            EvidenceSearchRequest evidenceSearchRequest = EvidenceSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(evidenceSearchCriteria)
                    .pagination(Pagination.builder()
                            .limit(100)
                            .offSet(0)
                            .build())
                    .build();
            EvidenceSearchResponse evidenceSearchResponse = evidenceUtil.searchEvidence(evidenceSearchRequest);
            return !evidenceSearchResponse.getArtifacts().isEmpty();
        }
        return true;
    }

    public boolean validateReasonDocumentCreation(CourtCase courtCase, RequestInfo requestInfo, ReasonDocument reasonDocument) {

        EvidenceSearchCriteria evidenceSearchCriteria = EvidenceSearchCriteria.builder()
                .caseId(courtCase.getId().toString())
                .filingNumber(courtCase.getFilingNumber())
                .tenantId(courtCase.getTenantId())
                .fileStoreId(reasonDocument.getFileStore())
                .build();

        EvidenceSearchRequest evidenceSearchRequest = EvidenceSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(evidenceSearchCriteria)
                .pagination(Pagination.builder()
                        .limit(100)
                        .offSet(0)
                        .build())
                .build();

        EvidenceSearchResponse evidenceSearchResponse = evidenceUtil.searchEvidence(evidenceSearchRequest);
        return !evidenceSearchResponse.getArtifacts().isEmpty();
    }

}
