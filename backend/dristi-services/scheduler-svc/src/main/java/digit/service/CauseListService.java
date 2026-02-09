package digit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.kafka.producer.Producer;
import digit.repository.CauseListRepository;
import digit.repository.HearingRepository;
import digit.util.*;
import digit.web.models.*;
import digit.web.models.cases.CaseCriteria;
import digit.web.models.cases.SearchCaseRequest;
import digit.web.models.hearing.*;
import digit.web.models.inbox.InboxRequest;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.models.individual.Individual;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.ResourceAccessException;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

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
    private UserService userService;
    private CauseListEmailService causeListEmailService;

    private IndividualService individualService;

    private SmsNotificationService notificationService;

    private InboxUtil inboxUtil;

    private EsUtil esUtil;

    @Autowired
    public CauseListService(HearingRepository hearingRepository, CauseListRepository causeListRepository,
                            Producer producer, Configuration config, PdfServiceUtil pdfServiceUtil,
                            MdmsUtil mdmsUtil, ServiceConstants serviceConstants, HearingUtil hearingUtil,
                            CaseUtil caseUtil, DateUtil dateUtil, ObjectMapper objectMapper, ApplicationUtil applicationUtil,
                            FileStoreUtil fileStoreUtil, UserService userService, IndividualService individualService, SmsNotificationService notificationService,
                            CauseListEmailService causeListEmailService, InboxUtil inboxUtil, EsUtil esUtil) {
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
        this.userService = userService;
        this.individualService = individualService;
        this.notificationService = notificationService;
        this.causeListEmailService = causeListEmailService;
        this.inboxUtil = inboxUtil;
        this.esUtil = esUtil;
    }

    public void updateCauseListForTomorrow() {
        log.info("operation = updateCauseListForTomorrow, result = IN_PROGRESS");
        List<CauseList> causeLists = new ArrayList<>();
        //TODO get judges from db once tables are ready
        List<String> courtIds = new ArrayList<>();
        courtIds.add(config.getCourtId());

        // Multi Thread processing: process 10 judges at a time
        ExecutorService executorService = Executors.newCachedThreadPool();

        // Submit tasks for each judge
        submitTasks(executorService, courtIds, causeLists);

        // Wait for all tasks to complete
        waitForTasksCompletion(executorService);

        if (!CollectionUtils.isEmpty(causeLists)) {
            RequestInfo requestInfo = createInternalRequestInfo();
            CauseListRequest causeListRequest = CauseListRequest.builder().requestInfo(requestInfo)
                    .causeList(causeLists).build();

            producer.push(config.getCauseListInsertTopic(), causeListRequest);
            updateBulkHearing(causeLists);
        } else {
            log.info("No cause lists to be created");
        }
        log.info("operation = updateCauseListForTomorrow, result = SUCCESS");
    }

    private void submitTasks(ExecutorService executorService, List<String> courtIds, List<CauseList> causeLists) {
        for (String courtId : courtIds) {
            // Submit a task to the executor service for each judge
            executorService.submit(() -> generateCauseList(courtId, causeLists, null, null));
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

    public void generateCauseList(String courtId, List<CauseList> causeLists, String hearingDate, String uuid) {
        log.info("operation = generateCauseListForJudge, result = IN_PROGRESS, judgeId = {}", courtId);
        try {
            InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(courtId, getFromDate(hearingDate),getToDate(hearingDate) );
            log.info("inboxRequest = {}", inboxRequest.toString());
            List<OpenHearing> openHearings = inboxUtil.getOpenHearings(inboxRequest);

            List<CauseList> causeList  = getCauseListFromHearings(openHearings);
            setHearingTime(causeList);

            enrichCauseList(causeList);

            generateCauseListFromHearings(causeList);
            ByteArrayResource byteArrayResource = generateCauseListPdf(causeList);
            Document document = fileStoreUtil.saveDocumentToFileStore(byteArrayResource, config.getEgovStateTenantId());

            CauseListPdf causeListPdf = CauseListPdf.builder()
                    .courtId(config.getCourtId())
                    .tenantId(config.getEgovStateTenantId())
                    .judgeId(causeList.get(0).getJudgeId())
                    .fileStoreId(document.getFileStore())
                    .date(dateUtil.getLocalDateFromEpoch(causeList.get(0).getStartTime()).toString())
                    .createdTime(dateUtil.getEpochFromLocalDateTime(LocalDateTime.now()))
                    .createdBy(uuid == null ? serviceConstants.SYSTEM_ADMIN : uuid)
                    .build();

            RequestInfo requestInfo = createInternalRequestInfo();
            CauseListPdfRequest causeListPdfRequest = CauseListPdfRequest.builder().requestInfo(requestInfo).causeListPdf(causeListPdf).build();

            producer.push(config.getCauseListPdfTopic(), causeListPdfRequest);

            LocalDate causeListDate = dateUtil.getLocalDateFromEpoch(causeList.get(0).getStartTime());
            try {

                causeListEmailService.sendCauseListEmail(
                        document.getFileStore(),
                        causeListDate,
                        requestInfo,
                        causeList.get(0).getTenantId()
                );
            } catch (Exception e) {
                log.error("Failed to send cause list email for date: {}, error: {}", causeListDate.toString(), e.getMessage(), e);
            }


            for (OpenHearing hearing : openHearings) {
                if (hearing.getFilingNumber()!=null) {
                    callNotificationService(hearing.getFilingNumber(),requestInfo,hearingDate);
                }
            }
            causeLists.addAll(causeList);

            log.info("Update open hearing index with serialNumber");
            esUtil.updateOpenHearingSerialNumber(openHearings);

            log.info("operation = generateCauseListForJudge, result = SUCCESS, judgeId = {}", courtId);
        } catch (Exception e) {
            log.error("operation = generateCauseListForJudge, result = FAILURE, judgeId = {}, error = {}", courtId, e.getMessage(), e);
        }
    }

    private Long getToDate(String hearingDate) {
        return hearingDate == null
                ? dateUtil.getEpochFromLocalDateTime(LocalDateTime.now().toLocalDate().plusDays(1).atTime(LocalTime.MAX))
                : dateUtil.getEpochFromLocalDateTime(LocalDate.parse(hearingDate).atTime(LocalTime.MAX));
    }

    private Long getFromDate(String hearingDate) {
        return hearingDate == null
                ? dateUtil.getEpochFromLocalDateTime(LocalDateTime.now().toLocalDate().plusDays(1).atStartOfDay())
                : dateUtil.getEpochFromLocalDateTime(LocalDate.parse(hearingDate).atStartOfDay());
    }


    public List<CaseType> getCaseTypeMap() {
        log.info("operation = getCaseTypeMap, result = IN_PROGRESS");
        List<CaseType> caseTypeList = new ArrayList<>();
        try {
            caseTypeList = causeListRepository.getCaseTypes();
            caseTypeList.sort(Comparator.comparing(CaseType::getPriority));
        } catch (Exception e) {
            log.error("operation = getCaseTypeMap, result = FAILURE, error = {}", e.getMessage(), e);
        }
        return caseTypeList;
    }
    private void setHearingTime(List<CauseList> causeLists) {
        log.info("operation = getHearingTypePriority, result = IN_PROGRESS");
        try {
            List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();

            for(CauseList cause: causeLists){
                Optional<MdmsHearing> optionalHearing = mdmsHearings.stream().filter(a -> a.getHearingType()
                        .equalsIgnoreCase(cause.getHearingType())).findFirst();
                if (optionalHearing.isPresent() && (optionalHearing.get().getHearingTime() != null)) {
                    cause.setHearingTimeInMinutes(optionalHearing.get().getHearingTime());
                    log.info("Minutes to be allotted {} for CauseList {}", cause.getHearingTimeInMinutes(),
                            cause.getId());
                }
            }
            log.info("operation = getHearingTypePriority, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = getHearingTypePriority, result = FAILURE, error = {}", e.getMessage(), e);
        }
    }

    private List<MdmsHearing> getHearingDataFromMdms() {
        log.info("operation = getHearingDataFromMdms, result = IN_PROGRESS");
        List<MdmsHearing> mdmsHearings = new ArrayList<>();
        try {
            RequestInfo requestInfo = new RequestInfo();
            Map<String, Map<String, JSONArray>> defaultHearingsData =
                    mdmsUtil.fetchMdmsData(requestInfo, config.getEgovStateTenantId(),
                            serviceConstants.DEFAULT_COURT_MODULE_NAME,
                            Collections.singletonList(serviceConstants.DEFAULT_HEARING_MASTER_NAME));
            JSONArray jsonArray = defaultHearingsData.get(serviceConstants.DEFAULT_COURT_MODULE_NAME).get(serviceConstants.DEFAULT_HEARING_MASTER_NAME);
            ObjectMapper objectMapper = new ObjectMapper();
            for (Object obj : jsonArray) {
                MdmsHearing hearing = objectMapper.convertValue(obj, MdmsHearing.class);
                mdmsHearings.add(hearing);
            }
            log.info("operation = getHearingDataFromMdms, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = getHearingDataFromMdms, result = FAILURE, error = {}", e.getMessage(), e);
        }
        return mdmsHearings;
    }

    private void generateCauseListFromHearings(List<CauseList> causeList) {
        log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", causeList.get(0).getJudgeId());
        try {
            List<MdmsSlot> mdmsSlotList = getSlottingDataFromMdms();
            Collections.reverse(mdmsSlotList);int currentSlotIndex = 0; // Track the current slot index
            int accumulatedTime = 0; // Track accumulated hearing time within the slot
            int causeListIndex = 0;

            while(currentSlotIndex<mdmsSlotList.size() && causeListIndex<causeList.size()) {
                MdmsSlot currentSlot = mdmsSlotList.get(currentSlotIndex);
                CauseList causeListItem = causeList.get(causeListIndex);
                int hearingDuration = causeListItem.getHearingTimeInMinutes();
                // If the hearing can be accommodated in the current slot, place it here
                if(accumulatedTime + hearingDuration <= currentSlot.getSlotDuration()){
                    getCauseListFromHearingAndSlot(causeListItem, currentSlot, accumulatedTime);
                    accumulatedTime += hearingDuration;
                    causeListIndex++;
                }
                // Hearing cannot be accommodated in this slot, so go to the next slot and reset the available time
                else{
                    currentSlotIndex++;
                    accumulatedTime = 0;
                }
            }

            // If there are any hearings left after running out of slots, place them in the last slot
            if(causeListIndex < causeList.size()){
                log.warn("Placing {} overflown causeList items in the end of last available slot", causeList.size() - causeListIndex);
                MdmsSlot lastSlot = mdmsSlotList.get(mdmsSlotList.size() - 1);
                accumulatedTime = lastSlot.getSlotDuration();
                while(causeListIndex<causeList.size()) {
                    CauseList causeListItem = causeList.get(causeListIndex);
                    getCauseListFromHearingAndSlot(causeListItem, lastSlot, accumulatedTime);
                    causeListIndex++;
                }
            }
            log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", causeList.get(0).getJudgeId());
        } catch (Exception e) {
            log.error("operation = generateCauseListFromHearings, result = FAILURE, judgeId = {}, error = {}", causeList.get(0).getJudgeId(), e.getMessage(), e);
        }
    }

    private void getCauseListFromHearingAndSlot(CauseList causeList, MdmsSlot mdmsSlot, int accumulatedTime) {
        Long slotStartTime = dateUtil.getEpochFromLocalDateTime(LocalDateTime.of(dateUtil.getLocalDateFromEpoch(causeList.getStartTime()), LocalTime.parse(mdmsSlot.getSlotStartTime())));
        long startTime = slotStartTime + ((long) accumulatedTime * 60 * 1000);
        Long endTime = startTime + (causeList.getHearingTimeInMinutes() * 60 * 1000);
        causeList.setSlot(mdmsSlot.getSlotName());
        causeList.setStartTime(startTime);
        causeList.setEndTime(endTime);
    }


    private List<MdmsSlot> getSlottingDataFromMdms() {
        log.info("operation = getSlottingDataFromMdms, result = IN_PROGRESS");
        List<MdmsSlot> mdmsSlots = new ArrayList<>();
        try {
            RequestInfo requestInfo = new RequestInfo();
            Map<String, Map<String, JSONArray>> defaultHearingsData =
                    mdmsUtil.fetchMdmsData(requestInfo, config.getEgovStateTenantId(),
                            serviceConstants.DEFAULT_COURT_MODULE_NAME,
                            Collections.singletonList(serviceConstants.DEFAULT_SLOTTING_MASTER_NAME));
            JSONArray jsonArray = defaultHearingsData.get("court").get("slots");
            ObjectMapper objectMapper = new ObjectMapper();
            for (Object obj : jsonArray) {
                MdmsSlot mdmsSlot = objectMapper.convertValue(obj, MdmsSlot.class);
                mdmsSlots.add(mdmsSlot);
            }
            log.info("operation = getSlottingDataFromMdms, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = getSlottingDataFromMdms, result = FAILURE, error = {}", e.getMessage(), e);
        }
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

    public List<String> getFileStoreForCauseList(CauseListSearchCriteria searchCriteria) {
        if (searchCriteria != null && searchCriteria.getSearchDate() != null
                && searchCriteria.getSearchDate().isAfter(LocalDate.now().plusDays(1))) {
            throw new CustomException("DK_CL_APP_ERR", "CauseList Search date cannot be after than tomorrow");
        }
        return causeListRepository.getCauseListFileStore(searchCriteria);
    }
    public ByteArrayResource downloadCauseListForTomorrow(CauseListSearchRequest searchRequest) {
        log.info("operation = downloadCauseListForTomorrow, with searchRequest : {}", searchRequest.toString());
        List<String> fileStoreIds = getFileStoreForCauseList(searchRequest.getCauseListSearchCriteria());
        if(CollectionUtils.isEmpty(fileStoreIds)){
            throw new CustomException("DK_CL_APP_ERR", "No CauseList found for the given search criteria");
        }
        byte[] pdfBytes = fileStoreUtil.getFile(config.getEgovStateTenantId(), fileStoreIds.get(0));
        return new ByteArrayResource(pdfBytes);
    }

    public ByteArrayResource generateCauseListPdf(List<CauseList> causeLists){
        log.info("operation = generateCauseListPdf, result = IN_PROGRESS");
        ByteArrayResource byteArrayResource = null;
        try {
           List<SlotList> slotLists;
           slotLists = buildSlotList(causeLists);
           for(SlotList slotList : slotLists){
               addIndexing(slotList.getCauseLists());
           }
            Map<String, List<SlotList>> groupedSlots = slotLists.stream()
                    .collect(Collectors.groupingBy(SlotList::getSlotName));

           List<HearingListPriority> hearingListPriorities = groupedSlots.entrySet().stream()
                   .map(entry -> {
                          List<SlotList> slotList = entry.getValue();
                          return HearingListPriority.builder()
                                 .slotName(entry.getKey())
                                 .slotList(slotList)
                                 .slotStartTime(slotList.get(0).getSlotStartTime())
                                 .slotEndTime(slotList.get(0).getSlotEndTime())
                                 .build();
                   })
                   .toList();

           SlotRequest slotRequest = SlotRequest.builder()
                   .requestInfo(createInternalRequestInfo())
                   .hearingListPriority(hearingListPriorities).build();

           byteArrayResource =  pdfServiceUtil.generatePdfFromPdfService(slotRequest, config.getEgovStateTenantId(), config.getCauseListPdfTemplateKey());
           log.info("operation = generateCauseListPdf, result = SUCCESS");
        } catch (Exception e) {
            log.error("Error occurred while generating pdf: {}", e.getMessage());
        }
        return byteArrayResource;
    }

    public void addIndexing(List<CauseList> causeLists){
        for(CauseList causeList: causeLists){
            causeList.setIndex(causeLists.indexOf(causeList) + 1);
        }
    }
    public List<SlotList> buildSlotList(List<CauseList> causeLists) {
        List<SlotList> slots = new ArrayList<>();
        List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();
        List<MdmsSlot> mdmsSlots = getSlottingDataFromMdms();
        for (CauseList causeList : causeLists) {
            String slotName = causeList.getSlot();
            if(slotName == null)continue;
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
                Optional<MdmsSlot> slot = mdmsSlots.stream()
                        .filter(s -> slotName.equalsIgnoreCase(s.getSlotName()))
                        .findFirst();
                String slotStartTime = slot.map(MdmsSlot::getSlotStartTime).orElse("17:00:00");
                String slotEndTime = slot.map(MdmsSlot::getSlotEndTime).orElse("17:00:00");
                SlotList newSlot = SlotList.builder()
                        .slotName(slotName)
                        .slotStartTime(slotStartTime)
                        .slotEndTime(slotEndTime)
                        .courtId(config.getCourtName())
                        .hearingType(hearingType)
                        .judgeName(config.getJudgeName())
                        .judgeDesignation(config.getJudgeDesignation())
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
        log.info("operation = getHearingsForCourt, result = IN_PROGRESS, courtId = {}", hearingSearchCriteria.getCourtId());
        List<Hearing> hearings = new ArrayList<>();
        try {
            RequestInfo requestInfo = new RequestInfo();
            HearingListSearchRequest hearingListSearchRequest = HearingListSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(hearingSearchCriteria)
                    .build();
            hearings = hearingUtil.fetchHearing(hearingListSearchRequest);
        } catch (Exception e) {
            log.error("Error occurred while fetching hearings for court: {}", e.getMessage());
        }
        return hearings;
    }

    public List<CauseList> getCauseListFromHearings(List<OpenHearing> hearingList) {
        List<CauseList> causeLists = new ArrayList<>();
        int serialNumber = 1;
        for (OpenHearing hearing : hearingList) {
            CauseList causeList = CauseList.builder()
                    .id(UUID.fromString(hearing.getHearingUuid()))
                    .tenantId(hearing.getTenantId())
                    .hearingId(hearing.getHearingNumber())
                    .filingNumber(hearing.getFilingNumber())
                    .caseNumber(hearing.getCaseNumber())
                    .hearingType(hearing.getHearingType())
                    .status(hearing.getStatus())
                    .startTime(hearing.getFromDate())
                    .endTime(hearing.getToDate())
                    .courtId(config.getCourtId())
                    .judgeName(config.getJudgeName())
                    .judgeDesignation(config.getJudgeDesignation())
                    .hearingDate(dateUtil.getLocalDateFromEpoch(hearing.getFromDate()).format(DateTimeFormatter.ofPattern(DATE_FORMAT)))
                    .build();

            causeLists.add(causeList);
            hearing.setSerialNumber(serialNumber++);
        }
        return causeLists;
    }

    public void enrichCauseList(List<CauseList> causeLists) {
        for(CauseList causeList: causeLists) {
            enrichCase(causeList);
            enrichApplication(causeList);
        }
    }

    public void enrichCase(CauseList causeList) {
        log.info("operation = enrichCase, result = IN_PROGRESS, filingNumber = {}", causeList.getFilingNumber());
        try {
            CaseCriteria criteria = CaseCriteria.builder().filingNumber(causeList.getFilingNumber()).build();
            SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                    .RequestInfo(createInternalRequestInfo())
                    .tenantId(config.getEgovStateTenantId())
                    .criteria(Collections.singletonList(criteria))
                    .flow(FLOW_JAC)
                    .build();

            JsonNode caseList = caseUtil.getCases(searchCaseRequest);
            if(caseList != null) {
                JsonNode representatives = caseList.get(0).get("representatives");
                JsonNode litigants = caseList.get(0).get("litigants");


                causeList.setCaseId(caseList.get(0).get("id").isNull() ? null : caseList.get(0).get("id").asText());
                causeList.setCaseType(caseList.get(0).get("caseType").isNull() ? null : caseList.get(0).get("caseType").asText());
                causeList.setCaseTitle(caseList.get(0).get("caseTitle").isNull() ? null : caseList.get(0).get("caseTitle").asText());

                long registrationDate = caseList.get(0).get("registrationDate").asLong();
                causeList.setCaseRegistrationDate(registrationDate);

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
                causeList.setRepresentatives(advocateMappings != null ? advocateMappings : new ArrayList<>());
                causeList.setLitigants(litigantsList != null ? litigantsList : new ArrayList<>());

                List<String> complainantAdvocates = new ArrayList<>();
                List<String> respondentAdvocates = new ArrayList<>();
                assert litigantsList != null;
                for(Party party: litigantsList) {
                    assert advocateMappings != null;
                    AdvocateMapping advocateDetails= isAdvocatePresent(party.getIndividualId(), advocateMappings);
                    if(party.getPartyType().equals(serviceConstants.COMPLAINANT)) {
                        if (advocateDetails != null) {
                            LinkedHashMap advocate = ((LinkedHashMap) advocateDetails.getAdditionalDetails());
                            complainantAdvocates.add(advocate.get(serviceConstants.ADVOCATE_NAME).toString());
                        }
                    }
                    else if(party.getPartyType().equals(serviceConstants.RESPONDENT)) {
                        if (advocateDetails != null) {
                            LinkedHashMap advocate = ((LinkedHashMap) advocateDetails.getAdditionalDetails());
                            respondentAdvocates.add(advocate.get(serviceConstants.ADVOCATE_NAME).toString());
                        }
                    }

                }

                if(complainantAdvocates.isEmpty()){
                    complainantAdvocates.add("");
                }
                if(respondentAdvocates.isEmpty()){
                    respondentAdvocates.add("");
                }
                causeList.setComplainantAdvocates(complainantAdvocates);
                causeList.setRespondentAdvocates(respondentAdvocates);

                List<String> advocateNames = new ArrayList<>();
                advocateNames.addAll(complainantAdvocates);
                advocateNames.addAll(respondentAdvocates);
                causeList.setAdvocateNames(advocateNames);

                log.info("operation = enrichCase, result = SUCCESS, filingNumber = {}", causeList.getFilingNumber());
            }
        } catch (Exception e) {
            log.error("Error occurred while fetching case for filing number: {}", causeList.getFilingNumber());
        }
    }

    private AdvocateMapping isAdvocatePresent(String individualId, List<AdvocateMapping> representatives) {
        for(AdvocateMapping advocateMapping: representatives) {
            if(advocateMapping.getRepresenting().stream().anyMatch(a -> a.getIndividualId().equals(individualId))) {
                return advocateMapping;
            }
        }
        return null;
    }
    public void enrichApplication(CauseList causeList) {
        log.info("operation = enrichApplication, result = IN_PROGRESS, filingNumber = {}", causeList.getFilingNumber());

        List<String> applicationNumbers = new ArrayList<>();

        for (String status : List.of(serviceConstants.APPLICATION_STATE, serviceConstants.APPLICATION_PENDING_REVIEW_STATE)) {
            ApplicationCriteria criteria = ApplicationCriteria.builder()
                    .filingNumber(causeList.getFilingNumber())
                    .tenantId(config.getEgovStateTenantId())
                    .status(status)
                    .build();
            ApplicationRequest applicationRequest = ApplicationRequest.builder()
                    .requestInfo(createInternalRequestInfo())
                    .criteria(criteria)
                    .build();

            try {
                JsonNode applicationList = applicationUtil.getApplications(applicationRequest);

                if(applicationList != null) {
                    for (JsonNode application : applicationList) {
                        if(!DELAY_CONDONATION.equalsIgnoreCase(application.get("applicationType").asText())) {
                            applicationNumbers.add(application.get("applicationNumber").asText());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error occurred while fetching applications for filing number: {}, status: {}",
                        causeList.getFilingNumber(), status, e);
            }
        }

        causeList.setApplicationNumbers(applicationNumbers);
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
                .requestInfo(createInternalRequestInfo())
                .hearings(hearingList)
                .build();
        hearingUtil.callHearing(updateBulkRequest, Boolean.FALSE);
    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(config.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

    private void callNotificationService(String filingNumber,RequestInfo requestInfo,String hearingDate) {

        try {
            CaseCriteria criteria = CaseCriteria.builder().filingNumber(filingNumber).build();
            SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                    .RequestInfo(createInternalRequestInfo())
                    .tenantId(config.getEgovStateTenantId())
                    .criteria(Collections.singletonList(criteria))
                    .flow(FLOW_JAC)
                    .build();

            JsonNode caseDetails = caseUtil.getCases(searchCaseRequest).get(0);

            String messageCode = CAUSE_LIST_HEARING_MESSAGE;

            log.info("Message code: {}", messageCode);

            Set<String> individualIds = extractIndividualIds(caseDetails);
            Set<String> phoneNumbers = callIndividualService(requestInfo, individualIds);

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .courtCaseNumber(caseDetails.has("courtCaseNumber") ? caseDetails.get("courtCaseNumber").textValue() : "")
                    .cmpNumber(caseDetails.has("cmpNumber") ? caseDetails.get("cmpNumber").textValue() : "")
                    .hearingDate(hearingDate)
                    .tenantId(requestInfo.getUserInfo().getTenantId()).build();

            for (String number : phoneNumbers) {
                notificationService.sendNotification(requestInfo, smsTemplateData, messageCode, number);
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
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

    public List<RecentCauseList>  getRecentCauseList(RecentCauseListSearchRequest searchRequest) {
        log.info("operation = getRecentCauseList, with searchRequest : {}", searchRequest.toString());
        try {
            List<RecentCauseList> recentCauseLists = new ArrayList<>();
            List<CauseListSearchCriteria> recentSearchCriteriaList = generateRecentSearchCriteriaList(searchRequest.getRecentCauseListSearchCriteria());
            for( CauseListSearchCriteria searchCriteria: recentSearchCriteriaList) {
                List<String> fileStoreIds = getFileStoreForCauseList(searchCriteria);
                recentCauseLists.add(RecentCauseList.builder()
                        .courtId(searchCriteria.getCourtId())
                        .fileStoreId(fileStoreIds != null && !fileStoreIds.isEmpty() ? fileStoreIds.get(0) : null)
                        .date(searchCriteria.getSearchDate())
                        .build());
            }
            log.info("operation = getRecentCauseList, result = SUCCESS");
            return recentCauseLists;
        } catch (Exception e) {
            log.error("operation = getRecentCauseList, result = FAILURE, error = {}", e.getMessage(), e);
            throw e;
        }
    }

    public List<CauseListSearchCriteria> generateRecentSearchCriteriaList(RecentCauseListSearchCriteria recentCauseListSearchCriteria) {
        List<CauseListSearchCriteria> criteriaList = new ArrayList<>();
        LocalDate today = LocalDate.now(ZoneId.of(config.getZoneId()));
        LocalDate yesterday = today.minusDays(1);
        LocalDate tomorrow = today.plusDays(1);
        LocalTime now = LocalTime.now(ZoneId.of(config.getZoneId()));
        String courtId = recentCauseListSearchCriteria.getCourtId();

        criteriaList.add(CauseListSearchCriteria.builder().searchDate(today).courtId(courtId).build());

        criteriaList.add(CauseListSearchCriteria.builder()
                .searchDate(now.isBefore(LocalTime.parse(config.getCutoffTime())) ? yesterday : tomorrow)
                .courtId(courtId)
                .build());

        return criteriaList;
    }

}
