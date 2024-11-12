package org.pucar.dristi.repository;


import org.pucar.dristi.web.models.CaseBundleTracker;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class CaseBundleRepository {


    private  final JdbcTemplate jdbcTemplate;

    @Autowired
    public CaseBundleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    public void insertCaseTracker(CaseBundleTracker caseBundleTracker) {
        String sql = "INSERT INTO case_bundle_tracker (id, startTime, endTime, pageCount, createdBy, lastModifiedBy, createdTime, lastModifiedTime) " +
                "VALUES (?, ?, ?, ?, ?, ?,  ?, ?)";

        jdbcTemplate.update(sql, caseBundleTracker.getId(), caseBundleTracker.getStartTime(), caseBundleTracker.getEndTime(),
                caseBundleTracker.getPageCount(), caseBundleTracker.getAuditDetails().getCreatedBy(), caseBundleTracker.getAuditDetails().getLastModifiedBy()
                , caseBundleTracker.getAuditDetails().getCreatedTime(), caseBundleTracker.getAuditDetails().getLastModifiedTime());
    }

}
