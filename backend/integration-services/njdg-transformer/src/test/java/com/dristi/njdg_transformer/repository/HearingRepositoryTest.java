package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.repository.querybuilder.HearingQueryBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doReturn;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HearingRepositoryTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private HearingQueryBuilder hearingQueryBuilder;

    @InjectMocks
    private HearingRepository hearingRepository;

    private HearingDetails hearingDetails;
    private Hearing hearing;

    @BeforeEach
    void setUp() {
        hearingDetails = new HearingDetails();
        hearingDetails.setCino("CNR-001");
        hearingDetails.setHearingId("H-001");
        hearingDetails.setSrNo(1);
        hearingDetails.setHearingDate(LocalDate.now());
        hearingDetails.setNextDate(LocalDate.now().plusDays(7));
        hearingDetails.setPurposeOfListing("5");
        hearingDetails.setDesgName("JUDICIAL_MAGISTRATE");
        hearingDetails.setJudgeCode("JC-001");
        hearingDetails.setJoCode("JO-001");
        hearingDetails.setDesgCode("DC-001");
        hearingDetails.setBusiness("Test Business");
        hearingDetails.setCourtNo(1);

        hearing = new Hearing();
        hearing.setHearingId("H-001");
        hearing.setHearingType("EVIDENCE");
    }

    @Test
    void testGetHearingDetailsByCino_Success() {
        when(hearingQueryBuilder.getHearingQuery()).thenReturn("SELECT * FROM hearings WHERE cino = ?");
        doReturn(Collections.singletonList(hearingDetails))
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<HearingDetails> result = hearingRepository.getHearingDetailsByCino("CNR-001");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CNR-001", result.get(0).getCino());
    }

    @Test
    void testGetHearingDetailsByCino_Empty() {
        when(hearingQueryBuilder.getHearingQuery()).thenReturn("SELECT * FROM hearings WHERE cino = ?");
        doReturn(Collections.emptyList())
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<HearingDetails> result = hearingRepository.getHearingDetailsByCino("CNR-001");

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testInsertHearingDetails_Success() {
        when(hearingQueryBuilder.getHearingInsertQuery()).thenReturn("INSERT INTO hearings VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> hearingRepository.insertHearingDetails(hearingDetails));
        verify(jdbcTemplate).update(anyString(), any(Object[].class), any(int[].class));
    }

    @Test
    void testInsertHearingDetails_WithAllFields() {
        hearingDetails.setNextDate(LocalDate.now().plusDays(14));
        hearingDetails.setBusiness("Updated Business");

        when(hearingQueryBuilder.getHearingInsertQuery()).thenReturn("INSERT INTO hearings VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> hearingRepository.insertHearingDetails(hearingDetails));
    }

    @Test
    void testGetHearingPurposeCode_Success() {
        when(hearingQueryBuilder.getHearingPurposeQuery()).thenReturn("SELECT purpose_code FROM hearing_purpose WHERE type = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenReturn(5);

        Integer result = hearingRepository.getHearingPurposeCode(hearing);

        assertEquals(5, result);
    }

    @Test
    void testGetHearingPurposeCode_NotFound() {
        when(hearingQueryBuilder.getHearingPurposeQuery()).thenReturn("SELECT purpose_code FROM hearing_purpose WHERE type = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenThrow(new EmptyResultDataAccessException(1));

        Integer result = hearingRepository.getHearingPurposeCode(hearing);

        assertEquals(0, result);
    }

    @Test
    void testGetHearingPurposeCode_Exception() {
        when(hearingQueryBuilder.getHearingPurposeQuery()).thenReturn("SELECT purpose_code FROM hearing_purpose WHERE type = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenThrow(new RuntimeException("Database error"));

        Integer result = hearingRepository.getHearingPurposeCode(hearing);

        assertEquals(0, result);
    }

    @Test
    void testUpdateHearingDetails_Success() {
        when(hearingQueryBuilder.getHearingUpdateQuery()).thenReturn("UPDATE hearings SET ... WHERE cino = ? AND sr_no = ?");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> hearingRepository.updateHearingDetails(hearingDetails));
        verify(jdbcTemplate).update(anyString(), any(Object[].class), any(int[].class));
    }

    @Test
    void testUpdateHearingDetails_WithNullFields() {
        hearingDetails.setNextDate(null);
        hearingDetails.setBusiness(null);

        when(hearingQueryBuilder.getHearingUpdateQuery()).thenReturn("UPDATE hearings SET ... WHERE cino = ? AND sr_no = ?");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> hearingRepository.updateHearingDetails(hearingDetails));
    }

    @Test
    void testUpdateHearingDetails_NoRowsAffected() {
        when(hearingQueryBuilder.getHearingUpdateQuery()).thenReturn("UPDATE hearings SET ... WHERE cino = ? AND sr_no = ?");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(0);

        assertDoesNotThrow(() -> hearingRepository.updateHearingDetails(hearingDetails));
    }

    @Test
    void testGetHearingDetailsByCino_MultipleRecords() {
        HearingDetails hearing1 = new HearingDetails();
        hearing1.setCino("CNR-001");
        hearing1.setSrNo(1);
        
        HearingDetails hearing2 = new HearingDetails();
        hearing2.setCino("CNR-001");
        hearing2.setSrNo(2);

        when(hearingQueryBuilder.getHearingQuery()).thenReturn("SELECT * FROM hearings WHERE cino = ?");
        doReturn(List.of(hearing1, hearing2))
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<HearingDetails> result = hearingRepository.getHearingDetailsByCino("CNR-001");

        assertNotNull(result);
        assertEquals(2, result.size());
    }
}
