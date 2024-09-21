package digit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.kafka.producer.Producer;
import digit.repository.CauseListRepository;
import digit.repository.HearingRepository;
import digit.util.*;
import digit.web.models.*;
import digit.web.models.cases.CaseCriteria;
import digit.web.models.cases.SearchCaseRequest;
import digit.web.models.hearing.Hearing;
import digit.web.models.hearing.HearingListSearchRequest;
import digit.web.models.hearing.HearingSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class CauseListService {

    private HearingRepository hearingRepository;

    private CauseListRepository causeListRepository;

    private Producer producer;

    private Configuration config;

    private PdfServiceUtil pdfServiceUtil;

    private MdmsUtil mdmsUtil;

    private ServiceConstants serviceConstants;

    private HearingUtil hearingUtil;

    private CaseUtil caseUtil;

    private DateUtil dateUtil;

    private ObjectMapper objectMapper;

    private final ApplicationUtil applicationUtil;

    @Autowired
    public CauseListService(HearingRepository hearingRepository, CauseListRepository causeListRepository,
                            Producer producer, Configuration config, PdfServiceUtil pdfServiceUtil,
                            MdmsUtil mdmsUtil, ServiceConstants serviceConstants, HearingUtil hearingUtil,
                            CaseUtil caseUtil, DateUtil dateUtil, ObjectMapper objectMapper, ApplicationUtil applicationUtil) {
        this.hearingRepository = hearingRepository;
        this.causeListRepository = causeListRepository;
        this.producer = producer;
        this.config =  config;
        this.pdfServiceUtil = pdfServiceUtil;
        this.mdmsUtil = mdmsUtil;
        this.serviceConstants = serviceConstants;
        this.hearingUtil = hearingUtil;
        this.caseUtil = caseUtil;
        this.dateUtil = dateUtil;
        this.objectMapper = objectMapper;
        this.applicationUtil = applicationUtil;
    }

    public void updateCauseListForTomorrow() {
        log.info("operation = updateCauseListForTomorrow, result = IN_PROGRESS");
        List<CauseList> causeLists = new ArrayList<>();
        //TODO get judges from db once tables are ready
        List<String> courtIds = new ArrayList<>();
        courtIds.add("court1");

        // Multi Thread processing: process 10 judges at a time
        ExecutorService executorService = Executors.newCachedThreadPool();

        // Submit tasks for each judge
        submitTasks(executorService, courtIds, causeLists);

        // Wait for all tasks to complete
        waitForTasksCompletion(executorService);

        if (!CollectionUtils.isEmpty(causeLists)) {
            CauseListResponse causeListResponse = CauseListResponse.builder()
                    .responseInfo(ResponseInfo.builder().build()).causeList(causeLists).build();
            producer.push(config.getCauseListInsertTopic(), causeListResponse);
        } else {
            log.info("No cause lists to be created");
        }
        log.info("operation = updateCauseListForTomorrow, result = SUCCESS");
    }

    private void submitTasks(ExecutorService executorService, List<String> courtIds, List<CauseList> causeLists) {
        for (String courtId : courtIds) {
            // Submit a task to the executor service for each judge
            executorService.submit(() -> generateCauseListForJudge(courtId, causeLists));
        }
    }

    private void waitForTasksCompletion(ExecutorService executorService) {
        executorService.shutdown();
        try {
            // Wait until all tasks are completed or timeout occurs
            executorService.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
        } catch (InterruptedException e) {
            log.error("Error occurred while waiting for task completion: {}", e.getMessage());
            Thread.currentThread().interrupt();
        }
    }

    private void generateCauseListForJudge(String courtId, List<CauseList> causeLists) {
        log.info("operation = generateCauseListForJudge, result = IN_PROGRESS, judgeId = {}", courtId);
        HearingSearchCriteria hearingSearchCriteria = HearingSearchCriteria.builder()
                .fromDate(LocalDate.now().atStartOfDay().plusDays(1).toLocalDate())
                .courtId(courtId)
                .build();
        List<Hearing> hearingList = getHearingsForCourt(hearingSearchCriteria);
        List<CauseList> causeList  = getCauseListFromHearings(hearingList);
        enrichCauseList(causeList);

    }

    private void fillHearingTimesWithDataFromMdms(List<ScheduleHearing> scheduleHearings) {
        log.info("operation = fillHearingTimesWithDataFromMdms, result = IN_PROGRESS, judgeId = {}", scheduleHearings.get(0).getJudgeId());
        List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();
//        for (ScheduleHearing scheduleHearing : scheduleHearings) {
//            Optional<MdmsHearing> optionalHearing = mdmsHearings.stream().filter(a -> a.getHearingName()
//                    .equalsIgnoreCase(scheduleHearing.getEventType().getValue())).findFirst();
//            if (optionalHearing.isPresent() && (optionalHearing.get().getHearingTime() != null)) {
//                scheduleHearing.setHearingTimeInMinutes(optionalHearing.get().getHearingTime());
//                log.info("Minutes to be allotted {} for Schedule Hearing {}", scheduleHearing.getHearingTimeInMinutes(),
//                        scheduleHearing.getHearingBookingId());
//            }
//        }
        log.info("operation = fillHearingTimesWithDataFromMdms, result = SUCCESS, judgeId = {}", scheduleHearings.get(0).getJudgeId());
    }

    private List<MdmsHearing> getHearingDataFromMdms() {
        log.info("operation = getHearingDataFromMdms, result = IN_PROGRESS");
        RequestInfo requestInfo = new RequestInfo();
        Map<String, Map<String, JSONArray>> defaultHearingsData =
                mdmsUtil.fetchMdmsData(requestInfo, config.getEgovStateTenantId(),
                        serviceConstants.DEFAULT_COURT_MODULE_NAME,
                        Collections.singletonList(serviceConstants.DEFAULT_HEARING_MASTER_NAME));
        JSONArray jsonArray = defaultHearingsData.get("court").get("hearings");
        List<MdmsHearing> mdmsHearings = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();
        for (Object obj : jsonArray) {
            MdmsHearing hearing = objectMapper.convertValue(obj, MdmsHearing.class);
            mdmsHearings.add(hearing);
        }
        log.info("operation = getHearingDataFromMdms, result = SUCCESS");
        return mdmsHearings;
    }

    private void generateCauseListFromHearings(List<ScheduleHearing> scheduleHearings, List<CauseList> causeLists) {
        log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", scheduleHearings.get(0).getJudgeId());
        List<MdmsSlot> mdmsSlotList = getSlottingDataFromMdms();
//        scheduleHearings.sort(Comparator.comparing(ScheduleHearing::getEventType));
        int currentSlotIndex = 0; // Track the current slot index
        int accumulatedTime = 0; // Track accumulated hearing time within the slot

        for (ScheduleHearing hearing : scheduleHearings) {
            while (currentSlotIndex < mdmsSlotList.size()) {
                MdmsSlot mdmsSlot = mdmsSlotList.get(currentSlotIndex);
                int hearingTime = hearing.getHearingTimeInMinutes();

                if (accumulatedTime + hearingTime <= mdmsSlot.getSlotDuration()) {
                    CauseList causeList = getCauseListFromHearingAndSlot(hearing, mdmsSlot);
                    causeLists.add(causeList);
                    accumulatedTime += hearingTime;
                    break; // Move to the next hearing
                } else {
                    // Move to the next mdmsSlot
                    currentSlotIndex++;
                    accumulatedTime = 0; // Reset accumulated time for the new mdmsSlot
                }
            }

            if (currentSlotIndex == mdmsSlotList.size()) {
                // Add remaining cases to the last slot
                MdmsSlot lastMdmsSlot = mdmsSlotList.get(mdmsSlotList.size() - 1);
                CauseList causeList = getCauseListFromHearingAndSlot(hearing, lastMdmsSlot);
                causeLists.add(causeList);
            }
        }
        log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", scheduleHearings.get(0).getJudgeId());
    }

    private static CauseList getCauseListFromHearingAndSlot(ScheduleHearing hearing, MdmsSlot mdmsSlot) {
        log.info("Added hearing {} to slot {}", hearing.getHearingBookingId(), mdmsSlot.getSlotName());
        return CauseList.builder()
                .judgeId(hearing.getJudgeId())
                .courtId(hearing.getCourtId())
                .tenantId(hearing.getTenantId())
                .caseTitle(hearing.getTitle())
                .build();
    }


    private List<MdmsSlot> getSlottingDataFromMdms() {
        log.info("operation = getSlottingDataFromMdms, result = IN_PROGRESS");
        RequestInfo requestInfo = new RequestInfo();
        Map<String, Map<String, JSONArray>> defaultHearingsData =
                mdmsUtil.fetchMdmsData(requestInfo, config.getEgovStateTenantId(),
                        serviceConstants.DEFAULT_COURT_MODULE_NAME,
                        Collections.singletonList(serviceConstants.DEFAULT_SLOTTING_MASTER_NAME));
        JSONArray jsonArray = defaultHearingsData.get("court").get("slots");
        List<MdmsSlot> mdmsSlots = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();
        for (Object obj : jsonArray) {
            MdmsSlot mdmsSlot = objectMapper.convertValue(obj, MdmsSlot.class);
            mdmsSlots.add(mdmsSlot);
        }
        log.info("operation = getSlottingDataFromMdms, result = SUCCESS");
        return mdmsSlots;
    }

    public List<CauseList> viewCauseListForTomorrow(CauseListSearchRequest searchRequest) {
        log.info("operation = viewCauseListForTomorrow, with searchRequest : {}", searchRequest.toString());
        return getCauseListForTomorrow(searchRequest.getCauseListSearchCriteria());
    }

    private List<CauseList> getCauseListForTomorrow(CauseListSearchCriteria searchCriteria) {
        if (searchCriteria != null && searchCriteria.getSearchDate() != null
                && searchCriteria.getSearchDate().isAfter(LocalDate.now().plusDays(1))) {
            throw new CustomException("DK_CL_APP_ERR", "CauseList Search date cannot be after than tomorrow");
        }
        return causeListRepository.getCauseLists(searchCriteria);
    }

    public ByteArrayResource downloadCauseListForTomorrow(CauseListSearchRequest searchRequest) {
        log.info("operation = downloadCauseListForTomorrow, with searchRequest : {}", searchRequest.toString());
        List<CauseList> causeLists = getCauseListForTomorrow(searchRequest.getCauseListSearchCriteria());
        CauseListRequest causeListRequest = CauseListRequest.builder()
                .requestInfo(searchRequest.getRequestInfo()).causeList(causeLists).build();
        return pdfServiceUtil.generatePdfFromPdfService(causeListRequest , searchRequest.getRequestInfo().getUserInfo().getTenantId(),
                config.getCauseListPdfTemplateKey());
    }

    public List<Hearing> getHearingsForCourt(HearingSearchCriteria hearingSearchCriteria) {
        RequestInfo requestInfo = new RequestInfo();
        HearingListSearchRequest hearingListSearchRequest = HearingListSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(hearingSearchCriteria)
                .build();

        return hearingUtil.fetchHearing(hearingListSearchRequest);
    }

    public List<CauseList> getCauseListFromHearings(List<Hearing> hearingList) {
        List<CauseList> causeLists = new ArrayList<>();
        for (Hearing hearing : hearingList) {
            CauseList causeList = CauseList.builder()
                    .id(hearing.getId())
                    .tenantId(hearing.getTenantId())
                    .hearingId(hearing.getHearingId())
                    .filingNumber(hearing.getFilingNumber().get(0))
                    .cnrNumbers(hearing.getCnrNumbers())
                    .applicationNumbers(hearing.getApplicationNumbers())
                    .hearingType(hearing.getHearingType())
                    .status(hearing.getStatus())
                    .startTime(hearing.getStartTime())
                    .endTime(hearing.getEndTime())
                    .presidedBy(hearing.getPresidedBy())
                    .attendees(hearing.getAttendees())
                    .transcript(hearing.getTranscript())
                    .vcLink(hearing.getVcLink())
                    .isActive(hearing.getIsActive())
                    .documents(hearing.getDocuments())
                    .additionalDetails(hearing.getAdditionalDetails())
                    .auditDetails(hearing.getAuditDetails())
                    .workflow(hearing.getWorkflow())
                    .notes(hearing.getNotes())
                    .build();

            causeLists.add(causeList);
        }
        return causeLists;
    }

    public void enrichCauseList(List<CauseList> causeLists) {
        for (CauseList causeList : causeLists) {
            enrinchCase(causeList);
            enrichApplication(causeList);
        }
    }

    public void enrinchCase(CauseList causeList) {
        CaseCriteria criteria = CaseCriteria.builder().filingNumber(causeList.getFilingNumber()).build();
        SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                .RequestInfo(RequestInfo.builder().build())
                .criteria(Collections.singletonList(criteria))
                .build();

        JsonNode caseList = caseUtil.getCases(searchCaseRequest);
        JsonNode representatives = caseList.get(0).get("representatives");
        JsonNode litigants = caseList.get(0).get("litigants");

        causeList.setCaseType(caseList.get(0).get("caseType").asText());
        causeList.setCaseTitle(caseList.get(0).get("caseTitle").asText());
        causeList.setCaseNumber(caseList.get(0).get("courtCaseNumber").asText());

        long registrationDate = caseList.get(0).get("registrationDate").asLong();
        causeList.setCaseRegistrationDate(dateUtil.getLocalDateFromEpoch(registrationDate).toString());

        List<AdvocateMapping> advocateMappings = new ArrayList<>();
        List<Party> litigantsList = new ArrayList<>();
        try {
            advocateMappings = objectMapper.readValue(representatives.toString(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, AdvocateMapping.class));
            litigantsList = objectMapper.readValue(litigants.toString(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Party.class));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        causeList.setRepresentatives(advocateMappings);
        causeList.setLitigants(litigantsList);

    }

    public void enrichApplication(CauseList causeList) {
        RequestInfo requestInfo = RequestInfo.builder().build();
        ApplicationCriteria criteria = ApplicationCriteria.builder()
                .filingNumber(causeList.getFilingNumber())
                .status("PENDINGAPPROVAL")
                .build();
        ApplicationRequest applicationRequest = ApplicationRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();

        JsonNode applicationList = applicationUtil.getApplications(applicationRequest);

        List<String> applicationNumbers = new ArrayList<>();
        for(JsonNode application : applicationList){
            applicationNumbers.add(application.get("applicationNumber").asText());
        }
        causeList.setApplicationNumbers(applicationNumbers);
    }
}
