package org.egov.transformer.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
@Slf4j
public class DBRepository {
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DBRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void updateBailCaseNumberForFilingNumber(String caseNumber, String cnrNumber, List<String> bailUuids, String filingNumber) {
        bailUuids.forEach(bailId -> log.info("Bail UUID to update: {}", bailId));

        String updateQuery = "UPDATE dristi_bail SET case_number = ?, cnr_number = ? WHERE filing_number = ?";
        int rowsUpdated = jdbcTemplate.update(updateQuery, caseNumber, cnrNumber, filingNumber);

        log.warn("Number of bail rows updated: {} for filingNumber {}", rowsUpdated, filingNumber);
    }



    @Transactional
    public void updateCourtIdForFilingNumber(String courtId, String filingNumber) {
        log.info("Enriching courtId :: {} for filingNumber: {} ", courtId, filingNumber);
        updateCourtIdInApplication(courtId, filingNumber);
        //updateCourtIdInTask(courtId, filingNumber);
        //updateCourtIdInOrders(courtId, filingNumber);
        updateCourtIdInEvidence(courtId, filingNumber);
    }

    private void updateCourtIdInEvidence(String courtId, String filingNumber) {
        String queryForEvidence = "UPDATE dristi_evidence_artifact SET courtid = ? WHERE filingnumber = ? AND (courtid IS NULL OR courtid = '')";
        int rowsUpdatedEvidence = jdbcTemplate.update(queryForEvidence, courtId, filingNumber);
        log.warn("Number of evidence rows updated :: {} for filingNumber {}",rowsUpdatedEvidence, filingNumber);
    }

    private void updateCourtIdInOrders(String courtId, String filingNumber) {
        String queryForOrders = "update dristi_orders set courtid=? where filingnumber=?";
        int rowsUpdatedOrder = jdbcTemplate.update(queryForOrders, courtId, filingNumber);
        log.warn("Number of orders rows updated :: {} for filingNumber {}",rowsUpdatedOrder, filingNumber);
    }

    private void updateCourtIdInTask(String courtId, String filingNumber) {
        String queryForTask = "update dristi_task set courtid=? where filingnumber=?";
        int rowsUpdatedTask = jdbcTemplate.update(queryForTask, courtId, filingNumber);
        log.warn("Number of task rows updated :: {} for filingNumber {}",rowsUpdatedTask, filingNumber);
    }

    private void updateCourtIdInApplication(String courtId, String filingNumber) {
        String queryForApplication = "UPDATE dristi_application SET courtid = ? WHERE filingnumber = ? AND (courtid IS NULL OR courtid = '')";
        int rowsUpdated = jdbcTemplate.update(queryForApplication, courtId, filingNumber);
        log.warn("Number of application rows updated :: {} for filingNumber {}",rowsUpdated, filingNumber);
    }

    public List<String> getBailUuidsForFilingNumber(String filingNumber) {
        String selectBailIdsQuery = "SELECT id FROM dristi_bail WHERE filing_number = ?";

        List<String> bailUuids = jdbcTemplate.query(
                selectBailIdsQuery,
                new Object[]{filingNumber},
                (rs, rowNum) -> rs.getString("id")
        );

        log.info("Total Bail records for filingNumber {}: {}", filingNumber, bailUuids.size());

        if (bailUuids.isEmpty()) {
            log.warn("No bail records found for filingNumber {}", filingNumber);
            return List.of();
        }
        return bailUuids;
    }

}