package digit.repository;

import digit.repository.querybuilder.HearingQueryBuilder;
import digit.repository.rowmapper.AvailabilityRowMapper;
import digit.repository.rowmapper.HearingRowMapper;
import digit.web.models.AvailabilityDTO;
import digit.web.models.ScheduleHearing;
import digit.web.models.ScheduleHearingSearchCriteria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class HearingRepositoryTest {

    @Mock
    private HearingQueryBuilder queryBuilder;

    @Mock
    private HearingRowMapper rowMapper;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private AvailabilityRowMapper availabilityRowMapper;

    @InjectMocks
    private HearingRepository hearingRepository;

    private ScheduleHearingSearchCriteria hearingSearchCriteria;
    private List<ScheduleHearing> scheduleHearings;
    private List<AvailabilityDTO> availabilityDTOs;

    @BeforeEach
    public void setUp() {
        hearingSearchCriteria = new ScheduleHearingSearchCriteria();
        scheduleHearings = new ArrayList<>();
        ScheduleHearing hearing = new ScheduleHearing();
        scheduleHearings.add(hearing);

        availabilityDTOs = new ArrayList<>();
        AvailabilityDTO availabilityDTO = new AvailabilityDTO();
        availabilityDTOs.add(availabilityDTO);
    }

    @Test
    public void testGetHearings_Success() {
        List<Object> preparedStmtList = new ArrayList<>();
        when(queryBuilder.getHearingQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class), anyInt(), anyInt())).thenReturn("SELECT * FROM hearings");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(), any(HearingRowMapper.class))).thenReturn(scheduleHearings);

        List<ScheduleHearing> result = hearingRepository.getHearings(hearingSearchCriteria, 10, 0);

        assertEquals(1, result.size());
        verify(queryBuilder, times(1)).getHearingQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class), anyInt(), anyInt());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(), any(HearingRowMapper.class));
    }

    @Test
    public void testGetHearings_EmptyResult() {
        List<Object> preparedStmtList = new ArrayList<>();
        when(queryBuilder.getHearingQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class), anyInt(), anyInt())).thenReturn("SELECT * FROM hearings");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(), any(HearingRowMapper.class))).thenReturn(new ArrayList<>());

        List<ScheduleHearing> result = hearingRepository.getHearings(hearingSearchCriteria, 10, 0);

        assertEquals(0, result.size());
        verify(queryBuilder, times(1)).getHearingQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class), anyInt(), anyInt());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(), any(HearingRowMapper.class));
    }

    @Test
    public void testGetHearings_Exception() {
        when(queryBuilder.getHearingQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class), anyInt(), anyInt())).thenReturn("SELECT * FROM hearings");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(), any(HearingRowMapper.class))).thenThrow(new RuntimeException("Database error"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            hearingRepository.getHearings(hearingSearchCriteria, 10, 0);
        });

        assertEquals("Database error", exception.getMessage());
        verify(queryBuilder, times(1)).getHearingQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class), anyInt(), anyInt());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(), any(HearingRowMapper.class));
    }

    @Test
    public void testGetHearingDayAndOccupiedBandwidthForDay_Success() {

        when(queryBuilder.getHearingDayAndOccupiedBandwidthForDayQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class))).thenReturn("SELECT * FROM availability");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(), any(AvailabilityRowMapper.class))).thenReturn(availabilityDTOs);

        List<AvailabilityDTO> result = hearingRepository.getHearingDayAndOccupiedBandwidthForDay(hearingSearchCriteria);

        assertEquals(1, result.size());
        verify(queryBuilder, times(1)).getHearingDayAndOccupiedBandwidthForDayQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class));
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(), any(AvailabilityRowMapper.class));
    }

    @Test
    public void testGetHearingDayAndOccupiedBandwidthForDay_EmptyResult() {

        when(queryBuilder.getHearingDayAndOccupiedBandwidthForDayQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class))).thenReturn("SELECT * FROM availability");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(), any(AvailabilityRowMapper.class))).thenReturn(Collections.emptyList());

        List<AvailabilityDTO> result = hearingRepository.getHearingDayAndOccupiedBandwidthForDay(hearingSearchCriteria);

        assertEquals(0, result.size());
        verify(queryBuilder, times(1)).getHearingDayAndOccupiedBandwidthForDayQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class));
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(), any(AvailabilityRowMapper.class));
    }

    @Test
    public void testGetHearingDayAndOccupiedBandwidthForDay_Exception() {
        when(queryBuilder.getHearingDayAndOccupiedBandwidthForDayQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class))).thenReturn("SELECT * FROM availability");
        when(jdbcTemplate.query(anyString(), any(Object[].class), any(), any(AvailabilityRowMapper.class))).thenThrow(new RuntimeException("Database error"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            hearingRepository.getHearingDayAndOccupiedBandwidthForDay(hearingSearchCriteria);
        });

        assertEquals("Database error", exception.getMessage());
        verify(queryBuilder, times(1)).getHearingDayAndOccupiedBandwidthForDayQuery(any(ScheduleHearingSearchCriteria.class), any(List.class), any(List.class));
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(), any(AvailabilityRowMapper.class));
    }
}
