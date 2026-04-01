package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.CtcApplication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class CacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private Configuration config;

    @Autowired
    private ObjectMapper objectMapper;

    public void save(String id, Object value) {
        log.info("Saving data to redis with key :: {}", id);
        redisTemplate.opsForValue().set(id, value, config.getRedisTimeout(), TimeUnit.MINUTES);
    }

    public Object findById(String id) {
        return redisTemplate.opsForValue().get(id);
    }

    public void delete(String id) {
        redisTemplate.delete(id);
    }

    public void saveInRedisCache(CtcApplication application) {
        try {
            if (application.getCtcApplicationNumber() != null) {
                save(getRedisKey(application.getCtcApplicationNumber()), application);
                log.info("Saved CTC application in Redis cache: {}", application.getCtcApplicationNumber());
            }
        } catch (Exception e) {
            log.error("Error saving CTC application to Redis cache: {}", e.getMessage());
        }
    }

    public CtcApplication searchRedisCache(String ctcApplicationNumber) {
        try {
            Object value = findById(getRedisKey(ctcApplicationNumber));
            if (value != null) {
                String json = objectMapper.writeValueAsString(value);
                return objectMapper.readValue(json, CtcApplication.class);
            }
            return null;
        } catch (JsonProcessingException e) {
            log.error("Error reading CTC application from Redis cache: {}", e.getMessage());
            return null;
        }
    }

    private String getRedisKey(String ctcApplicationNumber) {
        return "ctc:" + ctcApplicationNumber;
    }

}
