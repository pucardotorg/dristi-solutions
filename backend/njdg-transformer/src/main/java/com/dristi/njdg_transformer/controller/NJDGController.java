package com.dristi.njdg_transformer.controller;

import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.cases.CaseRequest;
import com.dristi.njdg_transformer.model.cases.CaseResponse;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingRequest;
import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.service.CaseService;
import com.dristi.njdg_transformer.service.HearingService;
import com.dristi.njdg_transformer.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dristi.njdg_transformer.repository.OrderRepository;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/njdg/v1")
@Slf4j
@RequiredArgsConstructor
public class NJDGController {

    private final CaseService caseService;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final HearingService hearingService;
    private final HearingRepository hearingRepository;

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
            NJDGTransformRecord njdgRecord = caseService.processAndUpsertCase(
                    request.getCourtCase()
            );
            
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
                    HttpStatus.INTERNAL_SERVER_ERROR
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
    public ResponseEntity<List<InterimOrder>> processAndUpdateOrder(@Valid @RequestBody OrderRequest orderRequest) {
        try {
            orderService.processAndUpdateOrder(orderRequest.getOrder(), orderRequest.getRequestInfo());
            List<InterimOrder> orders = orderRepository.getInterimOrderByCino(orderRequest.getOrder().getCnrNumber());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("Error processing order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @PostMapping("_processhearing")
    public ResponseEntity<List<HearingDetails>> processAndUpdateHearing(@Valid @RequestBody HearingRequest request) {
        try {
            hearingService.processAndUpdateHearings(request.getHearing());
            List<HearingDetails> hearings = hearingRepository.getHearingDetailsByCino(request.getHearing().getCnrNumbers().get(0));
            return ResponseEntity.ok(hearings);
        } catch (Exception e) {
            log.error("Error processing hearing: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }
}
