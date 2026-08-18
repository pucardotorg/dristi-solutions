package digit.util;

import digit.config.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

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
}


