package org.egov.healthdashboard.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@Slf4j
public class ServiceRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ServiceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * eg_service rows are seeded once by the Flyway migration, so this is a
     * read-only lookup, cached after the first hit per service name.
     */
    public Long resolveServiceId(String serviceName) {
        return jdbcTemplate.queryForObject(
                        "SELECT id FROM eg_service WHERE service_name = ?", Long.class, serviceName);
    }
}