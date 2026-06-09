package org.pucar.dristi.repository.rowmapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TemplateConfigurationRowMapperTest {

    private TemplateConfigurationRowMapper rowMapper;

    @Mock
    private ResultSet resultSet;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        rowMapper = new TemplateConfigurationRowMapper(new ObjectMapper());
    }

    // =====================================================
    // SUCCESS - SINGLE ROW
    // =====================================================

    @Test
    void testExtractData_SingleRow() throws Exception {

        String uuid = UUID.randomUUID().toString();

        when(resultSet.next()).thenReturn(true).thenReturn(false);

        when(resultSet.getString("id")).thenReturn(uuid);
        when(resultSet.getString("tenant_id")).thenReturn("tenant1");
        when(resultSet.getString("court_id")).thenReturn("court1");
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("process_title")).thenReturn("Title");
        when(resultSet.getString("addressee_name")).thenReturn("Judge");
        when(resultSet.getString("process_text")).thenReturn("Text");
        when(resultSet.getBoolean("is_cover_letter_required")).thenReturn(true);
        when(resultSet.getString("addressee")).thenReturn("Court");
        when(resultSet.getString("order_text")).thenReturn("Order");
        when(resultSet.getString("cover_letter_text")).thenReturn("Cover");

        when(resultSet.getString("created_by")).thenReturn("user1");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user2");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);
        when(resultSet.wasNull()).thenReturn(false);

        List<?> result = rowMapper.extractData(resultSet);

        assertEquals(1, result.size());
        assertEquals(UUID.fromString(uuid),
                ((org.pucar.dristi.web.models.TemplateConfiguration) result.get(0)).getId());
    }

    // =====================================================
    // MULTIPLE ROWS WITH SAME ID (DEDUP TEST)
    // =====================================================

    @Test
    void testExtractData_DuplicateRows_ShouldReturnSingleObject() throws Exception {

        String uuid = UUID.randomUUID().toString();

        when(resultSet.next()).thenReturn(true, true, false);
        when(resultSet.getString("id")).thenReturn(uuid);

        when(resultSet.getString("tenant_id")).thenReturn("tenant1");
        when(resultSet.getString("court_id")).thenReturn("court1");
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("process_title")).thenReturn("Title");
        when(resultSet.getString("addressee_name")).thenReturn("Judge");
        when(resultSet.getString("process_text")).thenReturn("Text");
        when(resultSet.getBoolean("is_cover_letter_required")).thenReturn(true);
        when(resultSet.getString("addressee")).thenReturn("Court");
        when(resultSet.getString("order_text")).thenReturn("Order");
        when(resultSet.getString("cover_letter_text")).thenReturn("Cover");

        when(resultSet.getString("created_by")).thenReturn("user1");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user2");
        when(resultSet.getLong("last_modified_time")).thenReturn(2000L);
        when(resultSet.wasNull()).thenReturn(false);

        List<?> result = rowMapper.extractData(resultSet);

        assertEquals(1, result.size()); // deduplicated
    }

    // =====================================================
    // NULL last_modified_time TEST
    // =====================================================

    @Test
    void testExtractData_LastModifiedTimeNull() throws Exception {

        String uuid = UUID.randomUUID().toString();

        when(resultSet.next()).thenReturn(true).thenReturn(false);

        when(resultSet.getString("id")).thenReturn(uuid);
        when(resultSet.getString("tenant_id")).thenReturn("tenant1");
        when(resultSet.getString("court_id")).thenReturn("court1");
        when(resultSet.getBoolean("is_active")).thenReturn(true);
        when(resultSet.getString("process_title")).thenReturn("Title");
        when(resultSet.getString("addressee_name")).thenReturn("Judge");
        when(resultSet.getString("process_text")).thenReturn("Text");
        when(resultSet.getBoolean("is_cover_letter_required")).thenReturn(true);
        when(resultSet.getString("addressee")).thenReturn("Court");
        when(resultSet.getString("order_text")).thenReturn("Order");
        when(resultSet.getString("cover_letter_text")).thenReturn("Cover");

        when(resultSet.getString("created_by")).thenReturn("user1");
        when(resultSet.getLong("created_time")).thenReturn(1000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user2");

        when(resultSet.getLong("last_modified_time")).thenReturn(0L);
        when(resultSet.wasNull()).thenReturn(true); // simulate NULL column

        List<?> result = rowMapper.extractData(resultSet);

        var template = (org.pucar.dristi.web.models.TemplateConfiguration) result.get(0);

        assertNull(template.getAuditDetails().getLastModifiedTime());
    }

    // =====================================================
    // SQLException → CustomException
    // =====================================================

    @Test
    void testExtractData_ShouldThrowCustomException_WhenSQLException() throws Exception {

        when(resultSet.next()).thenThrow(new SQLException("DB error"));

        assertThrows(CustomException.class,
                () -> rowMapper.extractData(resultSet));
    }
}
