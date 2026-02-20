package digit.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.util.TimeZone;

import static org.assertj.core.api.Assertions.assertThat;

public class MainConfigurationTest {

    private MainConfiguration configuration;

    @BeforeEach
    void setup() {
        configuration = new MainConfiguration();
        // Manually inject the timeZone value like Spring would
        configuration.setTimeZone("Asia/Kolkata");
    }

    @Test
    void testInitializeSetsDefaultTimezone() {
        configuration.initialize();
        assertThat(TimeZone.getDefault().getID()).isEqualTo("Asia/Kolkata");
    }

    @Test
    void testObjectMapperConfiguration() {
        // Set timezone before calling objectMapper
        configuration.setTimeZone("Asia/Kolkata");

        ObjectMapper mapper = configuration.objectMapper();

        assertThat(mapper).isNotNull();
        assertThat(mapper.isEnabled(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)).isFalse();
    }

    @Test
    void testJacksonConverterUsesProvidedObjectMapper() {
        ObjectMapper mockedMapper = Mockito.mock(ObjectMapper.class);

        MappingJackson2HttpMessageConverter converter = configuration.jacksonConverter(mockedMapper);

        assertThat(converter).isNotNull();
        assertThat(converter.getObjectMapper()).isSameAs(mockedMapper);
    }
}

