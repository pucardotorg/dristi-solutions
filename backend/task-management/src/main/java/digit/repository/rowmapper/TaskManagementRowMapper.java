package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.postgresql.util.PGobject;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import digit.web.models.TaskManagement;
import digit.web.models.PartyDetails;

@Component
@Slf4j
public class TaskManagementRowMapper implements ResultSetExtractor<List<TaskManagement>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public TaskManagementRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<TaskManagement> extractData(ResultSet rs) throws SQLException {
        Map<String, TaskManagement> taskMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                String id = rs.getString("id");
                TaskManagement task = taskMap.get(id);

                if (task == null) {
                    Long lastModifiedTime = rs.getLong("last_modified_time");
                    if (rs.wasNull()) {
                        lastModifiedTime = null;
                    }

                    AuditDetails auditDetails = AuditDetails.builder()
                            .createdBy(rs.getString("created_by"))
                            .createdTime(rs.getLong("created_time"))
                            .lastModifiedBy(rs.getString("last_modified_by"))
                            .lastModifiedTime(lastModifiedTime)
                            .build();

                    task = TaskManagement.builder()
                            .id(UUID.fromString(id))
                            .caseFilingNumber(rs.getString("case_filing_number"))
                            .courtId(rs.getString("court_id"))
                            .orderNumber(rs.getString("order_number"))
                            .status(rs.getString("status"))
                            .tenantId(rs.getString("tenant_id"))
                            .partyDetails(getObjectListFromJson(rs.getString("party_details"), new TypeReference<List<PartyDetails>>() {}))
                            .auditDetails(auditDetails)
                            .build();

                    // Handle JSONB columns

                    PGobject additionalDetailsObj = (PGobject) rs.getObject("additional_details");
                    if (additionalDetailsObj != null) {
                        task.setAdditionalDetails(objectMapper.readTree(additionalDetailsObj.getValue()));
                    }

                    taskMap.put(id, task);
                }
            }
        } catch (Exception e) {
            log.error("Error occurred while processing TaskManagement ResultSet", e);
            throw new CustomException("ROW_MAPPER_ERROR", "Error mapping TaskManagement result set: " + e.getMessage());
        }
        
        return new ArrayList<>(taskMap.values());
    }

    public <T> T getObjectListFromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            try {
                return objectMapper.readValue("[]", typeRef); // Return an empty object of the specified type
            } catch (IOException e) {
                throw new CustomException("Failed to create an empty instance of " + typeRef.getType(), e.getMessage());
            }
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            throw new CustomException("Failed to convert JSON to " + typeRef.getType(), e.getMessage());
        }
    }
}
