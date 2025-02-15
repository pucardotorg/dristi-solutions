package notification.repository.rowmapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import notification.web.models.NotificationExists;
import notification.repository.rowmapper.NotificationExistsRowMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.dao.DataAccessException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

class NotificationExistsRowMapperTest {

    private NotificationExistsRowMapper rowMapper;
    private ResultSet resultSet;

    @BeforeEach
    void setUp() {
        rowMapper = new NotificationExistsRowMapper();
        resultSet = mock(ResultSet.class);
    }

    @Test
    void testExtractData_WithValidResultSet_ShouldReturnNotificationList() throws SQLException, DataAccessException {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        when(resultSet.next()).thenReturn(true, true, false);
        when(resultSet.getString("id")).thenReturn(id1.toString(), id2.toString());
        when(resultSet.getString("notificationNumber")).thenReturn("N123", "N456");
        when(resultSet.getString("notificationType")).thenReturn("TYPE_A", "TYPE_B");
        when(resultSet.getBoolean("exists")).thenReturn(true, false);

        List<NotificationExists> result = rowMapper.extractData(resultSet);

        assertNotNull(result);
        assertEquals(2, result.size());

        assertEquals(id1, result.get(0).getId());
        assertEquals("N123", result.get(0).getNotificationNumber());
        assertEquals("TYPE_A", result.get(0).getNotificationType());
        assertTrue(result.get(0).getExists());

        assertEquals(id2, result.get(1).getId());
        assertEquals("N456", result.get(1).getNotificationNumber());
        assertEquals("TYPE_B", result.get(1).getNotificationType());
        assertFalse(result.get(1).getExists());
    }

    @Test
    void testExtractData_WithEmptyResultSet_ShouldReturnEmptyList() throws SQLException, DataAccessException {
        when(resultSet.next()).thenReturn(false);

        List<NotificationExists> result = rowMapper.extractData(resultSet);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testExtractData_WithSQLException_ShouldThrowException() throws SQLException {
        when(resultSet.next()).thenThrow(new SQLException("Database error"));

        assertThrows(SQLException.class, () -> rowMapper.extractData(resultSet));
    }
}

