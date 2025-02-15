package notification.repository.rowmapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import notification.repository.rowmapper.NotificationRowMapper;
import notification.web.models.Notification;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class NotificationRowMapperTest {

    @Mock
    private ResultSet resultSet;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private NotificationRowMapper rowMapper;

    @BeforeEach
    void setUp() {
        rowMapper = new NotificationRowMapper(objectMapper);
    }

    @Test
    void testExtractData_SingleRow() throws SQLException {
        when(resultSet.next()).thenReturn(true, false);
        when(resultSet.getString("id")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("tenantid")).thenReturn("tenant_1");
        when(resultSet.getString("notificationnumber")).thenReturn("NOTIF123");
        when(resultSet.getString("notificationtype")).thenReturn("ALERT");
        when(resultSet.getString("additionaldetails")).thenReturn(null);
        when(resultSet.getString("courtid")).thenReturn("C123");
        when(resultSet.getString("casenumber")).thenReturn("[]");
        when(resultSet.getBoolean("isactive")).thenReturn(true);
        when(resultSet.getString("createdby")).thenReturn("user_1");
        when(resultSet.getLong("createdtime")).thenReturn(123456789L);
        when(resultSet.getString("lastmodifiedby")).thenReturn("user_2");
        when(resultSet.getLong("lastmodifiedtime")).thenReturn(987654321L);

        List<Notification> result = rowMapper.extractData(resultSet);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("tenant_1", result.get(0).getTenantId());
    }

    @Test
    void testExtractData_MultipleRows() throws SQLException {
        when(resultSet.next()).thenReturn(true, true, false);
        when(resultSet.getString("id")).thenReturn(UUID.randomUUID().toString(), UUID.randomUUID().toString());

        List<Notification> result = rowMapper.extractData(resultSet);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

//    @Test
//    void testExtractData_WithDocuments() throws SQLException {
//        // Setup test data
//        String notificationId = UUID.randomUUID().toString();
//        String documentId = UUID.randomUUID().toString();
//        String caseNumberJson = "[\"CASE-2024-001\", \"CASE-2024-002\"]";
//        List<Document> documents = new ArrayList<>();
//
//        // Stub all required ResultSet methods
//        when(resultSet.next()).thenReturn(true, false);
//        when(resultSet.getString("id")).thenReturn(notificationId);
//        when(resultSet.getString("tenantid")).thenReturn("tenant_1");
//        when(resultSet.getString("notificationnumber")).thenReturn("NOTIF-2024-001");
//        when(resultSet.getString("notificationtype")).thenReturn("COURT_NOTICE");
//        when(resultSet.getString("additionaldetails")).thenReturn("{}");
//        when(resultSet.getString("courtid")).thenReturn("COURT-001");
//        when(resultSet.getString("casenumber")).thenReturn(caseNumberJson);
//        when(resultSet.getBoolean("isactive")).thenReturn(true);
//        when(resultSet.getString("notificationdetails")).thenReturn("Test notification");
//        when(resultSet.getString("issuedby")).thenReturn("Judge Smith");
//        when(resultSet.getLong("createddate")).thenReturn(123456789L);
//        when(resultSet.getString("comments")).thenReturn("Test comments");
//
//        // Audit details stubs
//        when(resultSet.getString("createdby")).thenReturn("user_1");
//        when(resultSet.getLong("createdtime")).thenReturn(123456789L);
//        when(resultSet.getString("lastmodifiedby")).thenReturn("user_2");
//        when(resultSet.getLong("lastmodifiedtime")).thenReturn(987654321L);
//
//        // Document stubs
//        when(resultSet.getString("document_id")).thenReturn(documentId);
//        when(resultSet.getString("documentid")).thenReturn(documentId);
//        when(resultSet.getString("documenttype")).thenReturn("PDF");
//        when(resultSet.getString("documentuid")).thenReturn("DOC-001");
//        when(resultSet.getString("filestore")).thenReturn("file-001");
//
//        // Execute the method under test
//        List<Notification> result = rowMapper.extractData(resultSet);
//
//        // Verify the results
//        assertNotNull(result);
//        assertEquals(1, result.size());
//
//        Notification resultNotification = result.get(0);
//        assertEquals(UUID.fromString(notificationId), resultNotification.getId());
//        assertEquals("tenant_1", resultNotification.getTenantId());
//        assertEquals("NOTIF-2024-001", resultNotification.getNotificationNumber());
//        assertEquals("COURT_NOTICE", resultNotification.getNotificationType());
//        assertEquals("Test notification", resultNotification.getNotificationDetails());
//        assertTrue(resultNotification.getIsActive());
//
//        // Verify case numbers
//        List<String> caseNumbers = resultNotification.getCaseNumber();
//        assertNotNull(caseNumbers);
//        assertEquals(2, caseNumbers.size());
//        assertEquals("CASE-2024-001", caseNumbers.get(0));
//        assertEquals("CASE-2024-002", caseNumbers.get(1));
//    }


    @Test
    void testGetObjectFromJson_HandlesEmptyJson() {
        TypeReference<List<String>> typeRef = new TypeReference<>() {};
        List<String> result = rowMapper.getObjectFromJson("", typeRef);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

//    @Test
//    void testGetObjectFromJson_ThrowsExceptionOnInvalidJson() {
//        TypeReference<List<String>> typeRef = new TypeReference<>() {};
//        assertThrows(CustomException.class, () -> rowMapper.getObjectFromJson("{"
//                , typeRef));
//    }

//    @Test
//    void testGetObjectFromJsonWithValidJson() {
//        String json = "[\"value1\", \"value2\"]";
//        TypeReference<List<String>> typeRef = new TypeReference<>() {};
//        List<String> result = rowMapper.getObjectFromJson(json, typeRef);
//        assertNotNull(result);
//        assertEquals(2, result.size());
//        assertEquals("value1", result.get(0));
//        assertEquals("value2", result.get(1));
//    }

//    @Test
//    void testGetObjectFromJson_ThrowsExceptionOnInvalidJson() throws SQLException {
//        TypeReference<List<String>> typeRef = new TypeReference<>() {}; // Ensure initialization
//        when(resultSet.next()).thenThrow(new CustomException());
//
//        assertThrows(CustomException.class, () -> rowMapper.getObjectFromJson("{", typeRef));
//    }

}


