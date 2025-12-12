package digit.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class InPortalSurveyUtilTest {

    @InjectMocks
    private InPortalSurveyUtil inPortalSurveyUtil;

    @Test
    public void testGetCurrentTimeInMilliSec_ReturnsNonNull() {
        // Act
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();

        // Assert
        assertNotNull(currentTime);
        assertTrue(currentTime > 0);
    }

    @Test
    public void testGetCurrentTimeInMilliSec_ReturnsReasonableValue() {
        // Act
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();

        // Assert
        // Check that the time is reasonable (after 2020 and before 2100)
        assertTrue(currentTime > 1577836800000L); // Jan 1, 2020
        assertTrue(currentTime < 4102444800000L); // Jan 1, 2100
    }

    @Test
    public void testGetCurrentTimeInMilliSec_MultipleCallsIncreasing() {
        // Act
        Long time1 = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        try {
            Thread.sleep(10); // Small delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        Long time2 = inPortalSurveyUtil.getCurrentTimeInMilliSec();

        // Assert
        assertTrue(time2 >= time1);
    }

    @Test
    public void testGetExpiryTimeInMilliSec_PositiveDays() {
        // Arrange
        Long noOfDaysInMilliSec = 7 * 24 * 60 * 60 * 1000L; // 7 days

        // Act
        Long expiryTime = inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysInMilliSec);

        // Assert
        assertNotNull(expiryTime);
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        assertTrue(expiryTime > currentTime || Math.abs(expiryTime - currentTime - noOfDaysInMilliSec) < 100);
    }

    @Test
    public void testGetExpiryTimeInMilliSec_ZeroDays() {
        // Arrange
        Long noOfDaysInMilliSec = 0L;

        // Act
        Long expiryTime = inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysInMilliSec);

        // Assert
        assertNotNull(expiryTime);
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        assertTrue(Math.abs(expiryTime - currentTime) < 100); // Should be approximately current time
    }

    @Test
    public void testGetExpiryTimeInMilliSec_LargeDays() {
        // Arrange
        Long noOfDaysInMilliSec = 365 * 24 * 60 * 60 * 1000L; // 1 year

        // Act
        Long expiryTime = inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysInMilliSec);

        // Assert
        assertNotNull(expiryTime);
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        assertTrue(expiryTime > currentTime);
        assertTrue(expiryTime - currentTime >= noOfDaysInMilliSec - 100);
    }

    @Test
    public void testGetExpiryTimeInMilliSec_SmallDuration() {
        // Arrange
        Long noOfDaysInMilliSec = 1000L; // 1 second

        // Act
        Long expiryTime = inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysInMilliSec);

        // Assert
        assertNotNull(expiryTime);
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        assertTrue(expiryTime >= currentTime);
    }

    @Test
    public void testGetExpiryTimeInMilliSec_ConsistentCalculation() {
        // Arrange
        Long noOfDaysInMilliSec = 30 * 24 * 60 * 60 * 1000L; // 30 days

        // Act
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        Long expiryTime = inPortalSurveyUtil.getExpiryTimeInMilliSec(noOfDaysInMilliSec);

        // Assert
        Long expectedExpiry = currentTime + noOfDaysInMilliSec;
        assertTrue(Math.abs(expiryTime - expectedExpiry) < 100); // Allow small time difference
    }

    @Test
    public void testGenerateUUID_ReturnsNonNull() {
        // Act
        UUID uuid = inPortalSurveyUtil.generateUUID();

        // Assert
        assertNotNull(uuid);
    }

    @Test
    public void testGenerateUUID_ReturnsValidUUID() {
        // Act
        UUID uuid = inPortalSurveyUtil.generateUUID();

        // Assert
        assertNotNull(uuid);
        assertNotNull(uuid.toString());
        assertTrue(uuid.toString().matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
    }

    @Test
    public void testGenerateUUID_MultipleCallsReturnDifferentUUIDs() {
        // Act
        UUID uuid1 = inPortalSurveyUtil.generateUUID();
        UUID uuid2 = inPortalSurveyUtil.generateUUID();
        UUID uuid3 = inPortalSurveyUtil.generateUUID();

        // Assert
        assertNotEquals(uuid1, uuid2);
        assertNotEquals(uuid2, uuid3);
        assertNotEquals(uuid1, uuid3);
    }

    @Test
    public void testGenerateUUID_MultipleCallsReturnUniqueValues() {
        // Act - Generate multiple UUIDs
        int count = 100;
        java.util.Set<UUID> uuids = new java.util.HashSet<>();
        for (int i = 0; i < count; i++) {
            uuids.add(inPortalSurveyUtil.generateUUID());
        }

        // Assert - All should be unique
        assertEquals(count, uuids.size());
    }

    @Test
    public void testGenerateUUID_CanBeConvertedToString() {
        // Act
        UUID uuid = inPortalSurveyUtil.generateUUID();
        String uuidString = uuid.toString();

        // Assert
        assertNotNull(uuidString);
        assertFalse(uuidString.isEmpty());
        assertEquals(36, uuidString.length()); // UUID string length
    }

    @Test
    public void testAllMethods_Integration() {
        // Test all methods work together
        Long currentTime = inPortalSurveyUtil.getCurrentTimeInMilliSec();
        Long expiryTime = inPortalSurveyUtil.getExpiryTimeInMilliSec(1000L);
        UUID uuid = inPortalSurveyUtil.generateUUID();

        assertNotNull(currentTime);
        assertNotNull(expiryTime);
        assertNotNull(uuid);
        assertTrue(expiryTime >= currentTime);
    }
}
