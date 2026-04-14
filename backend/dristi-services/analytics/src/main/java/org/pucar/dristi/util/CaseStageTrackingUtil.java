package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.CaseStageTracking;
import org.pucar.dristi.web.models.CaseStageTrackingEntry;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.STAGE_REGISTRATION;
import static org.pucar.dristi.config.ServiceConstants.STAGE_SCRUTINY;

@Slf4j
@Component
public class CaseStageTrackingUtil {

    private final Configuration config;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public CaseStageTrackingUtil(Configuration config, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Fetches the existing CaseStageTracking document from ES by filingNumber.
     * Returns null if no document is found.
     */
    public CaseStageTracking getStageTrackingByFilingNumber(String filingNumber) {
        try {
            String url = config.getEsHostUrl() + config.getCaseStageTrackingIndex() + "/_search";
            HttpHeaders headers = buildHeaders();
            String query = buildSearchQuery(filingNumber);
            HttpEntity<String> requestEntity = new HttpEntity<>(query, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode hits = root.path("hits").path("hits");

            if (hits.isArray() && !hits.isEmpty()) {
                JsonNode source = hits.get(0).path("_source").path("Data");
                return objectMapper.convertValue(source, CaseStageTracking.class);
            }
        } catch (Exception e) {
            log.error("Error fetching stage tracking from ES for filingNumber: {}", filingNumber, e);
        }
        return null;
    }

    /**
     * Indexes (creates or updates) a CaseStageTracking document in ES.
     * Uses filingNumber as the document ID so repeated calls overwrite the same doc.
     */
    public void upsertStageTracking(CaseStageTracking tracking) {
        try {
            String indexName = config.getCaseStageTrackingIndex();
            String docId = tracking.getFilingNumber();
            String url = config.getEsHostUrl() + indexName + "/_doc/" + docId;

            HttpHeaders headers = buildHeaders();
            String body = objectMapper.writeValueAsString(new DataWrapper(tracking));
            HttpEntity<String> requestEntity = new HttpEntity<>(body, headers);

            restTemplate.exchange(url, HttpMethod.PUT, requestEntity, String.class);
            log.info("Upserted stage tracking for filingNumber: {}", docId);
        } catch (Exception e) {
            log.error("Error upserting stage tracking for filingNumber: {}", tracking.getFilingNumber(), e);
        }
    }

    /**
     * Adds a new stage entry to the tracking document.
     * If no document exists for the case, creates one.
     *
     * @param filingNumber case filing number
     * @param caseId       case ID
     * @param tenantId     tenant ID
     * @param stageName    the new stage name to add
     */
    public void addStageEntry(String filingNumber, String caseId, String tenantId, String stageName) {
        CaseStageTracking tracking = getStageTrackingByFilingNumber(filingNumber);
        long now = System.currentTimeMillis();

        if (tracking == null) {
            tracking = CaseStageTracking.builder()
                    .filingNumber(filingNumber)
                    .caseId(caseId)
                    .tenantId(tenantId)
                    .stages(new ArrayList<>())
                    .build();
        }

        // Check if this stage already exists and has no endTime (still active) — skip adding duplicate
        boolean alreadyActive = tracking.getStages().stream()
                .anyMatch(e -> e.getStage() != null && e.getStage().equalsIgnoreCase(stageName) && e.getEndTime() == null);
        if (alreadyActive) {
            log.info("Stage '{}' is already active for filingNumber: {}, skipping duplicate entry", stageName, filingNumber);
            return;
        }

        CaseStageTrackingEntry entry = CaseStageTrackingEntry.builder()
                .stage(stageName)
                .startTime(now)
                .endTime(null)
                .build();
        tracking.getStages().add(entry);
        log.info("Adding stage entry '{}' with startTime={} for filingNumber: {}", stageName, now, filingNumber);

        upsertStageTracking(tracking);
    }

    /**
     * Finds the stage matching endStageName in the tracking document and sets its endTime to now.
     *
     * @param filingNumber case filing number
     * @param endStageName the stage whose endTime should be set
     */
    public void updateEndTimeForStage(String filingNumber, String endStageName) {
        CaseStageTracking tracking = getStageTrackingByFilingNumber(filingNumber);
        if (tracking == null) {
            log.info("No stage tracking document found for filingNumber: {} to update endTime for stage '{}'", filingNumber, endStageName);
            return;
        }

        boolean updated = false;
        long now = System.currentTimeMillis();
        String[] stageNames = endStageName.contains(",") ? endStageName.split(",") : new String[]{endStageName};

        for (String stageName : stageNames) {
            String trimmed = stageName.trim();
            for (CaseStageTrackingEntry entry : tracking.getStages()) {
                if (entry.getStage() != null && entry.getStage().equalsIgnoreCase(trimmed) && entry.getEndTime() == null) {
                    entry.setEndTime(now);
                    log.info("Setting endTime={} for stage '{}' in filingNumber: {}", now, trimmed, filingNumber);
                    updated = true;
                    break;
                }
            }
            if (updated) break;
        }

        if (updated) {
            upsertStageTracking(tracking);
        } else {
            log.info("Stage '{}' not found or already ended in tracking for filingNumber: {}", endStageName, filingNumber);
        }
    }

    /**
     * Starts a secondary stage for the given case. Multiple secondary stages can be active simultaneously.
     * If the stage is already active (no endTime), it won't be duplicated.
     *
     * @param filingNumber case filing number
     * @param tenantId     tenant ID
     * @param stageName    the secondary stage name to start
     */
    public void startSecondaryStage(String filingNumber, String tenantId, String stageName) {
        CaseStageTracking tracking = getStageTrackingByFilingNumber(filingNumber);
        long now = System.currentTimeMillis();

        if (tracking == null) {
            tracking = CaseStageTracking.builder()
                    .filingNumber(filingNumber)
                    .tenantId(tenantId)
                    .stages(new ArrayList<>())
                    .secondaryStages(new ArrayList<>())
                    .build();
        }

        // Check if this secondary stage is already active
        boolean alreadyActive = tracking.getSecondaryStages().stream()
                .anyMatch(e -> e.getStage() != null && e.getStage().equalsIgnoreCase(stageName) && e.getEndTime() == null);
        if (alreadyActive) {
            log.info("Secondary stage '{}' is already active for filingNumber: {}, skipping", stageName, filingNumber);
            return;
        }

        CaseStageTrackingEntry entry = CaseStageTrackingEntry.builder()
                .stage(stageName)
                .startTime(now)
                .endTime(null)
                .build();
        tracking.getSecondaryStages().add(entry);
        log.info("Started secondary stage '{}' with startTime={} for filingNumber: {}", stageName, now, filingNumber);

        upsertStageTracking(tracking);
    }

    /**
     * Ends a secondary stage by setting its endTime to now.
     *
     * @param filingNumber case filing number
     * @return true if a stage was actually ended
     */
    public boolean endSecondaryStage(String filingNumber) {
        CaseStageTracking tracking = getStageTrackingByFilingNumber(filingNumber);
        if (tracking == null) {
            log.info("No tracking document found for filingNumber: {}", filingNumber);
            return false;
        }

        boolean updated = false;
        long now = System.currentTimeMillis();
        for (CaseStageTrackingEntry entry : tracking.getSecondaryStages()) {
            if (entry.getStage() != null && entry.getEndTime() == null) {
                entry.setEndTime(now);
                log.info("endTime={} for filingNumber: {}", now, filingNumber);
                updated = true;
            }
        }

        if (updated) {
            upsertStageTracking(tracking);
        }
        return updated;
    }

    /**
     * Returns the list of currently active secondary stage names (those with endTime == null).
     *
     * @param filingNumber case filing number
     * @return list of active secondary stage names, empty list if none
     */
    public List<String> getActiveSecondaryStageNames(String filingNumber) {
        CaseStageTracking tracking = getStageTrackingByFilingNumber(filingNumber);
        if (tracking == null || tracking.getSecondaryStages() == null) {
            return new ArrayList<>();
        }
        List<String> activeStages = new ArrayList<>();
        for (CaseStageTrackingEntry entry : tracking.getSecondaryStages()) {
            if (entry.getEndTime() == null && entry.getStage() != null) {
                activeStages.add(entry.getStage());
            }
        }
        return activeStages;
    }

    /**
     * Enriches the caseId on an existing tracking document if it is currently null.
     *
     * @param filingNumber case filing number
     * @param caseId       the case ID to set
     */
    public void enrichCaseId(String filingNumber, String caseId) {
        if (caseId == null || caseId.isEmpty()) {
            return;
        }
        try {
            CaseStageTracking tracking = getStageTrackingByFilingNumber(filingNumber);
            if (tracking != null && (tracking.getCaseId() == null || tracking.getCaseId().isEmpty())) {
                tracking.setCaseId(caseId);
                upsertStageTracking(tracking);
                log.info("Enriched caseId '{}' for stage tracking filingNumber: {}", caseId, filingNumber);
            }
        } catch (Exception e) {
            log.error("Error enriching caseId for filingNumber: {}", filingNumber, e);
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", getESEncodedCredentials());
        return headers;
    }

    private String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    private String buildSearchQuery(String filingNumber) {
        return "{\n" +
                "  \"query\": {\n" +
                "    \"term\": {\n" +
                "      \"Data.filingNumber.keyword\": \"" + filingNumber + "\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"size\": 1\n" +
                "}";
    }

    /**
     * Wrapper to nest tracking data under "Data" key to follow ES index convention.
     */
    private static class DataWrapper {
        @com.fasterxml.jackson.annotation.JsonProperty("Data")
        private final CaseStageTracking data;

        DataWrapper(CaseStageTracking data) {
            this.data = data;
        }

        public CaseStageTracking getData() {
            return data;
        }
    }
}
