package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.TaskManagementRepository;
import digit.util.*;
import digit.web.models.*;
import digit.web.models.cases.CourtCase;
import digit.web.models.order.*;
import digit.web.models.order.Order;
import digit.web.models.payment.*;
import digit.web.models.payment.Bill;
import digit.web.models.taskdetails.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentUpdateService {

    private final ObjectMapper objectMapper;
    private final TaskManagementRepository repository;
    private final WorkflowService workflowService;
    private final CaseUtil caseUtil;
    private final OrderUtil orderUtil;
    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;
    private final MdmsUtil mdmsUtil;
    private final TaskUtil taskUtil;
    private final Configuration configuration;

    /**
     * Main entry to process incoming payment update events.
     */
    public void process(Map<String, Object> record) {
        try {
            PaymentRequest paymentRequest = objectMapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();
            String tenantId = paymentRequest.getPayment().getTenantId();

            for (PaymentDetail detail : paymentRequest.getPayment().getPaymentDetails()) {
                handlePaymentDetail(requestInfo, tenantId, detail);
            }

        } catch (Exception e) {
            log.error("Error while processing payment update", e);
            throw new CustomException("PAYMENT_UPDATE_ERR", "Error while updating payment");
        }
    }

    private void handlePaymentDetail(RequestInfo requestInfo, String tenantId, PaymentDetail paymentDetail) {
        if (!configuration.getTaskBusinessServiceName().equalsIgnoreCase(paymentDetail.getBusinessService())) return;

        try {
            String taskNumber = extractTaskNumber(paymentDetail.getBill());
            TaskManagement task = fetchTaskByNumber(taskNumber);

            updateWorkflowStatus(requestInfo, task);
            if ("COMPLETED".equalsIgnoreCase(task.getStatus())) {
                generateFollowUpTasks(requestInfo, task);
            }
        } catch (CustomException ce) {
            throw new CustomException("PAYMENT_UPDATE_ERR", ce.getMessage());
        } catch (Exception e) {
            log.error("Error handling payment detail: {}", e.getMessage(), e);
        }
    }

    private String extractTaskNumber(Bill bill) {
        String consumerCode = bill.getConsumerCode();
        return consumerCode.split("_", 2)[0];
    }

    private TaskManagement fetchTaskByNumber(String taskNumber) {
        List<TaskManagement> tasks = repository.getTaskManagement(
                TaskSearchCriteria.builder().taskManagementNumber(taskNumber).build(), null
        );

        if (tasks.isEmpty()) {
            throw new CustomException("TASK_NOT_FOUND", "No task found for task number: " + taskNumber);
        }
        return tasks.get(0);
    }

    private void updateWorkflowStatus(RequestInfo requestInfo, TaskManagement taskManagement) {
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("MAKE_PAYMENT");
        taskManagement.setWorkflow(workflowObject);

        workflowService.updateWorkflowStatus(TaskManagementRequest.builder()
                .taskManagement(taskManagement)
                .requestInfo(requestInfo)
                .build());
    }

    private void generateFollowUpTasks(RequestInfo requestInfo, TaskManagement taskManagement) {
        for (PartyDetails party : taskManagement.getPartyDetails()) {
            if (party.getRespondentDetails() != null || party.getWitnessDetails() != null) {
                createTasksForParty(requestInfo, taskManagement, party);
            }
        }
    }

    private void createTasksForParty(RequestInfo requestInfo, TaskManagement taskManagement, PartyDetails partyDetails) {
        CourtCase courtCase = fetchCase(requestInfo, taskManagement.getFilingNumber());
        Order order = fetchOrder(requestInfo, taskManagement.getOrderNumber());
        Map<String, Object> additionalDetails = extractAdditionalDetails(order);
        Map<String, Object> courtDetails = fetchCourtDetails(requestInfo, taskManagement, courtCase);

        CaseDetails caseDetails = buildCaseDetails(order, courtCase, courtDetails);
        TaskDetails baseTaskDetails = buildTaskDetails(order, courtCase);

        List<TaskDetails> taskDetailsList = buildTaskDetailsList(partyDetails, caseDetails, baseTaskDetails);

        Task taskTemplate = buildBaseTask(taskManagement, order, courtCase, additionalDetails);

        for (TaskDetails detail : taskDetailsList) {
            taskTemplate.setTaskDetails(detail);
            taskUtil.callCreateTask(TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(taskTemplate)
                    .build());
        }
    }

    // ---- Data Fetching Methods ---- //

    private CourtCase fetchCase(RequestInfo requestInfo, String filingNumber) {
        JsonNode caseNode = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(List.of(CaseCriteria.builder().filingNumber(filingNumber).build()))
                .build());
        return objectMapper.convertValue(caseNode, CourtCase.class);
    }

    private Order fetchOrder(RequestInfo requestInfo, String orderNumber) {
        OrderListResponse orderResponse = orderUtil.getOrders(OrderSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(OrderCriteria.builder().orderNumber(orderNumber).build())
                .build());
        return orderResponse.getList().get(0);
    }

    private Map<String, Object> extractAdditionalDetails(Order order) {
        String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
        Map<String, Object> details = new HashMap<>();
        if (itemId != null) details.put("itemId", itemId);
        return details;
    }

    private Map<String, Object> fetchCourtDetails(RequestInfo requestInfo, TaskManagement task, CourtCase courtCase) {
        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(
                requestInfo, task.getTenantId(), "common-masters", List.of("Court_Rooms")
        );
        JSONArray rooms = mdmsData.get("common-masters").get("Court_Rooms");
        return rooms.stream()
                .filter(o -> o instanceof Map data && courtCase.getCourtId() != null && courtCase.getCourtId().equals(data.get("code")))
                .map(o -> (Map<String, Object>) o)
                .findFirst()
                .orElse(new HashMap<>());
    }

    // ---- Builders ---- //

    private CaseDetails buildCaseDetails(Order order, CourtCase courtCase, Map<String, Object> courtDetails) {
        String hearingDateStr = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("formdata", "dateForHearing"), String.class);
        Long hearingDateEpoch = hearingDateStr != null ? dateUtil.getEpochFromDateString(hearingDateStr, "yyyy-MM-dd") : null;

        return CaseDetails.builder()
                .caseTitle(courtCase.getCaseTitle())
                .hearingDate(hearingDateEpoch)
                .courtName((String) courtDetails.get("name"))
                .courtAddress((String) courtDetails.get("address"))
                .courtId((String) courtDetails.get("code"))
                .judgeName("Configure in properties.")
                .build();
    }

    private TaskDetails buildTaskDetails(Order order, CourtCase courtCase) {
        String orderType = order.getOrderType();
        Object additionalDetails = order.getAdditionalDetails();

        switch (orderType) {
            case "SUMMONS" -> {
                String docSubType = normalizePartyType(jsonUtil.getNestedValue(additionalDetails, List.of("formdata", "SummonsOrder", "party", "data", "partyType"), String.class));
                return TaskDetails.builder()
                        .summonDetails(SummonsDetails.builder()
                                .docSubType(docSubType)
                                .issueDate(order.getAuditDetails().getLastModifiedTime())
                                .build())
                        .build();
            }
            case "NOTICE" -> {
                String docSubType = normalizePartyType(jsonUtil.getNestedValue(additionalDetails, List.of("formdata", "noticeOrder", "party", "data", "partyType"), String.class));
                String noticeType = jsonUtil.getNestedValue(additionalDetails, List.of("formdata", "noticeType", "type"), String.class);
                String partyType = jsonUtil.getNestedValue(additionalDetails, List.of("formdata", "noticeOrder", "party", "data", "partyIndex"), String.class);
                return TaskDetails.builder()
                        .noticeDetails(NoticeDetails.builder()
                                .caseFilingDate(courtCase.getFilingDate())
                                .issueDate(order.getAuditDetails().getLastModifiedTime())
                                .noticeType(noticeType)
                                .docSubType(docSubType)
                                .partyType(partyType)
                                .build())
                        .build();
            }
            default -> {
                return TaskDetails.builder().build();
            }
        }
    }

    private List<TaskDetails> buildTaskDetailsList(PartyDetails party, CaseDetails caseDetails, TaskDetails baseTaskDetails) {
        List<TaskDetails> result = new ArrayList<>();
        for (Address address : party.getAddresses()) {
            if (party.getRespondentDetails() != null) party.getRespondentDetails().setAddress(address);
            if (party.getWitnessDetails() != null) party.getWitnessDetails().setAddress(address);

            for (DeliveryChannel channel : party.getDeliveryChannels()) {
                result.add(TaskDetails.builder()
                        .caseDetails(caseDetails)
                        .summonDetails(baseTaskDetails.getSummonDetails())
                        .noticeDetails(baseTaskDetails.getNoticeDetails())
                        .deliveryChannel(DeliveryChannel.builder()
                                .channelName(channel.getChannelId())
                                .channelCode(channel.getChannelCode())
                                .fees(channel.getFees())
                                .build())
                        .build());
            }
        }
        return result;
    }

    private Task buildBaseTask(TaskManagement task, Order order, CourtCase courtCase, Map<String, Object> additionalDetails) {
        return Task.builder()
                .tenantId(task.getTenantId())
                .orderId(order.getId())
                .filingNumber(task.getFilingNumber())
                .cnrNumber(courtCase.getCnrNumber())
                .taskType(task.getTaskType())
                .amount(Amount.builder().type("FINE").amount("0").build())
                .status("INPROGRESS")
                .additionalDetails(additionalDetails)
                .workflow(Workflow.builder().action("CREATE_WITH_OUT_PAYMENT").build())
                .build();
    }

    private String normalizePartyType(String type) {
        if (type == null) return null;
        return type.equalsIgnoreCase("Witness") ? "WITNESS" : "ACCUSED";
    }
}
