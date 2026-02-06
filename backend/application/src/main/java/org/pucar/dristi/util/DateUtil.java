package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@Slf4j
public class DateUtil {

    public String getCurrentYear(){
        return String.valueOf(LocalDate.now(ZoneId.of("Asia/Kolkata")).getYear());
    }
}