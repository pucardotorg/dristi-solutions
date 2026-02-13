package org.pucar.dristi.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DateUtilTest {

    @Mock
    private Configuration config;

    @InjectMocks
    private DateUtil dateUtil;


    @Test
    public void shouldReturnStartAndEndOfYear2021InSeconds() {
        when(config.getZoneId()).thenReturn("Asia/Kolkata");
        List<Long> result = dateUtil.getYearInSeconds(2021);
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1609439400000L, result.get(0));
        assertEquals(1640975399999L, result.get(1));
    }

    @Test
    public void shouldThrowExceptionWhenYearIsNull() {
        assertThrows(RuntimeException.class, () -> dateUtil.getYearInSeconds(null));
    }

    @Test
    public void shouldHandleEdgeCaseYears() {
        when(config.getZoneId()).thenReturn("Asia/Kolkata");
        List<Long> result1970 = dateUtil.getYearInSeconds(1970);
        assertEquals(-19800000L, result1970.get(0));
        // Test leap year
        List<Long> result2024 = dateUtil.getYearInSeconds(2024);
        assertNotNull(result2024);
        assertEquals(2, result2024.size());
        assertEquals(1704047400000L, result2024.get(0)); // 2024-01-01 00:00:00 IST
        assertEquals(1735669799999L, result2024.get(1)); // 2024-12-31 23:59:59.999 IST
    }

    @Test
    public void shouldReturnEpochFromLocalDateTime() {
        // Only set up the mock here
        when(config.getZoneId()).thenReturn("Asia/Kolkata");

        LocalDateTime dateTime = LocalDateTime.of(2025, 6, 26, 20, 57, 0);
        Long epochMillis = dateUtil.getEpochFromLocalDateTime(dateTime);
        assertEquals(1750951620000L, epochMillis);
    }

    public void shouldReturnEpochFromLocalDateInUTC() {
        // Arrange
        when(config.getZoneId()).thenReturn("Asia/Kolkata");
        LocalDate date = LocalDate.of(2025, 6, 26);

        // Act
        Long epochMillis = dateUtil.getEpochFromLocalDate(date);

        // Assert
        assertEquals(1750876200000L, epochMillis); // 2025-06-26T00:00:00+05:30 in millis
    }

    @Test
        public void shouldReturnEpochFromLocalDateInIST() {
        // Arrange
        when(config.getZoneId()).thenReturn("Asia/Kolkata");
        LocalDate date = LocalDate.of(2025, 6, 26);

        // Act
        Long epochMillis = dateUtil.getEpochFromLocalDate(date);

        // Assert
        assertEquals(1750876200000L, epochMillis); // 2025-06-26T00:00:00+05:30 in millis
    }
}
