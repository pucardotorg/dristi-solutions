package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.HearingDetails;
import org.springframework.jdbc.core.RowMapper;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;


public class HearingDetailsRowMapper implements RowMapper<HearingDetails> {


    @Override
    public HearingDetails mapRow(ResultSet rs, int rowNum) throws SQLException {
        HearingDetails hearingDetails = new HearingDetails();

        hearingDetails.setId(rs.getInt("id"));
        hearingDetails.setCino(rs.getString("cino") != null ? rs.getString("cino") : "");
        hearingDetails.setSrNo(rs.getInt("sr_no"));
        hearingDetails.setDesgName(rs.getString("desg_name") != null ? rs.getString("desg_name") : "");

        Date hearingDate = rs.getDate("hearing_date");
        hearingDetails.setHearingDate(hearingDate != null ? hearingDate.toLocalDate() : null);

        Date nextDate = rs.getDate("next_date");
        hearingDetails.setNextDate(nextDate != null ? nextDate.toLocalDate() : null);

        hearingDetails.setPurposeOfListing(rs.getString("purpose_of_listing") != null ? rs.getString("purpose_of_listing") : "");
        hearingDetails.setJudgeCode(rs.getString("judge_code") != null ? rs.getString("judge_code") : "");
        hearingDetails.setJoCode(rs.getString("jocode") != null ? rs.getString("jocode") : "");
        hearingDetails.setDesgCode(rs.getString("desg_code") != null ? rs.getString("desg_code") : "");
        hearingDetails.setHearingId(rs.getString("hearing_id") != null ? rs.getString("hearing_id") : "");
        hearingDetails.setBusiness(rs.getString("business") != null ? rs.getString("business") : "");
        hearingDetails.setCourtNo(rs.getInt("court_no"));
        hearingDetails.setOrderId(rs.getString("order_id"));
        return hearingDetails;
    }
}
