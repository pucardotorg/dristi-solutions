package org.pucar.dristi.repository.rowMapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;
import org.pucar.dristi.web.models.StatuteSection;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
@Slf4j
public class StatuteSectionRowMapper implements ResultSetExtractor<List<StatuteSection>> {

    public List<String> stringToList(String str){
        List<String> list = new ArrayList<>();
        if(str!=null){
            StringTokenizer st = new StringTokenizer(str,",");
            while (st.hasMoreTokens()) {
                list.add(st.nextToken());
            }
        }

        return list;
    }

    @Override
    public List<StatuteSection> extractData(ResultSet rs) throws SQLException, DataAccessException {
        List<StatuteSection> statuteSectionMap = new ArrayList<>();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            while (rs.next()) {
                String id = rs.getString("case_id");
                UUID uuid = UUID.fromString(id!=null ? id : "00000000-0000-0000-0000-000000000000");

                Long lastModifiedTime = rs.getLong("lastmodifiedtime");

                AuditDetails auditdetails = AuditDetails.builder()
                        .createdBy(rs.getString("createdby"))
                        .createdTime(rs.getLong("createdtime"))
                        .lastModifiedBy(rs.getString("lastmodifiedby"))
                        .lastModifiedTime(lastModifiedTime)
                        .build();
                StatuteSection statuteSection = StatuteSection.builder()
                        .id(UUID.fromString(rs.getString("id")))
                        .tenantId(rs.getString("tenantid"))
                        .sections(stringToList(rs.getString("sections")))
                        .subsections(stringToList(rs.getString("subsections")))
                        .statute(rs.getString("statutes"))
                        .auditdetails(auditdetails)
                        .build();

                PGobject pgObject = (PGobject) rs.getObject("additionalDetails");
                if (pgObject != null) {
                    statuteSection.setAdditionalDetails(objectMapper.readTree(pgObject.getValue()));
                }
                statuteSectionMap.add(statuteSection);
            }
            return statuteSectionMap;
        } catch (Exception e) {
            log.error("Error occurred while processing Case ResultSet :: {}", e.toString());
            throw new CustomException("ROW_MAPPER_EXCEPTION", "Exception occurred while processing Case ResultSet: " + e.getMessage());
        }
    }
}
