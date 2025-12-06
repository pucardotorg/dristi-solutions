package com.example.gateway.ratelimiters;

import com.example.gateway.model.Otp;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.cloud.gateway.filter.factory.rewrite.ModifyRequestBodyGatewayFilterFactory;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Objects;

import static com.example.gateway.constants.GatewayConstants.REQUEST_INFO_FIELD_NAME_PASCAL_CASE;


@Configuration
public class RateLimiterConfiguration {

    private ModifyRequestBodyGatewayFilterFactory modifyRequestBodyFilter;

    private ObjectMapper objectMapper;

    public RateLimiterConfiguration(ModifyRequestBodyGatewayFilterFactory modifyRequestBodyFilter, ObjectMapper objectMapper) {
        this.modifyRequestBodyFilter = modifyRequestBodyFilter;
        this.objectMapper = objectMapper;
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
     * user limit - extracts user UUID from request body
     * Falls back to IP if user UUID not present
     * @return
     */
    @Bean
    @Primary
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // Try to get cached body from exchange attributes (set by previous filters)
            Object cachedBody = exchange.getAttribute("cachedRequestBodyObject");
            
            if (cachedBody instanceof Map) {
                try {
                    Map<String, Object> bodyMap = (Map<String, Object>) cachedBody;
                    Object requestInfoObj = bodyMap.get(REQUEST_INFO_FIELD_NAME_PASCAL_CASE);
                    
                    if (requestInfoObj != null) {
                        RequestInfo requestInfo = objectMapper.convertValue(requestInfoObj, RequestInfo.class);
                        if (requestInfo.getUserInfo() != null && 
                            requestInfo.getUserInfo().getUuid() != null && 
                            !requestInfo.getUserInfo().getUuid().isEmpty()) {
                            // Return user UUID for per-user rate limiting
                            return Mono.just(requestInfo.getUserInfo().getUuid());
                        }
                    }
                } catch (Exception e) {
                    // Fall through to IP-based limiting
                }
            }
            
            // Fallback to IP-based rate limiting
            return Mono.just(getClientIp(exchange));
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


    @Bean
    public KeyResolver otpKeyResolver() {
        return exchange -> Mono.just(
                modifyRequestBodyFilter.apply(
                        new ModifyRequestBodyGatewayFilterFactory.Config()
                                .setRewriteFunction(Map.class, String.class, (serverWebExchange, body) -> {
                                    String mobile = null;
                                    try {
                                        if (body != null) {
                                            Object otpNode = body.get("otp");
                                            if (otpNode != null) {
                                                Otp otp = objectMapper.convertValue(otpNode, Otp.class);
                                                mobile = otp.getMobileNumber();
                                            } else if (body.get("mobileNumber") != null) {
                                                mobile = objectMapper.convertValue(body.get("mobileNumber"), String.class);
                                            }
                                        }
                                    } catch (IllegalArgumentException e) {
                                    }

                                    if (mobile == null || mobile.isEmpty()) {
                                        mobile = Objects.requireNonNull(serverWebExchange.getRequest().getRemoteAddress())
                                                .getAddress()
                                                .getHostAddress();
                                    }
                                    return Mono.just(mobile);
                                })
                ).toString()
        );
    }


}
