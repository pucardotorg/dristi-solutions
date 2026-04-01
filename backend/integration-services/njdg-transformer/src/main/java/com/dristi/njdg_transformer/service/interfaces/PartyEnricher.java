package com.dristi.njdg_transformer.service.interfaces;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.cases.CourtCase;

/**
 * Interface for enriching party details in NJDG records
 * Follows Dependency Inversion Principle
 */
public interface PartyEnricher {
    
    /**
     * Enrich primary party details
     * @param courtCase source court case
     * @param record target NJDG record
     * @param partyType type of party (COMPLAINANT_PRIMARY/RESPONDENT_PRIMARY)
     */
    void enrichPrimaryPartyDetails(CourtCase courtCase, NJDGTransformRecord record, String partyType);
    
    /**
     * Enrich advocate details for a party
     * @param courtCase source court case
     * @param record target NJDG record
     * @param partyType type of party
     */
    void enrichAdvocateDetails(CourtCase courtCase, NJDGTransformRecord record, String partyType);
}
