package com.dristi.njdg_transformer.service.interfaces;

import com.dristi.njdg_transformer.model.cases.CourtCase;

/**
 * Interface for processing additional case data
 * Follows Single Responsibility and Open/Closed Principles
 */
public interface DataProcessor {
    
    /**
     * Process and update extra parties for a case
     * @param courtCase the court case to process
     */
    void processExtraParties(CourtCase courtCase);
    
    /**
     * Process and update acts for a case
     * @param courtCase the court case to process
     */
    void processActs(CourtCase courtCase);
}
