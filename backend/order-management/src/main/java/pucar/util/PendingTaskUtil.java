package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import pucar.config.Configuration;
import pucar.config.StateSlaMap;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.courtCase.AdvocateMapping;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.courtCase.Party;
import pucar.web.models.pendingtask.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PendingTaskUtil {

    private final ObjectMapper objectMapper;
    private final Configuration configuration;
    private final ServiceRequestRepository serviceRequestRepository;
    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;

    public PendingTaskUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository, JsonUtil jsonUtil, DateUtil dateUtil) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.jsonUtil = jsonUtil;
        this.dateUtil = dateUtil;
    }

    // this will use inbox service get fields end point
    public List<PendingTask> getPendingTask(PendingTaskSearchRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getFieldsEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        PendingTaskSearchResponse pendingTaskSearchResponse = null;
        List<PendingTask> pendingTaskList = new ArrayList<>();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            pendingTaskSearchResponse = objectMapper.readValue(jsonNode.toString(), PendingTaskSearchResponse.class);

            for (Data task : pendingTaskSearchResponse.getData()) {
                PendingTask pendingTask = new PendingTask();
                mapFieldsToPendingTask(pendingTask, task.getFields());
                pendingTaskList.add(pendingTask);
            }

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return pendingTaskList;

    }

    public PendingTaskResponse createPendingTask(PendingTaskRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getAnalyticsHost()).append(configuration.getCreatePendingTaskEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        PendingTaskResponse pendingTaskResponse = null;
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            pendingTaskResponse = objectMapper.readValue(jsonNode.toString(), PendingTaskResponse.class);

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return pendingTaskResponse;

    }


    public void mapFieldsToPendingTask(PendingTask obj, List<Field> keyValueList) {
        for (Field entry : keyValueList) {
            try {
                java.lang.reflect.Field field = PendingTask.class.getDeclaredField(entry.getKey());
                field.setAccessible(true);

                // Convert value type if needed
                Object value = entry.getValue();
                if (field.getType() == int.class && value instanceof Number) {
                    value = ((Number) value).intValue();
                }

                field.set(obj, value);
            } catch (NoSuchFieldException e) {
                log.error("");
            } catch (IllegalAccessException e) {
                log.error("");
            }
        }


    }

    public void closeManualPendingTask(String referenceNo, RequestInfo requestInfo) {
        // here data will be lost , we need to search first then update the pending task , this is as per ui
        createPendingTask(PendingTaskRequest.builder()
                .pendingTask(PendingTask.builder().referenceId(MANUAL + referenceNo).isCompleted(true).build()).requestInfo(requestInfo).build());
    }

    public List<String> getUniqueAssignees(Map<String, List<String>> allAdvocates) {
        return allAdvocates.values().stream()
                .flatMap(List::stream)
                .distinct()
                .collect(Collectors.toList());
    }


    public Object getAdditionalDetails(CourtCase courtCase, String advocateUUID) {

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("litigants", getLitigantsForAdvocate(courtCase.getRepresentatives(), advocateUUID));
        return additionalDetails;
    }

    public List<String> getLitigantsForAdvocate(List<AdvocateMapping> representatives, String advocateUUID) {
        List<String> individualList = new ArrayList<>();
        List<Party> partyList = new ArrayList<>();
        for (AdvocateMapping advocateMapping : representatives) {
            if (advocateUUID.equalsIgnoreCase(getUUID(advocateMapping.getAdditionalDetails()))) {
                partyList = advocateMapping.getRepresenting();
                break;
            }
        }
        if (!partyList.isEmpty()) {
            individualList = partyList.stream().map(Party::getIndividualId).toList();
        }
        return individualList;

    }

    private String getUUID(Object additionalDetails) {
        return jsonUtil.getNestedValue(additionalDetails, List.of("uuid"), String.class);
    }

    public Long getStateSla(String orderType) {
        return StateSlaMap.getStateSlaMap().get(INITIATING_RESCHEDULING_OF_HEARING_DATE) * ONE_DAY_TIME_IN_MILLIS + dateUtil.getCurrentTimeInMilis();
    }


}
