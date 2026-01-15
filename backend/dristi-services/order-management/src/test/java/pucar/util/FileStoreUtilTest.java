package pucar.util;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import pucar.config.Configuration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class FileStoreUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration configs;

    @InjectMocks
    private FileStoreUtil fileStoreUtil;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testAppendQueryParams() {
        StringBuilder uri = new StringBuilder("http://localhost");
        String paramName1 = "param1";
        String paramValue1 = "value1";
        String paramName2 = "param2";
        String paramValue2 = "value2";

        StringBuilder result = fileStoreUtil.appendQueryParams(uri, paramName1, paramValue1, paramName2, paramValue2);

        assertNotNull(result);
        assertTrue(result.toString().contains(paramName1 + "=" + paramValue1));
        assertTrue(result.toString().contains(paramName2 + "=" + paramValue2));
    }

    @Test
    public void StoreFileInFileStore_Success() {
        MultipartFile file = mock(MultipartFile.class);
        String tenantId = "tenantId";
        String fileStoreId = "fileStoreId";
        String responseJson = "{\"files\":[{\"fileStoreId\":\"" + fileStoreId + "\"}]}";

        when(configs.getFileStoreHost()).thenReturn("http://localhost");
        when(configs.getFileStoreSearchEndpoint()).thenReturn("/filestore/v1/files");

        when(file.getResource()).thenReturn(mock(Resource.class));
        when(file.getContentType()).thenReturn("application/pdf");

        ResponseEntity<String> responseEntity = new ResponseEntity<>(responseJson, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        String result = fileStoreUtil.storeFileInFileStore(file, tenantId);

        assertNotNull(result);
        assertEquals(fileStoreId, result);
        verify(restTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class));
    }
}
