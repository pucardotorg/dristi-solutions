package notification.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import lombok.extern.slf4j.Slf4j;
import notification.web.models.Notification;
import org.egov.common.contract.models.AuditDetails;
import notification.web.models.Document;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
@Slf4j
public class NotificationRowMapper implements ResultSetExtractor<List<Notification>> {

    private final ObjectMapper mapper;

    @Autowired
    public NotificationRowMapper(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public List<Notification> extractData(ResultSet rs) throws SQLException, DataAccessException {
        List<Notification> notifications = new ArrayList<>();
        Map<String, Notification> notificationMap = new HashMap<>();

        while (rs.next()) {
            String notificationId = rs.getString("id");

            Notification notification = notificationMap.get(notificationId);
            if (notification == null) {

                AuditDetails auditdetails = AuditDetails.builder()
                        .createdBy(rs.getString("createdby"))
                        .createdTime(rs.getLong("createdtime"))
                        .lastModifiedBy(rs.getString("lastmodifiedby"))
                        .lastModifiedTime(rs.getLong("lastmodifiedtime"))
                        .build();

                notification = Notification.builder()
                        .id(UUID.fromString(notificationId))
                        .tenantId(rs.getString("tenantid"))
                        .notificationNumber(rs.getString("notificationnumber"))
                        .notificationType(rs.getString("notificationtype"))
                        .additionalDetails(rs.getString("additionaldetails"))
                        .courtId(rs.getString("courtid"))
                        .caseNumber(getObjectFromJson(rs.getString("casenumber"), new TypeReference<List<String>>() {
                        }))
                        .isActive(rs.getBoolean("isactive"))
                        .auditDetails(auditdetails)
                        .notificationDetails(rs.getString("notificationdetails"))
                        .additionalDetails(getObjectFromJson(rs.getString("additionaldetails"), new TypeReference<Map<String, Object>>() {}))
                        .issuedBy(rs.getString("issuedby"))
                        .createdDate(rs.getLong("createddate"))
                        .comments(rs.getString("comment"))
                        .documents(new ArrayList<>())
                        .build();
                notifications.add(notification);
                notificationMap.put(notificationId, notification);
            }

            // Handle associated document if it exists
            String documentId = rs.getString("documentid"); // Ensure column exists in query
            if (documentId != null) {
                Document document = Document.builder()
                        .id(rs.getString("documentid"))
                        .additionalDetails(getObjectFromJson(rs.getString("additionaldetails"), new TypeReference<Map<String, Object>>() {}))
                        .documentType(rs.getString("documenttype"))
                        .documentUid(rs.getString("documentuid"))
                        .fileStore(rs.getString("filestore"))
                        .isActive(rs.getBoolean("isActive")).build();
                notification.getDocuments().add(document);
            }
        }
        return notifications;
    }

    public <T> T getObjectFromJson(String json, TypeReference<T> typeRef) {
        log.info("Converting JSON to type: {}", typeRef.getType());
        log.info("JSON content: {}", json);

        try {
            if (json == null || json.trim().isEmpty()) {
                if (isListType(typeRef)) {
                    return (T) new ArrayList<>(); // Return an empty list for list types
                } else {
                    return mapper.readValue("{}", typeRef); // Return an empty object for other types
                }
            }

            // Attempt to parse the JSON
            return mapper.readValue(json, typeRef);
        } catch (IOException e) {
            log.error("Failed to convert JSON to {}", typeRef.getType(), e);
            throw new CustomException("Failed to convert JSON to " + typeRef.getType(), e.getMessage());
        }
    }

    private <T> boolean isListType(TypeReference<T> typeRef) {
        Class<?> rawClass = TypeFactory.defaultInstance().constructType(typeRef.getType()).getRawClass();
        return List.class.isAssignableFrom(rawClass);
    }

}
