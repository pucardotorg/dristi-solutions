package com.dristi.njdg_transformer.controller;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.advocate.Advocate;
import com.dristi.njdg_transformer.model.advocate.AdvocateRequest;
import com.dristi.njdg_transformer.model.cases.CaseRequest;
import com.dristi.njdg_transformer.model.cases.CaseResponse;
import com.dristi.njdg_transformer.model.hearing.HearingRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.service.AdvocateService;
import com.dristi.njdg_transformer.service.CaseService;
import com.dristi.njdg_transformer.service.HearingService;
import com.dristi.njdg_transformer.service.OrderService;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dristi.njdg_transformer.repository.OrderRepository;

import java.util.*;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@RestController
@RequestMapping("/njdg/v1")
@Slf4j
@RequiredArgsConstructor
public class NJDGController {

    private final CaseService caseService;
    private final OrderService orderService;
    private final HearingService hearingService;
    private final AdvocateService advocateService;
    private final ObjectMapper objectMapper;
    private final MdmsUtil mdmsUtil;
    private final JsonUtil jsonUtil;

    /**
     * Process and upsert a court case into NJDG format
     *
     * @param request The case request containing court case details
     * @return ResponseEntity containing the processed case in NJDG format
     */
    @PostMapping("/_processcase")
    public ResponseEntity<CaseResponse> processAndUpsertCase(
            @Valid @RequestBody CaseRequest request) {
        
        log.info("Received request to process court case with CNR: {}", 
                request.getCourtCase() != null ? request.getCourtCase().getCnrNumber() : "null");
        
        try {
            // Process the case
            NJDGTransformRecord njdgRecord = caseService.processAndUpdateCase(request.getCourtCase(), request.getRequestInfo());
            
            // Build success response
            CaseResponse response = CaseResponse.builder()
                    .cases(Collections.singletonList(njdgRecord))
                    .responseInfo(CaseResponse.ResponseInfo.builder()
                            .status("SUCCESS")
                            .message("Case processed successfully")
                            .build())
                    .build();
            
            return new ResponseEntity<>(response, HttpStatus.OK);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            return new ResponseEntity<>(
                    buildErrorResponse("INVALID_REQUEST", e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            log.error("Error processing case: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    buildErrorResponse("PROCESSING_ERROR", "Failed to process case: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    
    /**
     * Builds an error response with the given status and message
     */
    private CaseResponse buildErrorResponse(String status, String message) {
        return CaseResponse.builder()
                .responseInfo(CaseResponse.ResponseInfo.builder()
                        .status(status)
                        .message(message)
                        .build())
                .build();
    }

    @PostMapping("_processorder")
    public ResponseEntity<InterimOrder> processAndUpdateOrder(@Valid @RequestBody OrderRequest orderRequest) {
        String orderId = null;
        String status = null;
        try {
            Order order = orderRequest.getOrder();
            orderId = order.getOrderNumber();
            status = order.getStatus();
            log.info("Processing order | orderId: {} | status: {}", orderId, status);
            if (!PUBLISHED_ORDER.equals(status)) {
                log.info("Skipping order processing | orderId: {} | status: {} | expectedStatus: {}",
                        orderId, status, PUBLISHED_ORDER);
                return ResponseEntity.ok(new InterimOrder());
            }
            if (shouldProcessOrder(order, orderRequest.getRequestInfo())) {
                InterimOrder updatedOrder = orderService.processAndUpdateOrder(order, orderRequest.getRequestInfo());
                log.info("Order processed successfully | orderId: {} | status: {}", orderId, status);
                
                return ResponseEntity.ok(updatedOrder);
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

    @PostMapping("_processhearing")
    public ResponseEntity<HearingDetails> processAndUpdateHearing(@Valid @RequestBody HearingRequest request) {
        try {
            HearingDetails hearingDetail = new HearingDetails();
            if(request.getHearing().getStatus().equalsIgnoreCase(COMPLETED)){
                hearingDetail = hearingService.processAndUpdateHearings(request.getHearing(), request.getRequestInfo());
            }
            return ResponseEntity.ok(hearingDetail);
        } catch (Exception e) {
            log.error("Error processing hearing: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new HearingDetails());
        }
    }

    @PostMapping("_search")
    public ResponseEntity<NJDGTransformRecord> getNjdgTransformRecord(@Valid @RequestParam String cino) {
        try {
            NJDGTransformRecord record = caseService.getNjdgTransformRecord(cino);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            log.error("No record found for cino:: {}", cino);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NJDGTransformRecord());
        }
    }

    @PostMapping("_processadvocate")
    public ResponseEntity<?> processAndUpdateAdvocates(@Valid @RequestBody AdvocateRequest advocateRequest) {
        try {
            Advocate advocate = advocateRequest.getAdvocate();
            if (advocate == null || !ACTIVE.equalsIgnoreCase(advocate.getStatus())) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Advocate is not active and will not be processed");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            AdvocateDetails advocateDetails = advocateService.processAndUpdateAdvocates(advocateRequest);
            if (advocateDetails == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Advocate is already present");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            return ResponseEntity.ok(advocateDetails);
        } catch (Exception e) {
            log.error("Error processing advocate: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AdvocateDetails());
        }
    }

    public List<Order> getItemListFormCompositeItem(Order order) {
        log.info("method=getItemListFormCompositeItem , result= IN_PROGRESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());


        Object compositeItems = order.getCompositeItems();
        ObjectNode orderNode = null;
        try {
            String jsonString = objectMapper.writeValueAsString(order);
            JsonNode jsonNode = objectMapper.readTree(jsonString);
            if (jsonNode.isObject()) {
                orderNode = (ObjectNode) jsonNode;
            }
        } catch (JsonProcessingException e) {
            log.error("Error while converting order to json", e);
            throw new CustomException("COMPOSITE_ORDER_CONVERSION_ERROR", "Error while converting order to json");
        }

        List<Order> compositeItemsList = new ArrayList<>();

        try {
            log.info("enriching order type ,order details and additional details");
            JsonNode compositeItemArray = objectMapper.readTree(objectMapper.writeValueAsString(compositeItems));
            for (JsonNode item : compositeItemArray) {
                String orderType = item.get("orderType").asText();
                JsonNode additionalDetails = item.get("orderSchema").get("additionalDetails");
                ObjectNode additionalDetailsNode = (ObjectNode) additionalDetails;
                additionalDetailsNode.put("itemId", item.get("id").asText());

                JsonNode orderDetails = item.get("orderSchema").get("orderDetails");

                assert orderNode != null;
                orderNode.put("orderType", orderType);
                orderNode.set("additionalDetails", additionalDetailsNode);
                orderNode.set("orderDetails", orderDetails);

                Order orderItem = objectMapper.convertValue(orderNode, Order.class);
                compositeItemsList.add(orderItem);
            }
            log.info("successfully enriched order type ,order details and additional details completed");


        } catch (Exception e) {
            log.error("Error while enriching order type ,order details and additional details", e);
            throw new CustomException("COMPOSITE_ORDER_ENRICHMENT_ERROR", "Error while enriching order type ,order details and additional details");
        }
        return compositeItemsList;
    }
}
