package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.PendingTask;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;


@Slf4j
@Component
public class PendingTaskUtil {

    private final Configuration config;

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    private final IndexerUtils indexerUtils;
    public PendingTaskUtil(Configuration config, RestTemplate restTemplate, ObjectMapper objectMapper, IndexerUtils indexerUtils) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.indexerUtils = indexerUtils;
    }

    public JsonNode callPendingTask(String filingNumber) {
        String url = config.getEsHostUrl() + config.getPendingTaskIndexEndpoint() + config.getPendingTaskSearchPath();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", getESEncodedCredentials());

        String query = getEsQuery(filingNumber);

        return getPendingTasksJsonNode(url, headers, query);
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }
    private String getEsQuery(String filingNumber) {
        return "{\n" +
                "  \"query\": {\n" +
                "    \"bool\": {\n" +
                "      \"must\": [\n" +
                "        {\n" +
                "          \"match\": {\n" +
                "            \"Data.filingNumber.keyword\": \"" + filingNumber + "\"\n" +
                "          }\n" +
                "        },\n" +
                "        {\n" +
                "          \"term\": {\n" +
                "            \"Data.isCompleted\": false\n" +
                "          }\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  },\n" +
                "  \"size\":2000\n" +
                "}";
    }

    public void updatePendingTask(List<JsonNode> pendingTasks) throws Exception {

        String url = config.getEsHostUrl() + config.getBulkPath();
        for(JsonNode task: pendingTasks) {
            PendingTask pendingTask = objectMapper.convertValue( task.get("_source").get("Data"), PendingTask.class);
            // Set offices to empty list so it will be calculated from case details in buildPayload method
            pendingTask.setOffices(new ArrayList<>());
            String requestBody = indexerUtils.buildPayload(pendingTask);
            indexerUtils.esPostManual(url, requestBody);
        }
    }

    public void updatePendingTask(List<JsonNode> pendingTasks, JsonNode caseDetails) throws Exception {

        String url = config.getEsHostUrl() + config.getBulkPath();
        for(JsonNode task: pendingTasks) {
            PendingTask pendingTask = objectMapper.convertValue( task.get("_source").get("Data"), PendingTask.class);
            // Set offices to empty list so it will be calculated from case details in buildPayload method
            pendingTask.setOffices(new ArrayList<>());
            String requestBody = indexerUtils.buildPayload(pendingTask, caseDetails);
            indexerUtils.esPostManual(url, requestBody);
        }
    }

    private JsonNode getPendingTasksJsonNode(String url, HttpHeaders headers, String query) {
        HttpEntity<String> requestEntity = new HttpEntity<>(query, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_PENDING_TASK, e);
            throw new CustomException(ERROR_WHILE_FETCHING_PENDING_TASK, e.getMessage());
        }
    }

    public JsonNode callPendingTaskByFilingNumberAndAssignedTo(String filingNumber, String userUuid) {
        String url = config.getEsHostUrl() + config.getPendingTaskIndexEndpoint() + config.getPendingTaskSearchPath();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", getESEncodedCredentials());

        String query = getEsQueryByFilingNumberAndAssignedTo(filingNumber, userUuid);

        return getPendingTasksJsonNode(url, headers, query);
    }

    private String getEsQueryByFilingNumberAndAssignedTo(String filingNumber, String userUuid) {
        return "{\n" +
                "  \"query\": {\n" +
                "    \"bool\": {\n" +
                "      \"must\": [\n" +
                "        {\n" +
                "          \"match\": {\n" +
                "            \"Data.filingNumber.keyword\": \"" + filingNumber + "\"\n" +
                "          }\n" +
                "        },\n" +
                "        {\n" +
                "          \"match\": {\n" +
                "            \"Data.assignedTo.uuid.keyword\": \"" + userUuid + "\"\n" +
                "          }\n" +
                "        },\n" +
                "        {\n" +
                "          \"term\": {\n" +
                "            \"Data.isCompleted\": false\n" +
                "          }\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  },\n" +
                "  \"size\": 2000\n" +
                "}";
    }
}
