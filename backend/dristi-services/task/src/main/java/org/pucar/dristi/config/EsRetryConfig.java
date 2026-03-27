package org.pucar.dristi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

@Configuration
@EnableRetry
public class EsRetryConfig {

    @Bean
    public RetryTemplate esRetryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();

        // Retry 3 times with exponential backoff
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);

        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(2000);  // 2 seconds
        backOffPolicy.setMultiplier(2.0);        // Double each time
        backOffPolicy.setMaxInterval(10000);     // Max 10 seconds

        retryTemplate.setRetryPolicy(retryPolicy);
        retryTemplate.setBackOffPolicy(backOffPolicy);

        return retryTemplate;
    }
}
