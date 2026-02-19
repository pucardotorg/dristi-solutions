package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;

@Slf4j
@Component
public class DateUtil {

    private final Configuration config;

    public DateUtil(Configuration config) {
        this.config = config;
    }

    /**
     * Converts a "HH:mm:ss" time string to a Date object representing that time today
     */
    public Instant getInstantFrom(String time) {
        LocalTime localTime = LocalTime.parse(time);
        ZoneId zoneId = ZoneId.of(config.getZoneId());
        ZonedDateTime zonedDateTime = ZonedDateTime.now(zoneId).with(localTime);

        return zonedDateTime.toInstant();
    }


    public Long getEPochFromLocalDate(LocalDate date) {

        return date.atStartOfDay(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();

    }

    public String getFormattedDateFromEpoch(Long epoch, String pattern) {
        // Convert epoch seconds to LocalDate
        LocalDate date = Instant.ofEpochMilli(epoch)
                .atZone(ZoneId.of(config.getZoneId()))
                .toLocalDate();

        return date.format(DateTimeFormatter.ofPattern(pattern));
    }
}
