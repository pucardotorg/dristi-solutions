package org.pucar.dristi.repository.rowmapper;

import org.pucar.dristi.web.models.CaseSearchTextItem;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class CaseSearchTextRowMapper implements RowMapper<CaseSearchTextItem> {

    @Override
    public CaseSearchTextItem mapRow(ResultSet rs, int rowNum) throws SQLException {
        return CaseSearchTextItem.builder()
                .cmpNumber(rs.getString("cmpnumber"))
                .filingNumber(rs.getString("filingnumber"))
                .courtCaseNumber(rs.getString("courtcasenumber"))
                .cnrNumber(rs.getString("cnrNumber"))
                .build();
    }
}
