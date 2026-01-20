package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.PartyDetails;
import com.dristi.njdg_transformer.model.enums.PartyType;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class PartyRowMapper implements RowMapper<PartyDetails> {
    @Override
    public PartyDetails mapRow(ResultSet rs, int rowNum) throws SQLException {
        PartyDetails partyDetails = new PartyDetails();
        partyDetails.setId(rs.getInt("id"));
        partyDetails.setCino(rs.getString("cino"));
        partyDetails.setPartyType(PartyType.valueOf(rs.getString("party_type")));
        partyDetails.setPartyName(rs.getString("party_name"));
        partyDetails.setPartyNo(rs.getInt("party_no"));
        partyDetails.setPartyAddress(rs.getString("party_address"));
        partyDetails.setPartyAge(rs.getInt("party_age"));
        partyDetails.setPartyId(rs.getString("party_id"));
        partyDetails.setAdvName(rs.getString("adv_name"));
        partyDetails.setAdvCd(rs.getInt("adv_cd"));
        partyDetails.setSrNo(rs.getInt("sr_no"));
        return partyDetails;
    }
}
