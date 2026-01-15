package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.cases.CaseCriteria;
import com.dristi.njdg_transformer.model.cases.CaseSearchRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.OrderRepository;
import com.dristi.njdg_transformer.utils.CaseUtil;
import com.dristi.njdg_transformer.utils.FileStoreUtil;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final FileStoreUtil fileStoreUtil;
    private final Producer producer;
    private final TransformerProperties properties;
    private final ObjectMapper objectMapper;
    private final CaseRepository caseRepository;
    private final MdmsUtil mdmsUtil;
    private final JsonUtil jsonUtil;

    public InterimOrder processAndUpdateOrder(Order order, RequestInfo requestInfo) {
        String cino = order.getCnrNumber();
        String orderNumber = order.getOrderNumber();
        List<InterimOrder> interimOrders = orderRepository.getInterimOrderByCino(cino);

        if(orderNumber != null) {
            for(InterimOrder interimOrder : interimOrders) {
                if(interimOrder.getCourtOrderNumber() != null && interimOrder.getCourtOrderNumber().equalsIgnoreCase(orderNumber)){
                    log.info("Order {} already exists for CINO {}", orderNumber, cino);
                    return interimOrder;
                }
            }
        }
        // Determine next order number (handle empty list safely)
        int maxOrderNo = interimOrders.stream()
                .mapToInt(InterimOrder::getOrderNo)
                .max()
                .orElse(0);

        int nextOrderNo = maxOrderNo + 1;

        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);
        LocalDate searchDate = formatDate(order.getCreatedDate());
        List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
        JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
        InterimOrder newOrder = InterimOrder.builder()
                .cino(cino)
                .orderNo(nextOrderNo)
                .orderDate(formatDate(order.getCreatedDate()))
                .orderDetails(getOrderPdfByte(order, requestInfo))
                .courtOrderNumber(orderNumber)
                .orderType(properties.getJudgementOrderType()) //Judgement:1, Decree:2, Interim Order:3
                .docType(properties.getJudgementOrderDocumentType())//hard-coded for judgement
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : null)
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode() : null)
                .desigCode(designationMaster.getDesgCode())
                .dispReason(determineDisposalReason(order))
                .build();

        producer.push("save-order-details", newOrder);
        return newOrder;
    }

    /**
     * Determines disposal reason based on outcome value
     * Uses single unified method for all disposal status retrieval
     * @param order The order to determine disposal reason for
     * @return Integer representing disposal status
     */
    private Integer determineDisposalReason(Order order) {
        String outcome = order.getOutcome();
        log.info("Determining disposal reason for order | orderNumber: {} | outcome: {}", 
                order.getOrderNumber(), outcome);
        
        try {
            String outcomeCode = null;
            
            // If outcome is provided and not 'judgement', use it directly
            if (outcome != null && !JUDGEMENT.equalsIgnoreCase(outcome)) {
                outcomeCode = outcome;
                log.info("Using direct outcome value: {}", outcome);
            } else {
                // Extract outcome code from order structure for judgement or null outcomes
                outcomeCode = extractOutcomeCodeFromOrder(order);
                log.info("Extracted outcome code from order structure: {}", outcomeCode);
            }
            
            // Use single method to get disposal status
            return getDisposalStatus(outcomeCode, order.getOrderNumber());
            
        } catch (Exception e) {
            log.error("Error determining disposal reason | orderNumber: {} | outcome: {} | error: {}", 
                     order.getOrderNumber(), outcome, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Single unified method to get disposal status from outcome code
     * @param outcomeCode The outcome code to query
     * @param orderNumber The order number for logging context
     * @return Integer representing disposal status, 0 if not found
     */
    private Integer getDisposalStatus(String outcomeCode, String orderNumber) {
        if (outcomeCode == null || outcomeCode.trim().isEmpty()) {
            log.warn("Outcome code is null or empty for order: {}, returning default disposal status: 0", orderNumber);
            return 0;
        }
        
        try {
            Integer disposalStatus = caseRepository.getDisposalStatus(outcomeCode);
            if (disposalStatus != null) {
                log.info("Found disposal status: {} for outcome code: {} | order: {}", 
                        disposalStatus, outcomeCode, orderNumber);
                return disposalStatus;
            } else {
                log.warn("No disposal status found for outcome code: {} | order: {}, returning default: 0", 
                        outcomeCode, orderNumber);
                return 0;
            }
        } catch (Exception e) {
            log.error("Error querying disposal status for outcome code: {} | order: {} | error: {}", 
                     outcomeCode, orderNumber, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Extracts outcome code from order structure based on order category
     * @param order The order to extract outcome code from
     * @return String outcome code or null if not found
     */
    private String extractOutcomeCodeFromOrder(Order order) {
        log.info("Extracting outcome code from order structure | orderCategory: {}", order.getOrderCategory());
        
        try {
            if (INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
                JsonNode additionalDetails = objectMapper.convertValue(order.getAdditionalDetails(), JsonNode.class);
                return extractOutcomeCodeFromFormData(additionalDetails);
            } else if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
                return extractOutcomeCodeFromCompositeOrder(order);
            }
            
            log.warn("Unknown order category: {}, cannot extract outcome code", order.getOrderCategory());
            return null;
            
        } catch (Exception e) {
            log.error("Error extracting outcome code from order structure | orderCategory: {} | error: {}", 
                     order.getOrderCategory(), e.getMessage(), e);
            return null;
        }
    }

    /**
     * Extracts outcome code from composite order
     * @param order The composite order
     * @return String outcome code or null if not found
     */
    private String extractOutcomeCodeFromCompositeOrder(Order order) {
        JsonNode compositeItems = objectMapper.convertValue(order.getCompositeItems(), JsonNode.class);
        
        if (compositeItems == null || !compositeItems.isArray()) {
            log.warn("Composite items is null or not an array");
            return null;
        }
        
        for (JsonNode compositeItem : compositeItems) {
            if (isJudgementOrderType(compositeItem)) {
                String outcomeCode = extractOutcomeCodeFromCompositeItem(compositeItem);
                if (outcomeCode != null) {
                    log.info("Found outcome code: {} in composite item", outcomeCode);
                    return outcomeCode;
                }
            }
        }
        
        log.warn("No judgement order type found in composite order");
        return null;
    }

    /**
     * Checks if the composite item is of judgement order type
     * @param compositeItem The composite item to check
     * @return true if it's a judgement order type, false otherwise
     */
    private boolean isJudgementOrderType(JsonNode compositeItem) {
        if (compositeItem == null) {
            return false;
        }
        
        JsonNode orderTypeNode = compositeItem.get("orderType");
        if (orderTypeNode == null) {
            return false;
        }
        
        return JUDGEMENT.equalsIgnoreCase(orderTypeNode.asText());
    }

    /**
     * Extracts outcome code from form data in additional details
     * @param additionalDetails The additional details JsonNode
     * @return String outcome code or null if not found
     */
    private String extractOutcomeCodeFromFormData(JsonNode additionalDetails) {
        if (additionalDetails == null) {
            log.info("Additional details is null");
            return null;
        }
        
        JsonNode formDataNode = additionalDetails.get("formdata");
        if (formDataNode == null) {
            log.info("Form data node is null");
            return null;
        }
        
        JsonNode findings = formDataNode.get("findings");
        if (findings == null) {
            log.info("Findings node is null");
            return null;
        }
        
        JsonNode outcome = findings.get("code");
        if (outcome == null) {
            log.info("Outcome code node is null");
            return null;
        }
        
        return outcome.asText();
    }

    /**
     * Extracts outcome code from composite item
     * @param compositeItem The composite item JsonNode
     * @return String outcome code or null if not found
     */
    private String extractOutcomeCodeFromCompositeItem(JsonNode compositeItem) {
        if (compositeItem == null) {
            return null;
        }
        
        JsonNode orderSchema = compositeItem.get("orderSchema");
        if (orderSchema == null) {
            log.info("Order schema is null in composite item");
            return null;
        }
        
        JsonNode additionalDetails = orderSchema.get("additionalDetails");
        return extractOutcomeCodeFromFormData(additionalDetails);
    }


    private byte[] getOrderPdfByte(Order order, RequestInfo requestInfo) {
        String fileStoreId = null;
        for(Document document : order.getDocuments()) {
            if(SIGNED_ORDER.equalsIgnoreCase(document.getDocumentType())) {
                fileStoreId = document.getFileStore();
                break;
            }
        }
        if(fileStoreId == null) {
            log.error("No signed order document found for order: {}", order.getOrderNumber());
            return new byte[0];
        }
        try {
            Resource resource = fileStoreUtil.getFileStore(requestInfo, order.getTenantId(), fileStoreId);
            return resource.getContentAsByteArray();
        } catch (Exception e) {
            log.error("Error while fetching order PDF for order: {}", order.getOrderNumber(), e);
            return new byte[0];
        }
    }

    private LocalDate formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String filingNumber) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    public void processAdmitDismissOrder(Order order, RequestInfo requestInfo) {
        Object orderDetails = order.getOrderDetails();
        if(orderDetails == null) {
            log.error("Order details is null for admit/dismiss order: {}", order.getOrderNumber());
            return;
        }
        
        try {
            String orderStatus = JsonPath.read(orderDetails, "$.isCaseAdmittedOrDismissed");
            log.info("Processing admit/dismiss order | orderNumber: {} | caseStatus: {}", 
                     order.getOrderNumber(), orderStatus);
            
            if(DISMISSED.equalsIgnoreCase(orderStatus)) {
                order.setOrderType(DISMISS_CASE);
                String outcome = getOutcomeValue(order.getOrderType(), order.getTenantId(), requestInfo);
                if(outcome != null) {
                    order.setOutcome(outcome);
                    log.info("Set outcome for dismiss case order | orderNumber: {} | outcome: {}", 
                             order.getOrderNumber(), outcome);
                }
            }
            
            processAndUpdateOrder(order, requestInfo);
            
        } catch (Exception e) {
            log.error("Error processing admit/dismiss order | orderNumber: {} | error: {}", 
                     order.getOrderNumber(), e.getMessage(), e);
        }
    }

    /**
     * Main order processing method that handles all order processing logic
     * Moved from NJDGController to follow proper layered architecture
     */
    public ResponseEntity<InterimOrder> processOrderRequest(Order order, RequestInfo requestInfo) {
        String orderId = order.getOrderNumber();
        String status = order.getStatus();
        
        try {
            log.info("Processing order | orderId: {} | status: {}", orderId, status);
            
            if (!PUBLISHED_ORDER.equals(status)) {
                log.info("Skipping order processing | orderId: {} | status: {} | expectedStatus: {}",
                        orderId, status, PUBLISHED_ORDER);
                return ResponseEntity.ok(new InterimOrder());
            }
            
            if (shouldProcessOrder(order, requestInfo)) {
                InterimOrder updatedOrder = processAndUpdateOrder(order, requestInfo);
                log.info("Order processed successfully | orderId: {} | status: {}", orderId, status);
                return ResponseEntity.ok(updatedOrder);
            } else if(order.getOrderType() != null && ADMIT_DISMISS_CASE.equalsIgnoreCase(order.getOrderType())) {
                processAdmitDismissOrder(order, requestInfo);
                log.info("Order processed successfully | orderId: {} | status: {}", orderId, status);
                return ResponseEntity.ok(new InterimOrder());
            } else if(order.getOrderType() != null && WITHDRAW_CASE.equalsIgnoreCase(order.getOrderType())) {
                processWithdrawOrder(order, requestInfo);
                log.info("Order processed successfully | orderId: {} | status: {}", orderId, status);
                return ResponseEntity.ok(new InterimOrder());
            } else {
                log.info("Order does not meet processing criteria | orderId: {} | orderType: {}",
                        orderId, order.getOrderType());
                return ResponseEntity.ok(new InterimOrder());
            }
        } catch (Exception e) {
            log.error("Error processing order | orderId: {} | status: {} | error: {}", orderId, status, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new InterimOrder());
        }
    }

    private void processWithdrawOrder(Order order, RequestInfo requestInfo) {
        Object orderDetails = order.getOrderDetails();
        if(orderDetails == null) {
            log.error("Order details is null for withdraw order: {}", order.getOrderNumber());
            return;
        }
        
        try {
            String applicationStatus = JsonPath.read(orderDetails, "$.applicationStatus");
            log.info("Processing withdraw order | orderNumber: {} | applicationStatus: {}", 
                     order.getOrderNumber(), applicationStatus);
            
            if(APPROVED.equalsIgnoreCase(applicationStatus)) {
                order.setOrderType(WITHDRAWAL_ACCEPT);
                String outcome = getOutcomeValue(order.getOrderType(), order.getTenantId(), requestInfo);
                if(outcome != null) {
                    order.setOutcome(outcome);
                    log.info("Set outcome for withdrawal accept order | orderNumber: {} | outcome: {}", 
                             order.getOrderNumber(), outcome);
                }
            }
            
            processAndUpdateOrder(order, requestInfo);
            
        } catch (Exception e) {
            log.error("Error processing withdraw order | orderNumber: {} | error: {}", 
                     order.getOrderNumber(), e.getMessage(), e);
        }
    }

    /**
     * Determines if an order should be processed based on MDMS outcome validation
     * @param order The order to validate
     * @param requestInfo The request info for MDMS calls
     * @return true if order should be processed, false otherwise
     */
    private boolean shouldProcessOrder(Order order, RequestInfo requestInfo) {
        if(INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
            String outcome = getOutcomeValue(order.getOrderType(), order.getTenantId(), requestInfo);
            if(outcome != null) {
                order.setOutcome(outcome);
                log.info("Set outcome for intermediate order | orderNumber: {} | orderType: {} | outcome: {}", 
                         order.getOrderNumber(), order.getOrderType(), outcome);
                return true;
            }
        } else if(COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
            JsonNode compositeItems = objectMapper.convertValue(order.getCompositeItems(), JsonNode.class);
            for(JsonNode compositeItem : compositeItems){
                String outcome = getOutcomeValue(compositeItem.get("orderType").asText(), order.getTenantId(), requestInfo);
                if(outcome != null) {
                    order.setOutcome(outcome);
                    log.info("Set outcome for composite order | orderNumber: {} | orderType: {} | outcome: {}", 
                             order.getOrderNumber(), compositeItem.get("orderType").asText(), outcome);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Fetches outcome value from MDMS for given order type
     * @param orderType The order type to look up
     * @param tenantId The tenant ID
     * @param requestInfo The request info for MDMS calls
     * @return String outcome value or null if not found
     */
    private String getOutcomeValue(String orderType, String tenantId, RequestInfo requestInfo) {
        try {
            Map<String, Map<String, JSONArray>> caseOutcomes = mdmsUtil.fetchMdmsData(requestInfo, tenantId, "case", List.of("OutcomeType"));
            JSONArray outcomeData = caseOutcomes.get("case").get("OutcomeType");
            
            for (Object outcomeObject : outcomeData) {
                String outcomeOrderType = jsonUtil.getNestedValue(outcomeObject, List.of("orderType"), String.class);
                if(orderType.equalsIgnoreCase(outcomeOrderType)){
                    String outcomeValue = jsonUtil.getNestedValue(outcomeObject, List.of("outcome"), String.class);
                    log.info("Found outcome for orderType | orderType: {} | outcome: {}", orderType, outcomeValue);
                    return outcomeValue;
                }
            }
            
            log.info("No outcome found for orderType | orderType: {}", orderType);
            return null;
        } catch (Exception e) {
            log.error("Error fetching outcome value for orderType | orderType: {} | error: {}", orderType, e.getMessage(), e);
            return null;
        }
    }
}
