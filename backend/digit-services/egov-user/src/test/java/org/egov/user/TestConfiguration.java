package org.egov.user;

import net.minidev.json.JSONArray;
import org.egov.encryption.EncryptionService;
import org.egov.encryption.config.DecryptionPolicyConfiguration;
import org.egov.encryption.config.EncryptionPolicyConfiguration;
import org.egov.encryption.masking.MaskingService;
import org.egov.encryption.util.MdmsFetcher;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.client.RestTemplate;

import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Configuration
public class TestConfiguration {

    @Bean
    @SuppressWarnings("unchecked")
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return mock(KafkaTemplate.class);
    }

    @Bean
    @Primary
    public MaskingService maskingService() {
        return mock(MaskingService.class);
    }

    @Bean
    @Primary
    public EncryptionService encryptionService() {
        return mock(EncryptionService.class);
    }

    /**
     * The enc-client policy beans (EncryptionPolicyConfiguration and DecryptionPolicyConfiguration)
     * load their security policy from MDMS in a @PostConstruct. Left real, that makes a live HTTP
     * call while the test context loads and fails the whole slice whenever MDMS is unreachable. A
     * stubbed fetcher returning an empty policy keeps the web-slice tests self-contained: the
     * policies initialise to empty maps and no network call is made. Marked @Primary so the policy
     * beans inject this in place of the component-scanned fetcher.
     */
    @Bean
    @Primary
    public MdmsFetcher mockMdmsFetcher() {
        MdmsFetcher mdmsFetcher = mock(MdmsFetcher.class);
        when(mdmsFetcher.getSecurityMdmsForFilter(nullable(String.class))).thenReturn(new JSONArray());
        when(mdmsFetcher.getMaskingMdmsForFilter(nullable(String.class))).thenReturn(new JSONArray());
        when(mdmsFetcher.getMdmsForFilter(nullable(String.class), nullable(String.class)))
                .thenReturn(new JSONArray());
        return mdmsFetcher;
    }

    @Bean
    @Primary
    public EncryptionPolicyConfiguration encryptionPolicyConfiguration() {
        return mock(EncryptionPolicyConfiguration.class);
    }

    @Bean
    @Primary
    public DecryptionPolicyConfiguration decryptionPolicyConfiguration() {
        return mock(DecryptionPolicyConfiguration.class);
    }

    @Bean
    public RestTemplateBuilder restTemplateBuilder() {
        return new RestTemplateBuilder();
    }

    @Bean
    @Primary
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public NamedParameterJdbcTemplate namedParameterJdbcTemplate() {
        return mock(NamedParameterJdbcTemplate.class);
    }

    @Bean
    public JdbcTemplate jdbcTemplate() {
        return mock(JdbcTemplate.class);
    }

}
