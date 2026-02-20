package digit.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.AuditDetails;
import digit.web.models.TypeEnum;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import digit.web.models.DigitalizedDocument;
import digit.web.models.Document;
import digit.web.models.PleaDetails;
import digit.web.models.ExaminationOfAccusedDetails;
import digit.web.models.MediationDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class DigitalizedDocumentRowMapper implements ResultSetExtractor<List<DigitalizedDocument>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public DigitalizedDocumentRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<DigitalizedDocument> extractData(ResultSet rs) {
        Map<String, DigitalizedDocument> digitalizedDocumentMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                String uuid = rs.getString("id");
                DigitalizedDocument digitalizedDocument = digitalizedDocumentMap.get(uuid);

                if (digitalizedDocument == null) {
                    Long lastModifiedTime = rs.getLong("last_modified_time");
                    if (rs.wasNull()) {
                        lastModifiedTime = null;
                    }

                    AuditDetails auditdetails = AuditDetails.builder()
                            .createdBy(rs.getString("created_by"))
                            .createdTime(rs.getLong("created_time"))
                            .lastModifiedBy(rs.getString("last_modified_by"))
                            .lastModifiedTime(lastModifiedTime)
                            .build();

                    digitalizedDocument = DigitalizedDocument.builder()
                            .id(uuid)
                            .type(TypeEnum.valueOf(rs.getString("type")))
                            .documentNumber(rs.getString("document_number"))
                            .caseId(rs.getString("case_id"))
                            .caseFilingNumber(rs.getString("case_filing_number"))
                            .status(rs.getString("status"))
                            .tenantId(rs.getString("tenant_id"))
                            .courtId(rs.getString("court_id"))
                            .orderItemId(rs.getString("order_item_id"))
                            .orderNumber(rs.getString("order_number"))
                            .shortenedUrl(rs.getString("shortened_url"))
                            .auditDetails(auditdetails)
                            .build();

                    // Parse JSONB fields
                    digitalizedDocument.setPleaDetails(parseJsonField(rs, "plea_details", PleaDetails.class));
                    digitalizedDocument.setExaminationOfAccusedDetails(parseJsonField(rs, "examination_of_accused_details", ExaminationOfAccusedDetails.class));
                    digitalizedDocument.setMediationDetails(parseJsonField(rs, "mediation_details", MediationDetails.class));
                    digitalizedDocument.setAdditionalDetails(parseJsonField(rs, "additional_details", Map.class));
                    digitalizedDocument.setDocuments(parseJsonField(rs, "documents", new TypeReference<List<Document>>() {}));

                    digitalizedDocumentMap.put(uuid, digitalizedDocument);
                }
            }

            return new ArrayList<>(digitalizedDocumentMap.values());

        } catch (Exception e) {
            log.error("Error while mapping digitalized document result set", e);
            throw new CustomException("ROW_MAPPER_EXCEPTION", "Error while mapping digitalized document result set: " + e.getMessage());
        }
    }

    private <T> T parseJsonField(ResultSet rs, String fieldName, Class<T> clazz) {
        try {
            PGobject pGobject = (PGobject) rs.getObject(fieldName);
            if (pGobject != null) {
                return objectMapper.readValue(pGobject.getValue(), clazz);
            }
        } catch (IOException | java.sql.SQLException e) {
            log.info("Failed to parse JSON field: " + fieldName, e);
        }
        return null;
    }

    private <T> T parseJsonField(ResultSet rs, String fieldName, TypeReference<T> typeReference) {
        try {
            PGobject pGobject = (PGobject) rs.getObject(fieldName);
            if (pGobject != null) {
                return objectMapper.readValue(pGobject.getValue(), typeReference);
            }
        } catch (IOException | java.sql.SQLException e) {
            log.error("Failed to parse JSON field: " + fieldName, e);
        }
        return null;
    }
}
