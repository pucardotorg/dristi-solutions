package org.pucar.dristi.repository.rowmapper.v2;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.POAHolder;
import org.pucar.dristi.web.models.PoaParty;
import org.pucar.dristi.web.models.v2.POAHolderV2;
import org.pucar.dristi.web.models.v2.PoaPartyV2;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class PoaRowMapperV2 implements ResultSetExtractor<Map<UUID, List<POAHolderV2>>> {
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<UUID, List<POAHolderV2>> extractData(ResultSet rs) {
        Map<UUID, List<POAHolderV2>> poaHolderMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                UUID id = UUID.fromString(rs.getString("case_id"));
                POAHolderV2 poaHolder = POAHolderV2.builder()
                        .individualId(rs.getString("individual_id"))
                        .representingLitigants(getObjectListFromJson(rs.getString("representing_litigants"), new TypeReference<List<PoaPartyV2>>() {}))
                        .build();

                if (poaHolderMap.containsKey(id)) {
                    poaHolderMap.get(id).add(poaHolder);
                } else {
                    List<POAHolderV2> poaHolders = new ArrayList<>();
                    poaHolders.add(poaHolder);
                    poaHolderMap.put(id, poaHolders);
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
