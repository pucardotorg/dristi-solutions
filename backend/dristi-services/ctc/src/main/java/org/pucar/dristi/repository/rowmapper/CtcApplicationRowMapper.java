package org.pucar.dristi.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.*;
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
public class CtcApplicationRowMapper implements ResultSetExtractor<List<CtcApplication>> {

    private final ObjectMapper objectMapper;

    @Autowired
    public CtcApplicationRowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<CtcApplication> extractData(ResultSet rs) throws SQLException, DataAccessException {

        Map<String, CtcApplication> ctcApplicationMap = new LinkedHashMap<>();

        while (rs.next()) {
            String id = rs.getString("id");
            CtcApplication ctcApplication = ctcApplicationMap.get(id);
            if (ctcApplication == null) {
                ctcApplication = CtcApplication.builder()
                        .id(id)
                        .ctcApplicationNumber(rs.getString("ctc_application_number"))
                        .tenantId(rs.getString("tenant_id"))
                        .caseNumber(rs.getString("case_number"))
                        .caseTitle(rs.getString("case_title"))
                        .filingNumber(rs.getString("filing_number"))
                        .cnrNumber(rs.getString("cnr_number"))
                        .courtId(rs.getString("court_id"))
                        .applicantName(rs.getString("applicant_name"))
                        .mobileNumber(rs.getString("mobile_number"))
                        .isPartyToCase(rs.getBoolean("is_party_to_case"))
                        .partyDesignation(rs.getString("party_designation"))
                        .affidavitDocument(getObjectFromJson(rs.getString("affidavit_document"), new TypeReference<Document>() {}))
                        .caseBundleNodes(getObjectListFromJson(rs.getString("case_bundle_nodes"), new TypeReference<List<CaseBundleNode>>() {}))
                        .totalPages(rs.getInt("total_pages"))
                        .status(rs.getString("status"))
                        .judgeComments(rs.getString("judge_comments"))
                        .auditDetails(AuditDetails.builder()
                                .createdBy(rs.getString("created_by"))
                                .lastModifiedBy(rs.getString("last_modified_by"))
                                .createdTime(rs.getLong("created_time"))
                                .lastModifiedTime(rs.getLong("last_modified_time"))
                                .build())
                        .build();

                ctcApplicationMap.put(id, ctcApplication);
            }
        }

        return new ArrayList<>(ctcApplicationMap.values());
    }

    public <T> T getObjectFromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            throw new CustomException("Failed to convert JSON to " + typeRef.getType(), e.getMessage());
        }
    }

    public <T> T getObjectListFromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            try {
                return objectMapper.readValue("[]", typeRef);
            } catch (Exception e) {
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
