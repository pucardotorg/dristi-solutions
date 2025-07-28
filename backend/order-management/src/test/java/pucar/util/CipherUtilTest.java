package pucar.util;

import org.apache.tika.Tika;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import pucar.config.Configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CipherUtilTest {

    @Mock
    private Tika tika;
    
    @Mock
    private Configuration configuration;
    
    @InjectMocks
    private CipherUtil cipherUtil;

    @BeforeEach
    void setUp() {
        // Configure default mock behaviors
        when(configuration.getMaxFileSize()).thenReturn(10 * 1024 * 1024L); // 10MB
        when(configuration.getAllowedContentTypes())
            .thenReturn(new String[]{"application/pdf", "application/x-pdf"});
        when(tika.detect(any(byte[].class))).thenReturn("application/pdf");
    }

    @Test
    void testEncodePdfToBase64() throws IOException {
        // Given
        String testData = "%PDF-1.4\nSample PDF Content"; // Adding PDF header for validation
        byte[] testDataBytes = testData.getBytes();
        Resource mockResource = Mockito.mock(Resource.class);
        InputStream inputStream = new ByteArrayInputStream(testDataBytes);
        when(mockResource.getInputStream()).thenReturn(inputStream);
        when(mockResource.contentLength()).thenReturn((long) testDataBytes.length);
        when(mockResource.exists()).thenReturn(true);
        when(mockResource.isReadable()).thenReturn(true);

        // When
        String encodedBase64 = cipherUtil.encodePdfToBase64(mockResource);
        String expectedBase64 = Base64.getEncoder().encodeToString(testDataBytes);

        // Then
        assertNotNull(encodedBase64);
        assertEquals(expectedBase64, encodedBase64);
    }

    @Test
    void testDecodeBase64ToPdf() throws IOException {
        // Given
        String testData = "%PDF-1.4\nSample PDF Content"; // Adding PDF header for validation
        byte[] testDataBytes = testData.getBytes();
        String base64String = Base64.getEncoder().encodeToString(testDataBytes);
        String fileName = "test.pdf";

        // When
        MultipartFile decodedFile = cipherUtil.decodeBase64ToPdf(base64String, fileName);

        // Then
        assertNotNull(decodedFile);
        assertEquals(fileName, decodedFile.getOriginalFilename());
        assertArrayEquals(testDataBytes, decodedFile.getBytes());
        assertEquals("application/pdf", decodedFile.getContentType());
    }
}
