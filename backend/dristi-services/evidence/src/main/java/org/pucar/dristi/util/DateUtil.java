package org.pucar.dristi.util;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import static org.pucar.dristi.config.ServiceConstants.DATE_PATTERN;

@Component
@Slf4j
@AllArgsConstructor
public class DateUtil {

    private final Configuration config;

    public String getFormattedCurrentDate() {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern(DATE_PATTERN);
        ZoneId zoneId = ZoneId.of(config.getZoneId());
        LocalDate currentDate = LocalDate.now(zoneId);

        return currentDate.format(dateFormatter);
    }

    public Long getStartOfTheDayForEpoch(Long date) {
        LocalDate localDate = getLocalDateFromEpoch(date);

        return getEPochFromLocalDate(localDate);

    }

    public Long getCurrentTimeInMilis() {
        return ZonedDateTime.now(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();
    }

    public LocalDate getLocalDateFromEpoch(long startTime) {
        return Instant.ofEpochMilli(startTime)
                .atZone(ZoneId.of(config.getZoneId()))
                .toLocalDate();
    }

    public Long getEPochFromLocalDate(LocalDate date) {

        return date.atStartOfDay(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();

    }
}
