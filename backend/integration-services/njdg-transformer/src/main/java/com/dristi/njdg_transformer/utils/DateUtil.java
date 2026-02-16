package com.dristi.njdg_transformer.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for date operations
 * Follows Single Responsibility Principle
 */
@Component
@Slf4j
public class DateUtil {

    /**
     * Format timestamp to LocalDate
     * @param timestamp the timestamp to format
     * @return formatted LocalDate or null if timestamp is null
     */
    public LocalDate formatDate(Long timestamp) {
        if (timestamp == null) {
            log.info("Timestamp is null, returning null date");
            return null;
        }
        
        try {
            LocalDate date = Instant.ofEpochMilli(timestamp)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            log.info("Formatted timestamp {} to date: {}", timestamp, date);
            return date;
            
        } catch (Exception e) {
            log.error("Error formatting timestamp {}: {}", timestamp, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Extract year from timestamp
     * @param timestamp the timestamp to extract year from
     * @return year as Integer or null if timestamp is null
     */
    public Integer extractYear(Long timestamp) {
        if (timestamp == null) {
            log.info("Timestamp is null, returning null year");
            return 0;
        }
        
        try {
            Integer year = Integer.valueOf(Instant.ofEpochMilli(timestamp)
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate()
                    .format(DateTimeFormatter.ofPattern("yyyy")));
            log.info("Extracted year {} from timestamp: {}", year, timestamp);
            return year;
            
        } catch (Exception e) {
            log.error("Error extracting year from timestamp {}: {}", timestamp, e.getMessage(), e);
            return 0;
        }
    }
}
