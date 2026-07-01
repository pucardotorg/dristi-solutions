package org.pucar.dristi.util;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileStoreUtilTest {

    @Mock private RestTemplate restTemplate;
    @Mock private Configuration configs;

    @InjectMocks
    private FileStoreUtil fileStoreUtil;

    @BeforeEach
    void setUp() {
        lenient().when(configs.getFileStoreHost()).thenReturn("http://localhost:8080");
        lenient().when(configs.getFileStorePath()).thenReturn("/filestore/v1/files/url?");
        lenient().when(configs.getFileStoreDeleteEndPoint()).thenReturn("/filestore/v1/files/delete");
    }

    // ---- doesFileExist tests ----

    @Test
    void doesFileExist_shouldReturnTrueWhenFileExists() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(new ResponseEntity<>("OK", HttpStatus.OK));

        assertTrue(fileStoreUtil.doesFileExist("kl", "fs-1"));
    }

    @Test
    void doesFileExist_shouldReturnFalseWhenNotFound() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.NOT_FOUND));

        assertFalse(fileStoreUtil.doesFileExist("kl", "fs-1"));
    }

    @Test
    void doesFileExist_shouldReturnFalseOnException() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenThrow(new RuntimeException("timeout"));

        assertFalse(fileStoreUtil.doesFileExist("kl", "fs-1"));
    }

    // ---- fetchFileAsBytes tests ----

    @Test
    void fetchFileAsBytes_shouldReturnBytesOnSuccess() {
        byte[] content = "PDF content".getBytes();
        when(restTemplate.getForEntity(anyString(), eq(byte[].class)))
                .thenReturn(new ResponseEntity<>(content, HttpStatus.OK));

        byte[] result = fileStoreUtil.fetchFileAsBytes("kl", "fs-1");

        assertNotNull(result);
        assertEquals("PDF content", new String(result));
    }

    @Test
    void fetchFileAsBytes_shouldReturnNullOnNon200() {
        when(restTemplate.getForEntity(anyString(), eq(byte[].class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.NOT_FOUND));

        assertNull(fileStoreUtil.fetchFileAsBytes("kl", "fs-1"));
    }

    @Test
    void fetchFileAsBytes_shouldReturnNullOnException() {
        when(restTemplate.getForEntity(anyString(), eq(byte[].class)))
                .thenThrow(new RuntimeException("error"));

        assertNull(fileStoreUtil.fetchFileAsBytes("kl", "fs-1"));
    }

    // ---- countPages tests ----

    @Test
    void countPages_shouldReturnZeroForNull() {
        assertEquals(0, fileStoreUtil.countPages(null));
    }

    @Test
    void countPages_shouldReturnZeroForEmpty() {
        assertEquals(0, fileStoreUtil.countPages(new byte[0]));
    }

    @Test
    void countPages_shouldReturnZeroForInvalidContent() {
        assertEquals(0, fileStoreUtil.countPages("not a pdf or image".getBytes()));
    }

    // ---- getTotalPageCount tests ----

    @Test
    void getTotalPageCount_shouldReturnZeroForNull() {
        assertEquals(0, fileStoreUtil.getTotalPageCount("kl", null));
    }

    @Test
    void getTotalPageCount_shouldReturnZeroForEmptyList() {
        assertEquals(0, fileStoreUtil.getTotalPageCount("kl", Collections.emptyList()));
    }

    @Test
    void getTotalPageCount_shouldSumPagesAcrossFiles() {
        // Mock fetch returns invalid content (not PDF/image), so countPages returns 0
        when(restTemplate.getForEntity(anyString(), eq(byte[].class)))
                .thenReturn(new ResponseEntity<>("invalid".getBytes(), HttpStatus.OK));

        int result = fileStoreUtil.getTotalPageCount("kl", List.of("fs-1", "fs-2"));

        // Both are invalid, so 0+0=0
        assertEquals(0, result);
    }

    @Test
    void getTotalPageCount_shouldHandleNullFileContent() {
        when(restTemplate.getForEntity(anyString(), eq(byte[].class)))
                .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        int result = fileStoreUtil.getTotalPageCount("kl", List.of("fs-1"));

        assertEquals(0, result);
    }

    // ---- deleteFilesByFileStore tests ----

    @Test
    void deleteFilesByFileStore_shouldSkipWhenNullIds() {
        fileStoreUtil.deleteFilesByFileStore(null, "kl");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void deleteFilesByFileStore_shouldSkipWhenEmptyIds() {
        fileStoreUtil.deleteFilesByFileStore(Collections.emptyList(), "kl");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void deleteFilesByFileStore_shouldPostDeleteRequest() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Object.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));

        fileStoreUtil.deleteFilesByFileStore(List.of("fs-1", "fs-2"), "kl");

        verify(restTemplate).postForEntity(
                eq("http://localhost:8080/filestore/v1/files/delete?tenantId=kl"),
                any(HttpEntity.class), eq(Object.class));
    }

    @Test
    void deleteFilesByFileStore_shouldThrowCustomExceptionOnError() {
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Object.class)))
                .thenThrow(new CustomException("FILE_ERR", "delete failed"));

        assertThrows(CustomException.class,
                () -> fileStoreUtil.deleteFilesByFileStore(List.of("fs-1"), "kl"));
    }
}
