package org.pucar.dristi.repository.rowmapper.v2;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.v2.RepresentingV2;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class RepresentingRowMapperV2 implements ResultSetExtractor<Map<UUID, List<RepresentingV2>>> {
    public Map<UUID, List<RepresentingV2>> extractData(ResultSet rs) {
        Map<UUID, List<RepresentingV2>> partyMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                UUID id = UUID.fromString(rs.getString("representative_id"));

                RepresentingV2 representingV2 = RepresentingV2.builder()
                        .individualId(rs.getString("individualid"))
                        .partyType(rs.getString("partytype"))
                        .build();

                if (partyMap.containsKey(id)) {
                    partyMap.get(id).add(representingV2);
                } else {
                    List<RepresentingV2> representingV2List = new ArrayList<>();
                    representingV2List.add(representingV2);
                    partyMap.put(id, representingV2List);
                }
            }
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while processing Case ResultSet :: {}", e.toString());
            throw new CustomException("ROW_MAPPER_EXCEPTION", "Exception occurred while processing Case ResultSet: " + e.getMessage());
        }
        return partyMap;
    }
}
