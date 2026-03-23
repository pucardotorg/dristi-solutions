package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.TaskCase;
import org.pucar.dristi.web.models.TaskCaseSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class EsUtil {


    private final RestTemplate restTemplate;
    private final Configuration config;
    private final ObjectMapper objectMapper;

    @Autowired
    public EsUtil(RestTemplate restTemplate, Configuration config, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    public String buildBulkPayload(List<TaskCase> taskCases) throws JsonProcessingException {
        StringBuilder bulkPayload = new StringBuilder();
        
        for (TaskCase taskCase : taskCases) {
            String indexHeader = String.format(ES_INDEX_HEADER_FORMAT, config.getIndex());
            String document = objectMapper.writeValueAsString(taskCase);
            bulkPayload.append(indexHeader).append(document).append("\n");
        }
        
        return bulkPayload.toString();
    }


    public void manualIndex(String uri, String request) throws Exception {
        try {
            log.debug("Record being indexed manually: {}", request);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(uri, entity, String.class);
            if (uri.contains("_bulk") && JsonPath.read(response, ERRORS_PATH).equals(true)) {
                log.info("Manual Indexing FAILED!!!!");
                log.info("Response from ES for manual push: {}", response);
                throw new Exception("Error while updating index");
            }
        } catch (Exception e) {
            log.error("Exception while trying to index the ES documents. Note: ES is not Down.", e);
            throw e;
        }
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        return "Basic " + new String(base64CredentialsBytes);
    }

    public void bulkIndex(String uri, List<TaskCase> taskCases) throws Exception {
        try {
            log.debug("Bulk indexing {} tasks to Elasticsearch", taskCases.size());
            
            String bulkPayload = buildBulkPayload(taskCases);
            
            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(bulkPayload, headers);

            String response = restTemplate.postForObject(uri, entity, String.class);
            
            if (JsonPath.read(response, ERRORS_PATH).equals(true)) {
                log.error("Bulk indexing FAILED!!!! Response: {}", response);
                throw new Exception("Error while bulk indexing to Elasticsearch");
            }
            
            log.info("Successfully bulk indexed {} tasks", taskCases.size());
        } catch (Exception e) {
            log.error("Exception while trying to bulk index ES documents: {}", e.getMessage(), e);
            throw e;
        }
    }

    public void indexTaskCase(TaskCase taskCase) {
        try {
            String docId = taskCase.getId().toString();
            String indexUrl = config.getEsHost() + "/" + config.getIndex() + "/_doc/" + docId;
            String document = objectMapper.writeValueAsString(taskCase);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(document, headers);

            restTemplate.put(indexUrl, entity);
            log.info("Successfully indexed TaskCase with id: {}", docId);
        } catch (Exception e) {
            log.error("Failed to index TaskCase to ES: {}", e.getMessage(), e);
        }
    }

    public List<TaskCase> searchTasksFromEs(TaskCaseSearchCriteria criteria, Pagination pagination) {
        try {
            String searchUrl = config.getEsHost() + "/" + config.getIndex() + "/_search";
            String query = buildSearchQuery(criteria, pagination);

            log.debug("ES search query: {}", query);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(query, headers);

            String response = restTemplate.postForObject(searchUrl, entity, String.class);

            return parseSearchResponse(response, pagination);
        } catch (Exception e) {
            log.error("Exception while searching ES: {}", e.getMessage(), e);
            throw new CustomException(ES_SEARCH_ERROR, "Error while searching Elasticsearch: " + e.getMessage());
        }
    }

    private String buildSearchQuery(TaskCaseSearchCriteria criteria, Pagination pagination) throws JsonProcessingException {
        ObjectNode rootNode = objectMapper.createObjectNode();
        ObjectNode queryNode = objectMapper.createObjectNode();
        ObjectNode boolNode = objectMapper.createObjectNode();
        ArrayNode mustArray = objectMapper.createArrayNode();
        ArrayNode shouldArray = objectMapper.createArrayNode();

        if (criteria.getCourtId() != null) {
            mustArray.add(buildTermQuery("courtId.keyword", criteria.getCourtId()));
        }

        if (criteria.getOrderType() != null && !criteria.getOrderType().isEmpty()) {
            ObjectNode termsNode = objectMapper.createObjectNode();
            ObjectNode termsInner = objectMapper.createObjectNode();
            ArrayNode valuesArray = objectMapper.createArrayNode();
            criteria.getOrderType().forEach(valuesArray::add);
            termsInner.set("orderType.keyword", valuesArray);
            termsNode.set("terms", termsInner);
            mustArray.add(termsNode);
        }

        if (criteria.getApplicationStatus() != null) {
            mustArray.add(buildTermQuery("status.keyword", criteria.getApplicationStatus()));
        }

        if (criteria.getCompleteStatus() != null && !criteria.getCompleteStatus().isEmpty()) {
            ObjectNode termsNode = objectMapper.createObjectNode();
            ObjectNode termsInner = objectMapper.createObjectNode();
            ArrayNode valuesArray = objectMapper.createArrayNode();
            criteria.getCompleteStatus().forEach(valuesArray::add);
            termsInner.set("status.keyword", valuesArray);
            termsNode.set("terms", termsInner);
            mustArray.add(termsNode);
        }

        if (criteria.getNoticeType() != null) {
            mustArray.add(buildTermQuery("taskType.keyword", criteria.getNoticeType()));
        }

        if (criteria.getDeliveryChanel() != null) {
            mustArray.add(buildMatchQuery("taskDetails.deliveryChannels.channelCode", criteria.getDeliveryChanel()));
        }

        if (criteria.getHearingDate() != null) {
            ObjectNode rangeNode = objectMapper.createObjectNode();
            ObjectNode rangeInner = objectMapper.createObjectNode();
            ObjectNode rangeField = objectMapper.createObjectNode();
            rangeField.put("gte", criteria.getHearingDate());
            rangeField.put("lte", criteria.getHearingDate());
            rangeInner.set("createdDate", rangeField);
            rangeNode.set("range", rangeInner);
            mustArray.add(rangeNode);
        }

        if (criteria.getIsPendingCollection() != null) {
            mustArray.add(buildMatchQuery("taskDetails.deliveryChannels.isPendingCollection", criteria.getIsPendingCollection().toString()));
        }

        if (criteria.getSearchText() != null && !criteria.getSearchText().isEmpty()) {
            ObjectNode multiMatchNode = objectMapper.createObjectNode();
            ObjectNode multiMatchInner = objectMapper.createObjectNode();
            multiMatchInner.put("query", criteria.getSearchText());
            ArrayNode fieldsArray = objectMapper.createArrayNode();
            fieldsArray.add("caseName");
            fieldsArray.add("filingNumber");
            fieldsArray.add("taskNumber");
            fieldsArray.add("cnrNumber");
            fieldsArray.add("cmpNumber");
            fieldsArray.add("courtCaseNumber");
            multiMatchInner.set("fields", fieldsArray);
            multiMatchInner.put("type", "best_fields");
            multiMatchInner.put("operator", "OR");
            multiMatchNode.set("multi_match", multiMatchInner);
            mustArray.add(multiMatchNode);
        }

        boolNode.set("must", mustArray);
        queryNode.set("bool", boolNode);
        rootNode.set("query", queryNode);

        int from = pagination != null && pagination.getOffSet() != null ? pagination.getOffSet().intValue() : 0;
        int size = pagination != null && pagination.getLimit() != null ? pagination.getLimit().intValue() : 10;
        rootNode.put("from", from);
        rootNode.put("size", size);

        if (pagination != null && pagination.getSortBy() != null) {
            ArrayNode sortArray = objectMapper.createArrayNode();
            ObjectNode sortField = objectMapper.createObjectNode();
            String order = pagination.getOrder() != null ? pagination.getOrder().toString().toLowerCase() : "desc";
            ObjectNode sortOrder = objectMapper.createObjectNode();
            sortOrder.put("order", order);
            sortField.set(pagination.getSortBy() + ".keyword", sortOrder);
            sortArray.add(sortField);
            rootNode.set("sort", sortArray);
        } else {
            ArrayNode sortArray = objectMapper.createArrayNode();
            ObjectNode sortField = objectMapper.createObjectNode();
            ObjectNode sortOrder = objectMapper.createObjectNode();
            sortOrder.put("order", "desc");
            sortField.set("createdDate", sortOrder);
            sortArray.add(sortField);
            rootNode.set("sort", sortArray);
        }

        rootNode.put("track_total_hits", true);

        return objectMapper.writeValueAsString(rootNode);
    }

    private ObjectNode buildTermQuery(String field, String value) {
        ObjectNode termNode = objectMapper.createObjectNode();
        ObjectNode termInner = objectMapper.createObjectNode();
        termInner.put(field, value);
        termNode.set("term", termInner);
        return termNode;
    }

    private ObjectNode buildMatchQuery(String field, String value) {
        ObjectNode matchNode = objectMapper.createObjectNode();
        ObjectNode matchInner = objectMapper.createObjectNode();
        matchInner.put(field, value);
        matchNode.set("match", matchInner);
        return matchNode;
    }

    private List<TaskCase> parseSearchResponse(String response, Pagination pagination) throws JsonProcessingException {
        JsonNode responseNode = objectMapper.readTree(response);
        JsonNode hitsNode = responseNode.path("hits");
        long totalHits = hitsNode.path("total").path("value").asLong(0);

        if (pagination != null) {
            pagination.setTotalCount((double) totalHits);
        }

        JsonNode hitsArray = hitsNode.path("hits");
        List<TaskCase> results = new ArrayList<>();

        for (JsonNode hit : hitsArray) {
            JsonNode source = hit.path("_source");
            TaskCase taskCase = objectMapper.treeToValue(source, TaskCase.class);
            results.add(taskCase);
        }

        return results;
    }
}
