package org.egov.inbox.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.inbox.config.InboxConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final InboxConfiguration inboxConfiguration;

    public CacheService(RedisTemplate<String, Object> redisTemplate, InboxConfiguration inboxConfiguration) {
        this.redisTemplate = redisTemplate;
        this.inboxConfiguration = inboxConfiguration;
    }

    public void updateCache(String key, Object value) {
        redisTemplate.opsForValue().set(key, value, inboxConfiguration.getRedisTimeout(), TimeUnit.MINUTES);
    }

    public Object getCache(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteCache(String key) {
        redisTemplate.delete(key);
    }
}
