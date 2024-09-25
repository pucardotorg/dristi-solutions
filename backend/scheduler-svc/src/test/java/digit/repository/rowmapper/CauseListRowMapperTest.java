package digit.repository.rowmapper;

import digit.web.models.CauseList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CauseListRowMapperTest {

    @Mock
    private RowMapper<CauseList> mapper;

    @Mock
    private ResultSet resultSet;

    @InjectMocks
    private CauseListRowMapper rowMapper;


    @Test
    void testMapRow() throws SQLException {
        // Setup mock ResultSet
        when(resultSet.getString("court_id")).thenReturn("court-id-1");
        when(resultSet.getString("tenant_id")).thenReturn("tenant-id-1");
        when(resultSet.getString("judge_id")).thenReturn("judge-id-1");
        when(resultSet.getString("advocate_names")).thenReturn("John Doe,Jane Doe");
        when(resultSet.getString("slot")).thenReturn("10:00 AM");
        when(resultSet.getString("case_title")).thenReturn("Case Title 1");
        when(resultSet.getString("case_registration_date")).thenReturn("2024-07-01");

        // Map row
        CauseList causeList = rowMapper.mapRow(resultSet, 1);

        // Assertions
        assertEquals("court-id-1", causeList.getCourtId());
        assertEquals("tenant-id-1", causeList.getTenantId());
        assertEquals("judge-id-1", causeList.getJudgeId());
        List<String> expectedLitigantNames = Arrays.asList("John Doe", "Jane Doe");
        assertEquals(expectedLitigantNames, causeList.getAdvocateNames());
        assertEquals("10:00 AM", causeList.getSlot());
        assertEquals("Case Title 1", causeList.getCaseTitle());
        assertEquals("2024-07-01", causeList.getCaseRegistrationDate());
    }

    @Test
    void testMapRowWithNullValues() throws SQLException {
        // Setup mock ResultSet with null values
        when(resultSet.getString("court_id")).thenReturn(null);
        when(resultSet.getString("tenant_id")).thenReturn(null);
        when(resultSet.getString("judge_id")).thenReturn(null);
        when(resultSet.getString("advocate_names")).thenReturn(null);
        when(resultSet.getString("slot")).thenReturn(null);
        when(resultSet.getString("case_title")).thenReturn(null);
        when(resultSet.getString("case_registration_date")).thenReturn(null);

        // Map row
        CauseList causeList = rowMapper.mapRow(resultSet, 1);

        // Assertions
        assertEquals(null, causeList.getCourtId());
        assertEquals(null, causeList.getTenantId());
        assertEquals(null, causeList.getJudgeId());
        assertEquals(Arrays.asList(), causeList.getAdvocateNames());
        assertEquals(null, causeList.getSlot());
        assertEquals(null, causeList.getCaseTitle());
        assertEquals(null, causeList.getHearingDate());
    }
}
