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
        record.setDateOfFiling(rs.getString("date_of_filing"));
        record.setDtRegis(rs.getString("dt_regis"));
        record.setCaseType(rs.getString("case_type"));
        record.setFilNo(rs.getString("fil_no"));
        record.setFilYear(rs.getString("fil_year"));
        record.setRegNo(rs.getString("reg_no"));
        record.setRegYear(rs.getString("reg_year"));
        record.setDateFirstList(rs.getString("date_first_list"));
        record.setDateNextList(rs.getString("date_next_list"));
        record.setPendDisp(rs.getString("pend_disp"));
        record.setDateOfDecision(rs.getString("date_of_decision"));
        record.setDispReason(rs.getString("disp_reason"));
        record.setDispNature(rs.getString("disp_nature"));
        record.setDesgname(rs.getString("desgname"));
        record.setCourtNo(rs.getString("court_no"));
        record.setEstCode(rs.getString("est_code"));
        record.setStateCode(rs.getString("state_code"));
        record.setDistCode(rs.getString("dist_code"));
        record.setPurposeCode(rs.getString("purpose_code"));
        record.setPetName(rs.getString("pet_name"));
        record.setPetAdv(rs.getString("pet_adv"));
        record.setPetAdvCd(rs.getString("pet_adv_cd"));
        record.setResName(rs.getString("res_name"));
        record.setResAdv(rs.getString("res_adv"));
        record.setResAdvCd(rs.getString("res_adv_cd"));
        record.setPetAdvBarReg(rs.getString("pet_adv_bar_reg"));
        record.setResAdvBarReg(rs.getString("res_adv_bar_reg"));
        record.setPoliceStCode(rs.getString("police_st_code"));
        record.setPoliceNcode(rs.getString("police_ncode"));
        record.setFirNo(rs.getString("fir_no"));
        record.setPoliceStation(rs.getString("police_station"));
        record.setFirYear(rs.getString("fir_year"));
        record.setDateLastList(rs.getString("date_last_list"));
        record.setMainMatterCino(rs.getString("main_matter_cino"));
        record.setPetAge(rs.getString("pet_age"));
        record.setResAge(rs.getString("res_age"));
        record.setPetAddress(rs.getString("pet_address"));
        record.setResAddress(rs.getString("res_address"));

        record.setPetExtraParty(parseJsonArray(rs.getObject("pet_extra_party")));
        record.setResExtraParty(parseJsonArray(rs.getObject("res_extra_party")));
        record.setAct(parseJsonArray(rs.getObject("act")));
        record.setHistoryOfCaseHearing(parseJsonArray(rs.getObject("historyofcasehearing")));
        record.setIaFiling(parseJsonArray(rs.getObject("iafiling")));
        record.setInterimOrder(parseJsonArray(rs.getObject("interimorder")));
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
