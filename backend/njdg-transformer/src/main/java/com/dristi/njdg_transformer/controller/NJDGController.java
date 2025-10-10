package com.dristi.njdg_transformer.controller;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.cases.CaseRequest;
import com.dristi.njdg_transformer.model.cases.CaseResponse;
import com.dristi.njdg_transformer.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/njdg/v1")
@Slf4j
@RequiredArgsConstructor
public class NJDGController {

    private final CaseService caseService;

    /**
     * Process and upsert a court case into NJDG format
     *
     * @param request The case request containing court case details
     * @return ResponseEntity containing the processed case in NJDG format
     */
    @PostMapping("/_process")
    public ResponseEntity<CaseResponse> processAndUpsertCase(
            @Valid @RequestBody CaseRequest request) {
        
        log.info("Received request to process court case with CNR: {}", 
                request.getCourtCase() != null ? request.getCourtCase().getCnrNumber() : "null");
        
        try {
            // Process the case
            NJDGTransformRecord njdgRecord = caseService.processAndUpsertCase(
                    request.getCourtCase(), 
                    request.getRequestInfo()
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
     * Fetches a case by its CNR number
     * 
     * @param cnrNumber The CNR number of the case to fetch
     * @return ResponseEntity containing the case data if found
     */
    @GetMapping("/_search")
    public ResponseEntity<CaseResponse> getCaseByCnrNumber(
            @RequestParam(value = "cnrNumber", required = true) String cnrNumber) {
        
        log.info("Received request to fetch case with CNR: {}", cnrNumber);
        
        try {
            // Find the case by CNR number
            NJDGTransformRecord njdgRecord = caseService.findByCnrNumber(cnrNumber);
            
            if (njdgRecord == null) {
                return new ResponseEntity<>(
                        buildErrorResponse("NOT_FOUND", "No case found with CNR: " + cnrNumber),
                        HttpStatus.NOT_FOUND
                );
            }
            
            // Build success response
            CaseResponse response = CaseResponse.builder()
                    .cases(Collections.singletonList(njdgRecord))
                    .responseInfo(CaseResponse.ResponseInfo.builder()
                            .status("SUCCESS")
                            .message("Case retrieved successfully")
                            .build())
                    .build();
            
            return new ResponseEntity<>(response, HttpStatus.OK);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid CNR number: {}", e.getMessage());
            return new ResponseEntity<>(
                    buildErrorResponse("INVALID_REQUEST", e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            log.error("Error fetching case with CNR {}: {}", cnrNumber, e.getMessage(), e);
            return new ResponseEntity<>(
                    buildErrorResponse("FETCH_ERROR", "Failed to fetch case: " + e.getMessage()),
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


}
