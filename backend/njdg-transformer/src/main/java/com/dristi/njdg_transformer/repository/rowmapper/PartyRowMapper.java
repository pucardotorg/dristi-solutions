package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.PartyDetails;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class PartyRowMapper implements RowMapper<PartyDetails> {
    @Override
    public PartyDetails mapRow(ResultSet rs, int rowNum) throws SQLException {
        PartyDetails partyDetails = new PartyDetails();
        partyDetails.setPartyName(rs.getString("party_name"));
        partyDetails.setPartyNo(rs.getInt("party_no"));
        partyDetails.setPartyAddress(rs.getString("party_address"));
        partyDetails.setPartyAge(rs.getInt("party_age"));
        return partyDetails;
    }
}
