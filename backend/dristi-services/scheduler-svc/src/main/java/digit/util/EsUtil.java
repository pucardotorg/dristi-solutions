package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import digit.config.Configuration;
import digit.service.CacheService;
import digit.web.models.OpenHearing;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class EsUtil {


    private final RestTemplate restTemplate;
    private final Configuration config;
    private final CacheService cacheService;
    private final DateUtil dateUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public EsUtil(RestTemplate restTemplate, Configuration config, CacheService cacheService, DateUtil dateUtil, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.cacheService = cacheService;
        this.dateUtil = dateUtil;
        this.objectMapper = objectMapper;
    }


    public String buildPayload(OpenHearing openHearing) {
        String hearingUuid = openHearing.getHearingUuid();
        Integer serialNumber = openHearing.getSerialNumber();

        return String.format(
                ES_UPDATE_HEADER_FORMAT + ES_UPDATE_DOCUMENT_FORMAT, config.getIndex(), hearingUuid,serialNumber
        );
    }

    public void updateOpenHearingSerialNumber(List<OpenHearing> openHearings) {
        try {

            if (openHearings != null && !openHearings.isEmpty()) {
                try {
                    String bulkRequestPayload = openHearings.stream()
                            .map(this::buildPayload)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.joining(""));
                    String uri = config.getEsHostUrl() + config.getBulkPath();
                    manualIndex(uri, bulkRequestPayload);
                } catch (Exception e) {
                    log.error("Error occurred while updating open hearing serialNumber in es");
                    log.error("ERROR_FROM_ES: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Something went wrong while updating serialNumber of open hearing");
            log.error("ERROR: {}", e.getMessage());
        }


    }

    public void updateOpenHearingInCache(List<OpenHearing> openHearings, Long hearingDate) {
        try {
            if (Boolean.FALSE.equals(config.getRedisEnabled())) {
                log.info("Redis is disabled. Skipping cache update for open hearings.");
                return;
            }
            log.info("Updating redis cache for open hearings.");
            if (openHearings == null || openHearings.isEmpty()) {
                log.info("No open hearings to update in cache.");
                return;
            }
            String courtId = openHearings.get(0).getCourtId() != null ? openHearings.get(0).getCourtId() : config.getCourtId();
            LocalDate date = dateUtil.getLocalDateFromEpoch(hearingDate);
            String dateStr = date.format(DateTimeFormatter.ofPattern(DATE_FORMAT_REDIS));
            String baseKey = CACHE_KEY_PREFIX + courtId + ":" + dateStr;
            String causeListKey = baseKey + CACHE_CAUSE_LIST_SUFFIX;

            List<String> hearingKeys = new ArrayList<>();
            for (OpenHearing h : openHearings) {
                String hearingKey = baseKey + CACHE_HEARING_PREFIX + h.getHearingNumber();
                Map<String, Object> hearingMap = new LinkedHashMap<>();
                hearingMap.put("hearingNumber", h.getHearingNumber() != null ? h.getHearingNumber() : "");
                hearingMap.put("hearingUuid", h.getHearingUuid() != null ? h.getHearingUuid() : "");
                hearingMap.put("status", h.getStatus() != null ? h.getStatus() : "");
                hearingMap.put("statusOrder", h.getStatusOrder() != null ? h.getStatusOrder() : 99);
                hearingMap.put("caseNumber", h.getCaseNumber() != null ? h.getCaseNumber() : "");
                hearingMap.put("caseTitle", h.getCaseTitle() != null ? h.getCaseTitle() : "");
                hearingMap.put("hearingType", h.getHearingType() != null ? h.getHearingType() : "");
                hearingMap.put("stage", h.getStage() != null ? h.getStage() : "");
                hearingMap.put("filingNumber", h.getFilingNumber() != null ? h.getFilingNumber() : "");
                hearingMap.put("caseUuid", h.getCaseUuid() != null ? h.getCaseUuid() : "");
                hearingMap.put("serialNumber", h.getSerialNumber());
                hearingMap.put("fromDate", h.getFromDate() != null ? h.getFromDate() : 0L);
                hearingMap.put("toDate", h.getToDate() != null ? h.getToDate() : 0L);
                hearingMap.put("tenantId", h.getTenantId() != null ? h.getTenantId() : "");
                hearingMap.put("courtId", h.getCourtId() != null ? h.getCourtId() : "");
                hearingMap.put("hearingTypeOrder", h.getHearingTypeOrder() != null ? h.getHearingTypeOrder() : 99);
                try {
                    hearingMap.put("advocate", objectMapper.writeValueAsString(h.getAdvocate()));
                } catch (Exception ex) {
                    hearingMap.put("advocate", "{}");
                }
                cacheService.hmset(hearingKey, hearingMap);
                hearingKeys.add(hearingKey);
            }
            cacheService.setList(causeListKey, hearingKeys);
            log.info("Updated redis cache for {} hearings under key: {}", hearingKeys.size(), causeListKey);
        } catch (Exception e) {
            log.error("Error while updating redis cache for open hearings:: {}", e.getMessage());
        }
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
            log.error("Exception while trying to index the ES documents", e);
            throw e;
        }
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        return "Basic " + new String(base64CredentialsBytes);
    }
}
