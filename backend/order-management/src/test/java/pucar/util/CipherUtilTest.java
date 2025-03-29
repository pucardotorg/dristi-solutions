package pucar.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class CipherUtilTest {

    private CipherUtil cipherUtil;

    @BeforeEach
    void setUp() {
        cipherUtil = new CipherUtil();
    }

    @Test
    void testEncodePdfToBase64() throws IOException {
        // Given
        String testData = "Sample PDF Content";
        byte[] testDataBytes = testData.getBytes();
        Resource mockResource = Mockito.mock(Resource.class);
        InputStream inputStream = new ByteArrayInputStream(testDataBytes);
        when(mockResource.getInputStream()).thenReturn(inputStream);

        // When
        String encodedBase64 = cipherUtil.encodePdfToBase64(mockResource);
        String expectedBase64 = Base64.getEncoder().encodeToString(testDataBytes);

        // Then
        assertEquals(expectedBase64, encodedBase64);
    }

    @Test
    void testDecodeBase64ToPdf() throws IOException {
        // Given
        String testData = "Sample PDF Content";
        byte[] testDataBytes = testData.getBytes();
        String base64String = Base64.getEncoder().encodeToString(testDataBytes);
        String fileName = "test.pdf";

        // When
        MultipartFile decodedFile = cipherUtil.decodeBase64ToPdf(base64String, fileName);

        // Then
        assertNotNull(decodedFile);
        assertEquals(fileName, decodedFile.getOriginalFilename());
        assertArrayEquals(testDataBytes, decodedFile.getBytes());
    }
}
