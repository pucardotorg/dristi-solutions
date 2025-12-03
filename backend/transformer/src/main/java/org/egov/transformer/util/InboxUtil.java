package org.egov.transformer.util;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.ServiceCallException;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.inbox.*;
import org.egov.transformer.repository.ServiceRequestRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.util.*;

import static org.egov.transformer.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static org.egov.transformer.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class InboxUtil {

    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;
    private final TransformerProperties configuration;

    public InboxUtil(ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository, TransformerProperties configuration) {
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
        this.configuration = configuration;
    }

    public <T> List<T> getInboxEntities(InboxRequest request, String businessObjectKey, Class<T> entityClass) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getIndexSearchEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        InboxResponse searchResponse;
        List<T> entityList = new ArrayList<>();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            searchResponse = objectMapper.readValue(jsonNode.toString(), InboxResponse.class);
            List<Inbox> items = searchResponse.getItems();

            for (Inbox inbox : items) {
                T entity = entityClass.getDeclaredConstructor().newInstance();
                Map<String, Object> businessObject = inbox.getBusinessObject();
                Map details = (Map) businessObject.get(businessObjectKey);
                mapValuesToEntity(entity, details);
                entityList.add(entity);
            }
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return entityList;
    }

    private <T> void mapValuesToEntity(T entity, Map<String, Object> keyValueMap) {
        Class<?> clazz = entity.getClass();

        for (Map.Entry<String, Object> entry : keyValueMap.entrySet()) {
            try {
                Field field = clazz.getDeclaredField(entry.getKey());
                field.setAccessible(true);
                Object value = entry.getValue();

                if (value == null) continue;

                if (field.getType().isEnum()) {
                    Method fromValue = field.getType().getMethod("fromValue", String.class);
                    Object enumValue = fromValue.invoke(null, value.toString());
                    field.set(entity, enumValue);
                    continue;
                }

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
                        field.set(entity, convertedList);
                    }
                }
                // Handle nested objects
                else if (!field.getType().isPrimitive() && !field.getType().equals(String.class) &&
                        !Number.class.isAssignableFrom(field.getType()) && !Boolean.class.isAssignableFrom(field.getType())) {
                    Object convertedObject = objectMapper.convertValue(value, field.getType());
                    field.set(entity, convertedObject);
                }
                // Handle primitives and other types
                else {
                    field.set(entity, convertValue(value, field.getType()));
                }
            } catch (NoSuchFieldException e) {
                log.error("Field not found:{} ", entry.getKey());
            } catch (IllegalAccessException e) {
                log.error("Error accessing field: {}", entry.getKey());
            } catch (InvocationTargetException e) {
                throw new RuntimeException(e);
            } catch (NoSuchMethodException e) {
                throw new RuntimeException(e);
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


    public InboxRequest getInboxRequestForOpenHearing(String courtId,String hearingUuid) {

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();

        moduleSearchCriteria.put("courtId", courtId);
        moduleSearchCriteria.put("hearingUuid", hearingUuid);
        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Hearing Service")
                .tenantId(configuration.getEgovStateTenantId())
                .businessService(Collections.singletonList("hearing-default"))
                .build();
        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .tenantId(configuration.getEgovStateTenantId())
                .limit(1)
                .offset(0)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }

    public InboxRequest getInboxRequestForArtifacts(String courtId, String filingNumber) {

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();

        moduleSearchCriteria.put("courtId", courtId);
        moduleSearchCriteria.put("filingNumber", filingNumber);
        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Evidence Service")
                .tenantId(configuration.getEgovStateTenantId())
                .businessService(Collections.singletonList("evidence-default"))
                .build();
        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .tenantId(configuration.getEgovStateTenantId())
                //Todo: Remove hard coded limit once inbox search limit is updated
                .limit(Integer.valueOf(configuration.getInboxSearchLimit()))
                .offset(0)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }
}
