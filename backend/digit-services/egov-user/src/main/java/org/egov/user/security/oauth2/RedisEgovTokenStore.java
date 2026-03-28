package org.egov.user.security.oauth2;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.user.domain.model.SecureUser;
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
            // Maintain reverse index: username → set of tokens (for bulk invalidation on account lock)
            SecureUser secureUser = (SecureUser) authentication.getPrincipal();
            String userKey = USER_TOKENS_PREFIX + secureUser.getUsername();
            redisTemplate.opsForSet().add(userKey, token);
            redisTemplate.expire(userKey, expirySeconds, TimeUnit.SECONDS);
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
        } catch (Exception e) {
            log.error("Failed to remove tokens for user: {}", username, e);
        }
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
