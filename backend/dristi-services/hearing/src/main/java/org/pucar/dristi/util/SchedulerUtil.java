package org.pucar.dristi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class SchedulerUtil {

    private final ServiceRequestRepository repository;
    private final Configuration configuration;
    private final ObjectMapper mapper;
    private final RestTemplate restTemplate;

    @Autowired
    public SchedulerUtil(ServiceRequestRepository repository, Configuration configuration, ObjectMapper mapper, RestTemplate restTemplate) {
        this.repository = repository;
        this.configuration = configuration;
        this.mapper = mapper;
        this.restTemplate = restTemplate;
    }

    public List<ScheduleHearing> callBulkReschedule(BulkRescheduleRequest request) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getSchedulerHost()).append(configuration.getBulkRescheduleEndPoint());
        Object response = repository.fetchResult(uri, request);
        List<ScheduleHearing> result;

        try {
            BulkRescheduleResponse rescheduleResponse = mapper.convertValue(response, BulkRescheduleResponse.class);
            result = rescheduleResponse.getReScheduleHearings();

        } catch (Exception e) {
            log.error("Error occurred while calling bulk reschedule");
            throw new CustomException("", "Error occurred while calling bulk reschedule");
        }
        return result;

    }

    public List<ScheduleHearing> getScheduledHearings(ScheduleHearingSearchRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getSchedulerHost()).append(configuration.getSchedulerSearchEndpoint());
        Object response = repository.fetchResult(uri, request);
        List<ScheduleHearing> scheduleHearings;
        try {
            ScheduleHearingSearchResponse searchResponse = mapper.convertValue(response, ScheduleHearingSearchResponse.class);
            scheduleHearings = searchResponse.getHearings();
        } catch (Exception e){
            log.error("Error occurred while getting scheduled hearings.");
            throw new CustomException("ERR_SCHEDULER_EXCEPTION", "Error occurred while getting scheduled hearings.");
        }
        return scheduleHearings;
    }

    public void updateScheduleHearings(ScheduleHearingUpdateRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getSchedulerHost()).append(configuration.getSchedulerUpdateEndpoint());
        Object response = new HashMap<>();
        try {
            response = restTemplate.postForEntity(uri.toString(), request, Map.class);
        } catch (Exception e) {
            log.error("Error updating time for hearing in Scheduler :: {}", e.getMessage());
            throw new CustomException("Error updating time for hearing in Scheduler.", e.getMessage());
        }
    }

    public List<ScheduleHearing> createScheduleHearing(List<ScheduleHearing> manualUpdateDateHearings, RequestInfo requestInfo) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getSchedulerHost()).append(configuration.getSchedulerCreateEndPoint());
        ScheduleHearingUpdateRequest request = ScheduleHearingUpdateRequest.builder().requestInfo(requestInfo).scheduleHearings(manualUpdateDateHearings).build();

        Object response = repository.fetchResult(uri, request);
        List<ScheduleHearing> scheduleHearings;
        try {
            ScheduleHearingSearchResponse searchResponse = mapper.convertValue(response, ScheduleHearingSearchResponse.class);
            scheduleHearings = searchResponse.getHearings();
        } catch (Exception e) {
            log.error("Error occurred while creating scheduled hearings.");
            throw new CustomException("ERR_SCHEDULER_EXCEPTION", "Error occurred while creating scheduled hearings.");
        }
        return scheduleHearings;
    }

    public List<JudgeCalendarRule> updateJudgeCalendar(JudgeCalendarUpdateRequest calendarUpdateRequest) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getSchedulerHost()).append(configuration.getJudgeCalendarUpdateEndPoint());
        Object response = repository.fetchResult(uri, calendarUpdateRequest);
        List<JudgeCalendarRule> updateResponse = new ArrayList<>();
        try {
            updateResponse = mapper.convertValue(response, new TypeReference<List<JudgeCalendarRule>>() {});
        } catch (Exception e) {
            log.error("Error occurred while updating judge calendar.");
            throw new CustomException("ERR_SCHEDULER_EXCEPTION", "Error occurred while updating judge calendar.");
        }
        return updateResponse;
    }
}
