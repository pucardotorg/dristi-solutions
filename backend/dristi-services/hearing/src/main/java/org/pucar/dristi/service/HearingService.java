package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.HearingRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.HearingRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validator.HearingRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.cases.CaseRequest;
import org.pucar.dristi.web.models.cases.CourtCase;
import org.pucar.dristi.web.models.inbox.InboxRequest;
import org.pucar.dristi.web.models.orders.*;
import org.pucar.dristi.web.models.orders.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
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

    @Autowired
    public HearingService(
            HearingRegistrationValidator validator,
            HearingRegistrationEnrichment enrichmentUtil,
            WorkflowService workflowService,
            HearingRepository hearingRepository,
            Producer producer,
            Configuration config, CaseUtil caseUtil, ObjectMapper objectMapper, IndividualService individualService, SmsNotificationService notificationService, MdmsUtil mdmsUtil, DateUtil dateUtil, SchedulerUtil schedulerUtil, FileStoreUtil fileStoreUtil, InboxUtil inboxUtil, JsonUtil jsonUtil, EsUtil esUtil, OrderUtil orderUtil) {
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
            if(hearing.getWorkflow()!=null && (hearing.getWorkflow().getAction().equalsIgnoreCase(MARK_COMPLETE) || hearing.getWorkflow().getAction().equalsIgnoreCase(UPDATE_DATE) || hearing.getWorkflow().getAction().equalsIgnoreCase(RESCHEDULE_ONGOING))){
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
                    // search the open hearing index here for confirmation
                    InboxRequest confirmationRequest = inboxUtil.getInboxRequestForOpenHearing(tenantId, requestInfo, hearingNumber,status);
                   List<OpenHearing> openHearingList = inboxUtil.getOpenHearings(confirmationRequest);
                   if (openHearingList == null || openHearingList.isEmpty()) {
                       log.error("Update of status is not reflected yet in ES");
                   }
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
            if (hearingType != null && messageCode.equals(VARIABLE_HEARING_SCHEDULED)) {
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
                scheduleHearing.setCaseStage(hearing.getSubStage());
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
                if ((courtCase.getIsLPRCase() != null && courtCase.getIsLPRCase()) && courtCase.getLprNumber() != null) {
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
