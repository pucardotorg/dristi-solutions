package org.pucar.dristi.util;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class LandingPageNoticeUtil {

    public Long getCurrentTimeInMilliSec() {
        return System.currentTimeMillis();
    }

    public String getNoticeNumber() {
        return UUID.randomUUID().toString();
    }

}
