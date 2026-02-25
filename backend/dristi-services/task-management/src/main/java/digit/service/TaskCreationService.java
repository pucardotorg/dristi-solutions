package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import digit.config.Configuration;
import digit.util.*;
import digit.web.models.*;
import digit.web.models.cases.AddressDetails;
import digit.web.models.cases.CourtCase;
import digit.web.models.cases.POAHolder;
import digit.web.models.cases.Party;
import digit.web.models.cases.PartyAddress;
import digit.web.models.order.Order;
import digit.web.models.order.OrderCriteria;
import digit.web.models.order.OrderListResponse;
import digit.web.models.order.OrderSearchRequest;
import digit.web.models.pendingtask.PendingTask;
import digit.web.models.pendingtask.PendingTaskRequest;
import digit.web.models.taskdetails.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static digit.config.ServiceConstants.*;
import static digit.config.ServiceConstants.ACCUSED;
import static digit.config.ServiceConstants.COMPLAINANT_PRIMARY;
import static digit.config.ServiceConstants.CREATE_WITH_OUT_PAYMENT;
import static digit.config.ServiceConstants.EMAIL;
import static digit.config.ServiceConstants.INDIVIDUAL;
import static digit.config.ServiceConstants.SMS;
import static digit.config.ServiceConstants.WITNESS;

@Service
@Slf4j
@RequiredArgsConstructor
public class TaskCreationService {


    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final OrderUtil orderUtil;
    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;
    private final MdmsUtil mdmsUtil;
    private final TaskUtil taskUtil;
    private final Configuration configuration;
    private final AdvocateUtil advocateUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final UserUtil userUtil;
    private final SmsNotificationService smsNotificationService;
    private final HrmsUtil hrmsUtil;

    public void generateFollowUpTasks(RequestInfo requestInfo, TaskManagement taskManagement) {
        log.info("Starting follow-up task generation for filing number: {} with {} parties", 
                taskManagement.getFilingNumber(), taskManagement.getPartyDetails().size());
        
        try {
            int processedParties = 0;
            for (PartyDetails party : taskManagement.getPartyDetails()) {
                try {
                    if (party.getRespondentDetails() != null) {
                        log.info("Processing respondent party with ID: {}", party.getRespondentDetails());
                        createTasksForParty(requestInfo, taskManagement, party, "Respondent");
                        processedParties++;
                    } else if (party.getWitnessDetails() != null) {
                        log.info("Processing witness party with ID: {}", party.getWitnessDetails());
                        createTasksForParty(requestInfo, taskManagement, party, "Witness");
                        processedParties++;
                    } else {
                        log.warn("Party details found with no respondent or witness details - skipping");
                    }
                } catch (Exception e) {
                    log.error("Error processing party details: {}", e.getMessage(), e);
                    // Continue processing other parties
                }
            }
            
            log.info("Successfully processed {} out of {} parties for filing number: {}", 
                    processedParties, taskManagement.getPartyDetails().size(), taskManagement.getFilingNumber());
        } catch (Exception e) {
            log.error("Error generating follow-up tasks for filing number: {}", taskManagement.getFilingNumber(), e);
            throw e;
        }
    }

    private void createTasksForParty(RequestInfo requestInfo, TaskManagement taskManagement, PartyDetails partyDetails, String partyType) {
        log.info("Creating tasks for {} party - Filing: {}, Order: {}", 
                partyType, taskManagement.getFilingNumber(), taskManagement.getOrderNumber());
        
        try {
            log.info("Fetching case details for filing number: {}", taskManagement.getFilingNumber());
            CourtCase courtCase = fetchCase(requestInfo, taskManagement.getFilingNumber());
            
            log.info("Fetching order details for order number: {}", taskManagement.getOrderNumber());
            Order order = fetchOrder(requestInfo, taskManagement.getOrderNumber());
            
            log.info("Extracting additional details from order");
            Map<String, Object> additionalDetails = extractAdditionalDetails(order, taskManagement.getOrderItemId());
            
            log.info("Fetching court details for case ID: {}", courtCase.getId());
            Map<String, Object> courtDetails = fetchCourtDetails(requestInfo, taskManagement, courtCase);

            log.info("Building case details and complainant details");
            CaseDetails caseDetails = buildCaseDetails(order, courtCase, courtDetails, taskManagement.getOrderItemId(), requestInfo);
            ComplainantDetails complainantDetails = getComplainantDetails(courtCase);
            
            log.info("Building summon and notice details for {} party", partyType);
            TaskDetails baseTaskDetails = buildSummonAndNoticeDetails(order, courtCase, partyType, taskManagement.getOrderItemId());

            log.info("Building task details list for {} party", partyType);
            List<TaskDetails> taskDetailsList = buildTaskDetailsList(partyDetails, caseDetails, baseTaskDetails, complainantDetails);
            
            log.info("Building base task template");
            Task taskTemplate = buildBaseTask(taskManagement, order, courtCase, additionalDetails);

            log.info("Creating {} tasks for {} party", taskDetailsList.size(), partyType);
            int createdTasks = 0;
            for (TaskDetails detail : taskDetailsList) {
                try {
                    taskTemplate.setTaskDetails(detail);
                    Role role = Role.builder().code(TASK_CREATOR).name(TASK_CREATOR).tenantId(taskManagement.getTenantId()).build();
                    requestInfo.getUserInfo().getRoles().add(role);
                    TaskResponse taskResponse = taskUtil.callCreateTask(TaskRequest.builder()
                            .requestInfo(requestInfo)
                            .task(taskTemplate)
                            .build());
                    createdTasks++;
                    log.info("Successfully created task {} of {} for {} party", createdTasks, taskDetailsList.size(), partyType);
                    createPendingTaskForRPAD(taskResponse.getTask(), requestInfo);
                } catch (Exception e) {
                    log.error("Error creating task {} for {} party: {}", createdTasks + 1, partyType, e.getMessage(), e);
                    // Continue with next task
                }
            }
            
            log.info("Successfully created {} out of {} tasks for {} party - Filing: {}", 
                    createdTasks, taskDetailsList.size(), partyType, taskManagement.getFilingNumber());
        } catch (Exception e) {
            log.error("Error creating tasks for {} party - Filing: {}, Order: {}", 
                    partyType, taskManagement.getFilingNumber(), taskManagement.getOrderNumber(), e);
            throw e;
        }
    }

    // ---- Data Fetching Methods ---- //

    private CourtCase fetchCase(RequestInfo requestInfo, String filingNumber) {
        log.info("Fetching case details for filing number: {}", filingNumber);
        
        try {
            JsonNode caseNode = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(List.of(CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build()))
                    .build());
            
            if (caseNode == null) {
                log.error("No case found for filing number: {}", filingNumber);
                throw new RuntimeException("Case not found for filing number: " + filingNumber);
            }
            
            CourtCase courtCase = objectMapper.convertValue(caseNode, CourtCase.class);
            log.info("Successfully fetched case with ID: {} for filing number: {}",
                    courtCase.getId(), filingNumber);
            return courtCase;
        } catch (Exception e) {
            log.error("Error fetching case for filing number: {}", filingNumber, e);
            throw e;
        }
    }

    private Order fetchOrder(RequestInfo requestInfo, String orderNumber) {
        log.info("Fetching order details for order number: {}", orderNumber);
        
        try {
            OrderListResponse orderResponse = orderUtil.getOrders(OrderSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(OrderCriteria.builder().orderNumber(orderNumber).build())
                    .build());
            
            if (orderResponse == null || orderResponse.getList() == null || orderResponse.getList().isEmpty()) {
                log.error("No order found for order number: {}", orderNumber);
                throw new RuntimeException("Order not found for order number: " + orderNumber);
            }
            
            Order order = orderResponse.getList().get(0);
            log.info("Successfully fetched order with ID: {} for order number: {}",
                    order.getId(), orderNumber);
            return order;
        } catch (Exception e) {
            log.error("Error fetching order for order number: {}", orderNumber, e);
            throw e;
        }
    }

    private Map<String, Object> extractAdditionalDetails(Order order, String itemId) {
        log.info("Extracting additional details from order ID: {}", order.getId());
        
        try {
            Map<String, Object> details = new HashMap<>();
            if (itemId != null) {
                details.put("itemId", itemId);
                log.info("Found itemId: {} in order additional details", itemId);
            } else {
                log.info("No itemId found in order additional details");
            }
            
            log.info("Extracted {} additional detail entries from order", details.size());
            return details;
        } catch (Exception e) {
            log.error("Error extracting additional details from order ID: {}", order.getId(), e);
            return new HashMap<>();
        }
    }

    private Map<String, Object> fetchCourtDetails(RequestInfo requestInfo, TaskManagement task, CourtCase courtCase) {
        String tenantId = task.getTenantId();
        String courtId = courtCase.getCourtId();
        
        log.info("Fetching court details for court ID: {} in tenant: {}", courtId, tenantId);
        
        try {
            Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(
                    requestInfo, tenantId, "common-masters", List.of("Court_Rooms")
            );
            
            if (mdmsData == null || !mdmsData.containsKey("common-masters") || 
                !mdmsData.get("common-masters").containsKey("Court_Rooms")) {
                log.warn("No court rooms master data found for tenant: {}", tenantId);
                return new HashMap<>();
            }
            
            JSONArray rooms = mdmsData.get("common-masters").get("Court_Rooms");
            log.info("Found {} court rooms in master data for tenant: {}", rooms.size(), tenantId);
            Map<String, Object> courtDetails = new HashMap<>();
            for (Object roomObj : rooms) {
                if (roomObj instanceof Map<?, ?> data) {
                    Object code = data.get("code");
                    if (code != null && code instanceof String && code.equals(courtId)) {
                        courtDetails = (Map<String, Object>) data;
                        break;
                    }
                }
            }
            
            if (courtDetails.isEmpty()) {
                log.warn("No court room found with ID: {} in tenant: {}", courtId, tenantId);
            } else {
                log.info("Found matching court room details for court ID: {}", courtId);
            }
            
            return courtDetails;
        } catch (Exception e) {
            log.error("Error fetching court details for court ID: {} in tenant: {}", courtId, tenantId, e);
            return new HashMap<>();
        }
    }

    // ---- Builders ---- //

    private CaseDetails buildCaseDetails(Order order, CourtCase courtCase, Map<String, Object> courtDetails, String itemId, RequestInfo requestInfo) {

        String hearingDateStr;

        if (INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
            hearingDateStr = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("formdata", "dateForHearing"), String.class);
        } else {
            hearingDateStr = extractHearingDateFromCompositeItemAdditionalDetails(order, itemId);
        }
        Long hearingDateEpoch = hearingDateStr != null ? dateUtil.getEpochFromDateString(hearingDateStr, "yyyy-MM-dd") : null;

        return CaseDetails.builder()
                .caseTitle(courtCase.getCaseTitle())
                .hearingDate(hearingDateEpoch)
                .courtName((String) courtDetails.get("name"))
                .courtAddress((String) courtDetails.get("address"))
                .courtId((String) courtDetails.get("code"))
                .hearingNumber(order.getHearingNumber())
                .judgeName(getJudgeName((String) courtDetails.get("code"), requestInfo))
                .build();
    }

    private String getJudgeName(String code, RequestInfo requestInfo) {
        if (code == null || code.isEmpty()) {
            log.warn("Court code is null or empty, returning default judge name");
            return configuration.getJudgeName();
        }

        try {
            JsonNode judgeDetails = hrmsUtil.getJudgeForCourtroom(requestInfo, code);

            if (judgeDetails == null) {
                log.warn("No judge details found for courtroom: {}, returning default judge name", code);
                return configuration.getJudgeName();
            }

            JsonNode userNode = judgeDetails.get("user");
            if (userNode == null || userNode.isNull()) {
                log.warn("User node is null in judge details for courtroom: {}, returning default judge name", code);
                return configuration.getJudgeName();
            }

            JsonNode nameNode = userNode.get("name");
            if (nameNode == null || nameNode.isNull() || nameNode.asText().isEmpty()) {
                log.warn("Name is null or empty in judge details for courtroom: {}, returning default judge name", code);
                return configuration.getJudgeName();
            }

            return nameNode.asText();
        } catch (Exception e) {
            log.error("Error fetching judge name for courtroom: {}, returning default judge name", code, e);
            return configuration.getJudgeName();
        }
    }

    private TaskDetails buildSummonAndNoticeDetails(Order order, CourtCase courtCase, String partyType, String itemId) {
        String orderType = order.getOrderType();
        if (itemId != null) {
            extractOrderTypeFromCompositeItems(order, itemId);
            orderType = order.getOrderType();
        }

        switch (orderType) {
            case SUMMONS -> {
                String docSubType = normalizePartyType(partyType);
                return TaskDetails.builder()
                        .summonDetails(SummonsDetails.builder()
                                .docSubType(docSubType)
                                .issueDate(order.getCreatedDate())
                                .caseFilingDate(courtCase.getFilingDate())
                                .build())
                        .build();
            }
            case NOTICE -> {
                String docSubType = normalizePartyType(partyType);

                String noticeType;

                if (INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
                    Object additionalDetails = order.getAdditionalDetails();
                    noticeType = jsonUtil.getNestedValue(additionalDetails, List.of("formdata", "noticeType", "type"), String.class);
                } else {
                    noticeType = extractNoticeTypeFromCompositeItems(order, itemId);
                }


                return TaskDetails.builder()
                        .noticeDetails(NoticeDetails.builder()
                                .caseFilingDate(courtCase.getFilingDate())
                                .issueDate(order.getCreatedDate())
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

    private ObjectNode extractCompositeItems(Order order, String itemId) {

        if (order.getCompositeItems() != null) {
            Object compositeOrderItem = order.getCompositeItems();
            ArrayNode arrayNode = objectMapper.convertValue(compositeOrderItem, ArrayNode.class);

            if (arrayNode != null && !arrayNode.isEmpty()) {
                for (int i = 0; i < arrayNode.size(); i++) {
                    ObjectNode itemNode = (ObjectNode) arrayNode.get(i);
                    if (itemNode.has("id")) {
                        String id = itemNode.get("id").textValue();
                        if (itemId.equals(id)) {
                            return itemNode;
                        }
                    }
                }
            }
        }
        return null;
    }

    private String extractNoticeTypeFromCompositeItems(Order order, String itemId) {

        ObjectNode compositeItem = extractCompositeItems(order, itemId);

        if (compositeItem != null) {
            return compositeItem.path("orderSchema").path("additionalDetails").path("formdata").path("noticeType").path("type").textValue();
        }

        return null;
    }

    private String extractHearingDateFromCompositeItemAdditionalDetails(Order order, String itemId) {

        ObjectNode compositeItem = extractCompositeItems(order, itemId);

        if (compositeItem != null) {
            return compositeItem.path("orderSchema").path("additionalDetails").path("formdata").path("dateForHearing").textValue();
        }

        return null;
    }

    private void extractOrderTypeFromCompositeItems(Order order, String itemId) {

        if (order.getCompositeItems() != null) {
            Object compositeOrderItem = order.getCompositeItems();
            ArrayNode arrayNode = objectMapper.convertValue(compositeOrderItem, ArrayNode.class);

            if (arrayNode != null && !arrayNode.isEmpty()) {
                for (int i = 0; i < arrayNode.size(); i++) {
                    ObjectNode itemNode = (ObjectNode) arrayNode.get(i);
                    if (itemNode.has("id")) {
                        String id = itemNode.get("id").textValue();
                        if (itemId.equals(id)) {
                            order.setOrderType(itemNode.get("orderType").asText());
                            break;
                        }
                    }
                }
            }
        }

    }

    private List<TaskDetails> buildTaskDetailsList(PartyDetails party, CaseDetails caseDetails, TaskDetails baseTaskDetails, ComplainantDetails complainantDetails) {
        List<TaskDetails> result = new ArrayList<>();

        if (party == null || party.getAddresses() == null || party.getAddresses().isEmpty()) {
            return result;
        }

        // Get delivery channels or initialize empty list
        List<DeliveryChannel> deliveryChannels = party.getDeliveryChannels() != null
                ? new ArrayList<>(party.getDeliveryChannels())
                : new ArrayList<>();

        for (PartyAddress address : party.getAddresses()) {
            RespondentDetails respondentDetails = null;
            WitnessDetails witnessDetails = null;
            if (party.getRespondentDetails() != null) {
                respondentDetails = getRespondentDetails(party.getRespondentDetails(), address);
            }
            if (party.getWitnessDetails() != null) {
                witnessDetails = getWitnessDetails(party.getWitnessDetails(), address);
            }
            for (DeliveryChannel channel : deliveryChannels) {
                if(EPOST.equalsIgnoreCase(channel.getChannelId())) {
                    channel.setChannelId("Post");
                }
                if (REGISTERED_POST.equalsIgnoreCase(channel.getChannelCode())) {
                    channel.setChannelCode(RPAD);
                    channel.setIsPendingCollection(true);
                }
                result.add(TaskDetails.builder()
                        .caseDetails(caseDetails)
                        .summonDetails(baseTaskDetails != null ? baseTaskDetails.getSummonDetails() : null)
                        .noticeDetails(baseTaskDetails != null ? baseTaskDetails.getNoticeDetails() : null)
                        .respondentDetails(respondentDetails)
                        .witnessDetails(witnessDetails)
                        .complainantDetails(complainantDetails)
                        .deliveryChannel(DeliveryChannel.builder()
                                .channelName(channel != null ? channel.getChannelId() : null)
                                .channelCode(channel != null ? channel.getChannelCode() : null)
                                .fees(channel != null ? channel.getFees() : null)
                                .feePaidDate(channel != null ? channel.getFeePaidDate() : null)
                                .isPendingCollection(channel != null && RPAD.equalsIgnoreCase(channel.getChannelCode()))
                                .build())
                        .build());
            }
        }

        List<DeliveryChannel> defaultChannels = ensureDefaultChannels(new ArrayList<>(),party);

        if (!defaultChannels.isEmpty()) {
            for (DeliveryChannel channel : defaultChannels) {
                log.info("Adding default channel: {}", channel);
                List<RespondentDetails> respondentDetailsList =
                        getRespondentDetailsForDefaultChannel(party.getRespondentDetails(), channel, party.getAddresses().get(0));
                List<WitnessDetails> witnessDetailsList =
                        getWitnessDetailsForDefaultChannel(party.getWitnessDetails(), channel, party.getAddresses().get(0));

                // Create a TaskDetails entry for each respondent
                if (!respondentDetailsList.isEmpty()) {
                    for (RespondentDetails respondent : respondentDetailsList) {
                        result.add(TaskDetails.builder()
                                .caseDetails(caseDetails)
                                .summonDetails(baseTaskDetails != null ? baseTaskDetails.getSummonDetails() : null)
                                .noticeDetails(baseTaskDetails != null ? baseTaskDetails.getNoticeDetails() : null)
                                .respondentDetails(respondent)
                                .witnessDetails(null)
                                .complainantDetails(complainantDetails)
                                .deliveryChannel(channel)
                                .build());
                    }
                }

                // Create a TaskDetails entry for each witness
                if (!witnessDetailsList.isEmpty()) {
                    for (WitnessDetails witness : witnessDetailsList) {
                        result.add(TaskDetails.builder()
                                .caseDetails(caseDetails)
                                .summonDetails(baseTaskDetails != null ? baseTaskDetails.getSummonDetails() : null)
                                .noticeDetails(baseTaskDetails != null ? baseTaskDetails.getNoticeDetails() : null)
                                .respondentDetails(null)
                                .witnessDetails(witness)
                                .complainantDetails(complainantDetails)
                                .deliveryChannel(channel)
                                .build());
                    }
                }
            }

        }
        return result;
    }

    private List<WitnessDetails> getWitnessDetailsForDefaultChannel(digit.web.models.cases.WitnessDetails witnessDetails, DeliveryChannel channel, PartyAddress partyAddress) {

        List<WitnessDetails> witnessDetailsList = new ArrayList<>();

        if (witnessDetails == null) {
            return witnessDetailsList;
        }

        String firstName = witnessDetails.getFirstName() != null ? witnessDetails.getFirstName() : "";
        String middleName = witnessDetails.getMiddleName() != null ? witnessDetails.getMiddleName() : "";
        String lastName = witnessDetails.getLastName() != null ? witnessDetails.getLastName() : "";

        List<String> nameParts = Stream.of(firstName, middleName, lastName)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        String name = String.join(" ", nameParts);
        String designation = witnessDetails.getWitnessDesignation();

        if (!name.isEmpty()) {
            if (designation != null && !designation.isBlank()) {
                name = name + " - " + designation;
            }
        } else if (designation != null && !designation.isBlank()) {
            name = designation;
        }
        // Parse age as Integer safely
        Integer age = null;
        try {
            age = witnessDetails.getWitnessAge() != null ? Integer.valueOf(witnessDetails.getWitnessAge()) : null;
        } catch (NumberFormatException ex) {
            log.error("Error formatting age: {}", ex.getMessage());
        }

        Address address = mapToAddress(partyAddress.getAddressDetails());
        // Add entries from phone list
        if (SMS.equalsIgnoreCase(channel.getChannelCode()) && witnessDetails.getPhoneNumbers() != null &&
                witnessDetails.getPhoneNumbers().getMobileNumber() != null &&
                !witnessDetails.getPhoneNumbers().getMobileNumber().isEmpty()) {

            for (String phone : witnessDetails.getPhoneNumbers().getMobileNumber()) {
                witnessDetailsList.add(
                        WitnessDetails.builder()
                                .uniqueId(witnessDetails.getUniqueId())
                                .name(name)
                                .age(age)
                                .phone(phone)
                                .address(address)
                                .build()
                );
            }
        }

        // Add entries from email list
        if (EMAIL.equalsIgnoreCase(channel.getChannelCode()) && witnessDetails.getEmails() != null &&
                witnessDetails.getEmails().getEmailId() != null &&
                !witnessDetails.getEmails().getEmailId().isEmpty()) {

            for (String email : witnessDetails.getEmails().getEmailId()) {
                witnessDetailsList.add(
                        WitnessDetails.builder()
                                .uniqueId(witnessDetails.getUniqueId())
                                .name(name)
                                .age(age)
                                .email(email)
                                .address(address)
                                .build()
                );
            }
        }

        return witnessDetailsList;
    }


    private List<RespondentDetails> getRespondentDetailsForDefaultChannel(digit.web.models.cases.RespondentDetails respondentDetails, DeliveryChannel channel, PartyAddress partyAddress) {
        List<RespondentDetails> respondentDetailsList = new ArrayList<>();
        if (respondentDetails == null) {
            return respondentDetailsList;
        }

        String firstName = respondentDetails.getRespondentFirstName() != null ? respondentDetails.getRespondentFirstName() : "";
        String middleName = respondentDetails.getRespondentMiddleName() != null ? respondentDetails.getRespondentMiddleName() : "";
        String lastName = respondentDetails.getRespondentLastName() != null ? respondentDetails.getRespondentLastName() : "";
        List<String> nameParts = Stream.of(firstName, middleName, lastName)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        String name = String.join(" ", nameParts);

        Integer age = respondentDetails.getRespondentAge();

        Address address = mapToAddress(partyAddress.getAddressDetails());
        // Add entries for phone numbers
        if (SMS.equalsIgnoreCase(channel.getChannelCode()) && respondentDetails.getPhoneNumbers() != null &&
                !respondentDetails.getPhoneNumbers().isEmpty()) {

            for (String phone : respondentDetails.getPhoneNumbers()) {
                respondentDetailsList.add(
                        RespondentDetails.builder()
                                .uniqueId(respondentDetails.getUniqueId())
                                .name(name)
                                .age(age)
                                .phone(phone)
                                .address(address)
                                .build()
                );
            }
        }

        // Add entries for emails
        if (EMAIL.equalsIgnoreCase(channel.getChannelCode()) && respondentDetails.getEmail() != null &&
                !respondentDetails.getEmail().isEmpty()) {
            for (String email : respondentDetails.getEmail()) {
                respondentDetailsList.add(
                        RespondentDetails.builder()
                                .uniqueId(respondentDetails.getUniqueId())
                                .name(name)
                                .age(age)
                                .email(email)
                                .address(address)
                                .build()
                );
            }
        }
        return respondentDetailsList;
    }

    /**
     * Ensures that SMS and EMAIL delivery channels are always included.
     */
    private List<DeliveryChannel> ensureDefaultChannels(List<DeliveryChannel> channels, PartyDetails party) {

        if (party.getRespondentDetails() != null) {
            if (party.getRespondentDetails().getEmail() != null && !party.getRespondentDetails().getEmail().isEmpty()) {
                DeliveryChannel emailChannel = DeliveryChannel.builder()
                        .channelName(EMAIL)
                        .channelCode(EMAIL)
                        .fees("0")
                        .isPendingCollection(false)
                        .build();
                channels.add(emailChannel);
            }
            if (party.getRespondentDetails().getPhoneNumbers() != null && !party.getRespondentDetails().getPhoneNumbers().isEmpty()) {
                DeliveryChannel smsChannel = DeliveryChannel.builder()
                        .channelName(SMS)
                        .channelCode(SMS)
                        .fees("0")
                        .isPendingCollection(false)
                        .build();
                channels.add(smsChannel);
            }
        }
        else if (party.getWitnessDetails() != null) {
            if (party.getWitnessDetails().getEmails() != null && !party.getWitnessDetails().getEmails().getEmailId().isEmpty()) {
                DeliveryChannel emailChannel = DeliveryChannel.builder()
                        .channelName(EMAIL)
                        .channelCode(EMAIL)
                        .fees("0")
                        .isPendingCollection(false)
                        .build();
                channels.add(emailChannel);
            }
            if (party.getWitnessDetails().getPhoneNumbers() != null && !party.getWitnessDetails().getPhoneNumbers().getMobileNumber().isEmpty()) {
                DeliveryChannel smsChannel = DeliveryChannel.builder()
                        .channelName(SMS)
                        .channelCode(SMS)
                        .fees("0")
                        .isPendingCollection(false)
                        .build();
                channels.add(smsChannel);
            }
        }

        return channels;
    }


    private WitnessDetails getWitnessDetails(digit.web.models.cases.WitnessDetails witnessDetails, PartyAddress partyAddresses) {
        if (witnessDetails == null) {
            return null;
        }

        String firstName = witnessDetails.getFirstName() != null ? witnessDetails.getFirstName() : "";
        String middleName = witnessDetails.getMiddleName() != null ? witnessDetails.getMiddleName() : "";
        String lastName = witnessDetails.getLastName() != null ? witnessDetails.getLastName() : "";
        List<String> nameParts = Stream.of(firstName, middleName, lastName)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        String name = String.join(" ", nameParts);
        String designation = witnessDetails.getWitnessDesignation();

        if (!name.isEmpty()) {
            if (designation != null && !designation.isBlank()) {
                name = name + " - " + designation;
            }
        } else if (designation != null && !designation.isBlank()) {
            name = designation;
        }

        Integer age = null;
        try {
            age = witnessDetails.getWitnessAge() != null ? Integer.valueOf(witnessDetails.getWitnessAge()) : null;
        } catch (NumberFormatException e) {
            age = null;
        }

        String phone = null;
        if (witnessDetails.getPhoneNumbers() != null &&
                witnessDetails.getPhoneNumbers().getMobileNumber() != null &&
                !witnessDetails.getPhoneNumbers().getMobileNumber().isEmpty()) {
            phone = witnessDetails.getPhoneNumbers().getMobileNumber().get(0);
        }

        String email = null;
        if (witnessDetails.getEmails() != null &&
                witnessDetails.getEmails().getEmailId() != null &&
                !witnessDetails.getEmails().getEmailId().isEmpty()) {
            email = witnessDetails.getEmails().getEmailId().get(0);
        }

        Address address = mapToAddress(partyAddresses.getAddressDetails());

        return WitnessDetails.builder()
                .uniqueId(witnessDetails.getUniqueId())
                .name(name)
                .age(age)
                .phone(phone)
                .email(email)
                .address(address)
                .build();
    }

    private RespondentDetails getRespondentDetails(digit.web.models.cases.RespondentDetails respondentDetails, PartyAddress addressDetails) {
        if (respondentDetails == null) {
            return null;
        }

        String firstName = respondentDetails.getRespondentFirstName() != null ? respondentDetails.getRespondentFirstName() : "";
        String middleName = respondentDetails.getRespondentMiddleName() != null ? respondentDetails.getRespondentMiddleName() : "";
        String lastName = respondentDetails.getRespondentLastName() != null ? respondentDetails.getRespondentLastName() : "";
        List<String> nameParts = Stream.of(firstName, middleName, lastName)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        String name = String.join(" ", nameParts);


        Address address = mapToAddress(addressDetails.getAddressDetails());

        String phone = null;
        if (respondentDetails.getPhoneNumbers() != null && !respondentDetails.getPhoneNumbers().isEmpty()) {
            phone = respondentDetails.getPhoneNumbers().get(0);
        }

        String email = null;
        if (respondentDetails.getEmail() != null && !respondentDetails.getEmail().isEmpty()) {
            email = respondentDetails.getEmail().get(0);
        }

        Integer age = respondentDetails.getRespondentAge();

        return RespondentDetails.builder()
                .uniqueId(respondentDetails.getUniqueId())
                .email(email)
                .name(name)
                .address(address)
                .phone(phone)
                .age(age)
                .pinCode(address.getPinCode())
                .build();
    }

    private Address mapToAddress(AddressDetails addressDetails) {
        if (addressDetails == null) {
            return null;
        }

        return Address.builder()
                .city(addressDetails.getCity())
                .state(addressDetails.getState())
                .district(addressDetails.getDistrict())
                .pinCode(addressDetails.getPincode())
                .locality(addressDetails.getLocality())
                .build();
    }

    private Task buildBaseTask(TaskManagement task, Order order, CourtCase courtCase, Map<String, Object> additionalDetails) {
        return Task.builder()
                .tenantId(task.getTenantId())
                .orderId(order.getId())
                .status("INPROGRESS")
                .filingNumber(task.getFilingNumber())
                .cnrNumber(courtCase.getCnrNumber())
                .caseId(courtCase.getId().toString())
                .caseTitle(courtCase.getCaseTitle())
                .taskType(task.getTaskType())
                .createdDate(dateUtil.getCurrentTimeInMilis())
                .amount(Amount.builder().type("FINE").status("DONE").amount("0").build())
                .additionalDetails(additionalDetails)
                .workflow(getCreateWithOutPayment())
                .build();
    }

    private static WorkflowObject getCreateWithOutPayment() {
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction(CREATE_WITH_OUT_PAYMENT);
        return workflowObject;
    }

    private String normalizePartyType(String type) {
        if (type == null) return null;
        return type.equalsIgnoreCase("Witness") ? WITNESS : ACCUSED;
    }

    private ComplainantDetails getComplainantDetails(CourtCase courtCase) {
        log.info("Extracting complainant details from case ID: {}", courtCase.getId());
        
        try {
            ComplainantDetails complainantDetails = new ComplainantDetails();
            Optional<Party> primaryComplainant = courtCase.getLitigants().stream()
                    .filter(item -> COMPLAINANT_PRIMARY.equalsIgnoreCase(item.getPartyType()))
                    .findFirst();
            
            if (primaryComplainant.isPresent()) {
                String individualId = primaryComplainant.get().getIndividualId();
                log.info("Found primary complainant with individual ID: {} in case: {}",
                        individualId, courtCase.getId());
                
                Map<String, Object> complainantDetailsFromCourtCase = getComplainantDetailsFromCourtCase(courtCase, individualId);
                
                Map<String, Object> complainantAddressFromIndividualDetail = getComplainantAddressFromComplainantDetails(complainantDetailsFromCourtCase);
                String complainantName = getComplainantName(complainantDetailsFromCourtCase);
                
                complainantDetails.setAddress(complainantAddressFromIndividualDetail);
                complainantDetails.setName(complainantName);
                
                log.info("Extracted complainant details - Name: {}, Address available: {}",
                        complainantName, complainantAddressFromIndividualDetail != null && !complainantAddressFromIndividualDetail.isEmpty());
            } else {
                log.warn("No primary complainant found in case ID: {}", courtCase.getId());
            }
            
            return complainantDetails;
        } catch (Exception e) {
            log.error("Error extracting complainant details from case ID: {}", courtCase.getId(), e);
            return new ComplainantDetails();
        }
    }

    public Map<String, Object> getComplainantDetailsFromCourtCase(CourtCase courtCase, String complainantIndividualId) {
        log.info("Extracting complainant details for individual ID: {} from case: {}",
                complainantIndividualId, courtCase != null ? courtCase.getId() : "null");
        
        try {
            if (courtCase == null) {
                log.warn("Court case is null, returning empty complainant details");
                return Collections.emptyMap();
            }
            
            Object additional = courtCase.getAdditionalDetails();
            Map<?, ?> complainantDetailsObj = jsonUtil.getNestedValue(additional, List.of("complainantDetails"), Map.class);
            
            if (complainantDetailsObj == null) {
                log.warn("No complainantDetails found in case additional details for case: {}", courtCase.getId());
                return Collections.emptyMap();
            }
            
            List<?> formdataList = jsonUtil.getNestedValue(complainantDetailsObj, List.of("formdata"), List.class);
            if (formdataList == null || formdataList.isEmpty()) {
                log.warn("No formdata found in complainantDetails for case: {}", courtCase.getId());
                return Collections.emptyMap();
            }
            
            log.info("Found {} formdata entries for complainant details", formdataList.size());
            
            Map complainantDetails = formdataList.stream()
                    .filter(d -> {
                        Map<?, ?> data = jsonUtil.getNestedValue(d, List.of("data"), Map.class);
                        Map<?, ?> individualDetails = jsonUtil.getNestedValue(data, List.of("complainantVerification", "individualDetails"), Map.class);
                        return individualDetails != null && complainantIndividualId.equals(individualDetails.get("individualId"));
                    })
                    .findFirst()
                    .map(d -> jsonUtil.getNestedValue(d, List.of("data"), Map.class))
                    .orElse(Collections.emptyMap());
            
            if (complainantDetails.isEmpty()) {
                log.warn("No matching complainant details found for individual ID: {} in case: {}", 
                        complainantIndividualId, courtCase.getId());
            } else {
                log.info("Successfully found complainant details for individual ID: {}", complainantIndividualId);
            }
            
            return complainantDetails;
        } catch (Exception e) {
            log.error("Error extracting complainant details for individual ID: {} from case: {}", 
                    complainantIndividualId, courtCase != null ? courtCase.getId() : "null", e);
            return Collections.emptyMap();
        }
    }

    public Map<String, Object> getComplainantAddressFromComplainantDetails(Map<String, Object> complainantDetails) {
        if (complainantDetails == null) return Collections.emptyMap();

        String district = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "district"), String.class);
        String city = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "city"), String.class);
        String pincode = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode"), String.class);
        String latitude = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode", "latitude"), String.class);
        String longitude = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode", "longitude"), String.class);
        String locality = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "locality"), String.class);
        String state = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "state"), String.class);

        Map<String, Object> coordinate = new HashMap<>();
        coordinate.put("longitude", longitude);
        coordinate.put("latitude", latitude);

        Map<String, Object> complainantAddress = new HashMap<>();
        complainantAddress.put("pincode", pincode);
        complainantAddress.put("district", district);
        complainantAddress.put("city", city);
        complainantAddress.put("state", state);
        complainantAddress.put("coordinate", coordinate);
        complainantAddress.put("locality", locality);
        return complainantAddress;
    }

    public String getComplainantName(Map<String, Object> complainantDetails) {
        log.info("Extracting complainant name from details");
        
        try {
            if (complainantDetails == null || complainantDetails.isEmpty()) {
                log.warn("Complainant details are null or empty, returning empty name");
                return "";
            }
            
            String firstName = jsonUtil.getNestedValue(complainantDetails, List.of("firstName"), String.class);
            String lastName = jsonUtil.getNestedValue(complainantDetails, List.of("lastName"), String.class);
            String partyName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
            
            log.info("Extracted party name: {} (firstName: {}, lastName: {})", partyName, firstName, lastName);
            
            Map<?, ?> complainantTypeObj = jsonUtil.getNestedValue(complainantDetails, List.of("complainantType"), Map.class);
            String complainantTypeCode = complainantTypeObj != null ? (String) complainantTypeObj.get("code") : null;
            
            log.info("Complainant type code: {}", complainantTypeCode);
            
            if (INDIVIDUAL.equalsIgnoreCase(complainantTypeCode)) {
                log.info("Individual complainant, returning party name: {}", partyName);
                return partyName;
            }
            
            String companyName = jsonUtil.getNestedValue(complainantDetails, List.of("complainantCompanyName"), String.class);
            if (companyName != null && !companyName.isEmpty()) {
                String fullName = String.format("%s (Represented By %s)", companyName, partyName);
                log.info("Company complainant, returning full name: {}", fullName);
                return fullName;
            }
            
            log.warn("Unable to determine complainant name from details");
            return "";
        } catch (Exception e) {
            log.error("Error extracting complainant name from details", e);
            return "";
        }
    }

    public void createPendingTaskForRPAD(Task task, RequestInfo requestInfo) {
        if ((task.getTaskType().equalsIgnoreCase(SUMMON) || task.getTaskType().equalsIgnoreCase(WARRANT)
                || task.getTaskType().equalsIgnoreCase(NOTICE) || task.getTaskType().equalsIgnoreCase(PROCLAMATION) || task.getTaskType().equalsIgnoreCase(ATTACHMENT)) && (isRPADdeliveryChannel(task))) {
            log.info("Creating pending task for envelope submission");
            createPendingTaskForEnvelope(task, requestInfo);
            log.info("Successfully created pending task for envelope submission");
        }
    }

    private void createPendingTaskForEnvelope(Task task, RequestInfo requestInfo) {

        try {
            TaskRequest taskRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(task)
                    .build();

            List<CourtCase> courtCases = caseUtil.getCaseDetails(taskRequest);
            if (CollectionUtils.isEmpty(courtCases)) {
                log.error("Error while creating pending task for envelope submission, courtCase not found");
                return;
            }

            CourtCase courtCase = courtCases.get(0);
            Map<String, List<String>> advocateMapping = advocateUtil.getLitigantAdvocateMapping(courtCase);
            Map<String, List<POAHolder>> poaMapping = caseUtil.getLitigantPoaMapping(courtCase);

            List<Party> complainants = caseUtil.getRespondentOrComplainant(courtCase, "complainant");
            List<String> assigneeUUIDs = collectAssigneeUUIDs(complainants, advocateMapping, poaMapping);

            List<User> uniqueAssignees = assigneeUUIDs.stream()
                    .distinct()
                    .map(uuid -> User.builder().uuid(uuid).build())
                    .collect(Collectors.toList());

            PendingTask pendingTask = buildPendingTask(task, courtCase, uniqueAssignees);
            pendingTaskUtil.createPendingTask(
                    PendingTaskRequest.builder()
                            .requestInfo(requestInfo)
                            .pendingTask(pendingTask)
                            .build()
            );
            callNotificationServiceForRPADSubmission(requestInfo, courtCase, assigneeUUIDs);
        } catch (Exception e) {
            log.error("Error while creating pending task for envelope submission", e);
            throw new CustomException("CREATE_PENDING_TASK_ERROR", "Error while creating pending task for envelope submission");
        }
    }

    private List<String> collectAssigneeUUIDs(
            List<Party> complainants,
            Map<String, List<String>> advocateMapping,
            Map<String, List<POAHolder>> poaMapping
    ) {
        List<String> assigneeUUIDs = new ArrayList<>();

        for (Party party : complainants) {
            String litigantUUID = jsonUtil.getNestedValue(party.getAdditionalDetails(), List.of("uuid"), String.class);

            // Add advocates and the party's own UUID
            if (advocateMapping.containsKey(litigantUUID)) {
                assigneeUUIDs.addAll(advocateMapping.get(litigantUUID));
            }
            assigneeUUIDs.add(litigantUUID);

            // Add POA holders
            List<POAHolder> poaHolders = poaMapping.get(party.getIndividualId());
            if (poaHolders != null) {
                for (POAHolder holder : poaHolders) {
                    String poaUUID = jsonUtil.getNestedValue(holder.getAdditionalDetails(), List.of("uuid"), String.class);
                    if (poaUUID != null) {
                        assigneeUUIDs.add(poaUUID);
                    }
                }
            }
        }

        return assigneeUUIDs;
    }

    private PendingTask buildPendingTask(Task task, CourtCase courtCase, List<User> assignees) {

        String taskType = task.getTaskType();

        String entityType = getEntityType(taskType);

        ZoneId zoneId = ZoneId.of(configuration.getZoneId());
        ZonedDateTime istTime = ZonedDateTime.now(zoneId);
        long currentISTMillis = istTime.toInstant().toEpochMilli();

        long sla = configuration.getEnvelopeSlaValue() + currentISTMillis;


        return PendingTask.builder()
                .name(PENDING_ENVELOPE_SUBMISSION)
                .referenceId(MANUAL + task.getTaskNumber() + PENDING_ENVELOPE_SUBMISSION)
                .entityType(entityType)
                .status(PENDING_ENVELOPE_SUBMISSION)
                .assignedTo(assignees)
                .cnrNumber(courtCase.getCnrNumber())
                .filingNumber(courtCase.getFilingNumber())
                .caseId(courtCase.getId().toString())
                .caseTitle(courtCase.getCaseTitle())
                .isCompleted(false)
                .stateSla(sla)
                .screenType("home")
                .build();
    }

    private String getEntityType(String taskType) {

        return switch (taskType) {
            case SUMMON -> "task-summons";
            case WARRANT -> "task-warrant";
            case PROCLAMATION -> "task-proclamation";
            case ATTACHMENT -> "task-attachment";
            case NOTICE -> "task-notice";
            default -> null;
        };
    }

    public boolean isRPADdeliveryChannel(Task task) {
        JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);

        // Check if deliveryChannels exists
        ObjectNode deliveryChannels = null;
        if (taskDetails.has("deliveryChannels") && !taskDetails.get("deliveryChannels").isNull()) {
            deliveryChannels = (ObjectNode) taskDetails.get("deliveryChannels");
        }

        if (deliveryChannels == null) {
            return false;
        }

        if (deliveryChannels.has(CHANNEL_CODE) && !deliveryChannels.get(CHANNEL_CODE).isNull()) {
            String channelCode = deliveryChannels.get(CHANNEL_CODE).textValue();
            return channelCode != null && channelCode.equalsIgnoreCase(RPAD);
        }
        return false;
    }

    private void callNotificationServiceForRPADSubmission(RequestInfo requestInfo, CourtCase courtCase, List<String> assigneeUuids) {

        long sla = configuration.getEnvelopeSlaValue();
        long slaInDays = sla/(1000 * 60 * 60 * 24);
        String days = Long.toString(slaInDays);

        SMSTemplateData smsTemplateData = SMSTemplateData.builder()
                .tenantId(courtCase.getTenantId())
                .cmpNumber(courtCase.getCmpNumber())
                .courtCaseNumber(courtCase.getCourtCaseNumber())
                .days(days)
                .build();

        List<User> users = userUtil.getUserListFromUserUuid(assigneeUuids);
        List<String> mobileNumbers = users.stream()
                .map(User::getMobileNumber)
                .toList();

        mobileNumbers.forEach(mobileNumber -> smsNotificationService.sendNotification(requestInfo, smsTemplateData, RPAD_SUBMISSION, mobileNumber));
    }

}
