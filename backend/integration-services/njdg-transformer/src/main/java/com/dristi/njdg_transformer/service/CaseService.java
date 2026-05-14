package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.CaseConversionDetails;
import com.dristi.njdg_transformer.model.cases.CaseConversionRequest;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.service.interfaces.CaseTransformer;
import com.dristi.njdg_transformer.service.interfaces.DataProcessor;
import com.dristi.njdg_transformer.service.interfaces.PartyEnricher;
import com.dristi.njdg_transformer.utils.NumberExtractor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

/**
 * Refactored service class for handling case-related operations
 * Follows SOLID principles with dependency injection of specialized services
 */
@Service
@Slf4j
public class CaseService {

    private final CaseRepository caseRepository;
    private final HearingRepository hearingRepository;
    private final Producer producer;
    private final CaseTransformer caseTransformer;
    private final PartyEnricher partyEnricher;
    private final DataProcessor extraPartiesProcessor;
    private final DataProcessor actsProcessor;
    private final NumberExtractor numberExtractor;

    public CaseService(CaseRepository caseRepository,
                       HearingRepository hearingRepository,
                       Producer producer,
                       CaseTransformer caseTransformer,
                       @Qualifier("caseEnrichment") PartyEnricher partyEnricher,
                       @Qualifier("extraPartiesProcessorImpl") DataProcessor extraPartiesProcessor,
                       @Qualifier("actsProcessorImpl") DataProcessor actsProcessor, NumberExtractor numberExtractor) {
        this.caseRepository = caseRepository;
        this.hearingRepository = hearingRepository;
        this.producer = producer;
        this.caseTransformer = caseTransformer;
        this.partyEnricher = partyEnricher;
        this.extraPartiesProcessor = extraPartiesProcessor;
        this.actsProcessor = actsProcessor;
        this.numberExtractor = numberExtractor;
    }

    /**
     * Main orchestrator method for processing and updating case
     * Follows Single Responsibility Principle by delegating to specialized services
     */
    public NJDGTransformRecord processAndUpdateCase(CourtCase courtCase, RequestInfo requestInfo) {
        log.info("Starting case processing for CNR: {}", courtCase.getCnrNumber());
        
        try {
            NJDGTransformRecord record = caseTransformer.transform(courtCase, requestInfo);
            log.info("Successfully transformed case CNR: {} to NJDG format", courtCase.getCnrNumber());
            
            enrichPrimaryPartyDetails(courtCase, record);

            producer.push("save-case-details", record);

            // Process additional data
            processAdditionalData(courtCase);
            log.info("Successfully processed and saved case CNR: {}", courtCase.getCnrNumber());
            
            return record;
            
        } catch (CustomException exception) {
            log.error("Custom exception processing case CNR: {}: {}", 
                     courtCase.getCnrNumber(), exception.getMessage(), exception);
            throw exception;
        } catch (Exception exception) {
            log.error("Unexpected error processing case CNR: {}: {}", 
                     courtCase.getCnrNumber(), exception.getMessage(), exception);
            throw new CustomException("CASE_PROCESSING_ERROR", 
                                    "Error processing case: " + exception.getMessage());
        }
    }

    /**
     * Enrich party details using the PartyEnricher service
     */
    private void enrichPrimaryPartyDetails(CourtCase courtCase, NJDGTransformRecord record) {
        log.info("Enriching party details for case CNR: {}", courtCase.getCnrNumber());
        
        try {
            partyEnricher.enrichPrimaryPartyDetails(courtCase, record, COMPLAINANT_PRIMARY);
            partyEnricher.enrichPrimaryPartyDetails(courtCase, record, RESPONDENT_PRIMARY);
            partyEnricher.enrichAdvocateDetails(courtCase, record, COMPLAINANT_PRIMARY);
            partyEnricher.enrichAdvocateDetails(courtCase, record, RESPONDENT_PRIMARY);
            
            log.info("Successfully enriched party details for case CNR: {}", courtCase.getCnrNumber());
            
        } catch (Exception e) {
            log.error("Error enriching party details for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to enrich party details", e);
        }
    }

    /**
     * Process additional data using specialized processors
     */
    private void processAdditionalData(CourtCase courtCase) {
        log.info("Processing additional data for case CNR: {}", courtCase.getCnrNumber());
        
        try {
            extraPartiesProcessor.processExtraParties(courtCase);
            
            actsProcessor.processActs(courtCase);
            
            log.info("Successfully processed additional data for case CNR: {}", courtCase.getCnrNumber());
            
        } catch (Exception e) {
            log.error("Error processing additional data for case CNR: {}: {}", 
                     courtCase.getCnrNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to process additional data", e);
        }
    }

    /**
     * Retrieve complete NJDG transform record with all related data
     * This method remains in CaseService as it's a query operation
     */
    public NJDGTransformRecord getNjdgTransformRecord(String cino) {
        log.info("Retrieving NJDG transform record for CINO: {}", cino);
        
        try {
            NJDGTransformRecord record = caseRepository.findByCino(cino);
            
            if (record == null) {
                log.warn("No NJDG record found for CINO: {}", cino);
                return null;
            }
            
            enrichRecordWithRelatedData(record, cino);
            
            log.info("Successfully retrieved NJDG transform record for CINO: {}", cino);
            return record;
            
        } catch (Exception e) {
            log.error("Error retrieving NJDG transform record for CINO: {}: {}", 
                     cino, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve NJDG transform record", e);
        }
    }
    
    /**
     * Enrich NJDG record with related data
     */
    private void enrichRecordWithRelatedData(NJDGTransformRecord record, String cino) {
        log.info("Enriching NJDG record with related data for CINO: {}", cino);
        
        try {
            List<PartyDetails> complainantParty = caseRepository.getPartyDetails(cino, PartyType.PET);
            record.setPetExtraParty(complainantParty != null ? complainantParty : new ArrayList<>());
            log.info("Added {} complainant parties for CINO: {}", 
                     record.getPetExtraParty().size(), cino);
            
            List<PartyDetails> respondentParty = caseRepository.getPartyDetails(cino, PartyType.RES);
            record.setResExtraParty(respondentParty != null ? respondentParty : new ArrayList<>());
            log.info("Added {} respondent parties for CINO: {}", 
                     record.getResExtraParty().size(), cino);
            
            List<HearingDetails> hearingDetails = hearingRepository.getHearingDetailsByCino(cino);
            record.setHistoryOfCaseHearing(hearingDetails != null ? hearingDetails : new ArrayList<>());
            log.info("Added {} hearing records for CINO: {}", 
                     record.getHistoryOfCaseHearing().size(), cino);
            
            List<Act> actDetails = caseRepository.getActs(cino);
            record.setActs(actDetails != null ? actDetails : new ArrayList<>());
            log.info("Added {} acts for CINO: {}", record.getActs().size(), cino);
            
        } catch (Exception e) {
            log.error("Error enriching NJDG record with related data for CINO: {}: {}", 
                     cino, e.getMessage(), e);
            throw new RuntimeException("Failed to enrich NJDG record with related data", e);
        }
    }

    public void updateCaseConversionDetails(CaseConversionRequest caseConversionRequest) {
        log.info("Updating case conversion details for filing number: {}", caseConversionRequest.getCaseConversionDetails().getFilingNumber());
        if(CMP.equalsIgnoreCase(caseConversionRequest.getCaseConversionDetails().getConvertedFrom())
            && ST.equalsIgnoreCase(caseConversionRequest.getCaseConversionDetails().getConvertedTo())){
            NJDGTransformRecord record = caseRepository.findByCino(caseConversionRequest.getCaseConversionDetails().getCnrNumber());

            if (record == null) {
                log.error("No record found for CINO: {}", caseConversionRequest.getCaseConversionDetails().getCnrNumber());
                throw new CustomException("CASE_NOT_FOUND", "No record found for CINO: " + caseConversionRequest.getCaseConversionDetails().getCnrNumber());
            }
            CaseConversionDetails caseConversionDetails = caseConversionRequest.getCaseConversionDetails();
            CaseTypeDetails caseTypeDetails = CaseTypeDetails.builder()
                    .cino(record.getCino())
                    .jocode(record.getJocode())
                    .oldRegCaseType(caseRepository.getCaseTypeCode(caseConversionDetails.getConvertedFrom()))
                    .oldRegNo(numberExtractor.extractCaseNumber(caseConversionDetails.getPreCaseNumber()))
                    .oldRegYear(extractRegYear(caseConversionDetails.getPreCaseNumber()))
                    .newRegCaseType(caseRepository.getCaseTypeCode(caseConversionDetails.getConvertedTo()))
                    .newRegNo(numberExtractor.extractCaseNumber(caseConversionDetails.getPostCaseNumber()))
                    .newRegYear(extractRegYear(caseConversionDetails.getPostCaseNumber()))
                    .convertedAt(LocalDateTime.ofInstant(Instant.ofEpochMilli(caseConversionDetails.getDateOfConversion()), ZoneId.systemDefault()))
                    .build();

            producer.push("save-case-conversion-details", caseTypeDetails);
        }
    }

    private Integer extractRegYear(String caseNumber) {
        try {
            if (caseNumber == null || caseNumber.trim().isEmpty()) {
                log.warn("Case number is null or empty, returning default year 0");
                return 0;
            }

            String[] parts = caseNumber.trim().split("/");
            if (parts.length >= 3) {
                String yearPart = parts[parts.length - 1];
                Integer year = Integer.parseInt(yearPart);
                log.info("Extracted year {} from case number: {}", year, caseNumber);
                return year;
            } else {
                log.warn("Case number format invalid, expected format: type/number/year, got: {}", caseNumber);
                return 0;
            }

        } catch (NumberFormatException e) {
            log.error("Failed to parse year from case number: {} | error: {}", caseNumber, e.getMessage());
            return 0;
        } catch (Exception e) {
            log.error("Unexpected error extracting year from case number: {} | error: {}", caseNumber, e.getMessage());
            return 0;
        }
    }
}
