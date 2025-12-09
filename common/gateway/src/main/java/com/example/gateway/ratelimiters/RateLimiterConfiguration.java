package com.example.gateway.ratelimiters;

import com.example.gateway.config.ApplicationProperties;
import com.example.gateway.model.Otp;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.User;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.factory.rewrite.ModifyRequestBodyGatewayFilterFactory;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.ObjectUtils;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Objects;

import static com.example.gateway.constants.GatewayConstants.USER_INFO_KEY;
import static com.example.gateway.constants.GatewayConstants.USER_UUID_KEY;


@Slf4j
@Configuration
public class RateLimiterConfiguration {

    private ModifyRequestBodyGatewayFilterFactory modifyRequestBodyFilter;

    private ObjectMapper objectMapper;

    private ApplicationProperties applicationProperties;

    public RateLimiterConfiguration(ModifyRequestBodyGatewayFilterFactory modifyRequestBodyFilter,
                                    ObjectMapper objectMapper,
                                    ApplicationProperties applicationProperties) {
        this.modifyRequestBodyFilter = modifyRequestBodyFilter;
        this.objectMapper = objectMapper;
        this.applicationProperties = applicationProperties;
    }

    /**
     * IP limit
     * @return
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String xForwardedForHeader = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (xForwardedForHeader != null) {
                // Use the first IP in the X-Forwarded-For header
                return Mono.just(xForwardedForHeader.split(",")[0]);
            }
            // Fallback to remote address if no X-Forwarded-For header is present
            return Mono.just(
                    Objects.requireNonNull(exchange.getRequest().getRemoteAddress())
                            .getAddress()
                            .getHostAddress()
            );
        };
    }


    /**
     * user limit - extracts user UUID from exchange attributes (set by AuthFilter/AuthCheckFilterHelper)
     * Falls back to IP if user UUID not present
     * 
     * NOTE: We use exchange.attributes instead of MDC because:
     * - MDC is ThreadLocal (thread-specific)
     * - Gateway is reactive (thread-switching)
     * - MDC context is often lost in reactive chains
     * 
     * @return KeyResolver that returns user UUID or IP
     */
    @Bean
    @Primary
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // Only apply OTP-specific resolution for /user-otp paths
            String path = exchange.getRequest().getPath().value();
            java.util.List<String> otpPathPrefixes = applicationProperties.getOtpPathPrefixes();
            if (otpPathPrefixes != null && otpPathPrefixes.stream().anyMatch(path::startsWith)) {
                // For configured OTP paths, delegate to otpKeyResolver
                return otpKeyResolver().resolve(exchange);
            }

            // Try exchange attributes FIRST (reliable in reactive systems)
            String userUuid = exchange.getAttribute(USER_UUID_KEY);
            
            if (!ObjectUtils.isEmpty(userUuid)) {
                log.debug("Rate limiting by user UUID from exchange: {}", userUuid);
                return Mono.just(userUuid);
            }
            
            // Try MDC as fallback (unreliable in reactive context - for demonstration)
            String userInfoJson = MDC.get(USER_INFO_KEY) != null ? MDC.get(USER_INFO_KEY) : exchange.getAttribute(USER_INFO_KEY);
            if (!ObjectUtils.isEmpty(userInfoJson)) {
                try {
                    User user = objectMapper.readValue(userInfoJson, User.class);
                    if (user != null && !ObjectUtils.isEmpty(user.getUuid())) {
                        log.warn("Rate limiting by user UUID from MDC (unreliable!): {}", user.getUuid());
                        return Mono.just(user.getUuid());
                    }
                } catch (Exception e) {
                    log.error("Failed to parse user from MDC", e);
                }
            } else {
                log.debug("MDC USER_INFO_KEY is null/empty (expected in reactive context)");
            }
            
            // Fallback to IP-based rate limiting
            String ip = getClientIp(exchange);
            log.debug("Rate limiting by IP (no user UUID available): {}", ip);
            return Mono.just(ip);
        };
    }
    
    /**
     * Helper method to get client IP address
     */
    private String getClientIp(org.springframework.web.server.ServerWebExchange exchange) {
        String xForwardedForHeader = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedForHeader != null && !xForwardedForHeader.isEmpty()) {
            return xForwardedForHeader.split(",")[0].trim();
        }
        return Objects.requireNonNull(exchange.getRequest().getRemoteAddress())
                .getAddress()
                .getHostAddress();
    }


    /**
     * OTP-specific rate limiting - extracts mobile number from cached request body
     * 
     * OTP endpoints are unauthenticated, so we can't use user UUID.
     * The CacheRequestBody filter caches the request body, which we read here to extract mobile number.
     * Falls back to IP-based rate limiting if mobile not found.
     * 
     * @return KeyResolver that returns mobile number or IP
     */
    @Bean
    public KeyResolver otpKeyResolver() {
        return exchange -> {
            // Try to read from cached request body (set by CacheRequestBody filter)
            Object cachedBody = exchange.getAttribute(ServerWebExchangeUtils.CACHED_REQUEST_BODY_ATTR);
            
            if (cachedBody != null) {
                try {
                    // CacheRequestBody stores body as Map when bodyClass=java.util.Map
                    if (cachedBody instanceof Map) {
                        Map<String, Object> bodyMap = (Map<String, Object>) cachedBody;
                        
                        // Try to extract mobile from otp object: {"otp": {"mobileNumber": "..."}}
                        Object otpNode = bodyMap.get("otp");
                        if (otpNode != null) {
                            Otp otp = objectMapper.convertValue(otpNode, Otp.class);
                            if (!ObjectUtils.isEmpty(otp.getMobileNumber())) {
                                log.debug("Rate limiting OTP by mobile from otp object: {}", otp.getMobileNumber());
                                return Mono.just(otp.getMobileNumber());
                            }
                        }
                        
                        // Try direct mobileNumber field: {"mobileNumber": "..."}
                        if (bodyMap.get("mobileNumber") != null) {
                            String directMobile = objectMapper.convertValue(bodyMap.get("mobileNumber"), String.class);
                            if (!ObjectUtils.isEmpty(directMobile)) {
                                log.debug("Rate limiting OTP by direct mobile field: {}", directMobile);
                                return Mono.just(directMobile);
                            }
                        }
                    }
                    
                    log.debug("Cached body found but mobile number not extracted, falling back to IP");
                } catch (Exception e) {
                    log.warn("Failed to extract mobile from cached body: {}", e.getMessage());
                }
            } else {
                log.debug("No cached body found (CacheRequestBody filter may not be configured)");
            }
            
            // Fallback to IP-based rate limiting for OTP requests
            String ip = getClientIp(exchange);
            log.debug("Rate limiting OTP by IP: {}", ip);
            return Mono.just(ip);
        };
    }


}
