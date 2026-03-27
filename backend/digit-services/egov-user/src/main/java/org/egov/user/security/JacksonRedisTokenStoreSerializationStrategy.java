package org.egov.user.security;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.provider.token.store.redis.RedisTokenStoreSerializationStrategy;

import java.nio.charset.StandardCharsets;

/**
 * Custom serialization strategy for RedisTokenStore that uses Jackson JSON serialization
 * instead of JDK serialization. This avoids serialVersionUID compatibility issues
 * when upgrading Java/Spring Security versions.
 *
 * Old tokens in Redis that were serialized with JDK serialization (before the upgrade)
 * cannot be deserialized due to serialVersionUID mismatches in Spring Security classes.
 * These are treated as invalid tokens — returning null causes the caller to treat
 * them as expired, forcing the user to re-authenticate and get a new JSON-serialized token.
 */
@Slf4j
public class JacksonRedisTokenStoreSerializationStrategy implements RedisTokenStoreSerializationStrategy {

    private static final byte JAVA_SERIAL_MAGIC_BYTE_0 = (byte) 0xAC;
    private static final byte JAVA_SERIAL_MAGIC_BYTE_1 = (byte) 0xED;

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

        // Old tokens serialized with JDK serialization are incompatible after the
        // Spring Security upgrade (serialVersionUID mismatch). Treat them as expired.
        if (isJdkSerialized(bytes)) {
            log.warn("Encountered legacy JDK-serialized token (incompatible with upgraded Spring Security). "
                    + "Treating as invalid for type: {}. User will need to re-authenticate.", clazz.getName());
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

    /**
     * Check if the byte array starts with the Java serialization magic bytes (0xAC 0xED).
     */
    private boolean isJdkSerialized(byte[] bytes) {
        return bytes.length >= 2
                && bytes[0] == JAVA_SERIAL_MAGIC_BYTE_0
                && bytes[1] == JAVA_SERIAL_MAGIC_BYTE_1;
    }
}
