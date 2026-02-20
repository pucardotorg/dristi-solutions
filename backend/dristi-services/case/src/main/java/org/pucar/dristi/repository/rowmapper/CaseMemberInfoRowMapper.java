package org.pucar.dristi.repository.rowmapper;

import org.pucar.dristi.web.models.advocateofficemember.CaseMemberInfo;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

@Component
public class CaseMemberInfoRowMapper implements RowMapper<CaseMemberInfo> {

    @Override
    public CaseMemberInfo mapRow(ResultSet rs, int rowNum) throws SQLException {
        return CaseMemberInfo.builder()
                .caseId(toUuid(rs.getString("case_id")))
                .filingNumber(rs.getString("filingnumber"))
                .cmpNumber(rs.getString("cmpnumber"))
                .courtCaseNumber(rs.getString("courtcasenumber"))
                .caseTitle(rs.getString("casetitle"))
                .isActive(rs.getObject("is_active") != null ? rs.getBoolean("is_active") : null)
                .build();
    }

    private UUID toUuid(String value) {
        return value == null ? null : UUID.fromString(value);
    }
}
