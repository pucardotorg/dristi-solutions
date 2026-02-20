package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.kafka.Producer;
import digit.repository.TaskManagementRepository;
import digit.util.*;
import digit.web.models.*;
import digit.web.models.cases.*;
import digit.web.models.demand.OfflinePaymentTask;
import digit.web.models.demand.OfflinePaymentTaskRequest;
import digit.web.models.enums.StatusEnum;
import digit.web.models.payment.*;
import digit.web.models.payment.Bill;
import digit.web.models.pendingtask.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentUpdateService {

    private final ObjectMapper objectMapper;
    private final TaskManagementRepository repository;
    private final WorkflowService workflowService;
    private final TaskCreationService taskCreationService;
    private final Configuration configuration;
    private final Producer producer;
    private final PendingTaskUtil pendingTaskUtil;
    private final CaseUtil caseUtil;
    private final ETreasuryUtil etreasuryUtil;
    private final OfflinePaymentUtil offlinePaymentUtil;

    /**
     * Main entry to process incoming payment update events.
     */
    public void process(Map<String, Object> record) {
        try {
            PaymentRequest paymentRequest = objectMapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();
            String tenantId = paymentRequest.getPayment().getTenantId();

            for (PaymentDetail detail : paymentRequest.getPayment().getPaymentDetails()) {
                handlePaymentDetail(requestInfo, detail, paymentRequest.getPayment().getPaymentMode());
            }

        } catch (Exception e) {
            log.error("Error while processing payment update", e);
            throw new CustomException("PAYMENT_UPDATE_ERR", "Error while updating payment");
        }
    }

    private void handlePaymentDetail(RequestInfo requestInfo, PaymentDetail paymentDetail, String paymentMode) {
        if (!configuration.getTaskBusinessServiceName().equalsIgnoreCase(paymentDetail.getBusinessService())) return;

        try {
            String taskNumber = extractTaskNumber(paymentDetail.getBill());
            TaskManagement taskManagement = fetchTaskByNumber(taskNumber);
            updateWorkflowAndAddReceipt(requestInfo, taskManagement, paymentDetail, paymentMode);
            closePaymentPendingTask(requestInfo, taskManagement);
            // NOTE : closeOfflinePaymentTask is not called as it is not required for now
//            String consumerCode = taskManagement.getTaskManagementNumber() + "_" + configuration.getTaskManagementSuffix();
//            closeOfflinePaymentTask(requestInfo, consumerCode, taskManagement.getFilingNumber(), taskManagement.getTenantId());
            if (COMPLETED.equalsIgnoreCase(taskManagement.getStatus())) {
                taskCreationService.generateFollowUpTasks(requestInfo, taskManagement);
            }
        } catch (CustomException ce) {
            throw new CustomException("PAYMENT_UPDATE_ERR", ce.getMessage());
        } catch (Exception e) {
            log.error("Error handling payment detail: {}", e.getMessage(), e);
        }
    }

    private void closeOfflinePaymentTask(RequestInfo requestInfo, String consumerCode, String filingNumber, String tenantId) {
        try {
            log.info("Closing offline payment task for consumer code: {}", consumerCode);

            // Build the offline payment task request
            OfflinePaymentTask offlinePaymentTask = OfflinePaymentTask.builder()
                    .consumerCode(consumerCode)
                    .filingNumber(filingNumber)
                    .tenantId(tenantId)
                    .status(StatusEnum.PAID)
                    .build();

            OfflinePaymentTaskRequest offlinePaymentTaskRequest = OfflinePaymentTaskRequest.builder()
                    .requestInfo(requestInfo)
                    .offlinePaymentTask(offlinePaymentTask)
                    .build();

            // Call the offline payment API
            offlinePaymentUtil.callOfflinePaymentAPI(offlinePaymentTaskRequest);

            log.info("Successfully closed offline payment task for consumer code: {}", consumerCode);
        } catch (Exception e) {
            log.error("Error while closing offline payment task for consumer code: {}", consumerCode, e);
        }
    }

    private void closePaymentPendingTask(RequestInfo requestInfo, TaskManagement taskManagement) {
        try {
            log.info("Closing payment pending task for task number: {}", taskManagement.getTaskManagementNumber());
            String referenceId =getReferenceId(taskManagement);
            JsonNode pendingTaskNode = pendingTaskUtil.callPendingTask(referenceId);
            JsonNode hitsNode = pendingTaskNode.path("hits").path("hits");
            JsonNode hit = hitsNode.get(0);
            JsonNode dataNode = hit.path("_source").path("Data");
            PendingTask pendingTask = objectMapper.convertValue(dataNode, PendingTask.class);
            pendingTask.setStatus(COMPLETED);
            pendingTask.setIsCompleted(true);
            pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo).pendingTask(pendingTask).build());
            log.info("Successfully closed payment pending task for task number: {}", taskManagement.getTaskManagementNumber());
        } catch (CustomException e) {
            log.error("Error closing payment pending task: {}", e.getMessage(), e);
        }
    }

    private String getReferenceId(TaskManagement taskManagement) {
        String partyTypeStr = taskManagement.getPartyType() != null
                ? taskManagement.getPartyType().toString() + "_"
                : "";
        String orderItemId = (taskManagement.getOrderItemId() != null && !taskManagement.getOrderItemId().isEmpty()) ? taskManagement.getOrderItemId() + "_" : "";
        return MANUAL + orderItemId + partyTypeStr + taskManagement.getOrderNumber();
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

    private void updateWorkflowAndAddReceipt(RequestInfo requestInfo, TaskManagement taskManagement, PaymentDetail paymentDetail, String paymentMode) {
        Role role = Role.builder().code(SYSTEM_ADMIN).name(SYSTEM_ADMIN).tenantId(taskManagement.getTenantId()).build();
        requestInfo.getUserInfo().getRoles().add(role);
        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction(MAKE_PAYMENT);
        taskManagement.setWorkflow(workflowObject);

        TaskManagementRequest request = TaskManagementRequest.builder()
                .taskManagement(taskManagement)
                .requestInfo(requestInfo)
                .build();
        workflowService.updateWorkflowStatus(request);
        TaskManagement taskManagement1 = request.getTaskManagement();
        for(PartyDetails partyDetails : taskManagement1.getPartyDetails()) {
            partyDetails.getDeliveryChannels().forEach(deliveryChannel -> {
                LocalDate localDate = LocalDate.now();
                deliveryChannel.setFeePaidDate(localDate.format(DateTimeFormatter.ofPattern(DATE_FORMAT)));
            });
        }
        Document paymentReceipt = null;
        if (ONLINE.equalsIgnoreCase(paymentMode)) {
            paymentReceipt = getPaymentReceipt(request, paymentDetail.getBillId(), taskManagement.getTaskManagementNumber() + "_" + configuration.getTaskManagementSuffix());
        }
        if (paymentReceipt != null) {
            taskManagement.setDocuments(List.of(paymentReceipt));
        }
        producer.push(configuration.getUpdateTaskManagementTopic(), request);
    }

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
            return null;
        }
    }

    public Document getPaymentReceipt(TaskManagementRequest taskManagementRequest, String id, String consumerCode){
        try {
            log.info("Enriching payment receipt for case with id: {}", id);
            JsonNode paymentReceipt = etreasuryUtil.getPaymentReceipt(taskManagementRequest.getRequestInfo(), id);
            Document document = Document.builder()
                    .fileStore(paymentReceipt.get("Document").get("fileStore").textValue())
                    .documentType(PAYMENT_RECEIPT)
                    .additionalDetails(getAdditionalDetails(consumerCode))
                    .build();
            document.setId(String.valueOf(UUID.randomUUID()));
            document.setDocumentUid(document.getId());
            return document;
        } catch (Exception e) {
            log.error("Error enriching payment receipt: {}", e.toString());
            throw new CustomException("ENRICHMENT_EXCEPTION", "Error in case enrichment service while enriching payment receipt: " + e.getMessage());
        }
    }

    private Object getAdditionalDetails(String consumerCode) {
        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("consumerCode", consumerCode);
        return additionalDetails;
    }
//    public void generateFollowUpTasks(RequestInfo requestInfo, TaskManagement taskManagement) {
//        for (PartyDetails party : taskManagement.getPartyDetails()) {
//            if (party.getRespondentDetails() != null) {
//                createTasksForParty(requestInfo, taskManagement, party, "Respondent");
//            } else if (party.getWitnessDetails() != null) {
//                createTasksForParty(requestInfo, taskManagement, party, "Witness");
//            }
//        }
//    }
//
//    private void createTasksForParty(RequestInfo requestInfo, TaskManagement taskManagement, PartyDetails partyDetails, String partyType) {
//        CourtCase courtCase = fetchCase(requestInfo, taskManagement.getFilingNumber());
//        Order order = fetchOrder(requestInfo, taskManagement.getOrderNumber());
//        Map<String, Object> additionalDetails = extractAdditionalDetails(order);
//        Map<String, Object> courtDetails = fetchCourtDetails(requestInfo, taskManagement, courtCase);
//
//        CaseDetails caseDetails = buildCaseDetails(order, courtCase, courtDetails);
//        ComplainantDetails complainantDetails = getComplainantDetails(courtCase);
//        TaskDetails baseTaskDetails = buildSummonAndNoticeDetails(order, courtCase, partyType);
//
//        List<TaskDetails> taskDetailsList = buildTaskDetailsList(partyDetails, caseDetails, baseTaskDetails, complainantDetails);
//
//        Task taskTemplate = buildBaseTask(taskManagement, order, courtCase, additionalDetails);
//
//        for (TaskDetails detail : taskDetailsList) {
//            taskTemplate.setTaskDetails(detail);
//            taskUtil.callCreateTask(TaskRequest.builder()
//                    .requestInfo(requestInfo)
//                    .task(taskTemplate)
//                    .build());
//        }
//    }
//
//    // ---- Data Fetching Methods ---- //
//
//    private CourtCase fetchCase(RequestInfo requestInfo, String filingNumber) {
//        JsonNode caseNode = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
//                .requestInfo(requestInfo)
//                .criteria(List.of(CaseCriteria.builder().filingNumber(filingNumber).build()))
//                .build());
//        return objectMapper.convertValue(caseNode, CourtCase.class);
//    }
//
//    private Order fetchOrder(RequestInfo requestInfo, String orderNumber) {
//        OrderListResponse orderResponse = orderUtil.getOrders(OrderSearchRequest.builder()
//                .requestInfo(requestInfo)
//                .criteria(OrderCriteria.builder().orderNumber(orderNumber).build())
//                .build());
//        return orderResponse.getList().get(0);
//    }
//
//    private Map<String, Object> extractAdditionalDetails(Order order) {
//        String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
//        Map<String, Object> details = new HashMap<>();
//        if (itemId != null) details.put("itemId", itemId);
//        return details;
//    }
//
//    private Map<String, Object> fetchCourtDetails(RequestInfo requestInfo, TaskManagement task, CourtCase courtCase) {
//        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(
//                requestInfo, task.getTenantId(), "common-masters", List.of("Court_Rooms")
//        );
//        JSONArray rooms = mdmsData.get("common-masters").get("Court_Rooms");
//        return rooms.stream()
//                .filter(o -> o instanceof Map data && courtCase.getCourtId() != null && courtCase.getCourtId().equals(data.get("code")))
//                .map(o -> (Map<String, Object>) o)
//                .findFirst()
//                .orElse(new HashMap<>());
//    }
//
//    // ---- Builders ---- //
//
//    private CaseDetails buildCaseDetails(Order order, CourtCase courtCase, Map<String, Object> courtDetails) {
//        String hearingDateStr = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("formdata", "dateForHearing"), String.class);
//        Long hearingDateEpoch = hearingDateStr != null ? dateUtil.getEpochFromDateString(hearingDateStr, "yyyy-MM-dd") : null;
//
//        return CaseDetails.builder()
//                .caseTitle(courtCase.getCaseTitle())
//                .hearingDate(hearingDateEpoch)
//                .courtName((String) courtDetails.get("name"))
//                .courtAddress((String) courtDetails.get("address"))
//                .courtId((String) courtDetails.get("code"))
//                .hearingNumber(order.getHearingNumber())
//                .judgeName(configuration.getJudgeName())
//                .build();
//    }
//
//    private TaskDetails buildSummonAndNoticeDetails(Order order, CourtCase courtCase, String partyType) {
//        String orderType = order.getOrderType();
//        Object additionalDetails = order.getAdditionalDetails();
//
//        switch (orderType) {
//            case SUMMONS -> {
//                String docSubType = normalizePartyType(partyType);
//                return TaskDetails.builder()
//                        .summonDetails(SummonsDetails.builder()
//                                .docSubType(docSubType)
//                                .issueDate(order.getCreatedDate())
//                                .caseFilingDate(courtCase.getFilingDate())
//                                .build())
//                        .build();
//            }
//            case NOTICE -> {
//                String docSubType = normalizePartyType(partyType);
//                String noticeType = jsonUtil.getNestedValue(additionalDetails, List.of("formdata", "noticeType", "type"), String.class);
//                return TaskDetails.builder()
//                        .noticeDetails(NoticeDetails.builder()
//                                .caseFilingDate(courtCase.getFilingDate())
//                                .issueDate(order.getCreatedDate())
//                                .noticeType(noticeType)
//                                .docSubType(docSubType)
//                                .partyType(partyType)
//                                .build())
//                        .build();
//            }
//            default -> {
//                return TaskDetails.builder().build();
//            }
//        }
//    }
//
//    private List<TaskDetails> buildTaskDetailsList(PartyDetails party, CaseDetails caseDetails, TaskDetails baseTaskDetails, ComplainantDetails complainantDetails) {
//        List<TaskDetails> result = new ArrayList<>();
//
//        if (party == null || party.getAddresses() == null || party.getAddresses().isEmpty()) {
//            return result;
//        }
//
//        // Get delivery channels or initialize empty list
//        List<DeliveryChannel> deliveryChannels = party.getDeliveryChannels() != null
//                ? new ArrayList<>(party.getDeliveryChannels())
//                : new ArrayList<>();
//        // Ensure SMS and EMAIL channels are present
//        ensureDefaultChannels(deliveryChannels);
//
//        for (PartyAddress address : party.getAddresses()) {
//            RespondentDetails respondentDetails = null;
//            WitnessDetails witnessDetails = null;
//            if (party.getRespondentDetails() != null) {
//                respondentDetails = getRespondentDetails(party.getRespondentDetails(), address);
//            }
//            if (party.getWitnessDetails() != null) {
//                witnessDetails = getWitnessDetails(party.getWitnessDetails(), address);
//            }
//            for (DeliveryChannel channel : deliveryChannels) {
//                result.add(TaskDetails.builder()
//                        .caseDetails(caseDetails)
//                        .summonDetails(baseTaskDetails != null ? baseTaskDetails.getSummonDetails() : null)
//                        .noticeDetails(baseTaskDetails != null ? baseTaskDetails.getNoticeDetails() : null)
//                        .respondentDetails(respondentDetails)
//                        .witnessDetails(witnessDetails)
//                        .complainantDetails(complainantDetails)
//                        .deliveryChannel(DeliveryChannel.builder()
//                                .channelName(channel != null ? channel.getChannelId() : null)
//                                .channelCode(channel != null ? channel.getChannelCode() : null)
//                                .fees(channel != null ? channel.getFees() : null)
//                                .build())
//                        .build());
//            }
//        }
//        return result;
//    }
//
//    /**
//     * Ensures that SMS and EMAIL delivery channels are always included.
//     */
//    private void ensureDefaultChannels(List<DeliveryChannel> channels) {
//        boolean hasSMS = channels.stream()
//                .anyMatch(c -> SMS.equalsIgnoreCase(c.getChannelCode()) || SMS.equalsIgnoreCase(c.getChannelName()));
//        boolean hasEmail = channels.stream()
//                .anyMatch(c -> EMAIL.equalsIgnoreCase(c.getChannelCode()) || EMAIL.equalsIgnoreCase(c.getChannelName()));
//        if (!hasSMS) {
//            channels.add(DeliveryChannel.builder()
//                    .channelName(SMS)
//                    .channelCode(SMS)
//                    .fees("0") // Default fee if applicable
//                    .build());
//        }
//        if (!hasEmail) {
//            channels.add(DeliveryChannel.builder()
//                    .channelName(SMS)
//                    .channelCode(SMS)
//                    .fees("0")
//                    .build());
//        }
//    }
//
//
//    private WitnessDetails getWitnessDetails(digit.web.models.cases.WitnessDetails witnessDetails, PartyAddress partyAddresses) {
//        if (witnessDetails == null) {
//            return null;
//        }
//
//        String firstName = witnessDetails.getFirstName() != null ? witnessDetails.getFirstName() : "";
//        String middleName = witnessDetails.getMiddleName() != null ? witnessDetails.getMiddleName() : "";
//        String lastName = witnessDetails.getLastName() != null ? witnessDetails.getLastName() : "";
//        String name = String.join(" ", firstName, middleName, lastName).trim();
//
//        Integer age = null;
//        try {
//            age = witnessDetails.getWitnessAge() != null ? Integer.valueOf(witnessDetails.getWitnessAge()) : null;
//        } catch (NumberFormatException e) {
//            age = null;
//        }
//
//        String phone = null;
//        if (witnessDetails.getPhoneNumbers() != null &&
//                witnessDetails.getPhoneNumbers().getMobileNumber() != null &&
//                !witnessDetails.getPhoneNumbers().getMobileNumber().isEmpty()) {
//            phone = witnessDetails.getPhoneNumbers().getMobileNumber().get(0);
//        }
//
//        String email = null;
//        if (witnessDetails.getEmails() != null &&
//                witnessDetails.getEmails().getEmailId() != null &&
//                !witnessDetails.getEmails().getEmailId().isEmpty()) {
//            email = witnessDetails.getEmails().getEmailId().get(0);
//        }
//
//        Address address = mapToAddress(partyAddresses.getAddressDetails());
//
//        return WitnessDetails.builder()
//                .name(name)
//                .age(age)
//                .phone(phone)
//                .email(email)
//                .address(address)
//                .build();
//    }
//
//    private RespondentDetails getRespondentDetails(digit.web.models.cases.RespondentDetails respondentDetails, PartyAddress addressDetails) {
//        if (respondentDetails == null) {
//            return null;
//        }
//
//        String firstName = respondentDetails.getFirstName() != null ? respondentDetails.getFirstName() : "";
//        String middleName = respondentDetails.getMiddleName() != null ? respondentDetails.getMiddleName() : "";
//        String lastName = respondentDetails.getLastName() != null ? respondentDetails.getLastName() : "";
//        String name = String.join(" ", firstName, middleName, lastName).trim();
//
//        Address address = mapToAddress(addressDetails.getAddressDetails());
//
//        String phone = null;
//        if (respondentDetails.getPhoneNumbers() != null && !respondentDetails.getPhoneNumbers().isEmpty()) {
//            phone = respondentDetails.getPhoneNumbers().get(0);
//        }
//
//        String email = null;
//        if (respondentDetails.getEmail() != null && !respondentDetails.getEmail().isEmpty()) {
//            email = respondentDetails.getEmail().get(0);
//        }
//
//        Integer age = respondentDetails.getRespondentAge();
//
//        return RespondentDetails.builder()
//                .email(email)
//                .name(name)
//                .address(address)
//                .phone(phone)
//                .age(age)
//                .build();
//    }
//
//    private Address mapToAddress(AddressDetails addressDetails) {
//        if (addressDetails == null) {
//            return null;
//        }
//
//        return Address.builder()
//                .city(addressDetails.getCity())
//                .state(addressDetails.getState())
//                .district(addressDetails.getDistrict())
//                .pinCode(addressDetails.getPincode())
//                .locality(addressDetails.getLocality())
//                .build();
//    }
//
//    private Task buildBaseTask(TaskManagement task, Order order, CourtCase courtCase, Map<String, Object> additionalDetails) {
//        return Task.builder()
//                .tenantId(task.getTenantId())
//                .orderId(order.getId())
//                .filingNumber(task.getFilingNumber())
//                .cnrNumber(courtCase.getCnrNumber())
//                .caseId(courtCase.getId().toString())
//                .caseTitle(courtCase.getCaseTitle())
//                .taskType(task.getTaskType())
//                .createdDate(dateUtil.getCurrentTimeInMilis())
//                .amount(Amount.builder().type("FINE").amount("0").build())
//                .additionalDetails(additionalDetails)
//                .workflow(getCreateWithOutPayment())
//                .build();
//    }
//
//    private static WorkflowObject getCreateWithOutPayment() {
//        WorkflowObject workflowObject = new WorkflowObject();
//        workflowObject.setAction(CREATE_WITH_OUT_PAYMENT);
//        return workflowObject;
//    }
//
//    private String normalizePartyType(String type) {
//        if (type == null) return null;
//        return type.equalsIgnoreCase("Witness") ? WITNESS : ACCUSED;
//    }
//
//    private ComplainantDetails getComplainantDetails(CourtCase courtCase) {
//
//        ComplainantDetails complainantDetails = new ComplainantDetails();
//        Optional<Party> primaryComplainant = courtCase.getLitigants().stream().filter(item -> COMPLAINANT_PRIMARY.equalsIgnoreCase(item.getPartyType())).findFirst();
//        if (primaryComplainant.isPresent()) {
//            String individualId;
//            individualId = primaryComplainant.get().getIndividualId();
//            Map<String, Object> complainantDetailsFromCourtCase = getComplainantDetailsFromCourtCase(courtCase, individualId);
//
//            Map<String, Object> complainantAddressFromIndividualDetail = getComplainantAddressFromComplainantDetails(complainantDetailsFromCourtCase);
//            String complainantName = getComplainantName(complainantDetailsFromCourtCase);
//            complainantDetails.setAddress(complainantAddressFromIndividualDetail);
//            complainantDetails.setName(complainantName);
//        }
//        return complainantDetails;
//    }
//
//    public Map<String, Object> getComplainantDetailsFromCourtCase(CourtCase courtCase, String complainantIndividualId) {
//        if (courtCase == null) return Collections.emptyMap();
//        Object additional = courtCase.getAdditionalDetails();
//        Map<?, ?> complainantDetailsObj = jsonUtil.getNestedValue(additional, List.of("complainantDetails"), Map.class);
//        List<?> formdataList = jsonUtil.getNestedValue(complainantDetailsObj, List.of("formdata"), List.class);
//        if (formdataList == null || formdataList.isEmpty()) return Collections.emptyMap();
//        Map complainantDetails = formdataList.stream()
//                .filter(d -> {
//                    Map<?, ?> data = jsonUtil.getNestedValue(d, List.of("data"), Map.class);
//                    Map<?, ?> individualDetails = jsonUtil.getNestedValue(data, List.of("complainantVerification", "individualDetails"), Map.class);
//                    return individualDetails != null && complainantIndividualId.equals(individualDetails.get("individualId"));
//                })
//                .findFirst()
//                .map(d -> jsonUtil.getNestedValue(d, List.of("data"), Map.class))
//                .orElse(Collections.emptyMap());
//
//        return complainantDetails;
//    }
//
//    public Map<String, Object> getComplainantAddressFromComplainantDetails(Map<String, Object> complainantDetails) {
//        if (complainantDetails == null) return Collections.emptyMap();
//
//        String district = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "district"), String.class);
//        String city = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "city"), String.class);
//        String pincode = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode"), String.class);
//        String latitude = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode", "latitude"), String.class);
//        String longitude = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode", "longitude"), String.class);
//        String locality = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "locality"), String.class);
//        String state = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "state"), String.class);
//
//        Map<String, Object> coordinate = new HashMap<>();
//        coordinate.put("longitude", longitude);
//        coordinate.put("latitude", latitude);
//
//        Map<String, Object> complainantAddress = new HashMap<>();
//        complainantAddress.put("pincode", pincode);
//        complainantAddress.put("district", district);
//        complainantAddress.put("city", city);
//        complainantAddress.put("state", state);
//        complainantAddress.put("coordinate", coordinate);
//        complainantAddress.put("locality", locality);
//        return complainantAddress;
//    }
//
//    public String getComplainantName(Map<String, Object> complainantDetails) {
//        if (complainantDetails == null) return "";
//        String firstName = jsonUtil.getNestedValue(complainantDetails, List.of("firstName"), String.class);
//        String lastName = jsonUtil.getNestedValue(complainantDetails, List.of("lastName"), String.class);
//        String partyName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
//        Map<?, ?> complainantTypeObj = jsonUtil.getNestedValue(complainantDetails, List.of("complainantType"), Map.class);
//        String complainantTypeCode = complainantTypeObj != null ? (String) complainantTypeObj.get("code") : null;
//        if (INDIVIDUAL.equalsIgnoreCase(complainantTypeCode)) {
//            return partyName;
//        }
//        String companyName = jsonUtil.getNestedValue(complainantDetails, List.of("complainantCompanyName"), String.class);
//        if (companyName != null && !companyName.isEmpty()) {
//            return String.format("%s (Represented By %s)", companyName, partyName);
//        }
//        return "";
//    }
}
