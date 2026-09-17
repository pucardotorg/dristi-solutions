package digit.repository.rowmapper;

import digit.web.models.SurveyTracker;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SurveyTrackerRowMapperTest {

    @InjectMocks
    private SurveyTrackerRowMapper rowMapper;

    @Mock
    private ResultSet resultSet;

    @Test
    public void testExtractData_Success_SingleRow() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("test-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT");
        when(resultSet.getString("tenant_id")).thenReturn("pg");
        when(resultSet.getObject("remind_me_later")).thenReturn(true);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(true);
        when(resultSet.getLong("last_triggered_date")).thenReturn(1634567890000L);
        when(resultSet.getInt("attempts")).thenReturn(3);
        when(resultSet.getString("created_by")).thenReturn("creator-uuid");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier-uuid");
        when(resultSet.getLong("created_time")).thenReturn(1634567890000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1634567900000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        
        SurveyTracker tracker = result.get(0);
        assertEquals("test-user-uuid", tracker.getUserUuid());
        assertEquals("LITIGANT", tracker.getUserType());
        assertEquals("pg", tracker.getTenantId());
        assertTrue(tracker.getRemindMeLater());
        assertEquals(3, tracker.getAttempts());
        
        assertNotNull(tracker.getAuditDetails());
        assertEquals("creator-uuid", tracker.getAuditDetails().getCreatedBy());
        assertEquals("modifier-uuid", tracker.getAuditDetails().getLastModifiedBy());
        assertEquals(1634567890000L, tracker.getAuditDetails().getCreatedTime());
        assertEquals(1634567900000L, tracker.getAuditDetails().getLastModifiedTime());
    }

    @Test
    public void testExtractData_Success_MultipleRows() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(true).thenReturn(false);
        
        // First row
        when(resultSet.getString("user_uuid")).thenReturn("user-1", "user-2");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT", "ADVOCATE");
        when(resultSet.getString("tenant_id")).thenReturn("pg", "pb");
        when(resultSet.getObject("remind_me_later")).thenReturn(true, false);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(true, false);
        when(resultSet.getLong("last_triggered_date")).thenReturn(1000000L, 2000000L);
        when(resultSet.getInt("attempts")).thenReturn(1, 2);
        when(resultSet.getString("created_by")).thenReturn("creator-1", "creator-2");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier-1", "modifier-2");
        when(resultSet.getLong("created_time")).thenReturn(1000000L, 2000000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1100000L, 2100000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        
        assertEquals("user-1", result.get(0).getUserUuid());
        assertEquals("LITIGANT", result.get(0).getUserType());
        assertEquals("user-2", result.get(1).getUserUuid());
        assertEquals("ADVOCATE", result.get(1).getUserType());
    }

    @Test
    public void testExtractData_Success_EmptyResultSet() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(false);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    public void testExtractData_NullRemindMeLater() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("test-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT");
        when(resultSet.getString("tenant_id")).thenReturn("pg");
        when(resultSet.getObject("remind_me_later")).thenReturn(null);
        when(resultSet.getLong("last_triggered_date")).thenReturn(1634567890000L);
        when(resultSet.getInt("attempts")).thenReturn(0);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("created_time")).thenReturn(1000000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1100000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertNull(result.get(0).getRemindMeLater());
    }

    @Test
    public void testExtractData_ZeroExpiryDate_ReturnsNull() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("test-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT");
        when(resultSet.getString("tenant_id")).thenReturn("pg");
        when(resultSet.getObject("remind_me_later")).thenReturn(false);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(false);
        when(resultSet.getLong("last_triggered_date")).thenReturn(0L); // Zero expiry date
        when(resultSet.getInt("attempts")).thenReturn(0);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("created_time")).thenReturn(1000000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1100000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertNull(result.get(0).getLastTriggeredDate()); // Should be null when 0
    }

    @Test
    public void testExtractData_NonZeroExpiryDate_ReturnsValue() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("test-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT");
        when(resultSet.getString("tenant_id")).thenReturn("pg");
        when(resultSet.getObject("remind_me_later")).thenReturn(false);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(false);
        when(resultSet.getLong("last_triggered_date")).thenReturn(1634567890000L);
        when(resultSet.getInt("attempts")).thenReturn(0);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("created_time")).thenReturn(1000000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1100000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1634567890000L, result.get(0).getLastTriggeredDate());
    }

    @Test
    public void testExtractData_SQLException_ThrowsCustomException() throws SQLException {
        // Arrange
        when(resultSet.next()).thenThrow(new SQLException("Database error"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            rowMapper.extractData(resultSet);
        });

        assertEquals("ROW_MAPPER_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("Error occurred while processing SurveyTracker ResultSet"));
    }

    @Test
    public void testExtractData_NullPointerException_ThrowsCustomException() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("user_uuid")).thenThrow(new NullPointerException("Null value"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            rowMapper.extractData(resultSet);
        });

        assertEquals("ROW_MAPPER_EXCEPTION", exception.getCode());
    }

    @Test
    public void testExtractData_RemindMeLaterFalse() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("test-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT");
        when(resultSet.getString("tenant_id")).thenReturn("pg");
        when(resultSet.getObject("remind_me_later")).thenReturn(false);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(false);
        when(resultSet.getLong("last_triggered_date")).thenReturn(1634567890000L);
        when(resultSet.getInt("attempts")).thenReturn(0);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("created_time")).thenReturn(1000000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1100000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertFalse(result.get(0).getRemindMeLater());
    }

    @Test
    public void testExtractData_AllFieldsPopulated() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("complete-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("ADVOCATE");
        when(resultSet.getString("tenant_id")).thenReturn("complete-tenant");
        when(resultSet.getObject("remind_me_later")).thenReturn(true);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(true);
        when(resultSet.getLong("last_triggered_date")).thenReturn(9999999999999L);
        when(resultSet.getInt("attempts")).thenReturn(999);
        when(resultSet.getString("created_by")).thenReturn("complete-creator");
        when(resultSet.getString("last_modified_by")).thenReturn("complete-modifier");
        when(resultSet.getLong("created_time")).thenReturn(1111111111111L);
        when(resultSet.getLong("last_modified_time")).thenReturn(2222222222222L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        
        SurveyTracker tracker = result.get(0);
        assertEquals("complete-user-uuid", tracker.getUserUuid());
        assertEquals("ADVOCATE", tracker.getUserType());
        assertEquals("complete-tenant", tracker.getTenantId());
        assertTrue(tracker.getRemindMeLater());
        assertEquals(9999999999999L, tracker.getLastTriggeredDate());
        assertEquals(999, tracker.getAttempts());
        assertEquals("complete-creator", tracker.getAuditDetails().getCreatedBy());
        assertEquals("complete-modifier", tracker.getAuditDetails().getLastModifiedBy());
        assertEquals(1111111111111L, tracker.getAuditDetails().getCreatedTime());
        assertEquals(2222222222222L, tracker.getAuditDetails().getLastModifiedTime());
    }

    @Test
    public void testExtractData_ZeroAttempts() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("test-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT");
        when(resultSet.getString("tenant_id")).thenReturn("pg");
        when(resultSet.getObject("remind_me_later")).thenReturn(false);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(false);
        when(resultSet.getLong("last_triggered_date")).thenReturn(1000000L);
        when(resultSet.getInt("attempts")).thenReturn(0);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("created_time")).thenReturn(1000000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1100000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertEquals(0, result.get(0).getAttempts());
    }

    @Test
    public void testExtractData_HighAttempts() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false);
        when(resultSet.getString("user_uuid")).thenReturn("test-user-uuid");
        when(resultSet.getString("user_type")).thenReturn("LITIGANT");
        when(resultSet.getString("tenant_id")).thenReturn("pg");
        when(resultSet.getObject("remind_me_later")).thenReturn(true);
        when(resultSet.getBoolean("remind_me_later")).thenReturn(true);
        when(resultSet.getLong("last_triggered_date")).thenReturn(1000000L);
        when(resultSet.getInt("attempts")).thenReturn(100);
        when(resultSet.getString("created_by")).thenReturn("creator");
        when(resultSet.getString("last_modified_by")).thenReturn("modifier");
        when(resultSet.getLong("created_time")).thenReturn(1000000L);
        when(resultSet.getLong("last_modified_time")).thenReturn(1100000L);

        // Act
        List<SurveyTracker> result = rowMapper.extractData(resultSet);

        // Assert
        assertEquals(100, result.get(0).getAttempts());
    }
}
