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
    private final ServiceRepository serviceRepository;

    private static final String SELECT_COLUMNS =
            "h.id, s.service_name, s.service_url, h.last_status, h.last_updated_time, h.response_time_ms, h.message";
    private static final String FROM_JOIN =
            "FROM eg_service_health_status h JOIN eg_service s ON s.id = h.service_id ";

    @Autowired
    public ServiceHealthRepository(JdbcTemplate jdbcTemplate, ServiceRepository serviceRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.serviceRepository = serviceRepository;
    }

    public void insert(ServiceHealthStatus status) {
        Long serviceId = serviceRepository.resolveServiceId(status.getServiceName());

        String sql = "INSERT INTO eg_service_health_status " +
                "(service_id, last_status, last_updated_time, response_time_ms, message) " +
                "VALUES (?, ?, ?, ?, ?)";

        jdbcTemplate.update(sql,
                serviceId,
                status.getLastStatus(),
                status.getLastUpdatedTime(),
                status.getResponseTimeMs(),
                status.getMessage());

        log.info("Inserted health status: service={}, status={}, responseTime={}ms",
                status.getServiceName(), status.getLastStatus(), status.getResponseTimeMs());
    }

    public List<ServiceHealthStatus> findAll() {
        String sql = "SELECT DISTINCT ON (s.id) " + SELECT_COLUMNS + " " + FROM_JOIN +
                "ORDER BY s.id, h.last_updated_time DESC NULLS LAST";
        return jdbcTemplate.query(sql, new ServiceHealthRowMapper());
    }

    public ServiceHealthStatus findByServiceName(String serviceName) {
        String sql = "SELECT " + SELECT_COLUMNS + " " + FROM_JOIN +
                "WHERE s.service_name = ? " +
                "ORDER BY h.last_updated_time DESC NULLS LAST LIMIT 1";
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