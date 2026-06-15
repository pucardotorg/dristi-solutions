package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.util.CaseUtil;
import digit.util.DateUtil;
import digit.util.InboxUtil;
import digit.web.models.OpenHearing;
import digit.web.models.cases.CaseCriteria;
import digit.web.models.cases.SearchCaseRequest;
import digit.web.models.inbox.InboxRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class OpenHearingService  {

    private final InboxUtil inboxUtil;
    private final CaseUtil caseUtil;
    private final CacheService cacheService;
    private final Configuration config;
    private final DateUtil dateUtil;
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final ServiceConstants serviceConstants;

    @Autowired
    public OpenHearingService(InboxUtil inboxUtil, CaseUtil caseUtil, CacheService cacheService, Configuration config, DateUtil dateUtil, ObjectMapper objectMapper, UserService userService, ServiceConstants serviceConstants) {
        this.inboxUtil = inboxUtil;
        this.caseUtil = caseUtil;
        this.cacheService = cacheService;
        this.config = config;
        this.dateUtil = dateUtil;
        this.objectMapper = objectMapper;
        this.userService = userService;
        this.serviceConstants = serviceConstants;
    }

    public void loadOpenHearingsToCache() {
        if (Boolean.FALSE.equals(config.getRedisEnabled())) {
            log.info("Redis cache is disabled. Skipping loading open hearings.");
            return;
        }

        try {
            log.info("operation = loadOpenHearingsToCache, result = IN_PROGRESS");
            String courtId = config.getCourtId();
            LocalDate today = LocalDate.now(ZoneId.of(config.getZoneId()));
            Long fromDate = dateUtil.getEpochFromLocalDateTime(today.atStartOfDay());
            Long toDate = dateUtil.getEpochFromLocalDateTime(today.atTime(23, 59, 59));

            InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(courtId, fromDate, toDate);
            List<OpenHearing> openHearings = inboxUtil.getOpenHearings(inboxRequest);

            if (openHearings != null && !openHearings.isEmpty()) {
                String dateStr = today.format(DateTimeFormatter.ofPattern(DATE_FORMAT_REDIS));
                String baseKey = CACHE_KEY_PREFIX + courtId + ":" + dateStr;
                String causeListKey = baseKey + CACHE_CAUSE_LIST_SUFFIX;
                String metaKey = baseKey + CACHE_COURT_META_SUFFIX;

                // Pre-sort all 6 levels once at load time
                List<OpenHearing> sorted = new ArrayList<>(openHearings);
                sorted.sort(hearingComparator());

                // Fetch case fields once per unique filing number (also caches the case object)
                Set<String> filingNumbers = sorted.stream()
                        .map(OpenHearing::getFilingNumber)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
                Map<String, Map<String, String>> caseFieldsByFilingNumber = new HashMap<>();
                for (String fn : filingNumbers) {
                    caseFieldsByFilingNumber.put(fn, fetchCaseFields(fn));
                }

                // Write per-hearing Redis hashes + collect ordered hearing keys
                List<String> hearingKeys = new ArrayList<>();
                for (OpenHearing hearing : sorted) {
                    String hearingIdentifier = hearing.getHearingNumber();
                    if (hearingIdentifier == null) continue;
                    String hKey = baseKey + CACHE_HEARING_PREFIX + hearingIdentifier;
                    hearingKeys.add(hKey);
                    Map<String, String> caseFields = hearing.getFilingNumber() != null
                            ? caseFieldsByFilingNumber.getOrDefault(hearing.getFilingNumber(), Collections.emptyMap())
                            : Collections.emptyMap();
                    cacheService.hmset(hKey, buildHearingHashData(hearing, caseFields));
                }

                // Write ordered CAUSE_LIST
                cacheService.setList(causeListKey, hearingKeys);

                // Write COURT_META
                Map<String, Object> metaData = new LinkedHashMap<>();
                metaData.put("courtId", courtId);
                metaData.put("date", dateStr);
                metaData.put("sessionStatus", SESSION_STATUS_NOT_STARTED);
                metaData.put("currentHearingKey", "");
                cacheService.hmset(metaKey, metaData);
            }
            log.info("operation = loadOpenHearingsToCache, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = loadOpenHearingsToCache, result = FAILURE", e);
        }
    }

    private Map<String, Object> buildHearingHashData(OpenHearing hearing, Map<String, String> caseFields) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hearingNumber", hearing.getHearingNumber() != null ? hearing.getHearingNumber() : "");
        data.put("hearingUuid", hearing.getHearingUuid() != null ? hearing.getHearingUuid() : "");
        data.put("status", hearing.getStatus() != null ? hearing.getStatus() : "");
        data.put("statusOrder", hearing.getStatusOrder() != null ? hearing.getStatusOrder() : 99);
        data.put("caseNumber", hearing.getCaseNumber() != null ? hearing.getCaseNumber() : "");
        data.put("caseTitle", hearing.getCaseTitle() != null ? hearing.getCaseTitle() : "");
        data.put("hearingType", hearing.getHearingType() != null ? hearing.getHearingType() : "");
        data.put("stage", hearing.getStage() != null ? hearing.getStage() : "");
        data.put("secondaryStage", hearing.getSubStage() != null ? hearing.getSubStage() : "");
        data.put("filingNumber", hearing.getFilingNumber() != null ? hearing.getFilingNumber() : "");
        data.put("caseUuid", hearing.getCaseUuid() != null ? hearing.getCaseUuid() : "");
        data.put("serialNumber", hearing.getSerialNumber());
        data.put("fromDate", hearing.getFromDate() != null ? hearing.getFromDate() : 0L);
        data.put("toDate", hearing.getToDate() != null ? hearing.getToDate() : 0L);
        data.put("tenantId", hearing.getTenantId() != null ? hearing.getTenantId() : "");
        data.put("courtId", hearing.getCourtId() != null ? hearing.getCourtId() : "");
        data.put("hearingTypeOrder", hearing.getHearingTypeOrder() != null ? hearing.getHearingTypeOrder() : 99);
        data.put("cmpNumber", caseFields.getOrDefault("cmpNumber", ""));
        data.put("courtCaseNumber", caseFields.getOrDefault("courtCaseNumber", ""));
        data.put("lprNumber", caseFields.getOrDefault("lprNumber", ""));
        data.put("outcome", caseFields.getOrDefault("outcome", ""));
        data.put("accessCode", caseFields.getOrDefault("accessCode", ""));
        data.put("caseStatus", caseFields.getOrDefault("caseStatus", ""));
        try {
            data.put("advocate", objectMapper.writeValueAsString(hearing.getAdvocate()));
        } catch (Exception e) {
            data.put("advocate", "{}");
        }
        return data;
    }

    private Comparator<OpenHearing> hearingComparator() {
        return (h1, h2) -> {
            // 1. statusOrder ASC (IN_PROGRESS=1, SCHEDULED=2, COMPLETED=3)
            int s1 = h1.getStatusOrder() != null ? h1.getStatusOrder() : 99;
            int s2 = h2.getStatusOrder() != null ? h2.getStatusOrder() : 99;
            if (s1 != s2) return Integer.compare(s1, s2);

            // 2. case prefix order ASC (ST=1, CMP=2, LP=3, other=9)
            int p1 = getCasePrefixOrder(h1.getCaseNumber());
            int p2 = getCasePrefixOrder(h2.getCaseNumber());
            if (p1 != p2) return Integer.compare(p1, p2);

            // 3. case year ASC
            int y1 = getCaseYear(h1.getCaseNumber());
            int y2 = getCaseYear(h2.getCaseNumber());
            if (y1 != y2) return Integer.compare(y1, y2);

            // 4. case sequence ASC
            int seq1 = getCaseSequence(h1.getCaseNumber());
            int seq2 = getCaseSequence(h2.getCaseNumber());
            if (seq1 != seq2) return Integer.compare(seq1, seq2);

            // 5. caseFilingDate DESC
            long f1 = h1.getCaseFilingDate() != null ? h1.getCaseFilingDate() : 0L;
            long f2 = h2.getCaseFilingDate() != null ? h2.getCaseFilingDate() : 0L;
            if (f1 != f2) return Long.compare(f2, f1);

            // 6. hearingTypeOrder ASC
            int ht1 = h1.getHearingTypeOrder() != null ? h1.getHearingTypeOrder() : 99;
            int ht2 = h2.getHearingTypeOrder() != null ? h2.getHearingTypeOrder() : 99;
            return Integer.compare(ht1, ht2);
        };
    }

    private int getCasePrefixOrder(String caseNumber) {
        if (caseNumber == null) return 9;
        String prefix = caseNumber.split("/")[0].trim().toUpperCase();
        switch (prefix) {
            case "ST": return 1;
            case "CMP": return 2;
            case "LP": return 3;
            default: return 9;
        }
    }

    private int getCaseYear(String caseNumber) {
        if (caseNumber == null) return 9999;
        String[] parts = caseNumber.split("/");
        if (parts.length >= 3) {
            try { return Integer.parseInt(parts[2].trim()); }
            catch (NumberFormatException ignored) { return 9999; }
        }
        return 9999;
    }

    private int getCaseSequence(String caseNumber) {
        if (caseNumber == null) return Integer.MAX_VALUE;
        String[] parts = caseNumber.split("/");
        if (parts.length >= 2) {
            try { return Integer.parseInt(parts[1].trim()); }
            catch (NumberFormatException ignored) { return Integer.MAX_VALUE; }
        }
        return Integer.MAX_VALUE;
    }

    private Map<String, String> fetchCaseFields(String filingNumber) {
        try {
            CaseCriteria criteria = CaseCriteria.builder().filingNumber(filingNumber).build();
            SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                    .RequestInfo(createInternalRequestInfo())
                    .tenantId(config.getEgovStateTenantId())
                    .criteria(Collections.singletonList(criteria))
                    .flow(FLOW_JAC)
                    .build();

            JsonNode caseList = caseUtil.getCases(searchCaseRequest);
            if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
                JsonNode caseNode = caseList.get(0);
                Map<String, String> fields = new HashMap<>();
                fields.put("cmpNumber", getTextOrEmpty(caseNode, "cmpNumber"));
                fields.put("courtCaseNumber", getTextOrEmpty(caseNode, "courtCaseNumber"));
                fields.put("lprNumber", getTextOrEmpty(caseNode, "lprNumber"));
                fields.put("outcome", getTextOrEmpty(caseNode, "outcome"));
                fields.put("accessCode", getTextOrEmpty(caseNode, "accessCode"));
                fields.put("caseStatus", getTextOrEmpty(caseNode, "status"));
                return fields;
            }
        } catch (Exception e) {
            log.error("Error fetching case fields for filingNumber={}", filingNumber, e);
        }
        return Collections.emptyMap();
    }

    private String getTextOrEmpty(JsonNode node, String field) {
        JsonNode n = node.get(field);
        return n != null && !n.isNull() ? n.asText() : "";
    }

    public void clearOpenHearingsCache() {
        if (Boolean.FALSE.equals(config.getRedisEnabled())) {
            log.info("Redis cache is disabled. Skipping clearing open hearings.");
            return;
        }

        try {
            log.info("operation = clearOpenHearingsCache, result = IN_PROGRESS");
            String courtId = config.getCourtId();
            LocalDate today = LocalDate.now(ZoneId.of(config.getZoneId()));
            String dateStr = today.format(DateTimeFormatter.ofPattern(DATE_FORMAT_REDIS));
            String baseKey = CACHE_KEY_PREFIX + courtId + ":" + dateStr;
            String causeListKey = baseKey + CACHE_CAUSE_LIST_SUFFIX;
            String metaKey = baseKey + CACHE_COURT_META_SUFFIX;

            // Delete per-hearing hashes + associated case cache
            List<Object> hearingKeys = cacheService.lrange(causeListKey, 0, -1);
            RequestInfo requestInfo = createInternalRequestInfo();
            for (Object keyObj : hearingKeys) {
                String hKey = String.valueOf(keyObj);
                Object caseUuid = cacheService.hget(hKey, "caseUuid");
                if (caseUuid != null && !caseUuid.toString().isEmpty()) {
                    cacheService.deleteCache(getRedisKey(requestInfo, caseUuid.toString()));
                }
                cacheService.deleteCache(hKey);
            }

            cacheService.deleteCache(causeListKey);
            cacheService.deleteCache(metaKey);
            log.info("operation = clearOpenHearingsCache, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = clearOpenHearingsCache, result = FAILURE", e);
        }
    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.getRoles().add(Role.builder().code(serviceConstants.SYSTEM_ADMIN)
                .name(serviceConstants.SYSTEM_ADMIN)
                .tenantId(config.getEgovStateTenantId())
                .build());
        userInfo.setType(EMPLOYEE);
        userInfo.setTenantId(config.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

    private String getRedisKey(RequestInfo requestInfo, String caseId) {
        return requestInfo.getUserInfo().getTenantId() + ":" + caseId;
    }
}
