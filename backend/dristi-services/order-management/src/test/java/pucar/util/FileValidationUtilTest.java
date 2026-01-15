package pucar.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FileValidationUtilTest {

    private MultipartFile mockFile;

    @BeforeEach
    void setUp() {
        mockFile = Mockito.mock(MultipartFile.class);
    }

    @Test
    void testValidJpegFile() {
        when(mockFile.getContentType()).thenReturn(MediaType.IMAGE_JPEG_VALUE);
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidPngFile() {
        when(mockFile.getContentType()).thenReturn(MediaType.IMAGE_PNG_VALUE);
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidPdfFile() {
        when(mockFile.getContentType()).thenReturn(MediaType.APPLICATION_PDF_VALUE);
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidDocxFile() {
        when(mockFile.getContentType()).thenReturn("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidXlsxFile() {
        when(mockFile.getContentType()).thenReturn("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidCsvFile() {
        when(mockFile.getContentType()).thenReturn("text/csv");
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testInvalidFileType() {
        when(mockFile.getContentType()).thenReturn("application/zip");
        assertFalse(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testNullContentType() {
        when(mockFile.getContentType()).thenReturn(null);
        assertFalse(FileValidationUtil.isValidFile(mockFile));
    }
}
