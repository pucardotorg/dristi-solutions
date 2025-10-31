package pucar.strategy.ordertype;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.service.IndividualService;
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

import java.util.*;

import static pucar.config.ServiceConstants.*;
import static pucar.config.ServiceConstants.MANUAL;

@Component
@Slf4j
public class PublishOrderSummons implements OrderUpdateStrategy {

    private final AdvocateUtil advocateUtil;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final ObjectMapper objectMapper;
    private final TaskUtil taskUtil;
    private final IndividualService individualService;
    private final SmsNotificationService smsNotificationService;
    private final UserUtil userUtil;
    private final TaskManagementUtil taskManagementUtil;
    private final UrlShortenerUtil urlShortenerUtil;

    @Autowired
    public PublishOrderSummons(AdvocateUtil advocateUtil, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, ObjectMapper objectMapper, TaskUtil taskUtil, IndividualService individualService, SmsNotificationService smsNotificationService, UserUtil userUtil, TaskManagementUtil taskManagementUtil, UrlShortenerUtil urlShortenerUtil) {
        this.advocateUtil = advocateUtil;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.objectMapper = objectMapper;
        this.taskUtil = taskUtil;
        this.individualService = individualService;
        this.smsNotificationService = smsNotificationService;
        this.userUtil = userUtil;
        this.taskManagementUtil = taskManagementUtil;
        this.urlShortenerUtil = urlShortenerUtil;
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


        log.info("Processing Upfront payments to create tasks.");
        List<String> uniqueIdPendingTask = taskManagementUtil.processUpfrontPayments(order, requestInfo);
        if(uniqueIdPendingTask == null || uniqueIdPendingTask.isEmpty()) {
            log.info("No parties left to pay upfront.");
            return orderRequest;
        }
        //for these uniqueIds fetch respondent details and create map of partytype to uniqueId from order payload inside notice parties
        Map<String, List<String>> partyTypeToUniqueIdMap = taskManagementUtil.createPartyTypeToUniqueIdMapping(order, uniqueIdPendingTask);
        log.info("Created party type mapping for {} unique IDs requiring pending tasks", partyTypeToUniqueIdMap.size());

        // case search and update
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        Map<String, List<String>> litigantAdvocateMapping = advocateUtil.getLitigantAdvocateMapping(courtCase);

        String type = "complainant";
        if(partyTypeToUniqueIdMap.containsKey("Witness"))
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

        Long sla = pendingTaskUtil.getStateSlaBasedOnOrderType(order.getOrderType());
        String applicationNumber = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "refApplicationId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("applicationNumber", applicationNumber);
        additionalDetails.put("litigants", complainantIndividualId);
        additionalDetails.put("orderItemId", getItemId(order));
        List<Map<String, Object>> partyTypeToUniqueIdList = new ArrayList<>();
        //add parttype to uniqueids in additionaldetails
        for (Map.Entry<String, List<String>> entry : partyTypeToUniqueIdMap.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("partyType", entry.getKey());
            map.put("uniqueId", entry.getValue());
            partyTypeToUniqueIdList.add(map);
        }
        additionalDetails.put("uniqueIds", partyTypeToUniqueIdList);
        try {

            String referenceId = MANUAL + order.getOrderNumber() + getItemId(order);

            PendingTask pendingTask = PendingTask.builder()
                    .referenceId(referenceId)
                    .name("Take Steps - Summons")
                    .entityType("task-management-payment")
                    .status(PENDING_PAYMENT)
                    .assignedTo(uniqueAssignee)
                    .cnrNumber(courtCase.getCnrNumber())
                    .filingNumber(courtCase.getFilingNumber())
                    .caseId(courtCase.getId().toString())
                    .caseTitle(courtCase.getCaseTitle())
                    .isCompleted(false)
                    .screenType("home")
                    .additionalDetails(additionalDetails)
                    .stateSla(sla)
                    .build();

            pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo).pendingTask(pendingTask).build());

            try {

                SMSTemplateData smsTemplateData = SMSTemplateData.builder()
                        .tenantId(courtCase.getTenantId())
                        .courtCaseNumber(courtCase.getCourtCaseNumber())
                        .cmpNumber(courtCase.getCmpNumber())
                        .shortenedUrl(createShortUrl(order, referenceId))
                        .build();

                callNotificationService(orderRequest,PAYMENT_LINK_SMS, smsTemplateData, uniqueAssignee);
            } catch (Exception e) {
                log.error("Error occurred while sending notification to user: {}", e.toString());
            }

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        pendingTaskUtil.closeManualPendingTask(order.getHearingNumber(), requestInfo, courtCase.getFilingNumber(), courtCase.getCnrNumber(),courtCase.getId().toString(),courtCase.getCaseTitle());
        return null;
        //TODO: REMOVE EXISTING LOGIC
/*     String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
//
//        try {
//            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
//            for (JsonNode taskDetail : taskDetailsArray) {
//
//                String taskDetailString = objectMapper.writeValueAsString(taskDetail);
//                Map<String, Object> jsonMap = objectMapper.readValue(taskDetailString, new TypeReference<>() {
//                });
//                String channel = jsonUtil.getNestedValue(jsonMap, Arrays.asList("deliveryChannels", "channelCode"), String.class);
//
//                TaskRequest taskRequest = taskUtil.createTaskRequestForSummonWarrantAndNotice(requestInfo, order, taskDetail,courtCase, channel);
//                TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);
//
//                // create pending task
//
//                if (channel != null && (!EMAIL.equalsIgnoreCase(channel) && !SMS.equalsIgnoreCase(channel)) && !taskUtil.isCourtWitness(order.getOrderType(), taskDetail)) {
//                    String name = pendingTaskUtil.getPendingTaskNameForSummonAndNotice(channel, order.getOrderType());
//                    String status = PAYMENT_PENDING + channel;
//
//                    PendingTask pendingTask = PendingTask.builder()
//                            .name(name)
//                            .referenceId(MANUAL + taskResponse.getTask().getTaskNumber())
//                            .entityType("order-default")
//                            .status(status)
//                            .assignedTo(uniqueAssignee)
//                            .cnrNumber(courtCase.getCnrNumber())
//                            .filingNumber(courtCase.getFilingNumber())
//                            .caseTitle(courtCase.getCaseTitle())
//                            .caseId(courtCase.getId().toString())
//                            .isCompleted(false)
//                            .stateSla(sla)
//                            .additionalDetails(additionalDetails)
//                            .screenType("home")
//                            .build();
//
//                    pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
//                    ).pendingTask(pendingTask).build());
//
//                    String partyType = getPartyType(order);
//                    String orderType = order.getOrderType();
//                    String days = String.valueOf(StateSlaMap.getStateSlaMap().get(SUMMONS));
//                    SMSTemplateData smsTemplateData = SMSTemplateData.builder()
//                            .partyType(partyType)
//                            .orderType(orderType)
//                            .tenantId(courtCase.getTenantId())
//                            .days(days)
//                            .courtCaseNumber(courtCase.getCourtCaseNumber())
//                            .cmpNumber(courtCase.getCmpNumber())
//                            .build();
//                    callNotificationService(orderRequest,PROCESS_FEE_PAYMENT, smsTemplateData, uniqueAssignee);
//                    if(pendingTask.getName().contains(RPAD)){
//                        callNotificationService(orderRequest, RPAD_SUBMISSION, smsTemplateData, uniqueAssignee);
//
//                    }
//                }
//
//
//            }
//
//        } catch (JsonProcessingException e) {
//            throw new RuntimeException(e);
       } **/

    }

    private String getItemId(Order order) {
        if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())){
            return jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
        }
        return "";
    }

    private String getPartyType(Order order) {
        Object additionalDetails = order.getAdditionalDetails();
        JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);

        JsonNode partyTypeNode = additionalDetailsNode
                .path("formdata")
                .path("SummonsOrder")
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

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    public String createShortUrl(Order order, String referenceId){

        String tenantId = order.getTenantId();
        String orderNumber = order.getOrderNumber();
        String orderItemId = null;

        JsonNode additionalDetailsNode = objectMapper.convertValue(order.getAdditionalDetails(), JsonNode.class);

        JsonNode orderItemNode = additionalDetailsNode.path("itemId");

        if(orderItemNode != null){
            orderItemId = orderItemNode.textValue();
        }

        return urlShortenerUtil.createShortenedUrl(tenantId, referenceId, orderNumber, orderItemId);

    }
}
