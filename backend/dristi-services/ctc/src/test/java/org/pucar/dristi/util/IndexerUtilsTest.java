package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IndexerUtilsTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration config;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private IndexerUtils indexerUtils;

    private CtcApplication application;

    @BeforeEach
    void setUp() {
        lenient().when(config.getEsHostUrl()).thenReturn("http://localhost:9200/");
        lenient().when(config.getBulkPath()).thenReturn("_bulk");
        lenient().when(config.getIssueCtcDocumentsIndex()).thenReturn("issue-ctc-documents");
        lenient().when(config.getCtcApplicationTrackerIndex()).thenReturn("ctc-application-tracker");
        lenient().when(config.getEsUsername()).thenReturn("elastic");
        lenient().when(config.getEsPassword()).thenReturn("changeme");

        application = CtcApplication.builder()
                .ctcApplicationNumber("CA-2025-001")
                .tenantId("kl")
                .courtId("KLKM52")
                .filingNumber("FIL-001")
                .caseTitle("State vs John")
                .caseNumber("CC/123/2025")
                .build();
    }

    // ---- buildPayload tests ----

    @Test
    void buildPayload_shouldFormatCorrectly() {
        IssueCtcDocument doc = IssueCtcDocument.builder()
                .id("uuid-1")
                .docId("doc-1")
                .ctcApplicationNumber("CA-001")
                .createdTime(1000L)
                .lastModifiedTime(2000L)
                .docTitle("Complaint")
                .status("PENDING")
                .caseTitle("Case Title")
                .caseNumber("CC/1/2025")
                .filingNumber("FIL-1")
                .courtId("KLKM52")
                .tenantId("kl")
                .fileStoreId("fs-1")
                .build();

        String payload = indexerUtils.buildPayload(doc);

        assertTrue(payload.contains("\"_index\":\"issue-ctc-documents\""));
        assertTrue(payload.contains("\"_id\":\"uuid-1\""));
        assertTrue(payload.contains("\"id\": \"uuid-1\""));
        assertTrue(payload.contains("\"docId\": \"doc-1\""));
        assertTrue(payload.contains("\"ctcApplicationNumber\": \"CA-001\""));
        assertTrue(payload.contains("\"createdTime\": 1000"));
        assertTrue(payload.contains("\"lastModifiedTime\": 2000"));
        assertTrue(payload.contains("\"docTitle\": \"Complaint\""));
        assertTrue(payload.contains("\"status\": \"PENDING\""));
        assertTrue(payload.contains("\"filingNumber\": \"FIL-1\""));
        assertTrue(payload.contains("\"courtId\": \"KLKM52\""));
        assertTrue(payload.contains("\"tenantId\": \"kl\""));
        assertTrue(payload.contains("\"fileStoreId\": \"fs-1\""));
    }

    // ---- pushIssueCtcDocuments tests ----

    @Test
    void pushIssueCtcDocuments_shouldSkipWhenListIsNull() throws Exception {
        indexerUtils.pushIssueCtcDocuments(null);
        verifyNoInteractions(restTemplate);
    }

    @Test
    void pushIssueCtcDocuments_shouldSkipWhenListIsEmpty() throws Exception {
        indexerUtils.pushIssueCtcDocuments(Collections.emptyList());
        verifyNoInteractions(restTemplate);
    }

    @Test
    void pushIssueCtcDocuments_shouldPostBulkPayload() throws Exception {
        IssueCtcDocument doc = IssueCtcDocument.builder()
                .id("uuid-1").docId("doc-1").ctcApplicationNumber("CA-001")
                .createdTime(1000L).lastModifiedTime(2000L).docTitle("Title")
                .status("PENDING").caseTitle("Case").caseNumber("CC/1/2025")
                .filingNumber("FIL-1").courtId("KLKM52").tenantId("kl").fileStoreId("fs-1")
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushIssueCtcDocuments(List.of(doc));

        verify(restTemplate).postForObject(eq("http://localhost:9200/_bulk"), any(HttpEntity.class), eq(String.class));
    }

    // ---- updateDocStatus tests ----

    @Test
    void updateDocStatus_shouldPostUpdateByQueryWithIdAndApplicationNumber() throws Exception {
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"updated\":1}");

        List<Document> docs = List.of(Document.builder().id("d1").fileStore("fs1").build());
        indexerUtils.updateDocStatus("uuid-1", "CA-001", "ISSUED", docs);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(
                eq("http://localhost:9200/issue-ctc-documents/_update_by_query"),
                captor.capture(),
                eq(String.class));

        String body = (String) captor.getValue().getBody();
        // Verify query searches by Data.id.keyword and Data.ctcApplicationNumber.keyword
        assertTrue(body.contains("Data.docId.keyword"));
        assertTrue(body.contains("uuid-1"));
        assertTrue(body.contains("Data.ctcApplicationNumber.keyword"));
        assertTrue(body.contains("CA-001"));
        assertTrue(body.contains("ISSUED"));
        assertTrue(body.contains("fs1"));
    }

    @Test
    void updateDocStatus_shouldHandleNullDocuments() throws Exception {
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"updated\":1}");

        indexerUtils.updateDocStatus("uuid-1", "CA-001", "REJECTED", null);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"documents\":[]"));
    }

    // ---- getDocStatusCounts tests ----

    @Test
    void getDocStatusCounts_shouldAggregateStatusCounts() throws Exception {
        String esResponse = "{\"hits\":{\"hits\":["
                + "{\"_source\":{\"Data\":{\"status\":\"ISSUED\"}}},"
                + "{\"_source\":{\"Data\":{\"status\":\"ISSUED\"}}},"
                + "{\"_source\":{\"Data\":{\"status\":\"PENDING\"}}}"
                + "]}}";

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(esResponse);

        Map<String, Integer> counts = indexerUtils.getDocStatusCounts("CA-001");

        assertEquals(2, counts.get("ISSUED"));
        assertEquals(1, counts.get("PENDING"));
        assertNull(counts.get("REJECTED"));
    }

    // ---- updateTrackerStatus tests ----

    @Test
    void updateTrackerStatus_shouldPostUpdateByQuery() throws Exception {
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"updated\":1}");

        indexerUtils.updateTrackerStatus("CA-001", "APPROVED");

        verify(restTemplate).postForObject(
                eq("http://localhost:9200/ctc-application-tracker/_update_by_query"),
                any(HttpEntity.class),
                eq(String.class));
    }

    @Test
    void updateTrackerStatus_shouldThrowCustomExceptionOnError() {
        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("ES down"));

        assertThrows(CustomException.class, () -> indexerUtils.updateTrackerStatus("CA-001", "REJECTED"));
    }

    // ---- pushCtcApplicationTracker tests ----

    @Test
    void pushCtcApplicationTracker_shouldPostPayload() throws Exception {
        CtcApplicationTracker tracker = CtcApplicationTracker.builder()
                .id("tracker-1").tenantId("kl").courtId("KLKM52")
                .filingNumber("FIL-1").ctcApplicationNumber("CA-001")
                .status("PENDING_JUDGE_APPROVAL").dateRaised(1000L)
                .applicantName("John").caseTitle("State vs John")
                .caseNumber("CC/1/2025")
                .searchableFields(List.of("State vs John", "CC/1/2025"))
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushCtcApplicationTracker(tracker);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(eq("http://localhost:9200/_bulk"), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"ctcApplicationNumber\": \"CA-001\""));
        assertTrue(body.contains("\"State vs John\""));
    }

    @Test
    void pushCtcApplicationTracker_shouldHandleNullSearchableFields() throws Exception {
        CtcApplicationTracker tracker = CtcApplicationTracker.builder()
                .id("tracker-1").tenantId("kl").courtId("KLKM52")
                .filingNumber("FIL-1").ctcApplicationNumber("CA-001")
                .status("PENDING").dateRaised(1000L)
                .applicantName("John").caseTitle("Title")
                .caseNumber("CC/1")
                .searchableFields(null)
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushCtcApplicationTracker(tracker);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"searchableFields\": []"));
    }

    @Test
    void pushCtcApplicationTracker_shouldThrowCustomExceptionOnError() {
        CtcApplicationTracker tracker = CtcApplicationTracker.builder()
                .id("t1").tenantId("kl").courtId("C1").filingNumber("F1")
                .ctcApplicationNumber("CA-001").status("S").dateRaised(1L)
                .applicantName("A").caseTitle("T").caseNumber("N")
                .searchableFields(List.of())
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("ES error"));

        assertThrows(CustomException.class, () -> indexerUtils.pushCtcApplicationTracker(tracker));
    }

    // ---- pushIssueCtcDocumentsToIndex tests ----

    @Test
    void pushIssueCtcDocumentsToIndex_shouldSkipWhenSelectedCaseBundleIsNull() {
        application.setSelectedCaseBundle(null);

        indexerUtils.pushIssueCtcDocumentsToIndex(application);

        verifyNoInteractions(restTemplate);
    }

    @Test
    void pushIssueCtcDocumentsToIndex_shouldIndexLeafNodesWithFileStoreId() throws Exception {
        // Root node with fileStoreId directly
        CaseBundleNode rootWithFile = CaseBundleNode.builder()
                .id("complaint").title("COMPLAINT_PDF")
                .fileStoreId("fs-complaint").children(null).build();

        application.setSelectedCaseBundle(List.of(rootWithFile));

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushIssueCtcDocumentsToIndex(application);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"docId\": \"complaint\""));
        assertTrue(body.contains("\"fileStoreId\": \"fs-complaint\""));
    }

    @Test
    void pushIssueCtcDocumentsToIndex_shouldTraverseDeeplyNestedNodes() throws Exception {
        // 4-level deep: root -> app -> orders -> order (with fileStoreId)
        CaseBundleNode order = CaseBundleNode.builder()
                .id("order-1").title("Order").fileStoreId("fs-order").children(null).build();
        CaseBundleNode orders = CaseBundleNode.builder()
                .id("app-orders").title("Orders").fileStoreId(null).children(List.of(order)).build();
        CaseBundleNode app = CaseBundleNode.builder()
                .id("app-1").title("App").fileStoreId(null).children(List.of(orders)).build();
        CaseBundleNode root = CaseBundleNode.builder()
                .id("disposed").title("Disposed").fileStoreId(null).children(List.of(app)).build();

        application.setSelectedCaseBundle(List.of(root));

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushIssueCtcDocumentsToIndex(application);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"docId\": \"order-1\""));
        assertTrue(body.contains("\"fileStoreId\": \"fs-order\""));
    }

    @Test
    void pushIssueCtcDocumentsToIndex_shouldFallbackToCaseBundlesForFileStoreId() throws Exception {
        // selectedCaseBundle node with null fileStoreId
        CaseBundleNode selectedNode = CaseBundleNode.builder()
                .id("doc-1").title("Doc").fileStoreId(null).children(null).build();

        // caseBundles has the fileStoreId for same id
        CaseBundleNode bundleNode = CaseBundleNode.builder()
                .id("doc-1").title("Doc").fileStoreId("fs-from-bundle").children(null).build();

        application.setSelectedCaseBundle(List.of(selectedNode));
        application.setCaseBundles(List.of(bundleNode));

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushIssueCtcDocumentsToIndex(application);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"fileStoreId\": \"fs-from-bundle\""));
    }

    @Test
    void pushIssueCtcDocumentsToIndex_shouldPreferSelectedCaseBundleFileStoreId() throws Exception {
        CaseBundleNode selectedNode = CaseBundleNode.builder()
                .id("doc-1").title("Doc").fileStoreId("fs-from-selected").children(null).build();

        CaseBundleNode bundleNode = CaseBundleNode.builder()
                .id("doc-1").title("Doc").fileStoreId("fs-from-bundle").children(null).build();

        application.setSelectedCaseBundle(List.of(selectedNode));
        application.setCaseBundles(List.of(bundleNode));

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushIssueCtcDocumentsToIndex(application);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"fileStoreId\": \"fs-from-selected\""));
        assertFalse(body.contains("fs-from-bundle"));
    }

    @Test
    void pushIssueCtcDocumentsToIndex_shouldSkipNodesWithNoFileStoreAnywhere() {
        CaseBundleNode selectedNode = CaseBundleNode.builder()
                .id("doc-1").title("Doc").fileStoreId(null).children(null).build();

        application.setSelectedCaseBundle(List.of(selectedNode));
        application.setCaseBundles(null);

        indexerUtils.pushIssueCtcDocumentsToIndex(application);

        verifyNoInteractions(restTemplate);
    }

    @Test
    void pushIssueCtcDocumentsToIndex_shouldCollectMultipleDocsFromMixedTree() throws Exception {
        // Flat node with fileStoreId
        CaseBundleNode leaf1 = CaseBundleNode.builder()
                .id("leaf-1").title("Leaf1").fileStoreId("fs-1").children(null).build();
        // Nested: parent -> child with fileStoreId
        CaseBundleNode child = CaseBundleNode.builder()
                .id("child-1").title("Child1").fileStoreId("fs-2").children(null).build();
        CaseBundleNode parent = CaseBundleNode.builder()
                .id("parent-1").title("Parent1").fileStoreId(null).children(List.of(child)).build();

        application.setSelectedCaseBundle(List.of(leaf1, parent));

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"errors\":false}");

        indexerUtils.pushIssueCtcDocumentsToIndex(application);

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForObject(anyString(), captor.capture(), eq(String.class));

        String body = (String) captor.getValue().getBody();
        assertTrue(body.contains("\"docId\": \"leaf-1\""));
        assertTrue(body.contains("\"docId\": \"child-1\""));
    }

    @Test
    void pushIssueCtcDocumentsToIndex_shouldThrowCustomExceptionOnError() {
        CaseBundleNode node = CaseBundleNode.builder()
                .id("doc-1").title("Doc").fileStoreId("fs-1").children(null).build();
        application.setSelectedCaseBundle(List.of(node));

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("ES down"));

        assertThrows(CustomException.class, () -> indexerUtils.pushIssueCtcDocumentsToIndex(application));
    }

    // ---- getESEncodedCredentials test ----

    @Test
    void getESEncodedCredentials_shouldReturnBase64Encoded() {
        String creds = indexerUtils.getESEncodedCredentials();
        assertTrue(creds.startsWith("Basic "));
        // "elastic:changeme" base64 = "ZWxhc3RpYzpjaGFuZ2VtZQ=="
        assertEquals("Basic ZWxhc3RpYzpjaGFuZ2VtZQ==", creds);
    }
}
