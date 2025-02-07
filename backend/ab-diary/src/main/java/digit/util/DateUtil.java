package digit.util;

import org.springframework.stereotype.Component;

import java.util.Calendar;
import java.util.TimeZone;

import static digit.config.ServiceConstants.IST_TIME_ZONE;
import static java.time.ZoneOffset.UTC;

@Component
public class DateUtil {

    public long getCurrentDateInEpoch() {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone(IST_TIME_ZONE));
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);

        return calendar.getTimeInMillis();
    }

    public long getStartOfCurrentMonthInEpoch() {
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone(IST_TIME_ZONE));
        calendar.set(Calendar.DAY_OF_MONTH, 1);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);

        return calendar.getTimeInMillis();
    }
}
