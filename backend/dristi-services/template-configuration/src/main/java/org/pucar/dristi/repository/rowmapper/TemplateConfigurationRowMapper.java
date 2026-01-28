package org.pucar.dristi.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.TemplateConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
@Slf4j
public class TemplateConfigurationRowMapper implements ResultSetExtractor<List<TemplateConfiguration>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public TemplateConfigurationRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<TemplateConfiguration> extractData( ResultSet rs) {
        Map<String, TemplateConfiguration> templateMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                String uuid = rs.getString("id");
                TemplateConfiguration template = templateMap.get(uuid);

                if (template == null) {
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

                    template = TemplateConfiguration.builder()
                            .id(UUID.fromString(rs.getString("id")))
                            .tenantId(rs.getString("tenant_id"))
                            .filingNumber(rs.getString("filing_number"))
                            .courtId(rs.getString("court_id"))
                            .isActive(rs.getBoolean("is_active"))
                            .processTitle(rs.getString("process_title"))
                            .isCoverLetterRequired(rs.getBoolean("is_cover_letter_required"))
                            .addressee(rs.getString("addressee"))
                            .orderText(rs.getString("order_text"))
                            .coverLetterText(rs.getString("cover_letter_text"))
                            .auditDetails(auditDetails)
                            .build();

                    templateMap.put(uuid, template);
                }
            }
        } catch (SQLException e) {
            throw new CustomException("Failed to map template configuration {}" , e.getMessage());

        }
        return new ArrayList<>(templateMap.values());
    }
}