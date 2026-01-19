package org.pucar.dristi.kafka.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.service.HearingService;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.util.PendingTaskUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.cases.CaseOutcome;
import org.pucar.dristi.web.models.cases.CaseRequest;
import org.pucar.dristi.web.models.cases.CourtCase;
import org.pucar.dristi.web.models.orders.*;
import org.pucar.dristi.web.models.orders.Order;
import org.pucar.dristi.web.models.pendingtask.PendingTask;
import org.pucar.dristi.web.models.pendingtask.PendingTaskRequest;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class HearingUpdateConsumer {

    private final HearingService hearingService;
    private final ObjectMapper objectMapper;

    private final OrderUtil orderUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final Configuration configuration;
    private final DateUtil dateUtil;
    private final CaseUtil caseUtil;

    public HearingUpdateConsumer(HearingService hearingService, ObjectMapper objectMapper, OrderUtil orderUtil, PendingTaskUtil pendingTaskUtil, Configuration configuration, DateUtil dateUtil, CaseUtil caseUtil) {
        this.hearingService = hearingService;
        this.objectMapper = objectMapper;
        this.orderUtil = orderUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.configuration = configuration;
        this.dateUtil = dateUtil;
        this.caseUtil = caseUtil;
    }

    @KafkaListener(topics = {"${hearing.case.reference.number.update}"})
    public void updateCaseReferenceConsumer(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received case reference number details on topic: {}", topic);
            hearingService.updateCaseReferenceHearing(objectMapper.convertValue(payload.value(), Map.class));
            log.info("Updated case reference number for hearings");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to case reference number details topic: {}: {}", topic, e.getMessage());
        }

    }

    @KafkaListener(topics = {"${lpr.case.details.update.kafka.topic}"})
    public void updateCaseReferenceConsumerLpr(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received case reference number details on lpr update topic: {}", topic);
            CaseRequest caseRequest = objectMapper.convertValue(payload.value(), CaseRequest.class);
            hearingService.updateCaseReferenceHearingAfterLpr(caseRequest);
            log.info("Updated case reference number for hearings after lpr update");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to case reference number details topic: {}: {}", topic, e.getMessage());
        }

    }

    @KafkaListener(topics = {"${kafka.topics.hearing.update}"})
    public void updateHearingConsumer(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received hearing details on topic: {}", topic);
            HearingRequest hearingRequest = objectMapper.convertValue(payload.value(), HearingRequest.class);
            String hearingStatus = hearingRequest.getHearing().getStatus();
            if (hearingStatus.equalsIgnoreCase(COMPLETED) || hearingStatus.equalsIgnoreCase(ABANDONED)) {
                orderUtil.closeActivePaymentPendingTasks(hearingRequest);
                orderUtil.closeActivePaymentPendingTasksOfProcesses(hearingRequest);
            }
            if (hearingStatus.equalsIgnoreCase(COMPLETED)) {
                String filingNumber = hearingRequest.getHearing().getFilingNumber() != null && !hearingRequest.getHearing().getFilingNumber().isEmpty()
                        ? hearingRequest.getHearing().getFilingNumber().get(0)
                        : null;
                String cnrNumber = hearingRequest.getHearing().getCnrNumbers() != null && !hearingRequest.getHearing().getCnrNumbers().isEmpty()
                        ? hearingRequest.getHearing().getCnrNumbers().get(0)
                        : null;
                hearingService.createDraftOrder(hearingRequest.getHearing().getHearingId(), hearingRequest.getHearing().getHearingType(), hearingRequest.getHearing().getTenantId(), filingNumber, cnrNumber, hearingRequest.getRequestInfo());
                checkAndCreatePendingTasks(hearingRequest);
            }
            log.info("Updated hearings");
        } catch (IllegalArgumentException e) {
            log.error("Error while listening to hearings topic: {}: {}", topic, e.getMessage());
        }
    }

    @KafkaListener(topics = {"${egov.case.outcome.topic}"})
    public void updateCaseOutcome(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received case outcome record on topic: {}", topic);
            CaseOutcome caseOutcome = objectMapper.convertValue(payload.value(), CaseOutcome.class);
            String filingNumber = caseOutcome.getOutcome().getFilingNumber();

            CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
            caseSearchRequest.setRequestInfo(caseOutcome.getRequestInfo());
            CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
            caseSearchRequest.addCriteriaItem(caseCriteria);

            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
            String caseCnrNumber = textValueOrNull(caseDetails, CASE_CNR);
            String caseId = textValueOrNull(caseDetails, CASE_ID);
            String caseTitle = textValueOrNull(caseDetails, CASE_TITLE);

            // close manual pending task of schedule of hearing
            log.info("close manual pending task of schedule of hearing");
            pendingTaskUtil.closeManualPendingTask(MANUAL + filingNumber + SCHEDULE_HEARING_SUFFIX, caseOutcome.getRequestInfo(), filingNumber, caseCnrNumber, caseId, caseTitle, null);

        } catch (final Exception e) {
            log.error("Error while listening to case outcome on topic: {}: ", topic, e);
        }
    }

    private void checkAndCreatePendingTasks(HearingRequest hearingRequest) {
        Hearing hearing = hearingRequest.getHearing();
        RequestInfo requestInfo = hearingRequest.getRequestInfo();

        JsonNode caseDetails = getCaseDetails(requestInfo, hearing);
        String caseOutcome = textValueOrNull(caseDetails, CASE_OUTCOME);

        if (!COMPLETED.equalsIgnoreCase(hearing.getStatus())
                || (caseOutcome != null && !caseOutcome.isEmpty())) {
            return;
        }

        String filingNumber = getFirstFilingNumber(hearing);
        if (filingNumber == null) {
            log.error("Filing number is null for Hearing ID: {}", hearing.getHearingId());
            return;
        }

        if (hasScheduledHearings(requestInfo, hearing, filingNumber)) {
            log.info("Found scheduled hearings for Hearing ID: {}", hearing.getHearingId());
            return;
        }

        createPendingTaskForHearing(requestInfo, hearing, filingNumber);
    }

    private String getFirstFilingNumber(Hearing hearing) {
        return (hearing.getFilingNumber() != null && !hearing.getFilingNumber().isEmpty())
                ? hearing.getFilingNumber().get(0)
                : null;
    }

    private boolean hasScheduledHearings(RequestInfo requestInfo, Hearing hearing, String filingNumber) {
        HearingCriteria criteria = HearingCriteria.builder()
                .filingNumber(filingNumber)
                .tenantId(hearing.getTenantId())
                .build();

        HearingSearchRequest searchRequest = HearingSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();

        List<Hearing> hearings = hearingService.searchHearing(searchRequest);

        return hearings.stream().anyMatch(h -> SCHEDULED.equalsIgnoreCase(h.getStatus()));
    }

    private void createPendingTaskForHearing(RequestInfo requestInfo, Hearing hearing, String filingNumber) {
        LocalDateTime slaDate = LocalDateTime.now().plusDays(configuration.getScheduleHearingSla());

        JsonNode caseDetails = getCaseDetails(requestInfo, hearing);
        String caseTitle = textValueOrNull(caseDetails, CASE_TITLE);
        String caseId = textValueOrNull(caseDetails, CASE_ID);

        PendingTask pendingTask = PendingTask.builder()
                .name(configuration.getPendingTaskName())
                .referenceId(MANUAL + filingNumber + SCHEDULE_HEARING_SUFFIX)
                .actionCategory(ACTION_CATEGORY_SCHEDULE_HEARING)
                .entityType(configuration.getOrderEntityType())
                .status(CREATE_ORDER)
                .assignedRole(List.of(VIEW_SCHEDULE_HEARING))
                .screenType(SCREEN_TYPE_HOME)
                .stateSla(dateUtil.getEpochFromLocalDateTime(slaDate))
                .filingNumber(filingNumber)
                .caseTitle(caseTitle)
                .caseId(caseId)
                .isCompleted(false)
                .build();

        PendingTaskRequest pendingTaskRequest = PendingTaskRequest.builder()
                .requestInfo(requestInfo)
                .pendingTask(pendingTask)
                .build();

        log.info("Creating pending task for filing number: {}", filingNumber);
        pendingTaskUtil.createPendingTask(pendingTaskRequest);
    }

    private JsonNode getCaseDetails(RequestInfo requestInfo, Hearing hearing) {
        CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, hearing);
        return caseUtil.searchCaseDetails(caseSearchRequest);
    }

    private String textValueOrNull(JsonNode node, String field) {
        return node.get(field).isNull() ? null : node.get(field).textValue();
    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, Hearing hearing) {
        String filingNumber = getFirstFilingNumber(hearing);
        CaseCriteria caseCriteria = CaseCriteria.builder()
                .filingNumber(filingNumber)
                .defaultFields(false)
                .build();

        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }


}
