package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.TaskManagement;
import digit.web.models.enums.PartyType;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.postgresql.util.PGobject;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskManagementRowMapperTest {

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private TaskManagementRowMapper rowMapper;

    private ResultSet resultSet;

    @BeforeEach
    void setUp() {
        resultSet = mock(ResultSet.class);
    }

    @Test
    void extractData_SingleRow_ReturnsTaskList() throws SQLException {
        when(resultSet.next()).thenReturn(true, false);
        when(resultSet.getString("id")).thenReturn("task-id-123");
        when(resultSet.getString("filing_number")).thenReturn("KL-2024-001");
        when(resultSet.getString("court_id")).thenReturn("COURT-1");
        when(resultSet.getString("order_number")).thenReturn("ORDER-001");
        when(resultSet.getString("order_item_id")).thenReturn("ITEM-001");
        when(resultSet.getString("status")).thenReturn("PENDING");
        when(resultSet.getString("tenant_id")).thenReturn("kl");
        when(resultSet.getString("party_details")).thenReturn("[]");
        when(resultSet.getString("party_type")).thenReturn("COMPLAINANT");
        when(resultSet.getString("task_type")).thenReturn("PAYMENT");
        when(resultSet.getString("documents")).thenReturn("[]");
        when(resultSet.getString("task_management_number")).thenReturn("TM-001");
        when(resultSet.getString("created_by")).thenReturn("user-123");
        when(resultSet.getLong("created_time")).thenReturn(1704067200000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user-456");
        when(resultSet.getLong("last_modified_time")).thenReturn(1704153600000L);
        when(resultSet.getObject("additional_details")).thenReturn(null);

        List<TaskManagement> result = rowMapper.extractData(resultSet);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("task-id-123", result.get(0).getId());
        assertEquals("KL-2024-001", result.get(0).getFilingNumber());
        assertEquals("PENDING", result.get(0).getStatus());
        assertEquals(PartyType.COMPLAINANT, result.get(0).getPartyType());
    }

    @Test
    void extractData_MultipleRows_ReturnsList() throws SQLException {
        when(resultSet.next()).thenReturn(true, true, false);
        when(resultSet.getString("id")).thenReturn("task-1", "task-2");
        when(resultSet.getString("filing_number")).thenReturn("KL-2024-001", "KL-2024-002");
        when(resultSet.getString("court_id")).thenReturn("COURT-1");
        when(resultSet.getString("order_number")).thenReturn("ORDER-001");
        when(resultSet.getString("order_item_id")).thenReturn("ITEM-001");
        when(resultSet.getString("status")).thenReturn("PENDING");
        when(resultSet.getString("tenant_id")).thenReturn("kl");
        when(resultSet.getString("party_details")).thenReturn("[]");
        when(resultSet.getString("party_type")).thenReturn(null);
        when(resultSet.getString("task_type")).thenReturn("PAYMENT");
        when(resultSet.getString("documents")).thenReturn("[]");
        when(resultSet.getString("task_management_number")).thenReturn("TM-001", "TM-002");
        when(resultSet.getString("created_by")).thenReturn("user-123");
        when(resultSet.getLong("created_time")).thenReturn(1704067200000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user-456");
        when(resultSet.getLong("last_modified_time")).thenReturn(1704153600000L);
        when(resultSet.getObject("additional_details")).thenReturn(null);

        List<TaskManagement> result = rowMapper.extractData(resultSet);

        assertEquals(2, result.size());
    }

    @Test
    void extractData_EmptyResultSet_ReturnsEmptyList() throws SQLException {
        when(resultSet.next()).thenReturn(false);

        List<TaskManagement> result = rowMapper.extractData(resultSet);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void extractData_WithAdditionalDetails_ParsesJson() throws SQLException {
        PGobject pgObject = mock(PGobject.class);
        when(pgObject.getValue()).thenReturn("{\"key\": \"value\"}");

        when(resultSet.next()).thenReturn(true, false);
        when(resultSet.getString("id")).thenReturn("task-id-123");
        when(resultSet.getString("filing_number")).thenReturn("KL-2024-001");
        when(resultSet.getString("court_id")).thenReturn("COURT-1");
        when(resultSet.getString("order_number")).thenReturn("ORDER-001");
        when(resultSet.getString("order_item_id")).thenReturn("ITEM-001");
        when(resultSet.getString("status")).thenReturn("PENDING");
        when(resultSet.getString("tenant_id")).thenReturn("kl");
        when(resultSet.getString("party_details")).thenReturn("[]");
        when(resultSet.getString("party_type")).thenReturn(null);
        when(resultSet.getString("task_type")).thenReturn("PAYMENT");
        when(resultSet.getString("documents")).thenReturn("[]");
        when(resultSet.getString("task_management_number")).thenReturn("TM-001");
        when(resultSet.getString("created_by")).thenReturn("user-123");
        when(resultSet.getLong("created_time")).thenReturn(1704067200000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user-456");
        when(resultSet.getLong("last_modified_time")).thenReturn(1704153600000L);
        when(resultSet.getObject("additional_details")).thenReturn(pgObject);

        List<TaskManagement> result = rowMapper.extractData(resultSet);

        assertNotNull(result.get(0).getAdditionalDetails());
        com.fasterxml.jackson.databind.JsonNode additionalDetails = 
            (com.fasterxml.jackson.databind.JsonNode) result.get(0).getAdditionalDetails();
        assertEquals("value", additionalDetails.get("key").asText());
    }

    @Test
    void extractData_DuplicateId_SkipsDuplicate() throws SQLException {
        when(resultSet.next()).thenReturn(true, true, false);
        // Both rows have same ID
        when(resultSet.getString("id")).thenReturn("task-id-123", "task-id-123");
        when(resultSet.getString("filing_number")).thenReturn("KL-2024-001");
        when(resultSet.getString("court_id")).thenReturn("COURT-1");
        when(resultSet.getString("order_number")).thenReturn("ORDER-001");
        when(resultSet.getString("order_item_id")).thenReturn("ITEM-001");
        when(resultSet.getString("status")).thenReturn("PENDING");
        when(resultSet.getString("tenant_id")).thenReturn("kl");
        when(resultSet.getString("party_details")).thenReturn("[]");
        when(resultSet.getString("party_type")).thenReturn(null);
        when(resultSet.getString("task_type")).thenReturn("PAYMENT");
        when(resultSet.getString("documents")).thenReturn("[]");
        when(resultSet.getString("task_management_number")).thenReturn("TM-001");
        when(resultSet.getString("created_by")).thenReturn("user-123");
        when(resultSet.getLong("created_time")).thenReturn(1704067200000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user-456");
        when(resultSet.getLong("last_modified_time")).thenReturn(1704153600000L);
        when(resultSet.getObject("additional_details")).thenReturn(null);

        List<TaskManagement> result = rowMapper.extractData(resultSet);

        // Should only have 1 task since both have same ID
        assertEquals(1, result.size());
    }

    @Test
    void getObjectListFromJson_NullJson_ReturnsEmptyList() {
        List<Object> result = rowMapper.getObjectListFromJson(null, new TypeReference<List<Object>>() {});
        
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getObjectListFromJson_EmptyJson_ReturnsEmptyList() {
        List<Object> result = rowMapper.getObjectListFromJson("", new TypeReference<List<Object>>() {});
        
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getObjectListFromJson_ValidJson_ReturnsParsedList() {
        String json = "[{\"key\": \"value\"}]";
        
        List<Object> result = rowMapper.getObjectListFromJson(json, new TypeReference<List<Object>>() {});
        
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    void getObjectListFromJson_InvalidJson_ThrowsException() {
        String invalidJson = "not valid json";
        
        assertThrows(CustomException.class, () -> 
            rowMapper.getObjectListFromJson(invalidJson, new TypeReference<List<Object>>() {}));
    }

    @Test
    void extractData_NullPartyType_ReturnsNullPartyType() throws SQLException {
        when(resultSet.next()).thenReturn(true, false);
        when(resultSet.getString("id")).thenReturn("task-id-123");
        when(resultSet.getString("filing_number")).thenReturn("KL-2024-001");
        when(resultSet.getString("court_id")).thenReturn("COURT-1");
        when(resultSet.getString("order_number")).thenReturn("ORDER-001");
        when(resultSet.getString("order_item_id")).thenReturn("ITEM-001");
        when(resultSet.getString("status")).thenReturn("PENDING");
        when(resultSet.getString("tenant_id")).thenReturn("kl");
        when(resultSet.getString("party_details")).thenReturn("[]");
        when(resultSet.getString("party_type")).thenReturn(null);
        when(resultSet.getString("task_type")).thenReturn("PAYMENT");
        when(resultSet.getString("documents")).thenReturn("[]");
        when(resultSet.getString("task_management_number")).thenReturn("TM-001");
        when(resultSet.getString("created_by")).thenReturn("user-123");
        when(resultSet.getLong("created_time")).thenReturn(1704067200000L);
        when(resultSet.getString("last_modified_by")).thenReturn("user-456");
        when(resultSet.getLong("last_modified_time")).thenReturn(1704153600000L);
        when(resultSet.getObject("additional_details")).thenReturn(null);

        List<TaskManagement> result = rowMapper.extractData(resultSet);

        assertNull(result.get(0).getPartyType());
    }
}
