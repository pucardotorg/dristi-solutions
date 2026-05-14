package digit.util;

import digit.config.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DateUtilTest {

    @Mock
    private Configuration config;

    @InjectMocks
    private DateUtil dateUtil;

    private static final String ZONE_ID = "Asia/Kolkata";

    @BeforeEach
    void setUp() {
        lenient().when(config.getZoneId()).thenReturn(ZONE_ID);
    }

    @Test
    void getLocalDateTimeFromEpoch_ReturnsCorrectDateTime() {
        long epoch = 1704067200000L; // Jan 1, 2024 00:00:00 UTC

        LocalDateTime result = dateUtil.getLocalDateTimeFromEpoch(epoch);

        assertNotNull(result);
        assertEquals(2024, result.getYear());
        assertEquals(1, result.getMonthValue());
        assertEquals(1, result.getDayOfMonth());
    }

    @Test
    void getLocalTime_ParsesTimeCorrectly() {
        String timeString = "14:30:45";

        LocalTime result = dateUtil.getLocalTime(timeString);

        assertEquals(14, result.getHour());
        assertEquals(30, result.getMinute());
        assertEquals(45, result.getSecond());
    }

    @Test
    void getLocalDateTime_CombinesDateAndTime() {
        LocalDateTime dateTime = LocalDateTime.of(2024, 1, 15, 10, 0, 0);
        String newTime = "15:30:00";

        LocalDateTime result = dateUtil.getLocalDateTime(dateTime, newTime);

        assertEquals(2024, result.getYear());
        assertEquals(1, result.getMonthValue());
        assertEquals(15, result.getDayOfMonth());
        assertEquals(15, result.getHour());
        assertEquals(30, result.getMinute());
        assertEquals(0, result.getSecond());
    }

    @Test
    void getLocalDateFromEpoch_ReturnsCorrectDate() {
        long epoch = 1704067200000L; // Jan 1, 2024

        LocalDate result = dateUtil.getLocalDateFromEpoch(epoch);

        assertNotNull(result);
        assertEquals(2024, result.getYear());
        assertEquals(1, result.getMonthValue());
        assertEquals(1, result.getDayOfMonth());
    }

    @Test
    void getEPochFromLocalDate_ReturnsCorrectEpoch() {
        LocalDate date = LocalDate.of(2024, 6, 15);

        Long result = dateUtil.getEPochFromLocalDate(date);

        assertNotNull(result);
        assertTrue(result > 0);
        
        // Verify by converting back
        LocalDate convertedBack = dateUtil.getLocalDateFromEpoch(result);
        assertEquals(date, convertedBack);
    }

    @Test
    void getEpochFromLocalDateTime_ReturnsCorrectEpoch() {
        LocalDateTime dateTime = LocalDateTime.of(2024, 6, 15, 10, 30, 0);

        Long result = dateUtil.getEpochFromLocalDateTime(dateTime);

        assertNotNull(result);
        assertTrue(result > 0);
    }

    @Test
    void getStartOfTheDayForEpoch_ReturnsStartOfDay() {
        // Epoch for June 15, 2024 at 14:30:00
        long midDayEpoch = 1718444400000L;

        Long result = dateUtil.getStartOfTheDayForEpoch(midDayEpoch);

        assertNotNull(result);
        
        LocalDateTime startOfDay = dateUtil.getLocalDateTimeFromEpoch(result);
        assertEquals(0, startOfDay.getHour());
        assertEquals(0, startOfDay.getMinute());
        assertEquals(0, startOfDay.getSecond());
    }

    @Test
    void getCurrentTimeInMilis_ReturnsCurrentTime() {
        Long result = dateUtil.getCurrentTimeInMilis();

        assertNotNull(result);
        assertTrue(result > 0);
        
        // Should be close to System.currentTimeMillis()
        long systemTime = System.currentTimeMillis();
        assertTrue(Math.abs(result - systemTime) < 1000); // Within 1 second
    }

    @Test
    void getEpochFromDateString_ParsesCorrectly() {
        String dateString = "15-06-2024";
        String formatter = "dd-MM-yyyy";

        Long result = dateUtil.getEpochFromDateString(dateString, formatter);

        assertNotNull(result);
        assertTrue(result > 0);
        
        LocalDate parsedDate = dateUtil.getLocalDateFromEpoch(result);
        assertEquals(15, parsedDate.getDayOfMonth());
        assertEquals(6, parsedDate.getMonthValue());
        assertEquals(2024, parsedDate.getYear());
    }

    @Test
    void getEpochFromDateString_DifferentFormats() {
        String dateString = "2024/06/15";
        String formatter = "yyyy/MM/dd";

        Long result = dateUtil.getEpochFromDateString(dateString, formatter);

        assertNotNull(result);
        LocalDate parsedDate = dateUtil.getLocalDateFromEpoch(result);
        assertEquals(2024, parsedDate.getYear());
        assertEquals(6, parsedDate.getMonthValue());
        assertEquals(15, parsedDate.getDayOfMonth());
    }

    @Test
    void getLocalTime_InvalidFormat_ThrowsException() {
        assertThrows(Exception.class, () -> dateUtil.getLocalTime("invalid-time"));
    }

    @Test
    void getEpochFromDateString_InvalidFormat_ThrowsException() {
        assertThrows(Exception.class, () -> 
            dateUtil.getEpochFromDateString("invalid-date", "dd-MM-yyyy"));
    }
}
