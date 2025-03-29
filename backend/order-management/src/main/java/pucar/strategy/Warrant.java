package pucar.strategy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.*;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.courtCase.Party;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;
import pucar.web.models.task.Task;
import pucar.web.models.task.TaskRequest;
import pucar.web.models.task.TaskResponse;

import java.util.*;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class Warrant implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public Warrant(TaskUtil taskUtil, ObjectMapper objectMapper, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, AdvocateUtil advocateUtil) {
        this.taskUtil = taskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.advocateUtil = advocateUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        return order.getOrderType() != null && WARRANT.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {

        // create task base on no of task details item
        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        // case search and update
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        Map<String, List<String>> litigantAdvocateMapping = advocateUtil.getLitigantAdvocateMapping(courtCase);
        List<Party> complainants = caseUtil.getRespondentOrComplainant(courtCase, "complainant");
        List<String> assignees = new ArrayList<>();
        List<User> uniqueAssignee = new ArrayList<>();
        Set<String> uniqueSet = new HashSet<>();
        List<String> complainantIndividualId = new ArrayList<>();
        for (Party party : complainants) {
            String uuid = jsonUtil.getNestedValue(party.getAdditionalDetails(), List.of("uuid"), String.class);
            if (litigantAdvocateMapping.containsKey(uuid)) {
                assignees.addAll(litigantAdvocateMapping.get(uuid));
                assignees.add(uuid);
            }
            complainantIndividualId.add(party.getIndividualId());

        }

        for (String userUUID : assignees) {
            if (uniqueSet.contains(userUUID)) {
                continue;
            }
            User user = User.builder().uuid(userUUID).build();
            uniqueAssignee.add(user);
            uniqueSet.add(userUUID);
        }

        Long sla = pendingTaskUtil.getStateSla(order.getOrderType());
        String applicationNumber = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "refApplicationId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("applicationNumber",applicationNumber);
        additionalDetails.put("litigants",complainantIndividualId);


        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        try {
            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
            for (JsonNode taskDetail : taskDetailsArray) {
                TaskRequest taskRequest = taskUtil.createTaskRequestForSummonWarrantAndNotice(requestInfo, order, taskDetail);
                TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);

                // create pending task

                PendingTask pendingTask = PendingTask.builder()
                        .name(PAYMENT_PENDING_FOR_WARRANT)
                        .referenceId(MANUAL + taskResponse.getTask().getTaskNumber())
                        .entityType("order-default")
                        .status("PAYMENT_PENDING_POLICE")
                        .assignedTo(uniqueAssignee)
                        .cnrNumber(courtCase.getCnrNumber())
                        .filingNumber(courtCase.getFilingNumber())
                        .isCompleted(false)
                        .stateSla(sla)
                        .additionalDetails(additionalDetails)
                        .screenType("home")
                        .build();

                pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
                ).pendingTask(pendingTask).build());


            }

        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return null;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }


    private PendingTaskRequest buildPendingTaskRequest(JsonNode taskObject, TaskResponse taskResponse, RequestInfo requestInfo) {
        Task task = taskResponse.getTask();

        return PendingTaskRequest.builder()
                .requestInfo(requestInfo)
                .pendingTask(PendingTask.builder()
                        .name(task.getTaskType().equals("WARRANT") ? "Payment for warrant" : getPendingTaskName(taskObject.get("deliveryChannels").get("channelCode").asText(), task.getTaskType()))
                        .filingNumber(task.getFilingNumber())
                        .cnrNumber(task.getCnrNumber())
                        .status(task.getStatus())
                        .build())
                .build();
    }

    private @Valid String getPendingTaskName(String channelCode, String orderType) {
        orderType = orderType.equals("SUMMONS") ? "Summons" : "Notice";
        switch (channelCode) {
            case "EMAIL":
                return "Make Payment for Email " + orderType;
            case "SMS":
                return "Make Payment for SMS " + orderType;
            case "POLICE":
                return "Make Payment for Police " + orderType;
            case "RPAD":
                return "Make Payment for RPAD " + orderType;
            case "POST":
                return "Make Payment for Post " + orderType;
            default:
                return "Make Payment for " + orderType;
        }
    }
}




