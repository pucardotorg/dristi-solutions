package org.egov.user.security.oauth2;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.user.domain.model.SecureUser;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class RedisEgovTokenStore implements EgovTokenStore {

    private static final String ACCESS_PREFIX = "access_token:";
    private static final String REFRESH_PREFIX = "refresh_token:";
    private static final String USER_TOKENS_PREFIX = "user_tokens:";
    private static final String REFRESH_TO_ACCESS_PREFIX = "refresh_to_access:";
    private static final String USER_ACTIVE_TOKEN_PREFIX = "user_active_token:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisEgovTokenStore(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void storeAccessToken(String token, Authentication authentication, long expirySeconds) {
        try {
            String json = serializeAuthentication(authentication);
            redisTemplate.opsForValue().set(ACCESS_PREFIX + token, json, expirySeconds, TimeUnit.SECONDS);
            SecureUser secureUser = (SecureUser) authentication.getPrincipal();
            // Maintain reverse index: username → set of tokens (for bulk invalidation on account lock)
            String userKey = USER_TOKENS_PREFIX + secureUser.getUsername();
            redisTemplate.opsForSet().add(userKey, token);
            redisTemplate.expire(userKey, expirySeconds, TimeUnit.SECONDS);
            // Track the single active token per user+tenantId for reuse on re-login
            String activeKey = USER_ACTIVE_TOKEN_PREFIX + secureUser.getUsername() + ":" + secureUser.getTenantId();
            redisTemplate.opsForValue().set(activeKey, token, expirySeconds, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Failed to store access token in Redis", e);
            throw new RuntimeException("Failed to store access token", e);
        }
    }

    @Override
    public void storeRefreshToken(String refreshToken, Authentication authentication, long expirySeconds) {
        try {
            String json = serializeAuthentication(authentication);
            redisTemplate.opsForValue().set(REFRESH_PREFIX + refreshToken, json, expirySeconds, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Failed to store refresh token in Redis", e);
            throw new RuntimeException("Failed to store refresh token", e);
        }
    }

    @Override
    public void storeAccessTokenToRefreshTokenMapping(String accessToken, String refreshToken) {
        try {
            // Store mapping: refresh_token -> access_token (to find and invalidate old access token)
            redisTemplate.opsForValue().set(REFRESH_TO_ACCESS_PREFIX + refreshToken, accessToken);
            // Set same expiry as refresh token (will be cleaned up automatically)
            Long ttl = redisTemplate.getExpire(REFRESH_PREFIX + refreshToken, TimeUnit.SECONDS);
            if (ttl != null && ttl > 0) {
                redisTemplate.expire(REFRESH_TO_ACCESS_PREFIX + refreshToken, ttl, TimeUnit.SECONDS);
            }
        } catch (Exception e) {
            log.error("Failed to store access token to refresh token mapping", e);
        }
    }

    @Override
    public void removeAccessTokenUsingRefreshToken(String refreshToken) {
        try {
            // Find the access token associated with this refresh token
            String accessToken = redisTemplate.opsForValue().get(REFRESH_TO_ACCESS_PREFIX + refreshToken);
            if (accessToken != null) {
                // Remove the old access token
                redisTemplate.delete(ACCESS_PREFIX + accessToken);
                log.debug("Removed old access token associated with refresh token");
            }
            // Clean up the mapping
            redisTemplate.delete(REFRESH_TO_ACCESS_PREFIX + refreshToken);
        } catch (Exception e) {
            log.error("Failed to remove access token using refresh token", e);
        }
    }

    @Override
    public Authentication readAuthentication(String accessToken) {
        try {
            String json = redisTemplate.opsForValue().get(ACCESS_PREFIX + accessToken);
            if (json == null) return null;
            return deserializeAuthentication(json);
        } catch (Exception e) {
            log.error("Failed to read authentication from Redis for access token", e);
            return null;
        }
    }

    @Override
    public Authentication readAuthenticationFromRefreshToken(String refreshToken) {
        try {
            String json = redisTemplate.opsForValue().get(REFRESH_PREFIX + refreshToken);
            if (json == null) return null;
            return deserializeAuthentication(json);
        } catch (Exception e) {
            log.error("Failed to read authentication from Redis for refresh token", e);
            return null;
        }
    }

    @Override
    public boolean removeAccessToken(String accessToken) {
        // Also remove the active-token pointer if it still points at this token
        try {
            String json = redisTemplate.opsForValue().get(ACCESS_PREFIX + accessToken);
            if (json != null) {
                org.egov.user.web.contract.auth.User user =
                        objectMapper.readValue(json, org.egov.user.web.contract.auth.User.class);
                String activeKey = USER_ACTIVE_TOKEN_PREFIX + user.getUserName() + ":" + user.getTenantId();
                String current = redisTemplate.opsForValue().get(activeKey);
                if (accessToken.equals(current)) {
                    redisTemplate.delete(activeKey);
                }
            }
        } catch (Exception e) {
            log.warn("Could not clean up active token pointer during removeAccessToken", e);
        }
        Boolean deleted = redisTemplate.delete(ACCESS_PREFIX + accessToken);
        return Boolean.TRUE.equals(deleted);
    }

    @Override
    public void removeAllTokensByUsername(String username) {
        try {
            String userKey = USER_TOKENS_PREFIX + username;
            java.util.Set<String> tokens = redisTemplate.opsForSet().members(userKey);
            if (tokens != null) {
                for (String token : tokens) {
                    redisTemplate.delete(ACCESS_PREFIX + token);
                }
            }
            redisTemplate.delete(userKey);
            // Remove all active-token pointers for this user (non-blocking SCAN across tenants;
            // KEYS would block the whole Redis instance in production)
            String activeTokenPattern = USER_ACTIVE_TOKEN_PREFIX + username + ":*";
            ScanOptions scanOptions = ScanOptions.scanOptions().match(activeTokenPattern).count(100).build();
            java.util.Set<String> activeKeys = new java.util.HashSet<>();
            try (Cursor<String> cursor = redisTemplate.scan(scanOptions)) {
                cursor.forEachRemaining(activeKeys::add);
            }
            if (!activeKeys.isEmpty()) {
                redisTemplate.delete(activeKeys);
            }
        } catch (Exception e) {
            log.error("Failed to remove tokens for user: {}", username, e);
        }
    }

    @Override
    public String getActiveAccessToken(String username, String tenantId) {
        try {
            String activeKey = USER_ACTIVE_TOKEN_PREFIX + username + ":" + tenantId;
            String candidate = redisTemplate.opsForValue().get(activeKey);
            if (candidate != null && Boolean.TRUE.equals(redisTemplate.hasKey(ACCESS_PREFIX + candidate))) {
                return candidate;
            }
            // Stale pointer — clean it up
            if (candidate != null) {
                redisTemplate.delete(activeKey);
            }
        } catch (Exception e) {
            log.warn("Could not look up active token for user: {}", username, e);
        }
        return null;
    }

    @Override
    public void removeRefreshToken(String refreshToken) {
        redisTemplate.delete(REFRESH_PREFIX + refreshToken);
    }

    private String serializeAuthentication(Authentication authentication) throws Exception {
        SecureUser secureUser = (SecureUser) authentication.getPrincipal();
        return objectMapper.writeValueAsString(secureUser.getUser());
    }

    private Authentication deserializeAuthentication(String json) throws Exception {
        org.egov.user.web.contract.auth.User user =
                objectMapper.readValue(json, org.egov.user.web.contract.auth.User.class);
        SecureUser secureUser = new SecureUser(user);
        return new UsernamePasswordAuthenticationToken(secureUser, null, secureUser.getAuthorities());
    }
}
