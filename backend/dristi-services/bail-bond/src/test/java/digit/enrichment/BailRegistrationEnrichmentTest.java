package digit.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.util.CaseUtil;
import digit.util.IdgenUtil;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.util.ObjectUtils;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BailRegistrationEnrichmentTest {

    @Mock
    private Configuration configuration;

    @Mock
    private IdgenUtil idgenUtil;

    @Mock
    private CaseUtil caseUtil;

    @InjectMocks
    private BailRegistrationEnrichment enrichment;

    private BailRequest bailRequest;
    private Bail bail;
    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        User user = User.builder().uuid("user-uuid").build();
        requestInfo = RequestInfo.builder().userInfo(user).build();

        bail = new Bail();
        bail.setFilingNumber("TN-123");
        bail.setDocuments(Collections.singletonList(new Document()));
        bail.setSureties(Collections.singletonList(new Surety()));

        bailRequest = new BailRequest();
        bailRequest.setRequestInfo(requestInfo);
        bailRequest.setBail(bail);

        when(configuration.getBailConfig()).thenReturn("BailID");
        when(configuration.getBailFormat()).thenReturn("BA-%d");
        when(idgenUtil.getIdList(any(), any(), any(), any(), anyInt(), anyBoolean()))
                .thenReturn(Collections.singletonList("2025"));

        JsonNode jsonNode = new ObjectMapper().createObjectNode();
        when(caseUtil.searchCaseDetails(any())).thenReturn(jsonNode);
        when(caseUtil.getCaseTitle(any())).thenReturn("State vs John");
        when(caseUtil.getCourtId(any())).thenReturn("court-001");
        when(caseUtil.getCnrNumber(any())).thenReturn("CNR12345");
        when(caseUtil.getCaseType(any())).thenReturn("ST");
        when(caseUtil.getCourtCaseNumber(any())).thenReturn("CR/2025");
        when(caseUtil.getCaseId(any())).thenReturn("case-123");
    }

    @Test
    void testEnrichBailOnCreation() {
        enrichment.enrichBailOnCreation(bailRequest);
        Bail enrichedBail = bailRequest.getBail();

        assertNotNull(enrichedBail.getId());
        assertNotNull(enrichedBail.getAuditDetails());
        assertEquals("court-001", enrichedBail.getCourtId());
        assertEquals("State vs John", enrichedBail.getCaseTitle());
        assertEquals("CNR12345", enrichedBail.getCnrNumber());
        assertEquals("CR/2025", enrichedBail.getCaseNumber());
        assertEquals("case-123", enrichedBail.getCaseId());
    }

    @Test
    void testEnrichBailUponUpdate_WithEditAction() {
        // Given
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("EDIT");

        bail.setWorkflow(workflowObject);
        bail.setLitigantSigned(true);
        Surety surety = new Surety();
        surety.setHasSigned(true);
        bail.setSureties(Collections.singletonList(surety));

        Bail existingBail = new Bail();
        existingBail.setAuditDetails(AuditDetails.builder()
                .createdBy("creator")
                .createdTime(12345L)
                .build());

        AuditDetails existingAudit = AuditDetails.builder().build();
        bail.setAuditDetails(existingAudit);

        // When
        enrichment.enrichBailUponUpdate(bailRequest, existingBail);

        // Then
        assertFalse(bail.getLitigantSigned());
        assertFalse(bail.getSureties().get(0).getHasSigned());
        assertEquals("creator", bail.getAuditDetails().getCreatedBy());
        assertEquals(12345L, bail.getAuditDetails().getCreatedTime());
        assertEquals("user-uuid", bail.getAuditDetails().getLastModifiedBy());
    }

    @Test
    void testEnrichDocument_NewDocument() {
        Document doc = new Document();
        enrichment.enrichDocument(doc, "tenant-id", requestInfo);

        assertNotNull(doc.getId());
        assertEquals(doc.getId(), doc.getDocumentUid());
        assertEquals("tenant-id", doc.getTenantId());
        assertNotNull(doc.getAuditDetails());
    }

    @Test
    void testEnrichSureties() {
        Surety surety = new Surety();
        surety.setDocuments(Collections.singletonList(new Document()));
        bail.setSureties(Collections.singletonList(surety));

        enrichment.enrichSureties(bailRequest);

        Surety enrichedSurety = bailRequest.getBail().getSureties().get(0);
        assertNotNull(enrichedSurety.getId());
        assertNotNull(enrichedSurety.getDocuments().get(0).getId());
    }
}
