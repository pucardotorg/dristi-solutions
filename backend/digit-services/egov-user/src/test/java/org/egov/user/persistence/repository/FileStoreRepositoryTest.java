package org.egov.user.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
public class FileStoreRepositoryTest {

    @InjectMocks
    private FileStoreRepository fileStoreRepository;

    @Mock
    private RestTemplate restTemplate;

    @Test
    public void test_should_geturl_by_fileStoreId() throws Exception { // FIX: Added throws Exception
        Map<String, String> expectedFileStoreUrls = new HashMap<>();
        expectedFileStoreUrls.put("key", "value");

        // Use ArgumentMatchers instead of Matchers
        when(restTemplate.getForObject(any(String.class), eq(Map.class))).thenReturn(expectedFileStoreUrls);

        List<String> list = new ArrayList<>();
        list.add("key");

        // This call likely throws a checked Exception
        Map<String, String> fileStoreUrl = fileStoreRepository.getUrlByFileStoreId("default", list);

        assertEquals("value", fileStoreUrl.get("key"));
    }

    @Test
    public void test_should_return_null_ifurllist_isempty() throws Exception { // FIX: Added throws Exception
        Map<String, String> expectedFileStoreUrls = new HashMap<>();
        when(restTemplate.getForObject(any(String.class), eq(Map.class))).thenReturn(expectedFileStoreUrls);

        List<String> list = new ArrayList<>();
        list.add("key");
        Map<String, String> fileStoreUrl = fileStoreRepository.getUrlByFileStoreId("default", list);

        assertNull(fileStoreUrl);
    }

    @Test
    public void test_should_return_null_ifurllist_null() throws Exception { // FIX: Added throws Exception
        when(restTemplate.getForObject(any(String.class), eq(Map.class))).thenReturn(null);

        List<String> list = new ArrayList<>();
        list.add("key");
        Map<String, String> fileStoreUrl = fileStoreRepository.getUrlByFileStoreId("default", list);

        assertNull(fileStoreUrl);
    }

    @Test
    public void test_should_throwexception_restcallfails() {
        // Unchecked exceptions like RuntimeException don't need a method signature 'throws'
        when(restTemplate.getForObject(any(String.class), eq(Map.class))).thenThrow(new RuntimeException());

        List<String> list = new ArrayList<>();
        list.add("key");

        assertThrows(RuntimeException.class, () -> {
            fileStoreRepository.getUrlByFileStoreId("default", list);
        });
    }
}