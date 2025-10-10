package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.enrichment.NJDGEnrichment;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.repository.NJDGRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.DATE_FORMATTER;

/**
 * Service class for handling case-related operations
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CaseService {

    private final NJDGRepository njdgRepository;
    private final NJDGEnrichment enrichment;
    private final TransformerProperties properties;
    private final OrderService orderService;
    private final HearingService hearingService;


    /**
     * Processes and upserts (inserts or updates) a CourtCase in the NJDG format in the database
     * 
     * @param courtCase The CourtCase data to be processed and upserted
     * @param requestInfo The request info containing metadata about the request
     * @return The upserted NJDGTransformRecord
     * @throws IllegalArgumentException if the input is invalid
     */
    public NJDGTransformRecord processAndUpsertCase(CourtCase courtCase, RequestInfo requestInfo) {
        // Validate input
        if (courtCase == null) {
            throw new IllegalArgumentException("CourtCase cannot be null");
        }
        if (requestInfo == null) {
            throw new IllegalArgumentException("RequestInfo cannot be null");
        }
        if (courtCase.getCnrNumber() == null || courtCase.getCnrNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("CNR number is required for upsert operation");
        }

        try {
            log.info("Processing CourtCase with CNR: {}", courtCase.getCnrNumber());
            
            NJDGTransformRecord record = convertToNJDGRecord(courtCase);

            enrichment.enrichPartyDetails(courtCase, record);
            enrichment.enrichAdvocateDetails(courtCase, record);
            enrichment.enrichExtraParties(courtCase, record);
            enrichment.enrichStatuteSection(requestInfo, courtCase, record);
            enrichment.enrichPoliceStationDetails(requestInfo, courtCase, record);
            log.debug("Upserting NJDGTransformRecord with CINO: {}", record.getCino());
            
            boolean recordExists = checkIfRecordExists(record.getCino());

            if (recordExists) {
                log.debug("Updating existing record with CINO: {}", record.getCino());
                njdgRepository.updateData(record);
            } else {
                log.debug("Inserting new record with CINO: {}", record.getCino());
                njdgRepository.insertData(record);
            }
            try{
                orderService.updateDataForOrder(Order.builder().cnrNumber(courtCase.getCnrNumber()).filingNumber(courtCase.getFilingNumber()).build(), requestInfo);
                hearingService.updateDataForHearing(Hearing.builder().cnrNumbers(List.of(courtCase.getCnrNumber())).filingNumber(List.of(courtCase.getFilingNumber())).build(), requestInfo);
            } catch (CustomException e){
                log.error("Error updating hearing and order data:: {}", e.getMessage());
            }
            return njdgRepository.findByCino(courtCase.getCnrNumber());
        } catch (Exception e) {
            log.error("Error processing CourtCase with CNR: {}. Error: {}",
                    courtCase.getCnrNumber(),
                    e.getMessage(), e);
            throw new RuntimeException("Failed to process and upsert case: " + e.getMessage(), e);
        }
    }
    
    /**
     * Checks if a record with the given CINO exists in the database
     * 
     * @param cino The Case Identification Number to check
     * @return true if record exists, false otherwise
     */
    private boolean checkIfRecordExists(String cino) {
        try {
            // Try to find the record by CINO
            NJDGTransformRecord existingRecord = njdgRepository.findByCino(cino);
            return existingRecord != null;
        } catch (Exception e) {
            log.warn("Error checking if record exists with CINO: {}. Error: {}", cino, e.getMessage());
            return false; // Assume record doesn't exist if there's an error checking
        }
    }

    /**
     * Converts a CourtCase to NJDGTransformRecord
     * 
     * @param courtCase The source CourtCase
     * @return The converted NJDGTransformRecord
     */
    /**
     * Extracts the numeric part from a case number string.
     * For example, extracts "1234" from "ST/1234/2025".
     * 
     * @param caseNumber The full case number string (e.g., "ST/1234/2025")
     * @return The extracted numeric part, or the original string if pattern doesn't match
     */
    private String extractCaseNumber(String caseNumber) {
        if (caseNumber == null || caseNumber.trim().isEmpty()) {
            return caseNumber;
        }
        
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(".*?/(\\d+)/.*");
        java.util.regex.Matcher matcher = pattern.matcher(caseNumber);
        
        if (matcher.matches() && matcher.groupCount() >= 1) {
            return matcher.group(1);
        }
        
        return caseNumber;
    }
    
    private NJDGTransformRecord convertToNJDGRecord(CourtCase courtCase) {
        return NJDGTransformRecord.builder()
                .cino(courtCase.getCnrNumber())
                .dateOfFiling(formatDate(courtCase.getFilingDate()))// Using CNR as CINO
                .dtRegis(formatDate(courtCase.getRegistrationDate()))
                .caseType(courtCase.getCaseType())
                .filNo(extractFilingNumber(courtCase.getFilingNumber()))
                .filYear(extractYear(courtCase.getFilingDate()))
                .regNo(extractCaseNumber(courtCase.getCourtCaseNumber()))
                .regYear(extractYear(courtCase.getRegistrationDate()))
                .pendDisp(courtCase.getStatus().equals("DISPOSED") ? "D" : "P")
                .dateOfDecision(formatDate(courtCase.getJudgementDate()))
                .desgname(properties.getJudgeDesignation())
                .estCode(courtCase.getCourtId())
                .build();
    }

    /**
     * Extracts the filing number from the full filing number string
     * 
     * @param filingNumber The full filing number string (e.g., "FIL-2023-1234")
     * @return The extracted filing number (e.g., "1234"), or the original string if pattern doesn't match
     */
    private String extractFilingNumber(String filingNumber) {
        if (filingNumber == null || filingNumber.isEmpty()) {
            return null;
        }
        String[] parts = filingNumber.split("-");
        if (parts.length < 2) {
            return filingNumber;
        }
        return parts[1].replaceFirst("^0+(?!$)", "");
    }


    /**
     * Extracts year from a timestamp
     */
    private String extractYear(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate()
                .format(DateTimeFormatter.ofPattern("yyyy"));
    }

    /**
     * Formats a timestamp to dd/MM/yyyy string
     */
    private String formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate()
                .format(DATE_FORMATTER);
    }

    /**
     * Finds a case by its CNR number
     * 
     * @param cnrNumber The CNR number to search for
     * @return The NJDGTransformRecord if found, null otherwise
     * @throws IllegalArgumentException if cnrNumber is null or empty
     */
    public NJDGTransformRecord findByCnrNumber(String cnrNumber) {
        log.debug("Searching for case with CNR: {}", cnrNumber);
        
        if (cnrNumber == null || cnrNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("CNR number cannot be null or empty");
        }
        
        try {
            return njdgRepository.findByCino(cnrNumber);
        } catch (Exception e) {
            log.error("Error while searching for case with CNR {}: {}", cnrNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch case with CNR: " + cnrNumber, e);
        }
    }
}
