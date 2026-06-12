package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import org.springframework.data.redis.serializer.RedisSerializer;

import java.nio.charset.StandardCharsets;
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

    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Map<String, Object>> lrangeAndHGetAll(String listKey) {
        if (redisTemplate == null) return Collections.emptyList();
        try {
            String lua =
                "local ks = redis.call('LRANGE', KEYS[1], 0, -1)\n" +
                "if #ks == 0 then return {} end\n" +
                "local out = {}\n" +
                "for _, k in ipairs(ks) do\n" +
                "  table.insert(out, redis.call('HGETALL', k))\n" +
                "end\n" +
                "return out";
            DefaultRedisScript<List> script = new DefaultRedisScript<>(lua, List.class);
            List raw = redisTemplate.execute(script, Collections.singletonList(listKey));
            if (raw == null || raw.isEmpty()) return Collections.emptyList();

            RedisSerializer valSer = redisTemplate.getHashValueSerializer();
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object item : raw) {
                if (!(item instanceof List)) continue;
                List pairs = (List) item;
                Map<String, Object> map = new LinkedHashMap<>();
                for (int i = 0; i + 1 < pairs.size(); i += 2) {
                    String field = new String((byte[]) pairs.get(i), StandardCharsets.UTF_8);
                    Object val = valSer.deserialize((byte[]) pairs.get(i + 1));
                    map.put(field, val);
                }
                if (!map.isEmpty()) result.add(map);
            }
            return result;
        } catch (Exception e) {
            log.error("Error in lrangeAndHGetAll for key: {}", listKey, e);
            return Collections.emptyList();
        }
    }

    public boolean tryLock(String key, int timeoutSeconds) {
        if (redisTemplate == null) return true;
        try {
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, "1", timeoutSeconds, TimeUnit.SECONDS);
            return Boolean.TRUE.equals(acquired);
        } catch (Exception e) {
            log.error("Error acquiring lock for key: {}", key, e);
            return false;
        }
    }

    public void releaseLock(String key) {
        if (redisTemplate == null) return;
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Error releasing lock for key: {}", key, e);
        }
    }

    public List<Map<String, Object>> hgetAllPipelined(List<String> keys) {
        if (redisTemplate == null || keys == null || keys.isEmpty()) return Collections.emptyList();
        try {
            List<Object> raw = redisTemplate.executePipelined((org.springframework.data.redis.core.RedisCallback<Object>) connection -> {
                for (String key : keys) {
                    @SuppressWarnings("unchecked")
                    byte[] rawKey = ((RedisSerializer<String>) redisTemplate.getKeySerializer()).serialize(key);
                    connection.hashCommands().hGetAll(rawKey);
                }
                return null;
            });
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object entry : raw) {
                Map<String, Object> converted = new LinkedHashMap<>();
                if (entry instanceof Map) {
                    ((Map<?, ?>) entry).forEach((k, v) -> converted.put(String.valueOf(k), v));
                }
                result.add(converted);
            }
            return result;
        } catch (Exception e) {
            log.error("Error in pipelined hgetAll for {} keys", keys.size(), e);
            return Collections.emptyList();
        }
    }
}
