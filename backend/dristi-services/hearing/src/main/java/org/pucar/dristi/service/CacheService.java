package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Configuration configuration;

    public CacheService(RedisTemplate<String, Object> redisTemplate, Configuration configuration) {
        this.redisTemplate = redisTemplate;
        this.configuration = configuration;
    }

    public void updateCache(String key, Object value) {
        redisTemplate.opsForValue().set(key, value, configuration.getRedisTimeout(), TimeUnit.MINUTES);
    }

    public Object getCache(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteCache(String key) {
        redisTemplate.delete(key);
    }
}
