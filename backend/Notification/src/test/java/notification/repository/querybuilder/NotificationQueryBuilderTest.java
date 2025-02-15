package notification.repository.querybuilder;

import notification.web.models.Order;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import notification.web.models.NotificationCriteria;
import notification.web.models.NotificationExists;
import notification.web.models.Pagination;
import org.egov.tracer.model.CustomException;

import java.sql.Types;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

class NotificationQueryBuilderTest {

    @InjectMocks
    private NotificationQueryBuilder queryBuilder;

    private List<Object> preparedStmtList;
    private List<Integer> preparedStmtArgList;
    private UUID testUuid;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        preparedStmtList = new ArrayList<>();
        preparedStmtArgList = new ArrayList<>();
        testUuid = UUID.randomUUID();
    }

    @Test
    void testGetNotificationPaginatedQuery() {
        String baseQuery = "SELECT * FROM dristi_notification";
        Pagination pagination = Pagination.builder()
                .limit(10D)
                .offSet(0D)
                .sortBy("createdDate")
                .order(Order.DESC)
                .build();

        String result = queryBuilder.getNotificationPaginatedQuery(
                baseQuery,
                pagination,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("WITH paginated_notification"));
        assertTrue(result.contains("LEFT JOIN  dristi_notification_document"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(2, preparedStmtArgList.size());
        assertEquals(Types.INTEGER, preparedStmtArgList.get(0));
        assertEquals(Types.INTEGER, preparedStmtArgList.get(1));
    }

    @Test
    void testGetBaseNotificationQuery() {
        NotificationCriteria criteria = NotificationCriteria.builder()
                .id("123")
                .tenantId("default")
                .notificationType("COURT")
                .build();

        String result = queryBuilder.getBaseNotificationQuery(
                criteria,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("SELECT"));
        assertTrue(result.contains("FROM dristi_notification"));
        assertTrue(result.contains("WHERE"));
        assertEquals(3, preparedStmtList.size());
        assertEquals(3, preparedStmtArgList.size());
        assertTrue(preparedStmtList.contains("123"));
        assertTrue(preparedStmtList.contains("default"));
        assertTrue(preparedStmtList.contains("COURT"));
    }

    @Test
    void testGetBaseNotificationExistenceQuery() {
        NotificationExists notification = NotificationExists.builder()
                .id(testUuid)
                .notificationNumber("NOT-2024-001")
                .notificationType("COURT")
                .build();

        String result = queryBuilder.getBaseNotificationExistenceQuery(
                Arrays.asList(notification),
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("SELECT"));
        assertTrue(result.contains("GROUP BY"));
        assertEquals(3, preparedStmtList.size());
        assertEquals(3, preparedStmtArgList.size());
        assertTrue(preparedStmtList.contains(testUuid));
        assertTrue(preparedStmtList.contains("NOT-2024-001"));
        assertTrue(preparedStmtList.contains("COURT"));
    }

    @Test
    void testGetTotalCountQuery() {
        String baseQuery = "SELECT * FROM dristi_notification WHERE tenantId = 'default'";

        String result = queryBuilder.getTotalCountQuery(baseQuery);

        assertTrue(result.contains("SELECT COUNT(*)"));
        assertTrue(result.contains(baseQuery));
    }

    @Test
    void testGetBaseNotificationExistenceQueryWithEmptyList() {
        List<NotificationExists> emptyList = new ArrayList<>();

        assertThrows(CustomException.class, () ->
                queryBuilder.getBaseNotificationExistenceQuery(
                        emptyList,
                        preparedStmtList,
                        preparedStmtArgList
                )
        );
    }

    @Test
    void testGetNotificationPaginatedQueryWithNullSortBy() {
        String baseQuery = "SELECT * FROM dristi_notification";
        Pagination pagination = Pagination.builder()
                .limit(10D)
                .offSet(0D)
                .build();

        String result = queryBuilder.getNotificationPaginatedQuery(
                baseQuery,
                pagination,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("ORDER BY cases.createdDate DESC"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(2, preparedStmtArgList.size());
    }

    @Test
    void testGetNotificationPaginatedQueryWithInvalidSortBy() {
        String baseQuery = "SELECT * FROM dristi_notification";
        Pagination pagination = Pagination.builder()
                .limit(10D)
                .offSet(0D)
                .sortBy("created_date; DROP TABLE users;")
                .order(Order.DESC)
                .build();

        String result = queryBuilder.getNotificationPaginatedQuery(
                baseQuery,
                pagination,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("ORDER BY cases.createdDate DESC"));
        assertFalse(result.contains("DROP TABLE"));
        assertEquals(2, preparedStmtList.size());
        assertEquals(2, preparedStmtArgList.size());
    }
}
