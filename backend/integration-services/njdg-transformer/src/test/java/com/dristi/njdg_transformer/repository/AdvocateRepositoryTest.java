package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdvocateRepositoryTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private AdvocateRepository advocateRepository;

    private AdvocateDetails advocateDetails;

    @BeforeEach
    void setUp() {
        advocateDetails = new AdvocateDetails();
        advocateDetails.setAdvocateId("ADV-001");
        advocateDetails.setAdvocateCode(1);
        advocateDetails.setAdvocateName("John Doe");
        advocateDetails.setBarRegNo("BAR-001");
        advocateDetails.setEmail("john.doe@example.com");
        advocateDetails.setPhone("9876543210");
        advocateDetails.setAddress("Test Address");
        advocateDetails.setDob(LocalDate.of(1990, 1, 1));
    }

    @Test
    void testGetAdvocateDetails_Success() {
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), 
                any(BeanPropertyRowMapper.class))).thenReturn(advocateDetails);

        AdvocateDetails result = advocateRepository.getAdvocateDetails("ADV-001");

        assertNotNull(result);
        assertEquals("ADV-001", result.getAdvocateId());
        assertEquals("John Doe", result.getAdvocateName());
    }

    @Test
    void testGetAdvocateDetails_NotFound() {
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), 
                any(BeanPropertyRowMapper.class))).thenThrow(new EmptyResultDataAccessException(1));

        AdvocateDetails result = advocateRepository.getAdvocateDetails("UNKNOWN");

        assertNull(result);
    }

    @Test
    void testGetAllAdvocates_Success() {
        AdvocateDetails advocate1 = new AdvocateDetails();
        advocate1.setAdvocateId("ADV-001");
        advocate1.setAdvocateCode(1);

        AdvocateDetails advocate2 = new AdvocateDetails();
        advocate2.setAdvocateId("ADV-002");
        advocate2.setAdvocateCode(2);

        when(jdbcTemplate.query(anyString(), any(BeanPropertyRowMapper.class)))
                .thenReturn(List.of(advocate1, advocate2));

        List<AdvocateDetails> result = advocateRepository.getAllAdvocates();

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void testGetAllAdvocates_Empty() {
        when(jdbcTemplate.query(anyString(), any(BeanPropertyRowMapper.class)))
                .thenReturn(Collections.emptyList());

        List<AdvocateDetails> result = advocateRepository.getAllAdvocates();

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testInsertAdvocateDetails_Success() {
        when(jdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1);

        assertDoesNotThrow(() -> advocateRepository.insertAdvocateDetails(advocateDetails));
        verify(jdbcTemplate).update(anyString(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testInsertAdvocateDetails_WithNullFields() {
        advocateDetails.setEmail(null);
        advocateDetails.setPhone(null);
        advocateDetails.setAddress(null);
        advocateDetails.setDob(null);

        when(jdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1);

        assertDoesNotThrow(() -> advocateRepository.insertAdvocateDetails(advocateDetails));
    }

    @Test
    void testUpdateAdvocateDetails_Success() {
        when(jdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1);

        assertDoesNotThrow(() -> advocateRepository.updateAdvocateDetails(advocateDetails));
        verify(jdbcTemplate).update(anyString(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testUpdateAdvocateDetails_NoRowsAffected() {
        when(jdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(0);

        assertDoesNotThrow(() -> advocateRepository.updateAdvocateDetails(advocateDetails));
    }

    @Test
    void testUpdateAdvocateDetails_WithAllFields() {
        advocateDetails.setAdvocateName("Updated Name");
        advocateDetails.setEmail("updated@example.com");
        advocateDetails.setPhone("1234567890");
        advocateDetails.setAddress("Updated Address");
        advocateDetails.setDob(LocalDate.of(1985, 5, 15));

        when(jdbcTemplate.update(anyString(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(1);

        assertDoesNotThrow(() -> advocateRepository.updateAdvocateDetails(advocateDetails));
    }
}
