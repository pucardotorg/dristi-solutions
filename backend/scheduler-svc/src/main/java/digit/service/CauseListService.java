package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.kafka.producer.Producer;
import digit.repository.CauseListRepository;
import digit.repository.HearingRepository;
import digit.util.DateUtil;
import digit.util.MdmsUtil;
import digit.util.PdfServiceUtil;
import digit.web.models.*;
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
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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

    private DateUtil dateUtil;

    @Autowired
    public CauseListService(HearingRepository hearingRepository, CauseListRepository causeListRepository,
                            Producer producer, Configuration config, PdfServiceUtil pdfServiceUtil,
                            MdmsUtil mdmsUtil, ServiceConstants serviceConstants, DateUtil dateUtil) {
        this.hearingRepository = hearingRepository;
        this.causeListRepository = causeListRepository;
        this.producer = producer;
        this.config =  config;
        this.pdfServiceUtil = pdfServiceUtil;
        this.mdmsUtil = mdmsUtil;
        this.serviceConstants = serviceConstants;
        this.dateUtil = dateUtil;
    }

    public void updateCauseListForTomorrow() {
        log.info("operation = updateCauseListForTomorrow, result = IN_PROGRESS");
        List<CauseList> causeLists = new ArrayList<>();

        ExecutorService executorService = Executors.newCachedThreadPool();

        submitTasks(executorService, causeLists);

        waitForTasksCompletion(executorService);

        if (!CollectionUtils.isEmpty(causeLists)) {
            CauseListResponse causeListResponse = CauseListResponse.builder()
                    .responseInfo(ResponseInfo.builder().build()).causeLists(causeLists).build();
            producer.push(config.getCauseListInsertTopic(), causeListResponse);
        } else {
            log.info("No cause lists to be created");
        }
        log.info("operation = updateCauseListForTomorrow, result = SUCCESS");
    }

    private void submitTasks(ExecutorService executorService, List<CauseList> causeLists) {
            executorService.submit(() -> generateCauseList(causeLists));
    }

    private void waitForTasksCompletion(ExecutorService executorService) {
        executorService.shutdown();
        try {
            boolean execute = executorService.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
        } catch (InterruptedException e) {
            log.error("Error occurred while waiting for task completion: {}", e.getMessage());
            Thread.currentThread().interrupt();
        }
    }

    private void generateCauseList(List<CauseList> causeLists) {
        log.info("operation = generateCauseListForJudge, result = IN_PROGRESS");
        HearingSearchCriteria searchCriteria = HearingSearchCriteria.builder()
                .fromDate(LocalDate.now())
                .toDate(LocalDate.now().plusDays(1)).build();
        List<HearingCauseList> hearingCauseList =  hearingRepository.getHearingsFromHearingTable(searchCriteria);
        if (CollectionUtils.isEmpty(hearingCauseList)) {
            log.info("No hearings scheduled tomorrow ");
        } else {
            log.info("No. of hearings scheduled tomorrow ");
            fillHearingTimesWithDataFromMdms(hearingCauseList);
            generateCauseListFromHearings(hearingCauseList, causeLists);
            if (!CollectionUtils.isEmpty(causeLists)) {
                log.info("Generated slotLists ");
            }
            log.info("operation = generateCauseListForJudge, result = SUCCESS");
        }
    }

    private void fillHearingTimesWithDataFromMdms(List<HearingCauseList> hearingslotLists) {
        log.info("operation = fillHearingTimesWithDataFromMdms, result = IN_PROGRESS, judgeId = {}", hearingslotLists.get(0).getCourtId());
        List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();
        for (HearingCauseList hearingList : hearingslotLists) {
            Optional<MdmsHearing> optionalHearing = mdmsHearings.stream().filter(a -> a.getHearingType()
                    .equalsIgnoreCase(hearingList.getHearingType())).findFirst();
            if (optionalHearing.isPresent() && (optionalHearing.get().getHearingTime() != null)) {
                hearingList.setHearingTimeInMinutes(optionalHearing.get().getHearingTime().longValue());
                log.info("Minutes to be allotted {} for Schedule Hearing {}", hearingList.getHearingTimeInMinutes(),
                        hearingList.getCaseNumber());
            }
        }
        log.info("operation = fillHearingTimesWithDataFromMdms, result = SUCCESS, judgeId = {}", hearingslotLists.get(0).getCourtId());
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

    private void generateCauseListFromHearings(List<HearingCauseList> scheduleHearings, List<CauseList> causeLists) {
        log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", scheduleHearings.get(0).getCourtId());
        List<MdmsSlot> mdmsSlotList = getSlottingDataFromMdms();

//        long currentSlotIndex = 0;
//        long accumulatedTime = 0;

        for (HearingCauseList hearing : scheduleHearings) {
//            boolean isSlotAssigned = false;
            Long hearingTime = hearing.getHearingDate();
            CauseList causeList = null;
            if(hearingTime >= dateUtil.getEpochFromLocalDateTime(LocalDate.now().atStartOfDay().plusHours(10)) &&
                hearingTime <= dateUtil.getEpochFromLocalDateTime(LocalDate.now().atStartOfDay().plusHours(13))) {
                causeList = getCauseListFromHearingAndSlot(hearing, mdmsSlotList.get(1));
            } else {
                causeList = getCauseListFromHearingAndSlot(hearing, mdmsSlotList.get(0));
            }
            causeLists.add(causeList);
        }
        log.info("operation = generateCauseListFromHearings, result = SUCCESS, judgeId = {}", scheduleHearings.get(0).getCourtId());
    }


    private static CauseList getCauseListFromHearingAndSlot(HearingCauseList hearing, MdmsSlot mdmsSlot) {
        log.info("Added hearing {} to slot {}", hearing.getCaseNumber(), mdmsSlot.getSlotName());
        return CauseList.builder()
                .courtId(hearing.getCourtId())
                .tenantId(hearing.getTenantId())
                .caseId(hearing.getCaseId())
                .typeOfHearing(hearing.getHearingType())
                .tentativeSlot(mdmsSlot.getSlotStartTime() + " - " + mdmsSlot.getSlotEndTime())
                .caseDate(hearing.getHearingDate())
                .caseTitle(hearing.getCaseTitle())
                .applicationNumber(hearing.getApplicationNumber())
                .build();
    }

    private List<SlotList> getSlotList(Map<String, String> hearingTypeSlotMap, List<CauseList> causeLists) {
        List<SlotList> slotLists = new ArrayList<>();
        List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();
        for(Map.Entry<String, String> entry: hearingTypeSlotMap.entrySet()){
            String hearingType = entry.getKey();
            String slot = entry.getValue();
            String hearingName = mdmsHearings.stream().filter(a -> a.getHearingType().equalsIgnoreCase(hearingType))
                    .findFirst().get().getHearingName();
            List<CauseList> tempCauseList = getFilteredCauseLists(causeLists, slot, hearingType);

            if (!tempCauseList.isEmpty()) {
                SlotList slotList = SlotList.builder()
                        .hearingType(hearingName)
                        .slots(slot)
                        .causeLists(tempCauseList)
                        .build();
                slotLists.add(slotList);
            }
        }
        return slotLists;
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
        List<MdmsHearing> mdmsHearings = getHearingDataFromMdms();
        List<MdmsSlot> mdmsSlots = getSlottingDataFromMdms();
        List<SlotList> slotLists = new ArrayList<>();
        for(MdmsSlot mdmsSlot: mdmsSlots){
            Map<String, String> hearingTypeSlotMap = getSlotHearingTypeMap(mdmsHearings, mdmsSlot);
            List<SlotList> tempSlotList = getSlotList(hearingTypeSlotMap, causeLists);
            slotLists.addAll(tempSlotList);
        }

        CauseListSlotRequest causeListSlotRequest = CauseListSlotRequest.builder()
                .requestInfo(searchRequest.getRequestInfo())
                .slotLists(slotLists).build();
        return pdfServiceUtil.generatePdfFromPdfService(causeListSlotRequest , searchRequest.getRequestInfo().getUserInfo().getTenantId(),
                config.getCauseListPdfTemplateKey());
    }

    private Map<String, String> getSlotHearingTypeMap(List<MdmsHearing> mdmsHearings, MdmsSlot mdmsSlot) {
        Map<String, String> hearingTypeSlotMap = new HashMap<>();
        for (MdmsHearing mdmsHearing : mdmsHearings) {
                hearingTypeSlotMap.put(mdmsHearing.getHearingType(), mdmsSlot.getSlotStartTime() + " - " + mdmsSlot.getSlotEndTime());
        }
        return hearingTypeSlotMap;
    }

    public List<CauseList> getFilteredCauseLists(List<CauseList> causeLists, String slot, String hearingType) {
        return causeLists.stream()
                .filter(causeList -> slot.equals(causeList.getTentativeSlot()) && hearingType.equals(causeList.getTypeOfHearing()))
                .collect(Collectors.toList());
    }
}
