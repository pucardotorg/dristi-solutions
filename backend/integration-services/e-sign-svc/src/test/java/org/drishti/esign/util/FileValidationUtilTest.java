package org.drishti.esign.util;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class FileValidationUtilTest {

    @Test
    public void testIsValidFile_Jpeg() {
        byte[] jpegSignature = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        MultipartFile file = new MockMultipartFile("file", "filename.jpg", MediaType.IMAGE_JPEG_VALUE, jpegSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Png() {
        byte[] pngSignature = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        MultipartFile file = new MockMultipartFile("file", "filename.png", MediaType.IMAGE_PNG_VALUE, pngSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Pdf() {
        byte[] pdfSignature = "%PDF-1.4\n".getBytes();
        MultipartFile file = new MockMultipartFile("file", "filename.pdf", MediaType.APPLICATION_PDF_VALUE, pdfSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Odt() {
        byte[] odtSignature = new byte[]{0x50, 0x4B, 0x03, 0x04};
        MultipartFile file = new MockMultipartFile("file", "filename.odt", "application/vnd.oasis.opendocument.text", odtSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Ods() {
        byte[] odsSignature = new byte[]{0x50, 0x4B, 0x03, 0x04};
        MultipartFile file = new MockMultipartFile("file", "filename.ods", "application/vnd.oasis.opendocument.spreadsheet", odsSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Docx() {
        byte[] docxSignature = new byte[]{0x50, 0x4B, 0x03, 0x04};
        MultipartFile file = new MockMultipartFile("file", "filename.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Xlsx() {
        byte[] xlsxSignature = new byte[]{0x50, 0x4B, 0x03, 0x04};
        MultipartFile file = new MockMultipartFile("file", "filename.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsxSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Doc() {
        byte[] docSignature = new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1};
        MultipartFile file = new MockMultipartFile("file", "filename.doc", "application/msword", docSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Xls() {
        byte[] xlsSignature = new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1};
        MultipartFile file = new MockMultipartFile("file", "filename.xls", "application/vnd.ms-excel", xlsSignature);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Dxf() {
        byte[] dxfContent = "0\nSECTION\n2\nHEADER\n".getBytes();
        MultipartFile file = new MockMultipartFile("file", "filename.dxf", "application/dxf", dxfContent);
        assertFalse(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Csv() {
        byte[] csvContent = "column1,column2\nvalue1,value2\n".getBytes();
        MultipartFile file = new MockMultipartFile("file", "filename.csv", "text/csv", csvContent);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_Txt() {
        byte[] txtContent = "This is a text file\n".getBytes();
        MultipartFile file = new MockMultipartFile("file", "filename.txt", "text/plain", txtContent);
        assertTrue(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_InvalidType() {
        MultipartFile file = new MockMultipartFile("file", "filename.xyz", "application/xyz", new byte[0]);
        assertFalse(FileValidationUtil.isValidFile(file));
    }

    @Test
    public void testIsValidFile_NullContentType() {
        MultipartFile file = new MockMultipartFile("file", "filename.xyz", null, new byte[0]);
        assertFalse(FileValidationUtil.isValidFile(file));
    }
}
