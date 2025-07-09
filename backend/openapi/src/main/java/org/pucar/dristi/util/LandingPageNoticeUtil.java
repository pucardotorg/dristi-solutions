package org.pucar.dristi.util;

import org.springframework.stereotype.Component;

@Component
public class LandingPageNoticeUtil {

    public Long getCurrentTimeInMilliSec() {
        return System.currentTimeMillis();
    }

}
