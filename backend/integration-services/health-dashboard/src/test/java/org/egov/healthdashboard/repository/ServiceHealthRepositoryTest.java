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
import java.sql.SQLException;
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
    void insert_resolvesServiceIdAndInsertsHealthStatus() {
        ServiceHealthStatus status = ServiceHealthStatus.builder()
                .serviceName("SMS")
                .lastStatus("UP")
                .lastUpdatedTime(1000L)
                .responseTimeMs(50L)
                .message("HTTP 200")
                .build();
        when(serviceRepository.resolveServiceId("SMS")).thenReturn(42L);

        serviceHealthRepository.insert(status);

        verify(serviceRepository).resolveServiceId("SMS");
        verify(jdbcTemplate).update(
                eq("INSERT INTO eg_service_health_status " +
                        "(service_id, last_status, last_updated_time, response_time_ms, message) " +
                        "VALUES (?, ?, ?, ?, ?)"),
                eq(42L), eq("UP"), eq(1000L), eq(50L), eq("HTTP 200"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void findAll_returnsListProducedByJdbcTemplate() {
        List<ServiceHealthStatus> expected = Collections.singletonList(
                ServiceHealthStatus.builder().serviceName("ESIGN").build());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class))).thenReturn(expected);

        List<ServiceHealthStatus> result = serviceHealthRepository.findAll();

        assertThat(result).isEqualTo(expected);
        verify(jdbcTemplate).query(
                eq("SELECT DISTINCT ON (s.id) h.id, s.service_name, s.service_url, h.last_status, " +
                        "h.last_updated_time, h.response_time_ms, h.message " +
                        "FROM eg_service_health_status h JOIN eg_service_health s ON s.id = h.service_id " +
                        "ORDER BY s.id, h.last_updated_time DESC NULLS LAST"),
                any(RowMapper.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void findAll_rowMapperMapsResultSetColumnsToFields() throws SQLException {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class))).thenReturn(Collections.emptyList());
        ArgumentCaptor<RowMapper<ServiceHealthStatus>> captor = ArgumentCaptor.forClass(RowMapper.class);

        serviceHealthRepository.findAll();

        verify(jdbcTemplate).query(anyString(), captor.capture());
        stubResultSetRow();

        ServiceHealthStatus mapped = captor.getValue().mapRow(resultSet, 0);

        assertMappedRow(mapped);
    }

    @Test
    @SuppressWarnings("unchecked")
    void findByServiceName_returnsFirstResult_whenFound() {
        ServiceHealthStatus expected = ServiceHealthStatus.builder().serviceName("TREASURY").build();
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq("TREASURY")))
                .thenReturn(Collections.singletonList(expected));

        ServiceHealthStatus result = serviceHealthRepository.findByServiceName("TREASURY");

        assertThat(result).isEqualTo(expected);
    }

    @Test
    @SuppressWarnings("unchecked")
    void findByServiceName_returnsNull_whenNoResults() {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq("UNKNOWN")))
                .thenReturn(Collections.emptyList());

        ServiceHealthStatus result = serviceHealthRepository.findByServiceName("UNKNOWN");

        assertThat(result).isNull();
    }

    @Test
    @SuppressWarnings("unchecked")
    void findByServiceName_rowMapperMapsResultSetColumnsToFields() throws SQLException {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq("ICOPS")))
                .thenReturn(Collections.emptyList());
        ArgumentCaptor<RowMapper<ServiceHealthStatus>> captor = ArgumentCaptor.forClass(RowMapper.class);

        serviceHealthRepository.findByServiceName("ICOPS");

        verify(jdbcTemplate).query(anyString(), captor.capture(), eq("ICOPS"));
        stubResultSetRow();

        ServiceHealthStatus mapped = captor.getValue().mapRow(resultSet, 0);

        assertMappedRow(mapped);
    }

    private void stubResultSetRow() throws SQLException {
        when(resultSet.getLong("id")).thenReturn(7L);
        when(resultSet.getString("service_name")).thenReturn("ESIGN");
        when(resultSet.getString("service_url")).thenReturn("tcp://esignservice.cdac.in:443");
        when(resultSet.getString("last_status")).thenReturn("UP");
        when(resultSet.getLong("last_updated_time")).thenReturn(123456789L);
        when(resultSet.getLong("response_time_ms")).thenReturn(75L);
        when(resultSet.getString("message")).thenReturn("TCP connection successful");
    }

    private void assertMappedRow(ServiceHealthStatus mapped) {
        assertThat(mapped.getId()).isEqualTo(7L);
        assertThat(mapped.getServiceName()).isEqualTo("ESIGN");
        assertThat(mapped.getServiceUrl()).isEqualTo("tcp://esignservice.cdac.in:443");
        assertThat(mapped.getLastStatus()).isEqualTo("UP");
        assertThat(mapped.getLastUpdatedTime()).isEqualTo(123456789L);
        assertThat(mapped.getResponseTimeMs()).isEqualTo(75L);
        assertThat(mapped.getMessage()).isEqualTo("TCP connection successful");
    }
}
