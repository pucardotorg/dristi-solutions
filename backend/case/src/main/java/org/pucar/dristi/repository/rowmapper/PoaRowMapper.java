package org.pucar.dristi.repository.rowmapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.POAHolder;
import org.pucar.dristi.web.models.PoaParty;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class PoaRowMapper implements ResultSetExtractor<Map<UUID, List<POAHolder>>> {
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<UUID, List<POAHolder>> extractData(ResultSet rs) {
        Map<UUID, List<POAHolder>> poaHolderMap = new LinkedHashMap<>();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                String id = rs.getString("case_id");
                UUID uuid = UUID.fromString(id != null ? id : "00000000-0000-0000-0000-000000000000");

                Long lastModifiedTime = rs.getLong("last_modified_time");

                AuditDetails auditdetails = AuditDetails.builder()
                        .createdBy(rs.getString("created_by"))
                        .createdTime(rs.getLong("created_time"))
                        .lastModifiedBy(rs.getString("last_modified_by"))
                        .lastModifiedTime(lastModifiedTime)
                        .build();
                POAHolder poaHolder = POAHolder.builder()
                        .id(rs.getString("id"))
                        .tenantId(rs.getString("tenant_id"))
                        .individualId(rs.getString("individual_id"))
                        .isActive(rs.getBoolean("is_active"))
                        .caseId(rs.getString("case_id"))
                        .poaType(rs.getString("poa_type"))
                        .name(rs.getString("name"))
                        .representingLitigants(getObjectListFromJson(rs.getString("representing_litigants"), new TypeReference<List<PoaParty>>() {}))
                        .hasSigned(rs.getBoolean("hasSigned"))
                        .auditDetails(auditdetails)
                        .build();


                PGobject pgObject = (PGobject) rs.getObject("additional_details");
                if (pgObject != null)
                    poaHolder.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));

                if (poaHolderMap.containsKey(uuid)) {
                    poaHolderMap.get(uuid).add(poaHolder);
                } else {
                    List<POAHolder> poaHolders = new ArrayList<>();
                    poaHolders.add(poaHolder);
                    poaHolderMap.put(uuid, poaHolders);
                }
            }
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while processing Case ResultSet :: {}", e.toString());
            throw new CustomException("ROW_MAPPER_EXCEPTION", "Exception occurred while processing Case ResultSet: " + e.getMessage());
        }
        return poaHolderMap;
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
