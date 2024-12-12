package org.pucar.dristi.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
public class DateUtilTest {

    @InjectMocks
    private DateUtil dateUtil;

    @Test
    public void testGetYearInSeconds() {
        dateUtil.getYearInSeconds(2021);
    }

    @Test
    public void testGetYearInSecondsException() {

        assertThrows (RuntimeException.class, () -> {
            dateUtil.getYearInSeconds(null);
        });

    }
}
