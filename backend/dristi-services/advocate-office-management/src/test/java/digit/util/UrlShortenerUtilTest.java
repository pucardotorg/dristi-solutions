package digit.util;

import digit.config.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UrlShortenerUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Configuration configs;

    @InjectMocks
    private UrlShortenerUtil urlShortenerUtil;

    @BeforeEach
    void setUp() {
        when(configs.getUrlShortnerHost()).thenReturn("https://url-shortener-host");
        when(configs.getUrlShortnerEndpoint()).thenReturn("/shorten");
    }

    @Test
    void testGetShortenedUrl_Success() {
        String originalUrl = "https://example.com/very/long/url/that/needs/to/be/shortened";
        String shortenedUrl = "https://short.url/abc123";

        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn(shortenedUrl);

        String result = urlShortenerUtil.getShortenedUrl(originalUrl);

        assertEquals(shortenedUrl, result);
        verify(restTemplate, times(1)).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    void testGetShortenedUrl_NullResponse() {
        String originalUrl = "https://example.com/very/long/url";

        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn(null);

        String result = urlShortenerUtil.getShortenedUrl(originalUrl);

        assertEquals(originalUrl, result);
    }

    @Test
    void testGetShortenedUrl_EmptyResponse() {
        String originalUrl = "https://example.com/very/long/url";

        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn("");

        String result = urlShortenerUtil.getShortenedUrl(originalUrl);

        assertEquals(originalUrl, result);
    }

    @Test
    void testGetShortenedUrl_BlankResponse() {
        String originalUrl = "https://example.com/very/long/url";
        String blankResponse = "   ";

        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn(blankResponse);

        String result = urlShortenerUtil.getShortenedUrl(originalUrl);

        assertEquals(blankResponse, result);
    }

    @Test
    void testGetShortenedUrl_Exception() {
        String originalUrl = "https://example.com/very/long/url";

        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenThrow(new RuntimeException("Network error"));

        assertThrows(RuntimeException.class, () -> urlShortenerUtil.getShortenedUrl(originalUrl));
    }

    @Test
    void testGetShortenedUrl_VerifyUrlConstruction() {
        String originalUrl = "https://example.com/test";
        String shortenedUrl = "https://short.url/xyz";

        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn(shortenedUrl);

        urlShortenerUtil.getShortenedUrl(originalUrl);

        verify(configs, times(1)).getUrlShortnerHost();
        verify(configs, times(1)).getUrlShortnerEndpoint();
    }

    @Test
    void testGetShortenedUrl_MultipleUrls() {
        String url1 = "https://example.com/url1";
        String url2 = "https://example.com/url2";
        String shortUrl1 = "https://short.url/1";
        String shortUrl2 = "https://short.url/2";

        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
                .thenReturn(shortUrl1)
                .thenReturn(shortUrl2);

        String result1 = urlShortenerUtil.getShortenedUrl(url1);
        String result2 = urlShortenerUtil.getShortenedUrl(url2);

        assertEquals(shortUrl1, result1);
        assertEquals(shortUrl2, result2);
        verify(restTemplate, times(2)).postForObject(anyString(), any(), eq(String.class));
    }
}
