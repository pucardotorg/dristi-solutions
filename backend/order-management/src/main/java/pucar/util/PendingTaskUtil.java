package pucar.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

import java.lang.reflect.ParameterizedType;
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
                mapValuesToPendingTask(pendingTask, task.getFields());
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


    public static void mapValuesToPendingTask(PendingTask obj, List<Field> keyValueList) {
        Class<?> clazz = obj.getClass();

        for (Field entry : keyValueList) {
            try {
                java.lang.reflect.Field field = clazz.getDeclaredField(entry.getKey());
                field.setAccessible(true);
                Object value = entry.getValue();

                // Handle lists
                if (List.class.isAssignableFrom(field.getType())) {
                    ParameterizedType listType = (ParameterizedType) field.getGenericType();
                    Class<?> listGenericType = (Class<?>) listType.getActualTypeArguments()[0];

                    if (value instanceof List<?>) {
                        List<?> listValue = (List<?>) value;
                        List<Object> convertedList = new ArrayList<>();
                        for (Object v : listValue) {
                            convertedList.add(convertValue(v, listGenericType));
                        }
                        field.set(obj, convertedList);
                    }
                }
                // Handle objects and primitives
                else {
                    field.set(obj, convertValue(value, field.getType()));
                }
            } catch (NoSuchFieldException e) {
                // log here
            } catch (IllegalAccessException e) {

                // log here
            }
        }
    }

    private static Object convertValue(Object value, Class<?> targetType) {
        if (value == null) return null;

        // Convert basic types
        if (targetType == int.class || targetType == Integer.class) return ((Number) value).intValue();
        if (targetType == double.class || targetType == Double.class) return ((Number) value).doubleValue();
        if (targetType == boolean.class || targetType == Boolean.class) return Boolean.parseBoolean(value.toString());
        if (targetType == String.class) return value.toString();

        // Convert custom objects (assuming a Map<String, Object>)
        if (value instanceof Map<?, ?> mapValue) {
            try {
                Object newInstance = targetType.getDeclaredConstructor().newInstance();
                for (var entry : mapValue.entrySet()) {
                    if (entry.getKey() instanceof String key) {
                        java.lang.reflect.Field field = targetType.getDeclaredField(key);
                        field.setAccessible(true);
                        field.set(newInstance, convertValue(entry.getValue(), field.getType()));
                    }
                }
                return newInstance;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return value; // Return as is for unknown types
    }
    public void closeManualPendingTask(String referenceNo, RequestInfo requestInfo, String filingNumber, String cnrNumber) {
        // here data will be lost , we need to search first then update the pending task , this is as per ui
        createPendingTask(PendingTaskRequest.builder()
                .pendingTask(PendingTask.builder().referenceId(MANUAL + referenceNo)
                        .name("Completed")
                        .entityType("order-default")
                        .status("DRAFT_IN_PROGRESS")
                        .filingNumber(filingNumber)
                        .cnrNumber(cnrNumber).isCompleted(true).build()).requestInfo(requestInfo).build());
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


    public ArrayNode getAssigneeDetailsForMakeMandatorySubmission(Object additionalDetailsObj) {

        JsonNode additionalDetails = null;
        try {
            additionalDetails = objectMapper.readTree(objectMapper.writeValueAsString(additionalDetailsObj));
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        ArrayNode assignees = objectMapper.createArrayNode();

        if (additionalDetails != null) {
            JsonNode submissionParty = additionalDetails.get("formdata").get("submissionParty");


            if (submissionParty != null && submissionParty.isArray()) {
                for (JsonNode party : submissionParty) {
                    JsonNode uuids = party.get("uuid");
                    String individualId = party.has("individualId") ? party.get("individualId").asText() : null;
                    String partyUuid = party.has("partyUuid") ? party.get("partyUuid").asText() : null;

                    if (uuids != null && uuids.isArray()) {
                        for (JsonNode uuidNode : uuids) {
                            String uuid = uuidNode.asText();

                            // Create flattened JSON object for assignee
                            ObjectNode assigneeNode = objectMapper.createObjectNode();
                            assigneeNode.put("uuid", uuid);
                            assigneeNode.put("individualId", individualId);
                            assigneeNode.put("partyUuid", partyUuid);

                            assignees.add(assigneeNode);
                        }
                    }
                }
            }

        }
        return assignees;
    }


}
