package digit.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Component
public final class DateTimeUtil {

    private final ZoneId configuredZoneId;

    public DateTimeUtil(@Value("${app.zone.id}") ZoneId zoneId) {
        this.configuredZoneId = zoneId;
    }

    public ZoneId getConfiguredZoneId() {
        return configuredZoneId;
    }

    public long toEpochMillis(String date, String pattern) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
        try {
            LocalDateTime dateTime = LocalDateTime.parse(date, formatter);
            return dateTime.atZone(configuredZoneId).toInstant().toEpochMilli();
        } catch (DateTimeParseException localDateTimeEx) {
            try {
                LocalDate localDate = LocalDate.parse(date, formatter);
                return startOfDayEpochMillis(localDate);
            } catch (DateTimeParseException localDateEx) {
                // Create new exception with both error messages and suppress the original exceptions
                DateTimeParseException combinedEx = new DateTimeParseException(
                    "Failed to parse date '" + date + "' with pattern '" + pattern + "'. " +
                    "LocalDateTime parsing failed: " + localDateTimeEx.getMessage() + ". " +
                    "LocalDate parsing failed: " + localDateEx.getMessage(),
                    date, localDateTimeEx.getErrorIndex());
                
                // Add both original exceptions as suppressed
                combinedEx.addSuppressed(localDateTimeEx);
                combinedEx.addSuppressed(localDateEx);
                
                throw combinedEx;
            }
        }
    }

    public long startOfDayEpochMillis(LocalDate date) {
        return date.atStartOfDay(configuredZoneId).toInstant().toEpochMilli();
    }

    public String formatEpochMillis(long epochMillis, String pattern, ZoneId zoneId) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
        return ZonedDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), zoneId).format(formatter);
    }

    public String formatEpochMillis(long epochMillis, String pattern) {
        return formatEpochMillis(epochMillis, pattern, configuredZoneId);
    }
}
