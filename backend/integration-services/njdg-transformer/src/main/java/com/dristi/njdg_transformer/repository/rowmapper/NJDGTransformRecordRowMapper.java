package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.postgresql.util.PGobject;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Component
public class NJDGTransformRecordRowMapper implements RowMapper<NJDGTransformRecord> {

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Override
    public NJDGTransformRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
        NJDGTransformRecord record = new NJDGTransformRecord();
        // String fields
        record.setCino(rs.getString("cino"));
        record.setDispReason(getInteger(rs, "disp_reason"));
        record.setDesgname(rs.getString("desgname"));
        record.setEstCode(rs.getString("est_code"));
        record.setPoliceNcode(rs.getString("police_ncode"));
        record.setPoliceStation(rs.getString("police_station"));
        record.setMainMatterCino(rs.getString("main_matter_cino"));
        record.setPetAddress(rs.getString("pet_address"));
        record.setResAddress(rs.getString("res_address"));
        record.setJocode(rs.getString("jocode"));
        record.setJudgeCode(rs.getInt("judge_code"));
        record.setDesigCode(rs.getInt("desig_code"));
        
        // Character fields
        String pendDisp = rs.getString("pend_disp");
        record.setPendDisp(pendDisp != null && !pendDisp.isEmpty() ? pendDisp.charAt(0) : null);
        
        record.setDispNature(getInteger(rs, "disp_nature"));
        
        String cicriType = rs.getString("cicri_type");
        record.setCicriType(cicriType != null && !cicriType.isEmpty() ? cicriType.charAt(0) : ' ');
        
        // Integer fields
        record.setCaseType(getInteger(rs, "case_type"));
        record.setFilNo(getInteger(rs, "fil_no"));
        record.setFilYear(getInteger(rs, "fil_year"));
        record.setRegNo(getInteger(rs, "reg_no"));
        record.setRegYear(getInteger(rs, "reg_year"));
        record.setCourtNo(getInteger(rs, "court_no"));
        record.setStateCode(getInteger(rs, "state_code"));
        record.setDistCode(getInteger(rs, "dist_code"));
        record.setPurposeCode(getInteger(rs, "purpose_code"));
        record.setPurposeNext(getInteger(rs, "purpose_next"));
        record.setPurposePrevious(getInteger(rs, "purpose_previous"));
        record.setPetAdvCd(getInteger(rs, "pet_adv_cd"));
        record.setResAdvCd(getInteger(rs, "res_adv_cd"));
        record.setPoliceStCode(getInteger(rs, "police_st_code"));
        record.setFirNo(getInteger(rs, "fir_no"));
        record.setFirYear(getInteger(rs, "fir_year"));
        record.setPetAge(getInteger(rs, "pet_age"));
        record.setResAge(getInteger(rs, "res_age"));
        
        // LocalDate fields
        record.setDateOfFiling(parseLocalDate(rs, "date_of_filing"));
        record.setDtRegis(parseLocalDate(rs, "dt_regis"));
        record.setDateFirstList(parseLocalDate(rs, "date_first_list"));
        record.setDateNextList(parseLocalDate(rs, "date_next_list"));
        record.setDateOfDecision(parseLocalDate(rs, "date_of_decision"));
        record.setDateLastList(parseLocalDate(rs, "date_last_list"));
        
        // String fields for names and addresses
        record.setPetName(rs.getString("pet_name"));
        record.setPetAdv(rs.getString("pet_adv"));
        record.setResName(rs.getString("res_name"));
        record.setResAdv(rs.getString("res_adv"));
        record.setPetAdvBarReg(rs.getString("pet_adv_bar_reg"));
        record.setResAdvBarReg(rs.getString("res_adv_bar_reg"));
        
        return record;
    }
    
    private Integer getInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }
    
    private LocalDate parseLocalDate(ResultSet rs, String column) throws SQLException {
        String dateStr = rs.getString(column);
        return dateStr != null && !dateStr.isEmpty() ? LocalDate.parse(dateStr) : null;
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
