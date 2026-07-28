package org.egov.healthdashboard.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
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
    void resolveServiceId_returnsId_whenServiceExists() {
        when(jdbcTemplate.queryForObject("SELECT id FROM eg_service_health WHERE service_name = ?", Long.class, "ESIGN"))
                .thenReturn(1L);

        Long id = serviceRepository.resolveServiceId("ESIGN");

        assertThat(id).isEqualTo(1L);
        verify(jdbcTemplate).queryForObject("SELECT id FROM eg_service_health WHERE service_name = ?", Long.class, "ESIGN");
    }

    @Test
    void resolveServiceId_propagatesException_whenServiceDoesNotExist() {
        when(jdbcTemplate.queryForObject("SELECT id FROM eg_service_health WHERE service_name = ?", Long.class, "UNKNOWN"))
                .thenThrow(new org.springframework.dao.EmptyResultDataAccessException(1));

        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.EmptyResultDataAccessException.class,
                () -> serviceRepository.resolveServiceId("UNKNOWN"));
    }
}