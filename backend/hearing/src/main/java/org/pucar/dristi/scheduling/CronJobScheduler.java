package org.pucar.dristi.scheduling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.HearingRepository;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.service.SmsNotificationService;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.JsonUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.util.UserUtil;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.CaseSearchRequest;
import org.pucar.dristi.web.models.Hearing;
import org.pucar.dristi.web.models.HearingCriteria;
import org.pucar.dristi.web.models.HearingSearchRequest;
import org.pucar.dristi.web.models.Order;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.SmsTemplateData;
import org.pucar.dristi.web.models.cases.CourtCase;
import org.pucar.dristi.web.models.orders.OrderCriteria;
import org.pucar.dristi.web.models.orders.OrderListResponse;
import org.pucar.dristi.web.models.orders.OrderSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.COMPLETED;
import static org.pucar.dristi.config.ServiceConstants.HEARINGS_HELD_TODAY_MULTIPLE;
import static org.pucar.dristi.config.ServiceConstants.HEARINGS_HELD_TODAY_SINGLE;
import static org.pucar.dristi.config.ServiceConstants.HEARINGS_SCHEDULED_TOMORROW_MULTIPLE;
import static org.pucar.dristi.config.ServiceConstants.HEARINGS_SCHEDULED_TOMORROW_SINGLE;
import static org.pucar.dristi.config.ServiceConstants.HEARING_LINK_MASTER_NAME;
import static org.pucar.dristi.config.ServiceConstants.HEARING_MODULE_NAME;
import static org.pucar.dristi.config.ServiceConstants.SCHEDULED;

@Component
@Slf4j
@EnableScheduling
public class CronJobScheduler {

    private final HearingRepository hearingRepository;
    private final RequestInfoGenerator requestInfoGenerator;
    private final SmsNotificationService smsNotificationService;
    private final Configuration config;
    private final ExecutorService executorService;
    private final DateUtil dateUtil;
    private final CaseUtil caseUtil;
    private final UserUtil userUtil;
    private final OrderUtil orderUtil;
    private final AdvocateUtil advocateUtil;
    private final IndividualService individualService;
    private final MdmsUtil mdmsUtil;
    private final JsonUtil jsonUtil;
    private final ObjectMapper objectMapper;
    private String hearingLink;


    @Autowired
    public CronJobScheduler(HearingRepository hearingRepository, RequestInfoGenerator requestInfoGenerator, SmsNotificationService smsNotificationService, Configuration config, DateUtil dateUtil, CaseUtil caseUtil, UserUtil userUtil, OrderUtil orderUtil, AdvocateUtil advocateUtil, IndividualService individualService, MdmsUtil mdmsUtil, JsonUtil jsonUtil, ObjectMapper objectMapper) {
        this.hearingRepository = hearingRepository;
        this.requestInfoGenerator = requestInfoGenerator;
        this.smsNotificationService = smsNotificationService;
        this.config = config;
        this.caseUtil = caseUtil;
        this.userUtil = userUtil;
        this.orderUtil = orderUtil;
        this.executorService = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        this.dateUtil = dateUtil;
        this.advocateUtil = advocateUtil;
        this.individualService = individualService;
        this.mdmsUtil = mdmsUtil;
        this.jsonUtil = jsonUtil;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        Map<String, Map<String, JSONArray>> mdmsResponse = mdmsUtil.fetchMdmsData(null, config.getTenantId(), HEARING_MODULE_NAME, Collections.singletonList(HEARING_LINK_MASTER_NAME));
        JSONArray hearingLinkArray = mdmsResponse
                .get(HEARING_MODULE_NAME)
                .get(HEARING_LINK_MASTER_NAME);

        Object data = hearingLinkArray.get(0);
        hearingLink = jsonUtil.getNestedValue(data, List.of("link"), String.class);
    }

    @Async
    @Scheduled(cron = "${config.hearings.held.today.update}", zone = "Asia/Kolkata")
    public void sendNotificationOnHearingsHeldToday() {
        if(config.getIsSMSEnabled()){
            log.info("Starting Cron Job For Sending Hearing Update Notifications");
            RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
            List<Future<Boolean>> futures = new ArrayList<>();

            try {
                List<Hearing> hearings = getHearingsHeldToday(requestInfo);
                List<CourtCase> cases = getCasesFromHearings(requestInfo, hearings);
                Map<String, List<CourtCase>> advocateCaseMap = getAdvocateCaseMap(cases);
                List<Individual> advocates = individualService.getIndividuals(requestInfo, new ArrayList<>(advocateCaseMap.keySet()));
                Map<String, List<CourtCase>> litigantCaseMap = getLitigantCaseMap(cases);
                List<Individual> litigants = individualService.getIndividuals(requestInfo, new ArrayList<>(litigantCaseMap.keySet()));

                // Send sms to advocates
               advocates.forEach(advocate -> {
                   List<CourtCase> advocateCases = advocateCaseMap.get(advocate.getUserUuid());
                   Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsHeldToday(advocate, advocateCases, requestInfo));
                   futures.add(future);
               });

               // Send sms to litigants
                litigants.forEach(litigant -> {
                    List<CourtCase> litigantCases = litigantCaseMap.get(litigant.getUserUuid());
                    Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsHeldToday(litigant, litigantCases, requestInfo));
                    futures.add(future);
                });

                // Wait for all tasks to complete
                handleFutureResults(futures);

                log.info("Completed Cron Job For Sending Hearing Update Notifications");

            } catch (Exception e) {
                log.error("Error occurred during notification processing", e);
            }
        }
    }

    @Async
    @Scheduled(cron = "${config.hearings.scheduled.tomorrow.update}", zone = "Asia/Kolkata")
    public void sendNotificationForHearingsScheduledTomorrow(){
        if(config.getIsSMSEnabled()){
            log.info("Sending notifications for hearings scheduled tomorrow");
            RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
            List<Future<Boolean>> futures = new ArrayList<>();
            try{
                List<Hearing> hearings = getHearingsScheduledTomorrow(requestInfo);
                List<CourtCase> cases = getCasesFromHearings(requestInfo, hearings);
                Map<String, List<CourtCase>> advocateCaseMap = getAdvocateCaseMap(cases);
                List<Individual> advocates = individualService.getIndividuals(requestInfo, new ArrayList<>(advocateCaseMap.keySet()));
                Map<String, List<CourtCase>> litigantCaseMap = getLitigantCaseMap(cases);
                List<Individual> litigants = individualService.getIndividuals(requestInfo, new ArrayList<>(litigantCaseMap.keySet()));

                // Send sms to advocates
                advocates.forEach(individual -> {
                    List<CourtCase> advocateCases = advocateCaseMap.get(individual.getUserUuid());
                    Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsScheduledTomorrow(individual, advocateCases, requestInfo));
                    futures.add(future);
                });

                // Send sms to litigants
                litigants.forEach(litigant -> {
                    List<CourtCase> litigantCases = litigantCaseMap.get(litigant.getUserUuid());
                    Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsScheduledTomorrow(litigant, litigantCases, requestInfo));
                    futures.add(future);
                });

                handleFutureResults(futures);

            } catch (Exception e) {
                log.error("Error occurred during notifications processing", e);
            }
        }
    }

    private Boolean sendSMSForHearingsHeldToday(Individual individual, List<CourtCase> cases, RequestInfo requestInfo) {
        log.info("Sending updates on hearings held today");
        try{
            int caseCount = cases.size();
            CourtCase firstCase = cases.get(0);
            String mobileNumber = individual.getMobileNumber();
            String cmpNumber = firstCase.getCmpNumber();
            String filingNumber = firstCase.getFilingNumber();
            Hearing hearing = getNextScheduledHearing(filingNumber, requestInfo);
            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .tenantId(individual.getTenantId())
                    .caseCount(caseCount)
                    .cmpNumber(cmpNumber)
                    .hearingDate(String.valueOf(hearing.getStartTime()))
                    .build();

            String notificationCode;
            if(caseCount == 1){
                notificationCode = HEARINGS_HELD_TODAY_SINGLE;
                Long nextHearingDate = getNextHearingDate(filingNumber);
                smsTemplateData.setHearingDate(String.valueOf(nextHearingDate));
            }
            else{
                notificationCode = HEARINGS_HELD_TODAY_MULTIPLE;
            }
            smsNotificationService.sendNotification(requestInfo, smsTemplateData, notificationCode, mobileNumber);
            return true;

        } catch (Exception e) {
            log.error("Error occurred during notification processing", e);
            return false;
        }
    }

    private Boolean sendSMSForHearingsScheduledTomorrow(Individual individual, List<CourtCase> cases, RequestInfo requestInfo) {
        log.info("Sending updates on hearings scheduled tomorrow");
        try{
            int caseCount = cases.size();
            CourtCase firstCase = cases.get(0);
            String mobileNumber = individual.getMobileNumber();
            String cmpNumber = firstCase.getCmpNumber();

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .tenantId(individual.getTenantId())
                    .caseCount(caseCount)
                    .cmpNumber(cmpNumber)
                    .link(hearingLink)
                    .build();

            String notificationCode = caseCount == 1 ? HEARINGS_SCHEDULED_TOMORROW_SINGLE : HEARINGS_SCHEDULED_TOMORROW_MULTIPLE;
            smsNotificationService.sendNotification(requestInfo, smsTemplateData, notificationCode, mobileNumber);
            return true;

        } catch (Exception e) {
            log.error("Error occurred during notification processing", e);
            return false;
        }
    }

    private List<Hearing> getHearingsHeldToday(RequestInfo requestInfo){
        ZoneId zoneId = ZoneId.of(config.getZoneId());
        Long today = dateUtil.getEPochFromLocalDate(LocalDate.now(zoneId));
        HearingCriteria hearingCriteria = HearingCriteria.builder()
                .fromDate(today)
                .status(COMPLETED)
                .build();

        return fetchHearings(requestInfo, hearingCriteria, null);
    }

    private List<CourtCase> getCasesFromHearings(RequestInfo requestInfo, List<Hearing> hearings) {
        Set<String> filingNumbers = hearings.stream()
                .map(hearing -> hearing.getFilingNumber().get(0))
                .collect(Collectors.toSet());
        List<CaseCriteria> criteria = new ArrayList<>();
        filingNumbers.forEach(filingNumber -> {
            CaseCriteria caseCriteria = CaseCriteria.builder()
                    .filingNumber(filingNumber)
                    .defaultFields(false)
                    .build();
            criteria.add(caseCriteria);
        });
        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();

        return caseUtil.searchCases(caseSearchRequest);
    }


    private Map<String, List<CourtCase>> getAdvocateCaseMap(List<CourtCase> cases){
        Map<String, List<CourtCase>> advocateCaseMap = new LinkedHashMap<>(); //preserves order
        cases.forEach(courtCase -> {
            courtCase.getRepresentatives().forEach(advocate -> {
                JsonNode advocateNode = objectMapper.convertValue(advocate, JsonNode.class);
                String uuid = advocateNode.path("additionalDetails").get("uuid").asText();

                if(advocateCaseMap.containsKey(uuid)) {
                    advocateCaseMap.get(uuid).add(courtCase);
                }
                else{
                    advocateCaseMap.put(uuid, List.of(courtCase));
                }
            });
        });

        return advocateCaseMap;
    }

    private Map<String, List<CourtCase>> getLitigantCaseMap(List<CourtCase> cases){
        Map<String, List<CourtCase>> litigantCaseMap = new LinkedHashMap<>(); //preserves order
        cases.forEach(courtCase -> {
            courtCase.getLitigants().forEach(litigant -> {
                JsonNode litigantNode = objectMapper.convertValue(litigant, JsonNode.class);
                String uuid = litigantNode.path("additionalDetails").get("uuid").asText();
                if(litigantCaseMap.containsKey(uuid)) {
                    litigantCaseMap.get(uuid).add(courtCase);
                }
                else{
                    litigantCaseMap.put(uuid, List.of(courtCase));
                }
            });
        });

        return litigantCaseMap;
    }

    /**
     * Fetches hearings based on the given criteria.
     */
    private List<Hearing> fetchHearings(RequestInfo requestInfo, HearingCriteria hearingCriteria, Pagination pagination) {
        HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                .criteria(hearingCriteria)
                .requestInfo(requestInfo)
                .pagination(pagination)
                .build();

        return hearingRepository.getHearings(hearingSearchRequest);
    }


    private Hearing getNextScheduledHearing(String filingNumber, RequestInfo requestInfo) {
        HearingCriteria hearingCriteria = HearingCriteria.builder()
                .filingNumber(filingNumber)
                .status(SCHEDULED)
                .build();

        Pagination pagination = Pagination.builder()
                .sortBy("startTime")
                .order(Order.ASC)
                .build();

        return fetchHearings(requestInfo, hearingCriteria, pagination)
                .get(0);
    }

    private Long getNextHearingDate(String filingNumber){
        OrderCriteria orderCriteria = OrderCriteria.builder()
                .filingNumber(filingNumber)
                .status(SCHEDULED)
                .build();
        Pagination pagination = Pagination.builder()
                .sortBy("nextHearingDate")
                .order(Order.DESC)
                .build();
        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .criteria(orderCriteria)
                .pagination(pagination)
                .build();
        OrderListResponse orderListResponse = orderUtil.getOrders(orderSearchRequest);
        return orderListResponse.getList().get(0).getNextHearingDate();
    }

    private List<Hearing> getHearingsScheduledTomorrow(RequestInfo requestInfo){
        ZoneId zoneId = ZoneId.of(config.getZoneId());
        Long tomorrow = dateUtil.getEPochFromLocalDate(LocalDate.now(zoneId).plusDays(1));
        HearingCriteria hearingCriteria = HearingCriteria.builder()
                .fromDate(tomorrow)
                .status(SCHEDULED)
                .build();

        return fetchHearings(requestInfo, hearingCriteria, null);
    }

    /**
     * Handles future results and logs warnings for failed tasks.
     */
    private void handleFutureResults(List<Future<Boolean>> futures) {
        for (Future<Boolean> future : futures) {
            try {
                if (!future.get()) {
                    log.warn("Failed to send notifications in some cases");
                }
            } catch (InterruptedException | ExecutionException e) {
                log.error("Error waiting for task completion", e);
            }
        }
    }
}
