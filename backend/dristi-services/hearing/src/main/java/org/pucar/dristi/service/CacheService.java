package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Configuration configuration;

    public CacheService(@Autowired(required = false) RedisTemplate<String, Object> redisTemplate, Configuration configuration) {
        this.redisTemplate = redisTemplate;
        this.configuration = configuration;
    }

    public void updateCache(String key, Object value) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.opsForValue().set(key, value, configuration.getRedisTimeout(), TimeUnit.MINUTES);
        } catch (Exception e) {
            log.error("Error updating cache for key: {}", key, e);
        }
    }

    public Object getCache(String key) {
        if (redisTemplate == null) return null;
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("Error getting cache for key: {}", key, e);
            return null;
        }
    }

    public void deleteCache(String key) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Error deleting cache for key: {}", key, e);
        }
    }

    public void hset(String key, String field, Object value) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.opsForHash().put(key, field, value);
        } catch (Exception e) {
            log.error("Error setting hash field for key: {}, field: {}", key, field, e);
        }
    }

    public void hmset(String key, Map<String, Object> map) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.opsForHash().putAll(key, map);
        } catch (Exception e) {
            log.error("Error setting hash for key: {}", key, e);
        }
    }

    public Object hget(String key, String field) {
        if (redisTemplate == null) return null;
        try {
            return redisTemplate.opsForHash().get(key, field);
        } catch (Exception e) {
            log.error("Error getting hash field for key: {}, field: {}", key, field, e);
            return null;
        }
    }

    public Map<String, Object> hgetAll(String key) {
        if (redisTemplate == null) return Collections.emptyMap();
        try {
            Map<Object, Object> raw = redisTemplate.opsForHash().entries(key);
            Map<String, Object> result = new LinkedHashMap<>();
            raw.forEach((k, v) -> result.put(String.valueOf(k), v));
            return result;
        } catch (Exception e) {
            log.error("Error getting all hash fields for key: {}", key, e);
            return Collections.emptyMap();
        }
    }

    public List<Object> lrange(String key, long start, long end) {
        if (redisTemplate == null) return Collections.emptyList();
        try {
            List<Object> result = redisTemplate.opsForList().range(key, start, end);
            return result != null ? result : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error reading list for key: {}", key, e);
            return Collections.emptyList();
        }
    }
}
