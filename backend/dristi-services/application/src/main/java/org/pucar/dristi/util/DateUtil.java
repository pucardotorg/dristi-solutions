package org.pucar.dristi.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@Slf4j
@RequiredArgsConstructor
public class DateUtil {

    private final Configuration config;

    public String getCurrentYear(){
        return String.valueOf(LocalDate.now(ZoneId.of(config.getZoneId())).getYear());
    }
}
