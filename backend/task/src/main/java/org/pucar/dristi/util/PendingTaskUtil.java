package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.pendingtask.PendingTask;
import org.pucar.dristi.web.models.pendingtask.PendingTaskRequest;
import org.pucar.dristi.web.models.pendingtask.PendingTaskResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;
import static org.pucar.dristi.config.ServiceConstants.NOTICE;
import static org.pucar.dristi.config.ServiceConstants.WARRANT;

@Component
@Slf4j
public class PendingTaskUtil {

    private final ObjectMapper objectMapper;
    private final Configuration configuration;
    private final ServiceRequestRepository serviceRequestRepository;

    public PendingTaskUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
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


    public void mapValuesToPendingTask(PendingTask obj, Map<String, Object> keyValueMap) {
        Class<?> clazz = obj.getClass();

        for (Map.Entry<String, Object> entry : keyValueMap.entrySet()) {
            try {
                Field field = clazz.getDeclaredField(entry.getKey());
                field.setAccessible(true);
                Object value = entry.getValue();

                if (value == null) continue;

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
                // Handle nested objects
                else if (!field.getType().isPrimitive() && !field.getType().equals(String.class) &&
                        !Number.class.isAssignableFrom(field.getType()) && !Boolean.class.isAssignableFrom(field.getType())) {
                    Object convertedObject = objectMapper.convertValue(value, field.getType());
                    field.set(obj, convertedObject);
                }
                // Handle primitives and other types
                else {
                    field.set(obj, convertValue(value, field.getType()));
                }
            } catch (NoSuchFieldException e) {
                log.error("Field not found:{} ", entry.getKey());
            } catch (IllegalAccessException e) {
                log.error("Error accessing field: {}", entry.getKey());
            }
        }
    }


    private Object convertValue(Object value, Class<?> targetType) {
        if (value == null) return null;

        if (targetType.isInstance(value)) {
            return value;
        }

        if (targetType == Integer.class || targetType == int.class) {
            return Integer.parseInt(value.toString());
        } else if (targetType == Long.class || targetType == long.class) {
            return Long.parseLong(value.toString());
        } else if (targetType == Double.class || targetType == double.class) {
            return Double.parseDouble(value.toString());
        } else if (targetType == Boolean.class || targetType == boolean.class) {
            return Boolean.parseBoolean(value.toString());
        } else if (targetType == String.class) {
            return value.toString();
        }

        return value; // Return as is if no conversion logic is provided
    }

    public void closeManualPendingTask(String referenceNo, RequestInfo requestInfo, String filingNumber, @NotNull String
            cnrNumber, @NotNull String caseId, @NotNull String caseTitle,String taskType) {
        // here data will be lost , we need to search first then update the pending task , this is as per ui
        createPendingTask(PendingTaskRequest.builder()
                .pendingTask(PendingTask.builder().referenceId(referenceNo)
                        .name("Completed")
                        .entityType(getEntityType(taskType))
                        .status("COMPLETED")
                        .filingNumber(filingNumber)
                        .caseId(caseId).caseTitle(caseTitle)
                        .cnrNumber(cnrNumber).isCompleted(true).build()).requestInfo(requestInfo).build());
    }

    private String getEntityType(String taskType) {

        return switch (taskType) {
            case SUMMON -> "task-summons";
            case WARRANT-> "task-warrant";
            case PROCLAMATION -> "task-proclamation";
            case ATTACHMENT -> "task-attachment";
            case NOTICE -> "task-notice";
            default -> null;
        };
    }

    public List<String> getUniqueAssignees(Map<String, List<String>> allAdvocates) {
        return allAdvocates.values().stream()
                .flatMap(List::stream)
                .distinct()
                .collect(Collectors.toList());
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
