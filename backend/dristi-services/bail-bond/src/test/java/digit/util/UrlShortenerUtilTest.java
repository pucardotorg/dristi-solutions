package digit.util;

import digit.config.Configuration;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static digit.config.ServiceConstants.*;

@ExtendWith(MockitoExtension.class)
class UrlShortenerUtilTest {

    @InjectMocks
    private UrlShortenerUtil urlShortenerUtil;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration configs;

    private final String dummyHost = "http://short.url";
    private final String dummyEndpoint = "/shorten";
    private final String longUrl = "http://localhost:3000/ui/citizen/dristi/home/bail-bond-sign";
    private final String tenantId = "tenant123";
    private final String bailBondId = "bond456";

    @BeforeEach
    void setup() {
        when(configs.getUrlShortnerHost()).thenReturn(dummyHost);
        when(configs.getUrlShortnerEndpoint()).thenReturn(dummyEndpoint);
    }

    @Test
    void test_getShortenedUrl_success() {
        String fullUrl = "http://example.com/some/long/url";
        String expectedShortUrl = "http://short.url/xyz123";

        when(restTemplate.postForObject(
                eq(dummyHost + dummyEndpoint),
                any(HashMap.class),
                eq(String.class))
        ).thenReturn(expectedShortUrl);

        String result = urlShortenerUtil.getShortenedUrl(fullUrl, null);
        assertEquals(expectedShortUrl, result);
    }

    @Test
    void test_getShortenedUrl_returnsOriginalIfEmpty() {
        String fullUrl = "http://example.com/some/long/url";

        when(restTemplate.postForObject(
                eq(dummyHost + dummyEndpoint),
                any(HashMap.class),
                eq(String.class))
        ).thenReturn("");

        String result = urlShortenerUtil.getShortenedUrl(fullUrl, null);
        assertEquals(fullUrl, result);
    }

    @Test
    void test_createShortenedUrl_success() {
        String expectedShortUrl = "http://short.url/abc";
        when(configs.getLongUrl()).thenReturn("%s?tenant=%s&bailbondId=%s");
        when(configs.getDomainUrl()).thenReturn("http://localhost:3000");
        when(configs.getBaseUrl()).thenReturn("/ui/citizen/dristi/home/bail-bond-sign");

        String baseUrl = configs.getDomainUrl() + configs.getBaseUrl();

        String expectedLongUrl = String.format(configs.getLongUrl(), baseUrl , tenantId, bailBondId);

        when(restTemplate.postForObject(
                eq(dummyHost + dummyEndpoint),
                any(HashMap.class),
                eq(String.class))
        ).thenReturn(expectedShortUrl);

        String result = urlShortenerUtil.createShortenedUrl(tenantId, bailBondId);
        assertEquals(expectedShortUrl, result);
    }

    @Test
    void test_createShortenedUrl_failure() {
        String expectedShortUrl = "http://short.url/abc";
        when(configs.getLongUrl()).thenReturn(longUrl);

        String expectedLongUrl = String.format("%s?tenant=%s&bailbondId=%s", longUrl, tenantId, bailBondId);

        when(restTemplate.postForObject(
                eq(dummyHost + dummyEndpoint),
                any(HashMap.class),
                eq(String.class))
        ).thenThrow(new CustomException(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE));

        assertThrows(CustomException.class, () -> {
            urlShortenerUtil.createShortenedUrl(tenantId, bailBondId);
        });
    }

}
