package org.egov.eTreasury.repository;

import org.egov.eTreasury.model.TreasuryMapping;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

@Component
public class TreasuryMappingRowMapper implements RowMapper<TreasuryMapping> {

    @Override
    public TreasuryMapping mapRow(ResultSet rs, int rowNum) throws SQLException {
        return TreasuryMapping.builder()
                .consumerCode(rs.getString("consumer_code"))
                .tenantId(rs.getString("tenant_id"))
                .headAmountMapping(rs.getObject("head_mapping"))
                .build();
    }
}
