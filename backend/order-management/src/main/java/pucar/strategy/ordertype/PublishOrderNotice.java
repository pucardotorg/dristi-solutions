package pucar.strategy.ordertype;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
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
import pucar.web.models.WorkflowObject;
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
public class PublishOrderNotice implements OrderUpdateStrategy {

    private final AdvocateUtil advocateUtil;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final ObjectMapper objectMapper;
    private final TaskUtil taskUtil;

    @Autowired
    public PublishOrderNotice(AdvocateUtil advocateUtil, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, ObjectMapper objectMapper, TaskUtil taskUtil) {
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
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && NOTICE.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {


        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());
        // case search and update
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        // case update if matches particular condition
        String section = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "noticeType", "code"), String.class);
        log.info("section:{}", section);

        Map<String, List<POAHolder>> litigantPoaMapping = caseUtil.getLitigantPoaMapping(courtCase);

        if (NOTICE.equalsIgnoreCase(order.getOrderType()) && SECTION_223.equalsIgnoreCase(section) && PENDING_NOTICE.equalsIgnoreCase(courtCase.getStatus())) {

            // update case with issue order

            WorkflowObject workflowObject = new WorkflowObject();
            workflowObject.setAction(ISSUE_ORDER);
            courtCase.setWorkflow(workflowObject);
            log.info("case updated with issue order action,filingNumber:{}", order.getFilingNumber());
            CaseResponse caseResponse = caseUtil.updateCase(CaseRequest.builder().requestInfo(requestInfo)
                    .cases(courtCase).build());

            CourtCase updatedCourtCase = caseResponse.getCases().get(0);

            Optional<Party> respondent = updatedCourtCase.getLitigants().stream()
                    .filter(litigant -> litigant.getPartyType().contains("respondent"))
                    .findFirst();

            Optional<AdvocateMapping> advocate = respondent.flatMap(party ->
                    updatedCourtCase.getRepresentatives().stream()
                            .filter(representative -> representative.getRepresenting() != null &&
                                    representative.getRepresenting().stream()
                                            .anyMatch(represent -> represent != null &&
                                                    represent.getIndividualId() != null &&
                                                    represent.getIndividualId().equals(party.getIndividualId())))
                            .findFirst());

            List<String> assignees = new ArrayList<>();

            // add poa holder to assignees
            respondent.ifPresent(party -> {
                if (party.getAdditionalDetails() != null) {
                    String uuid = jsonUtil.getNestedValue(party.getAdditionalDetails(), List.of("uuid"), String.class);
                    if (uuid != null) assignees.add(uuid);
                }

                if (litigantPoaMapping.containsKey(party.getIndividualId())) {
                    List<POAHolder> poaHolders = litigantPoaMapping.get(party.getIndividualId());
                    if (poaHolders != null) {
                        for (POAHolder poaHolder : poaHolders) {
                            if (poaHolder.getAdditionalDetails() != null) {
                                String uuid = jsonUtil.getNestedValue(poaHolder.getAdditionalDetails(), List.of("uuid"), String.class);
                                if (uuid != null) assignees.add(uuid);
                            }
                        }
                    }
                }
            });

            advocate.ifPresent(rep -> {
                if (rep.getAdditionalDetails() != null) {
                    String uuid = jsonUtil.getNestedValue(rep.getAdditionalDetails(), List.of("uuid"), String.class);
                    if (uuid != null) assignees.add(uuid);
                }
            });

            log.info("assignees:{}", assignees);
            if (!assignees.isEmpty()) {
                List<User> users = new ArrayList<>();
                assignees.forEach(assignee -> {

                    users.add(User.builder().uuid(assignee).build());

                });
                String individualId = respondent.get().getIndividualId();
                String respondentUUID = jsonUtil.getNestedValue(respondent.get().getAdditionalDetails(), List.of("uuid"), String.class);

                Map<String, Object> additionalDetails = new HashMap<>();
                additionalDetails.put("caseId", courtCase.getId());
                additionalDetails.put("individualId", individualId);
                additionalDetails.put("litigants", Collections.singletonList(respondentUUID));
                // create pending task for issue order
                log.info("create pending task for pending response,filingNumber:{}", order.getFilingNumber());
                PendingTask pendingTask = PendingTask.builder()
                        .name(PENDING_RESPONSE)
                        .referenceId(MANUAL + courtCase.getFilingNumber())
                        .entityType("case-default")
                        .status("PENDING_RESPONSE")
                        .assignedTo(users)
                        .assignedRole(List.of("CASE_RESPONDER"))
                        .cnrNumber(courtCase.getCnrNumber())
                        .caseId(courtCase.getId().toString())
                        .caseTitle(courtCase.getCaseTitle())
                        .filingNumber(courtCase.getFilingNumber())
                        .isCompleted(true)
                        .screenType("home")
                        .additionalDetails(additionalDetails)
                        .build();

                pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
                ).pendingTask(pendingTask).build());
            }
        }

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

        Long sla = pendingTaskUtil.getStateSla(order.getOrderType());
        String applicationNumber = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "refApplicationId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("applicationNumber", applicationNumber);
        additionalDetails.put("litigants", complainantIndividualId);

        try {
            List<TaskRequest> taskRequests = taskUtil.createTaskRequestForSummonWarrantAndNotice(requestInfo, order, courtCase);
            for (TaskRequest taskRequest : taskRequests) {

                String taskDetailString = objectMapper.writeValueAsString(taskRequest.getTask().getTaskDetails());
                Map<String, Object> jsonMap = objectMapper.readValue(taskDetailString, new TypeReference<Map<String, Object>>() {
                });
                String channel = jsonUtil.getNestedValue(jsonMap, Arrays.asList("deliveryChannels", "channelCode"), String.class);
                taskUtil.enrichTaskWorkflow(channel, order, taskRequest);

                TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);


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
                        .caseId(courtCase.getId().toString())
                        .caseTitle(courtCase.getCaseTitle())
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



}
