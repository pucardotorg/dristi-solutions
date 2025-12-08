package com.example.gateway.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.OrderedGatewayFilter;
import org.springframework.cloud.gateway.filter.factory.RequestRateLimiterGatewayFilterFactory;
import org.springframework.cloud.gateway.filter.ratelimit.RateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Custom configuration to set RequestRateLimiter order to 5 globally
 * for all routes using RequestRateLimiter in routes.properties.
 * 
 * This creates a custom RequestRateLimiterGatewayFilterFactory that wraps
 * all filters with OrderedGatewayFilter at order 5 without modifying route definitions.
 */
@Configuration
public class ProgrammaticRoutesConfig {

    @Autowired
    private RateLimiter<?> rateLimiter;
    
    @Autowired
    private org.springframework.cloud.gateway.filter.ratelimit.KeyResolver keyResolver;

    @Bean
    @Primary
    public RequestRateLimiterGatewayFilterFactory requestRateLimiterGatewayFilterFactory() {
        return new RequestRateLimiterGatewayFilterFactory(rateLimiter, keyResolver) {
            @Override
            public GatewayFilter apply(Config config) {
                // Get the default filter from parent
                GatewayFilter defaultFilter = super.apply(config);
                
                // Wrap it with OrderedGatewayFilter to set order to 5
                return new OrderedGatewayFilter(defaultFilter, 5);
            }
        };
    }
}
