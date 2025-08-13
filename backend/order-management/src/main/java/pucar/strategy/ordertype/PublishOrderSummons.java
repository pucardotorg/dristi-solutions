package pucar.strategy.ordertype;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.*;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.*;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;
import pucar.web.models.task.TaskRequest;
import pucar.web.models.task.TaskResponse;

import java.util.*;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishOrderSummons implements OrderUpdateStrategy {

    private final AdvocateUtil advocateUtil;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final ObjectMapper objectMapper;
    private final TaskUtil taskUtil;

    @Autowired
    public PublishOrderSummons(AdvocateUtil advocateUtil, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, ObjectMapper objectMapper, TaskUtil taskUtil) {
        this.advocateUtil = advocateUtil;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.objectMapper = objectMapper;
        this.taskUtil = taskUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && SUMMONS.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("post processing,result=IN_PROGRESS ,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());

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

        Map<String, List<POAHolder>> litigantPoaMapping = caseUtil.getLitigantPoaMapping(courtCase);

        for (Party party : complainants) {
            String uuid = jsonUtil.getNestedValue(party.getAdditionalDetails(), List.of("uuid"), String.class);
            if (litigantAdvocateMapping.containsKey(uuid)) {
                assignees.addAll(litigantAdvocateMapping.get(uuid));
                assignees.add(uuid);
            }
            complainantIndividualId.add(party.getIndividualId());

            if (litigantPoaMapping.containsKey(party.getIndividualId())) {
                List<POAHolder> poaHolders = litigantPoaMapping.get(party.getIndividualId());
                if (poaHolders != null) {
                    for (POAHolder poaHolder : poaHolders) {
                        if (poaHolder.getAdditionalDetails() != null) {
                            String poaUUID = jsonUtil.getNestedValue(poaHolder.getAdditionalDetails(), List.of("uuid"), String.class);
                            if (poaUUID != null) assignees.add(poaUUID);
                        }
                    }
                }
            }

        }

        for (String userUUID : assignees) {
            if (uniqueSet.contains(userUUID)) {
                continue;
            }
            User user = User.builder().uuid(userUUID).build();
            uniqueAssignee.add(user);
            uniqueSet.add(userUUID);
        }

        Long sla = pendingTaskUtil.getStateSlaBasedOnOrderType(order.getOrderType());
        String applicationNumber = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "refApplicationId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("applicationNumber", applicationNumber);
        additionalDetails.put("litigants", complainantIndividualId);


        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);

        try {
            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
            for (JsonNode taskDetail : taskDetailsArray) {

                String taskDetailString = objectMapper.writeValueAsString(taskDetail);
                Map<String, Object> jsonMap = objectMapper.readValue(taskDetailString, new TypeReference<>() {
                });
                String channel = jsonUtil.getNestedValue(jsonMap, Arrays.asList("deliveryChannels", "channelCode"), String.class);

                TaskRequest taskRequest = taskUtil.createTaskRequestForSummonWarrantAndNotice(requestInfo, order, taskDetail,courtCase, channel);
                TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);

                // create pending task

                if (channel != null && (!EMAIL.equalsIgnoreCase(channel) && !SMS.equalsIgnoreCase(channel)) && !taskUtil.isCourtWitness(order.getOrderType(), taskDetail)) {
                    String name = pendingTaskUtil.getPendingTaskNameForSummonAndNotice(channel, order.getOrderType());
                    String status = PAYMENT_PENDING + channel;

                    PendingTask pendingTask = PendingTask.builder()
                            .name(name)
                            .referenceId(MANUAL + taskResponse.getTask().getTaskNumber())
                            .entityType("order-default")
                            .status(status)
                            .assignedTo(uniqueAssignee)
                            .cnrNumber(courtCase.getCnrNumber())
                            .filingNumber(courtCase.getFilingNumber())
                            .caseTitle(courtCase.getCaseTitle())
                            .caseId(courtCase.getId().toString())
                            .isCompleted(false)
                            .stateSla(sla)
                            .additionalDetails(additionalDetails)
                            .screenType("home")
                            .build();

                    pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
                    ).pendingTask(pendingTask).build());
                }


            }

        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        pendingTaskUtil.closeManualPendingTask(order.getHearingNumber(), requestInfo, courtCase.getFilingNumber(), courtCase.getCnrNumber(),courtCase.getId().toString(),courtCase.getCaseTitle());


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
}
