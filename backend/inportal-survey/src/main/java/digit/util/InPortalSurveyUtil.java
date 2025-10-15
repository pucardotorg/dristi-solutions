package digit.util;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class InPortalSurveyUtil {

    public Long getCurrentTimeInMilliSec() {
        return System.currentTimeMillis();
    }

    public Long getExpiryTimeInMilliSec(Long noOfDays) {
        return getCurrentTimeInMilliSec() + noOfDays * 24 * 60 * 60 * 1000;
    }

    public UUID generateUUID() {
        return UUID.randomUUID();
    }

}
