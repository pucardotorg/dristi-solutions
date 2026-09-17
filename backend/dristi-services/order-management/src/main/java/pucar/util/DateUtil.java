package pucar.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;

import java.time.*;
import java.time.format.DateTimeFormatter;

@Component
public class DateUtil {

    private final Configuration config;

    @Autowired
    public DateUtil(Configuration config) {
        this.config = config;
    }


    public LocalDateTime getLocalDateTimeFromEpoch(long startTime) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(startTime), ZoneId.of(config.getZoneId()));
    }

    public LocalTime getLocalTime(String time) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");
        // Parse the time string into a LocalTime object
        return LocalTime.parse(time, formatter);
    }

    public LocalDateTime getLocalDateTime(LocalDateTime dateTime, String newTime) {

        LocalTime time = getLocalTime(newTime);

        return dateTime.with(time);

    }

    public LocalDate getLocalDateFromEpoch(long startTime) {
        return Instant.ofEpochMilli(startTime)
                .atZone(ZoneId.of(config.getZoneId()))
                .toLocalDate();
    }

    public Long getEPochFromLocalDate(LocalDate date) {

        return date.atStartOfDay(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();

    }


    public Long getEpochFromLocalDateTime(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();
    }

    public Long getStartOfTheDayForEpoch(Long date) {
        LocalDate localDate = getLocalDateFromEpoch(date);

        return getEPochFromLocalDate(localDate);

    }


    public Long getCurrentTimeInMilis() {
        return ZonedDateTime.now(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();
    }


    public Long getEpochFromDateString(String date, String formatter) {
        DateTimeFormatter format = DateTimeFormatter.ofPattern(formatter);
        LocalDate localDate = LocalDate.parse(date, format);
        return localDate.atStartOfDay(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();
    }
}