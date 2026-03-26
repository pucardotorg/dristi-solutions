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
import java.util.Collections;
import java.util.List;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class OpenHearingService {

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
                String dateStr = today.format(DateTimeFormatter.ofPattern(DATE_FORMAT));
                String cacheKey = CACHE_KEY_PREFIX + courtId + ":" + dateStr;
                cacheService.updateCache(cacheKey, openHearings);

                for (OpenHearing hearing : openHearings) {
                    if (hearing.getFilingNumber() != null) {
                        enrichAndCacheCase(hearing.getFilingNumber());
                    }
                }
            }
            log.info("operation = loadOpenHearingsToCache, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = loadOpenHearingsToCache, result = FAILURE", e);
        }
    }

    private void enrichAndCacheCase(String filingNumber) {
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
                String caseId = caseNode.get("id").asText();
                String redisKey = getRedisKey(searchCaseRequest.getRequestInfo(), caseId);
                cacheService.updateCache(redisKey, caseNode);
            }
        } catch (Exception e) {
            log.error("Error enriching and caching case for filing number: {}", filingNumber, e);
        }
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
            String dateStr = today.format(DateTimeFormatter.ofPattern(DATE_FORMAT));
            String cacheKey = CACHE_KEY_PREFIX + courtId + ":" + dateStr;

            Object cachedHearings = cacheService.getCache(cacheKey);
            if (cachedHearings instanceof List) {
                List<?> hearings = (List<?>) cachedHearings;
                RequestInfo requestInfo = createInternalRequestInfo();
                for (Object hearingObj : hearings) {
                    OpenHearing hearing = objectMapper.convertValue(hearingObj, OpenHearing.class);
                    if (hearing.getCaseUuid() != null) {
                        String redisKey = getRedisKey(requestInfo, hearing.getCaseUuid());
                        cacheService.deleteCache(redisKey);
                    } else if (hearing.getFilingNumber() != null) {
                        deleteCaseFromCache(hearing.getFilingNumber());
                    }
                }
            }

            cacheService.deleteCache(cacheKey);
            log.info("operation = clearOpenHearingsCache, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = clearOpenHearingsCache, result = FAILURE", e);
        }
    }

    private void deleteCaseFromCache(String filingNumber) {
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
                String caseId = caseList.get(0).get("id").asText();
                String redisKey = getRedisKey(searchCaseRequest.getRequestInfo(), caseId);
                cacheService.deleteCache(redisKey);
            }
        } catch (Exception e) {
            log.error("Error deleting case from cache for filing number: {}", filingNumber, e);
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
