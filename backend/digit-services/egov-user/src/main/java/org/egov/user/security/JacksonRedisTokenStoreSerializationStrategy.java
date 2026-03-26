package org.egov.user.security;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.security.oauth2.provider.token.store.redis.RedisTokenStoreSerializationStrategy;

import java.nio.charset.StandardCharsets;

/**
 * Custom serialization strategy for RedisTokenStore that uses Jackson JSON serialization
 * instead of JDK serialization. This avoids serialVersionUID compatibility issues
 * when upgrading Java/Spring Security versions.
 */
public class JacksonRedisTokenStoreSerializationStrategy implements RedisTokenStoreSerializationStrategy {

    private final ObjectMapper objectMapper;

    public JacksonRedisTokenStoreSerializationStrategy() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        this.objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
    }

    @Override
    public <T> T deserialize(byte[] bytes, Class<T> clazz) {
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        try {
            return objectMapper.readValue(bytes, clazz);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize object of type: " + clazz.getName(), e);
        }
    }

    @Override
    public String deserializeString(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }

    @Override
    public byte[] serialize(Object object) {
        if (object == null) {
            return new byte[0];
        }
        try {
            return objectMapper.writeValueAsBytes(object);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize object: " + object.getClass().getName(), e);
        }
    }

    @Override
    public byte[] serialize(String data) {
        if (data == null) {
            return new byte[0];
        }
        return data.getBytes(StandardCharsets.UTF_8);
    }
}
