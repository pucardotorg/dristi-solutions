package digit.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import static digit.config.ServiceConstants.IST_TIME_ZONE;

public final class DateTimeUtil {

    private static final ZoneId IST_ZONE = ZoneId.of(IST_TIME_ZONE);

    private DateTimeUtil() {
    }

    public static long toEpochMillis(String date, String pattern) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
        try {
            LocalDateTime dateTime = LocalDateTime.parse(date, formatter);
            return dateTime.atZone(IST_ZONE).toInstant().toEpochMilli();
        } catch (DateTimeParseException ex) {
            LocalDate localDate = LocalDate.parse(date, formatter);
            return startOfDayEpochMillis(localDate);
        }
    }

    public static long startOfDayEpochMillis(LocalDate date) {
        return date.atStartOfDay(IST_ZONE).toInstant().toEpochMilli();
    }

    public static String formatEpochMillis(long epochMillis, String pattern) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
        return ZonedDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), IST_ZONE).format(formatter);
    }
}
