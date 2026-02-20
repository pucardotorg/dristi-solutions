package org.pucar.dristi.util;

import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Calendar;
import java.util.TimeZone;

import static java.time.ZoneOffset.UTC;

@Component
public class DateUtil {

    private final Configuration config;

    @Autowired
    public DateUtil(Configuration config) {
        this.config = config;
    }
    public List<Long> getYearInSeconds(Integer year) {

        try {
            Calendar startOfYear = Calendar.getInstance(TimeZone.getTimeZone(UTC));
            startOfYear.set(year, Calendar.JANUARY, 1, 0, 0, 0);
            startOfYear.set(Calendar.MILLISECOND, 0);
            long startOfYearMillis = startOfYear.getTimeInMillis();

            Calendar endOfYear = Calendar.getInstance(TimeZone.getTimeZone(UTC));
            endOfYear.set(year, Calendar.DECEMBER, 31, 23, 59, 59);
            endOfYear.set(Calendar.MILLISECOND, 999);
            long endOfYearMillis = endOfYear.getTimeInMillis();

            return List.of(startOfYearMillis, endOfYearMillis);
        }
        catch (Exception e) {
            throw new RuntimeException("Error while getting year in seconds", e);
        }
    }

    public Long getEpochFromLocalDateTime(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();
    }

    public Long getEpochFromLocalDate(LocalDate date) {

        return date.atStartOfDay(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();

    }
}
