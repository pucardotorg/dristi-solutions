package com.dristi.njdg_transformer.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class for extracting numbers from strings
 * Follows Single Responsibility Principle
 */
@Component
@Slf4j
public class NumberExtractor {

    private static final Pattern CASE_NUMBER_PATTERN = Pattern.compile(".*/(\\d+)/.*");

    /**
     * Extract filing number from filing number string
     * @param filingNumber the filing number string
     * @return extracted number or null if invalid
     */
    public Integer extractFilingNumber(String filingNumber) {
        if (filingNumber == null || filingNumber.isEmpty()) {
            log.debug("Filing number is null or empty");
            return null;
        }
        
        try {
            String[] parts = filingNumber.split("-");
            if (parts.length < 2) {
                log.warn("Invalid filing number format: {}", filingNumber);
                return null;
            }
            
            String numberPart = parts[1].replaceFirst("^0+(?!$)", "");
            Integer extractedNumber = Integer.valueOf(numberPart);
            log.debug("Extracted filing number {} from: {}", extractedNumber, filingNumber);
            return extractedNumber;
            
        } catch (NumberFormatException e) {
            log.error("Error extracting filing number from: {}: {}", filingNumber, e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Unexpected error extracting filing number from: {}: {}", 
                     filingNumber, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Extract case number from case number string
     * @param caseNumber the case number string
     * @return extracted number or null if invalid
     */
    public Integer extractCaseNumber(String caseNumber) {
        if (caseNumber == null || caseNumber.trim().isEmpty()) {
            log.debug("Case number is null or empty");
            return null;
        }
        
        try {
            Matcher matcher = CASE_NUMBER_PATTERN.matcher(caseNumber);
            if (matcher.matches()) {
                String numberPart = matcher.group(1).replaceFirst("^0+(?!$)", "");
                Integer extractedNumber = Integer.valueOf(numberPart);
                log.debug("Extracted case number {} from: {}", extractedNumber, caseNumber);
                return extractedNumber;
            } else {
                log.warn("Case number does not match expected pattern: {}", caseNumber);
                return null;
            }
            
        } catch (NumberFormatException e) {
            log.error("Error parsing case number from: {}: {}", caseNumber, e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("Unexpected error extracting case number from: {}: {}", 
                     caseNumber, e.getMessage(), e);
            return null;
        }
    }
}
