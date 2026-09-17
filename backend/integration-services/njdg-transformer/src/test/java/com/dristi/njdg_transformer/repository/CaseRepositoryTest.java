package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.repository.querybuilder.CaseQueryBuilder;
import com.dristi.njdg_transformer.repository.rowmapper.NJDGTransformRecordRowMapper;
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
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
class CaseRepositoryTest {

    @Mock
    private CaseQueryBuilder queryBuilder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private CaseRepository caseRepository;

    private NJDGTransformRecord transformRecord;

    @BeforeEach
    void setUp() {
        transformRecord = new NJDGTransformRecord();
        transformRecord.setCino("CNR-001");
        transformRecord.setCaseType(1);
        transformRecord.setFilNo(1);
        transformRecord.setFilYear(2024);
    }

    @Test
    void testGetCaseTypeCode_Success() {
        when(queryBuilder.getCaseTypeQuery()).thenReturn("SELECT case_type_code FROM case_type WHERE name = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenReturn(1);

        Integer result = caseRepository.getCaseTypeCode("CMP");

        assertEquals(1, result);
    }

    @Test
    void testGetCaseTypeCode_NotFound() {
        when(queryBuilder.getCaseTypeQuery()).thenReturn("SELECT case_type_code FROM case_type WHERE name = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenThrow(new EmptyResultDataAccessException(1));

        Integer result = caseRepository.getCaseTypeCode("UNKNOWN");

        assertEquals(0, result);
    }

    @Test
    void testGetCaseTypeCode_Exception() {
        when(queryBuilder.getCaseTypeQuery()).thenReturn("SELECT case_type_code FROM case_type WHERE name = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenThrow(new RuntimeException("Database error"));

        Integer result = caseRepository.getCaseTypeCode("CMP");

        assertEquals(0, result);
    }

    @Test
    void testGetDisposalStatus_Success() {
        when(queryBuilder.getDisposalTypeQuery()).thenReturn("SELECT status_code FROM disposal_type WHERE outcome = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenReturn(10);

        Integer result = caseRepository.getDisposalStatus("CONVICTED");

        assertEquals(10, result);
    }

    @Test
    void testGetDisposalStatus_NotFound() {
        when(queryBuilder.getDisposalTypeQuery()).thenReturn("SELECT status_code FROM disposal_type WHERE outcome = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenThrow(new EmptyResultDataAccessException(1));

        Integer result = caseRepository.getDisposalStatus("UNKNOWN");

        assertEquals(0, result);
    }

    @Test
    void testGetDistrictCode_Success() {
        when(queryBuilder.getDistrictQuery()).thenReturn("SELECT district_code FROM district WHERE name = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenReturn(5);

        Integer result = caseRepository.getDistrictCode("KOLLAM");

        assertEquals(5, result);
    }

    @Test
    void testGetDistrictCode_NotFound_ReturnsDefault() {
        when(queryBuilder.getDistrictQuery()).thenReturn("SELECT district_code FROM district WHERE name = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenThrow(new EmptyResultDataAccessException(1));

        Integer result = caseRepository.getDistrictCode("UNKNOWN");

        assertEquals(2, result); // Default for Kollam
    }

    @Test
    void testGetPoliceStationDetails_Success() {
        PoliceStationDetails policeStation = new PoliceStationDetails();
        policeStation.setPoliceStationCode(1);
        policeStation.setStName("Test Station");

        when(queryBuilder.getPoliceStationQuery()).thenReturn("SELECT * FROM police_station WHERE code = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), 
                any(BeanPropertyRowMapper.class))).thenReturn(policeStation);

        PoliceStationDetails result = caseRepository.getPoliceStationDetails("PS-001");

        assertNotNull(result);
        assertEquals("Test Station", result.getStName());
    }

    @Test
    void testGetPoliceStationDetails_NotFound() {
        when(queryBuilder.getPoliceStationQuery()).thenReturn("SELECT * FROM police_station WHERE code = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), 
                any(BeanPropertyRowMapper.class))).thenThrow(new EmptyResultDataAccessException(1));

        PoliceStationDetails result = caseRepository.getPoliceStationDetails("UNKNOWN");

        assertNull(result);
    }

    @Test
    void testGetJudge_Success() {
        JudgeDetails judgeDetails = new JudgeDetails();
        judgeDetails.setJudgeCode(1);
        judgeDetails.setJocode("JO-001");

        when(queryBuilder.getJudgeMasterQuery()).thenReturn("SELECT * FROM judge_master WHERE ? BETWEEN from_date AND to_date");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), 
                any(BeanPropertyRowMapper.class))).thenReturn(Collections.singletonList(judgeDetails));

        List<JudgeDetails> result = caseRepository.getJudge(LocalDate.now());

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void testGetJudge_NotFound() {
        when(queryBuilder.getJudgeMasterQuery()).thenReturn("SELECT * FROM judge_master WHERE ? BETWEEN from_date AND to_date");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), 
                any(BeanPropertyRowMapper.class))).thenThrow(new EmptyResultDataAccessException(1));

        List<JudgeDetails> result = caseRepository.getJudge(LocalDate.now());

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testFindByCino_Success() {
        when(queryBuilder.getCaseQuery(anyString(), anyList(), anyList())).thenReturn("SELECT * FROM cases WHERE cino = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), 
                any(NJDGTransformRecordRowMapper.class))).thenReturn(transformRecord);

        NJDGTransformRecord result = caseRepository.findByCino("CNR-001");

        assertNotNull(result);
        assertEquals("CNR-001", result.getCino());
    }

    @Test
    void testFindByCino_NotFound() {
        when(queryBuilder.getCaseQuery(anyString(), anyList(), anyList())).thenReturn("SELECT * FROM cases WHERE cino = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), 
                any(NJDGTransformRecordRowMapper.class))).thenThrow(new EmptyResultDataAccessException(1));

        NJDGTransformRecord result = caseRepository.findByCino("UNKNOWN");

        assertNull(result);
    }

    @Test
    void testGetPartyDetails_Success() {
        PartyDetails partyDetails = new PartyDetails();
        partyDetails.setCino("CNR-001");
        partyDetails.setPartyName("Test Party");

        when(queryBuilder.getPartyQuery()).thenReturn("SELECT * FROM parties WHERE cino = ? AND party_type = ?");
        doReturn(Collections.singletonList(partyDetails))
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<PartyDetails> result = caseRepository.getPartyDetails("CNR-001", PartyType.PET);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void testUpdateExtraParties_Insert() {
        PartyDetails partyDetails = PartyDetails.builder()
                .cino("CNR-001")
                .partyType(PartyType.PET)
                .partyNo(1)
                .partyName("Test Party")
                .build();

        when(jdbcTemplate.queryForList(anyString(), eq(Integer.class), anyString(), anyString(), anyInt()))
                .thenReturn(Collections.emptyList());
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        caseRepository.updateExtraParties(partyDetails);

        verify(jdbcTemplate).update(contains("INSERT"), any(Object[].class));
    }

    @Test
    void testUpdateExtraParties_Update() {
        PartyDetails partyDetails = PartyDetails.builder()
                .cino("CNR-001")
                .partyType(PartyType.PET)
                .partyNo(1)
                .partyName("Test Party")
                .build();

        when(jdbcTemplate.queryForList(anyString(), eq(Integer.class), anyString(), anyString(), anyInt()))
                .thenReturn(Collections.singletonList(1));
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        caseRepository.updateExtraParties(partyDetails);

        verify(jdbcTemplate).update(contains("UPDATE"), any(Object[].class));
    }

    @Test
    void testUpdateRecord_Success() {
        when(queryBuilder.getUpdateQuery()).thenReturn("UPDATE cases SET ... WHERE cino = ?");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        assertDoesNotThrow(() -> caseRepository.updateRecord(transformRecord));
    }

    @Test
    void testUpdateRecord_Exception() {
        when(queryBuilder.getUpdateQuery()).thenReturn("UPDATE cases SET ... WHERE cino = ?");
        when(jdbcTemplate.update(anyString(), any(Object[].class)))
                .thenThrow(new RuntimeException("Database error"));

        assertThrows(RuntimeException.class, () -> caseRepository.updateRecord(transformRecord));
    }

    @Test
    void testInsertRecord_Success() {
        when(queryBuilder.getInsertQuery()).thenReturn("INSERT INTO cases VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        assertDoesNotThrow(() -> caseRepository.insertRecord(transformRecord));
    }

    @Test
    void testInsertRecord_Exception() {
        when(queryBuilder.getInsertQuery()).thenReturn("INSERT INTO cases VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class)))
                .thenThrow(new RuntimeException("Database error"));

        assertThrows(RuntimeException.class, () -> caseRepository.insertRecord(transformRecord));
    }

    @Test
    void testGetActs_Success() {
        Act act = new Act();
        act.setCino("CNR-001");
        act.setActCode(1);

        when(queryBuilder.getActQuery()).thenReturn("SELECT * FROM acts WHERE cino = ?");
        doReturn(Collections.singletonList(act))
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<Act> result = caseRepository.getActs("CNR-001");

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void testUpsertActDetails_Insert() {
        Act act = new Act();
        act.setCino("CNR-001");
        act.setActCode(1);

        doReturn(Collections.emptyList())
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(org.springframework.jdbc.core.RowMapper.class));
        when(queryBuilder.getInsertActQuery()).thenReturn("INSERT INTO acts VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        assertDoesNotThrow(() -> caseRepository.upsertActDetails(act));
    }

    @Test
    void testUpsertActDetails_Update() {
        Act act = new Act();
        act.setCino("CNR-001");
        act.setActCode(1);

        doReturn(Collections.singletonList(1))
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(org.springframework.jdbc.core.RowMapper.class));
        when(queryBuilder.getUpdateActQuery()).thenReturn("UPDATE acts SET ... WHERE id = ?");
        when(jdbcTemplate.update(anyString(), any(Object[].class))).thenReturn(1);

        assertDoesNotThrow(() -> caseRepository.upsertActDetails(act));
    }

    @Test
    void testGetNextSrNoForCaseConversion_Success() {
        when(queryBuilder.getMaxSrNoCaseConversionQuery()).thenReturn("SELECT MAX(sr_no) FROM case_conversion WHERE cino = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenReturn(5);

        Integer result = caseRepository.getNextSrNoForCaseConversion("CNR-001");

        assertEquals(6, result);
    }

    @Test
    void testGetNextSrNoForCaseConversion_NoRecords() {
        when(queryBuilder.getMaxSrNoCaseConversionQuery()).thenReturn("SELECT MAX(sr_no) FROM case_conversion WHERE cino = ?");
        when(jdbcTemplate.queryForObject(anyString(), any(Object[].class), any(int[].class), eq(Integer.class)))
                .thenThrow(new EmptyResultDataAccessException(1));

        Integer result = caseRepository.getNextSrNoForCaseConversion("CNR-001");

        assertEquals(1, result);
    }

    @Test
    void testInsertCaseConversionDetails_Success() {
        CaseTypeDetails caseTypeDetails = new CaseTypeDetails();
        caseTypeDetails.setCino("CNR-001");
        caseTypeDetails.setSrNo(1);

        when(queryBuilder.getCaseConversionInsertQuery()).thenReturn("INSERT INTO case_conversion VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> caseRepository.insertCaseConversionDetails(caseTypeDetails));
    }
}
