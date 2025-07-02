package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.project.TaskResponse;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.demand.*;
import org.pucar.dristi.web.models.orders.*;
import org.pucar.dristi.web.models.orders.Order;
import org.pucar.dristi.web.models.tasks.*;
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

    @Autowired
    public OrderUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper mapper, Configuration configuration,
                     TaskUtil taskUtil, WorkflowUtil workflowUtil, Producer producer, DemandUtil demandUtil, MdmsUtil mdmsUtil, PendingTaskUtil pendingTaskUtil) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.mapper = mapper;
        this.configuration = configuration;
        this.taskUtil = taskUtil;
        this.workflowUtil = workflowUtil;
        this.producer = producer;
        this.demandUtil = demandUtil;
        this.mdmsUtil = mdmsUtil;
        this.pendingTaskUtil = pendingTaskUtil;
    }

    public void closeActivePaymentPendingTasks(HearingRequest hearingRequest) {
        try {
            String hearingId = hearingRequest.getHearing().getHearingId();
            String tenantId = hearingRequest.getHearing().getTenantId();
            RequestInfo requestInfo = hearingRequest.getRequestInfo();

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
                .hearingNumber(hearingId)
                .status(PUBLISHED)
                .tenantId(tenantId)
                .build();

        OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                .criteria(criteria)
                .pagination(Pagination.builder().limit(100.0).offSet(0.0).build())
                .build();

        OrderListResponse response = getOrders(searchRequest);
        List<Order> filteredOrders = response.getList().stream()
                .filter(order -> List.of(SUMMONS, WARRANT, NOTICE).contains(order.getOrderType() != null ? order.getOrderType().toUpperCase() : getOrderTypeFromCompositeOrders(order)))
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
            if (orderType != null && List.of(SUMMONS, WARRANT, NOTICE).contains(orderType)) {
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

    private OrderListResponse getOrders(OrderSearchRequest searchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderSearchEndPoint());
        try {
            log.info("Calling order service with URI: {}", uri);
            Object response = serviceRequestRepository.fetchResult(uri, searchRequest);
            return mapper.convertValue(response, OrderListResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());
        }
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

}
