package digit.repository.querybuilder;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class SurveyTrackerQueryBuilderTest {

    @InjectMocks
    private SurveyTrackerQueryBuilder queryBuilder;

    @Test
    public void testGetSurveyTrackerQuery_WithUserUuid() {
        // Arrange
        String userUuid = "test-user-uuid";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

        // Assert
        assertNotNull(query);
        assertTrue(query.contains("SELECT user_uuid, user_type, tenant_id, remind_me_later, last_triggered_date, attempts, created_by, last_modified_by, created_time, last_modified_time"));
        assertTrue(query.contains("FROM inportal_survey_tracker"));
        assertTrue(query.contains("WHERE user_uuid = ?"));
        
        assertEquals(1, preparedStmtList.size());
        assertEquals("test-user-uuid", preparedStmtList.get(0));
        
        assertEquals(1, preparedStmtArgList.size());
        assertEquals(1, preparedStmtArgList.get(0));
    }

    @Test
    public void testGetSurveyTrackerQuery_WithNullUserUuid() {
        // Arrange
        String userUuid = null;
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

        // Assert
        assertNotNull(query);
        assertTrue(query.contains("SELECT user_uuid, user_type, tenant_id, remind_me_later, last_triggered_date, attempts, created_by, last_modified_by, created_time, last_modified_time"));
        assertTrue(query.contains("FROM inportal_survey_tracker"));
        assertFalse(query.contains("WHERE"));
        
        assertEquals(0, preparedStmtList.size());
        assertEquals(0, preparedStmtArgList.size());
    }

    @Test
    public void testGetSurveyTrackerQuery_WithEmptyUserUuid() {
        // Arrange
        String userUuid = "";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

        // Assert
        assertNotNull(query);
        assertTrue(query.contains("SELECT user_uuid, user_type, tenant_id, remind_me_later, last_triggered_date, attempts, created_by, last_modified_by, created_time, last_modified_time"));
        assertTrue(query.contains("FROM inportal_survey_tracker"));
        assertFalse(query.contains("WHERE"));
        
        assertEquals(0, preparedStmtList.size());
        assertEquals(0, preparedStmtArgList.size());
    }

    @Test
    public void testGetSurveyTrackerQuery_WithDifferentUserUuids() {
        // Test with multiple different UUIDs
        String[] userUuids = {
            "uuid-1",
            "uuid-2",
            "very-long-uuid-with-many-characters-12345678",
            "123",
            "special-chars-!@#"
        };

        for (String userUuid : userUuids) {
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

            assertNotNull(query);
            assertTrue(query.contains("WHERE user_uuid = ?"));
            assertEquals(1, preparedStmtList.size());
            assertEquals(userUuid, preparedStmtList.get(0));
            assertEquals(1, preparedStmtArgList.get(0));
        }
    }

    @Test
    public void testGetSurveyTrackerQuery_QueryStructure() {
        // Arrange
        String userUuid = "test-uuid";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

        // Assert - Verify query structure
        assertTrue(query.startsWith("SELECT"));
        assertTrue(query.contains("user_uuid"));
        assertTrue(query.contains("user_type"));
        assertTrue(query.contains("tenant_id"));
        assertTrue(query.contains("remind_me_later"));
        assertTrue(query.contains("last_triggered_date"));
        assertTrue(query.contains("attempts"));
        assertTrue(query.contains("created_by"));
        assertTrue(query.contains("last_modified_by"));
        assertTrue(query.contains("created_time"));
        assertTrue(query.contains("last_modified_time"));
        assertTrue(query.contains("FROM inportal_survey_tracker"));
    }

    @Test
    public void testGetSurveyTrackerQuery_PreparedStatementListsNotModifiedWhenNullUuid() {
        // Arrange
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        preparedStmtList.add("existing-value");
        preparedStmtArgList.add(99);

        // Act
        queryBuilder.getSurveyTrackerQuery(null, preparedStmtList, preparedStmtArgList);

        // Assert - Lists should not have new items added
        assertEquals(1, preparedStmtList.size());
        assertEquals("existing-value", preparedStmtList.get(0));
        assertEquals(1, preparedStmtArgList.size());
        assertEquals(99, preparedStmtArgList.get(0));
    }

    @Test
    public void testGetSurveyTrackerQuery_PreparedStatementListsModifiedWhenValidUuid() {
        // Arrange
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        preparedStmtList.add("existing-value");
        preparedStmtArgList.add(99);

        // Act
        queryBuilder.getSurveyTrackerQuery("new-uuid", preparedStmtList, preparedStmtArgList);

        // Assert - Lists should have new items added
        assertEquals(2, preparedStmtList.size());
        assertEquals("existing-value", preparedStmtList.get(0));
        assertEquals("new-uuid", preparedStmtList.get(1));
        assertEquals(2, preparedStmtArgList.size());
        assertEquals(99, preparedStmtArgList.get(0));
        assertEquals(1, preparedStmtArgList.get(1));
    }

    @Test
    public void testGetSurveyTrackerQuery_MultipleInvocations() {
        // Test that multiple invocations produce consistent results
        String userUuid = "consistent-uuid";
        
        List<Object> preparedStmtList1 = new ArrayList<>();
        List<Integer> preparedStmtArgList1 = new ArrayList<>();
        String query1 = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList1, preparedStmtArgList1);

        List<Object> preparedStmtList2 = new ArrayList<>();
        List<Integer> preparedStmtArgList2 = new ArrayList<>();
        String query2 = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList2, preparedStmtArgList2);

        // Assert
        assertEquals(query1, query2);
        assertEquals(preparedStmtList1, preparedStmtList2);
        assertEquals(preparedStmtArgList1, preparedStmtArgList2);
    }

    @Test
    public void testGetSurveyTrackerQuery_AllColumnsPresent() {
        // Arrange
        String userUuid = "test-uuid";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        // Act
        String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

        // Assert - Verify all expected columns are in the query
        String[] expectedColumns = {
            "user_uuid",
            "user_type",
            "tenant_id",
            "remind_me_later",
            "last_triggered_date",
            "attempts",
            "created_by",
            "last_modified_by",
            "created_time",
            "last_modified_time"
        };

        for (String column : expectedColumns) {
            assertTrue(query.contains(column), "Query should contain column: " + column);
        }
    }

    @Test
    public void testGetSurveyTrackerQuery_BaseQueryConstant() {
        // Verify the base query is correctly formed
        String userUuid = "test-uuid";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

        // The query should start with SELECT and contain FROM
        assertTrue(query.matches("SELECT .+ FROM inportal_survey_tracker.*"));
    }

    @Test
    public void testGetSurveyTrackerQuery_WhitespaceTrimming() {
        // Test with whitespace-only string
        String userUuid = "   ";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);

        // Whitespace is not empty, so it should add WHERE clause
        assertTrue(query.contains("WHERE user_uuid = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals("   ", preparedStmtList.get(0));
    }
}
