package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

public class NJDGTransformRecordRowMapper implements RowMapper<NJDGTransformRecord> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public NJDGTransformRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
        NJDGTransformRecord record = new NJDGTransformRecord();
        record.setCino(rs.getString("cino"));
        record.setDateOfFiling(rs.getDate("date_of_filing").toLocalDate().toString());
        // Map other normal columns...

        record.setPetExtraParty(parseJsonArray(rs.getObject("pet_extra_party")));
        record.setResExtraParty(parseJsonArray(rs.getObject("res_extra_party")));
        record.setAct(parseJsonArray(rs.getObject("act")));
        record.setHistoryOfCaseHearing(parseJsonArray(rs.getObject("historyofcasehearing")));
        record.setInterimOrder(parseJsonArray(rs.getObject("interimorder")));
        record.setIaFiling(parseJsonArray(rs.getObject("iafiling")));

        return record;
    }

    private List<JsonNode> parseJsonArray(Object obj) throws SQLException {
        if (obj instanceof PGobject pgObject && "jsonb".equals(pgObject.getType())) {
            try {
                String json = pgObject.getValue();
                if (json == null || json.isEmpty()) {
                    return Collections.emptyList();
                }

                // ✅ Convert JSON array string into List<JsonNode>
                return objectMapper.readValue(json, new TypeReference<List<JsonNode>>() {});
            } catch (Exception e) {
                throw new SQLException("Failed to parse JSONB array column", e);
            }
        }
        return Collections.emptyList();
    }
}
