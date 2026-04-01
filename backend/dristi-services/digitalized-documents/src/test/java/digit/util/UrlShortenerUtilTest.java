package digit.util;

import digit.config.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class UrlShortenerUtilTest {

    @Mock private RestTemplate restTemplate;
    @Mock private Configuration configs;

    @InjectMocks private UrlShortenerUtil util;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        when(configs.getUrlShortnerHost()).thenReturn("http://short");
        when(configs.getUrlShortnerEndpoint()).thenReturn("/shorten");
    }

    @Test
    void returnsShortenedUrl_WhenServiceReturnsValue() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn("http://s.io/x");
        String out = util.getShortenedUrl("http://long.url","123");
        assertEquals("http://s.io/x", out);
    }

    @Test
    void returnsOriginal_WhenServiceReturnsEmpty() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn("");
        String out = util.getShortenedUrl("http://long","123");
        assertEquals("http://long", out);
    }
}
