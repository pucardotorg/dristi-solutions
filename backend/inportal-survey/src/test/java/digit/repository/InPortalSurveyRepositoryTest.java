package digit.repository;

import digit.repository.querybuilder.SurveyTrackerQueryBuilder;
import digit.repository.rowmapper.SurveyTrackerRowMapper;
import digit.web.models.SurveyTracker;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InPortalSurveyRepositoryTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private SurveyTrackerQueryBuilder queryBuilder;

    @Mock
    private SurveyTrackerRowMapper rowMapper;

    @InjectMocks
    private InPortalSurveyRepository repository;

    private RequestInfo requestInfo;
    private User user;

    @BeforeEach
    public void setUp() {
        user = User.builder()
                .uuid("test-user-uuid")
                .userName("testuser")
                .tenantId("pg")
                .build();

        requestInfo = RequestInfo.builder()
                .userInfo(user)
                .build();
    }

    @Test
    public void testGetSurveyTracker_Success_ReturnsTrackers() {
        // Arrange
        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        SurveyTracker tracker = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .userType("LITIGANT")
                .attempts(0)
                .auditDetails(AuditDetails.builder().build())
                .build();

        List<SurveyTracker> expectedTrackers = Collections.singletonList(tracker);

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenAnswer(invocation -> {
                    List<Object> stmtList = invocation.getArgument(1);
                    List<Integer> argList = invocation.getArgument(2);
                    stmtList.add("test-user-uuid");
                    argList.add(1);
                    return query;
                });

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(expectedTrackers);

        // Act
        List<SurveyTracker> result = repository.getSurveyTracker(requestInfo);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("test-user-uuid", result.get(0).getUserUuid());

        verify(queryBuilder, times(1)).getSurveyTrackerQuery(eq("test-user-uuid"), anyList(), anyList());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper));
    }

    @Test
    public void testGetSurveyTracker_Success_EmptyList() {
        // Arrange
        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenReturn(query);

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(Collections.emptyList());

        // Act
        List<SurveyTracker> result = repository.getSurveyTracker(requestInfo);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(queryBuilder, times(1)).getSurveyTrackerQuery(eq("test-user-uuid"), anyList(), anyList());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper));
    }

    @Test
    public void testGetSurveyTracker_Success_MultipleTrackers() {
        // Arrange
        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";

        SurveyTracker tracker1 = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .build();

        SurveyTracker tracker2 = SurveyTracker.builder()
                .userUuid("test-user-uuid")
                .tenantId("pg")
                .build();

        List<SurveyTracker> expectedTrackers = List.of(tracker1, tracker2);

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenReturn(query);

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(expectedTrackers);

        // Act
        List<SurveyTracker> result = repository.getSurveyTracker(requestInfo);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    public void testGetSurveyTracker_CustomException_RethrowsException() {
        // Arrange
        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenThrow(new CustomException("QUERY_BUILD_ERROR", "Error building query"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            repository.getSurveyTracker(requestInfo);
        });

        assertEquals("QUERY_BUILD_ERROR", exception.getCode());

    }

    @Test
    public void testGetSurveyTracker_GenericException_WrapsInCustomException() {
        // Arrange
        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenReturn(query);

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenThrow(new RuntimeException("Database connection error"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            repository.getSurveyTracker(requestInfo);
        });

        assertEquals("SURVEY_TRACKER_SEARCH_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("Error occurred while retrieving survey tracker data"));

        verify(queryBuilder, times(1)).getSurveyTrackerQuery(eq("test-user-uuid"), anyList(), anyList());
        verify(jdbcTemplate, times(1)).query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper));
    }

    @Test
    public void testGetSurveyTracker_NullPointerException_WrapsInCustomException() {
        // Arrange
        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenReturn(query);

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenThrow(new NullPointerException("Null value encountered"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            repository.getSurveyTracker(requestInfo);
        });

        assertEquals("SURVEY_TRACKER_SEARCH_EXCEPTION", exception.getCode());
    }

    @Test
    public void testGetSurveyTracker_VerifyQueryBuilderParameters() {
        // Arrange
        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenReturn(query);

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(Collections.emptyList());

        // Act
        repository.getSurveyTracker(requestInfo);

        // Assert - Verify the correct userUuid is passed
        verify(queryBuilder, times(1)).getSurveyTrackerQuery(
                eq("test-user-uuid"),
                argThat(list -> list instanceof ArrayList),
                argThat(list -> list instanceof ArrayList)
        );
    }

    @Test
    public void testGetSurveyTracker_DifferentUserUuid() {
        // Arrange
        User differentUser = User.builder()
                .uuid("different-user-uuid")
                .userName("differentuser")
                .tenantId("pg")
                .build();

        RequestInfo differentRequestInfo = RequestInfo.builder()
                .userInfo(differentUser)
                .build();

        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenReturn(query);

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(Collections.emptyList());

        // Act
        repository.getSurveyTracker(differentRequestInfo);

        // Assert
        verify(queryBuilder, times(1)).getSurveyTrackerQuery(eq("different-user-uuid"), anyList(), anyList());
    }

    @Test
    public void testGetSurveyTracker_VerifyJdbcTemplateParameters() {
        // Arrange
        String query = "SELECT * FROM inportal_survey_tracker WHERE user_uuid = ?";

        when(queryBuilder.getSurveyTrackerQuery(anyString(), anyList(), anyList()))
                .thenAnswer(invocation -> {
                    List<Object> stmtList = invocation.getArgument(1);
                    List<Integer> argList = invocation.getArgument(2);
                    stmtList.add("test-user-uuid");
                    argList.add(1);
                    return query;
                });

        when(jdbcTemplate.query(anyString(), any(Object[].class), any(int[].class), eq(rowMapper)))
                .thenReturn(Collections.emptyList());

        // Act
        repository.getSurveyTracker(requestInfo);

        // Assert - Verify jdbcTemplate is called with correct parameters
        verify(jdbcTemplate, times(1)).query(
                eq(query),
                argThat(objects -> objects.length == 1 && "test-user-uuid".equals(objects[0])),
                argThat(ints -> ints.length == 1 && ints[0] == 1),
                eq(rowMapper)
        );
    }
}
