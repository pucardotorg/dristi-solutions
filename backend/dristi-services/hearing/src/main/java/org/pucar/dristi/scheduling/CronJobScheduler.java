package org.pucar.dristi.scheduling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.HearingRepository;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.service.SmsNotificationService;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.JsonUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.web.models.CaseCriteria;
import org.pucar.dristi.web.models.CaseSearchRequest;
import org.pucar.dristi.web.models.Hearing;
import org.pucar.dristi.web.models.HearingCriteria;
import org.pucar.dristi.web.models.HearingSearchRequest;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.SmsTemplateData;
import org.pucar.dristi.web.models.cases.AdvocateMapping;
import org.pucar.dristi.web.models.cases.CourtCase;
import org.pucar.dristi.web.models.cases.Party;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
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
    private final IndividualService individualService;
    private final MdmsUtil mdmsUtil;
    private final JsonUtil jsonUtil;
    private final ObjectMapper objectMapper;


    @Autowired
    public CronJobScheduler(HearingRepository hearingRepository, RequestInfoGenerator requestInfoGenerator, SmsNotificationService smsNotificationService, Configuration config, DateUtil dateUtil, CaseUtil caseUtil, IndividualService individualService, MdmsUtil mdmsUtil, JsonUtil jsonUtil, ObjectMapper objectMapper) {
        this.hearingRepository = hearingRepository;
        this.requestInfoGenerator = requestInfoGenerator;
        this.smsNotificationService = smsNotificationService;
        this.config = config;
        this.caseUtil = caseUtil;
        this.executorService = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        this.dateUtil = dateUtil;
        this.individualService = individualService;
        this.mdmsUtil = mdmsUtil;
        this.jsonUtil = jsonUtil;
        this.objectMapper = objectMapper;
    }

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
               for(Individual advocate: advocates){
                   List<CourtCase> advocateCases = advocateCaseMap.get(advocate.getUserUuid());
                   Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsHeldToday(advocate, advocateCases, requestInfo));
                   futures.add(future);
               }

               // Send sms to litigants
                for(Individual litigant: litigants){
                    List<CourtCase> litigantCases = litigantCaseMap.get(litigant.getUserUuid());
                    Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsHeldToday(litigant, litigantCases, requestInfo));
                    futures.add(future);
                }

                // Wait for all tasks to complete
                handleFutureResults(futures);

                log.info("Completed Cron Job For Sending Hearing Update Notifications");

            } catch (Exception e) {
                log.error("Error occurred during notification processing", e);
            }
        }
    }

    public void sendNotificationForHearingsScheduledTomorrow(){
        if(config.getIsSMSEnabled()){
            String hearingLink = getHearingLink();
            if(hearingLink == null){
                log.error("VC link shortened URL not configured in MDMS Hearing master");
                return;
            }
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
                for(Individual advocate: advocates){
                    List<CourtCase> advocateCases = advocateCaseMap.get(advocate.getUserUuid());
                    Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsScheduledTomorrow(hearingLink, advocate, advocateCases, requestInfo));
                    futures.add(future);
                }

                // Send sms to litigants
                for(Individual litigant: litigants){
                    List<CourtCase> litigantCases = litigantCaseMap.get(litigant.getUserUuid());
                    Future<Boolean> future = executorService.submit(() -> sendSMSForHearingsScheduledTomorrow(hearingLink, litigant, litigantCases, requestInfo));
                    futures.add(future);
                }

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
            // In case of multiple hearings, case specific info is not sent so it suffices to extract info from the first case
            CourtCase firstCase = cases.get(0);
            String mobileNumber = individual.getMobileNumber();
            String cmpNumber = firstCase.getCmpNumber();
            String courtCaseNumber = firstCase.getCourtCaseNumber();
            String filingNumber = firstCase.getFilingNumber();
            Hearing hearing = getNextScheduledHearing(filingNumber, requestInfo);
            if(hearing == null){
                log.info("Hearing is not scheduled for this case, skipping SMS");
                return false;
            }
            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .tenantId(individual.getTenantId())
                    .caseCount(caseCount)
                    .cmpNumber(cmpNumber)
                    .courtCaseNumber(courtCaseNumber)
                    .hearingDate(String.valueOf(hearing.getStartTime()))
                    .build();

            String notificationCode;
            if(caseCount == 1){
                notificationCode = HEARINGS_HELD_TODAY_SINGLE;
                String nextHearingDate = getNextHearingDate(requestInfo, filingNumber);
                smsTemplateData.setHearingDate(nextHearingDate);
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

    private Boolean sendSMSForHearingsScheduledTomorrow(String hearingLink, Individual individual, List<CourtCase> cases, RequestInfo requestInfo) {
        log.info("Sending updates on hearings scheduled tomorrow");
        try{
            int caseCount = cases.size();
            // In case of multiple hearings, case specific info is not sent so it suffices to extract info from the first case
            CourtCase firstCase = cases.get(0);
            String mobileNumber = individual.getMobileNumber();
            String cmpNumber = firstCase.getCmpNumber();
            String courtCaseNumber = firstCase.getCourtCaseNumber();
            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .tenantId(individual.getTenantId())
                    .caseCount(caseCount)
                    .cmpNumber(cmpNumber)
                    .courtCaseNumber(courtCaseNumber)
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
        List<CourtCase> cases = new ArrayList<>();
        Set<String> filingNumbers = hearings.stream()
                .map(hearing -> hearing.getFilingNumber().get(0))
                .collect(Collectors.toSet());
        for(String filingNumber : filingNumbers){
            CaseCriteria caseCriteria = CaseCriteria.builder()
                    .filingNumber(filingNumber)
                    .defaultFields(false)
                    .build();
            CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(List.of(caseCriteria))
                    .build();

            JsonNode courtCaseNode = caseUtil.searchCaseDetails(caseSearchRequest);
            CourtCase courtCase = objectMapper.convertValue(courtCaseNode, CourtCase.class);
            cases.add(courtCase);
        }


        return cases;
    }


    private Map<String, List<CourtCase>> getAdvocateCaseMap(List<CourtCase> cases){
        Map<String, List<CourtCase>> advocateCaseMap = new LinkedHashMap<>(); //preserves order
        for(CourtCase courtCase : cases){
            if(courtCase.getRepresentatives() == null || courtCase.getRepresentatives().isEmpty()){
                log.info("Representatives list is null for case {}", courtCase.getFilingNumber());
                continue;
            }
            for(AdvocateMapping advocate: courtCase.getRepresentatives()){
                JsonNode advocateNode = objectMapper.convertValue(advocate, JsonNode.class);
                JsonNode additionalDetails = advocateNode.path("additionalDetails");
                if(additionalDetails.isMissingNode() || !additionalDetails.has("uuid")){
                    log.warn("Advocate missing uuid in additionalDetails for case {}", courtCase.getFilingNumber());
                    continue;
                }
                String uuid = additionalDetails.get("uuid").asText();

                advocateCaseMap
                        .computeIfAbsent(uuid, k -> new ArrayList<>())
                        .add(courtCase);
            }
        }

        return advocateCaseMap;
    }

    private Map<String, List<CourtCase>> getLitigantCaseMap(List<CourtCase> cases){
        Map<String, List<CourtCase>> litigantCaseMap = new LinkedHashMap<>(); //preserves order
        for(CourtCase courtCase : cases){
            if(courtCase.getLitigants() == null || courtCase.getLitigants().isEmpty()){
                log.info("Litigants list is null for case {}", courtCase.getFilingNumber());
                continue;
            }
            for(Party litigant: courtCase.getLitigants()){
                JsonNode litigantNode = objectMapper.convertValue(litigant, JsonNode.class);
                JsonNode additionalDetails = litigantNode.path("additionalDetails");
                if(additionalDetails.isMissingNode() || !additionalDetails.has("uuid")){
                    log.warn("Litigant missing uuid in additionalDetails for case {}", courtCase.getFilingNumber());
                    continue;
                }
                String uuid = additionalDetails.get("uuid").asText();

                litigantCaseMap
                        .computeIfAbsent(uuid, k -> new ArrayList<>())
                        .add(courtCase);
            }
        }

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

        List<Hearing> scheduledHearings = fetchHearings(requestInfo, hearingCriteria, null);
        if(scheduledHearings.isEmpty()){
            log.info("No scheduled hearings found for filing number {}", filingNumber);
            return null;
        }
        return scheduledHearings.get(0);
    }

    private String getNextHearingDate(RequestInfo requestInfo, String filingNumber) {
        HearingCriteria criteria = HearingCriteria.builder()
                .filingNumber(filingNumber)
                .status(SCHEDULED)
                .build();

        List<Hearing> hearings = fetchHearings(requestInfo, criteria, null);
        if(!hearings.isEmpty()){
            Long startTime = hearings.get(0).getStartTime();
            LocalDate nextHearingDate = dateUtil.getLocalDateFromEpoch(startTime);
            return String.valueOf(nextHearingDate);
        }
        return null;
    }

    private List<Hearing> getHearingsScheduledTomorrow(RequestInfo requestInfo){
        ZoneId zoneId = ZoneId.of(config.getZoneId());
        Long tomorrowStart = dateUtil.getEPochFromLocalDate(LocalDate.now(zoneId).plusDays(1));
        Long tomorrowEnd = dateUtil.getEPochFromLocalDate(LocalDate.now(zoneId).plusDays(2)) - 1L;
        HearingCriteria hearingCriteria = HearingCriteria.builder()
                .fromDate(tomorrowStart)
                .toDate(tomorrowEnd)
                .status(SCHEDULED)
                .build();

        return fetchHearings(requestInfo, hearingCriteria, null);
    }

    private String getHearingLink(){

        try {
            Map<String, Map<String, JSONArray>> mdmsResponse = mdmsUtil.fetchMdmsData(
            requestInfoGenerator.createInternalRequestInfo(),
            config.getTenantId(),
            HEARING_MODULE_NAME,
            Collections.singletonList(HEARING_LINK_MASTER_NAME));
            if (mdmsResponse == null || !mdmsResponse.containsKey(HEARING_MODULE_NAME)) {
                log.error("MDMS response is null or missing hearing module");
                return null;
            }

            Map<String, JSONArray> hearingModule = mdmsResponse.get(HEARING_MODULE_NAME);
            if (hearingModule == null || !hearingModule.containsKey(HEARING_LINK_MASTER_NAME)) {
                log.error("Hearing module is null or missing hearing link master");
                return null;
            }

            JSONArray hearingLinkArray = hearingModule.get(HEARING_LINK_MASTER_NAME);
            if (hearingLinkArray == null || hearingLinkArray.isEmpty()) {
                log.error("Hearing link array is null or empty");
                return null;
            }

            String shortenedUrl = jsonUtil.getNestedValue(hearingLinkArray.get(0), List.of("shortenedUrl"), String.class);

            if(shortenedUrl != null){
                log.info("VC link shortened url: {}", shortenedUrl);
                return shortenedUrl;
            }

            log.error("No shortened URL found in hearing link array");
            return null;

        } catch (Exception e) {
            log.error("Error fetching hearing link from MDMS", e);
            return null;
        }
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
