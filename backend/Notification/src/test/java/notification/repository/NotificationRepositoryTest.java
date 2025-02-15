package notification.repository;

import notification.repository.querybuilder.NotificationQueryBuilder;
import notification.repository.rowmapper.NotificationExistsRowMapper;
import notification.repository.rowmapper.NotificationRowMapper;
import notification.web.models.Notification;
import notification.web.models.NotificationCriteria;
import notification.web.models.NotificationExists;
import notification.web.models.Pagination;
import org.egov.tracer.model.CustomException;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class NotificationRepositoryTest {

    @Mock
    private NotificationQueryBuilder queryBuilder;

    @Mock
    private NotificationRowMapper rowMapper;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private NotificationExistsRowMapper notificationExistsRowMapper;

    @InjectMocks
    private NotificationRepository notificationRepository;

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
    }

    @Test
    public void getNotifications_WithoutPagination_ShouldReturnNotifications() {
        NotificationCriteria criteria = new NotificationCriteria();
        String baseQuery = "SELECT * FROM notifications";
        List<Notification> expectedNotifications = Arrays.asList(
                new Notification(),
                new Notification()
        );

        when(queryBuilder.getBaseNotificationQuery(
                ArgumentMatchers.eq(criteria),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()))
                .thenReturn(baseQuery);

        when(jdbcTemplate.query(
                ArgumentMatchers.eq(baseQuery),
                ArgumentMatchers.<Object[]>any(),
                ArgumentMatchers.<int[]>any(),
                ArgumentMatchers.eq(rowMapper)))
                .thenReturn(expectedNotifications);

        List<Notification> result = notificationRepository.getNotifications(criteria, null);

        assertNotNull(result);
        assertEquals(expectedNotifications.size(), result.size());
    }

    @Test
    public void getNotifications_WithPagination_ShouldReturnPaginatedNotifications() {
        NotificationCriteria criteria = new NotificationCriteria();
        Pagination pagination = new Pagination();
        pagination.setLimit(10D);
        pagination.setOffSet(0D);

        String baseQuery = "SELECT * FROM notifications";
        String countQuery = "SELECT COUNT(*) FROM (" + baseQuery + ") AS count";
        String paginatedQuery = baseQuery + " LIMIT 10 OFFSET 0";

        List<Notification> expectedNotifications = Arrays.asList(
                new Notification(),
                new Notification()
        );

        when(queryBuilder.getBaseNotificationQuery(
                ArgumentMatchers.eq(criteria),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()))
                .thenReturn(baseQuery);

        when(queryBuilder.getTotalCountQuery(baseQuery))
                .thenReturn(countQuery);

        when(jdbcTemplate.queryForObject(
                ArgumentMatchers.eq(countQuery),
                ArgumentMatchers.<Object[]>any(),
                ArgumentMatchers.eq(Integer.class)))
                .thenReturn(20);

        when(queryBuilder.getNotificationPaginatedQuery(
                ArgumentMatchers.eq(baseQuery),
                ArgumentMatchers.eq(pagination),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()))
                .thenReturn(paginatedQuery);

        when(jdbcTemplate.query(
                ArgumentMatchers.eq(paginatedQuery),
                ArgumentMatchers.<Object[]>any(),
                ArgumentMatchers.<int[]>any(),
                ArgumentMatchers.eq(rowMapper)))
                .thenReturn(expectedNotifications);

        List<Notification> result = notificationRepository.getNotifications(criteria, pagination);

        assertNotNull(result);
        assertEquals(expectedNotifications.size(), result.size());
        assertEquals(Double.valueOf(20), pagination.getTotalCount());

        verify(queryBuilder).getBaseNotificationQuery(
                eq(criteria),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()
        );
        verify(queryBuilder).getTotalCountQuery(eq(baseQuery));
        verify(jdbcTemplate).queryForObject(
                eq(countQuery),
                ArgumentMatchers.<Object[]>any(),
                eq(Integer.class)
        );
        verify(queryBuilder).getNotificationPaginatedQuery(
                eq(baseQuery),
                eq(pagination),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()
        );
    }

    @Test
    public void getTotalCount_ShouldReturnCorrectCount() {
        String baseQuery = "SELECT * FROM notifications";
        String countQuery = "SELECT COUNT(*) FROM notifications";
        List<Object> preparedStmtList = new ArrayList<>();
        Integer expectedCount = 20;

        when(queryBuilder.getTotalCountQuery(ArgumentMatchers.eq(baseQuery)))
                .thenReturn(countQuery);

        when(jdbcTemplate.queryForObject(
                ArgumentMatchers.eq(countQuery),
                ArgumentMatchers.<Object[]>any(),
                ArgumentMatchers.eq(Integer.class)))
                .thenReturn(expectedCount);

        Integer result = notificationRepository.getTotalCount(baseQuery, preparedStmtList);

        assertEquals(expectedCount, result);
    }

    @Test
    public void checkIfNotificationExists_ShouldReturnExistingNotifications() {
        List<NotificationExists> input = Arrays.asList(
                new NotificationExists(),
                new NotificationExists()
        );
        String query = "SELECT * FROM notifications WHERE id IN (?)";
        List<NotificationExists> expectedResults = Arrays.asList(
                new NotificationExists(),
                new NotificationExists()
        );

        when(queryBuilder.getBaseNotificationExistenceQuery(
                ArgumentMatchers.eq(input),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()))
                .thenReturn(query);

        when(jdbcTemplate.query(
                ArgumentMatchers.eq(query),
                ArgumentMatchers.<Object[]>any(),
                ArgumentMatchers.<int[]>any(),
                ArgumentMatchers.eq(notificationExistsRowMapper)))
                .thenReturn(expectedResults);

        List<NotificationExists> result = notificationRepository.checkIfNotificationExists(input);

        assertNotNull(result);
        assertEquals(expectedResults.size(), result.size());
    }

    @Test(expected = CustomException.class)
    public void getNotifications_WithMismatchedPreparedStatements_ShouldThrowException() {
        NotificationCriteria criteria = new NotificationCriteria();

        // Create an Answer that will modify the passed lists to create a size mismatch
        doAnswer(new Answer<String>() {
            @Override
            public String answer(InvocationOnMock invocation) {
                // Get the lists passed to the method
                List<Object> preparedStmtList = (List<Object>) invocation.getArguments()[1];
                List<Integer> preparedStmtArgList = (List<Integer>) invocation.getArguments()[2];

                // Add items to create a size mismatch
                preparedStmtList.add("value1");
                preparedStmtList.add("value2");
                preparedStmtArgList.add(1); // Only add one item to create mismatch

                return "SELECT * FROM notifications";
            }
        }).when(queryBuilder).getBaseNotificationQuery(
                ArgumentMatchers.eq(criteria),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()
        );

        notificationRepository.getNotifications(criteria, null);

    }

    @Test(expected = CustomException.class)
    public void checkIfNotificationExists_WithMismatchedPreparedStatements_ShouldThrowException() {
        // Arrange
        List<NotificationExists> input = Arrays.asList(
                new NotificationExists(),
                new NotificationExists()
        );

        // Create an Answer that will modify the passed lists to create a size mismatch
        doAnswer(new Answer() {
            @Override
            public String answer(InvocationOnMock invocation) {
                // Get the lists passed to the method
                List<Object> preparedStmtList = (List<Object>) invocation.getArguments()[1];
                List<Integer> preparedStmtArgList = (List<Integer>) invocation.getArguments()[2];

                // Add items to create a size mismatch
                preparedStmtList.add("value1");
                preparedStmtList.add("value2");
                preparedStmtArgList.add(1); // Only add one item to create mismatch

                return "SELECT * FROM notifications";
            }
        }).when(queryBuilder).getBaseNotificationExistenceQuery(
                ArgumentMatchers.eq(input),
                ArgumentMatchers.<List<Object>>any(),
                ArgumentMatchers.<List<Integer>>any()
        );

        notificationRepository.checkIfNotificationExists(input);

    }

}


