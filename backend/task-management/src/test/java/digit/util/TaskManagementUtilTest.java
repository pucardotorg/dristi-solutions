package digit.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TaskManagementUtilTest {

    @InjectMocks
    private TaskManagementUtil taskManagementUtil;

    @Test
    void generateUUID_ReturnsNonNullUUID() {
        UUID result = taskManagementUtil.generateUUID();
        assertNotNull(result);
    }

    @Test
    void generateUUID_ReturnsUniqueUUIDs() {
        UUID uuid1 = taskManagementUtil.generateUUID();
        UUID uuid2 = taskManagementUtil.generateUUID();
        
        assertNotEquals(uuid1, uuid2);
    }

    @Test
    void generateUUID_ReturnsValidUUIDFormat() {
        UUID result = taskManagementUtil.generateUUID();
        
        String uuidString = result.toString();
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        assertTrue(uuidString.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
    }

    @Test
    void getCurrentTimeInMilliSec_ReturnsNonNullValue() {
        Long result = taskManagementUtil.getCurrentTimeInMilliSec();
        assertNotNull(result);
    }

    @Test
    void getCurrentTimeInMilliSec_ReturnsPositiveValue() {
        Long result = taskManagementUtil.getCurrentTimeInMilliSec();
        assertTrue(result > 0);
    }

    @Test
    void getCurrentTimeInMilliSec_ReturnsReasonableTimestamp() {
        Long result = taskManagementUtil.getCurrentTimeInMilliSec();
        
        // Should be greater than Jan 1, 2020 (1577836800000)
        assertTrue(result > 1577836800000L);
        
        // Should be less than Jan 1, 2100 (4102444800000)
        assertTrue(result < 4102444800000L);
    }

    @Test
    void getCurrentTimeInMilliSec_IncrementsOverTime() throws InterruptedException {
        Long time1 = taskManagementUtil.getCurrentTimeInMilliSec();
        Thread.sleep(10); // Wait 10ms
        Long time2 = taskManagementUtil.getCurrentTimeInMilliSec();
        
        assertTrue(time2 >= time1);
    }

    @Test
    void generateUUID_MultipleCallsReturnDifferentUUIDs() {
        int count = 100;
        java.util.Set<UUID> uuids = new java.util.HashSet<>();
        
        for (int i = 0; i < count; i++) {
            uuids.add(taskManagementUtil.generateUUID());
        }
        
        assertEquals(count, uuids.size(), "All UUIDs should be unique");
    }
}
