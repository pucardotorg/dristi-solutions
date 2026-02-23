package pucar.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FileValidationUtilTest {

    private MultipartFile mockFile;

    @BeforeEach
    void setUp() {
        mockFile = Mockito.mock(MultipartFile.class);
    }

    @Test
    void testValidJpegFile() throws IOException {
        byte[] jpegSignature = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        when(mockFile.getContentType()).thenReturn(MediaType.IMAGE_JPEG_VALUE);
        when(mockFile.getOriginalFilename()).thenReturn("test.jpg");
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getInputStream()).thenReturn(new ByteArrayInputStream(jpegSignature));
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidPngFile() throws IOException {
        byte[] pngSignature = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        when(mockFile.getContentType()).thenReturn(MediaType.IMAGE_PNG_VALUE);
        when(mockFile.getOriginalFilename()).thenReturn("test.png");
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getInputStream()).thenReturn(new ByteArrayInputStream(pngSignature));
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidPdfFile() throws IOException {
        byte[] pdfSignature = "%PDF-1.4\n".getBytes();
        when(mockFile.getContentType()).thenReturn(MediaType.APPLICATION_PDF_VALUE);
        when(mockFile.getOriginalFilename()).thenReturn("test.pdf");
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getInputStream()).thenReturn(new ByteArrayInputStream(pdfSignature));
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidDocxFile() throws IOException {
        byte[] docxSignature = new byte[]{0x50, 0x4B, 0x03, 0x04};
        when(mockFile.getContentType()).thenReturn("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        when(mockFile.getOriginalFilename()).thenReturn("test.docx");
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getInputStream()).thenReturn(new ByteArrayInputStream(docxSignature));
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidXlsxFile() throws IOException {
        byte[] xlsxSignature = new byte[]{0x50, 0x4B, 0x03, 0x04};
        when(mockFile.getContentType()).thenReturn("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        when(mockFile.getOriginalFilename()).thenReturn("test.xlsx");
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getInputStream()).thenReturn(new ByteArrayInputStream(xlsxSignature));
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testValidCsvFile() throws IOException {
        byte[] csvContent = "column1,column2\nvalue1,value2\n".getBytes();
        when(mockFile.getContentType()).thenReturn("text/csv");
        when(mockFile.getOriginalFilename()).thenReturn("test.csv");
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getInputStream()).thenReturn(new ByteArrayInputStream(csvContent));
        assertTrue(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testInvalidFileType() throws IOException {
        byte[] zipSignature = new byte[]{0x50, 0x4B, 0x03, 0x04};
        when(mockFile.getContentType()).thenReturn("application/zip");
        when(mockFile.getOriginalFilename()).thenReturn("test.zip");
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getInputStream()).thenReturn(new ByteArrayInputStream(zipSignature));
        assertFalse(FileValidationUtil.isValidFile(mockFile));
    }

    @Test
    void testNullContentType() {
        when(mockFile.getContentType()).thenReturn(null);
        when(mockFile.getOriginalFilename()).thenReturn("test.txt");
        when(mockFile.isEmpty()).thenReturn(false);
        assertFalse(FileValidationUtil.isValidFile(mockFile));
    }
}
