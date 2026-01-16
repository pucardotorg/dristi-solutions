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
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.HearingUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.validators.OrderRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class OrderRegistrationService {

    private final HearingUtil hearingUtil;
    private final DateUtil dateUtil;
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
    private final FileStoreUtil fileStoreUtil;

    @Autowired
    public OrderRegistrationService(OrderRegistrationValidator validator, Producer producer, Configuration config, WorkflowUtil workflowUtil, OrderRepository orderRepository, OrderRegistrationEnrichment enrichmentUtil, ObjectMapper objectMapper, CaseUtil caseUtil, SmsNotificationService notificationService, IndividualService individualService, FileStoreUtil fileStoreUtil, HearingUtil hearingUtil, DateUtil dateUtil) {
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
        this.fileStoreUtil = fileStoreUtil;
        this.hearingUtil = hearingUtil;
        this.dateUtil = dateUtil;
    }

    public Order createOrder(OrderRequest body) {
        try {
            validator.validateOrderRegistration(body);

            enrichmentUtil.enrichOrderRegistration(body);
            enrichmentUtil.enrichCompositeOrderItemIdOnAddItem(body);
            enrichmentUtil.enrichItemTextForIntermediateOrder(body);

            workflowUpdate(body);
            callNotificationService(body, body.getOrder().getStatus(), body.getOrder().getOrderType());

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
            enrichmentUtil.enrichItemTextForIntermediateOrder(body);

            workflowUpdate(body);

            deleteFileStoreDocumentsIfInactive(body.getOrder());

            String updatedState = body.getOrder().getStatus();
            String orderType = body.getOrder().getOrderType();
            producer.push(config.getUpdateOrderKafkaTopic(), body);

            callNotificationService(body, updatedState, orderType);

            filterDocuments(new ArrayList<>() {{ add(body.getOrder());}}, Order::getDocuments, Order::setDocuments);

            return body.getOrder();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating order :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating order");
            throw new CustomException(ORDER_UPDATE_EXCEPTION, "Error occurred while updating order: " + e.getMessage());
        }

    }

    private <T> void filterDocuments(List<T> entities,
                                     Function<T, List<Document>> getDocs,
                                     BiConsumer<T, List<Document>> setDocs) {
        if (entities == null) return;

        for (T entity : entities) {
            List<Document> docs = getDocs.apply(entity);
            if (docs != null) {
                List<Document> activeDocs = docs.stream()
                        .filter(Document::getIsActive)
                        .collect(Collectors.toList());
                setDocs.accept(entity, activeDocs); // ✅ set it back
            }
        }
    }

    private void deleteFileStoreDocumentsIfInactive(Order order) {

        if (order.getDocuments() != null) {
            List<String> fileStoreIds = new ArrayList<>();

            for (Document document : order.getDocuments()) {
                if (!document.getIsActive()) {
                    fileStoreIds.add(document.getFileStore());
                }
            }
            if (!fileStoreIds.isEmpty()) {
                fileStoreUtil.deleteFilesByFileStore(fileStoreIds, order.getTenantId());
                log.info("Deleted files from filestore: {}", fileStoreIds);
            }
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

            WorkflowObject workflow = body.getOrder().getWorkflow();
            workflow.setAction(SAVE_DRAFT);
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
            order.setItemText(body.getOrder().getItemText());
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
        if(SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(orderType)){
            return HEARING_SCHEDULED;
        }
        if (orderType.equalsIgnoreCase(ASSIGNING_DATE_RESCHEDULED_HEARING) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return HEARING_RESCHEDULED;
        }
        if (orderType.equalsIgnoreCase(SUMMONS) && updatedStatus.equalsIgnoreCase(PUBLISHED)) {
            return SUMMONS_ISSUED;
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

            Set<String> litigantIndividualIds = extractLitigantIndividualIds(caseDetails, receiver);
            Set<String> individualIds = new HashSet<>(litigantIndividualIds);
            if(shouldSendSMSToAdvocate(messageCode)){
                Set<String> advocateIndividualIds = extractAdvocateIndividualIds(caseDetails, receiver);
                individualIds.addAll(advocateIndividualIds);
            }
            if (receiver == null || receiver.equalsIgnoreCase(COMPLAINANT)) {
                extractPowerOfAttorneyIds(caseDetails, individualIds);
            }

            Set<String> phonenumbers = callIndividualService(orderRequest.getRequestInfo(), individualIds);
            String hearingDate = formData.has("hearingDate") ? formData.get("hearingDate").textValue()
                    : formData.has("newHearingDate") ? formData.get("newHearingDate").asText()
                    : "";

            String hearingNumber = orderRequest.getOrder().getHearingNumber();
            HearingCriteria criteria = HearingCriteria.builder()
                    .hearingId(hearingNumber)
                    .status(OPT_OUT)
                    .build();
            Pagination pagination = Pagination.builder()
                    .sortBy("startTime")
                    .order(OrderPagination.DESC)
                    .build();
            HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                    .criteria(criteria)
                    .pagination(pagination)
                    .build();
            Hearing hearing = hearingUtil.getHearings(hearingSearchRequest)
                    .getHearingList()
                    .get(0);
            long oldHearingStartTime = hearing.getStartTime();
            String oldHearingDate = dateUtil.getFormattedDateFromEpoch(oldHearingStartTime, YYYY_MM_DD);

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .courtCaseNumber(caseDetails.has("courtCaseNumber") ? caseDetails.get("courtCaseNumber").textValue() : "")
                    .cmpNumber(caseDetails.has("cmpNumber") ? caseDetails.get("cmpNumber").textValue() : "")
                    .hearingDate(hearingDate)
                    .submissionDate(formData.has("submissionDeadline") ? formData.get("submissionDeadline").textValue() : "")
                    .filingNumber(caseDetails.has("filingNumber") ? caseDetails.get("filingNumber").textValue() : "")
                    .oldHearingDate(oldHearingDate)
                    .tenantId(orderRequest.getOrder().getTenantId()).build();

            if (receiver != null && receiver.equalsIgnoreCase(RESPONDENT)) {
                JsonNode respondentDetails = caseDetails.get("additionalDetails").get("respondentDetails").get("formdata");
                for (int i = 0; i < respondentDetails.size(); i++) {
                    phonenumbers.add(respondentDetails.get(i).get("data").get("phonenumbers").get("mobileNumber").get(0).textValue());
                }
            }

            for (String number : phonenumbers) {
                notificationService.sendNotification(orderRequest.getRequestInfo(), smsTemplateData, messageCode, number, orderRequest.getOrder());
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private boolean shouldSendSMSToAdvocate(String messageCode){
        return List.of(HEARING_SCHEDULED, HEARING_RESCHEDULED, ORDER_ISSUED).contains(messageCode);
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

    public  Set<String> extractLitigantIndividualIds(JsonNode caseDetails, String receiver) {

        JsonNode litigantNode = caseDetails.get("litigants");
        String partyTypeToMatch = (receiver != null) ? receiver : "";
        Set<String> uuids = new HashSet<>();

        if (litigantNode.isArray()) {
            for (JsonNode node : litigantNode) {
                String uuid = node.path("additionalDetails").get("uuid").asText();
                String partyType = node.get("partyType").asText().toLowerCase();
                if (partyType.toLowerCase().contains(partyTypeToMatch.toLowerCase())) {
                    if (!uuid.isEmpty()) {
                        uuids.add(uuid);
                    }
                }
            }
        }

        return uuids;
    }

    public Set<String> extractAdvocateIndividualIds(JsonNode caseDetails,String receiver) {

        JsonNode representativeNode = caseDetails.get("representatives");
        String partyTypeToMatch = (receiver != null) ? receiver : "";
        Set<String> uuids = new HashSet<>();

        if (representativeNode.isArray()) {
            for (JsonNode advocateNode : representativeNode) {
                JsonNode representingNode = advocateNode.get("representing");
                if (representingNode.isArray()) {
                    String partyType = representingNode.get(0).get("partyType").asText().toLowerCase();
                    if (partyType.toLowerCase().contains(partyTypeToMatch.toLowerCase())) {
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

    /**
     * Process order details request containing additionalDetails, compositeItems, orderNumber and uniqueId
     * @param request OrderDetailsRequest containing RequestInfo and OrderDetailsDTO
     * @return processed OrderDetailsDTO
     */
    public OrderDetailsDTO processOrderDetails(OrderDetailsRequest request) {
        try {
            OrderDetailsDTO orderDetailsDTO = request.getOrderDetailsDTO();
            String orderNumber = orderDetailsDTO.getOrderNumber();
            String uniqueId = orderDetailsDTO.getUniqueId();
            
            log.info("Processing order details for orderNumber: {} and uniqueId: {}", orderNumber, uniqueId);
            
            // Search for the order using orderNumber
            OrderSearchRequest searchRequest = new OrderSearchRequest();
            OrderCriteria criteria = new OrderCriteria();
            criteria.setOrderNumber(orderNumber);
            searchRequest.setCriteria(criteria);

            searchRequest.setRequestInfo(request.getRequestInfo());
            
            List<Order> orders = searchOrder(searchRequest);
            
            if (orders == null || orders.isEmpty()) {
                log.error("No order found with orderNumber: {}", orderNumber);
                throw new CustomException("ORDER_NOT_FOUND", 
                        "No order found with orderNumber: " + orderNumber);
            }
            
            Order order = orders.get(0);
            orderDetailsDTO.setAuditDetails(order.getAuditDetails());

            orderDetailsDTO.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            orderDetailsDTO.getAuditDetails().setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());
            
            // Log the order details
            log.info("Order details before update for order number: {}, additionalDetails: {}, compositeItems: {}", 
                    orderNumber, 
                    order.getAdditionalDetails() != null ? objectMapper.writeValueAsString(orderDetailsDTO.getAdditionalDetails()) : "null",
                    order.getCompositeItems() != null ? objectMapper.writeValueAsString(orderDetailsDTO.getCompositeItems()) : "null");
            
            // Create a request to push to Kafka topic
            OrderDetailsRequest kafkaRequest = OrderDetailsRequest.builder()
                    .requestInfo(request.getRequestInfo())
                    .orderDetailsDTO(orderDetailsDTO)
                    .build();
            
            producer.push(config.getOrderUpdateUniqueIdTopic(), kafkaRequest);

            log.info("Order details after update for order number: {}, additionalDetails: {}, compositeItems: {}", orderNumber, orderDetailsDTO.getAdditionalDetails(), orderDetailsDTO.getCompositeItems());
            
            return orderDetailsDTO;
            
        } catch (CustomException e) {
            log.error("Custom exception while processing order details", e);
            throw e;
        } catch (Exception e) {
            log.error("Error processing order details", e);
            throw new CustomException("ORDER_DETAILS_PROCESSING_ERROR", 
                    "Error processing order details: " + e.getMessage());
        }
    }

}
