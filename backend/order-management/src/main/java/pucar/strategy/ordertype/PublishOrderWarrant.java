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
import pucar.config.StateSlaMap;
import pucar.service.SmsNotificationService;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.*;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.SMSTemplateData;
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
public class PublishOrderWarrant implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final AdvocateUtil advocateUtil;
    private final UserUtil userUtil;
    private final SmsNotificationService smsNotificationService;

    @Autowired
    public PublishOrderWarrant(TaskUtil taskUtil, ObjectMapper objectMapper, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, AdvocateUtil advocateUtil, UserUtil userUtil, SmsNotificationService smsNotificationService) {
        this.taskUtil = taskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.advocateUtil = advocateUtil;
        this.userUtil = userUtil;
        this.smsNotificationService = smsNotificationService;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && WARRANT.equalsIgnoreCase(order.getOrderType());
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
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

        // case search and update
        CaseListResponse caseListResponse = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        List<CourtCase> cases = caseListResponse.getCriteria().get(0).getResponseList();

        // add validation here
        CourtCase courtCase = cases.get(0);
        log.info("fetching litigant advocate mapping for caseId:{}", courtCase.getId());
        Map<String, List<String>> litigantAdvocateMapping = advocateUtil.getLitigantAdvocateMapping(courtCase);

        String type = "complainant";
        if(isWarrantForAccusedWitness(order))
            type = "respondent";
        List<Party> complainants = caseUtil.getRespondentOrComplainant(courtCase, type);
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

        Long sla = pendingTaskUtil.getStateSla(order.getOrderType());
        String applicationNumber = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "refApplicationId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("applicationNumber", applicationNumber);
        additionalDetails.put("litigants", complainantIndividualId);


        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        try {
            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
            log.info("taskDetailsArray:{}", taskDetailsArray.size());

            for (JsonNode taskDetail : taskDetailsArray) {


                String taskDetailString = objectMapper.writeValueAsString(taskDetail);
                Map<String, Object> jsonMap = objectMapper.readValue(taskDetailString, new TypeReference<>() {
                });
                String channel = jsonUtil.getNestedValue(jsonMap, Arrays.asList("deliveryChannels", "channelCode"), String.class);

                TaskRequest taskRequest = taskUtil.createTaskRequestForSummonWarrantAndNotice(requestInfo, order, taskDetail,courtCase,channel);
                TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);

                // create pending task

                if (channel != null && (!EMAIL.equalsIgnoreCase(channel) && !SMS.equalsIgnoreCase(channel))
                        && !taskUtil.isCourtWitness(order.getOrderType(), taskDetail) && !courtCase.getIsLPRCase()) {

                    PendingTask pendingTask = PendingTask.builder()
                            .name(PAYMENT_PENDING_FOR_WARRANT)
                            .referenceId(MANUAL + taskResponse.getTask().getTaskNumber())
                            .entityType("order-default")
                            .status("PAYMENT_PENDING_POLICE")
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

                    String partyType = getPartyType(order);
                    String orderType = order.getOrderType();
                    if (orderType != null && !orderType.isEmpty()) {
                        orderType = orderType.substring(0, 1).toUpperCase()
                                + orderType.substring(1).toLowerCase();
                    }
                    String days = String.valueOf(StateSlaMap.getStateSlaMap().get(WARRANT));
                    SMSTemplateData smsTemplateData = SMSTemplateData.builder()
                            .partyType(partyType)
                            .orderType(orderType)
                            .tenantId(courtCase.getTenantId())
                            .days(days)
                            .courtCaseNumber(courtCase.getCourtCaseNumber())
                            .cmpNumber(courtCase.getCmpNumber())
                            .build();
                    callNotificationService(orderRequest,PROCESS_FEE_PAYMENT, smsTemplateData, uniqueAssignee);
                    if(pendingTask.getName().contains(RPAD)){
                        callNotificationService(orderRequest, RPAD_SUBMISSION, smsTemplateData, uniqueAssignee);

                    }
                }


            }

        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return null;
    }

    private String getPartyType(Order order) {
        Object additionalDetails = order.getAdditionalDetails();
        JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);

        JsonNode partyTypeNode = additionalDetailsNode
                .path("formdata")
                .path("warrantFor")
                .path("party")
                .path("data")
                .path("partyType");

        String partyType = partyTypeNode.textValue();
        return partyType == null ? null : partyType.substring(0, 1).toUpperCase() + partyType.substring(1).toLowerCase();
    }

    private void callNotificationService(OrderRequest orderRequest, String messageCode, SMSTemplateData smsTemplateData, List<User> users) {
        try {
            List<String> uuids = users.stream()
                    .map(User::getUuid)
                    .toList();

            List<User> userList = userUtil.getUserListFromUserUuid(uuids);
            List<String> phoneNumbers = userList.stream()
                    .map(User::getMobileNumber)
                    .toList();

            for (String number : phoneNumbers) {
                smsNotificationService.sendNotification(orderRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        }
        catch (Exception e) {
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private boolean isWarrantForAccusedWitness(Order order) {
        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        try {
            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
            JsonNode taskDetail = taskDetailsArray.get(0);
            if(taskDetail.get("respondentDetails") != null
                    && taskDetail.get("respondentDetails").get("ownerType") != null
                    && taskDetail.get("respondentDetails").get("ownerType").textValue().equalsIgnoreCase(ACCUSED)){
                return true;
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return false;
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




