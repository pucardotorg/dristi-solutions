package org.egov.healthdashboard.repository;

import org.egov.healthdashboard.repository.ServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceRepositoryTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private ServiceRepository serviceRepository;

    @BeforeEach
    void setUp() {
        serviceRepository = new ServiceRepository(jdbcTemplate);
    }

    @Test
    void resolveServiceId_returnsIdFromJdbcTemplate() {
        when(jdbcTemplate.queryForObject(
                eq("SELECT id FROM eg_service_health WHERE service_name = ?"),
                eq(Long.class),
                eq("ESIGN")))
                .thenReturn(1L);

        Long id = serviceRepository.resolveServiceId("ESIGN");

        assertThat(id).isEqualTo(1L);
        verify(jdbcTemplate).queryForObject(
                "SELECT id FROM eg_service_health WHERE service_name = ?", Long.class, "ESIGN");
    }
}
