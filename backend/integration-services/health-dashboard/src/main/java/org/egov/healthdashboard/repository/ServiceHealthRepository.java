package org.egov.healthdashboard.repository;

import lombok.extern.slf4j.Slf4j;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
@Slf4j
public class ServiceHealthRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ServiceHealthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void upsert(ServiceHealthStatus status) {
        String sql = "INSERT INTO eg_service_health_status " +
                "(service_name, service_url, last_status, last_updated_time, response_time_ms, message) " +
                "VALUES (?, ?, ?, ?, ?, ?) " +
                "ON CONFLICT (service_name) DO UPDATE SET " +
                "service_url = EXCLUDED.service_url, " +
                "last_status = EXCLUDED.last_status, " +
                "last_updated_time = EXCLUDED.last_updated_time, " +
                "response_time_ms = EXCLUDED.response_time_ms, " +
                "message = EXCLUDED.message";

        jdbcTemplate.update(sql,
                status.getServiceName(),
                status.getServiceUrl(),
                status.getLastStatus(),
                status.getLastUpdatedTime(),
                status.getResponseTimeMs(),
                status.getMessage());

        log.info("Upserted health status: service={}, status={}, responseTime={}ms",
                status.getServiceName(), status.getLastStatus(), status.getResponseTimeMs());
    }

    public List<ServiceHealthStatus> findAll() {
        String sql = "SELECT DISTINCT ON (service_name) id, service_name, service_url, last_status, last_updated_time, response_time_ms, message " +
                "FROM eg_service_health_status " +
                "ORDER BY service_name, last_updated_time DESC NULLS LAST";
        return jdbcTemplate.query(sql, new ServiceHealthRowMapper());
    }

    public ServiceHealthStatus findByServiceName(String serviceName) {
        String sql = "SELECT id, service_name, service_url, last_status, last_updated_time, response_time_ms, message " +
                "FROM eg_service_health_status WHERE service_name = ?";
        List<ServiceHealthStatus> results = jdbcTemplate.query(sql, new ServiceHealthRowMapper(), serviceName);
        return results.isEmpty() ? null : results.get(0);
    }

    private static class ServiceHealthRowMapper implements RowMapper<ServiceHealthStatus> {
        @Override
        public ServiceHealthStatus mapRow(ResultSet rs, int rowNum) throws SQLException {
            return ServiceHealthStatus.builder()
                    .id(rs.getLong("id"))
                    .serviceName(rs.getString("service_name"))
                    .serviceUrl(rs.getString("service_url"))
                    .lastStatus(rs.getString("last_status"))
                    .lastUpdatedTime(rs.getLong("last_updated_time"))
                    .responseTimeMs(rs.getLong("response_time_ms"))
                    .message(rs.getString("message"))
                    .build();
        }
    }
}