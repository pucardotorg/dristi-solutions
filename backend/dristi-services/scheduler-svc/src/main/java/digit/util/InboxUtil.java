package digit.util;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.OpenHearing;
import digit.web.models.inbox.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

import static digit.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static digit.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class InboxUtil {

    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;
    private final Configuration configuration;
    private final DateUtil dateUtil;

    public InboxUtil(ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository, Configuration configuration, DateUtil dateUtil) {
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
        this.configuration = configuration;
        this.dateUtil = dateUtil;
    }


    public List<OpenHearing> getOpenHearings(InboxRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getIndexSearchEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        InboxResponse openHearingSearchResponse ;
        List<OpenHearing> openHearingList = new ArrayList<>();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            openHearingSearchResponse = objectMapper.readValue(jsonNode.toString(), InboxResponse.class);
            List<Inbox> items = openHearingSearchResponse.getItems();

            for (Inbox inbox : items) {
                OpenHearing openHearing = new OpenHearing();
                Map<String, Object> businessObject = inbox.getBusinessObject();
                Map hearingDetails = (Map) businessObject.get("hearingDetails");
                mapValuesToOpenHearing(openHearing,hearingDetails );
                openHearingList.add(openHearing);
            }

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return openHearingList;

    }

    private void mapValuesToOpenHearing(OpenHearing openHearing, Map<String, Object> keyValueMap) {


        Class<?> clazz = openHearing.getClass();

        for (Map.Entry<String, Object> entry : keyValueMap.entrySet()) {
            try {
                Field field = clazz.getDeclaredField(entry.getKey());
                field.setAccessible(true);
                Object value = entry.getValue();

                if (value == null) continue;

                if (field.getType().isEnum()) {
                    Method fromValue = field.getType().getMethod("fromValue", String.class);
                    Object enumValue = fromValue.invoke(null, value.toString());
                    field.set(openHearing, enumValue);
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
                        field.set(openHearing, convertedList);
                    }
                }
                // Handle nested objects
                else if (!field.getType().isPrimitive() && !field.getType().equals(String.class) &&
                        !Number.class.isAssignableFrom(field.getType()) && !Boolean.class.isAssignableFrom(field.getType())) {
                    Object convertedObject = objectMapper.convertValue(value, field.getType());
                    field.set(openHearing, convertedObject);
                }
                // Handle primitives and other types
                else {
                    field.set(openHearing, convertValue(value, field.getType()));
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


    public InboxRequest getInboxRequestForOpenHearing(String courtId,Long fromDate, Long toDate) {

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();

        moduleSearchCriteria.put("courtId", courtId);
        moduleSearchCriteria.put("fromDate", fromDate);
        moduleSearchCriteria.put("toDate", toDate);
        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Hearing Service")
                .tenantId(configuration.getEgovStateTenantId())
                .businessService(Collections.singletonList("hearing-default"))
                .build();
        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .tenantId(configuration.getEgovStateTenantId())
                .limit(300)
                .offset(0)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }

    public InboxRequest getOpenPendingTasks() {
        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        ZoneId zoneId = ZoneId.of(configuration.getZoneId());

        ZonedDateTime zonedDateTime = ZonedDateTime.now(zoneId);

        long millis = zonedDateTime.toInstant().toEpochMilli();

        moduleSearchCriteria.put("expiryDate", millis);
        moduleSearchCriteria.put("isCompleted", false);
        moduleSearchCriteria.put("entityType", "bail bond");

        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Pending Tasks Service")
                .businessService(Collections.singletonList(""))
                .build();
        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .tenantId(configuration.getEgovStateTenantId())
                .limit(300)
                .offset(0)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }

    public List<Inbox> getPendingTasksForExpiry(InboxRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getIndexSearchEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        InboxResponse pendingTaskSearchResponse ;
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            pendingTaskSearchResponse = objectMapper.readValue(jsonNode.toString(), InboxResponse.class);

            return pendingTaskSearchResponse.getItems();

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return new ArrayList<>();
    }

}
