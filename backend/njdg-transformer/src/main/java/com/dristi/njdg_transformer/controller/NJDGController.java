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
import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.service.AdvocateService;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.dristi.njdg_transformer.config.ServiceConstants.ACTIVE;

@RestController
@RequestMapping("/njdg/v1")
@Slf4j
@RequiredArgsConstructor
public class NJDGController {

    private final CaseService caseService;
    private final OrderService orderService;
    private final HearingService hearingService;
    private final AdvocateService advocateService;

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
            NJDGTransformRecord njdgRecord = caseService.processAndUpdateCase(
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
            InterimOrder order = orderService.processAndUpdateOrder(orderRequest.getOrder(), orderRequest.getRequestInfo());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("Error processing order: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new InterimOrder());
        }
    }

    @PostMapping("_processhearing")
    public ResponseEntity<HearingDetails> processAndUpdateHearing(@Valid @RequestBody HearingRequest request) {
        try {
            HearingDetails hearingDetail = hearingService.processAndUpdateHearings(request.getHearing());
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
}
