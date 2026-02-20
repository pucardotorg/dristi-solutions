package org.pucar.dristi.enrichment;


import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.web.models.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.pucar.dristi.config.ServiceConstants.UPLOAD;

@ExtendWith(MockitoExtension.class)
public class EnrichCaseWhenDocumentUploadSignTest {

    private EnrichCaseWhenDocumentUploadSign enrichCaseWhenDocumentUploadSign;
    private CaseRequest caseRequest;
    private CourtCase courtCase;
    private WorkflowObject workflow = new WorkflowObject();
    @BeforeEach
    void setUp() {
        enrichCaseWhenDocumentUploadSign = new EnrichCaseWhenDocumentUploadSign();
        courtCase = new CourtCase();
        caseRequest = new CaseRequest(new RequestInfo(), courtCase);
    }

    @Test
    void testCanEnrich_True() {
        workflow.setAction(UPLOAD);
        courtCase.setWorkflow(workflow);
        assertTrue(enrichCaseWhenDocumentUploadSign.canEnrich(caseRequest));
    }

    @Test
    void testCanEnrich_False() {
        workflow.setAction("OTHER_ACTION");
        courtCase.setWorkflow(workflow);
        assertFalse(enrichCaseWhenDocumentUploadSign.canEnrich(caseRequest));
    }

    @Test
    void testEnrich_SetsLitigantAndRepresentativeSignatures() {
        Party litigant = Party.builder().id(UUID.randomUUID())
                .individualId("12345")
                .isActive(true)
                .hasSigned(false).build();
        AdvocateMapping representative = AdvocateMapping.builder()
                .advocateId("6789")
                .isActive(true)
                .hasSigned(false)
                .representing(Collections.singletonList(litigant))
                .build();
        courtCase.setLitigants(java.util.List.of(litigant));
        courtCase.setRepresentatives(List.of(representative));

        enrichCaseWhenDocumentUploadSign.enrich(caseRequest);

        assertTrue(litigant.getHasSigned());
        assertTrue(representative.getHasSigned());
    }
}
