package digit.util;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class InPortalSurveyUtil {

    public Long getCurrentTimeInMilliSec() {
        return System.currentTimeMillis();
    }

    public Long getExpiryTimeInMilliSec(Long noOfDaysInMilliSec) {
        return getCurrentTimeInMilliSec() + noOfDaysInMilliSec;
    }

    public UUID generateUUID() {
        return UUID.randomUUID();
    }

}
