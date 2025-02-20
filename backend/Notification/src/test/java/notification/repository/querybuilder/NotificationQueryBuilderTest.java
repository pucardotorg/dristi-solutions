package notification.repository.querybuilder;

import notification.web.models.Order;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import static org.junit.jupiter.api.Assertions.*;

import notification.web.models.NotificationExists;
import org.egov.tracer.model.CustomException;

import java.sql.Types;
import java.util.ArrayList;
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
    void testGetBaseNotificationExistenceQuery_WithValidData() {
        NotificationExists notification = NotificationExists.builder()
                .id(testUuid)
                .notificationNumber("NOT-2024-001")
                .notificationType("COURT")
                .build();

        String result = queryBuilder.getBaseNotificationExistenceQuery(
                notification,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("SELECT  COUNT(*)  FROM dristi_notification"));
        assertEquals(3, preparedStmtList.size());
        assertEquals(3, preparedStmtArgList.size());
        assertTrue(preparedStmtList.contains(testUuid.toString()));
        assertTrue(preparedStmtList.contains("NOT-2024-001"));
        assertTrue(preparedStmtList.contains("COURT"));
    }

    @Test
    void testGetBaseNotificationExistenceQuery_WithNullNotification() {
        String result = queryBuilder.getBaseNotificationExistenceQuery(
                null,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("SELECT  COUNT(*)  FROM dristi_notification"));
        assertEquals(0, preparedStmtList.size());
        assertEquals(0, preparedStmtArgList.size());
    }

    @Test
    void testGetBaseNotificationExistenceQuery_WithPartialData() {
        NotificationExists notification = NotificationExists.builder()
                .notificationNumber("NOT-2024-002")
                .build();

        String result = queryBuilder.getBaseNotificationExistenceQuery(
                notification,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("SELECT  COUNT(*)  FROM dristi_notification"));
        assertTrue(result.contains("notificationNumber = ?"));
        assertEquals(1, preparedStmtList.size());
        assertEquals(1, preparedStmtArgList.size());
        assertTrue(preparedStmtList.contains("NOT-2024-002"));
    }

    @Test
    void testGetBaseNotificationExistenceQuery_WithEmptyValues() {
        NotificationExists notification = NotificationExists.builder()
                .id(null)
                .notificationNumber("")
                .notificationType("")
                .build();

        String result = queryBuilder.getBaseNotificationExistenceQuery(
                notification,
                preparedStmtList,
                preparedStmtArgList
        );

        assertTrue(result.contains("SELECT  COUNT(*)  FROM dristi_notification"));
        assertEquals(0, preparedStmtList.size());
        assertEquals(0, preparedStmtArgList.size());
    }

    @Test
    void testGetBaseNotificationExistenceQuery_ThrowsException() {
        NotificationExists notification = NotificationExists.builder()
                .id(testUuid)
                .notificationNumber("NOT-2024-003")
                .build();

        try {
            queryBuilder.getBaseNotificationExistenceQuery(
                    notification,
                    null,
                    preparedStmtArgList
            );
            fail("Expected CustomException to be thrown");
        } catch (CustomException e) {
            assertTrue(e.getMessage().contains("Error occurred while building the notification exist query"));
        }
    }
}
