package com.dristi.njdg_transformer.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Utility class for extracting numbers from strings
 * Follows Single Responsibility Principle
 */
@Component
@Slf4j
public class NumberExtractor {

    // Maximum input length to prevent ReDoS attacks
    private static final int MAX_INPUT_LENGTH = 500;

    /**
     * Extract filing number from filing number string
     * @param filingNumber the filing number string
     * @return extracted number or null if invalid
     */
    public Integer extractFilingNumber(String filingNumber) {
        if (filingNumber == null || filingNumber.isEmpty()) {
            log.info("Filing number is null or empty");
            return 0;
        }
        
        try {
            String[] parts = filingNumber.split("-");
            if (parts.length < 2) {
                log.warn("Invalid filing number format: {}", filingNumber);
                return 0;
            }
            
            String numberPart = parts[1].replaceFirst("^0+(?!$)", "");
            Integer extractedNumber = Integer.valueOf(numberPart);
            log.info("Extracted filing number {} from: {}", extractedNumber, filingNumber);
            return extractedNumber;
            
        } catch (NumberFormatException e) {
            log.error("Error extracting filing number from: {}: {}", filingNumber, e.getMessage());
            return 0;
        } catch (Exception e) {
            log.error("Unexpected error extracting filing number from: {}: {}", 
                     filingNumber, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Extract case number from case number string.
     * Uses string operations instead of regex to prevent ReDoS vulnerabilities.
     * 
     * @param caseNumber the case number string (expected format: prefix/NUMBER/suffix)
     * @return extracted number or 0 if invalid
     */
    public Integer extractCaseNumber(String caseNumber) {
        if (caseNumber == null || caseNumber.trim().isEmpty()) {
            log.info("Case number is null or empty");
            return 0;
        }
        
        String trimmed = caseNumber.trim();
        
        // Length check to prevent potential DoS with very long strings
        if (trimmed.length() > MAX_INPUT_LENGTH) {
            log.warn("Case number exceeds maximum length: {}", trimmed.length());
            return 0;
        }
        
        try {
            // Use string operations instead of regex to prevent ReDoS
            int firstSlash = trimmed.indexOf('/');
            if (firstSlash == -1) {
                log.warn("Case number does not contain slash: {}", caseNumber);
                return 0;
            }
            
            int secondSlash = trimmed.indexOf('/', firstSlash + 1);
            if (secondSlash == -1) {
                log.warn("Case number does not contain second slash: {}", caseNumber);
                return 0;
            }
            
            String numberPart = trimmed.substring(firstSlash + 1, secondSlash);
            
            // Validate that the extracted part contains only digits
            if (!numberPart.matches("\\d+")) {
                log.warn("Extracted part is not a valid number: {}", numberPart);
                return 0;
            }
            
            // Remove leading zeros
            String cleanedNumber = numberPart.replaceFirst("^0+(?!$)", "");
            Integer extractedNumber = Integer.valueOf(cleanedNumber);
            log.info("Extracted case number {} from: {}", extractedNumber, caseNumber);
            return extractedNumber;
            
        } catch (NumberFormatException e) {
            log.error("Error parsing case number from: {}: {}", caseNumber, e.getMessage());
            return 0;
        } catch (Exception e) {
            log.error("Unexpected error extracting case number from: {}: {}", 
                     caseNumber, e.getMessage(), e);
            return 0;
        }
    }
}
