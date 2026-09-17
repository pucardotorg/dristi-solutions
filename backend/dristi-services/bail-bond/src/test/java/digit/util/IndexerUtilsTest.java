package digit.util;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.web.models.Bail;
import digit.web.models.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

public class IndexerUtilsTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration config;

    @Mock
    private ObjectMapper mapper;

    @InjectMocks
    private IndexerUtils indexerUtils;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetESEncodedCredentials() {
        when(config.getEsUsername()).thenReturn("user");
        when(config.getEsPassword()).thenReturn("pass");

        String credentials = indexerUtils.getESEncodedCredentials();
        String expectedPrefix = "Basic ";

        assertTrue(credentials.startsWith(expectedPrefix));
        assertTrue(credentials.length() > expectedPrefix.length());
    }

    @Test
    public void testBuildPayload_withDocuments() throws Exception {
        when(config.getBailBondIndex()).thenReturn("bail_index");

        Document doc1 = new Document();
        doc1.setId("doc1");
        doc1.setDocumentUid("uid1");
        doc1.setDocumentType("type1");
        doc1.setFileStore("store1");
        doc1.setDocumentName("docName1");

        List<Document> documents = Collections.singletonList(doc1);

        Bail bail = new Bail();
        bail.setTenantId("tenant1");
        bail.setIsActive(true);
        bail.setLitigantName("litigant");
        bail.setStatus("status");
        bail.setCourtId("court1");
        bail.setCaseTitle("caseTitle");
        bail.setFilingNumber("fileNum");
        bail.setCaseNumber("caseNum");
        bail.setBailId("bailId1");
        bail.setId("id1");
        bail.setDocuments(documents);

        // Mock ObjectMapper serialization to return a JSON array string
        when(mapper.writeValueAsString(any())).thenReturn("[{\"id\":\"doc1\"}]");

        String payload = indexerUtils.buildPayload(bail);

        assertNotNull(payload);
        assertTrue(payload.contains("bail_index"));
        assertTrue(payload.contains("caseTitle"));
        assertTrue(payload.contains("litigant"));
        assertTrue(payload.contains("[{\"id\":\"doc1\"}]")); // documents JSON
    }

    @Test
    public void testEsPostManual_successful() throws Exception {
        String uri = "http://dummy/_bulk";
        String request = "{}";

        // Mock config to return encoded credentials
        when(config.getEsUsername()).thenReturn("user");
        when(config.getEsPassword()).thenReturn("pass");

        // Mock RestTemplate response with no errors
        String response = "{\"errors\":false}";
        when(restTemplate.postForObject(eq(uri), any(HttpEntity.class), eq(String.class))).thenReturn(response);

        // Call method, expect no exceptions
        indexerUtils.esPostManual(uri, request);

        // Verify RestTemplate called once
        verify(restTemplate, times(1)).postForObject(eq(uri), any(HttpEntity.class), eq(String.class));
    }

    @Test
    public void testEsPostManual_failureThrowsException() {
        String uri = "http://dummy/_bulk";
        String request = "{}";

        when(config.getEsUsername()).thenReturn("user");
        when(config.getEsPassword()).thenReturn("pass");

        // Mock ES response indicating error
        String response = "{\"errors\":true}";
        when(restTemplate.postForObject(eq(uri), any(HttpEntity.class), eq(String.class))).thenReturn(response);

        Exception exception = assertThrows(Exception.class, () -> {
            indexerUtils.esPostManual(uri, request);
        });

        assertTrue(exception.getMessage().contains("Error while updating index"));
    }
}
