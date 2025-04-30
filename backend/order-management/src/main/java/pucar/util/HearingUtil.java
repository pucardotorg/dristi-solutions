package pucar.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.Order;
import pucar.web.models.WorkflowObject;
import pucar.web.models.courtCase.AdvocateMapping;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.*;

import java.util.*;
import java.util.stream.Collectors;

import static pucar.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static pucar.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class HearingUtil {

    private final ObjectMapper objectMapper;
    private final Configuration configuration;
    private final ServiceRequestRepository serviceRequestRepository;
    private final AdvocateUtil advocateUtil;
    private final CacheUtil cacheUtil;
    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;

    public HearingUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository, AdvocateUtil advocateUtil, CacheUtil cacheUtil, JsonUtil jsonUtil, DateUtil dateUtil) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.advocateUtil = advocateUtil;
        this.cacheUtil = cacheUtil;
        this.jsonUtil = jsonUtil;
        this.dateUtil = dateUtil;
    }


    public List<Hearing> fetchHearing(HearingSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getHearingHost().concat(configuration.getHearingSearchEndPoint()));

        Object redisResponse = cacheUtil.findById(request.getCriteria().getTenantId() + ":" + request.getCriteria().getHearingId());
        if (redisResponse != null) {
            return List.of(objectMapper.convertValue(redisResponse, Hearing.class));
        }
        Object response = serviceRequestRepository.fetchResult(uri, request);
        List<Hearing> hearingList = null;
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            JsonNode hearingListNode = jsonNode.get("HearingList");
            hearingList = objectMapper.readValue(hearingListNode.toString(), new TypeReference<>() {
            });
            cacheUtil.save(hearingList.get(0).getTenantId() + ":" + hearingList.get(0).getHearingId(), hearingList.get(0));
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return hearingList;
    }

    public HearingResponse createOrUpdateHearing(HearingRequest request, StringBuilder uri) {

        log.info("type of request {}", uri);

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        Object response = serviceRequestRepository.fetchResult(uri, request);
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            HearingResponse hearingResponse = objectMapper.readValue(jsonNode.toString(), HearingResponse.class);
            cacheUtil.save(hearingResponse.getHearing().getTenantId() + ":" + hearingResponse.getHearing().getHearingId(), hearingResponse.getHearing());
            return hearingResponse;
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException();  // write msg and code here
        }

    }

    public String getHearingTypeFromAdditionalDetails(Object additionalDetails) {

        String type = jsonUtil.getNestedValue(additionalDetails,
                List.of("formdata","hearingPurpose","type"), String.class);
        if (type == null) {
            throw new CustomException("ERROR_IN_ADDITIONAL_DETAILS",
                    "Hearing Purpose Type not found in additional details");
        }
        return type;
//        return Optional.ofNullable(additionalDetails)
//                .filter(Map.class::isInstance)
//                .map(map -> (Map<?, ?>) map)
//                .map(map -> map.get("formdata"))
//                .filter(Map.class::isInstance)
//                .map(map -> (Map<?, ?>) map)
//                .map(map -> map.get("hearingPurpose"))
//                .filter(Map.class::isInstance)
//                .map(map -> (Map<?, ?>) map)
//                .map(map -> map.get("type"))
//                .filter(String.class::isInstance)
//                .map(String.class::cast)
//                .orElseThrow(() -> new CustomException("ERROR_IN_ADDITIONAL_DETAILS", "Hearing Purpose Type not found in additional details"));
    }

    public List<Attendee> getAttendeesFromAdditionalDetails(Order order) {

        //todo: need to fetch from case all the adv ids and then find out individual ids of adv present in case

        return Optional.ofNullable(order.getAdditionalDetails())
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("formdata"))
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("namesOfPartiesRequired"))
                .filter(List.class::isInstance)
                .map(list -> (List<?>) list)
                .map(list -> list.stream()
                        .map(attendee -> {
                            Map<String, Object> attendeeMap = (Map<String, Object>) attendee;
                            return Attendee.builder()
                                    .name((String) attendeeMap.get("name"))
                                    .individualId((String) attendeeMap.get("individualId"))
                                    .type((String) attendeeMap.get("partyType"))
                                    .build();
                        })
                        .collect(Collectors.toList()))
                .orElseGet(List::of);
    }

    public @Valid Long getCreateStartAndEndTime(Object additionalDetails, List<String> paths) {

        String date = jsonUtil.getNestedValue(additionalDetails, paths, String.class);
        if (date == null) return null;
        return dateUtil.getEpochFromDateString(date, "yyyy-MM-dd");

    }

    public List<Attendee> getAttendees(RequestInfo requestInfo, CourtCase courtCase, Order order) {


        List<Attendee> litigantAndPOAHolders = getAttendeesFromAdditionalDetails(order);

        List<String> advocateIds = courtCase.getRepresentatives() == null ?
                Collections.emptyList() :
                courtCase.getRepresentatives().stream()
                        .map(AdvocateMapping::getAdvocateId)
                        .toList();

        Map<String, String> advocate = advocateUtil.getAdvocate(requestInfo, advocateIds);

        // check if this individual id exist in litigantAndPoaHolders map
        // if yes then update name
        // else add in last this entry
        List<Attendee> assingee = new ArrayList<>(litigantAndPOAHolders);
        for (Map.Entry<String, String> entry : advocate.entrySet()) {
            String individualId = entry.getKey();
            int index = -1;
            Attendee attendee = null;
            for (int i = 0; i < litigantAndPOAHolders.size(); i++) {
                attendee = litigantAndPOAHolders.get(i);
                if (individualId.equalsIgnoreCase(attendee.getIndividualId())) {
                    index = i;
                    break;
                }
            }

            if (attendee != null) {
                String name = attendee.getName();
                String modifiedName = addValueToBrackets(name, "Advocate");
                attendee.setName(modifiedName);

                assingee.add(index, attendee);

            } else {
                assingee.add(Attendee.builder()
                        .individualId(entry.getKey())
                        .name(entry.getValue())
                        .type("Advocate")
                        .build());
            }
        }
        return assingee;
    }


    public HearingRequest createHearingRequestForScheduleNextHearingAndScheduleOfHearingDate(RequestInfo requestInfo, Order order, CourtCase courtCase) {

        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("CREATE");
        workflowObject.setComments("Create new Hearing");

        Hearing hearing = Hearing.builder()
                .tenantId(order.getTenantId())
                .filingNumber(Collections.singletonList(order.getFilingNumber()))
                .cnrNumbers(Collections.singletonList(order.getCnrNumber()))
                .courtCaseNumber(courtCase.getCourtCaseNumber())
                .cmpNumber(courtCase.getCmpNumber())
                .hearingType(getHearingTypeFromAdditionalDetails(order.getAdditionalDetails()))
                .status("true") // this is not confirmed ui is sending true
                .attendees(getAttendees(requestInfo, courtCase, order))
                .startTime(getCreateStartAndEndTime(order.getAdditionalDetails(), Arrays.asList("formdata", "hearingDate")))
                .endTime(getCreateStartAndEndTime(order.getAdditionalDetails(), Arrays.asList("formdata", "hearingDate")))
                .workflow(workflowObject)
                .applicationNumbers(new ArrayList<>())
                .presidedBy(PresidedBy.builder()  // todo:this is hardcoded but needs to come from order
                        .benchID("BENCH_ID")
                        .judgeID(Collections.singletonList("JUDGE_ID"))
                        .courtID("KLKM52").build())

                .build();


        // create hearing
        return HearingRequest.builder()
                .requestInfo(requestInfo)
                .hearing(hearing).build();

    }


    /**
     * Adds a new value inside the first pair of brackets in the given text.
     * If no brackets are present, it appends a new bracketed section with the new value.
     *
     * @param text     The original text which may contain brackets.
     * @param newValue The value to add inside the brackets.
     * @return Updated text with the new value added.
     * @throws IllegalArgumentException if text or newValue is null or empty.
     */
    public String addValueToBrackets(String text, String newValue) {
        if (text == null || text.isBlank()) {
            throw new CustomException("INVALID_TEXT_EXCEPTION", "Text must not be null or empty");
        }
        if (newValue == null || newValue.isBlank()) {
            throw new CustomException("INVALID_TEXT_EXCEPTION", "Text must not be null or empty");
        }

        text = text.trim();
        int startIdx = text.indexOf('(');
        int endIdx = text.indexOf(')');

        if (startIdx >= 0 && endIdx > startIdx) {
            String beforeBracket = text.substring(0, startIdx + 1);
            String insideBracket = text.substring(startIdx + 1, endIdx).trim();
            String afterBracket = text.substring(endIdx);

            StringBuilder updatedBracket = new StringBuilder();
            if (!insideBracket.isEmpty()) {
                updatedBracket.append(insideBracket).append(", ").append(newValue);
            } else {
                updatedBracket.append(newValue);
            }

            return beforeBracket + updatedBracket + afterBracket;
        } else {
            // No valid brackets found, append new brackets
            return text + " (" + newValue + ")";
        }

    }
}
