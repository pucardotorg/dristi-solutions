package pucar.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;

import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class CacheUtil {

    private final RedisTemplate<String, Object> redisTemplate;

    private final Configuration config;
    public CacheUtil(RedisTemplate<String, Object> redisTemplate, Configuration config) {
        this.redisTemplate = redisTemplate;
        this.config = config;
    }

    public void save(String key, Object value) {
        log.info("Sending data to redis with key:: {}", key);
        redisTemplate.opsForValue().set(key, value, config.getRedisTimeout(), TimeUnit.MINUTES);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public Object findById(String key) {
        log.info("Fetching from cache with key :: {}", key);
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Updates a single field of a Redis hash, but only if the hash already exists.
     * The cause-list hash is warmed by scheduler-svc; we never create a fresh hash here,
     * we only keep an existing one in sync so ES remains the source of truth for absent entries.
     */
    public void updateHashFieldIfPresent(String key, String field, Object value) {
        try {
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                redisTemplate.opsForHash().put(key, field, value);
                log.info("Updated hash field {} for key {}", field, key);
            } else {
                log.info("Hash key {} not present in cache, skipping field {} update", key, field);
            }
        } catch (Exception e) {
            log.error("Error updating hash field {} for key {}", field, key, e);
        }
    }
}


