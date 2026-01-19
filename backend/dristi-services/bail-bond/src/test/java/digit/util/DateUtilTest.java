package digit.util;

import digit.config.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import static digit.config.ServiceConstants.DATE_PATTERN;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class DateUtilTest {

    private Configuration config;
    private DateUtil dateUtil;

    @BeforeEach
    public void setup() {
        config = Mockito.mock(Configuration.class);
        dateUtil = new DateUtil(config);
    }

    @Test
    public void shouldReturnFormattedCurrentDateInConfiguredTimeZone() {
        // Given
        String zoneId = "Asia/Kolkata";
        when(config.getZoneId()).thenReturn(zoneId);

        // When
        String actualDate = dateUtil.getFormattedCurrentDate();

        // Then
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN);
        String expectedDate = LocalDate.now(ZoneId.of(zoneId)).format(formatter);

        assertEquals(expectedDate, actualDate);
    }

    @Test
    public void shouldReturnFormattedCurrentDateInUTC() {
        // Given
        String zoneId = "UTC";
        when(config.getZoneId()).thenReturn(zoneId);

        // When
        String actualDate = dateUtil.getFormattedCurrentDate();

        // Then
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN);
        String expectedDate = LocalDate.now(ZoneId.of(zoneId)).format(formatter);

        assertEquals(expectedDate, actualDate);
    }
}
