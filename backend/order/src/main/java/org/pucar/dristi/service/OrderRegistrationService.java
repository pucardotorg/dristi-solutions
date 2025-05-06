package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.OrderRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.OrderRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.validators.OrderRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class OrderRegistrationService {

    private OrderRegistrationValidator validator;

    private OrderRegistrationEnrichment enrichmentUtil;

    private OrderRepository orderRepository;

    private WorkflowUtil workflowUtil;

    private Configuration config;

    private Producer producer;
    private ObjectMapper objectMapper;

    private CaseUtil caseUtil;

    private SmsNotificationService notificationService;

    private IndividualService individualService;

    @Autowired
    public OrderRegistrationService(OrderRegistrationValidator validator, Producer producer, Configuration config, WorkflowUtil workflowUtil, OrderRepository orderRepository, OrderRegistrationEnrichment enrichmentUtil, ObjectMapper objectMapper, CaseUtil caseUtil, SmsNotificationService notificationService, IndividualService individualService) {
        this.validator = validator;
        this.producer = producer;
        this.config = config;
        this.workflowUtil = workflowUtil;
        this.orderRepository = orderRepository;
        this.enrichmentUtil = enrichmentUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.notificationService = notificationService;
        this.individualService = individualService;
    }

    public Order createOrder(OrderRequest body) {
        try {
            validator.validateOrderRegistration(body);

            enrichmentUtil.enrichOrderRegistration(body);
            enrichmentUtil.enrichCompositeOrderItemIdOnAddItem(body);

            workflowUpdate(body);

            producer.push(config.getSaveOrderKafkaTopic(), body);

            return body.getOrder();
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating order");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating order :: {}", e.toString());
            throw new CustomException(ORDER_CREATE_EXCEPTION, e.getMessage());
        }
    }

    public List<Order> searchOrder(OrderSearchRequest request) {
        try {
            // Fetch applications from database according to the given search criteria
            List<Order> orderList = orderRepository.getOrders(request.getCriteria(), request.getPagination());

            // If no applications are found matching the given criteria, return an empty list
            if (CollectionUtils.isEmpty(orderList))
                return new ArrayList<>();
            return orderList;

        } catch (Exception e) {
            log.error("Error while fetching to search results :: {}", e.toString());
            throw new CustomException(ORDER_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    public Order updateOrder(OrderRequest body) {

        try {
            // Validate whether the application that is being requested for update indeed exists
            if (!validator.validateApplicationExistence(body))
                throw new CustomException(ORDER_UPDATE_EXCEPTION, "Order don't exist");

            validator.validateCompositeOrder(body);
            // Enrich application upon update
            enrichmentUtil.enrichOrderRegistrationUponUpdate(body);
            enrichmentUtil.enrichCompositeOrderItemIdOnAddItem(body);


            workflowUpdate(body);
            String updatedState = body.getOrder().getStatus();
            String orderType = body.getOrder().getOrderType();
            producer.push(config.getUpdateOrderKafkaTopic(), body);

            callNotificationService(body, updatedState, orderType);

            return body.getOrder();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating order :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating order");
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "Error occurred while updating order: " + e.getMessage());
        }

    }

    public Order addItem(OrderRequest body) {

        try {
            // Validate whether the application that is being requested for update indeed exists
            if (!validator.validateApplicationExistence(body))
                throw new CustomException(ORDER_UPDATE_EXCEPTION, "Order doesn't exist");

            validator.validateAddItem(body);

            // Enrich application upon update
            enrichmentUtil.enrichOrderRegistrationUponUpdate(body);
            enrichmentUtil.enrichCompositeOrderItemIdOnAddItem(body);

            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(SAVE_DRAFT);

            body.getOrder().setWorkflow(workflow);

            workflowUpdate(body);

            producer.push(config.getUpdateOrderKafkaTopic(), body);

            return body.getOrder();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while adding item/order :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while adding item/order");
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "Error occurred while adding item/order: " + e.getMessage());
        }

    }

    public Order removeItem(RemoveItemRequest body) {

        try {
            Order order = getOrder(body);
            removeCompositeItem(body.getOrder().getItemID(), order);

            OrderRequest orderRequest = new OrderRequest();
            orderRequest.setRequestInfo(body.getRequestInfo());
            orderRequest.setOrder(order);
            enrichmentUtil.enrichAuditDetails(orderRequest);

            producer.push(config.getUpdateOrderKafkaTopic(), orderRequest);

            return order;

        } catch (CustomException e) {
            log.error("Custom Exception occurred while removing item/order :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while removing item/order");
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "Error occurred while removing item/order: " + e.getMessage());
        }

    }

    private Order getOrder(RemoveItemRequest body) {
        OrderCriteria orderCriteria = new OrderCriteria();
        orderCriteria.setOrderNumber(body.getOrder().getOrderNumber());
        orderCriteria.setTenantId(body.getOrder().getTenantId());

        // Fetch applications from database according to the search criteria
        List<Order> orderList = orderRepository.getOrders(orderCriteria, null);

        // If no applications are found matching the given criteria, return an empty list
        if (CollectionUtils.isEmpty(orderList))
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "Order doesn't exist");

        return orderList.get(0);
    }

    private void removeCompositeItem(String compositeItemId, Order order) {
        Object existingCompositeOrderItem = order.getCompositeItems();
        ArrayNode arrayNode = objectMapper.convertValue(existingCompositeOrderItem, ArrayNode.class);

        if (arrayNode != null && !arrayNode.isEmpty()) {
            for (int i = 0; i < arrayNode.size(); i++) {
                ObjectNode existingCompositeOrderItemObjectNode = (ObjectNode) arrayNode.get(i);
                String existingCompositeOrderItemId = existingCompositeOrderItemObjectNode.path("id").asText();

                log.info("Existing CompositeOrderItem :: {}", existingCompositeOrderItemObjectNode);

                if (compositeItemId.equalsIgnoreCase(existingCompositeOrderItemId)) {
                    log.info("Removing Item :: {}", existingCompositeOrderItemId);

                    // Remove item from ArrayNode
                    arrayNode.remove(i);

                    // Update the order object
                    order.setCompositeItems(arrayNode);
                    return;
                }
            }
        }
    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, Order order) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(order.getFilingNumber()).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    private String getMessageCode(String orderType, String updatedStatus, Boolean hearingCompleted, String submissionType, String purpose) {

        log.info("Operation: getMessageCode for OrderType: {}, UpdatedStatus: {}, HearingCompleted: {}, SubmissionType: {}, Purpose: {}", orderType, updatedStatus, hearingCompleted, submissionType, purpose);
//        if(!StringUtils.isEmpty(purpose) && purpose.equalsIgnoreCase(EXAMINATION_UNDER_S351_BNSS) && updatedStatus.equalsIgnoreCase(PUBLISHED)){
//            return EXAMINATION_UNDER_S351_BNSS_SCHEDULED;
//        }
//        if(!StringUtils.isEmpty(purpose) && purpose.equalsIgnoreCase(EVIDENCE_ACCUSED) && updatedStatus.equalsIgnoreCase(PUBLISHED)){
//            return EVIDENCE_ACCUSED_PUBLISHED;
//        }
//        if(!StringUtils.isEmpty(purpose) && purpose.equalsIgnoreCase(EVIDENCE_COMPLAINANT) && updatedStatus.equalsIgnoreCase(PUBLISHED)){
//            return EVIDENCE_COMPLAINANT_PUBLISHED;
//        }
//        if(!StringUtils.isEmpty(purpose) && purpose.equalsIgnoreCase(APPEARANCE) && updatedStatus.equalsIgnoreCase(PUBLISHED)){
//            return APPEARANCE_PUBLISHED;
//        }
        if (orderType.equalsIgnoreCase(SCHEDULING_NEXT_HEARING) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return NEXT_HEARING_SCHEDULED;
        }
//        if(orderType.equalsIgnoreCase(SCHEDULE_OF_HEARING_DATE) && updatedStatus.equalsIgnoreCase(PUBLISHED)){
//            return ADMISSION_HEARING_SCHEDULED;
//        }
        if (orderType.equalsIgnoreCase(JUDGEMENT) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return CASE_DECISION_AVAILABLE;
        }
        if (orderType.equalsIgnoreCase(ASSIGNING_DATE_RESCHEDULED_HEARING) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return HEARING_RESCHEDULED;
        }
        if (orderType.equalsIgnoreCase(WARRANT) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return WARRANT_ISSUED;
        }
        if (orderType.equalsIgnoreCase(SUMMONS) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return SUMMONS_ISSUED;
        }
        if (hearingCompleted && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return ORDER_PUBLISHED;
        }
        if (orderType.equalsIgnoreCase(MANDATORY_SUBMISSIONS_RESPONSES) && submissionType.equalsIgnoreCase(EVIDENCE) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return EVIDENCE_REQUESTED;
        }
        if (orderType.equalsIgnoreCase(MANDATORY_SUBMISSIONS_RESPONSES) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return ADDITIONAL_INFORMATION_MESSAGE;
        }
        if (orderType.equalsIgnoreCase(NOTICE) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return NOTICE_ISSUED;
        }
        if (updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return ORDER_ISSUED;
        }
        return null;
    }

    private void callNotificationService(OrderRequest orderRequest, String updatedState, String orderType) {

        try {
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(orderRequest.getRequestInfo(), orderRequest.getOrder());
            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

            Object additionalDetailsObject = orderRequest.getOrder().getAdditionalDetails();
            String jsonData = objectMapper.writeValueAsString(additionalDetailsObject);
            JsonNode additionalData = objectMapper.readTree(jsonData);
            JsonNode formData = additionalData.path("formdata");
            String submissionType = formData.has("documentType") ? formData.path("documentType").path("value").asText() : "";
            boolean hearingCompleted = formData.has("lastHearingTranscript");

            Object orderDetailsObject = orderRequest.getOrder().getOrderDetails();
            JsonNode orderDetails = objectMapper.readTree(objectMapper.writeValueAsString(orderDetailsObject));
            String purposeOfHearing = orderDetails.has("purposeOfHearing") ? orderDetails.get("purposeOfHearing").asText() : "";

            String messageCode = updatedState != null ? getMessageCode(orderType, updatedState, hearingCompleted, submissionType, purposeOfHearing) : null;
            log.info("Message Code: {}", messageCode);
            assert messageCode != null;

            String receiver = getReceiverParty(messageCode);

            Set<String> individualIds = extractIndividualIds(caseDetails, receiver);

            if (receiver == null || receiver.equalsIgnoreCase(COMPLAINANT)) {
                extractPowerOfAttorneyIds(caseDetails, individualIds);
            }

            Set<String> phonenumbers = callIndividualService(orderRequest.getRequestInfo(), individualIds);
            String hearingDate = formData.has("hearingDate") ? formData.get("hearingDate").asText()
                    : formData.has("newHearingDate") ? formData.get("newHearingDate").asText()
                    : "";

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .courtCaseNumber(caseDetails.has("courtCaseNumber") ? caseDetails.get("courtCaseNumber").asText() : "")
                    .cmpNumber(caseDetails.has("cmpNumber") ? caseDetails.get("cmpNumber").asText() : "")
                    .hearingDate(hearingDate)
                    .submissionDate(formData.has("submissionDeadline") ? formData.get("submissionDeadline").asText() : "")
                    .tenantId(orderRequest.getOrder().getTenantId()).build();

            if (receiver != null && receiver.equalsIgnoreCase(RESPONDENT)) {
                JsonNode respondentDetails = caseDetails.get("additionalDetails").get("respondentDetails").get("formdata");
                for (int i = 0; i < respondentDetails.size(); i++) {
                    phonenumbers.add(respondentDetails.get(i).get("data").get("phonenumbers").get("mobileNumber").get(0).textValue());
                }
            }

            for (String number : phonenumbers) {
                notificationService.sendNotification(orderRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private static String getReceiverParty(String messageCode) {
        if (messageCode.equalsIgnoreCase(NOTICE_ISSUED) || messageCode.equalsIgnoreCase(WARRANT_ISSUED) || messageCode.equalsIgnoreCase(SUMMONS_ISSUED)) {
            return RESPONDENT;
        }
        return null;
    }


    public List<OrderExists> existsOrder(OrderExistsRequest orderExistsRequest) {
        try {
            return orderRepository.checkOrderExists(orderExistsRequest.getOrder());
        } catch (CustomException e) {
            log.error("Custom Exception occurred while searching :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to search order results :: {}", e.toString());
            throw new CustomException(ORDER_EXISTS_EXCEPTION, e.getMessage());
        }
    }

    private void workflowUpdate(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        String tenantId = order.getTenantId();
        String orderNumber = order.getOrderNumber();
        WorkflowObject workflow = order.getWorkflow();

        String status = workflowUtil.updateWorkflowStatus(requestInfo, tenantId, orderNumber, config.getOrderBusinessServiceName(),
                workflow, config.getOrderBusinessName());
        order.setStatus(status);
        if (PUBLISHED.equalsIgnoreCase(status))
            order.setCreatedDate(System.currentTimeMillis());
    }

    private Set<String> callIndividualService(RequestInfo requestInfo, Set<String> ids) {

        Set<String> mobileNumber = new HashSet<>();

        List<Individual> individuals = individualService.getIndividuals(requestInfo, new ArrayList<>(ids));
        for (Individual individual : individuals) {
            if (individual.getMobileNumber() != null) {
                mobileNumber.add(individual.getMobileNumber());
            }
        }
        return mobileNumber;
    }

    public Set<String> extractIndividualIds(JsonNode caseDetails, String receiver) {
        JsonNode litigantNode = caseDetails.get("litigants");
        JsonNode representativeNode = caseDetails.get("representatives");
        String partyTypeToMatch = (receiver != null) ? receiver.toLowerCase() : "";
        Set<String> uuids = new HashSet<>();

        if (litigantNode.isArray()) {
            for (JsonNode node : litigantNode) {
                String partyType = node.get("partyType").asText().toLowerCase();
                if (partyType.contains(partyTypeToMatch)) {
                    String uuid = node.path("additionalDetails").get("uuid").asText();
                    if (!uuid.isEmpty()) {
                        uuids.add(uuid);
                    }
                }
            }
        }

        if (representativeNode.isArray()) {
            for (JsonNode advocateNode : representativeNode) {
                JsonNode representingNode = advocateNode.get("representing");
                if (representingNode.isArray()) {
                    String partyType = representingNode.get(0).get("partyType").asText().toLowerCase();
                    if (partyType.contains(partyTypeToMatch)) {
                        String uuid = advocateNode.path("additionalDetails").get("uuid").asText();
                        if (!uuid.isEmpty()) {
                            uuids.add(uuid);
                        }
                    }
                }
            }
        }
        return uuids;
    }

    public void extractPowerOfAttorneyIds(JsonNode caseDetails, Set<String> individualIds) {
        JsonNode poaHolders = caseDetails.get("poaHolders");
        if (poaHolders != null && poaHolders.isArray()) {
            for (JsonNode poaHolder : poaHolders) {
                String individualId = poaHolder.path("individualId").textValue();
                if (individualId != null && !individualId.isEmpty()) {
                    individualIds.add(individualId);
                }
            }
        }
    }

}
