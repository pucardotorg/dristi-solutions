package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.web.models.Task;
import org.pucar.dristi.web.models.TaskCriteria;
import org.pucar.dristi.web.models.TaskRequest;
import org.pucar.dristi.web.models.TaskSearchRequest;
import org.pucar.dristi.web.models.WorkflowObject;
import org.pucar.dristi.web.models.order.Order;
import org.pucar.dristi.web.models.order.OrderRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class WarrantReissueService {

    private final TaskService taskService;
    private final Configuration config;
    private final Producer producer;
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final OrderUtil orderUtil;

    @Autowired
    public WarrantReissueService(TaskService taskService, Configuration config, Producer producer,
                                  ObjectMapper objectMapper, UserService userService, OrderUtil orderUtil) {
        this.taskService = taskService;
        this.config = config;
        this.producer = producer;
        this.objectMapper = objectMapper;
        this.userService = userService;
        this.orderUtil = orderUtil;
    }

    /**
     * Handles Scenario 1: Hearing Rescheduled - Update warrants in-place.
     */
    public void handleHearingRescheduled(RequestInfo requestInfo, String filingNumber, Long newHearingDate, String orderId) {
        log.info("Handling hearing reschedule for filingNumber: {}, orderId: {}", filingNumber, orderId);

        String msgId = requestInfo.getMsgId();
        requestInfo = userService.createInternalMicroserviceRequestInfo();
        requestInfo.setMsgId(msgId);

        // 1. Fetch all ACTIVE warrants for this case
        List<Task> activeWarrants = fetchActiveWarrants(requestInfo, filingNumber, orderId, false);
        if (activeWarrants.isEmpty()) {
            log.info("No active warrants for filing: {}", filingNumber);
            return;
        }

        for (Task warrant : activeWarrants) {
            String currentState = warrant.getStatus();
            boolean isIcops = isIcopsDeliveryChannel(warrant);

            // Store previous state and increment revision number
            setAdditionalDetail(warrant, "previousState", currentState);
            incrementRevisionNumber(warrant);
            if (newHearingDate != null) {
                updateHearingDateInTaskDetails(warrant, newHearingDate);
            }

            WorkflowObject workflow = new WorkflowObject();
            if (isIcops && !PENDING_PAYMENT.equalsIgnoreCase(currentState)) {
                // iCoPS channel: WARRANT_REISSUE_ICOPS -> WARRANT_REISSUED
                workflow.setAction(WARRANT_REISSUE_ICOPS);
            } else {
                // Non-iCoPS OR iCoPS still in PENDING_PAYMENT: WARRANT_REISSUE -> PENDING_PAYMENT
                workflow.setAction(WARRANT_REISSUE);
            }
            
            warrant.setWorkflow(workflow);
            
            TaskRequest taskRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(warrant)
                    .build();

            try {
                taskService.updateTask(taskRequest);
                log.info("Triggered reissue for warrant: {} with action: {}", warrant.getTaskNumber(), workflow.getAction());
            } catch (Exception e) {
                log.error("Error updating warrant during reschedule: {}", warrant.getTaskNumber(), e);
            }
        }
    }

    /**
     * Handles Scenario 2: Hearing Completed and New Hearing Scheduled
     * Terminates existing active warrants and creates new warrants.
     */
    public void handleHearingCompletedAndNewHearingScheduled(RequestInfo requestInfo, String filingNumber, Long newHearingDate, String newOrderId) {
        log.info("Handling hearing completed and new hearing scheduled for filingNumber: {}, newOrderId: {}", filingNumber, newOrderId);

        String msgId = requestInfo.getMsgId();
        requestInfo = userService.createInternalMicroserviceRequestInfo();
        requestInfo.setMsgId(msgId);

        // Fetch all ACTIVE warrants and warrants EXPIRED today for this case
        // We pass null for orderId because we want to find the OLD warrants, which are not linked to the NEW orderId
        List<Task> activeWarrants = fetchActiveWarrants(requestInfo, filingNumber, null, true);
        if (activeWarrants.isEmpty()) {
            log.info("No active or recently expired warrants for filing: {}", filingNumber);
            return;
        }

        List<String> collectedPartyUniqueIds = new ArrayList<>();

        for (Task warrant : activeWarrants) {
            String currentState = warrant.getStatus();
            boolean isIcops = isIcopsDeliveryChannel(warrant);
            boolean isAlreadyExpired = EXPIRED.equalsIgnoreCase(currentState);

            if (!isAlreadyExpired) {
                // 1. Terminate old warrant
                WorkflowObject terminateWorkflow = new WorkflowObject();
                terminateWorkflow.setAction(REISSUE_WITH_NEW_WARRANT);
                terminateWorkflow.setDocuments(Collections.singletonList(new org.egov.common.contract.models.Document()));
                warrant.setWorkflow(terminateWorkflow);
                setAdditionalDetail(warrant, "previousState", currentState);

                TaskRequest terminateRequest = TaskRequest.builder()
                        .requestInfo(requestInfo)
                        .task(warrant)
                        .build();

                try {
                    taskService.updateTask(terminateRequest);
                    log.info("Terminated old warrant: {}", warrant.getTaskNumber());
                } catch (Exception e) {
                    log.error("Error terminating warrant: {}", warrant.getTaskNumber(), e);
                    continue; // Skip creating new warrant if termination failed
                }
            } else {
                log.info("Warrant {} is already EXPIRED, skipping termination.", warrant.getTaskNumber());
            }

            // 2. Create new warrant using createTask
            Task newWarrant = cloneWarrantForReissue(warrant, newHearingDate, newOrderId);
            WorkflowObject createWorkflow = new WorkflowObject();

            boolean shouldSkipPayment =
                    (isIcops && !PENDING_PAYMENT.equalsIgnoreCase(currentState) && !isAlreadyExpired) || isCourtWitness(newWarrant.getTaskDetails());
            
            if (shouldSkipPayment) {
                createWorkflow.setAction(CREATE_WITH_OUT_PAYMENT);
            } else {
                createWorkflow.setAction(CREATE);
            }
            createWorkflow.setDocuments(Collections.singletonList(new org.egov.common.contract.models.Document()));
            newWarrant.setWorkflow(createWorkflow);

            TaskRequest createRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(newWarrant)
                    .build();

            try {
                Task createdWarrant = taskService.createTask(createRequest);
                log.info("Created new warrant for reissue: {}, linked to old warrant: {}", createdWarrant.getTaskNumber(), warrant.getTaskNumber());
                String partyUniqueId = extractPartyUniqueId(createdWarrant);
                if (partyUniqueId != null && !collectedPartyUniqueIds.contains(partyUniqueId)) {
                    collectedPartyUniqueIds.add(partyUniqueId);
                }
            } catch (Exception e) {
                log.error("Error creating new warrant for reissue", e);
            }
        }

        if (!collectedPartyUniqueIds.isEmpty() && newOrderId != null) {
            updateOrderPartyUniqueIds(requestInfo, newOrderId, collectedPartyUniqueIds);
        }
    }

    public boolean isCourtWitness(Object taskDetails) {
        if (!(taskDetails instanceof JsonNode taskDetailsNode)) {
            return false;
        }

        return COURT_WITNESS.equalsIgnoreCase(
                taskDetailsNode
                        .path("respondentDetails")
                        .path("ownerType")
                        .textValue()
        );
    }

    private Task cloneWarrantForReissue(Task oldWarrant, Long newHearingDate, String newOrderId) {
        Task newWarrant = new Task();
        newWarrant.setTenantId(oldWarrant.getTenantId());
        newWarrant.setFilingNumber(oldWarrant.getFilingNumber());
        newWarrant.setCaseId(oldWarrant.getCaseId());
        newWarrant.setReferenceId(oldWarrant.getReferenceId());
        newWarrant.setTaskType(oldWarrant.getTaskType());
        newWarrant.setTaskDescription(oldWarrant.getTaskDescription());
        newWarrant.setAssignedTo(oldWarrant.getAssignedTo());
        newWarrant.setAmount(oldWarrant.getAmount());
        newWarrant.setCourtId(oldWarrant.getCourtId());
        newWarrant.setCnrNumber(oldWarrant.getCnrNumber());
        newWarrant.setCaseTitle(oldWarrant.getCaseTitle());

        if (newOrderId != null) {
            try {
                newWarrant.setOrderId(UUID.fromString(newOrderId));
            } catch (Exception e) {
                log.warn("Invalid newOrderId format: {}", newOrderId);
            }
        }

        try {
            if (oldWarrant.getTaskDetails() != null) {
                ObjectNode taskDetails = (ObjectNode) objectMapper.readTree(objectMapper.writeValueAsString(oldWarrant.getTaskDetails()));
                newWarrant.setTaskDetails(taskDetails);
            }
        } catch (Exception e) {
            log.error("Error cloning task details", e);
        }

        if (newHearingDate != null) {
            updateHearingDateInTaskDetails(newWarrant, newHearingDate);
        }

        ObjectNode additionalDetails = objectMapper.createObjectNode();
        if (oldWarrant.getAdditionalDetails() != null && oldWarrant.getAdditionalDetails() instanceof ObjectNode) {
            ObjectNode oldAdditionalDetails = (ObjectNode) oldWarrant.getAdditionalDetails();
            if (oldAdditionalDetails.has("iCopsProcessNumber")) {
                additionalDetails.set("iCopsProcessNumber", oldAdditionalDetails.get("iCopsProcessNumber"));
            }
        }
        additionalDetails.put("reissueSourceWarrantId", oldWarrant.getId() != null ? oldWarrant.getId().toString() : null);
        
        int currentRevision = 0;
        if (oldWarrant.getAdditionalDetails() != null && oldWarrant.getAdditionalDetails() instanceof ObjectNode) {
             ObjectNode oldAdditionalDetails = (ObjectNode) oldWarrant.getAdditionalDetails();
             if (oldAdditionalDetails.has("reissueRevisionNumber")) {
                 currentRevision = oldAdditionalDetails.get("reissueRevisionNumber").asInt();
             }
        }
        additionalDetails.put("reissueRevisionNumber", currentRevision + 1);

        newWarrant.setAdditionalDetails(additionalDetails);

        return newWarrant;
    }

    public void handleBailAccepted(RequestInfo requestInfo, String filingNumber) {
        log.info("Handling bail accepted for filingNumber: {}", filingNumber);

        String msgId = requestInfo.getMsgId();
        requestInfo = userService.createInternalMicroserviceRequestInfo();
        requestInfo.setMsgId(msgId);

        List<Task> activeWarrants = fetchActiveWarrants(requestInfo, filingNumber, null, false);
        if (activeWarrants.isEmpty()) {
            log.info("No active warrants to expire for filingNumber: {}", filingNumber);
            return;
        }

        for (Task warrant : activeWarrants) {
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(EXPIRE);
            warrant.setWorkflow(workflow);

            TaskRequest taskRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(warrant)
                    .build();
            try {
                taskService.updateTask(taskRequest);
                log.info("Expired/abandoned warrant: {} with action: {}", warrant.getTaskNumber(), workflow.getAction());
            } catch (Exception e) {
                log.error("Error expiring warrant: {}", warrant.getTaskNumber(), e);
            }
        }
    }

    private List<Task> fetchActiveWarrants(RequestInfo requestInfo, String filingNumber, String orderId, boolean includeExpiredToday) {
        TaskCriteria criteria = TaskCriteria.builder()
                .filingNumber(filingNumber)
                .taskType(WARRANT)
                .build();

        if (orderId != null) {
            try {
                criteria.setOrderId(UUID.fromString(orderId));
            } catch (Exception e) {
                log.warn("Invalid orderId format: {}", orderId);
            }
        }

        TaskSearchRequest searchRequest = new TaskSearchRequest();
        searchRequest.setRequestInfo(requestInfo);
        searchRequest.setCriteria(criteria);

        List<Task> tasks = taskService.searchTask(searchRequest);
        List<Task> activeWarrants = new ArrayList<>();
        
        for (Task task : tasks) {
            String status = task.getStatus();
            // Active states based on workflow: PENDING_PAYMENT, ISSUE_WARRANT, WARRANT_SENT, WARRANT_REISSUED
            if (PENDING_PAYMENT.equalsIgnoreCase(status) ||
                ISSUE_WARRANT.equalsIgnoreCase(status) ||
                WARRANT_REISSUED.equalsIgnoreCase(status) ||
                WARRANT_SENT.equalsIgnoreCase(status) ) {
                activeWarrants.add(task);
            } else if (includeExpiredToday && EXPIRED.equalsIgnoreCase(status)) {
                Long oldHearingStartTime = getHearingDateFromTask(task);
                if (task.getAuditDetails() != null && task.getAuditDetails().getLastModifiedTime() != null && oldHearingStartTime != null) {
                    long lastModifiedTime = task.getAuditDetails().getLastModifiedTime();
                    Calendar cal1 = Calendar.getInstance();
                    cal1.setTimeInMillis(oldHearingStartTime);
                    Calendar cal2 = Calendar.getInstance();
                    cal2.setTimeInMillis(lastModifiedTime);
                    boolean isSameDay = cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
                            cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
                    if (isSameDay) {
                        activeWarrants.add(task);
                    }
                }
            }
        }
        return activeWarrants;
    }

    private Long getHearingDateFromTask(Task task) {
        try {
            if (task.getTaskDetails() != null) {
                JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);
                if (taskDetails.has("caseDetails") && taskDetails.get("caseDetails").has("hearingDate")) {
                    return taskDetails.get("caseDetails").get("hearingDate").asLong();
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract hearingDate from task: {}", task.getTaskNumber());
        }
        return null;
    }

    private boolean isIcopsDeliveryChannel(Task task) {
        try {
            JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);
            if (taskDetails != null && taskDetails.has("deliveryChannels") && !taskDetails.get("deliveryChannels").isNull()) {
                JsonNode deliveryChannels = taskDetails.get("deliveryChannels");
                if (deliveryChannels.has(CHANNEL_CODE) && !deliveryChannels.get(CHANNEL_CODE).isNull()) {
                    String channelCode = deliveryChannels.get(CHANNEL_CODE).textValue();
                    return POLICE.equalsIgnoreCase(channelCode);
                }
            }
        } catch (Exception e) {
            log.error("Error checking iCoPS delivery channel: ", e);
        }
        return false;
    }

    private void setAdditionalDetail(Task task, String key, Object value) {
        ObjectNode additionalDetails;
        if (task.getAdditionalDetails() == null || !(task.getAdditionalDetails() instanceof ObjectNode)) {
            additionalDetails = objectMapper.createObjectNode();
        } else {
            additionalDetails = (ObjectNode) task.getAdditionalDetails();
        }

        if (value instanceof String) {
            additionalDetails.put(key, (String) value);
        } else if (value instanceof Long) {
            additionalDetails.put(key, (Long) value);
        } else if (value instanceof Integer) {
            additionalDetails.put(key, (Integer) value);
        } else if (value instanceof Boolean) {
            additionalDetails.put(key, (Boolean) value);
        } else if (value == null) {
            additionalDetails.putNull(key);
        } else {
            // Fallback for other types (Double, nested objects, arrays, etc.)
            log.warn("setAdditionalDetail received unexpected value type {} for key {}; converting via objectMapper",
                    value.getClass().getName(), key);
            additionalDetails.set(key, objectMapper.convertValue(value, JsonNode.class));
        }

        task.setAdditionalDetails(additionalDetails);
    }

    private void incrementRevisionNumber(Task task) {
        ObjectNode additionalDetails;
        if (task.getAdditionalDetails() == null || !(task.getAdditionalDetails() instanceof ObjectNode)) {
            additionalDetails = objectMapper.createObjectNode();
        } else {
            additionalDetails = (ObjectNode) task.getAdditionalDetails();
        }

        int currentRevision = 0;
        if (additionalDetails.has("reissueRevisionNumber")) {
            currentRevision = additionalDetails.get("reissueRevisionNumber").asInt();
        }
        additionalDetails.put("reissueRevisionNumber", currentRevision + 1);
        task.setAdditionalDetails(additionalDetails);
    }

    private void updateHearingDateInTaskDetails(Task task, Long newHearingDate) {
        try {
            ObjectNode taskDetails;
            if (task.getTaskDetails() instanceof ObjectNode) {
                taskDetails = (ObjectNode) task.getTaskDetails();
            } else {
                taskDetails = objectMapper.createObjectNode();
            }

            ObjectNode caseDetails;
            if (taskDetails.has("caseDetails") && taskDetails.get("caseDetails") instanceof ObjectNode) {
                caseDetails = (ObjectNode) taskDetails.get("caseDetails");
            } else {
                caseDetails = objectMapper.createObjectNode();
                taskDetails.set("caseDetails", caseDetails);
            }

            caseDetails.put("hearingDate", newHearingDate);
            task.setTaskDetails(taskDetails);
        } catch (Exception e) {
            log.error("Error updating hearing date in taskDetails: ", e);
        }
    }

    private String extractPartyUniqueId(Task task) {
        try {
            if (task.getTaskDetails() != null) {
                JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);
                JsonNode respondentUniqueId = taskDetails.path("respondentDetails").path("uniqueId");
                if (!respondentUniqueId.isMissingNode() && !respondentUniqueId.isNull()) {
                    return respondentUniqueId.asText();
                }
                JsonNode witnessUniqueId = taskDetails.path("witnessDetails").path("uniqueId");
                if (!witnessUniqueId.isMissingNode() && !witnessUniqueId.isNull()) {
                    return witnessUniqueId.asText();
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract partyUniqueId from task: {}", task.getTaskNumber());
        }
        return null;
    }

    private void updateOrderPartyUniqueIds(RequestInfo requestInfo, String orderId, List<String> newPartyUniqueIds) {
        try {
            Order order = orderUtil.getOrderByOrderId(requestInfo, orderId);
            List<String> partyUniqueIds = order.getPartyUniqueIds();
            if (partyUniqueIds == null) {
                partyUniqueIds = new ArrayList<>();
            }
            for (String id : newPartyUniqueIds) {
                if (!partyUniqueIds.contains(id)) {
                    partyUniqueIds.add(id);
                }
            }
            order.setPartyUniqueIds(partyUniqueIds);

            OrderRequest orderRequest = OrderRequest.builder()
                    .requestInfo(requestInfo)
                    .order(order)
                    .build();

            producer.push(config.getOrderUpdatePartyUniqueIdTopic(), orderRequest);
            log.info("Pushed {} partyUniqueIds to order: {} on topic: {}", partyUniqueIds.size(), orderId, config.getOrderUpdateUniqueIdTopic());
        } catch (Exception e) {
            log.error("Error updating partyUniqueIds for order: {}", orderId, e);
        }
    }
}
