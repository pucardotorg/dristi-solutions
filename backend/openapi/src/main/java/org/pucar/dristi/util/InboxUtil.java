package org.pucar.dristi.util;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.ServiceCallException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.OpenHearing;
import org.pucar.dristi.web.models.SearchRequest;
import org.pucar.dristi.web.models.SearchResponse;
import org.pucar.dristi.web.models.inbox.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class InboxUtil {

    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;
    private final Configuration configuration;

    public InboxUtil(ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository, Configuration configuration) {
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
        this.configuration = configuration;
    }


    public List<OpenHearing> getOpenHearings(InboxRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getIndexSearchEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        InboxResponse openHearingSearchResponse;
        List<OpenHearing> openHearingList = new ArrayList<>();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            openHearingSearchResponse = objectMapper.readValue(jsonNode.toString(), InboxResponse.class);
            List<Inbox> items = openHearingSearchResponse.getItems();

            for (Inbox inbox : items) {
                OpenHearing openHearing = new OpenHearing();
                Map<String, Object> businessObject = inbox.getBusinessObject();
                Map hearingDetails = (Map) businessObject.get("hearingDetails");
                mapValuesToOpenHearing(openHearing, hearingDetails);
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

    public InboxRequest getInboxRequestForOpenHearing(String tenantId, Long fromDate, Long toDate, String searchText) {

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();

        if (searchText != null) {
            moduleSearchCriteria.put("searchableFields", searchText);
        }
        moduleSearchCriteria.put("fromDate", fromDate);
        moduleSearchCriteria.put("toDate", toDate);
        moduleSearchCriteria.put("tenantId", tenantId);

        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Hearing Service")
                .tenantId(tenantId)
                .businessService(Collections.singletonList(HEARING_BUSINESS_SERVICE))
                .build();

        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .limit(300)
                .offset(0)
                .tenantId(tenantId)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }

    public InboxRequest getInboxRequestForOrders(String tenantId, Long fromDate, Long toDate, String searchText) {

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();

        if (searchText != null) {
            moduleSearchCriteria.put("searchableFields", searchText);
        }
        moduleSearchCriteria.put("fromDate", fromDate);
        moduleSearchCriteria.put("toDate", toDate);
        moduleSearchCriteria.put("tenantId", tenantId);

        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Hearing Service")
                .tenantId(tenantId)
                .businessService(Collections.singletonList(HEARING_BUSINESS_SERVICE))
                .build();

        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .limit(300)
                .offset(0)
                .tenantId(tenantId)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }

    public InboxRequest getInboxRequestForPaymentTasks(String tenantId, Long fromDate, Long toDate, String searchText) {

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();

        if (searchText != null) {
            moduleSearchCriteria.put("searchableFields", searchText);
        }
        moduleSearchCriteria.put("fromDate", fromDate);
        moduleSearchCriteria.put("toDate", toDate);
        moduleSearchCriteria.put("tenantId", tenantId);

        ProcessInstanceSearchCriteria processSearchCriteria = ProcessInstanceSearchCriteria.builder()
                .moduleName("Hearing Service")
                .tenantId(tenantId)
                .businessService(Collections.singletonList(HEARING_BUSINESS_SERVICE))
                .build();

        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .processSearchCriteria(processSearchCriteria)
                .moduleSearchCriteria(moduleSearchCriteria)
                .limit(300)
                .offset(0)
                .tenantId(tenantId)
                .build();

        return InboxRequest.builder()
                .inbox(inboxSearchCriteria)
                .build();
    }

    public InboxResponse getOrders(InboxRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getIndexSearchEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        InboxResponse inboxResponse = new InboxResponse();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            inboxResponse = objectMapper.readValue(jsonNode.toString(), InboxResponse.class);

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return inboxResponse;

    }

    public SearchResponse getPaymentTask(SearchRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getIndexGetFieldEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        SearchResponse searchResponse = new SearchResponse();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            searchResponse = objectMapper.readValue(jsonNode.toString(), SearchResponse.class);

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return searchResponse;

    }
}
