package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.Bail;
import digit.web.models.Document;
import digit.web.models.WorkflowObject;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

@Component
public class BailRowMapper implements RowMapper<Bail> {
    private final ObjectMapper objectMapper;

    @Autowired
    public BailRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Bail mapRow(ResultSet rs, int rowNum) throws SQLException {
        List<String> suretyIds = getListFromJson(rs.getString("suretyIds"));
        List<Document> documents = getObjectFromJson(rs.getString("documents"), new TypeReference<List<Document>>() {});
        Object additionalDetails = getObjectFromJson(rs.getString("additionalDetails"), new TypeReference<Object>() {});
        AuditDetails auditDetails = getObjectFromJson(rs.getString("auditDetails"), new TypeReference<AuditDetails>() {});
        WorkflowObject workflow = getObjectFromJson(rs.getString("workflow"), new TypeReference<WorkflowObject>() {});

        return Bail.builder()
                .id(rs.getString("id"))
                .tenantId(rs.getString("tenantId"))
                .caseId(rs.getString("caseId"))
                .bailAmount(rs.getObject("bailAmount") != null ? rs.getDouble("bailAmount") : null)
                .bailType(rs.getString("bailType"))
                .status(rs.getString("status"))
                .startDate(rs.getObject("startDate") != null ? rs.getLong("startDate") : null)
                .endDate(rs.getObject("endDate") != null ? rs.getLong("endDate") : null)
                .isActive(rs.getObject("isActive") != null ? rs.getBoolean("isActive") : null)
                .accusedId(rs.getString("accusedId"))
                .advocateId(rs.getString("advocateId"))
                .suretyIds(suretyIds)
                .documents(documents)
                .additionalDetails(additionalDetails)
                .auditDetails(auditDetails)
                .workflow(workflow)
                .build();
    }

    private List<String> getListFromJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private <T> T getObjectFromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            try {
                if (typeRef.getType().equals(new TypeReference<List<Document>>() {}.getType()) || typeRef.getType().equals(new TypeReference<List<String>>() {}.getType())) {
                    return objectMapper.readValue("[]", typeRef);
                }
                return objectMapper.readValue("{}", typeRef);
            } catch (Exception e) {
                return null;
            }
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            return null;
        }
    }
}
