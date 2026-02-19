package org.pucar.dristi.repository.rowmapper;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.AdvocateMapping;
import org.pucar.dristi.web.models.Advocate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class RepresentativeRowMapper implements ResultSetExtractor<Map<UUID, List<AdvocateMapping>>> {
    public Map<UUID, List<AdvocateMapping>> extractData(ResultSet rs) {
        Map<UUID, List<AdvocateMapping>> advocateMap = new LinkedHashMap<>();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                String id = rs.getString("case_id");
                UUID uuid = UUID.fromString(id != null ? id : "00000000-0000-0000-0000-000000000000");

                Long lastModifiedTime = rs.getLong("lastmodifiedtime");

                AuditDetails auditdetails = AuditDetails.builder()
                        .createdBy(rs.getString("createdby"))
                        .createdTime(rs.getLong("createdtime"))
                        .lastModifiedBy(rs.getString("lastmodifiedby"))
                        .lastModifiedTime(lastModifiedTime)
                        .build();
                AdvocateMapping advocateMapping = AdvocateMapping.builder()
                        .id(rs.getString("id"))
                        .advocateId(rs.getString("advocateid"))
                        .tenantId(rs.getString("tenantid"))
                        .isActive(rs.getBoolean("isactive"))
                        .caseId(rs.getString("case_id"))
                        .hasSigned(rs.getBoolean("hassigned"))
                        .advocateFilingStatus(rs.getString("advocate_filing_status"))
                        .auditDetails(auditdetails)
                        .build();

                PGobject pgObject = (PGobject) rs.getObject("additionalDetails");
                if (pgObject != null)
                    advocateMapping.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));

                // read joined advocate fields (if present)
                String advId = null;
                try {
                    advId = rs.getString("advocate_id");
                } catch (Exception ignored) { }

                if (advId != null) {
                    Advocate advocate = Advocate.builder().build();
                    try { advocate.setId(UUID.fromString(advId)); } catch (Exception ignored) {}
                    try { advocate.setTenantId(rs.getString("advocate_tenantid")); } catch (Exception ignored) {}
                    try { advocate.setApplicationNumber(rs.getString("advocate_applicationnumber")); } catch (Exception ignored) {}
                    try { advocate.setStatus(rs.getString("advocate_status")); } catch (Exception ignored) {}
                    try { advocate.setBarRegistrationNumber(rs.getString("advocate_barregistrationnumber")); } catch (Exception ignored) {}
                    try { advocate.setAdvocateType(rs.getString("advocate_type")); } catch (Exception ignored) {}
                   // try { advocate.setOrganisationID(rs.getString("advocate_organisationid")); } catch (Exception ignored) {}
                    try { advocate.setIndividualId(rs.getString("advocate_individualid")); } catch (Exception ignored) {}
                    try { advocate.setIsActive(rs.getBoolean("advocate_isactive")); } catch (Exception ignored) {}

                    PGobject advAdditional = (PGobject) rs.getObject("advocate_additionaldetails");
                    if (advAdditional != null) {
                        try {
                            advocate.setAdditionalDetails(objectMapper.readTree(advAdditional.getValue()));
                        } catch (Exception ignored) {}
                    }

                    advocateMapping.setAdvocate(advocate);
                }

                if (advocateMap.containsKey(uuid)) {
                    advocateMap.get(uuid).add(advocateMapping);
                } else {
                    List<AdvocateMapping> advocateMappings = new ArrayList<>();
                    advocateMappings.add(advocateMapping);
                    advocateMap.put(uuid, advocateMappings);
                }
            }
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while processing Case ResultSet :: {}", e.toString());
            throw new CustomException("ROW_MAPPER_EXCEPTION", "Exception occurred while processing Case ResultSet: " + e.getMessage());
        }
        return advocateMap;
    }
}
