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
import static org.pucar.dristi.config.ServiceConstants.SEND_BACK;

@ExtendWith(MockitoExtension.class)

public class EnrichWhenCaseSendBackTest {

    private EnrichWhenCaseSendBack enrichWhenCaseSendBack;
    private CaseRequest caseRequest;
    private CourtCase courtCase;
    private WorkflowObject workflow = new WorkflowObject();
    @BeforeEach
    void setUp() {
        enrichWhenCaseSendBack = new EnrichWhenCaseSendBack();
        courtCase = new CourtCase();
        caseRequest = new CaseRequest(new RequestInfo(), courtCase);
    }

    @Test
    void testCanEnrich_True() {
        workflow.setAction(SEND_BACK);
        courtCase.setWorkflow(workflow);
        assertTrue(enrichWhenCaseSendBack.canEnrich(caseRequest));
    }

    @Test
    void testCanEnrich_False() {
        workflow.setAction("OTHER_ACTION");
        courtCase.setWorkflow(workflow);
        assertFalse(enrichWhenCaseSendBack.canEnrich(caseRequest));
    }

    @Test
    void testEnrich_ResetsLitigantAndRepresentativeSignatures() {
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

        courtCase.setLitigants(List.of(litigant));
        courtCase.setRepresentatives(List.of(representative));

        enrichWhenCaseSendBack.enrich(caseRequest);

        assertFalse(litigant.getHasSigned());
        assertFalse(representative.getHasSigned());
    }
}
