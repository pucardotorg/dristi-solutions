package digit.util;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TaskManagementUtil {

    public UUID generateUUID() {
        return UUID.randomUUID();
    }

    public Long getCurrentTimeInMilliSec() {
        return System.currentTimeMillis();
    }

}
