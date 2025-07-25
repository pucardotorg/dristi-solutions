package digit.util;

import digit.config.Configuration;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import static digit.config.ServiceConstants.DATE_PATTERN;

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
}
