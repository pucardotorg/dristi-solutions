package org.pucar.dristi.repository.rowmapper.v2;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.v2.LitigantV2;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class LitigantRowMapperV2 implements ResultSetExtractor<Map<UUID, List<LitigantV2>>> {

    public Map<UUID, List<LitigantV2>> extractData(ResultSet rs) {
        Map<UUID, List<LitigantV2>> partyMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                UUID id = UUID.fromString(rs.getString("case_id"));

                LitigantV2 litigantV2 = LitigantV2.builder()
                        .individualId(rs.getString("individualid"))
                        .partyType(rs.getString("partytype"))
                      //  .isPartyInPerson(rs.getBoolean("isresponserequired"))
                       // .isResponseSubmitted(rs.getBoolean("isresponserequired"))
                        .build();

                if (partyMap.containsKey(id)) {
                    partyMap.get(id).add(litigantV2);
                } else {
                    List<LitigantV2> litigantV2List = new ArrayList<>();
                    litigantV2List.add(litigantV2);
                    partyMap.put(id, litigantV2List);
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
