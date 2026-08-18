package org.pucar.dristi.repository;


import org.pucar.dristi.web.models.BulkCaseBundleTracker;
import org.pucar.dristi.web.models.CaseBundleTracker;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class CaseBundleRepository {

    private final JdbcTemplate writerJdbcTemplate;

    @Autowired
    public CaseBundleRepository(@Qualifier("writerJdbcTemplate") JdbcTemplate writerJdbcTemplate) {
        this.writerJdbcTemplate = writerJdbcTemplate;
    }
    public void insertCaseTracker(CaseBundleTracker caseBundleTracker) {
        String sql = "INSERT INTO case_bundle_tracker (id, startTime, endTime, pageCount, createdBy, lastModifiedBy, createdTime, lastModifiedTime) " +
                "VALUES (?, ?, ?, ?, ?, ?,  ?, ?)";

        writerJdbcTemplate.update(sql, caseBundleTracker.getId(), caseBundleTracker.getStartTime(), caseBundleTracker.getEndTime(),
                caseBundleTracker.getPageCount(), caseBundleTracker.getAuditDetails().getCreatedBy(), caseBundleTracker.getAuditDetails().getLastModifiedBy()
                , caseBundleTracker.getAuditDetails().getCreatedTime(), caseBundleTracker.getAuditDetails().getLastModifiedTime());
    }

    public void insertBulkCaseTracker(BulkCaseBundleTracker bulkCaseBundleTracker) {
        String sql = "INSERT INTO case_bundle_bulk_tracker (id, startTime, endTime, caseCount) " +
                "VALUES (?, ?, ?, ?)";

        writerJdbcTemplate.update(sql, bulkCaseBundleTracker.getId(), bulkCaseBundleTracker.getStartTime(), bulkCaseBundleTracker.getEndTime(),
                bulkCaseBundleTracker.getCaseCount());
    }

}
