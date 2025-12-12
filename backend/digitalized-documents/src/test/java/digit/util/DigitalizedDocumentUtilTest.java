package digit.util;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class DigitalizedDocumentUtilTest {

    @Test
    void basic() {
        DigitalizedDocumentUtil util = new DigitalizedDocumentUtil();
        Long t1 = util.getCurrentTimeInMilliSec();
        assertNotNull(t1);
        assertTrue(t1 > 0);

        UUID id = util.generateUUID();
        assertNotNull(id);
    }
}
