package digit.enrichment;

import digit.util.DigitalizedDocumentUtil;
import digit.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class ExaminationOfAccusedEnrichmentTest {

    @Mock
    private DigitalizedDocumentUtil digitalizedDocumentUtil;

    @InjectMocks
    private ExaminationOfAccusedEnrichment enrichment;

    private DigitalizedDocumentRequest request;
    private String userId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        userId = "0f44c479-a16c-48b6-bf75-f329cd409b1a";
        long currentTime = System.currentTimeMillis();
        
        when(digitalizedDocumentUtil.getCurrentTimeInMilliSec()).thenReturn(currentTime);
        when(digitalizedDocumentUtil.generateUUID()).thenReturn(UUID.fromString("2f44c479-a16c-48b6-bf75-f3293d409b1a"));
        
        request = DigitalizedDocumentRequest.builder()
                .requestInfo(RequestInfo.builder()
                        .userInfo(User.builder().uuid(userId).build())
                        .build())
                .digitalizedDocument(DigitalizedDocument.builder()
                        .documents(Arrays.asList(
                                Document.builder().build(),
                                Document.builder().id("2f44c479-a16c-48b6-bf75-f3293d409b1a").build()
                        ))
                        .build())
                .build();
    }

    @Test
    void testEnrichDocumentOnCreation() {
        // Execute
        enrichment.enrichDocumentOnCreation(request);
        
        // Verify audit details
        AuditDetails auditDetails = request.getDigitalizedDocument().getAuditDetails();
        assertNotNull(auditDetails);
        assertEquals(userId, auditDetails.getCreatedBy());
        assertEquals(userId, auditDetails.getLastModifiedBy());
        assertNotNull(auditDetails.getCreatedTime());
        assertNotNull(auditDetails.getLastModifiedTime());
        
        // Verify documents enrichment
        verifyDocumentsEnrichment();
    }

    @Test
    void testEnrichDocumentOnUpdate() {
        // Setup existing audit details
        AuditDetails existingAudit = new AuditDetails();
        existingAudit.setCreatedBy("creator");
        existingAudit.setCreatedTime(12345L);
        request.getDigitalizedDocument().setAuditDetails(existingAudit);
        
        // Execute
        enrichment.enrichDocumentOnUpdate(request);
        
        // Verify audit details
        AuditDetails auditDetails = request.getDigitalizedDocument().getAuditDetails();
        assertNotNull(auditDetails);
        assertEquals("creator", auditDetails.getCreatedBy());
        assertEquals(12345L, auditDetails.getCreatedTime());
        assertEquals(userId, auditDetails.getLastModifiedBy());
        assertNotNull(auditDetails.getLastModifiedTime());
        
        // Verify documents enrichment
        verifyDocumentsEnrichment();
    }
    
    private void verifyDocumentsEnrichment() {
        request.getDigitalizedDocument().getDocuments().forEach(document -> {
            if (document.getId() == null) {
                assertNotNull(document.getId());
                assertEquals(document.getId(), document.getDocumentUid());
            } else {
                assertEquals("2f44c479-a16c-48b6-bf75-f3293d409b1a", document.getId());
            }
        });
    }
}
