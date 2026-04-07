package org.pucar.dristi.repository.rowmapper.v2;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.v2.StatuteSectionV2;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.*;

@Component
@Slf4j
public class StatuteSectionRowMapperV2 implements ResultSetExtractor<Map<UUID, StatuteSectionV2>> {
    public Map<UUID, StatuteSectionV2> extractData(ResultSet rs) {
        Map<UUID, StatuteSectionV2> statuteSectionMap = new LinkedHashMap<>();

        try {
            while (rs.next()) {
                UUID id = UUID.fromString(rs.getString("case_id"));

                StatuteSectionV2 statuteSectionV2 = StatuteSectionV2.builder()
                        .section(rs.getString("sections"))
                        .subsection(rs.getString("subsections"))
                        .build();

                statuteSectionMap.put(id, statuteSectionV2);

            }
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while processing Case ResultSet :: {}", e.toString());
            throw new CustomException("ROW_MAPPER_EXCEPTION", "Exception occurred while processing Case ResultSet: " + e.getMessage());
        }
        return statuteSectionMap;
    }

}
