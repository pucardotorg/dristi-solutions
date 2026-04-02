package digit.service;

import digit.config.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

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
}
