package digit.enrichment;

import digit.config.Configuration;
import digit.util.IdgenUtil;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class DigitalizedDocumentEnrichmentTest {

    @Mock
    private Configuration configuration;

    @Mock
    private IdgenUtil idgenUtil;

    @InjectMocks
    private DigitalizedDocumentEnrichment enrichment;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testEnrichDigitalizedDocument() {
        // Prepare test data
        String caseFilingNumber = "CASE-123";
        String expectedId = "doc-123";
        String expectedDocumentNumber = caseFilingNumber + "-12345";
        
        DigitalizedDocument document = DigitalizedDocument.builder()
                .caseFilingNumber(caseFilingNumber)
                .build();
        
        DigitalizedDocumentRequest request = DigitalizedDocumentRequest.builder()
                .requestInfo(RequestInfo.builder()
                        .userInfo(User.builder().uuid(UUID.randomUUID().toString()).build())
                        .build())
                .digitalizedDocument(document)
                .build();

        // Mock dependencies
        when(configuration.getDigitalizedDocumentIdGenConfig()).thenReturn("doc.gen");
        when(configuration.getDigitalizedDocumentIdGenFormat()).thenReturn("DOC-[SEQ_EG_DOC_KEYS]");
        when(idgenUtil.getIdList(any(), anyString(), anyString(), anyString(), anyInt(), anyBoolean()))
                .thenReturn(Collections.singletonList("12345"));

        // Execute
        enrichment.enrichDigitalizedDocument(request);

        // Verify
        assertNotNull(document.getId());
        assertEquals(expectedDocumentNumber, document.getDocumentNumber());
    }
}
