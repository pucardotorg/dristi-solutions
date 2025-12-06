package digit.util;

import digit.config.Configuration;
import org.apache.tika.Tika;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CipherUtilTest {

    @Mock private Tika tika;
    @Mock private Configuration configuration;

    private CipherUtil cipherUtil;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        cipherUtil = new CipherUtil(tika, configuration);
        when(configuration.getMaxFileSize()).thenReturn(1024 * 1024L);
        when(configuration.getAllowedContentTypes()).thenReturn(new String[]{"application/pdf"});
    }

    @Test
    void encodePdfToBase64_Success() throws Exception {
        byte[] bytes = "%PDF-1.4".getBytes();
        Resource res = mock(Resource.class);
        when(res.exists()).thenReturn(true);
        when(res.isReadable()).thenReturn(true);
        when(res.contentLength()).thenReturn((long) bytes.length);
        when(res.getInputStream()).thenReturn(new ByteArrayInputStream(bytes));
        when(tika.detect(any(byte[].class))).thenReturn("application/pdf");

        String base64 = cipherUtil.encodePdfToBase64(res);
        assertEquals(Base64.getEncoder().encodeToString(bytes), base64);
    }

    @Test
    void encodePdfToBase64_InvalidType_Throws() throws Exception {
        byte[] bytes = "not-pdf".getBytes();
        Resource res = mock(Resource.class);
        when(res.exists()).thenReturn(true);
        when(res.isReadable()).thenReturn(true);
        when(res.contentLength()).thenReturn((long) bytes.length);
        when(res.getInputStream()).thenReturn(new ByteArrayInputStream(bytes));
        when(tika.detect(any(byte[].class))).thenReturn("text/plain");

        CustomException ex = assertThrows(CustomException.class, () -> cipherUtil.encodePdfToBase64(res));
        assertEquals("INVALID_FILE_TYPE", ex.getCode());
    }

    @Test
    void decodeBase64ToPdf_Success() throws Exception {
        byte[] bytes = "%PDF-1.4 hello".getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);
        when(tika.detect(any(byte[].class))).thenReturn("application/pdf");

        MultipartFile out = cipherUtil.decodeBase64ToPdf(base64, "file.pdf");
        assertArrayEquals(bytes, out.getBytes());
        assertEquals("file.pdf", out.getOriginalFilename());
    }
}
