package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.HearingDetails;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;


public class HearingDetailsRowMapper implements RowMapper<HearingDetails> {


    @Override
    public HearingDetails mapRow(ResultSet rs, int rowNum) throws SQLException {
        HearingDetails hearingDetails = new HearingDetails();
        hearingDetails.setId(rs.getInt("id"));
        hearingDetails.setCino(rs.getString("cino"));
        hearingDetails.setSrNo(rs.getInt("sr_no"));
        hearingDetails.setDesgName(rs.getString("desg_name"));
        hearingDetails.setHearingDate(rs.getDate("hearing_date").toLocalDate());
        hearingDetails.setNextDate(rs.getDate("next_date").toLocalDate());
        hearingDetails.setPurposeOfListing(rs.getString("purpose_of_listing"));
        hearingDetails.setJudgeCode(rs.getString("judge_code"));
        hearingDetails.setJoCode(rs.getString("jo_code"));
        hearingDetails.setDesgCode(rs.getString("desg_code"));
        return hearingDetails;
    }
}
