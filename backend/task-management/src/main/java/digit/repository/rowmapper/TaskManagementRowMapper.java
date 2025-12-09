package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.TaskManagement;
import digit.web.models.enums.PartyType;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
@Slf4j
public class TaskManagementRowMapper implements ResultSetExtractor<List<TaskManagement>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public TaskManagementRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<TaskManagement> extractData(ResultSet rs) {
        Map<String, TaskManagement> taskMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                String id = rs.getString("id");
                TaskManagement task = taskMap.get(id);

                if (task == null) {

                    AuditDetails auditDetails = AuditDetails.builder()
                            .createdBy(rs.getString("created_by"))
                            .createdTime(rs.getLong("created_time"))
                            .lastModifiedBy(rs.getString("last_modified_by"))
                            .lastModifiedTime(rs.getLong("last_modified_time"))
                            .build();

                    task = TaskManagement.builder()
                            .id(id)
                            .filingNumber(rs.getString("filing_number"))
                            .courtId(rs.getString("court_id"))
                            .orderNumber(rs.getString("order_number"))
                            .orderItemId(rs.getString("order_item_id"))
                            .status(rs.getString("status"))
                            .tenantId(rs.getString("tenant_id"))
                            .partyDetails(getObjectListFromJson(rs.getString("party_details"), new TypeReference<>() {
                            }))
                            .partyType(getPartyType(rs))
                            .taskType(rs.getString("task_type"))
                            .documents(getObjectListFromJson(rs.getString("documents"), new TypeReference<>() {
                            }))
                            .taskManagementNumber(rs.getString("task_management_number"))
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

    private PartyType getPartyType(ResultSet rs) throws SQLException {
        String type = rs.getString("party_type");
        return type == null ? null : PartyType.valueOf(type);
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
