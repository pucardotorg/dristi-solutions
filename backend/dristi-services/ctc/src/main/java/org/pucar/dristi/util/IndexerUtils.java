package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class IndexerUtils {

    private final RestTemplate restTemplate;
    private final Configuration config;
    private final ObjectMapper objectMapper;

    @Autowired
    public IndexerUtils(RestTemplate restTemplate, Configuration config, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    public void pushIssueCtcDocuments(List<IssueCtcDocument> documents) throws Exception {
        if (documents == null || documents.isEmpty()) {
            return;
        }

        String bulkPayload = documents.stream()
                .map(this::buildPayload)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining());

        String uri = config.getEsHostUrl() + config.getBulkPath() + "?refresh=true";
        esPostManual(uri, bulkPayload);
    }

    public String buildPayload(IssueCtcDocument doc) {
        String indexName = config.getIssueCtcDocumentsIndex();
        String docName = Optional.ofNullable(doc.getDocTitle())
                .map(s -> s.replace("_", " "))
                .orElse(null);

        List<String> searchableFields = new ArrayList<>();
        if (doc.getCaseTitle() != null) searchableFields.add(doc.getCaseTitle());
        if (doc.getCaseNumber() != null) searchableFields.add(doc.getCaseNumber());

        String searchableFieldsJson = "[" + searchableFields.stream()
        .map(s -> "\"" + s + "\"")
        .collect(Collectors.joining(",")) + "]";

        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_ISSUE_CTC_DOC_FORMAT,
                indexName,
                doc.getId(),
                doc.getId(),
                doc.getDocId(),
                doc.getCtcApplicationNumber(),
                doc.getCreatedTime(),
                doc.getLastModifiedTime(),
                docName,
                doc.getStatus(),
                doc.getCaseTitle(),
                doc.getCaseNumber(),
                doc.getFilingNumber(),
                doc.getCourtId(),
                doc.getTenantId(),
                doc.getFileStoreId(),
                doc.getNameOfApplicant(),
                doc.getDateOfApplication(),
                doc.getDateOfApplicationApproval(),
                searchableFieldsJson
        );
    }

    public void updateDocStatus(String docId, String ctcApplicationNumber, String status, List<Document> documents) throws Exception {
        String indexName = config.getIssueCtcDocumentsIndex();
        String uri = config.getEsHostUrl() + indexName + "/_update_by_query?refresh=true";
        long currentTime = System.currentTimeMillis();
        String documentsJson = documents != null ? objectMapper.writeValueAsString(documents) : "[]";
        String request = String.format(ES_UPDATE_BY_QUERY_STATUS, docId, ctcApplicationNumber, status, currentTime, documentsJson);
        esPostManual(uri, request);
    }

    public void esPostManual(String uri, String request) throws Exception {
        try {
            log.debug("Record being indexed/updated: {}", request);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(uri, entity, String.class);
            if (uri.contains("_bulk") && JsonPath.read(response, ES_ERRORS_PATH).equals(true)) {
                log.info("Manual Indexing FAILED!!!!");
                log.info("Response from ES for manual push: {}", response);
                throw new Exception("Error while updating index");
            }
            log.debug("ES response: {}", response);
        } catch (Exception e) {
            log.error("Exception while trying to index/update ES documents.", e);
            throw e;
        }
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    public Map<String, Integer> getDocStatusCounts(String ctcApplicationNumber) throws Exception {
        String indexName = config.getIssueCtcDocumentsIndex();
        String uri = config.getEsHostUrl() + indexName + "/_search";
        String request = String.format(ES_SEARCH_DOCS_BY_APPLICATION, ctcApplicationNumber);

        final HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        headers.add("Authorization", getESEncodedCredentials());
        final HttpEntity<String> entity = new HttpEntity<>(request, headers);

        String response = restTemplate.postForObject(uri, entity, String.class);
        List<Map<String, Object>> hits = JsonPath.read(response, "$.hits.hits[*]._source.Data");

        Map<String, Integer> statusCounts = new HashMap<>();
        for (Map<String, Object> hit : hits) {
            String status = (String) hit.get("status");
            statusCounts.merge(status, 1, Integer::sum);
        }
        return statusCounts;
    }

    public void updateTrackerStatus(String ctcApplicationNumber, String status, Long date) {
        try {
            String indexName = config.getCtcApplicationTrackerIndex();
            String uri = config.getEsHostUrl() + indexName + "/_update_by_query?refresh=true";
            String request;
            request = String.format(ServiceConstants.ES_UPDATE_TRACKER_STATUS_BY_APPLICATION, ctcApplicationNumber, status, date);

            esPostManual(uri, request);
            log.info("Updated tracker status for application: {} to status: {}", ctcApplicationNumber, status);
        } catch (Exception e) {
            log.error("Error updating tracker status for application: {}", ctcApplicationNumber, e);
            throw new CustomException(ServiceConstants.CTC_APPLICATION_TRACKER_INDEX_EXCEPTION,
                    "Error updating tracker status in ES index: " + e.getMessage());
        }
    }

    public void pushCtcApplicationTracker(CtcApplicationTracker tracker) {
        try {
            String indexName = config.getCtcApplicationTrackerIndex();
            String searchableFieldsJson = tracker.getSearchableFields() != null
                    ? "[" + tracker.getSearchableFields().stream()
                    .map(s -> "\"" + s + "\"")
                    .collect(Collectors.joining(",")) + "]"
                    : "[]";

            String payload = String.format(
                    ES_INDEX_HEADER_FORMAT + ServiceConstants.ES_CTC_APPLICATION_TRACKER_FORMAT,
                    indexName,
                    tracker.getId(),
                    tracker.getTenantId(),
                    tracker.getCourtId(),
                    tracker.getFilingNumber(),
                    tracker.getCtcApplicationNumber(),
                    tracker.getStatus(),
                    tracker.getDateRaised(),
                    tracker.getApplicantName(),
                    tracker.getCaseTitle(),
                    tracker.getCaseNumber(),
                    searchableFieldsJson
            );

            String uri = config.getEsHostUrl() + config.getBulkPath() + "?refresh=true";
            esPostManual(uri, payload);
            log.info("Pushed ctc-application-tracker to ES for application: {}", tracker.getCtcApplicationNumber());
        } catch (Exception e) {
            log.error("Error pushing ctc-application-tracker to ES for application: {}", tracker.getCtcApplicationNumber(), e);
            throw new CustomException(ServiceConstants.CTC_APPLICATION_TRACKER_INDEX_EXCEPTION,
                    "Error pushing tracker to ES index: " + e.getMessage());
        }
    }

    public void pushIssueCtcDocumentsToIndex(CtcApplication application) {
        try {
            List<IssueCtcDocument> documents = new ArrayList<>();
            Long currentTime = System.currentTimeMillis();

            // Build fileStoreId lookup from caseBundles (for when selectedCaseBundle has null fileStoreId)
            Map<String, String> fileStoreIdMap = new HashMap<>();
            if (application.getCaseBundles() != null) {
                for (CaseBundleNode bundleNode : application.getCaseBundles()) {
                    buildFileStoreIdMap(bundleNode, fileStoreIdMap);
                }
            }

            if (application.getSelectedCaseBundle() != null) {
                for (CaseBundleNode node : application.getSelectedCaseBundle()) {
                    collectDocuments(node, application, currentTime, documents, fileStoreIdMap);
                }
            }

            if (!documents.isEmpty()) {
                pushIssueCtcDocuments(documents);
                log.info("Pushed {} issue-ctc-documents to ES index for application: {}",
                        documents.size(), application.getCtcApplicationNumber());
            }
        } catch (Exception e) {
            log.error("Error pushing issue-ctc-documents to ES for application: {}",
                    application.getCtcApplicationNumber(), e);
            throw new CustomException(ServiceConstants.CTC_ISSUE_DOCUMENTS_INDEX_EXCEPTION,
                    "Error pushing documents to ES index: " + e.getMessage());
        }
    }

    private void buildFileStoreIdMap(CaseBundleNode node, Map<String, String> fileStoreIdMap) {
        if (node == null) return;
        if (node.getId() != null && node.getFileStoreId() != null) {
            fileStoreIdMap.put(node.getId(), node.getFileStoreId());
        }
        if (node.getChildren() != null) {
            for (CaseBundleNode child : node.getChildren()) {
                buildFileStoreIdMap(child, fileStoreIdMap);
            }
        }
    }

    private void collectDocuments(CaseBundleNode node, CtcApplication application,
                                  Long currentTime, List<IssueCtcDocument> documents,
                                  Map<String, String> fileStoreIdMap) {
        if (node == null) return;

        // Use fileStoreId from selectedCaseBundle, fallback to caseBundles lookup
        String fileStoreId = node.getFileStoreId() != null
                ? node.getFileStoreId()
                : fileStoreIdMap.get(node.getId());

        if (fileStoreId != null) {
            IssueCtcDocument doc = IssueCtcDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .docId(node.getId())
                    .ctcApplicationNumber(application.getCtcApplicationNumber())
                    .createdTime(currentTime)
                    .lastModifiedTime(currentTime)
                    .docTitle(node.getTitle())
                    .status("PENDING")
                    .caseTitle(application.getCaseTitle())
                    .caseNumber(application.getCaseNumber())
                    .filingNumber(application.getFilingNumber())
                    .courtId(application.getCourtId())
                    .tenantId(application.getTenantId())
                    .fileStoreId(fileStoreId)
                    .nameOfApplicant(application.getApplicantName())
                    .dateOfApplication(application.getAuditDetails().getCreatedTime())
                    .dateOfApplicationApproval(application.getDateOfApplicationApproval())
                    .build();
            documents.add(doc);
        }

        if (node.getChildren() != null) {
            for (CaseBundleNode child : node.getChildren()) {
                collectDocuments(child, application, currentTime, documents, fileStoreIdMap);
            }
        }
    }

}
