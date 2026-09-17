package org.pucar.dristi.repository.rowmapper;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.CaseMeta;
import org.pucar.dristi.web.models.enums.LifecycleStatus;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Maps a single dristi_cases row to the scalar {@link CaseMeta} projection.
 *
 * Stateless with no dependencies, so it is instantiated directly by the repository
 * rather than registered as a Spring bean.
 */
@Slf4j
public class CaseMetaRowMapper implements RowMapper<CaseMeta> {

    @Override
    public CaseMeta mapRow(ResultSet rs, int rowNum) throws SQLException {
        String lifecycleStatus = rs.getString("lifecyclestatus");
        return CaseMeta.builder()
                .caseId(rs.getString("id"))
                .tenantId(rs.getString("tenantid"))
                .filingNumber(rs.getString("filingnumber"))
                .courtId(rs.getString("courtid"))
                .courtCaseNumber(rs.getString("courtcasenumber"))
                .cmpNumber(rs.getString("cmpnumber"))
                .lprNumber(rs.getString("lprnumber"))
                .cnrNumber(rs.getString("cnrnumber"))
                .lifecycleStatus(parseLifecycleStatus(lifecycleStatus))
                .caseTitle(rs.getString("casetitle"))
                .status(rs.getString("status"))
                .stage(rs.getString("stage"))
                .filingDate(rs.getObject("filingdate", Long.class))
                .registrationDate(rs.getObject("registrationdate", Long.class))
                .build();
    }

    private LifecycleStatus parseLifecycleStatus(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return LifecycleStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown lifecycleStatus value in dristi_cases: {}", value);
            return null;
        }
    }
}
