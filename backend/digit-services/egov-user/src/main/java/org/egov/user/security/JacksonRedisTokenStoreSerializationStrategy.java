package org.egov.user.security;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.provider.token.store.redis.RedisTokenStoreSerializationStrategy;

import java.io.ByteArrayInputStream;
import java.io.ObjectInputStream;
import java.nio.charset.StandardCharsets;

/**
 * Custom serialization strategy for RedisTokenStore that uses Jackson JSON serialization
 * instead of JDK serialization. This avoids serialVersionUID compatibility issues
 * when upgrading Java/Spring Security versions.
 *
 * For backward compatibility, this strategy can also deserialize tokens that were
 * stored using JDK serialization (before the upgrade). It detects the format by
 * checking for the Java serialization magic bytes (0xAC 0xED).
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
    @SuppressWarnings("unchecked")
    public <T> T deserialize(byte[] bytes, Class<T> clazz) {
        if (bytes == null || bytes.length == 0) {
            return null;
        }

        // Check if the data was serialized using JDK serialization (legacy tokens)
        if (isJdkSerialized(bytes)) {
            log.debug("Detected JDK-serialized token, falling back to JDK deserialization for type: {}", clazz.getName());
            return deserializeWithJdk(bytes, clazz);
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

    /**
     * Fall back to JDK ObjectInputStream deserialization for legacy tokens.
     */
    @SuppressWarnings("unchecked")
    private <T> T deserializeWithJdk(byte[] bytes, Class<T> clazz) {
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            return (T) ois.readObject();
        } catch (Exception e) {
            throw new RuntimeException("Failed to JDK-deserialize object of type: " + clazz.getName(), e);
        }
    }
}
