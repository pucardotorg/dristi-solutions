package org.egov.healthdashboard.repository;

import org.egov.healthdashboard.repository.ServiceHealthRepository;
import org.egov.healthdashboard.repository.ServiceRepository;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceHealthRepositoryTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private ResultSet resultSet;

    private ServiceHealthRepository serviceHealthRepository;

    @BeforeEach
    void setUp() {
        serviceHealthRepository = new ServiceHealthRepository(jdbcTemplate, serviceRepository);
    }

    @Test
    void insert_resolvesServiceIdAndPersistsStatus() {
        ServiceHealthStatus status = ServiceHealthStatus.builder()
                .serviceName("ESIGN")
                .lastStatus("UP")
                .lastUpdatedTime(1000L)
                .responseTimeMs(50L)
                .message("ok")
                .build();
        when(serviceRepository.resolveServiceId("ESIGN")).thenReturn(7L);

        serviceHealthRepository.insert(status);

        verify(jdbcTemplate).update(
                eq("INSERT INTO eg_service_health_status " +
                        "(service_id, last_status, last_updated_time, response_time_ms, message) " +
                        "VALUES (?, ?, ?, ?, ?)"),
                eq(7L), eq("UP"), eq(1000L), eq(50L), eq("ok"));
    }

    @Test
    void findAll_returnsResultsFromJdbcTemplate() {
        List<ServiceHealthStatus> expected = Collections.singletonList(
                ServiceHealthStatus.builder().serviceName("ESIGN").lastStatus("UP").build());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class))).thenReturn(expected);

        List<ServiceHealthStatus> result = serviceHealthRepository.findAll();

        assertThat(result).isEqualTo(expected);
        verify(jdbcTemplate).query(
                eq("SELECT DISTINCT ON (s.id) h.id, s.service_name, s.service_url, h.last_status, " +
                        "h.last_updated_time, h.response_time_ms, h.message " +
                        "FROM eg_service_health_status h JOIN eg_service s ON s.id = h.service_id " +
                        "ORDER BY s.id, h.last_updated_time DESC NULLS LAST"),
                any(RowMapper.class));
    }

    @Test
    void findAll_rowMapperMapsAllColumns() throws Exception {
        when(resultSet.getLong("id")).thenReturn(1L);
        when(resultSet.getString("service_name")).thenReturn("ESIGN");
        when(resultSet.getString("last_status")).thenReturn("UP");
        when(resultSet.getLong("last_updated_time")).thenReturn(1000L);
        when(resultSet.getLong("response_time_ms")).thenReturn(50L);
        when(resultSet.getString("message")).thenReturn("ok");

        ArgumentCaptor<RowMapper> rowMapperCaptor = ArgumentCaptor.forClass(RowMapper.class);
        when(jdbcTemplate.query(anyString(), rowMapperCaptor.capture())).thenReturn(Collections.emptyList());
        serviceHealthRepository.findAll();

        ServiceHealthStatus mapped = (ServiceHealthStatus) rowMapperCaptor.getValue().mapRow(resultSet, 0);

        assertThat(mapped.getId()).isEqualTo(1L);
        assertThat(mapped.getServiceName()).isEqualTo("ESIGN");
        assertThat(mapped.getLastStatus()).isEqualTo("UP");
        assertThat(mapped.getLastUpdatedTime()).isEqualTo(1000L);
        assertThat(mapped.getResponseTimeMs()).isEqualTo(50L);
        assertThat(mapped.getMessage()).isEqualTo("ok");
    }

    @Test
    void findByServiceName_returnsFirstResult_whenPresent() {
        ServiceHealthStatus expected = ServiceHealthStatus.builder().serviceName("ESIGN").lastStatus("UP").build();
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq("ESIGN")))
                .thenReturn(Collections.singletonList(expected));

        ServiceHealthStatus result = serviceHealthRepository.findByServiceName("ESIGN");

        assertThat(result).isEqualTo(expected);
        verify(jdbcTemplate).query(
                eq("SELECT h.id, s.service_name, s.service_url, h.last_status, h.last_updated_time, " +
                        "h.response_time_ms, h.message " +
                        "FROM eg_service_health_status h JOIN eg_service s ON s.id = h.service_id " +
                        "WHERE s.service_name = ? " +
                        "ORDER BY h.last_updated_time DESC NULLS LAST LIMIT 1"),
                any(RowMapper.class), eq("ESIGN"));
    }

    @Test
    void findByServiceName_returnsNull_whenNoResults() {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        ServiceHealthStatus result = serviceHealthRepository.findByServiceName("UNKNOWN");

        assertThat(result).isNull();
    }
}