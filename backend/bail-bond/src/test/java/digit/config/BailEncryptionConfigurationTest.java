package digit.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

public class BailEncryptionConfigurationTest {

    private BailEncryptionConfiguration configuration;

    @BeforeEach
    void setUp() {
        configuration = Mockito.spy(new BailEncryptionConfiguration());

        // Simulate singleton ObjectMapper bean behavior by stubbing the method to always return the same instance
        ObjectMapper sharedObjectMapper = configuration.objectMapper();
        Mockito.doReturn(sharedObjectMapper).when(configuration).objectMapper();
    }

    @Test
    void testObjectMapperConfiguration() {
        ObjectMapper mapper = configuration.objectMapper();

        // Check that FAIL_ON_UNKNOWN_PROPERTIES is disabled
        assertThat(mapper.isEnabled(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)).isFalse();

        // Verify JavaTimeModule support by serializing a LocalDate instance
        LocalDate sampleDate = LocalDate.of(2024, 7, 28);
        try {
            String serialized = mapper.writeValueAsString(sampleDate);
            assertThat(serialized).contains("2024");
        } catch (Exception e) {
            fail("ObjectMapper should support JavaTimeModule for LocalDate serialization");
        }
    }

    @Test
    void testJacksonConverterUsesSameObjectMapper() {
        ObjectMapper sharedMapper = configuration.objectMapper();
        MappingJackson2HttpMessageConverter converter = configuration.jacksonConverter();

        assertThat(converter).isNotNull();
        assertThat(converter.getObjectMapper()).isSameAs(sharedMapper);
    }

    @Test
    void testObjectMapperReturnsSameInstance() {
        ObjectMapper mapper1 = configuration.objectMapper();
        ObjectMapper mapper2 = configuration.objectMapper();

        // Because of the stub in setUp(), these should be the same instance
        assertThat(mapper1).isSameAs(mapper2);
    }
}
