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
import digit.web.models.hearing.HearingUpdateBulkRequest;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    private ApplicationUtil applicationUtil;

    private FileStoreUtil fileStoreUtil;

    @Autowired
    public CauseListService(HearingRepository hearingRepository, CauseListRepository causeListRepository,
                            Producer producer, Configuration config, PdfServiceUtil pdfServiceUtil,
                            MdmsUtil mdmsUtil, ServiceConstants serviceConstants, HearingUtil hearingUtil,
                            CaseUtil caseUtil, DateUtil dateUtil, ObjectMapper objectMapper, ApplicationUtil applicationUtil, FileStoreUtil fileStoreUtil) {
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
        this.fileStoreUtil = fileStoreUtil;
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
            updateBulkHearing(causeLists);
        } else {
            log.info("No cause lists to be created");
        }
        log.info("operation = updateCauseListForTomorrow, result = SUCCESS");
    }

    private void submitTasks(ExecutorService executorService, List<String> courtIds, List<CauseList> causeLists) {
        for (String courtId : courtIds) {
            // Submit a task to the executor service for each judge
            executorService.submit(() -> generateCauseList(courtId, causeLists));
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

    private void generateCauseList(String courtId, List<CauseList> causeLists) {
        log.info("operation = generateCauseListForJudge, result = IN_PROGRESS, judgeId = {}", courtId);
        HearingSearchCriteria hearingSearchCriteria = HearingSearchCriteria.builder()
                .fromDate(dateUtil.getEpochFromLocalDateTime(LocalDateTime.now().toLocalDate().atStartOfDay()))
                .courtId(courtId)
                .build();
        List<Hearing> hearingList = getHearingsForCourt(hearingSearchCriteria);
        List<CauseList> causeList  = getCauseListFromHearings(hearingList);
        enrichCauseList(causeList);
        Map<String, List<CauseList>> hearingTypeMap = getHearingTypeMap(causeList);

        hearingTypeMap.forEach((hearingType, tempCauseList) -> {
         tempCauseList.sort(Comparator.comparing(CauseList::getCaseType)
                 .thenComparing(CauseList::getCaseRegistrationDate));
        });

        causeList.clear();
        hearingTypeMap.values().forEach(causeList::addAll);
        generateCauseListFromHearings(causeList);
        causeList.removeIf(a -> a.getSlot() == null);
        ByteArrayResource byteArrayResource = generateCauseListPdf(causeList);
        Document document = fileStoreUtil.saveDocumentToFileStore(byteArrayResource, config.getEgovStateTenantId());

        LocalDate localDate = dateUtil.getLocalDateFromEpoch(causeList.get(0).getStartTime());
        CauseListPdf causeListPdf = CauseListPdf.builder()
                .courtId(courtId)
                .judgeId("judge1")
                .fileStoreId(document.getFileStore())
                .date(localDate.toString())
                .build();

        producer.push(config.getCauseListPdfTopic(), causeListPdf);
        causeLists.addAll(causeList);
    }

    private Map<String, List<CauseList>> getHearingTypeMap(List<CauseList> causeList) {
        log.info("operation = fillHearingTimesWithDataFromMdms, result = IN_PROGRESS, judgeId = {}", causeList.get(0).getJudgeId());
        List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();
        Map<String, List<CauseList>> hearingTypePrioriyMap = new HashMap<>();
        for(CauseList cause : causeList) {
            Optional<MdmsHearing> optionalHearing = mdmsHearings.stream().filter(a -> a.getHearingType()
                    .equalsIgnoreCase(cause.getHearingType())).findFirst();
            if (optionalHearing.isPresent() && (optionalHearing.get().getHearingTime() != null)) {
                cause.setHearingTimeInMinutes(optionalHearing.get().getHearingTime());
                log.info("Minutes to be allotted {} for CauseList {}", cause.getHearingTimeInMinutes(),
                        cause.getId());
            }
            if(hearingTypePrioriyMap.containsKey(cause.getHearingType())) {
                hearingTypePrioriyMap.get(cause.getHearingType()).add(cause);
            } else {
                List<CauseList> causeLists = new ArrayList<>();
                causeLists.add(cause);
                hearingTypePrioriyMap.put(cause.getHearingType(), causeLists);
            }
        }
        log.info("operation = fillHearingTimesWithDataFromMdms, result = SUCCESS, judgeId = {}", causeList.get(0).getJudgeId());
        return hearingTypePrioriyMap;
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

    private void generateCauseListFromHearings(List<CauseList> causeList) {
        log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", causeList.get(0).getJudgeId());
        List<MdmsSlot> mdmsSlotList = getSlottingDataFromMdms();
        int currentSlotIndex = 0; // Track the current slot index
        int accumulatedTime = 0; // Track accumulated hearing time within the slot

        for(CauseList causeList1 : causeList){
            while(currentSlotIndex < mdmsSlotList.size()){
                MdmsSlot mdmsSlot = mdmsSlotList.get(currentSlotIndex);
                int hearingTime = causeList1.getHearingTimeInMinutes();

                if(accumulatedTime + hearingTime <= mdmsSlot.getSlotDuration()){
                    getCauseListFromHearingAndSlot(causeList1, mdmsSlot, accumulatedTime);
                    accumulatedTime += hearingTime;
                    break;
                } else {
                    currentSlotIndex++;
                    accumulatedTime = 0;
                }
                if (currentSlotIndex == mdmsSlotList.size()) {
                    MdmsSlot lastMdmsSlot = mdmsSlotList.get(mdmsSlotList.size() - 1);
                    getCauseListFromHearingAndSlot(causeList1, lastMdmsSlot, accumulatedTime);
                }
            }
        }
        log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", causeList.get(0).getJudgeId());
    }

    private void getCauseListFromHearingAndSlot(CauseList causeList, MdmsSlot mdmsSlot, int accumulatedTime) {
        Long slotStartTime = dateUtil.getEpochFromLocalDateTime(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.parse(mdmsSlot.getSlotStartTime())));
        long startTime = slotStartTime + (accumulatedTime * 60 * 1000);
        Long endTime = startTime + (causeList.getHearingTimeInMinutes() * 60 * 1000);
        causeList.setSlot(mdmsSlot.getSlotName());
        causeList.setStartTime(startTime);
        causeList.setEndTime(endTime);
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
        return generateCauseListPdf(causeLists);
    }

    public ByteArrayResource generateCauseListPdf(List<CauseList> causeLists){
        List<SlotList> slotLists;
        slotLists = buildSlotList(causeLists);
        setStartAndEndTimeForSlots(slotLists);
        SlotRequest slotRequest = SlotRequest.builder()
                .requestInfo(getRequestInfo())
                .slotList(slotLists)
                .build();
        return pdfServiceUtil.generatePdfFromPdfService(slotRequest, config.getEgovStateTenantId(), config.getCauseListPdfTemplateKey());
    }

    public List<SlotList> buildSlotList(List<CauseList> causeLists) {
        List<SlotList> slots = new ArrayList<>();
        List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();
        for (CauseList causeList : causeLists) {
            String slotName = causeList.getSlot();
            String hearingType = causeList.getHearingType();
            Optional<String> hearingNameOptional = mdmsHearings.stream()
                    .filter(a -> a.getHearingType().equals(causeList.getHearingType()))
                    .map(MdmsHearing::getHearingName)
                    .findFirst();
            SlotList existingSlot = findSlot(slots, slotName, hearingNameOptional.get());

            hearingType = hearingNameOptional.orElse(hearingType);
            if (existingSlot != null) {
                List<CauseList> mutableCauseLists = new ArrayList<>(existingSlot.getCauseLists());
                mutableCauseLists.add(causeList);
                existingSlot.setCauseLists(mutableCauseLists);
            } else {
                SlotList newSlot = SlotList.builder()
                        .slotName(slotName)
                        .hearingType(hearingType)
                        .causeLists(List.of(causeList)).build();
                slots.add(newSlot);
            }
        }

        return slots;
    }

    private SlotList findSlot(List<SlotList> slots, String slotName, String hearingType) {
        for (SlotList slot : slots) {
            if (slot.getSlotName().equals(slotName) && slot.getHearingType().equals(hearingType)) {
                return slot;
            }
        }
        return null;
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
                    .hearingDate(LocalDate.now().plusDays(1).toString())
                    .build();

            causeLists.add(causeList);
        }
        return causeLists;
    }

    public void setStartAndEndTimeForSlots(List<SlotList> slotLists){
        for(SlotList slotList : slotLists) {
            int size = slotList.getCauseLists().size();
            Long startTime = slotList.getCauseLists().get(0).getStartTime();
            Long endTime = slotList.getCauseLists().get(size - 1).getEndTime();
            LocalTime startDateTime = dateUtil.getLocalDateTimeFromEpoch(startTime).toLocalTime();
            LocalTime endDateTime = dateUtil.getLocalDateTimeFromEpoch(endTime).toLocalTime();

            slotList.setSlotStartTime(startDateTime.toString());
            slotList.setSlotEndTime(endDateTime.toString());
        }
    }

    public void enrichCauseList(List<CauseList> causeLists) {
        Iterator<CauseList> iterator = causeLists.iterator();
        while (iterator.hasNext()) {
            CauseList causeList = iterator.next();
            enrichCase(causeList);
            enrichApplication(causeList);
            if(causeList.getApplicationNumbers().isEmpty()) {
                iterator.remove();
            }
        }
    }

    public void enrichCase(CauseList causeList) {
        CaseCriteria criteria = CaseCriteria.builder().filingNumber(causeList.getFilingNumber()).build();
        SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                .RequestInfo(getRequestInfo())
                .criteria(Collections.singletonList(criteria))
                .build();

        JsonNode caseList = caseUtil.getCases(searchCaseRequest);
        if(caseList != null) {
            JsonNode representatives = caseList.get(0).get("representatives");
            JsonNode litigants = caseList.get(0).get("litigants");

            causeList.setCaseType(caseList.get(0).get("caseType").asText());
            causeList.setCaseTitle(caseList.get(0).get("caseTitle").asText());
            causeList.setCaseNumber(caseList.get(0).get("courtCaseNumber").asText());

            long registrationDate = caseList.get(0).get("registrationDate").asLong();
            causeList.setCaseRegistrationDate(dateUtil.getLocalDateFromEpoch(registrationDate).toString());

            List<AdvocateMapping> advocateMappings;
            List<Party> litigantsList;
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
        } else {
            log.error("Case not found for filing number: {}", causeList.getFilingNumber());
        }

    }

    public void enrichApplication(CauseList causeList) {
        ApplicationCriteria criteria = ApplicationCriteria.builder()
                .filingNumber(causeList.getFilingNumber())
                .status("PENDINGAPPROVAL")
                .build();
        ApplicationRequest applicationRequest = ApplicationRequest.builder()
                .requestInfo(getRequestInfo())
                .criteria(criteria)
                .build();

        JsonNode applicationList = applicationUtil.getApplications(applicationRequest);

        List<String> applicationNumbers = new ArrayList<>();
        if(applicationList != null) {
            for (JsonNode application : applicationList) {
                applicationNumbers.add(application.get("applicationNumber").asText());
            }
        }
        causeList.setApplicationNumbers(applicationNumbers);
    }

    private RequestInfo getRequestInfo() {
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(User.builder().tenantId(config.getEgovStateTenantId()).build());
        requestInfo.setMsgId("1725264118000|en_IN");
        return requestInfo;
    }

    public void updateBulkHearing(List<CauseList> causeLists) {
        List<Hearing> hearingList = new ArrayList<>();
        for(CauseList causeList: causeLists){
            Hearing hearing = Hearing.builder()
                    .id(causeList.getId())
                    .tenantId(causeList.getTenantId())
                    .hearingId(causeList.getHearingId())
                    .filingNumber(Collections.singletonList(causeList.getFilingNumber()))
                    .applicationNumbers(causeList.getApplicationNumbers())
                    .hearingType(causeList.getHearingType())
                    .status(causeList.getStatus())
                    .startTime(causeList.getStartTime())
                    .endTime(causeList.getEndTime())
                    .build();
            hearingList.add(hearing);
        }

        HearingUpdateBulkRequest updateBulkRequest = HearingUpdateBulkRequest.builder()
                .requestInfo(getRequestInfo())
                .hearings(hearingList)
                .build();
        hearingUtil.callHearing(updateBulkRequest);
    }
}
