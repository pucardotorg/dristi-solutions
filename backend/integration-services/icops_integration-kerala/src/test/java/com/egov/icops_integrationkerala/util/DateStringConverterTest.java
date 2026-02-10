package com.egov.icops_integrationkerala.util;

import com.egov.icops_integrationkerala.config.IcopsConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
class DateStringConverterTest {

    @Mock
    private IcopsConfiguration config;

    @InjectMocks
    private DateStringConverter dateStringConverter;

    @Test
    void testConvertDate() {
        String originalDate = "2021-01-01";
        String convertedDate = dateStringConverter.convertDate(originalDate);
        assertEquals("01/01/2021", convertedDate);
    }
}
