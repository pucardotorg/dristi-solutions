package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;


@Slf4j
@Component
public class PendingTaskUtil {

    private final Configuration config;

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    public PendingTaskUtil(Configuration config, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public JsonNode callPendingTask(String referenceId) {
        String url = config.getEsHostUrl() + config.getPendingTaskIndexEndpoint() + config.getPendingTaskSearchPath();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", getESEncodedCredentials());

        String query = getEsQuery(referenceId);

        HttpEntity<String> entity = new HttpEntity<>(query, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("ERROR_WHILE_FETCHING_PENDING_TASK", e);
            throw new CustomException("ERROR_WHILE_FETCHING_PENDING_TASK", e.getMessage());
        }
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    private String getEsQuery(String referenceId) {
        return "{\n" +
                "  \"query\": {\n" +
                "    \"bool\": {\n" +
                "      \"must\": [\n" +
                "        {\n" +
                "          \"match\": {\n" +
                "            \"Data.referenceId.keyword\": \"" + referenceId + "\"\n" +
                "          }\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  },\n" +
                "  \"size\":100\n" +
                "}";
    }
}
