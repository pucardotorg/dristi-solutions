package digit.util;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FileValidationUtilTest {

    @Test
    void validContentTypes_ReturnTrue() {
        assertTrue(FileValidationUtil.isValidFile(mockWith(MediaType.IMAGE_JPEG_VALUE)));
        assertTrue(FileValidationUtil.isValidFile(mockWith(MediaType.IMAGE_PNG_VALUE)));
        assertTrue(FileValidationUtil.isValidFile(mockWith(MediaType.APPLICATION_PDF_VALUE)));
        assertTrue(FileValidationUtil.isValidFile(mockWith("application/vnd.oasis.opendocument.text")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("application/vnd.oasis.opendocument.spreadsheet")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("application/msword")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("application/vnd.ms-excel")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("application/dxf")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("text/csv")));
        assertTrue(FileValidationUtil.isValidFile(mockWith("text/plain")));
    }

    @Test
    void invalidContentType_ReturnFalse() {
        assertFalse(FileValidationUtil.isValidFile(mockWith("application/zip")));
        MultipartFile nullType = mock(MultipartFile.class);
        when(nullType.getContentType()).thenReturn(null);
        assertFalse(FileValidationUtil.isValidFile(nullType));
    }

    private static MultipartFile mockWith(String contentType) {
        MultipartFile f = mock(MultipartFile.class);
        when(f.getContentType()).thenReturn(contentType);
        return f;
    }
}
