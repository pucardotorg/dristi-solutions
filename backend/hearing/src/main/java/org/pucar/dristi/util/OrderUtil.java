package org.pucar.dristi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
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

import java.util.List;
import java.util.Map;
import java.util.Set;
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

    @Autowired
    public OrderUtil(ServiceRequestRepository serviceRequestRepository, ObjectMapper mapper, Configuration configuration,
                     TaskUtil taskUtil, WorkflowUtil workflowUtil, Producer producer, DemandUtil demandUtil) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.mapper = mapper;
        this.configuration = configuration;
        this.taskUtil = taskUtil;
        this.workflowUtil = workflowUtil;
        this.producer = producer;
        this.demandUtil = demandUtil;
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
                .filter(order -> List.of(SUMMONS, WARRANT, NOTICE).contains(order.getOrderType()))
                .collect(Collectors.toList());

        log.info("Found {} relevant orders (SUMMONS/WARRANT/NOTICE) for hearingId: {}", filteredOrders.size(), hearingId);
        return filteredOrders;
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
        }

        cancelRelatedDemands(tenantId, taskList, requestInfo);
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
                .map(this::extractConsumerCode)
                .collect(Collectors.toSet());

        log.info("Fetching demands for consumer codes: {}", consumerCodes);

        DemandCriteria criteria = new DemandCriteria();
        criteria.setConsumerCode(consumerCodes);
        criteria.setTenantId(tenantId);

        RequestInfoWrapper wrapper = new RequestInfoWrapper();
        wrapper.setRequestInfo(requestInfo);

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

    public String extractConsumerCode(Task task) {
        Map<String, Object> detailsMap = mapper.convertValue(task.getTaskDetails(), new TypeReference<>() {
        });
        return (String) detailsMap.get("consumerCode");
    }

}
