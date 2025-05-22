package org.egov.transformer.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Slf4j
public class CourtIdRepository {
    private final JdbcTemplate jdbcTemplate;
    
    @Autowired
    public CourtIdRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Transactional
    public void updateCourtIdForFilingNumber(String courtId, String filingNumber) {
        String countQuery = "SELECT COUNT(*) FROM eg_wf_processinstance_v2 WHERE businessid = ? AND action = 'VALIDATE'";
        log.info("Final count query: {}", countQuery);

        Integer count = jdbcTemplate.queryForObject(countQuery, Integer.class, filingNumber);
        log.info("Instance with action VALIDATE count: {}", count);

        if (count != null && count >= 2) {
            log.info("CourtId already updated for filingNumber {}", filingNumber);
            return;
        }

        log.info("Enriching courtId :: {} for filingNumber: {} ", courtId, filingNumber);
        updateCourtIdInApplication(courtId, filingNumber);
        //updateCourtIdInTask(courtId, filingNumber);
        //updateCourtIdInOrders(courtId, filingNumber);
        updateCourtIdInEvidence(courtId, filingNumber);
    }

    private void updateCourtIdInEvidence(String courtId, String filingNumber) {
        String queryForEvidence = "update dristi_evidence_artifact set courtid=? where filingnumber=?";
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
        String queryForApplication = "update dristi_application set courtid=? where filingnumber=?";
        int rowsUpdated = jdbcTemplate.update(queryForApplication, courtId, filingNumber);
        log.warn("Number of application rows updated :: {} for filingNumber {}",rowsUpdated, filingNumber);
    }
    
}