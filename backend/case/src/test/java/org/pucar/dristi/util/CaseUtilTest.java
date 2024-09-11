package org.pucar.dristi.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class CaseUtilTest {

    private CaseUtil caseUtil;

    @BeforeEach
    public void setup() {
        caseUtil = new CaseUtil();
    }


    @Test
    public void generateAccessCode_returnsExpectedLength() {
        int length = 10;

        String accessCode = CaseUtil.generateAccessCode(length);

        assertEquals(length, accessCode.length());
    }

    @Test
    public void generateAccessCode_returnsUniqueCodes() {
        int length = 10;

        String accessCode1 = CaseUtil.generateAccessCode(length);
        String accessCode2 = CaseUtil.generateAccessCode(length);

        assertNotEquals(accessCode1, accessCode2);
    }
}