package org.pucar.dristi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.HearingRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.HearingRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validator.HearingRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.cases.CaseRequest;
import org.pucar.dristi.web.models.cases.CourtCase;
import org.pucar.dristi.web.models.cases.LifecycleStatus;
import org.pucar.dristi.web.models.inbox.InboxRequest;
import org.pucar.dristi.web.models.orders.*;
import org.pucar.dristi.web.models.orders.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class HearingService {

    private final HearingRegistrationValidator validator;
    private final HearingRegistrationEnrichment enrichmentUtil;
    private final WorkflowService workflowService;
    private final HearingRepository hearingRepository;
    private final Producer producer;
    private final Configuration config;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;
    private final IndividualService individualService;
    private final SmsNotificationService notificationService;
    private final MdmsUtil mdmsUtil;
    private final DateUtil dateUtil;
    private final SchedulerUtil schedulerUtil;
    private final FileStoreUtil fileStoreUtil;
    private final InboxUtil inboxUtil;
    private final JsonUtil jsonUtil;
    private final EsUtil esUtil;
    private final OrderUtil orderUtil;
    private final CacheService cacheService;
    private AsyncPersistenceService asyncPersistenceService;

    @Autowired
    public HearingService(
            HearingRegistrationValidator validator,
            HearingRegistrationEnrichment enrichmentUtil,
            WorkflowService workflowService,
            HearingRepository hearingRepository,
            Producer producer,
            Configuration config, CaseUtil caseUtil, ObjectMapper objectMapper, IndividualService individualService, SmsNotificationService notificationService, MdmsUtil mdmsUtil, DateUtil dateUtil, SchedulerUtil schedulerUtil, FileStoreUtil fileStoreUtil, InboxUtil inboxUtil, JsonUtil jsonUtil, EsUtil esUtil, OrderUtil orderUtil, CacheService cacheService) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.workflowService = workflowService;
        this.hearingRepository = hearingRepository;
        this.producer = producer;
        this.config = config;
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
        this.individualService = individualService;
        this.notificationService = notificationService;
        this.mdmsUtil = mdmsUtil;
        this.dateUtil = dateUtil;
        this.schedulerUtil = schedulerUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.inboxUtil = inboxUtil;
        this.jsonUtil = jsonUtil;
        this.esUtil = esUtil;
        this.orderUtil = orderUtil;
        this.cacheService = cacheService;
    }

    @Autowired
    public void setAsyncPersistenceService(@Lazy AsyncPersistenceService asyncPersistenceService) {
        this.asyncPersistenceService = asyncPersistenceService;
    }

    public Hearing createHearing(HearingRequest body) {
        try {

            // Validate applications
            validator.validateHearingRegistration(body);

            // Enrich applications
            enrichmentUtil.enrichHearingRegistration(body);

            // Initiate workflow for the new application-
            workflowService.updateWorkflowStatus(body);

            // Push the application to the topic for persister to listen and persist
            producer.push(config.getHearingCreateTopic(), body);

            // send the sms after creating hearing

            callNotificationService(body, body.getHearing().getStatus(), false);

            return body.getHearing();
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating hearing");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating hearing");
            throw new CustomException(HEARING_CREATE_EXCEPTION, e.getMessage());
        }
    }

    public List<Hearing> searchHearing(HearingSearchRequest request) {

        try {
            return hearingRepository.getHearings(request);
        } catch (CustomException e) {
            log.error("Custom Exception occurred while searching");
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching search results");
            throw new CustomException(HEARING_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    public Hearing updateHearing(HearingRequest hearingRequest) {

        try {
            String action = hearingRequest.getHearing() != null && hearingRequest.getHearing().getWorkflow() != null
                    ? hearingRequest.getHearing().getWorkflow().getAction() : null;

            if (action != null && isFastPathAction(action) && Boolean.TRUE.equals(config.getRedisEnabled())) {
                return updateHearingFastPath(hearingRequest, action);
            }

            // Validate whether the application that is being requested for update indeed exists
            Hearing hearing = validator.validateHearingExistence(hearingRequest.getRequestInfo(), hearingRequest.getHearing());

            // Updating Hearing request
            hearing.setWorkflow(hearingRequest.getHearing().getWorkflow());
            hearing.setStartTime(hearingRequest.getHearing().getStartTime());
            hearing.setEndTime(hearingRequest.getHearing().getEndTime());
            hearing.setTranscript(hearingRequest.getHearing().getTranscript());
            hearing.setNotes(hearingRequest.getHearing().getNotes());
            hearing.setAttendees(hearingRequest.getHearing().getAttendees());
            hearing.setDocuments(hearingRequest.getHearing().getDocuments());
            hearing.setAdditionalDetails(hearingRequest.getHearing().getAdditionalDetails());
            hearing.setVcLink(hearingRequest.getHearing().getVcLink());
            hearing.setCmpNumber(hearingRequest.getHearing().getCmpNumber() != null ? hearingRequest.getHearing().getCmpNumber() : hearing.getCmpNumber());
            hearing.setCourtCaseNumber(hearingRequest.getHearing().getCourtCaseNumber() != null ? hearingRequest.getHearing().getCourtCaseNumber() : hearing.getCourtCaseNumber());
            hearing.setCaseReferenceNumber(hearingRequest.getHearing().getCaseReferenceNumber() != null ? hearingRequest.getHearing().getCaseReferenceNumber() : hearing.getCaseReferenceNumber());
            String newHearingType = null;
            if(hearing.getWorkflow()!=null && (hearing.getWorkflow().getAction().equalsIgnoreCase(MARK_COMPLETE) || hearing.getWorkflow().getAction().equalsIgnoreCase(UPDATE_DATE)|| hearing.getWorkflow().getAction().equalsIgnoreCase(RESCHEDULE_ONGOING))){
                newHearingType = hearingRequest.getHearing().getHearingType();
                hearing.setHearingType(newHearingType);
            }
            hearingRequest.setHearing(hearing);

            // Enrich application upon update
            enrichmentUtil.enrichHearingApplicationUponUpdate(hearingRequest);

            deleteFileStoreDocumentsIfInactive(hearingRequest.getHearing());


            if (hearing.getWorkflow() != null) {
                workflowService.updateWorkflowStatus(hearingRequest);
                // update status entry in es, if this will break need to handle other so that process should complete
                updateOpenHearingStatus(hearingRequest);
            }

            producer.push(config.getHearingUpdateTopic(), hearingRequest);

            String updatedState = hearingRequest.getHearing().getStatus();
            callNotificationService(hearingRequest, updatedState, false);

            filterDocuments(new ArrayList<>() {{
                                add(hearing);
                            }},
                    Hearing::getDocuments,
                    Hearing::setDocuments);

            return hearingRequest.getHearing();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating hearing");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating hearing");
            throw new CustomException(HEARING_UPDATE_EXCEPTION, "Error occurred while updating hearing: " + e.getMessage());
        }

    }

    private boolean isFastPathAction(String action) {
        return action.equalsIgnoreCase(START) || action.equalsIgnoreCase(CLOSE)
                || action.equalsIgnoreCase(PASS_OVER) || action.equalsIgnoreCase(MARK_COMPLETE);
    }

    private String resolveStatus(String action) {
        if (action.equalsIgnoreCase(START)) return IN_PROGRESS;
        if (action.equalsIgnoreCase(CLOSE)) return COMPLETED;
        if (action.equalsIgnoreCase(MARK_COMPLETE)) return COMPLETED;
        if (action.equalsIgnoreCase(PASS_OVER)) return PASSED_OVER;
        return SCHEDULED;
    }

    private int resolveStatusOrder(String status) {
        if (IN_PROGRESS.equals(status)) return 1;
        if (PASSED_OVER.equals(status) || SCHEDULED.equals(status)) return 2;
        if (COMPLETED.equals(status)) return 3;
        return 99;
    }

    private Hearing updateHearingFastPath(HearingRequest hearingRequest, String action) {
        // Validate existence before any cache write to prevent orphaned entries for invalid hearingIds.
        Hearing dbHearing = validator.validateHearingExistence(
                hearingRequest.getRequestInfo(), hearingRequest.getHearing());

        String hearingId = dbHearing.getHearingId();
        String newStatus = resolveStatus(action);
        int newStatusOrder = resolveStatusOrder(newStatus);

        String courtId = config.getCourtId();
        // Derive the cache-key date from the hearing's own startTime so the key is correct
        // when the hearing's scheduled date differs from the current system date.
        String date = (dbHearing.getStartTime() != null)
                ? dateUtil.getLocalDateFromEpoch(dbHearing.getStartTime())
                          .format(DateTimeFormatter.ofPattern(DATE_FORMAT_REDIS))
                : dateUtil.getCurrentDate();
        String hKey = CACHE_KEY_PREFIX + courtId + ":" + date + CACHE_HEARING_PREFIX + hearingId;
        String metaKey = CACHE_KEY_PREFIX + courtId + ":" + date + CACHE_COURT_META_SUFFIX;

        Map<String, Object> statusUpdate = new HashMap<>();
        statusUpdate.put("status", newStatus);
        statusUpdate.put("statusOrder", newStatusOrder);
        cacheService.hmset(hKey, statusUpdate);

        if (IN_PROGRESS.equals(newStatus)) {
            cacheService.hset(metaKey, "sessionStatus", SESSION_STATUS_ACTIVE);
            cacheService.hset(metaKey, "currentHearingKey", hKey);
        } else {
            cacheService.hset(metaKey, "currentHearingKey", "");
            if (CLOSE.equalsIgnoreCase(action)) {
                advanceToNextScheduledHearing(courtId, date, metaKey, hearingRequest);
            }
        }

        asyncPersistenceService.persistStatusChange(hearingRequest);

        Hearing hearing = hearingRequest.getHearing();
        hearing.setStatus(newStatus);
        return hearing;
    }

    private void advanceToNextScheduledHearing(String courtId, String date, String metaKey, HearingRequest originalRequest) {
        String causeListKey = CACHE_KEY_PREFIX + courtId + ":" + date + CACHE_CAUSE_LIST_SUFFIX;
        List<Object> hearingKeys = cacheService.lrange(causeListKey, 0, -1);
        for (Object keyObj : hearingKeys) {
            String nextKey = String.valueOf(keyObj);
            if (!SCHEDULED.equals(cacheService.hget(nextKey, "status"))) {
                continue;
            }

            // Acquire a short-TTL distributed lock to guard the compare-and-set
            // against concurrent CLOSE actions racing to advance the same hearing.
            String lockKey = nextKey + ":ADVANCE_LOCK";
            if (!cacheService.tryLock(lockKey, 10)) {
                // Another actor is advancing this hearing concurrently; nothing left to do.
                log.info("auto-advance: lock contention on hearingKey={}, concurrent actor is handling it", nextKey);
                break;
            }
            try {
                // Re-read inside the critical section to confirm status hasn't changed.
                if (!SCHEDULED.equals(cacheService.hget(nextKey, "status"))) {
                    break; // Concurrent actor already advanced it
                }
                Object hearingNumObj = cacheService.hget(nextKey, "hearingNumber");
                if (hearingNumObj == null || hearingNumObj.toString().isEmpty()) {
                    log.warn("auto-advance: hearingNumber missing in cache hash for key={}, aborting advance", nextKey);
                    break;
                }
                String nextHearingId = hearingNumObj.toString();

                Map<String, Object> nextUpdate = new HashMap<>();
                nextUpdate.put("status", IN_PROGRESS);
                nextUpdate.put("statusOrder", resolveStatusOrder(IN_PROGRESS));
                cacheService.hmset(nextKey, nextUpdate);
                cacheService.hset(metaKey, "sessionStatus", SESSION_STATUS_ACTIVE);
                cacheService.hset(metaKey, "currentHearingKey", nextKey);

                Object tenantObj = cacheService.hget(nextKey, "tenantId");
                String tenantId = (tenantObj != null && !"null".equals(tenantObj.toString()) && !tenantObj.toString().isEmpty())
                        ? tenantObj.toString() : config.getTenantId();
                HearingRequest nextRequest = buildMinimalHearingRequest(nextHearingId, tenantId, START, originalRequest.getRequestInfo());
                asyncPersistenceService.persistStatusChange(nextRequest);
                log.info("Auto-advanced to next hearing hearingId={}", nextHearingId);
            } finally {
                cacheService.releaseLock(lockKey);
            }
            break; // Reached only on successful advance; exits the search loop
        }
    }

    private HearingRequest buildMinimalHearingRequest(String hearingId, String tenantId, String action, RequestInfo requestInfo) {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(action);
        Hearing hearing = Hearing.builder()
                .hearingId(hearingId)
                .tenantId(tenantId)
                .workflow(workflow)
                .build();
        return HearingRequest.builder()
                .requestInfo(requestInfo)
                .hearing(hearing)
                .build();
    }

    // Package-private: called by AsyncPersistenceService in the background thread.
    void performPersistStatusChange(HearingRequest hearingRequest) {
        try {
            Hearing hearing = validator.validateHearingExistence(hearingRequest.getRequestInfo(), hearingRequest.getHearing());
            hearing.setWorkflow(hearingRequest.getHearing().getWorkflow());
            if (hearing.getWorkflow() != null && (hearing.getWorkflow().getAction().equalsIgnoreCase(MARK_COMPLETE)
                    || hearing.getWorkflow().getAction().equalsIgnoreCase(UPDATE_DATE)
                    || hearing.getWorkflow().getAction().equalsIgnoreCase(RESCHEDULE_ONGOING))) {
                String newHearingType = hearingRequest.getHearing().getHearingType();
                hearing.setHearingType(newHearingType);
            }
            // Preserve a rescheduled date supplied on the request (e.g. MARK_COMPLETE moving a future
            // hearing to today). The normal updateHearing path copies these from the request; the fast
            // path must do the same, else the existing (stale) startTime/endTime are persisted unchanged.
            // Guard against null so minimal status-only requests (START/CLOSE/PASS_OVER auto-advance) don't wipe them.
            if (hearingRequest.getHearing().getStartTime() != null) {
                hearing.setStartTime(hearingRequest.getHearing().getStartTime());
            }
            if (hearingRequest.getHearing().getEndTime() != null) {
                hearing.setEndTime(hearingRequest.getHearing().getEndTime());
            }
            hearingRequest.setHearing(hearing);

            enrichmentUtil.enrichHearingApplicationUponUpdate(hearingRequest);

            if (hearing.getWorkflow() != null) {
                workflowService.updateWorkflowStatus(hearingRequest);
                updateOpenHearingStatus(hearingRequest);
            }

            producer.push(config.getHearingUpdateTopic(), hearingRequest);

            String updatedState = hearingRequest.getHearing().getStatus();
            callNotificationService(hearingRequest, updatedState, false);
        } catch (Exception e) {
            log.error("performPersistStatusChange failed for hearingId={}",
                    hearingRequest.getHearing() != null ? hearingRequest.getHearing().getHearingId() : "unknown", e);
            throw e;
        }
    }

    private void updateOpenHearingStatus(HearingRequest hearingRequest) {

        // search for open hearing
        try {
            String tenantId = hearingRequest.getHearing().getTenantId();
            RequestInfo requestInfo = hearingRequest.getRequestInfo();
            String hearingNumber = hearingRequest.getHearing().getHearingId();
            InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(tenantId, requestInfo, hearingNumber);
            List<OpenHearing> openHearings = inboxUtil.getOpenHearings(inboxRequest);

            if (!(openHearings == null || openHearings.isEmpty())) {
                OpenHearing openHearing = openHearings.get(0);
                String status = hearingRequest.getHearing().getStatus();
                openHearing.setStatus(status);
                openHearing.setHearingType(hearingRequest.getHearing().getHearingType());
                enrichStatusOrderInOpenHearing(requestInfo, openHearing);

                try {
                    String request = esUtil.buildPayload(openHearing);
                    String uri = config.getEsHostUrl() + config.getBulkPath();
                    esUtil.manualIndex(uri, request);
                    updateStatusInCache(openHearing);
                } catch (Exception e) {
                    log.error("Error occurred while updating open hearing status in es");
                    log.error("ERROR_FROM_ES: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Something went wrong while updating status of open hearing with hearing number {}", hearingRequest.getHearing().getHearingId());
            log.error("ERROR: {}", e.getMessage());
        }


    }

    private void updateStatusInCache(OpenHearing openHearing) {
        if (!config.getRedisEnabled()) {
            log.info("Redis is disabled. Skipping cache update for open hearing: {}", openHearing.getHearingNumber());
            return;
        }

        String courtId = openHearing.getCourtId();
        String date = dateUtil.getCurrentDate();
        String hKey = CACHE_KEY_PREFIX + courtId + ":" + date + CACHE_HEARING_PREFIX + openHearing.getHearingNumber();

        // Only update if the HEARING hash already exists (written by scheduler-svc at 10AM)
        Object existing = cacheService.hget(hKey, "hearingNumber");
        if (existing != null) {
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("status", openHearing.getStatus() != null ? openHearing.getStatus() : "");
            if (openHearing.getStatusOrder() != null) {
                statusUpdate.put("statusOrder", openHearing.getStatusOrder());
            }
            if (openHearing.getHearingType() != null) {
                statusUpdate.put("hearingType", openHearing.getHearingType());
            }
            cacheService.hmset(hKey, statusUpdate);
        }
    }

    private void enrichStatusOrderInOpenHearing(RequestInfo requestInfo, OpenHearing openHearing) {

        Map<String, Map<String, JSONArray>> hearingStatusData =
                mdmsUtil.fetchMdmsData(requestInfo, openHearing.getTenantId(),
                        HEARING_MODULE_NAME,
                        Collections.singletonList(HEARING_STATUS_MASTER_NAME));
        JSONArray hearingStatusJsonArray = hearingStatusData.get(HEARING_MODULE_NAME).get(HEARING_STATUS_MASTER_NAME);

        for (Object hearingStatusObject : hearingStatusJsonArray) {

            String status = jsonUtil.getNestedValue(hearingStatusObject, List.of("status"), String.class);
            if (openHearing.getStatus().equalsIgnoreCase(status)) {
                Integer priority = jsonUtil.getNestedValue(hearingStatusObject, List.of("priority"), Integer.class);
                openHearing.setStatusOrder(priority);
                break;
            }
        }
    }

    private <T> void filterDocuments(List<T> entities,
                                     Function<T, List<Document>> getDocs,
                                     BiConsumer<T, List<Document>> setDocs) {
        if (entities == null) return;

        for (T entity : entities) {
            List<Document> docs = getDocs.apply(entity);
            if (docs != null) {
                List<Document> activeDocs = docs.stream()
                        .filter(Document::getIsActive)
                        .collect(Collectors.toList());
                setDocs.accept(entity, activeDocs); // ✅ set it back
            }
        }
    }

    private void deleteFileStoreDocumentsIfInactive(Hearing hearing) {

        if (hearing.getDocuments() != null) {
            List<String> fileStoreIds = new ArrayList<>();
            for (Document document : hearing.getDocuments()) {
                if (!document.getIsActive()) {
                    fileStoreIds.add(document.getFileStore());
                }
            }
            if (!fileStoreIds.isEmpty()) {
                fileStoreUtil.deleteFilesByFileStore(fileStoreIds, hearing.getTenantId());
                log.info("Deleted files from file store with ids: {}", fileStoreIds);
            }
        }
    }

    public CauseListResult getCauseList(String courtId, String date, int offset, int limit, String status, String hearingType, String searchableFields) {
        long t0 = System.currentTimeMillis();
        LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String dateStr = localDate.format(DateTimeFormatter.ofPattern(DATE_FORMAT_REDIS));
        String baseKey = CACHE_KEY_PREFIX + courtId + ":" + dateStr;
        String causeListKey = baseKey + CACHE_CAUSE_LIST_SUFFIX;

        long t1 = System.currentTimeMillis();
        List<Map<String, Object>> allHearings = cacheService.lrangeAndHGetAll(causeListKey, true);
        long t2 = System.currentTimeMillis();
        log.info("[PERF] getCauseList: redisLua={}ms hearings={}", t2 - t1, allHearings.size());

        if (!allHearings.isEmpty()) {
            boolean partialMiss = allHearings.stream().anyMatch(Map::isEmpty);
            if (!partialMiss) {
                List<Map<String, Object>> filtered = applyFilters(allHearings, status, hearingType, searchableFields);
                int totalCount = filtered.size();
                int fromIdx = Math.min(offset, filtered.size());
                int toIdx = Math.min(offset + limit, filtered.size());
                log.info("[PERF] getCauseList: cacheHit total={}ms", System.currentTimeMillis() - t0);
                return new CauseListResult(new ArrayList<>(filtered.subList(fromIdx, toIdx)), totalCount);
            }
            log.warn("Cache partial-read: causeListKey={} had {} entries with misses — falling back to ES", causeListKey, allHearings.size());
        }

        log.info("[PERF] getCauseList: cacheMiss redisMs={} — falling back to ES", t2 - t1);
        CauseListResult result = getCauseListFromES(courtId, localDate, offset, limit, status, hearingType, searchableFields);
        log.info("[PERF] getCauseList: esFallback={}ms total={}ms", System.currentTimeMillis() - t2, System.currentTimeMillis() - t0);
        return result;
    }

    private CauseListResult getCauseListFromES(String courtId, LocalDate date, int offset, int limit,
                                               String status, String hearingType, String searchableFields) {
        try {
            Long fromDateEpoch = dateUtil.getEPochFromLocalDate(date);
            Long toDateEpoch = dateUtil.getEpochFromLocalDateTime(date.atTime(23, 59, 59));
            InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(courtId, fromDateEpoch, toDateEpoch, offset, limit);
            Map<String, Object> criteria = inboxRequest.getInbox().getModuleSearchCriteria();
            if (status != null && !status.isEmpty()) criteria.put("status", status);
            if (hearingType != null && !hearingType.isEmpty()) criteria.put("hearingType", hearingType);
            if (searchableFields != null && !searchableFields.isEmpty()) criteria.put("searchableFields", searchableFields);

            List<OpenHearing> openHearings = inboxUtil.getOpenHearings(inboxRequest);
            if (openHearings == null || openHearings.isEmpty()) return new CauseListResult(Collections.emptyList(), 0);

            List<Map<String, Object>> result = new ArrayList<>(openHearings.size());
            for (OpenHearing h : openHearings) {
                result.add(toHearingMap(h));
            }
            return new CauseListResult(result, result.size());
        } catch (Exception e) {
            log.error("ES fallback failed for cause-list courtId={}, date={}", courtId, date, e);
            return new CauseListResult(Collections.emptyList(), 0);
        }
    }

    private Map<String, Object> toHearingMap(OpenHearing h) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("hearingNumber", h.getHearingNumber() != null ? h.getHearingNumber() : "");
        map.put("hearingUuid", h.getHearingUuid() != null ? h.getHearingUuid() : "");
        map.put("status", h.getStatus() != null ? h.getStatus() : "");
        map.put("statusOrder", h.getStatusOrder() != null ? h.getStatusOrder() : 99);
        map.put("caseNumber", h.getCaseNumber() != null ? h.getCaseNumber() : "");
        map.put("caseTitle", h.getCaseTitle() != null ? h.getCaseTitle() : "");
        map.put("hearingType", h.getHearingType() != null ? h.getHearingType() : "");
        map.put("stage", h.getStage() != null ? h.getStage() : "");
        map.put("filingNumber", h.getFilingNumber() != null ? h.getFilingNumber() : "");
        map.put("caseUuid", h.getCaseUuid() != null ? h.getCaseUuid() : "");
        map.put("serialNumber", h.getSerialNumber());
        map.put("fromDate", h.getFromDate() != null ? h.getFromDate() : 0L);
        map.put("toDate", h.getToDate() != null ? h.getToDate() : 0L);
        map.put("tenantId", h.getTenantId() != null ? h.getTenantId() : "");
        map.put("courtId", h.getCourtId() != null ? h.getCourtId() : "");
        map.put("hearingTypeOrder", h.getHearingTypeOrder() != null ? h.getHearingTypeOrder() : 99);
        try {
            map.put("advocate", objectMapper.writeValueAsString(h.getAdvocate()));
        } catch (Exception ex) {
            map.put("advocate", "{}");
        }
        return map;
    }

    private static List<Map<String, Object>> applyFilters(List<Map<String, Object>> hearings, String status, String hearingType, String searchableFields) {
        boolean hasStatus = status != null && !status.isEmpty();
        boolean hasHearingType = hearingType != null && !hearingType.isEmpty();
        boolean hasSearch = searchableFields != null && !searchableFields.isEmpty();
        if (!hasStatus && !hasHearingType && !hasSearch) {
            return hearings;
        }
        String lowerSearch = hasSearch ? searchableFields.toLowerCase() : null;
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> h : hearings) {
            if (hasStatus && !status.equalsIgnoreCase(String.valueOf(h.getOrDefault("status", "")))) continue;
            if (hasHearingType && !hearingType.equalsIgnoreCase(String.valueOf(h.getOrDefault("hearingType", "")))) continue;
            if (hasSearch) {
                boolean found = false;
                for (String field : new String[]{"caseNumber", "caseTitle", "filingNumber", "hearingNumber"}) {
                    if (String.valueOf(h.getOrDefault(field, "")).toLowerCase().contains(lowerSearch)) {
                        found = true;
                        break;
                    }
                }
                if (!found) continue;
            }
            result.add(h);
        }
        return result;
    }


    public CurrentHearingData getCurrentHearing(String courtId, String currentHearingNumber, RequestInfo requestInfo) {
        long t0 = System.currentTimeMillis();
        String date = dateUtil.getCurrentDate();
        String baseKey = CACHE_KEY_PREFIX + courtId + ":" + date;
        String metaKey = baseKey + CACHE_COURT_META_SUFFIX;
        String causeListKey = baseKey + CACHE_CAUSE_LIST_SUFFIX;

        if (currentHearingNumber != null && !currentHearingNumber.isEmpty()) {
            long t1 = System.currentTimeMillis();
            List<Map<String, Object>> currentAndNext = cacheService.findCurrentAndNextHearing(causeListKey, currentHearingNumber);
            long t2 = System.currentTimeMillis();
            log.info("[PERF] getCurrentHearing path=1 redisLua={}ms hit={}", t2 - t1, !currentAndNext.isEmpty() && !currentAndNext.get(0).isEmpty());

            if (currentAndNext.isEmpty() || currentAndNext.get(0).isEmpty()) {
                log.warn("Cache miss: causeList empty for courtId={}, falling back to inbox service", courtId);
                Map<String, Object> currentData = getHearingDataFromInbox(courtId, currentHearingNumber, requestInfo);
                Map<String, Object> nextData = getNextHearingDataFromInbox(courtId, currentHearingNumber, requestInfo);
                log.info("[PERF] getCurrentHearing path=1 inboxFallback={}ms total={}ms", System.currentTimeMillis() - t2, System.currentTimeMillis() - t0);
                return new CurrentHearingData(SESSION_STATUS_ACTIVE, "", currentData, nextData);
            }
            Map<String, Object> currentHearingData = currentAndNext.get(0);
            parseSecondaryStageInMap(currentHearingData);
            Map<String, Object> nextData = currentAndNext.size() > 1 ? currentAndNext.get(1) : Collections.emptyMap();
            String nextKey = "";
            if (!nextData.isEmpty()) {
                parseSecondaryStageInMap(nextData);
                nextKey = baseKey + CACHE_HEARING_PREFIX + String.valueOf(nextData.getOrDefault("hearingNumber", ""));
            }
            log.info("[PERF] getCurrentHearing path=1 cacheHit total={}ms", System.currentTimeMillis() - t0);
            return new CurrentHearingData(SESSION_STATUS_ACTIVE, nextKey, currentHearingData, nextData);
        }

        long t1 = System.currentTimeMillis();
        List<Map<String, Object>> metaAndHearing = cacheService.getMetaAndCurrentHearing(metaKey);
        long t2 = System.currentTimeMillis();
        log.info("[PERF] getCurrentHearing path=2 redisLua={}ms hit={}", t2 - t1, !metaAndHearing.isEmpty() && !metaAndHearing.get(0).isEmpty());

        if (metaAndHearing.isEmpty() || metaAndHearing.get(0).isEmpty()) {
            log.warn("Cache miss: courtMeta empty for courtId={}, falling back to inbox service", courtId);
            CurrentHearingData result = getActiveHearingFromInbox(courtId, requestInfo);
            log.info("[PERF] getCurrentHearing path=2 inboxFallback={}ms total={}ms", System.currentTimeMillis() - t2, System.currentTimeMillis() - t0);
            return result;
        }
        Map<String, Object> meta = metaAndHearing.get(0);
        String sessionStatus = String.valueOf(meta.getOrDefault("sessionStatus", SESSION_STATUS_NOT_STARTED));
        String currentHearingKey = String.valueOf(meta.getOrDefault("currentHearingKey", ""));
        Map<String, Object> hearingData = Collections.emptyMap();
        if (currentHearingKey != null && !currentHearingKey.isEmpty()) {
            hearingData = metaAndHearing.size() > 1 ? metaAndHearing.get(1) : Collections.emptyMap();
            if (hearingData.isEmpty()) {
                log.warn("Cache miss: hearing data empty for key={}, falling back to inbox service", currentHearingKey);
                String hearingNumber = extractHearingIdFromKey(currentHearingKey);
                long t3 = System.currentTimeMillis();
                hearingData = getHearingDataFromInbox(courtId, hearingNumber, requestInfo);
                log.info("[PERF] getCurrentHearing path=2 inboxFallbackHearing={}ms total={}ms", System.currentTimeMillis() - t3, System.currentTimeMillis() - t0);
            } else {
                parseSecondaryStageInMap(hearingData);
            }
        }
        log.info("[PERF] getCurrentHearing path=2 cacheHit total={}ms", System.currentTimeMillis() - t0);
        return new CurrentHearingData(sessionStatus, currentHearingKey, hearingData, null);
    }

    private Map<String, Object> getNextHearingDataFromInbox(String courtId, String currentHearingNumber, RequestInfo requestInfo) {
        List<OpenHearing> hearings = getTodayHearingsFromInbox(courtId);
        boolean foundCurrent = false;
        for (OpenHearing h : hearings) {
            if (!foundCurrent) {
                if (currentHearingNumber.equals(h.getHearingNumber())) foundCurrent = true;
                continue;
            }
            return buildHearingDataMapFromOpenHearing(h, requestInfo);
        }
        return Collections.emptyMap();
    }

    private CurrentHearingData getActiveHearingFromInbox(String courtId, RequestInfo requestInfo) {
        List<OpenHearing> hearings = getTodayHearingsFromInbox(courtId);
        OpenHearing active = hearings.stream()
                .filter(h -> IN_PROGRESS.equals(h.getStatus()))
                .findFirst()
                .orElse(null);
        if (active != null) {
            return new CurrentHearingData(SESSION_STATUS_ACTIVE, "", buildHearingDataMapFromOpenHearing(active, requestInfo), null);
        }
        return new CurrentHearingData(SESSION_STATUS_NOT_STARTED, "", Collections.emptyMap(), null);
    }

    private Map<String, Object> getHearingDataFromInbox(String courtId, String hearingNumber, RequestInfo requestInfo) {
        if (hearingNumber == null || hearingNumber.isEmpty()) return Collections.emptyMap();
        return getTodayHearingsFromInbox(courtId).stream()
                .filter(h -> hearingNumber.equals(h.getHearingNumber()))
                .findFirst()
                .map(h -> buildHearingDataMapFromOpenHearing(h, requestInfo))
                .orElse(Collections.emptyMap());
    }

    private List<OpenHearing> getTodayHearingsFromInbox(String courtId) {
        try {
            LocalDate today = dateUtil.getLocalDateFromEpoch(System.currentTimeMillis());
            Long fromDate = dateUtil.getEPochFromLocalDate(today);
            Long toDate = dateUtil.getEpochFromLocalDateTime(today.atTime(23, 59, 59));
            InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(courtId, fromDate, toDate, 0, 500);
            List<OpenHearing> hearings = inboxUtil.getOpenHearings(inboxRequest);
            if (hearings == null) return Collections.emptyList();
            hearings.sort(Comparator.comparingLong(h -> h.getFromDate() != null ? h.getFromDate() : Long.MAX_VALUE));
            return hearings;
        } catch (Exception e) {
            log.error("Inbox fallback: error fetching today's hearings for courtId={}", courtId, e);
            return Collections.emptyList();
        }
    }

    private Map<String, Object> buildHearingDataMapFromOpenHearing(OpenHearing h, RequestInfo requestInfo) {
        Map<String, String> caseFields = h.getFilingNumber() != null
                ? fetchCaseFields(h.getFilingNumber(), requestInfo) : Collections.emptyMap();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hearingNumber", h.getHearingNumber() != null ? h.getHearingNumber() : "");
        data.put("hearingUuid", h.getHearingUuid() != null ? h.getHearingUuid() : "");
        data.put("status", h.getStatus() != null ? h.getStatus() : "");
        data.put("filingNumber", h.getFilingNumber() != null ? h.getFilingNumber() : "");
        data.put("caseUuid", h.getCaseUuid() != null ? h.getCaseUuid() : "");
        data.put("fromDate", h.getFromDate() != null ? h.getFromDate() : 0L);
        data.put("toDate", h.getToDate() != null ? h.getToDate() : 0L);
        data.put("tenantId", h.getTenantId() != null ? h.getTenantId() : "");
        data.put("hearingType", h.getHearingType() != null ? h.getHearingType() : "");
        data.put("caseNumber", h.getCaseNumber() != null ? h.getCaseNumber() : "");
        data.put("caseTitle", h.getCaseTitle() != null ? h.getCaseTitle() : "");
        data.put("courtId", h.getCourtId() != null ? h.getCourtId() : "");
        data.put("serialNumber", h.getSerialNumber());
        data.put("stage", h.getStage() != null ? h.getStage() : "");
        data.put("secondaryStage", parseJsonArray(caseFields.getOrDefault("secondaryStage", "[]")));
        data.put("cmpNumber", caseFields.getOrDefault("cmpNumber", ""));
        data.put("courtCaseNumber", caseFields.getOrDefault("courtCaseNumber", ""));
        data.put("lprNumber", caseFields.getOrDefault("lprNumber", ""));
        data.put("outcome", caseFields.getOrDefault("outcome", ""));
        data.put("accessCode", caseFields.getOrDefault("accessCode", ""));
        data.put("caseStatus", caseFields.getOrDefault("caseStatus", ""));
        return data;
    }

    private Map<String, String> fetchCaseFields(String filingNumber, RequestInfo requestInfo) {
        try {
            CaseSearchRequest req = new CaseSearchRequest();
            req.setRequestInfo(requestInfo);
            req.addCriteriaItem(CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build());
            JsonNode caseNode = caseUtil.searchCaseDetails(req);
            if (caseNode != null) {
                Map<String, String> fields = new HashMap<>();
                fields.put("cmpNumber", getTextOrEmpty(caseNode, "cmpNumber"));
                fields.put("courtCaseNumber", getTextOrEmpty(caseNode, "courtCaseNumber"));
                fields.put("lprNumber", getTextOrEmpty(caseNode, "lprNumber"));
                fields.put("outcome", getTextOrEmpty(caseNode, "outcome"));
                fields.put("accessCode", getTextOrEmpty(caseNode, "accessCode"));
                fields.put("caseStatus", getTextOrEmpty(caseNode, "status"));
                fields.put("secondaryStage", getArrayAsJson(caseNode, "secondaryStage"));
                return fields;
            }
        } catch (Exception e) {
            log.warn("Fallback: failed to fetch case fields for filingNumber={}", filingNumber, e);
        }
        return Collections.emptyMap();
    }

    private String getTextOrEmpty(JsonNode node, String field) {
        JsonNode n = node.get(field);
        return n != null && !n.isNull() ? n.asText() : "";
    }

    private String getArrayAsJson(JsonNode node, String field) {
        JsonNode n = node.get(field);
        if (n != null && n.isArray()) {
            try {
                return objectMapper.writeValueAsString(n);
            } catch (Exception e) {
                log.warn("Failed to serialize array field={}", field, e);
            }
        }
        return "[]";
    }

    private List<String> parseJsonArray(String json) {
        try {
            if (json == null || json.isEmpty() || "[]".equals(json)) return Collections.emptyList();
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse JSON array: {}", json, e);
            return Collections.emptyList();
        }
    }

    private void parseSecondaryStageInMap(Map<String, Object> data) {
        Object val = data.get("secondaryStage");
        if (val instanceof String) {
            data.put("secondaryStage", parseJsonArray((String) val));
        }
    }

    private CurrentHearingData getNextHearingFromDb(String courtId, String currentHearingNumber) {
        List<Hearing> hearings = getTodayHearingsFromDb(courtId);
        boolean foundCurrent = false;
        for (Hearing h : hearings) {
            if (!foundCurrent) {
                if (currentHearingNumber.equals(h.getHearingId())) foundCurrent = true;
                continue;
            }
            String status = h.getStatus();
            if (!"COMPLETED".equals(status) && !"ABATED".equals(status) && !"OPT_OUT".equals(status)) {
                return new CurrentHearingData(SESSION_STATUS_ACTIVE, "", buildHearingDataMap(h), null);
            }
        }
        return new CurrentHearingData(SESSION_STATUS_ACTIVE, "", Collections.emptyMap(), null);
    }

    private CurrentHearingData getActiveHearingFromDb(String courtId) {
        List<Hearing> hearings = getTodayHearingsFromDb(courtId);
        Hearing active = hearings.stream()
                .filter(h -> IN_PROGRESS.equals(h.getStatus()))
                .findFirst()
                .orElse(null);
        if (active != null) {
            return new CurrentHearingData(SESSION_STATUS_ACTIVE, "", buildHearingDataMap(active), null);
        }
        return new CurrentHearingData(SESSION_STATUS_NOT_STARTED, "", Collections.emptyMap(), null);
    }

    private List<Hearing> getTodayHearingsFromDb(String courtId) {
        try {
            LocalDate today = dateUtil.getLocalDateFromEpoch(System.currentTimeMillis());
            Long fromDate = dateUtil.getEPochFromLocalDate(today);
            Long toDate = dateUtil.getEpochFromLocalDateTime(today.atTime(23, 59, 59));
            HearingCriteria criteria = HearingCriteria.builder()
                    .courtId(courtId)
                    .fromDate(fromDate)
                    .toDate(toDate)
                    .build();
            HearingSearchRequest request = HearingSearchRequest.builder().criteria(criteria).build();
            List<Hearing> hearings = new ArrayList<>(hearingRepository.getHearings(request));
            hearings.sort(Comparator.comparingLong(h -> h.getStartTime() != null ? h.getStartTime() : Long.MAX_VALUE));
            return hearings;
        } catch (Exception e) {
            log.error("DB fallback: error fetching today's hearings for courtId={}", courtId, e);
            return Collections.emptyList();
        }
    }

    private Map<String, Object> getSingleHearingDataFromDb(String hearingId) {
        if (hearingId == null || hearingId.isEmpty()) return Collections.emptyMap();
        try {
            HearingCriteria criteria = HearingCriteria.builder().hearingId(hearingId).build();
            HearingSearchRequest request = HearingSearchRequest.builder().criteria(criteria).build();
            List<Hearing> hearings = hearingRepository.getHearings(request);
            return hearings.isEmpty() ? Collections.emptyMap() : buildHearingDataMap(hearings.get(0));
        } catch (Exception e) {
            log.error("DB fallback: error fetching hearing for hearingId={}", hearingId, e);
            return Collections.emptyMap();
        }
    }

    private String extractHearingIdFromKey(String key) {
        int idx = key.lastIndexOf(CACHE_HEARING_PREFIX);
        return idx >= 0 ? key.substring(idx + CACHE_HEARING_PREFIX.length()) : "";
    }

    private Map<String, Object> buildHearingDataMap(Hearing hearing) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hearingNumber", hearing.getHearingId() != null ? hearing.getHearingId() : "");
        data.put("hearingUuid", hearing.getId() != null ? hearing.getId().toString() : "");
        data.put("status", hearing.getStatus() != null ? hearing.getStatus() : "");
        data.put("filingNumber", hearing.getFilingNumber() != null && !hearing.getFilingNumber().isEmpty()
                ? hearing.getFilingNumber().get(0) : "");
        data.put("caseUuid", "");
        data.put("fromDate", hearing.getStartTime() != null ? hearing.getStartTime() : 0L);
        data.put("toDate", hearing.getEndTime() != null ? hearing.getEndTime() : 0L);
        data.put("tenantId", hearing.getTenantId() != null ? hearing.getTenantId() : "");
        data.put("hearingType", hearing.getHearingType() != null ? hearing.getHearingType() : "");
        return data;
    }


    public HearingExists isHearingExist(HearingExistsRequest body) {
        try {
            HearingExists order = body.getOrder();
            HearingCriteria criteria = HearingCriteria.builder().cnrNumber(order.getCnrNumber())
                    .filingNumber(order.getFilingNumber()).applicationNumber(order.getApplicationNumber()).hearingId(order.getHearingId()).tenantId(body.getRequestInfo().getUserInfo().getTenantId()).build();
            Pagination pagination = Pagination.builder().limit(1.0).offSet((double) 0).build();
            HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder().criteria(criteria).pagination(pagination).build();
            List<Hearing> hearingList = hearingRepository.getHearings(hearingSearchRequest);
            order.setExists(!hearingList.isEmpty());
            return order;
        } catch (CustomException e) {
            log.error("Custom Exception occurred while verifying hearing");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while verifying hearing");
            throw new CustomException(HEARING_SEARCH_EXCEPTION, "Error occurred while searching hearing: " + e.getMessage());
        }
    }

    public Hearing updateTranscriptAdditionalAttendees(HearingRequest hearingRequest) {
        try {
            Hearing hearing = validator.validateHearingExistence(hearingRequest.getRequestInfo(), hearingRequest.getHearing());
            enrichmentUtil.enrichHearingApplicationUponUpdate(hearingRequest);
            hearingRepository.updateTranscriptAdditionalAttendees(hearingRequest.getHearing());
            hearing.setTranscript(hearingRequest.getHearing().getTranscript());
            hearing.setAuditDetails(hearingRequest.getHearing().getAuditDetails());
            hearing.setAdditionalDetails(hearingRequest.getHearing().getAdditionalDetails());
            hearing.setAttendees(hearingRequest.getHearing().getAttendees());
            hearing.setVcLink(hearingRequest.getHearing().getVcLink());
            hearing.setNotes(hearingRequest.getHearing().getNotes());
            return hearing;
        } catch (CustomException e) {
            log.error("Custom Exception occurred while verifying hearing");
            throw e;
        } catch (Exception e) {
            throw new CustomException(HEARING_UPDATE_EXCEPTION, "Error occurred while updating hearing: " + e.getMessage());
        }
    }

    public void updateStartAndTime(UpdateTimeRequest body) {
        try {
            for (Hearing hearing : body.getHearings()) {
                if (hearing.getHearingId() == null || hearing.getHearingId().isEmpty()) {
                    throw new CustomException(HEARING_UPDATE_TIME_EXCEPTION, "Hearing Id is required for updating start and end time");
                }
                Hearing existingHearing = validator.validateHearingExistence(body.getRequestInfo(), hearing);
                existingHearing.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
                existingHearing.getAuditDetails().setLastModifiedBy(body.getRequestInfo().getUserInfo().getUuid());
                hearing.setAuditDetails(existingHearing.getAuditDetails());

                HearingRequest hearingRequest = HearingRequest.builder().requestInfo(body.getRequestInfo())
                        .hearing(hearing).build();
                producer.push(config.getStartEndTimeUpdateTopic(), hearingRequest);
            }

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating hearing start and end time");
            throw e;
        } catch (Exception e) {
            throw new CustomException(HEARING_UPDATE_TIME_EXCEPTION, "Error occurred while updating hearing start and end time: " + e.getMessage());
        }
    }

    public Hearing uploadWitnessDeposition(HearingRequest hearingRequest) {

        try {

            // Validate whether the application that is being requested for update indeed exists
            Hearing hearing = validator.validateHearingExistence(hearingRequest.getRequestInfo(), hearingRequest.getHearing());

            // Updating Hearing request

            hearing.setDocuments(hearingRequest.getHearing().getDocuments());
            hearingRequest.setHearing(hearing);

            // Enrich application upon update
            enrichmentUtil.enrichHearingApplicationUponUpdate(hearingRequest);

            producer.push(config.getHearingUpdateTopic(), hearingRequest);

            return hearingRequest.getHearing();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while uploading witness deposition pdf");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while uploading witness deposition pdf");
            throw new CustomException(WITNESS_DEPOSITION_UPDATE_EXCEPTION, "Error occurred while uploading witness deposition pdf: " + e.getMessage());
        }

    }

    private void callNotificationService(HearingRequest hearingRequest, String updatedState, boolean isRescheduled) {

        try {
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(hearingRequest.getRequestInfo(), hearingRequest.getHearing());
            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

            Object additionalDetailsObject = hearingRequest.getHearing().getAdditionalDetails();
            String jsonData = objectMapper.writeValueAsString(additionalDetailsObject);
            JsonNode additionalData = objectMapper.readTree(jsonData);
            boolean caseAdjourned = additionalData.has("purposeOfAdjournment");
            String hearingType = hearingRequest.getHearing().getHearingType();
            String messageCode = updatedState != null ?
                    getMessageCode(isRescheduled) :
                    null;
            assert messageCode != null;
            log.info("Message code: {}", messageCode);

            String hearingDate = hearingRequest.getHearing().getStartTime() != null ? hearingRequest.getHearing().getStartTime().toString() : "";
            LocalDateTime dateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(Long.parseLong(hearingDate)), ZoneId.of(config.getZoneId()));
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DOB_FORMAT_Y_M_D);
            String date = dateTime.format(formatter);

            Set<String> individualIds = extractIndividualIds(caseDetails);
            extractPowerOfAttorneyIds(caseDetails, individualIds);

            Set<String> phoneNumbers = callIndividualService(hearingRequest.getRequestInfo(), individualIds);

            String localizedHearingType = "";
            if (hearingType != null && VARIABLE_HEARING_SCHEDULED.equals(messageCode)) {
                localizedHearingType = getLocalizedMessageOfHearingType(hearingRequest, hearingType);
            }
            String oldHearingDate = null;
            if(isRescheduled) {
                HearingCriteria hearingCriteria = HearingCriteria.builder()
                        .hearingId(hearingRequest.getHearing().getHearingId())
                        .build();
                HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                        .criteria(hearingCriteria)
                        .build();
                Hearing existingHearing = searchHearing(hearingSearchRequest).get(0);
                long oldHearingStartTime = existingHearing.getStartTime();
                oldHearingDate = String.valueOf(dateUtil.getLocalDateFromEpoch(oldHearingStartTime));
            }
            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .courtCaseNumber(caseDetails.has("courtCaseNumber") ? caseDetails.get("courtCaseNumber").textValue() : "")
                    .cmpNumber(caseDetails.has("cmpNumber") ? caseDetails.get("cmpNumber").textValue() : "")
                    .hearingDate(date)
                    .hearingType(localizedHearingType)
                    .tenantId(hearingRequest.getHearing().getTenantId())
                    .oldHearingDate(oldHearingDate)
                    .build();

            for (String number : phoneNumbers) {
                notificationService.sendNotification(hearingRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, Hearing hearing) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(hearing.getFilingNumber().get(0)).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    private String getMessageCode(boolean isRescheduled) {

        if(isRescheduled){
            return HEARING_RESCHEDULED;
        }
        return null;
    }

    public Set<String> extractIndividualIds(JsonNode caseDetails) {
        JsonNode litigantNode = caseDetails.get("litigants");
        JsonNode representativeNode = caseDetails.get("representatives");
        Set<String> uuids = new HashSet<>();

        if (litigantNode.isArray()) {
            for (JsonNode node : litigantNode) {
                String uuid = node.path("additionalDetails").get("uuid").asText();
                if (!uuid.isEmpty()) {
                    uuids.add(uuid);
                }
            }
        }
        if (representativeNode.isArray()) {
            for (JsonNode advocateNode : representativeNode) {
                JsonNode representingNode = advocateNode.get("representing");
                if (representingNode.isArray()) {
                    String uuid = advocateNode.path("additionalDetails").get("uuid").asText();
                    if (!uuid.isEmpty()) {
                        uuids.add(uuid);
                    }
                }
            }
        }
        return uuids;
    }

    public void extractPowerOfAttorneyIds(JsonNode caseDetails, Set<String> individualIds) {
        JsonNode poaHolders = caseDetails.get("poaHolders");
        if (poaHolders != null && poaHolders.isArray()) {
            for (JsonNode poaHolder : poaHolders) {
                String individualId = poaHolder.path("individualId").textValue();
                if (individualId != null && !individualId.isEmpty()) {
                    individualIds.add(individualId);
                }
            }
        }
    }

    private Set<String> callIndividualService(RequestInfo requestInfo, Set<String> ids) {

        Set<String> mobileNumber = new HashSet<>();
        List<Individual> individuals = individualService.getIndividuals(requestInfo, new ArrayList<>(ids));
        for (Individual individual : individuals) {
            if (individual.getMobileNumber() != null) {
                mobileNumber.add(individual.getMobileNumber());
            }
        }
        return mobileNumber;
    }

    public List<ScheduleHearing> bulkReschedule(@Valid BulkRescheduleRequest request) {
        BulkReschedule bulkReschedule = request.getBulkReschedule();
        RequestInfo requestInfo = request.getRequestInfo();
        Set<Integer> slotIds = bulkReschedule.getSlotIds();

        validator.validateBulkRescheduleRequest(requestInfo, bulkReschedule);
        updateJudgeCalendar(request);

        List<OpenHearing> hearingsToReschedule = getHearingsForBulkReschedule(slotIds, bulkReschedule, requestInfo);

        if (hearingsToReschedule.isEmpty()) {
            log.info("No hearings found for bulk reschedule");
            return new ArrayList<>();
        }

        List<String> hearingIds = new ArrayList<>();

        hearingsToReschedule.stream().map(OpenHearing::getHearingNumber).forEach(hearingIds::add);

        if (hearingIds.isEmpty()) {
            log.info("all hearings are completed");
            return new ArrayList<>();
        }
        bulkReschedule.setHearingIds(hearingIds);
        request.setBulkReschedule(bulkReschedule);
        log.info("no of hearings to reschedule: {}", hearingIds.size());

        List<ScheduleHearing> scheduleHearings = schedulerUtil.callBulkReschedule(request);

        Map<String, OpenHearing> scheduleHearingMap = hearingsToReschedule.stream().collect(Collectors.toMap(OpenHearing::getHearingNumber, obj -> obj));
        for (ScheduleHearing scheduleHearing : scheduleHearings) {
            if (scheduleHearingMap.containsKey(scheduleHearing.getHearingBookingId())) {
                OpenHearing hearing = scheduleHearingMap.get(scheduleHearing.getHearingBookingId());
                scheduleHearing.setOriginalHearingDate(hearing.getFromDate());
                scheduleHearing.setCaseId(hearing.getCaseNumber());
                scheduleHearing.setFilingNumber(Collections.singletonList(hearing.getFilingNumber()));
                scheduleHearing.setCaseStage(hearing.getStage());
            }
        }

        return scheduleHearings;
    }

    private void updateJudgeCalendar(@Valid BulkRescheduleRequest request) {
        log.info("operation=updateJudgeCalendar, status=IN_PROGRESS");
        Long startTime = request.getBulkReschedule().getStartTime();
        Long endTime = request.getBulkReschedule().getEndTime();
        String judgeId = request.getBulkReschedule().getJudgeId();
        String tenantId = request.getBulkReschedule().getTenantId();
        String courtId = request.getBulkReschedule().getCourtId();

        Long startOfTheDay = dateUtil.getStartOfTheDayForEpoch(startTime);

        log.info("startOfTheDay: {}, endTime: {}", startOfTheDay, endTime);
        List<JudgeCalendarRule> judgeCalendars = new ArrayList<>();

        for (Long i = startOfTheDay; i < endTime; i = i + 86400000) {
            JudgeCalendarRule judgeCalendarRule = new JudgeCalendarRule();
            judgeCalendarRule.setTenantId(tenantId);
            judgeCalendarRule.setJudgeId(judgeId);
            judgeCalendarRule.setDate(i);
            judgeCalendarRule.setRuleType("RESCHEDULE");
            judgeCalendarRule.setCourtIds(Collections.singletonList(courtId));
            judgeCalendars.add(judgeCalendarRule);
        }
        JudgeCalendarUpdateRequest calendarUpdateRequest = JudgeCalendarUpdateRequest.builder()
                .requestInfo(request.getRequestInfo())
                .judgeCalendarRule(judgeCalendars)
                .build();

        schedulerUtil.updateJudgeCalendar(calendarUpdateRequest);

        log.info("operation=updateJudgeCalendar, status=COMPLETED");

    }


    private List<OpenHearing> getHearingsForBulkReschedule(Set<Integer> slotIds, BulkReschedule bulkReschedule, RequestInfo requestInfo) {

        HearingCriteria criteria = HearingCriteria.builder()
                .tenantId(bulkReschedule.getTenantId()).fromDate(bulkReschedule.getStartTime())
                .toDate(bulkReschedule.getEndTime())
                .courtId(bulkReschedule.getCourtId())
                .build();

        List<OpenHearing> hearingsToReschedule = new ArrayList<>();

        if (!slotIds.isEmpty()) {
            // check mdms data for slot filtering if any slot id is there
            Map<String, Map<String, JSONArray>> slotDetails = mdmsUtil.fetchMdmsData(requestInfo, bulkReschedule.getTenantId(), "court", Collections.singletonList("slots"));

            JSONArray slots = slotDetails.get("court").get("slots");
            for (Object slot : slots) {
                HearingSlot hearingSlot = objectMapper.convertValue(slot, HearingSlot.class);
                if (slotIds.contains(hearingSlot.getId())) {

                    Long startDate = bulkReschedule.getStartTime();
                    Long endDate = bulkReschedule.getEndTime();
                    String startTime = hearingSlot.getSlotStartTime();
                    String endTime = hearingSlot.getSlotEndTime();

                    LocalDateTime from = dateUtil.getLocalDateTimeFromEpoch(startDate);
                    LocalDateTime fromLocalDateTime = dateUtil.getLocalDateTime(from, startTime);
                    Long fromDate = dateUtil.getEpochFromLocalDateTime(fromLocalDateTime);

                    LocalDateTime to = dateUtil.getLocalDateTimeFromEpoch(endDate);
                    LocalDateTime toLocalDateTime = dateUtil.getLocalDateTime(to, endTime);
                    Long toDate = dateUtil.getEpochFromLocalDateTime(toLocalDateTime);

                    log.info("fromDate: {}, toDate: {}", fromDate, toDate);
                    criteria.setFromDate(fromDate);
                    criteria.setToDate(toDate);

                    if (fromDate == null || toDate == null) {
                        throw new CustomException("SOMETHING_WENT_WRONG", "Start date and end date are required");

                    }

                    InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(bulkReschedule);

                    List<OpenHearing> hearings = inboxUtil.getOpenHearings(inboxRequest);
                    log.info("hearings in slot Id {}: Hearing {}", hearingSlot.getId(), hearings.size());
                    hearingsToReschedule.addAll(hearings);

                    slotIds.remove(hearingSlot.getId());

                }
            }
        } else {

            InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(bulkReschedule);

            hearingsToReschedule = inboxUtil.getOpenHearings(inboxRequest);

        }

        return hearingsToReschedule;


    }

    private String getMessageCodeForHearingType(String hearingType) {
        if (hearingType.equalsIgnoreCase(WARRANT) || hearingType.equalsIgnoreCase(BAIL) || hearingType.equalsIgnoreCase(ADR) ||
                hearingType.equalsIgnoreCase(REPORTS) || hearingType.equalsIgnoreCase(ARGUMENTS) || hearingType.equalsIgnoreCase(PLEA) ||
                hearingType.equalsIgnoreCase(EXECUTION) || hearingType.equalsIgnoreCase(EXAMINATION_UNDER_S351_BNSS) ||
                hearingType.equalsIgnoreCase(EVIDENCE_COMPLAINANT) || hearingType.equalsIgnoreCase(EVIDENCE_ACCUSED) ||
                hearingType.equalsIgnoreCase(APPEARANCE) || hearingType.equalsIgnoreCase(ADMISSION) || hearingType.equalsIgnoreCase(JUDGEMENT)) {
            return VARIABLE_HEARING_SCHEDULED;
        }
        return null;
    }

    private String getLocalizedMessageOfHearingType(HearingRequest request, String hearingType) {
        RequestInfo requestInfo = request.getRequestInfo();
        String tenantId = request.getHearing().getTenantId();
        Map<String, Map<String, String>> localizedMessageMap = notificationService.getLocalisedMessages(requestInfo, tenantId,
                NOTIFICATION_ENG_LOCALE_CODE, HEARING_TYPE_MODULE_CODE);
        if (localizedMessageMap.isEmpty()) {
            return null;
        }
        return localizedMessageMap.get(NOTIFICATION_ENG_LOCALE_CODE + "|" + tenantId).get(hearingType);
    }

    public List<Hearing> updateBulkHearing(HearingUpdateBulkRequest request) {
        try {
            log.info("operation=updateBulkHearing, status=IN_PROGRESS");
            List<Hearing> hearingList = request.getHearings();
            List<Hearing> updatedBulkHearings = getExistingHearings(hearingList);
            if (!updatedBulkHearings.isEmpty())
                request.setHearings(updatedBulkHearings);
            List<ScheduleHearing> scheduleHearings = getScheduledHearings(updatedBulkHearings, request.getRequestInfo());

            Map<String, Hearing> hearingMap = updatedBulkHearings.stream()
                    .collect(Collectors.toMap(Hearing::getHearingId, hearing -> hearing));

            List<ScheduleHearing> manualUpdateDateHearings = new ArrayList<>();
            Iterator<ScheduleHearing> iterator = scheduleHearings.iterator();
            while (iterator.hasNext()) {
                ScheduleHearing schedule = iterator.next();
                Hearing hearing = hearingMap.get(schedule.getHearingBookingId());
                if (hearing != null) {
                    boolean startTimeDiffers = !Objects.equals(hearing.getStartTime(), schedule.getStartTime());
                    boolean endTimeDiffers = !Objects.equals(hearing.getEndTime(), schedule.getEndTime());
                    if (startTimeDiffers || endTimeDiffers) {
                        schedule.setStartTime(hearing.getStartTime());
                        schedule.setEndTime(hearing.getEndTime());
                        schedule.setHearingDate(hearing.getStartTime());
                        schedule.setExpiryTime(null);
                        manualUpdateDateHearings.add(schedule);
                        iterator.remove(); // Safe removal during iteration
                        log.warn("Start and End time not matching for hearing: {}", schedule.getHearingBookingId());
                    } else {
                        schedule.setExpiryTime(null);
                    }
                }
            }
            // If manualUpdateDateHearings is not empty,
            if (!manualUpdateDateHearings.isEmpty()) {
                List<ScheduleHearing> manualHearingDateUpdate = schedulerUtil.createScheduleHearing(manualUpdateDateHearings, request.getRequestInfo());
                for (ScheduleHearing scheduleHearing : manualHearingDateUpdate) {
                    Hearing hearing = hearingMap.get(scheduleHearing.getHearingBookingId());
                    if (hearing != null) {
                        hearing.setStartTime(scheduleHearing.getStartTime());
                        hearing.setEndTime(scheduleHearing.getEndTime());
                    }
                }
            }

            updateSchedulerHearings(scheduleHearings, request.getRequestInfo());
            log.info("operation=updateBulkHearing, status=SUCCESS");
            sendSMSForHearingReschedule(request.getRequestInfo(), hearingList);
            producer.push(config.getBulkRescheduleTopic(), request);
            return updatedBulkHearings;
        } catch (Exception e) {
            log.error("operation=updateBulkHearing, status=FAILURE, message={}", e.getMessage());
            throw new CustomException(HEARING_UPDATE_EXCEPTION, "Error occurred while updating hearing in bulk: " + e.getMessage());
        }
    }

    private void updateSchedulerHearings(List<ScheduleHearing> scheduleHearings, @Valid RequestInfo requestInfo) {
        ScheduleHearingUpdateRequest request = ScheduleHearingUpdateRequest.builder().requestInfo(requestInfo)
                .scheduleHearings(scheduleHearings).build();
        schedulerUtil.updateScheduleHearings(request);
    }

    private List<ScheduleHearing> getScheduledHearings(List<Hearing> hearingList, @Valid RequestInfo requestInfo) {
        List<String> hearingIds = hearingList.stream().map(Hearing::getHearingId).toList();
        ScheduleHearingSearchRequest request = ScheduleHearingSearchRequest.builder().requestInfo(requestInfo).
                criteria(ScheduleHearingSearchCriteria.builder().hearingIds(hearingIds).build())
                .build();

        return schedulerUtil.getScheduledHearings(request);
    }

    @NotNull
    private List<Hearing> getExistingHearings(List<Hearing> hearingList) {
        List<Hearing> updatedBulkHearings = new ArrayList<>();
        for (Hearing hearing : hearingList) {
            Hearing existingHearing = hearingRepository.checkHearingsExist(hearing).get(0);
            if (existingHearing == null) {
                log.error("Hearing does not present for hearingId :: {}", hearing.getHearingId());
                continue;
            }
            updatedBulkHearings.add(hearing);
        }
        return updatedBulkHearings;
    }

    private void sendSMSForHearingReschedule(RequestInfo requestInfo, List<Hearing> hearingList){
        HearingRequest hearingRequest = HearingRequest.builder()
                .requestInfo(requestInfo)
                .build();

        for(Hearing hearing : hearingList){
            hearingRequest.setHearing(hearing);
            callNotificationService(hearingRequest, hearing.getStatus(), true);
        }

    }

    public void updateCaseReferenceHearing(Map<String, Object> body) {
        try {
            log.info("operation=updateCaseReferenceHearing, status=IN_PROGRESS, filingNumber={}", body.get("filingNumber").toString());
            RequestInfo requestInfo = objectMapper.convertValue(body.get("requestInfo"), RequestInfo.class);
            String filingNumber = body.get("filingNumber").toString();
            HearingSearchRequest request = HearingSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(HearingCriteria.builder().filingNumber(filingNumber).build())
                    .build();
            List<Hearing> hearingList = searchHearing(request);
            for (Hearing hearing : hearingList) {
                hearing.setCourtCaseNumber(body.get("courtCaseNumber") != null ? body.get("courtCaseNumber").toString() : null);
                hearing.setCmpNumber(body.get("cmpNumber") != null ? body.get("cmpNumber").toString() : null);
                if (body.get("courtCaseNumber") != null) {
                    hearing.setCaseReferenceNumber(body.get("courtCaseNumber").toString());
                } else if (body.get("cmpNumber") != null) {
                    hearing.setCaseReferenceNumber(body.get("cmpNumber").toString());
                } else {
                    hearing.setCaseReferenceNumber(filingNumber);
                }
                HearingRequest hearingRequest = HearingRequest.builder()
                        .requestInfo(requestInfo)
                        .hearing(hearing)
                        .build();
                updateHearing(hearingRequest);
            }
            log.info("operation=updateCaseReferenceHearing, status=SUCCESS, filingNumber={}", body.get("filingNumber").toString());
        } catch (Exception e) {
            log.info("operation=updateCaseReferenceHearing, status=FAILURE, filingNumber={}", body.get("filingNumber").toString());
            throw new CustomException("Error updating case reference number: {}", e.getMessage());
        }
    }

    public void updateCaseReferenceHearingAfterLpr(CaseRequest caseRequest) {
        try {
            log.info("operation=updateCaseReferenceHearingAfterLpr, status=IN_PROGRESS");
            RequestInfo requestInfo = caseRequest.getRequestInfo();
            CourtCase courtCase = caseRequest.getCases();
            String filingNumber = courtCase.getFilingNumber();
            HearingSearchRequest request = HearingSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(HearingCriteria.builder().filingNumber(filingNumber).build())
                    .build();
            List<Hearing> hearingList = searchHearing(request);
            for (Hearing hearing : hearingList) {
                hearing.setCourtCaseNumber(courtCase.getCourtCaseNumber());
                hearing.setCmpNumber(courtCase.getCmpNumber());
                if (LifecycleStatus.LPR.equals(courtCase.getLifecycleStatus()) && courtCase.getLprNumber() != null) {
                    hearing.setCaseReferenceNumber(courtCase.getLprNumber());
                } else if (courtCase.getCourtCaseNumber() != null) {
                    hearing.setCaseReferenceNumber(courtCase.getCourtCaseNumber());
                } else if (courtCase.getCmpNumber() != null) {
                    hearing.setCaseReferenceNumber(courtCase.getCmpNumber());
                } else {
                    hearing.setCaseReferenceNumber(filingNumber);
                }
                HearingRequest hearingRequest = HearingRequest.builder()
                        .requestInfo(requestInfo)
                        .hearing(hearing)
                        .build();
                updateHearing(hearingRequest);
            }
            log.info("operation=updateCaseReferenceHearingAfterLpr, status=SUCCESS");
        } catch (Exception e) {
            log.info("operation=updateCaseReferenceHearingAfterLpr, status=FAILURE, filingNumber={}", caseRequest.getCases().getFilingNumber());
            throw new CustomException("Error updating case reference number: {}", e.getMessage());
        }
    }

    public List<Integer> getAvgNoOfDaysToHearingForEachCase() {
        try {
            log.info("operation=getAvgNoOfDaysToHearingForEachCase, status=IN_PROGRESS");

            List<Hearing> hearings = hearingRepository.getHearingsWithMultipleHearings();

            Map<String, List<Hearing>> hearingsGroupedByFilingNumber = hearings.stream()
                    .filter(h -> h.getFilingNumber() != null && !h.getFilingNumber().isEmpty())
                    .collect(Collectors.groupingBy(h -> h.getFilingNumber().get(0)));

            List<Integer> averages = computeAverageDaysBetweenHearings(hearingsGroupedByFilingNumber);

            log.info("operation=getAvgNoOfDaysToHearingForEachCase, status=SUCCESS");
            return averages;

        } catch (Exception e) {
            log.error("operation=getAvgNoOfDaysToHearingForEachCase, status=FAILURE, message={}", e.getMessage());
            throw new CustomException("Error occurred while getting avg no of days to hearing for each case: ", e.getMessage());
        }
    }

    private static List<Integer> computeAverageDaysBetweenHearings(Map<String, List<Hearing>> groupedHearings) {
        List<Integer> averageDaysList = new ArrayList<>();

        for (List<Hearing> hearings : groupedHearings.values()) {
            // Sort hearings chronologically by startTime
            List<Hearing> sortedHearings = hearings.stream()
                    .filter(h -> h.getStartTime() != null)
                    .sorted(Comparator.comparingLong(Hearing::getStartTime))
                    .toList();

            List<Long> differences = new ArrayList<>();

            for (int i = 0; i < sortedHearings.size() - 1; i++) {
                long start = sortedHearings.get(i).getStartTime();
                long nextStart = sortedHearings.get(i + 1).getStartTime();
                differences.add(Duration.ofMillis(nextStart - start).toDays());
            }

            if (!differences.isEmpty()) {
                double average = differences.stream().mapToLong(Long::longValue).average().orElse(0);
                averageDaysList.add((int) average);
            }
        }

        return averageDaysList;
    }

    public void createDraftOrder(String hearingNumber, String hearingType, String tenantId, String filingNumber, String cnrNumber, RequestInfo requestInfo) {
        OrderCriteria criteria = OrderCriteria.builder()
                .filingNumber(filingNumber)
                .hearingNumber(hearingNumber)
                .tenantId(tenantId)
                .build();

        OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                .criteria(criteria)
                .pagination(Pagination.builder().limit(100.0).offSet(0.0).build())
                .build();

                OrderResponse orderResponse;

        OrderListResponse response = orderUtil.getOrders(searchRequest);
        if (response != null && !CollectionUtils.isEmpty(response.getList())) {
            log.info("Found existing SCHEDULING_NEXT_HEARING draft(s) for Hearing ID: {}; skipping creation.", hearingNumber);
        } else {
            org.pucar.dristi.web.models.orders.Order order = Order.builder()
                    .hearingNumber(hearingNumber)
                    .hearingType(hearingType)
                    .filingNumber(filingNumber)
                    .cnrNumber(cnrNumber)
                    .tenantId(tenantId)
                    .orderCategory("INTERMEDIATE")
                    .orderTitle("Schedule of Next Hearing Date")
                    .orderType("")
                    .isActive(true)
                    .status("")
                    .statuteSection(StatuteSection.builder().tenantId(tenantId).build())
                    .build();

            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction("SAVE_DRAFT");
            workflow.setDocuments(List.of(new org.egov.common.contract.models.Document()));
            order.setWorkflow(workflow);

            OrderRequest orderRequest = OrderRequest.builder()
                    .requestInfo(requestInfo).order(order).build();
            orderResponse = orderUtil.createOrder(orderRequest);
            log.info("Order created for Hearing ID: {}, orderNumber:: {}", hearingNumber, orderResponse.getOrder().getOrderNumber());
        }

    }


}
