package org.pucar.dristi.util;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Calendar;

@Component
public class DateUtil {
    public List<Long> getYearInSeconds(Integer year) {

        try {
            Calendar startOfYear = Calendar.getInstance();
            startOfYear.set(year, Calendar.JANUARY, 1, 0, 0, 0);
            startOfYear.set(Calendar.MILLISECOND, 0);
            long startOfYearMillis = startOfYear.getTimeInMillis();

            Calendar endOfYear = Calendar.getInstance();
            endOfYear.set(year, Calendar.DECEMBER, 31, 23, 59, 59);
            endOfYear.set(Calendar.MILLISECOND, 999);
            long endOfYearMillis = endOfYear.getTimeInMillis();

            return List.of(startOfYearMillis, endOfYearMillis);
        }
        catch (Exception e) {
            throw new RuntimeException("Error while getting year in seconds", e);
        }
    }
}
