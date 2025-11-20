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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        try {
            Order order = orderRequest.getOrder();
            String orderId = order.getOrderNumber();
            String status = order.getStatus();

            if (!PUBLISHED_ORDER.equals(status)) {
                log.debug("Skipping order processing due to status | orderId: {} | status: {} | expectedStatus: {}",
                        orderId, status, PUBLISHED_ORDER);
                return ResponseEntity.ok(new InterimOrder());
            }
            boolean shouldProcess = false;
            if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
                List<Order> compositeItems = getItemListFormCompositeItem(order);
                shouldProcess = compositeItems.stream()
                        .map(Order::getOrderType)
                        .anyMatch(orderTypes::contains);

            }
            else if (INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
                shouldProcess = orderTypes.contains(order.getOrderType());
            }
            if (shouldProcess) {
                log.info("Processing order | orderId: {} | category: {} | type: {}",
                        orderId, order.getOrderCategory(), order.getOrderType());
                InterimOrder updatedOrder = orderService.processAndUpdateOrder(order, orderRequest.getRequestInfo());
                log.info("Successfully processed order | orderId: {} | status: {}", orderId, status);
                return ResponseEntity.ok(updatedOrder);
            } else {
                log.info("Order skipped | orderId: {} | reason: OrderType not eligible", orderId);
                return ResponseEntity.ok(new InterimOrder());
            }
        } catch (Exception e) {
            log.error("Error processing order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new InterimOrder());
        }
    }

    @PostMapping("_processhearing")
    public ResponseEntity<HearingDetails> processAndUpdateHearing(@Valid @RequestBody HearingRequest request) {
        try {
            HearingDetails hearingDetail = hearingService.processAndUpdateHearings(request.getHearing(), request.getRequestInfo());
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
