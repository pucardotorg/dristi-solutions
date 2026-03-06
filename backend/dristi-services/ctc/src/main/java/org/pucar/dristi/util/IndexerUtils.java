package org.pucar.dristi.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CtcApplication;
import org.pucar.dristi.web.models.IssueCtcDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class IndexerUtils {

    private final RestTemplate restTemplate;
    private final Configuration config;

    @Autowired
    public IndexerUtils(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public void pushIssueCtcDocuments(List<IssueCtcDocument> documents) throws Exception {
        if (documents == null || documents.isEmpty()) {
            return;
        }

        String bulkPayload = documents.stream()
                .map(this::buildPayload)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining());

        String uri = config.getEsHostUrl() + config.getBulkPath();
        esPostManual(uri, bulkPayload);
    }

    public String buildPayload(IssueCtcDocument doc) {
        String indexName = config.getIssueCtcDocumentsIndex();
        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_ISSUE_CTC_DOC_FORMAT,
                indexName,
                doc.getId(),
                doc.getDocId(),
                doc.getCtcApplicationNumber(),
                doc.getCreatedTime(),
                doc.getLastModifiedTime(),
                doc.getDocTitle(),
                doc.getStatus(),
                doc.getCaseTitle(),
                doc.getCaseNumber()
        );
    }

    public void updateIssuedStatus(String docId) throws Exception {
        String indexName = config.getIssueCtcDocumentsIndex();
        String uri = config.getEsHostUrl() + indexName + "/_update_by_query";
        long currentTime = System.currentTimeMillis();
        String request = String.format(ES_UPDATE_BY_QUERY_ISSUED, docId, currentTime);
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

    public int getIssuedDocCount(String ctcApplicationNumber) throws Exception {
        String indexName = config.getIssueCtcDocumentsIndex();
        String uri = config.getEsHostUrl() + indexName + "/_count";
        String request = String.format(ES_COUNT_ISSUED_DOCS, ctcApplicationNumber);

        final HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
        headers.add("Authorization", getESEncodedCredentials());
        final HttpEntity<String> entity = new HttpEntity<>(request, headers);

        String response = restTemplate.postForObject(uri, entity, String.class);
        return JsonPath.read(response, "$.count");
    }

    public void pushIssueCtcDocumentsToIndex(CtcApplication application) {
        try {
            List<IssueCtcDocument> documents = new ArrayList<>();
            Long currentTime = System.currentTimeMillis();

            if (application.getCaseBundleNodes() != null) {
                for (CaseBundleNode parentNode : application.getCaseBundleNodes()) {
                    if (parentNode.getChildren() != null) {
                        for (CaseBundleNode child : parentNode.getChildren()) {
                            IssueCtcDocument doc = IssueCtcDocument.builder()
                                    .id(UUID.randomUUID().toString())
                                    .docId(child.getId())
                                    .ctcApplicationNumber(application.getCtcApplicationNumber())
                                    .createdTime(currentTime)
                                    .lastModifiedTime(currentTime)
                                    .docTitle(child.getTitle())
                                    .status("PENDING")
                                    .caseTitle(application.getCaseTitle())
                                    .caseNumber(application.getCaseNumber())
                                    .build();
                            documents.add(doc);
                        }
                    }
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

}
