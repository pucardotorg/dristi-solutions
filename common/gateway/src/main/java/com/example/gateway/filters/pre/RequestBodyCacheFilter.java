package com.example.gateway.filters.pre;

import com.example.gateway.utils.CommonUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHeaders;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Filter that caches the request body in exchange attributes so it can be read by multiple downstream filters.
 * This filter must run before any filter that needs to read the request body.
 * Similar to how RequestStartTimeFilter stores the start time in attributes,
 * this filter stores the request body for reuse across the filter chain.
 */
@Slf4j
@Component
public class RequestBodyCacheFilter implements GlobalFilter, Ordered {

    private final ObjectMapper objectMapper;
    private final CommonUtils commonUtils;

    public RequestBodyCacheFilter(ObjectMapper objectMapper, CommonUtils commonUtils) {
        this.objectMapper = objectMapper;
        this.commonUtils = commonUtils;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        boolean isGetRequest = HttpMethod.GET.equals(exchange.getRequest().getMethod());
        String contentType = exchange.getRequest().getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);

        // Skip caching for GET requests or form-data (no JSON body to cache)
        if (isGetRequest || commonUtils.isFormContentType(contentType)) {
            return chain.filter(exchange);
        }

        // Check if body is already cached (by route-specific CacheRequestBody filter)
        if (exchange.getAttribute(ServerWebExchangeUtils.CACHED_REQUEST_BODY_ATTR) != null) {
            log.debug("Request body already cached, skipping");
            return chain.filter(exchange);
        }

        // Cache the body
        return DataBufferUtils.join(exchange.getRequest().getBody())
                .flatMap(dataBuffer -> {
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);

                    try {
                        // Parse and cache as Map (similar to how we store start time in attributes)
                        Map<String, Object> bodyMap = objectMapper.readValue(bytes, Map.class);
                        exchange.getAttributes().put(ServerWebExchangeUtils.CACHED_REQUEST_BODY_ATTR, bodyMap);
                        log.debug("Cached request body for path: {}", exchange.getRequest().getPath());

                        // Create a new request decorator with the cached body so downstream can still read it
                        ServerHttpRequest decorator = new ServerHttpRequestDecorator(exchange.getRequest()) {
                            @Override
                            public Flux<DataBuffer> getBody() {
                                DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
                                return Flux.just(buffer);
                            }
                        };

                        return chain.filter(exchange.mutate().request(decorator).build());
                    } catch (Exception e) {
                        log.error("Failed to cache request body, proceeding without cache: {}", e.getMessage(), e);

                        // Proceed with the original request in case of failure to cache
                        return chain.filter(exchange);
                    }
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.debug("Empty request body, skipping cache");
                    return chain.filter(exchange);
                }));
    }

    @Override
    public int getOrder() {
        // Run at order -6, right after RequestStartTimeFilter (-7)
        return -6;
    }
}
