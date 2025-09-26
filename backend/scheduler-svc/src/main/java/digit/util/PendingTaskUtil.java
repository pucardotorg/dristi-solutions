package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.service.UserService;
import digit.web.models.PendingTask;
import digit.web.models.PendingTaskRequest;
import digit.web.models.ReScheduleHearing;
import digit.web.models.cases.CaseCriteria;
import digit.web.models.cases.SearchCaseRequest;
import digit.web.models.inbox.Inbox;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class PendingTaskUtil {

    private final ObjectMapper objectMapper;

    private final Configuration configuration;

    private final ServiceRequestRepository serviceRequestRepository;

    private final DateUtil dateUtil;

    private final CaseUtil caseUtil;

    private final UserService userService;

    private final Configuration config;

    public PendingTaskUtil(ObjectMapper objectMapper, Configuration configuration, RestTemplate restTemplate, ServiceRequestRepository serviceRequestRepository, DateUtil dateUtil, CaseUtil caseUtil, UserService userService, Configuration config) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.dateUtil = dateUtil;
        this.caseUtil = caseUtil;
        this.userService = userService;
        this.config = config;
    }

    public PendingTask createPendingTask(ReScheduleHearing reScheduleHearing) {
        PendingTask pendingTask = new PendingTask();
        pendingTask.setEntityType(configuration.getOrderEntityType());
        pendingTask.setName(PENDING_TASK_NAME);
        pendingTask.setReferenceId("MANUAL_"+reScheduleHearing.getRescheduledRequestId());
        pendingTask.setStatus(PENDING_TASK_STATUS);
        pendingTask.setActionCategory(RE_SCHEDULE_PENDING_TASK_ACTION_CATEGORY);
        pendingTask.setFilingNumber(reScheduleHearing.getCaseId());
        pendingTask.setAssignedRole(Collections.singletonList(VIEW_RE_SCHEDULE_APPLICATION));
        pendingTask.setScreenType(SCREEN_TYPE);
        LocalDateTime currentTime = LocalDateTime.now();
        pendingTask.setReferenceEntityType(RE_SCHEDULE_APPLICATION_TYPE);
        LocalDateTime slaDate=currentTime.plusDays(configuration.getJudgePendingSla());

        log.info("sla date {}", slaDate);
        pendingTask.setStateSla(dateUtil.getEpochFromLocalDateTime(slaDate));
        enrichCaseDetails(pendingTask);
        return pendingTask;
    }

    private void enrichCaseDetails(PendingTask pendingTask) {

        CaseCriteria criteria = CaseCriteria.builder().filingNumber(pendingTask.getFilingNumber()).build();
        SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                .RequestInfo(createInternalRequestInfo())
                .tenantId(config.getEgovStateTenantId())
                .criteria(Collections.singletonList(criteria))
                .flow(FLOW_JAC)
                .build();

        JsonNode caseList = caseUtil.getCases(searchCaseRequest);

        if (caseList != null && caseList.isArray() && !caseList.isEmpty()) {
            pendingTask.setCaseTitle(caseList.get(0).get("caseTitle").isNull() ? null : caseList.get(0).get("caseTitle").asText());
            pendingTask.setCaseId(caseList.get(0).get("id").isNull() ? null : caseList.get(0).get("id").asText());
        }

    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(config.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

    public void callAnalytics(PendingTaskRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getAnalyticsHost().concat(configuration.getAnalyticsEndpoint()));
        try {
            serviceRequestRepository.fetchResult(uri, request);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
    }

    public void expirePendingTasks(List<Inbox> inboxList) {
        try {
            if (inboxList == null || inboxList.isEmpty()) {
                log.info("No pending tasks to expire");
                return;
            }
            for (Inbox inbox : inboxList) {
                Map<String, Object> businessObject = inbox.getBusinessObject();
                if (businessObject == null) {
                    continue;
                }
                // Map businessObject to PendingTask
                PendingTask pendingTask = objectMapper.convertValue(businessObject, PendingTask.class);
                pendingTask.setIsCompleted(true);
                pendingTask.setStatus(EXPIRED);
                callAnalytics(new PendingTaskRequest(createInternalRequestInfo(), pendingTask));
            }
        } catch (Exception e) {
            log.error("Error occurred while expiring pending tasks: {}", e.getMessage());
        }
    }
}
