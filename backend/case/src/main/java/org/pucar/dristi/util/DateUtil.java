package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;

@Slf4j
@Component
public class DateUtil {
    /**
     * Converts a "HH:mm:ss" time string to a Date object representing that time today
     */
    public Instant getInstantFrom(String time) {
        LocalTime localTime = LocalTime.parse(time);
        ZonedDateTime currentDate = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));
        ZonedDateTime zonedDateTime = currentDate.with(localTime);

        return Date.from(zonedDateTime.toInstant()).toInstant();
    }
}
