package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class CacheService {

    // Static scripts: SHA1 computed once at class-load; Spring uses EVALSHA on every call.
    // List/hash values are Jackson-serialized (JSON-quoted). List keys used as Redis keys must
    // have their outer quotes stripped before passing to HGETALL/HGET (keys use StringRedisSerializer).

    @SuppressWarnings("rawtypes")
    private static final DefaultRedisScript<List> LRANGE_HGETALL_SCRIPT = new DefaultRedisScript<>(
        "local ks = redis.call('LRANGE', KEYS[1], 0, -1)\n" +
        "if #ks == 0 then return {} end\n" +
        "local out = {}\n" +
        "for _, k_raw in ipairs(ks) do\n" +
        "  table.insert(out, redis.call('HGETALL', string.sub(k_raw, 2, -2)))\n" +
        "end\n" +
        "return out",
        List.class);

    // Fetches court meta and the current hearing hash atomically.
    // Returns [] on meta miss, {meta_flat, []} when no active hearing, {meta_flat, hearing_flat} otherwise.
    @SuppressWarnings("rawtypes")
    private static final DefaultRedisScript<List> META_CURRENT_HEARING_SCRIPT = new DefaultRedisScript<>(
        "local meta = redis.call('HGETALL', KEYS[1])\n" +
        "if #meta == 0 then return {} end\n" +
        "local currentKey = ''\n" +
        "for i = 1, #meta - 1, 2 do\n" +
        "  if meta[i] == 'currentHearingKey' then\n" +
        "    currentKey = string.sub(meta[i+1], 2, -2)\n" +
        "    break\n" +
        "  end\n" +
        "end\n" +
        "if currentKey == '' then return {meta, {}} end\n" +
        "return {meta, redis.call('HGETALL', currentKey)}\n",
        List.class);

    // Finds a specific hearing and its next pending hearing without loading all N hearings.
    // ARGV[1] = currentHearingNumber (Jackson-serialized string, i.e. with surrounding JSON quotes).
    // Compares raw HGET value directly against ARGV[1] — both are Jackson-serialized.
    // Returns {{}, {}} on list miss, {currentData_flat, {}} when no next found.
    @SuppressWarnings("rawtypes")
    private static final DefaultRedisScript<List> FIND_CURRENT_NEXT_SCRIPT = new DefaultRedisScript<>(
        "local ks = redis.call('LRANGE', KEYS[1], 0, -1)\n" +
        "if #ks == 0 then return {{}, {}} end\n" +
        "local found = false\n" +
        "local currentData = {}\n" +
        "local nextKey = ''\n" +
        "for _, k_raw in ipairs(ks) do\n" +
        "  local k = string.sub(k_raw, 2, -2)\n" +
        "  if not found then\n" +
        "    if redis.call('HGET', k, 'hearingNumber') == ARGV[1] then\n" +
        "      found = true\n" +
        "      currentData = redis.call('HGETALL', k)\n" +
        "    end\n" +
        "  else\n" +
        "    local s = redis.call('HGET', k, 'status')\n" +
        "    if s and s ~= '\"\"' and s ~= '\"COMPLETED\"' and s ~= '\"ABATED\"' and s ~= '\"OPT_OUT\"' then\n" +
        "      nextKey = k\n" +
        "      break\n" +
        "    end\n" +
        "  end\n" +
        "end\n" +
        "if nextKey == '' then return {currentData, {}} end\n" +
        "return {currentData, redis.call('HGETALL', nextKey)}\n",
        List.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final Configuration configuration;

    public CacheService(@Autowired(required = false) RedisTemplate<String, Object> redisTemplate,
                        Configuration configuration) {
        this.redisTemplate = redisTemplate;
        this.configuration = configuration;
    }

    // --- Simple key/value ---

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

    // --- Hash operations ---

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

    // --- List operations ---

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

    // --- Lua multi-fetch operations ---

    /** LRANGE the cause-list key and HGETALL every hearing in one round trip. */
    public List<Map<String, Object>> lrangeAndHGetAll(String listKey) {
        return lrangeAndHGetAll(listKey, false);
    }

    /**
     * Like {@link #lrangeAndHGetAll(String)} but when {@code includeEmpty} is true,
     * maps for keys whose hash has expired are included as empty maps (useful for
     * partial-miss detection in getCauseList).
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Map<String, Object>> lrangeAndHGetAll(String listKey, boolean includeEmpty) {
        if (redisTemplate == null) return Collections.emptyList();
        try {
            List raw = redisTemplate.execute(LRANGE_HGETALL_SCRIPT, Collections.singletonList(listKey));
            if (raw == null || raw.isEmpty()) return Collections.emptyList();
            RedisSerializer valSer = redisTemplate.getHashValueSerializer();
            List<Map<String, Object>> result = new ArrayList<>(raw.size());
            for (Object item : raw) {
                Map<String, Object> map = parseFlat(item, valSer);
                if (includeEmpty || !map.isEmpty()) result.add(map);
            }
            return result;
        } catch (Exception e) {
            log.error("Error in lrangeAndHGetAll for key: {}", listKey, e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetches court meta and the current hearing hash in one round trip.
     * Returns an empty list on meta cache miss; otherwise a two-element list
     * [metaMap, hearingMap] where hearingMap may be empty when no hearing is active.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Map<String, Object>> getMetaAndCurrentHearing(String metaKey) {
        if (redisTemplate == null) return Collections.emptyList();
        try {
            List raw = redisTemplate.execute(META_CURRENT_HEARING_SCRIPT, Collections.singletonList(metaKey));
            if (raw == null || raw.isEmpty()) return Collections.emptyList();
            RedisSerializer valSer = redisTemplate.getHashValueSerializer();
            List<Map<String, Object>> result = new ArrayList<>(raw.size());
            for (Object item : raw) result.add(parseFlat(item, valSer));
            return result;
        } catch (Exception e) {
            log.error("Error in getMetaAndCurrentHearing for key: {}", metaKey, e);
            return Collections.emptyList();
        }
    }

    /**
     * Finds {@code currentHearingNumber} in the cause list and its next pending hearing
     * using targeted HGET lookups — avoids loading all N hearings.
     * Returns a two-element list [currentMap, nextMap]; nextMap is empty when no next exists.
     * Returns an empty list on cause-list cache miss.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Map<String, Object>> findCurrentAndNextHearing(String causeListKey, String currentHearingNumber) {
        if (redisTemplate == null) return Collections.emptyList();
        try {
            List raw = redisTemplate.execute(FIND_CURRENT_NEXT_SCRIPT,
                    Collections.singletonList(causeListKey), currentHearingNumber);
            if (raw == null || raw.isEmpty()) return Collections.emptyList();
            RedisSerializer valSer = redisTemplate.getHashValueSerializer();
            List<Map<String, Object>> result = new ArrayList<>(raw.size());
            for (Object item : raw) result.add(parseFlat(item, valSer));
            return result;
        } catch (Exception e) {
            log.error("Error in findCurrentAndNextHearing for causeListKey={}", causeListKey, e);
            return Collections.emptyList();
        }
    }

    // --- Distributed lock ---

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

    // --- Internal helpers ---

    /** Deserializes a flat [field, value, field, value, ...] HGETALL result into a map. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private Map<String, Object> parseFlat(Object item, RedisSerializer valSer) {
        if (!(item instanceof List)) return Collections.emptyMap();
        List pairs = (List) item;
        if (pairs.isEmpty()) return Collections.emptyMap();
        Map<String, Object> map = new LinkedHashMap<>(pairs.size() / 2);
        for (int i = 0; i + 1 < pairs.size(); i += 2) {
            String field = new String((byte[]) pairs.get(i), StandardCharsets.UTF_8);
            Object val = valSer.deserialize((byte[]) pairs.get(i + 1));
            map.put(field, val);
        }
        return map;
    }
}
