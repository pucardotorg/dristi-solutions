package notification.repository.rowmapper;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import notification.web.models.Notification;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@ExtendWith(MockitoExtension.class)
class NotificationRowMapperTest {

    @Mock
    private ResultSet resultSet;

    @Mock
    private ObjectMapper objectMapper;

    private NotificationRowMapper rowMapper;

    @BeforeEach
    void setUp() {
        rowMapper = new NotificationRowMapper(objectMapper);
    }

    @Test
    void testExtractData_SingleRow() throws Exception {
        String notificationId = UUID.randomUUID().toString();
        when(resultSet.next()).thenReturn(true, false);
        when(resultSet.getString("id")).thenReturn(notificationId);
        mockCommonNotificationColumns();
        mockAuditDetails();
        mockDocumentData(false);
        mockCaseNumber("[]", Collections.emptyList());

        List<Notification> result = rowMapper.extractData(resultSet);

        assertNotNull(result);
        assertEquals(1, result.size());
        Notification notification = result.get(0);
        assertEquals(notificationId, notification.getId().toString());
        assertEquals("tenant_1", notification.getTenantId());
        assertTrue(notification.getCaseNumber().isEmpty());
    }

    @Test
    void testExtractData_MultipleNotifications() throws Exception {
        String id1 = UUID.randomUUID().toString();
        String id2 = UUID.randomUUID().toString();

        when(resultSet.next()).thenReturn(true, true, false);

        when(resultSet.getString("id")).thenReturn(id1, id2);

        mockCommonNotificationColumns();
        mockCommonNotificationColumns();

        mockAuditDetails();
        mockDocumentData(false);
        mockCaseNumber("[]", Collections.emptyList());

        List<Notification> result = rowMapper.extractData(resultSet);

        assertEquals(2, result.size());
        assertNotEquals(result.get(0).getId(), result.get(1).getId());
    }


    @Test
    void testExtractData_WithDocuments() throws Exception {
        String notificationId = UUID.randomUUID().toString();
        List<String> caseNumbers = Arrays.asList("CASE-001", "CASE-002");

        when(resultSet.next()).thenReturn(true, false);
        when(resultSet.getString("id")).thenReturn(notificationId);
        mockCommonNotificationColumns();
        mockAuditDetails();
        mockDocumentData(true);
        mockCaseNumber("[\"CASE-001\", \"CASE-002\"]", caseNumbers);

        List<Notification> result = rowMapper.extractData(resultSet);

        Notification notification = result.get(0);
        assertEquals(1, notification.getDocuments().size());
        assertEquals(2, notification.getCaseNumber().size());
        assertEquals("DOC-001", notification.getDocuments().get(0).getDocumentUid());
    }

    @Test
    void testGetObjectFromJson_ValidJson() throws Exception {
        List<String> expected = Arrays.asList("item1", "item2");
        TypeReference<List<String>> typeRef = new TypeReference<>() {};

        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
                .thenReturn(expected);

        List<String> result = rowMapper.getObjectFromJson("valid_json", typeRef);

        assertEquals(expected, result);
    }

    @Test
    void testGetObjectFromJson_EmptyJson() {
        TypeReference<List<String>> typeRef = new TypeReference<>() {};
        List<String> result = rowMapper.getObjectFromJson("", typeRef);

        assertTrue(result.isEmpty());
    }

    @Test
    void testGetObjectFromJson_InvalidJson() throws Exception {
        TypeReference<List<String>> typeRef = new TypeReference<>() {};

        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
                .thenThrow(new JsonProcessingException("Invalid JSON") {});

        assertThrows(CustomException.class,
                () -> rowMapper.getObjectFromJson("invalid_json", typeRef));
    }

    private void mockCommonNotificationColumns() throws SQLException {
        when(resultSet.getString("tenantid")).thenReturn("tenant_1");
        when(resultSet.getString("notificationnumber")).thenReturn("NOTIF123");
        when(resultSet.getString("notificationtype")).thenReturn("ALERT");
        when(resultSet.getString("additionaldetails")).thenReturn("{}");
        when(resultSet.getString("courtid")).thenReturn("C123");
        when(resultSet.getBoolean("isactive")).thenReturn(true);
        when(resultSet.getString("notificationdetails")).thenReturn("details");
        when(resultSet.getString("issuedby")).thenReturn("issuer");
        when(resultSet.getLong("createddate")).thenReturn(123L);
        when(resultSet.getString("comment")).thenReturn("comments");
    }

    private void mockAuditDetails() throws SQLException {
        when(resultSet.getString("createdby")).thenReturn("creator");
        when(resultSet.getLong("createdtime")).thenReturn(123L);
        when(resultSet.getString("lastmodifiedby")).thenReturn("modifier");
        when(resultSet.getLong("lastmodifiedtime")).thenReturn(456L);
    }

    private void mockDocumentData(boolean withDocument) throws SQLException {
        if (withDocument) {
            when(resultSet.getString("documentid")).thenReturn("doc-123");
            when(resultSet.getString("documentid")).thenReturn("doc-123");
            when(resultSet.getString("documenttype")).thenReturn("PDF");
            when(resultSet.getString("documentuid")).thenReturn("DOC-001");
            when(resultSet.getString("filestore")).thenReturn("store-001");
        }
    }

    private void mockCaseNumber(String json, List<String> returnValue) throws Exception {
        when(resultSet.getString("casenumber")).thenReturn(json);
        when(objectMapper.readValue(eq(json), any(TypeReference.class)))
                .thenReturn(returnValue);
    }
}


