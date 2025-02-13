package org.pucar.dristi.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class MaskUtilTest {

    @InjectMocks
    private MaskUtil maskUtil;

    @BeforeEach
    void setUp() {
        maskUtil = new MaskUtil();
    }

    @Test
    void maskData_ShouldMaskMatchingPatterns() {
        String input = "Sensitive123Data";
        String regex = "\\d";
        String result = maskUtil.maskData(input, regex);
        assertEquals("Sensitive***Data", result);
    }

    @Test
    void maskData_ShouldReturnSameString_WhenNoMatch() {
        String input = "NoDigitsHere";
        String regex = "\\d";
        String result = maskUtil.maskData(input, regex);
        assertEquals("NoDigitsHere", result);
    }

    @Test
    void maskEmail_ShouldMaskEmailCorrectly() {
        assertEquals("tes*@example.com", maskUtil.maskEmail("test@example.com"));
        assertEquals("abc*@xyz.com", maskUtil.maskEmail("abcd@xyz.com"));
        assertEquals("**@small.com", maskUtil.maskEmail("ab@small.com"));
        assertEquals("invalidEmail", maskUtil.maskEmail("invalidEmail"));
    }

    @Test
    void maskMobile_ShouldMaskMobileCorrectly() {
        assertEquals("12******90", maskUtil.maskMobile("1234567890"));
        assertEquals("99******44", maskUtil.maskMobile("9911223344"));
        assertEquals("+1******23", maskUtil.maskMobile("+12345678923"));
        assertEquals(null, maskUtil.maskMobile(null));
    }

    @Test
    void maskAadhaar_ShouldMaskAadhaarCorrectly() {
        assertEquals("********9123", maskUtil.maskAadhaar("123456789123"));
        assertEquals("********5678", maskUtil.maskAadhaar("987654325678"));
        assertEquals("12345", maskUtil.maskAadhaar("12345"));
        assertEquals(null, maskUtil.maskAadhaar(null));
    }

    @Test
    public void testMaskPII() {
        class TestClass {
            public String email = "test@example.com";
            public String name = "John Doe";
            public String mobile = "9876543210";
            public String aadhar = "123456789012";
        }

        TestClass testObj = new TestClass();
        maskUtil.maskPII(testObj);

        assertEquals("tes*@example.com", testObj.email);
        assertEquals("J*** D**", testObj.name);
        assertEquals("98******10", testObj.mobile);
        assertEquals("********9012", testObj.aadhar);
    }

    @Test
    public void testMaskName() {
        assertEquals("J*** D**", maskUtil.maskName("John Doe"));
        assertEquals("A****", maskUtil.maskName("Alice"));
    }

    @Test
    void maskPII_ShouldHandleNullObjectGracefully() {
        assertDoesNotThrow(() -> maskUtil.maskPII(null));
    }
}

