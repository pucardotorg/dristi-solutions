package pucar.strategy.ordertype;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.kafka.Producer;
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

@Component
@Slf4j
public class PublishOrderNotice implements OrderUpdateStrategy {

    private final AdvocateUtil advocateUtil;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final ObjectMapper objectMapper;
    private final TaskUtil taskUtil;
    private final SmsNotificationService smsNotificationService;
    private final UserUtil userUtil;
    private final TaskManagementUtil taskManagementUtil;
    private final Producer producer;
    private final Configuration configuration;
    private final UrlShortenerUtil urlShortenerUtil;

    @Autowired
    public PublishOrderNotice(AdvocateUtil advocateUtil, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, ObjectMapper objectMapper, TaskUtil taskUtil, SmsNotificationService smsNotificationService, UserUtil userUtil, TaskManagementUtil taskManagementUtil, Producer producer, Configuration configuration, UrlShortenerUtil urlShortenerUtil) {
        this.advocateUtil = advocateUtil;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.objectMapper = objectMapper;
        this.taskUtil = taskUtil;
        this.smsNotificationService = smsNotificationService;
        this.userUtil = userUtil;
        this.taskManagementUtil = taskManagementUtil;
        this.producer = producer;
        this.configuration = configuration;
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

        log.info("Processing Upfront payments to create tasks.");
        List<String> uniqueIdPendingTask = taskManagementUtil.processUpfrontPayments(order, requestInfo);
        if(uniqueIdPendingTask == null || uniqueIdPendingTask.isEmpty()) {
            log.info("No parties left to create pending task for them.");
            return orderRequest;
        }

        //for these uniqueIds fetch respondent details and create map of party type to uniqueId from order payload inside notice parties
        Map<String, List<String>> partyTypeToUniqueIdMap = taskManagementUtil.createPartyTypeToUniqueIdMapping(order, uniqueIdPendingTask);
        log.info("Created party type mapping for {} unique IDs requiring pending tasks", partyTypeToUniqueIdMap.size());

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

        if (NOTICE.equalsIgnoreCase(order.getOrderType()) && SECTION_223.equalsIgnoreCase(section)) {

            Optional<Party> respondent = courtCase.getLitigants().stream()
                    .filter(litigant -> litigant.getPartyType().contains("respondent"))
                    .findFirst();

            Optional<AdvocateMapping> advocate = respondent.flatMap(party ->
                    courtCase.getRepresentatives().stream()
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

        Long sla = pendingTaskUtil.getStateSlaBasedOnOrderType(order.getOrderType());
        String applicationNumber = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "refApplicationId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("applicationNumber", applicationNumber);
        additionalDetails.put("litigants", complainantIndividualId);
        additionalDetails.put("orderItemId", getItemId(order));
        List<Map<String, Object>> partyTypeToUniqueIdList = getMaps(partyTypeToUniqueIdMap);
        additionalDetails.put("uniqueIds", partyTypeToUniqueIdList);
        additionalDetails.put("partyType", COMPLAINANT);
        try {

            String itemId = getItemId(order);
            String referenceId = MANUAL + (itemId != null ? itemId + "_" : "") + COMPLAINANT + "_" + order.getOrderNumber();

            PendingTask pendingTask = PendingTask.builder()
                    .referenceId(referenceId)
                    .name("Take Steps - Notice")
                    .entityType("task-management-payment")
                    .status(PENDING_PAYMENT)
                    .assignedTo(uniqueAssignee)
                    .assignedRole(configuration.getTaskManagementAssignedRole())
                    .cnrNumber(courtCase.getCnrNumber())
                    .filingNumber(courtCase.getFilingNumber())
                    .caseId(courtCase.getId().toString())
                    .caseTitle(courtCase.getCaseTitle())
                    .isCompleted(false)
                    .screenType("home")
                    .actionCategory(configuration.getTaskManagementActionCategory())
                    .additionalDetails(additionalDetails)
                    .stateSla(sla)
                    .build();

            pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo).pendingTask(pendingTask).build());

            try {

                SMSTemplateData smsTemplateData = SMSTemplateData.builder()
                        .tenantId(courtCase.getTenantId())
                        .courtCaseNumber(courtCase.getCourtCaseNumber())
                        .cmpNumber(courtCase.getCmpNumber())
                        .orderType(order.getOrderType())
                        .shortenedUrl(createShortUrl(order, referenceId))
                        .build();

                callNotificationService(orderRequest,PAYMENT_LINK_SMS, smsTemplateData, uniqueAssignee);
            } catch (Exception e) {
                log.error("Error occurred while sending notification to user: {}", e.toString());
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return null;
        //TODO: REMOVE EXISTING LOGIC
//        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
//
//        try {
//            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
//            log.info("taskDetailsArray size:{}", taskDetailsArray.size());
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
//                if (channel != null && (!EMAIL.equalsIgnoreCase(channel) && !SMS.equalsIgnoreCase(channel))) {
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
//                            .caseId(courtCase.getId().toString())
//                            .caseTitle(courtCase.getCaseTitle())
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
//                    String days = String.valueOf(StateSlaMap.getStateSlaMap().get(NOTICE));
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
//        }
    }

    private @NotNull List<Map<String, Object>> getMaps(Map<String, List<String>> partyTypeToUniqueIdMap) {
        List<Map<String, Object>> partyTypeToUniqueIdList = new ArrayList<>();
        //add parttype to uniqueids in additionaldetails
        for (Map.Entry<String, List<String>> entry : partyTypeToUniqueIdMap.entrySet()) {
            List<String> uniqueIds = entry.getValue();
            for(String uniqueId: uniqueIds) {
                Map<String, Object> map = new HashMap<>();
                map.put("partyType", entry.getKey());
                map.put("uniqueId", uniqueId);
                partyTypeToUniqueIdList.add(map);
            };
        }
        return partyTypeToUniqueIdList;
    }

    private String getItemId(Order order) {
        if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())){
            return jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
        }
        return null;
    }


    private String getPartyType(Order order) {
        Object additionalDetails = order.getAdditionalDetails();
        JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);

        JsonNode partyTypeNode = additionalDetailsNode
                .path("formdata")
                .path("noticeOrder")
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
