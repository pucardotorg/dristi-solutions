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

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    public HearingUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository, AdvocateUtil advocateUtil, CacheUtil cacheUtil) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.advocateUtil = advocateUtil;
        this.cacheUtil = cacheUtil;
    }


    public List<Hearing> fetchHearing(HearingSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getHearingHost().concat(configuration.getHearingSearchEndPoint()));

        Object redisResponse = cacheUtil.findById(request.getCriteria().getTenantId() + ":" + request.getCriteria().getHearingId());
        if(redisResponse != null) {
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
            HearingResponse hearingResponse =  objectMapper.readValue(jsonNode.toString(), HearingResponse.class);
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
//    public @NotNull String getHearingTypeFormAddtionalDetails(Object additionalDetails) {
//        String hearingType = null;
//        if (additionalDetails != null) {
//            Object formdata = ((Map) additionalDetails).get("formdata");
//            if (formdata != null) {
//                Object hearingPurpose = ((Map) formdata).get("hearingPurpose");
//                if (hearingPurpose != null) {
//                    hearingType = (String) ((Map) hearingPurpose).get("type");
//                }
//            }
//        }
//        if (hearingType == null) {
//            throw new CustomException("ERROR_IN_ADDITIONAL_DETAILS", "Hearing Purpose Type not found in additional details");
//        }
//        return hearingType;
//    }

    public String getHearingTypeFromAdditionalDetails(Object additionalDetails) {
        return Optional.ofNullable(additionalDetails)
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("formdata"))
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("hearingPurpose"))
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("type"))
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .orElseThrow(() -> new CustomException("ERROR_IN_ADDITIONAL_DETAILS", "Hearing Purpose Type not found in additional details"));
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

    public @Valid Long getCreateStartAndEndTime(Object additionalDetails) {
        ZoneId zoneId = ZoneId.of("Asia/Kolkata");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");  // change this to date util from scheduler
        return Optional.ofNullable(additionalDetails)
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("formdata"))
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("hearingDate"))
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .map(date -> LocalDateTime.parse(date, formatter).atZone(zoneId).toInstant().toEpochMilli())
                .orElseThrow(() -> new CustomException("ERROR_IN_ADDITIONAL_DETAILS", "Hearing Date not found in additional details"));
    }

    public List<Attendee> getAdvocateAttendees(RequestInfo requestInfo, CourtCase courtCase) {

        List<String> advocateIds = courtCase.getRepresentatives() == null ?
                Collections.emptyList() :
                courtCase.getRepresentatives().stream()
                        .map(AdvocateMapping::getAdvocateId)
                        .toList();

        Map<String, String> advocate = advocateUtil.getAdvocate(requestInfo, advocateIds);

        return advocate.entrySet().stream()
                .map(entry -> Attendee.builder()
                        .individualId(entry.getKey())
                        .name(entry.getValue())
                        .type("Advocate")
                        .build())
                .toList();


    }



    public HearingRequest createHearingRequestForScheduleNextHearingAndScheduleOfHearingDate (RequestInfo requestInfo,Order order, CourtCase courtCase){

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
                .status(null) // this is not confirmed ui is sending true
                .attendees(Stream.concat(
                        getAttendeesFromAdditionalDetails(order).stream(),
                        getAdvocateAttendees(requestInfo, courtCase).stream()
                ).collect(Collectors.toList()))
                .startTime(getCreateStartAndEndTime(order.getAdditionalDetails()))
                .endTime(getCreateStartAndEndTime(order.getAdditionalDetails()))
                .workflow(workflowObject)
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


}
