package org.egov.transformer.util;

import lombok.AllArgsConstructor;
import org.egov.transformer.config.TransformerProperties;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Component
@AllArgsConstructor
public class DateUtil {

    private final TransformerProperties properties;


    public LocalDateTime getLocalDateTimeFromEpoch(long startTime) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(startTime), ZoneId.of(properties.getZoneId()));
    }

    public LocalTime getLocalTime(String time, String pattern) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
        return LocalTime.parse(time, formatter);
    }

    public LocalTime getLocalTime(String time) {
        return getLocalTime(time, "HH:mm:ss");
    }

    public LocalDateTime getLocalDateTime(LocalDateTime dateTime, String newTime) {

        LocalTime time = getLocalTime(newTime);

        return dateTime.with(time);

    }

    public LocalDate getLocalDateFromEpoch(long startTime) {
        return Instant.ofEpochMilli(startTime)
                .atZone(ZoneId.of(properties.getZoneId()))
                .toLocalDate();
    }

    public Long getEpochFromLocalDate(LocalDate date) {

        return date.atStartOfDay(ZoneId.of(properties.getZoneId())).toInstant().toEpochMilli();

    }


    public Long getEpochFromLocalDateTime(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.of(properties.getZoneId())).toInstant().toEpochMilli();
    }

    public Long getStartOfTheDayForEpoch(Long date) {
        LocalDate localDate = getLocalDateFromEpoch(date);

        return getEpochFromLocalDate(localDate);

    }


    public Long getCurrentTimeInMilis() {
        return ZonedDateTime.now(ZoneId.of(properties.getZoneId())).toInstant().toEpochMilli();
    }


    public Long getEpochFromDateString(String date, String formatter) {
        DateTimeFormatter format = DateTimeFormatter.ofPattern(formatter);
        LocalDate localDate = LocalDate.parse(date, format);
        return localDate.atStartOfDay(ZoneId.of(properties.getZoneId())).toInstant().toEpochMilli();
    }

    public String getYearFromDate(Long date) {
        if (date == null) return null;
        LocalDate localDate = getLocalDateFromEpoch(date);
        return String.valueOf(localDate.getYear());
    }
}
