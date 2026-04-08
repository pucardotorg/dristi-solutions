package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.kafka.Producer;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.Order;
import pucar.web.models.WorkflowObject;
import pucar.web.models.taskManagement.*;
import pucar.web.models.taskManagement.TaskSearchRequest;

import java.util.*;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class TaskManagementUtil {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final JsonUtil jsonUtil;
    private final Configuration config;
    private final Producer producer;

    public TaskManagementUtil(RestTemplate restTemplate, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil, JsonUtil jsonUtil, Configuration config, Producer producer) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.jsonUtil = jsonUtil;
        this.config = config;
        this.producer = producer;
    }

    public List<TaskManagement> searchTaskManagement(TaskSearchRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskManagementServiceHost())
                .append(config.getTaskManagementSearchEndpoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        try {
            TaskManagementSearchResponse searchResponse = objectMapper.convertValue(response, TaskManagementSearchResponse.class);
            if (searchResponse != null && searchResponse.getTaskManagementRecords() != null) {
                return searchResponse.getTaskManagementRecords();
            } else {
                return Collections.emptyList();
            }
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException("TASK_SEARCH_ERROR", "Error occurred while fetching task management records");
        }
    }

    public TaskManagementResponse updateTaskManagement(TaskManagementRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskManagementServiceHost()).append(config.getTaskManagementUpdateEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), TaskManagementResponse.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException(); // add log and code
        }

    }


    public List<String> processUpfrontPayments(Order order, RequestInfo requestInfo) {
        try {
            String orderType = order.getOrderType();
            List<String> uniqueIds = new ArrayList<>();

            log.info("Processing upfront payments for order type: {}", orderType);

            //extract uniqueids for parties from order to compare with upfront tasks
            extractAllUniqueIds(order, orderType, uniqueIds);
            TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                    .tenantId(order.getTenantId())
                    .filingNumber(order.getFilingNumber())
                    .status(TASK_CREATION)
                    .taskType(List.of(orderType)) // Use the actual order type (NOTICE or SUMMONS)
                    .build();

            TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(searchCriteria)
                    .build();

            List<TaskManagement> taskManagementList = searchTaskManagement(searchRequest);
            log.info("Fetched {} TaskManagement records for upfront payment check",
                    taskManagementList != null ? taskManagementList.size() : 0);

            if (CollectionUtils.isEmpty(taskManagementList)) {
                return uniqueIds;
            }

            for(TaskManagement taskManagement : taskManagementList) {
                List<PartyDetails> partyDetails = taskManagement.getPartyDetails();
                for(PartyDetails partyDetail : partyDetails) {
                    String partyUniqueId = extractPartyUniqueId(partyDetail);
                    if(UpFrontStatus.NOT_COMPLETED.equals(partyDetail.getStatus())
                            && uniqueIds.contains(partyUniqueId)) {
                        partyDetail.setStatus(UpFrontStatus.IN_PROGRESS);
                        uniqueIds.remove(partyUniqueId);
                    }
                }
                taskManagement.setOrderNumber(order.getOrderNumber());
                taskManagement.setOrderItemId(getItemId(order));
                taskManagement.setTaskType(orderType);
                producer.push(config.getTaskUpFrontCreateTopic(), TaskManagementRequest.builder().requestInfo(requestInfo).taskManagement(taskManagement).build());
            }
            return uniqueIds;
        } catch (Exception e) {
            log.error("Error processing upfront payments for order type: {}", order.getOrderType(), e);
            return null;
        }
    }

    private String getItemId(Order order) {
        if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())){
            return jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
        }
        return "";
    }

    private void extractAllUniqueIds(Order order, String orderType, List<String> uniqueIds) {
        List<Object> parties;
        // Handle different order types
        if (NOTICE.equalsIgnoreCase(orderType)) {
            String noticeType = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("formdata", "noticeType", "code"), String.class);
            parties = jsonUtil.getNestedValue(
                    order.getAdditionalDetails(),
                    List.of("formdata", "noticeOrder", "party"),
                    List.class
            );
            getAllUniqueIds(parties, uniqueIds);

            // For NOTICE, only process DCA notice types
            if (!DCA.equalsIgnoreCase(noticeType)) {
                log.info("Notice type {} not supported for upfront payment processing", noticeType);
            }
        } else if (SUMMONS.equalsIgnoreCase(orderType)) {
            parties = jsonUtil.getNestedValue(
                    order.getAdditionalDetails(),
                    List.of("formdata", "SummonsOrder", "party"),
                    List.class
            );
            getAllUniqueIds(parties, uniqueIds);

            // For SUMMONS, process all types (no specific type filtering needed)
        } else {
            // For other order types, return empty list
            log.info("Order type {} not supported for upfront payment processing", orderType);
        }
    }

    private String extractPartyUniqueId(PartyDetails partyDetail) {
        if (partyDetail == null) {
            return null;
        }
        String uniqueId = null;
        //witness details
        if(partyDetail.getWitnessDetails() != null){
            WitnessDetails witness = partyDetail.getWitnessDetails();
            uniqueId = witness.getUniqueId();
        }
        if (partyDetail.getRespondentDetails() != null) {
            RespondentDetails respondent = partyDetail.getRespondentDetails();
            uniqueId = respondent.getUniqueId();
        }

        return uniqueId;
    }

    private static void getAllUniqueIds(List<Object> parties, List<String> uniqueIds) {
        if (parties != null) {
            for (Object obj : parties) {
                if (obj instanceof Map<?, ?> partyMap) {
                    Object dataObj = partyMap.get("data");
                    if (dataObj instanceof Map<?, ?> dataMap) {
                        Object uniqueIdObj = dataMap.get("uniqueId");
                        if (uniqueIdObj instanceof String uniqueId) {
                            uniqueIds.add(uniqueId);
                        }
                    }
                }
            }
        }
    }


    /**
     * Creates a mapping of party type to list of unique IDs from the order payload
     * for parties requiring pending tasks.
     *
     * @param order The order containing party details (NOTICE or SUMMONS)
     * @param uniqueIdPendingTask List of unique IDs that require pending tasks
     * @return Map of party type to list of unique IDs
     */
    public Map<String, List<String>> createPartyTypeToUniqueIdMapping(Order order, List<String> uniqueIdPendingTask) {
        Map<String, List<String>> partyTypeToUniqueIdsMap = new HashMap<>();
        try {
            String orderType = order.getOrderType();
            List<Object> parties = null;

            // Extract parties based on order type
            if (NOTICE.equalsIgnoreCase(orderType)) {
                parties = jsonUtil.getNestedValue(
                        order.getAdditionalDetails(),
                        Arrays.asList("formdata", "noticeOrder", "party"),
                        List.class
                );
            } else {
                log.debug("Order type {} not supported for party type mapping", orderType);
                return partyTypeToUniqueIdsMap;
            }
            if (parties != null) {
                for (Object partyObj : parties) {
                    if (partyObj instanceof Map<?, ?> partyMap) {
                        Object dataObj = partyMap.get("data");
                        if (dataObj instanceof Map<?, ?> dataMap) {
                            String uniqueId = (String) dataMap.get("uniqueId");
                            String partyType = (String) dataMap.get("partyType");

                            // Only include parties that require pending tasks
                            if (uniqueId != null && partyType != null && uniqueIdPendingTask.contains(uniqueId)) {
                                partyTypeToUniqueIdsMap
                                        .computeIfAbsent(partyType, k -> new ArrayList<>())
                                        .add(uniqueId);
                                log.debug("Added party mapping - Type: {}, UniqueId: {}", partyType, uniqueId);
                            }
                        }
                    }
                }
            }
            log.info("Successfully created party type mapping with {} entries", partyTypeToUniqueIdsMap.size());
        } catch (Exception e) {
            log.error("Error creating party type to unique ID mapping", e);
        }
        return partyTypeToUniqueIdsMap;
    }

    public Map<String, List<Map<String, String>>> createPartyTypeMappingForSummons(Order order, List<String> uniqueIdPendingTask) {
        Map<String, List<Map<String, String>>> partyTypeToUniqueIdMap = new HashMap<>();
        try {
            String orderType = order.getOrderType();
            List<Object> parties;

            // Extract parties based on order type
            if (SUMMONS.equalsIgnoreCase(orderType)) {
                parties = jsonUtil.getNestedValue(
                        order.getAdditionalDetails(),
                        Arrays.asList("formdata", "SummonsOrder", "party"),
                        List.class
                );
            } else {
                log.debug("Order type {} not supported for party type mapping", orderType);
                return partyTypeToUniqueIdMap;
            }
            partyTypeToUniqueIdMap.put("respondent", new ArrayList<>());
            partyTypeToUniqueIdMap.put("complainant", new ArrayList<>());
            partyTypeToUniqueIdMap.put("court", new ArrayList<>());
            if (parties != null) {
                for (Object partyObj : parties) {
                    if (partyObj instanceof Map<?, ?> partyMap) {
                        Object dataObj = partyMap.get("data");
                        if (dataObj instanceof Map<?, ?> dataMap) {
                            processPartyData(dataMap, uniqueIdPendingTask, partyTypeToUniqueIdMap);
                        }
                    }
                }
            }
            log.info("Successfully created party type mapping with {} entries", partyTypeToUniqueIdMap.size());
        } catch (Exception e) {
            log.error("Error creating party type to unique id.");
        }
        return partyTypeToUniqueIdMap;
    }

    /**
     * Processes party data and adds it to the appropriate party type mapping
     *
     * @param dataMap The party data map containing uniqueId, partyType, and ownerType
     * @param uniqueIdPendingTask Set of unique IDs that have pending tasks
     * @param partyTypeToUniqueIdMap Map to store party type to unique ID mappings
     */
    private static void processPartyData(Map<?, ?> dataMap, List<String> uniqueIdPendingTask,
                                       Map<String, List<Map<String, String>>> partyTypeToUniqueIdMap) {
        String uniqueId = (String) dataMap.get("uniqueId");
        String partyType = (String) dataMap.get("partyType");
        String ownerType = (String) dataMap.get("ownerType");

        if (!uniqueIdPendingTask.contains(uniqueId)) {
            return;
        }

        Map<String, String> partyMap = createPartyMap(partyType, uniqueId);
        String targetPartyType = determineTargetPartyType(ownerType);

        partyTypeToUniqueIdMap.get(targetPartyType).add(partyMap);
    }

    /**
     * Creates a party map with partyType and uniqueId
     *
     * @param partyType The type of party
     * @param uniqueId The unique identifier
     * @return Map containing partyType and uniqueId
     */
    private static Map<String, String> createPartyMap(String partyType, String uniqueId) {
        Map<String, String> partyMap = new HashMap<>();
        partyMap.put("partyType", partyType);
        partyMap.put("uniqueId", uniqueId);
        return partyMap;
    }

    /**
     * Determines the target party type based on owner type
     *
     * @param ownerType The owner type from the data
     * @return The target party type for mapping
     */
    private static String determineTargetPartyType(String ownerType) {
        if (ownerType == null) {
            return "complainant";
        }

        return switch (ownerType) {
            case ACCUSED -> "respondent";
            case COMPLAINANT -> "complainant";
            case COURT_WITNESS -> "court";
            default -> "complainant";
        };
    }

    /**
     * Fetches warrant TaskManagement records once for batch processing.
     * Call this method once before the loop and pass the result to findWarrantUpfrontPayment or checkAndUpdateWarrantUpfrontPayment.
     *
     * @param order       The order to check
     * @param requestInfo The request info
     * @return List of TaskManagement records for warrant upfront check
     */
    public List<TaskManagement> fetchWarrantTaskManagementRecords(Order order, RequestInfo requestInfo) {
        try {
            TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                    .tenantId(order.getTenantId())
                    .filingNumber(order.getFilingNumber())
                    .status(TASK_CREATION)
                    .taskType(List.of(WARRANT))
                    .build();

            TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(searchCriteria)
                    .build();

            List<TaskManagement> taskManagementList = searchTaskManagement(searchRequest);
            log.info("Fetched {} TaskManagement records for warrant upfront check", taskManagementList != null ? taskManagementList.size() : 0);
            return taskManagementList != null ? taskManagementList : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching warrant TaskManagement records", e);
            return Collections.emptyList();
        }
    }

    /**
     * Finds warrant upfront payment record for a specific address+channel combination.
     * This method does NOT make any API calls - it uses the pre-fetched taskManagementList.
     *
     * @param addressId          The address ID to check
     * @param channelCode        The delivery channel code to check
     * @param taskManagementList Pre-fetched TaskManagement records from fetchWarrantTaskManagementRecords
     * @return WarrantUpfrontResult containing the matching task, party and process data, or null if not found
     */
    public WarrantUpfrontResult findWarrantUpfrontPayment(String addressId, String channelCode, List<TaskManagement> taskManagementList, String uniqueId) {
        if (addressId == null || channelCode == null) {
            log.info("Address ID or channel code is null, no upfront payment check needed");
            return null;
        }

        if (CollectionUtils.isEmpty(taskManagementList)) {
            return null;
        }

        for (TaskManagement taskManagement : taskManagementList) {
            List<PartyDetails> partyDetailsList = taskManagement.getPartyDetails();
            if (CollectionUtils.isEmpty(partyDetailsList)) {
                continue;
            }

            PartyDetails partyDetails = partyDetailsList.stream()
                    .filter(pd -> pd.getRespondentDetails() != null &&
                            uniqueId.equals(pd.getRespondentDetails().getUniqueId()))
                    .findFirst()
                    .orElse(null);

            if (partyDetails == null) {
                partyDetails = partyDetailsList.stream()
                        .filter(pd -> pd.getWitnessDetails() != null &&
                                uniqueId.equals(pd.getWitnessDetails().getUniqueId()))
                        .findFirst()
                        .orElse(null);
            }

            if (partyDetails == null || UpFrontStatus.COMPLETED.equals(partyDetails.getStatus())) {
                continue;
            }

            // Check if this party has the matching address in their delivery process details
            List<ProcessDeliveryDetails> deliveryProcessList = partyDetails.getProcessDeliveryDetails();
            if (CollectionUtils.isEmpty(deliveryProcessList)) {
                continue;
            }

            for (ProcessDeliveryDetails processData : deliveryProcessList) {
                if (addressId.equals(processData.getAddressId())
                        && channelCode.equalsIgnoreCase(processData.getChannelCode())
                        && ProcessDeliveryDetailsStatus.NOT_COMPLETED.equals(processData.getProcessDeliveryDetailsStatus())) {
                    log.info("Found warrant upfront payment with NOT_COMPLETED status for addressId: {}, channelCode: {}", addressId, channelCode);
                    return new WarrantUpfrontResult(taskManagement, partyDetails, processData);
                }
            }
        }

        log.info("No warrant upfront payment found with NOT_COMPLETED status for addressId: {}, channelCode: {}", addressId, channelCode);
        return null;
    }

    /**
     * Updates the warrant upfront payment status and task management record.
     *
     * @param order       The order to update
     * @param requestInfo The request info
     * @param result      The warrant upfront result from findWarrantUpfrontPayment
     * @return true if update was successful, false otherwise
     */
    public boolean updateWarrantUpfrontPayment(Order order, RequestInfo requestInfo, WarrantUpfrontResult result) {
        try {
            if (result == null) {
                return false;
            }

            TaskManagement taskManagement = result.taskManagement();
            PartyDetails partyDetails = result.partyDetails();
            ProcessDeliveryDetails processData = result.processData();

            // Mark upfront as completed
            processData.setProcessDeliveryDetailsStatus(ProcessDeliveryDetailsStatus.COMPLETED);

            // Check if all delivery process details for THIS party are completed
            boolean isPartyCompleted = partyDetails.getProcessDeliveryDetails()
                    .stream()
                    .allMatch(data -> ProcessDeliveryDetailsStatus.COMPLETED.equals(data.getProcessDeliveryDetailsStatus()));

            if (isPartyCompleted) {
                partyDetails.setStatus(UpFrontStatus.COMPLETED);
            }

            // Check if ALL party details are completed
            List<PartyDetails> partyDetailsList = taskManagement.getPartyDetails();
            boolean areAllPartiesCompleted = partyDetailsList.stream()
                    .allMatch(party -> UpFrontStatus.COMPLETED.equals(party.getStatus()));

            WorkflowObject workflowObject = new WorkflowObject();

            // Decide workflow action
            if (areAllPartiesCompleted) {
                log.info("All parties have completed upfront payment");
                workflowObject.setAction(COMPLETE_TASK_CREATION);
            } else {
                log.info("Not all parties completed upfront payment");
                workflowObject.setAction(UPDATE_UPFRONT_PAYMENT);
            }

            // Attach workflow
            taskManagement.setWorkflow(workflowObject);

            // Update order details
            taskManagement.setOrderNumber(order.getOrderNumber());
            taskManagement.setOrderItemId(getItemId(order));

            Role role = Role.builder().code(SYSTEM_ADMIN).name(SYSTEM_ADMIN).tenantId(taskManagement.getTenantId()).build();
            requestInfo.getUserInfo().getRoles().add(role);

            updateTaskManagement(TaskManagementRequest.builder()
                    .requestInfo(requestInfo)
                    .taskManagement(taskManagement)
                    .build());

            return true;
        } catch (Exception e) {
            log.error("Error updating warrant upfront payment", e);
            return false;
        }
    }

    /**
     * Record to hold the result of finding a warrant upfront payment.
     */
    public record WarrantUpfrontResult(TaskManagement taskManagement, PartyDetails partyDetails,
                                       ProcessDeliveryDetails processData) {
    }
}

