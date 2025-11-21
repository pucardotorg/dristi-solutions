package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.models.project.TaskResponse;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.demand.*;
import org.pucar.dristi.web.models.orders.*;
import org.pucar.dristi.web.models.orders.Order;
import org.pucar.dristi.web.models.taskManagement.*;
import org.pucar.dristi.web.models.tasks.*;
import org.pucar.dristi.web.models.tasks.TaskSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class OrderUtil {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper mapper;
    private final Configuration configuration;
    private final TaskUtil taskUtil;
    private final WorkflowUtil workflowUtil;
    private final Producer producer;
    private final DemandUtil demandUtil;
    private final MdmsUtil mdmsUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final TaskManagementUtil taskManagementUtil;
    private final CaseUtil caseUtil;

    @Autowired
    public OrderUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper mapper, Configuration configuration,
                     TaskUtil taskUtil, WorkflowUtil workflowUtil, Producer producer, DemandUtil demandUtil, MdmsUtil mdmsUtil, PendingTaskUtil pendingTaskUtil, TaskManagementUtil taskManagementUtil, CaseUtil caseUtil) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.mapper = mapper;
        this.configuration = configuration;
        this.taskUtil = taskUtil;
        this.workflowUtil = workflowUtil;
        this.producer = producer;
        this.demandUtil = demandUtil;
        this.mdmsUtil = mdmsUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.taskManagementUtil = taskManagementUtil;
        this.caseUtil = caseUtil;
    }

    public void closeActivePaymentPendingTasks(HearingRequest hearingRequest) {
        try {
            String hearingId = hearingRequest.getHearing().getHearingId();
            String tenantId = hearingRequest.getHearing().getTenantId();
            RequestInfo requestInfo = hearingRequest.getRequestInfo();
            Role role = Role.builder()
                    .code(PAYMENT_COLLECTOR)
                    .name(PAYMENT_COLLECTOR)
                    .tenantId(tenantId)
                    .build();
            requestInfo.getUserInfo().getRoles().add(role);

            if (hearingId == null) {
                log.warn("Hearing ID is null. Skipping closing tasks.");
                return;
            }

            log.info("Closing active payment pending tasks for Hearing ID: {}, Tenant ID: {}", hearingId, tenantId);

            List<Order> orders = fetchRelevantOrders(hearingId, tenantId);
            if (CollectionUtils.isEmpty(orders)) {
                log.info("No relevant orders found for hearingId: {}", hearingId);
                return;
            }

            for (Order order : orders) {
                log.info("Processing order: {} of type {}", order.getId(), order.getOrderType());
                processTasksForOrder(order, tenantId, requestInfo);
            }

        } catch (Exception e) {
            log.error("Error while closing active payment pending tasks", e);
            throw new CustomException("CLOSE_PAYMENT_PENDING_ERROR", e.getMessage());
        }
    }

    private List<Order> fetchRelevantOrders(String hearingId, String tenantId) {
        log.info("Fetching orders for Hearing ID: {}, Tenant ID: {}", hearingId, tenantId);

        OrderCriteria criteria = OrderCriteria.builder()
                .scheduledHearingNumber(hearingId)
                .status(PUBLISHED)
                .tenantId(tenantId)
                .build();

        OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                .criteria(criteria)
                .pagination(Pagination.builder().limit(100.0).offSet(0.0).build())
                .build();

        OrderListResponse response = getOrders(searchRequest);
        if (response == null || CollectionUtils.isEmpty(response.getList())) {
            log.info("No orders found for Hearing ID: {}", hearingId);
            return null;
        }

        // get orders which are created after this hearing scheduled
        OrderCriteria orderCriteria = OrderCriteria.builder()
                .fromPublishedDate(response.getList().get(0).getCreatedDate())
                .toPublishedDate(System.currentTimeMillis())
                .filingNumber(response.getList().get(0).getFilingNumber())
                .status(PUBLISHED)
                .tenantId(tenantId)
                .build();

        OrderSearchRequest orderSearchRequest = OrderSearchRequest.builder()
                .criteria(orderCriteria)
                .pagination(Pagination.builder().limit(100.0).offSet(0.0).build())
                .build();

        OrderListResponse orderListResponse = getOrders(orderSearchRequest);
        if (orderListResponse == null || CollectionUtils.isEmpty(orderListResponse.getList())) {
            log.info("no orders were published after the hearing was scheduled : {}", hearingId);
            return null;
        }

        List<String> orderTypes = new ArrayList<>(List.of(SUMMONS, WARRANT, NOTICE, PROCLAMATION, ATTACHMENT));

        Order nextScheduleOrder = orderListResponse.getList().stream().filter(order -> order.getScheduledHearingNumber() != null && !order.getScheduledHearingNumber().equals(hearingId)).findFirst().orElse(null);
        if (nextScheduleOrder != null) {
            log.info("Found next schedule order for hearingId: {}", hearingId);
            Long createdDate = nextScheduleOrder.getCreatedDate();
            orderListResponse.getList().removeIf(order -> order.getCreatedDate() >= createdDate);
        }

        List<Order> filteredOrders = orderListResponse.getList().stream()
                .filter(order -> {
                    String orderType = (order.getOrderType() != null)
                            ? order.getOrderType().toUpperCase()
                            : getOrderTypeFromCompositeOrders(order);
                    return orderType != null && orderTypes.contains(orderType);
                })
                .collect(Collectors.toList());

        log.info("Found {} relevant orders (SUMMONS/WARRANT/NOTICE) for hearingId: {}", filteredOrders.size(), hearingId);
        return filteredOrders;
    }

    private String getOrderTypeFromCompositeOrders(Order order) {
        JsonNode compositeItems = mapper.convertValue(order.getCompositeItems(), JsonNode.class);
        String orderType = null;
        if (compositeItems == null || !compositeItems.isArray()) {
            return null;
        }

        for (JsonNode item : compositeItems) {
            orderType = item.path("orderType").textValue();
            List<String> orderTypes = new ArrayList<>(List.of(SUMMONS, WARRANT, NOTICE, PROCLAMATION, ATTACHMENT));
            if (orderType != null && orderTypes.contains(orderType)) {
                orderType = orderType.toUpperCase();
                break;
            }
        }

        return orderType;
    }

    private void processTasksForOrder(Order order, String tenantId, RequestInfo requestInfo) {
        log.info("Searching PENDING_PAYMENT tasks for Order ID: {}", order.getId());

        TaskCriteria taskCriteria = TaskCriteria.builder()
                .orderId(order.getId())
                .tenantId(tenantId)
                .status(PENDING_PAYMENT)
                .build();

        TaskSearchRequest taskSearchRequest = TaskSearchRequest.builder()
                .criteria(taskCriteria)
                .pagination(Pagination.builder().limit(100.0).offSet(0.0).build())
                .build();

        List<Task> taskList = taskUtil.searchTask(taskSearchRequest).getList();

        if (CollectionUtils.isEmpty(taskList)) {
            log.info("No PENDING_PAYMENT tasks found for Order ID: {}", order.getId());
            return;
        }

        log.info("Found {} PENDING_PAYMENT tasks for Order ID: {}", taskList.size(), order.getId());

        for (Task task : taskList) {
            log.info("Expiring task: {}", task.getTaskNumber());
            expireTaskWorkflow(task, tenantId, requestInfo);
            closePaymentPendingTask(task, requestInfo);
        }

        cancelRelatedDemands(tenantId, taskList, requestInfo);
    }

    public void closeActivePaymentPendingTasksOfProcesses(HearingRequest hearingRequest) {
        try {
            String hearingId = hearingRequest.getHearing().getHearingId();
            String tenantId = hearingRequest.getHearing().getTenantId();
            RequestInfo requestInfo = hearingRequest.getRequestInfo();
            Role role = Role.builder()
                    .code(PAYMENT_COLLECTOR)
                    .name(PAYMENT_COLLECTOR)
                    .tenantId(tenantId)
                    .build();
            requestInfo.getUserInfo().getRoles().add(role);

            if (hearingId == null) {
                log.warn("Hearing ID is null. Skipping the closing tasks process.");
                return;
            }

            log.info("Closing active payment pending tasks of processes for Hearing ID: {}, Tenant ID: {}", hearingId, tenantId);

            List<Order> orders = fetchRelevantOrders(hearingId, tenantId);
            if (CollectionUtils.isEmpty(orders)) {
                log.info("No relevant orders are found for hearingId: {}", hearingId);
                return;
            }

            for (Order order : orders) {
                log.info("Processing orders : {} of type {}", order.getId(), order.getOrderType());
                processTasksForOrderOfProcesses(order, tenantId, requestInfo);
            }

        } catch (Exception e) {
            log.error("Error while closing active payment pending tasks", e);
        }
    }

    private void processTasksForOrderOfProcesses(Order order, String tenantId, RequestInfo requestInfo) {
        log.info("Searching PENDING_PAYMENT task management process for Order ID: {}", order.getId());

        TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                .filingNumber(order.getFilingNumber())
                .status(PENDING_PAYMENT)
                .orderNumber(order.getOrderNumber())
                .tenantId(tenantId)
                .build();

        org.pucar.dristi.web.models.taskManagement.TaskSearchRequest searchRequest = org.pucar.dristi.web.models.taskManagement.TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(searchCriteria)
                .build();

        // close all the pending task's with or with 
        closeProcessesPendingTasks(requestInfo, order);
        List<TaskManagement> taskManagementList = taskManagementUtil.searchTaskManagement(searchRequest);
        if (CollectionUtils.isEmpty(taskManagementList)) {
            log.info("No PENDING_PAYMENT task management found for Order ID: {}", order.getId());
            // expiring the pending tasks which not even single action taken
            return;
        }

        log.info("Found {} PENDING_PAYMENT task management for Order ID: {}", taskManagementList.size(), order.getId());

        // close the pending tasks which not even single action taken

        for (TaskManagement taskManagement : taskManagementList) {
            log.info("Expiring the task: {}", taskManagement.getTaskManagementNumber());
            expireTaskManagementWorkflow(taskManagement, requestInfo);
        }

        cancelRelatedDemandsOfTaskManagement(tenantId, taskManagementList, requestInfo);
    }

    private void closeProcessesPendingTasks(RequestInfo requestInfo, Order order) {

        String filingNumber = order.getFilingNumber();

        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);

        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
        String caseCnrNumber = textValueOrNull(caseDetails, CASE_CNR);
        String caseId = textValueOrNull(caseDetails, CASE_ID);
        String caseTitle = textValueOrNull(caseDetails, CASE_TITLE);

        log.info("Closing manual pending tasks for order without action | orderId: {} | orderNumber: {} | orderType: {} | filingNumber: {}",
                order.getId(), order.getOrderNumber(), order.getOrderType(), filingNumber);
        
        closeOrderLevelTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle);
        
        List<String> orderItemIds = extractOrderItemIds(order);
        log.debug("Extracted order item IDs | count: {}", orderItemIds.size());

        if (orderItemIds.isEmpty()) {
            log.info("No order items found for order | orderId: {} | orderNumber: {} - skipping item-level task closure", 
                    order.getId(), order.getOrderNumber());
            return;
        }

        log.info("Closing manual pending tasks for order items | orderId: {} | itemCount: {} | itemIds: {}",
                order.getId(), orderItemIds.size(), orderItemIds);
        closeOrderItemTasks(orderItemIds, order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle);

    }

    /**
     * Closes order-level pending tasks based on order type
     * For SUMMONS orders: closes tasks for COMPLAINANT, RESPONDENT, and COURT
     * For other orders: closes general order task
     */
    private void closeOrderLevelTasks(Order order, RequestInfo requestInfo, String filingNumber, 
                                    String caseCnrNumber, String caseId, String caseTitle) {
        if (SUMMONS.equalsIgnoreCase(order.getOrderType())) {
            // For SUMMONS orders, close tasks for all parties
            log.info("Processing SUMMONS order - closing tasks for all parties | orderNumber: {}", order.getOrderNumber());
            closePartySpecificTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle, PartyType.COMPLAINANT, null);
            closePartySpecificTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle, PartyType.RESPONDENT, null);
            closePartySpecificTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle, PartyType.COURT, null);
            
            log.info("Closing SUMMONS order tasks without party type | orderNumber: {}", order.getOrderNumber());
            closeTaskWithoutPartyType(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle);
        } else if(NOTICE.equalsIgnoreCase(order.getOrderType())) {
            log.info("Processing NOTICE order - closing general order task | orderNumber: {}", order.getOrderNumber());
            closePartySpecificTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle, PartyType.COMPLAINANT, null);

            log.info("Closing NOTICE order tasks without party type | orderNumber: {}", order.getOrderNumber());
            closeTaskWithoutPartyType(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle);
        }
        else {
            String generalTaskId = MANUAL + order.getOrderNumber();
            log.info("Closing general order task | taskId: {}", generalTaskId);
            pendingTaskUtil.closeManualPendingTask(generalTaskId, requestInfo, filingNumber, 
                    caseCnrNumber, caseId, caseTitle, order.getOrderType());
        }
    }

    /**
     * Closes pending tasks for a specific party type
     */
    private void closePartySpecificTasks(Order order, RequestInfo requestInfo, String filingNumber,
                                         String caseCnrNumber, String caseId, String caseTitle, PartyType partyType, String itemId) {
        String taskId;
        if(itemId != null) {
            taskId = MANUAL + itemId + "_" + partyType.toString() + "_" + order.getOrderNumber();
        }
        else {
            taskId = MANUAL + partyType.toString() + "_" + order.getOrderNumber();
        }
        log.info("Closing party-specific task | partyType: {} | taskId: {} | orderNumber: {}",
                partyType, taskId, order.getOrderNumber());
        pendingTaskUtil.closeManualPendingTask(taskId, requestInfo, filingNumber,
                caseCnrNumber, caseId, caseTitle, order.getOrderType());
    }

    /**
     * Closes pending tasks without party type to support already created pending tasks
     * This handles legacy tasks that were created without party type prefixes
     */
    private void closeTaskWithoutPartyType(Order order, RequestInfo requestInfo, String filingNumber, 
                                         String caseCnrNumber, String caseId, String caseTitle) {
        String taskId = MANUAL + order.getOrderNumber();
        log.info("Closing task without party type | taskId: {} | orderNumber: {}",
                taskId, order.getOrderNumber());
        pendingTaskUtil.closeManualPendingTask(taskId, requestInfo, filingNumber, 
                caseCnrNumber, caseId, caseTitle, order.getOrderType());
    }

    /**
     * Closes pending tasks for all order items
     * For each item, closes tasks for COMPLAINANT, RESPONDENT, COURT, and the specific item
     */
    private void closeOrderItemTasks(List<String> orderItemIds, Order order, RequestInfo requestInfo, 
                                   String filingNumber, String caseCnrNumber, String caseId, String caseTitle) {
        for (String itemId : orderItemIds) {
            log.info("Processing order item | itemId: {} | orderNumber: {}", itemId, order.getOrderNumber());
            
            // Close tasks for all parties for this order item
            closePartySpecificTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle, PartyType.COMPLAINANT, itemId);
            closePartySpecificTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle, PartyType.RESPONDENT, itemId);
            closePartySpecificTasks(order, requestInfo, filingNumber, caseCnrNumber, caseId, caseTitle, PartyType.COURT, itemId);
            
            // Close task specific to this order item
            String itemTaskId = MANUAL + itemId + "_" + order.getOrderNumber();
            log.info("Closing item-specific task | itemId: {} | taskId: {} | orderNumber: {}",
                    itemId, itemTaskId, order.getOrderNumber());
            pendingTaskUtil.closeManualPendingTask(itemTaskId, requestInfo, filingNumber, 
                    caseCnrNumber, caseId, caseTitle, order.getOrderType());
        }
    }

    private List<String> extractOrderItemIds(Order order) {

        List<String> complaintOrderItemIds = new ArrayList<>();

        if (order.getCompositeItems() != null) {
            Object compositeOrderItem = order.getCompositeItems();
            ArrayNode arrayNode = mapper.convertValue(compositeOrderItem, ArrayNode.class);

            if (arrayNode != null && !arrayNode.isEmpty()) {
                for (int i = 0; i < arrayNode.size(); i++) {
                    ObjectNode itemNode = (ObjectNode) arrayNode.get(i);
                    if (itemNode.has("id")) {
                        String id = itemNode.get("id").textValue();
                        complaintOrderItemIds.add(id);
                    }
                }
            }
        }

        return complaintOrderItemIds;

    }

    private void expireTaskManagementWorkflow(TaskManagement taskManagement, RequestInfo requestInfo) {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(EXPIRE);
        taskManagement.setWorkflow(workflow);
        requestInfo.getUserInfo().getRoles().add(Role.builder().code(SYSTEM_ADMIN).name(SYSTEM_ADMIN).tenantId(taskManagement.getTenantId()).build());
        TaskManagementRequest taskManagementRequest = TaskManagementRequest.builder()
                .requestInfo(requestInfo)
                .taskManagement(taskManagement)
                .build();
        TaskManagementResponse response = taskManagementUtil.updateTaskManagement(taskManagementRequest);
        log.info("Updated task management: {} with response: {}", taskManagement.getTaskManagementNumber(), response);
    }

    private void closePaymentPendingTaskOfTaskManagement(TaskManagement taskManagement, RequestInfo requestInfo) {

        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(taskManagement.getFilingNumber()).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);

        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
        String caseCnrNumber = textValueOrNull(caseDetails, CASE_CNR);
        String caseId = textValueOrNull(caseDetails, CASE_ID);
        String caseTitle = textValueOrNull(caseDetails, CASE_TITLE);

        // close manual pending task of schedule of hearing
        log.info("close manual pending task of schedule of hearing");
        pendingTaskUtil.closeManualPendingTask(MANUAL + taskManagement.getPartyType() + "_" +taskManagement.getOrderNumber(), requestInfo, taskManagement.getFilingNumber(), caseCnrNumber, caseId, caseTitle, taskManagement.getTaskType());

        if (taskManagement.getOrderItemId() != null) {
            String itemId = taskManagement.getOrderItemId();
            String referenceId = MANUAL + itemId + "_" + taskManagement.getPartyType() + "_" + taskManagement.getOrderNumber();
            pendingTaskUtil.closeManualPendingTask(referenceId, requestInfo, taskManagement.getFilingNumber(), caseCnrNumber, caseId, caseTitle, taskManagement.getTaskType());
        }
    }

    private void cancelRelatedDemandsOfTaskManagement(String tenantId, List<TaskManagement> taskManagementList, RequestInfo requestInfo) {

        Set<String> consumerCodes = taskManagementList.stream()
                .map(task -> task.getTaskManagementNumber() + "_" + configuration.getTaskManagementSuffix())
                .collect(Collectors.toSet());

        DemandCriteria criteria = new DemandCriteria();
        criteria.setConsumerCode(consumerCodes);
        criteria.setTenantId(tenantId);

        RequestInfoWrapper wrapper = new RequestInfoWrapper();
        wrapper.setRequestInfo(requestInfo);

        if (consumerCodes.isEmpty()) {
            log.info("No consumer codes found for task management");
            return;
        }

        DemandResponse demandResponse = demandUtil.searchDemand(criteria, wrapper);
        if (CollectionUtils.isEmpty(demandResponse.getDemands())) {
            log.info("No demands found for consumer codes of task management: {}", consumerCodes);
            return;
        }

        demandResponse.getDemands().forEach(d -> d.setStatus(Demand.StatusEnum.CANCELLED));
        log.info("Marking {} demands as CANCELLED ", demandResponse.getDemands().size());

        DemandRequest demandRequest = new DemandRequest();
        demandRequest.setRequestInfo(requestInfo);
        demandRequest.setDemands(demandResponse.getDemands());

        demandUtil.updateDemand(demandRequest);
        log.info("Updated demand status to CANCELLED for consumer codes : {}", consumerCodes);
    }

    private void closePaymentPendingTask(Task task, RequestInfo requestInfo) {
        String referenceId = MANUAL + task.getTaskNumber();
        pendingTaskUtil.closeManualPendingTask(referenceId, requestInfo, task.getFilingNumber(), task.getCnrNumber(), task.getCaseId(), task.getCaseTitle(), task.getTaskType());
    }

    private void expireTaskWorkflow(Task task, String tenantId, RequestInfo requestInfo) {
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(EXPIRE);
        task.setWorkflow(workflow);
        TaskRequest taskRequest = TaskRequest.builder()
                .requestInfo(requestInfo)
                .task(task)
                .build();
        TaskResponse response = taskUtil.updateTask(taskRequest);
        log.info("Updated task: {} with response: {}", task.getTaskNumber(), response);
    }

    private void cancelRelatedDemands(String tenantId, List<Task> tasks, RequestInfo requestInfo) {
        Set<String> consumerCodes = tasks.stream()
                .flatMap(task -> extractConsumerCode(task, requestInfo).stream())
                .collect(Collectors.toSet());

        log.info("Fetching demands for consumer codes: {}", consumerCodes);

        DemandCriteria criteria = new DemandCriteria();
        criteria.setConsumerCode(consumerCodes);
        criteria.setTenantId(tenantId);

        RequestInfoWrapper wrapper = new RequestInfoWrapper();
        wrapper.setRequestInfo(requestInfo);

        if (consumerCodes.isEmpty()) {
            log.info("No consumer codes found for tasks");
            return;
        }

        DemandResponse demandResponse = demandUtil.searchDemand(criteria, wrapper);
        if (CollectionUtils.isEmpty(demandResponse.getDemands())) {
            log.info("No demands found for consumer codes: {}", consumerCodes);
            return;
        }

        demandResponse.getDemands().forEach(d -> d.setStatus(Demand.StatusEnum.CANCELLED));
        log.info("Marking {} demands as CANCELLED", demandResponse.getDemands().size());

        DemandRequest demandRequest = new DemandRequest();
        demandRequest.setRequestInfo(requestInfo);
        demandRequest.setDemands(demandResponse.getDemands());

        demandUtil.updateDemand(demandRequest);
        log.info("Updated demand status to CANCELLED for consumer codes: {}", consumerCodes);
    }

    public OrderListResponse getOrders(OrderSearchRequest searchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderSearchEndPoint());
        try {
            log.info("Calling order service with URI: {}", uri);
            Object response = serviceRequestRepository.fetchResult(uri, searchRequest);
            return mapper.convertValue(response, OrderListResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            return null;
        }
    }

    public OrderResponse createOrder(OrderRequest orderRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderCreateEndPoint());
        Object response;
        OrderResponse orderResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, orderRequest);
            orderResponse = mapper.convertValue(response, OrderResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderResponse;
    }

    public List<String> extractConsumerCode(Task task, RequestInfo requestInfo) {
        String taskNumber = task.getTaskNumber();
        String deliveryChannel = getDeliveryChannel(task);
        if (deliveryChannel == null) {
            log.info("delivery channel not found for task: {}", taskNumber);
            return Collections.emptyList();
        }
        String tenantId = task.getTenantId();

        JSONArray mdmsData = mdmsUtil.fetchMdmsData(
                requestInfo,
                tenantId,
                configuration.getPaymentBusinessServiceName(),
                Collections.singletonList(PAYMENTTYPE)
        ).get(configuration.getPaymentBusinessServiceName()).get(PAYMENTTYPE);

        List<String> consumerCodes = new ArrayList<>();

        for (Object obj : mdmsData) {
            if (obj instanceof Map<?, ?> mapObj) {
                Object channelObj = mapObj.get("deliveryChannel");
                if (channelObj != null && channelObj.toString().toUpperCase().contains(deliveryChannel.toUpperCase())) {
                    Object suffixObj = mapObj.get("suffix");
                    if (suffixObj != null) {
                        consumerCodes.add(taskNumber + "_" + suffixObj);
                    }
                }
            }
        }

        return consumerCodes;
    }



    private String getDeliveryChannel(Task task) {
        JsonNode taskDetails = mapper.convertValue(task.getTaskDetails(), JsonNode.class);

        ObjectNode deliveryChannels = null;
        if (taskDetails.has("deliveryChannels") && !taskDetails.get("deliveryChannels").isNull()) {
            deliveryChannels = (ObjectNode) taskDetails.get("deliveryChannels");
        }

        if (deliveryChannels == null) {
            return null;
        }

        if (deliveryChannels.has("channelName") && !deliveryChannels.get("channelName").isNull()) {
            return deliveryChannels.get("channelName").textValue();
        }
        return null;
    }

    private String textValueOrNull(JsonNode node, String field) {
        return node.get(field).isNull() ? null : node.get(field).textValue();
    }

}
