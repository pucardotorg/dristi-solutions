package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.enrichment.NJDGEnrichment;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.repository.NJDGRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

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

            //todo: enrich njdg record with pet & res, mdms data for court, hearing, order
            enrichment.enrichPartyDetails(courtCase, record);
            enrichment.enrichAdvocateDetails(courtCase, record);
            enrichment.enrichExtraParties(courtCase, record);
            log.debug("Upserting NJDGTransformRecord with CINO: {}", record.getCino());
            
            boolean recordExists = checkIfRecordExists(record.getCino());

            if (recordExists) {
                log.debug("Updating existing record with CINO: {}", record.getCino());
                return njdgRepository.updateData(record);
            } else {
                log.debug("Inserting new record with CINO: {}", record.getCino());
                return njdgRepository.insertData(record);
            }
            
        } catch (Exception e) {
            log.error("Error processing CourtCase with CNR: {}. Error: {}", 
                    courtCase != null ? courtCase.getCnrNumber() : "null", 
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
        return parts.length > 2 ? parts[2] : filingNumber;
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
     * Extracts state code from tenantId (format: state.district)
     */
    private String extractStateCode(String tenantId) {
        if (tenantId == null || !tenantId.contains(".")) {
            return null;
        }
        return tenantId.split("\\.")[0];
    }

    /**
     * Extracts district code from tenantId (format: state.district)
     */
    private String extractDistCode(String tenantId) {
        if (tenantId == null || !tenantId.contains(".")) {
            return null;
        }
        return tenantId.split("\\.")[1];
    }

    /**
     * Extracts petitioner name from litigants
     */
    private String extractPetitionerName(CourtCase courtCase) {
        if (courtCase.getLitigants() == null || courtCase.getLitigants().isEmpty()) {
            return null;
        }
        return courtCase.getLitigants().get(0).getIndividualId();
    }

    /**
     * Extracts respondent name from litigants
     */
    private String extractRespondentName(CourtCase courtCase) {
        if (courtCase.getLitigants() == null || courtCase.getLitigants().size() < 2) {
            return null;
        }
        return courtCase.getLitigants().get(1).getIndividualId();
    }
}
