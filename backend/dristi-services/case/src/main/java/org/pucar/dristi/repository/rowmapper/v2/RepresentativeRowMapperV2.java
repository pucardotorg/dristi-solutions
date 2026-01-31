package org.pucar.dristi.repository.rowmapper.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.v2.RepresentativeV2;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class RepresentativeRowMapperV2 implements ResultSetExtractor<Map<UUID, List<RepresentativeV2>>> {
    public Map<UUID, List<RepresentativeV2>> extractData(ResultSet rs) {
        Map<UUID, List<RepresentativeV2>> advocateMap = new LinkedHashMap<>();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                UUID id = UUID.fromString(rs.getString("case_id"));
                RepresentativeV2 representativeV2 = RepresentativeV2.builder()
                        .advocateId(rs.getString("advocateid"))
                        .id(rs.getString("id"))
                        .advocateFilingStatus(rs.getString("advocate_filing_status"))
                        .build();

                PGobject pgObject = (PGobject) rs.getObject("additionaldetails");
                if (pgObject != null)
                    representativeV2.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));

                if (advocateMap.containsKey(id)) {
                    advocateMap.get(id).add(representativeV2);
                } else {
                    List<RepresentativeV2> representativeV2List = new ArrayList<>();
                    representativeV2List.add(representativeV2);
                    advocateMap.put(id, representativeV2List);
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
