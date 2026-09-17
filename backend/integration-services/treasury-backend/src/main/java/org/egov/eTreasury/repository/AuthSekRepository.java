package org.egov.eTreasury.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.eTreasury.model.AuthSek;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
public class AuthSekRepository {

    private final JdbcTemplate jdbcTemplate;
    
    private final AuthSekQueryBuilder queryBuilder;

    private final AuthSekRowMapper rowMapper;

    public AuthSekRepository(JdbcTemplate jdbcTemplate, AuthSekQueryBuilder queryBuilder, AuthSekRowMapper rowMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
    }

    public List<AuthSek> getAuthSek(String authToken) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getAuthSekQuery(authToken, preparedStmtList);
        log.debug("Final query: {}", query);
        return jdbcTemplate.query(query, rowMapper, preparedStmtList.toArray());
    }

    public List<AuthSek> getPendingAuthSeks(long thresholdTime) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getPendingAuthSeksQuery(thresholdTime, preparedStmtList);
        log.debug("Final pending query: {}", query);
        return jdbcTemplate.query(query, rowMapper, preparedStmtList.toArray());
    }

    public List<AuthSek> getAgedPendingAuthSeks(long thresholdTime) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getAgedPendingAuthSeksQuery(thresholdTime, preparedStmtList);
        log.debug("Final aged pending query: {}", query);
        return jdbcTemplate.query(query, rowMapper, preparedStmtList.toArray());
    }

    public List<AuthSek> getAuthSekByDepartmentId(String departmentId) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getAuthSekByDepartmentIdQuery(departmentId, preparedStmtList);
        log.debug("Final by-departmentId query: {}", query);
        return jdbcTemplate.query(query, rowMapper, preparedStmtList.toArray());
    }

    public List<AuthSek> getAuthSekByBillId(String billId) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getAuthSekByBillIdQuery(billId, preparedStmtList);
        log.debug("Final by-billId query: {}", query);
        return jdbcTemplate.query(query, rowMapper, preparedStmtList.toArray());
    }

    public List<AuthSek> getAuthSekByServiceNumber(String serviceNumber) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getAuthSekByServiceNumberQuery(serviceNumber, preparedStmtList);
        log.debug("Final by-serviceNumber query: {}", query);
        return jdbcTemplate.query(query, rowMapper, preparedStmtList.toArray());
    }

    public void updateAuthSekStatus(String authToken, String paymentStatus, String completionSource, Long verificationTimestamp, String processedStatus) {
        String updateQuery = "UPDATE auth_sek_session_data SET payment_status = ?, completion_source = ?, verification_timestamp = ?, processed_status = ? WHERE auth_token = ?";
        int updated = jdbcTemplate.update(updateQuery, paymentStatus, completionSource, verificationTimestamp, processedStatus, authToken);
        if(updated != 1) {
            throw new RuntimeException("Failed to update auth_sek_session_data for auth_token: " + authToken);
        }
    }

    /**
     * Records that V3 reconciliation saw treasury status=P (bank-reported "Pending") for this row.
     * The row stays PENDING so the next cron cycle re-checks it; only the retry counter advances.
     */
    public void updatePendingRetryCount(String authToken, int retryCount) {
        String updateQuery = "UPDATE auth_sek_session_data SET retry_count = ? WHERE auth_token = ?";
        int updated = jdbcTemplate.update(updateQuery, retryCount, authToken);
        if(updated != 1) {
            throw new RuntimeException("Failed to update retry_count on auth_sek_session_data for auth_token: " + authToken);
        }
    }

    public void updateAuthTokenAndStatusByDepartmentId(String departmentId, String authToken, String decryptedSek, String paymentStatus, String completionSource, Long verificationTimestamp, String processedStatus) {
        String updateQuery = "UPDATE auth_sek_session_data SET auth_token = ?, decrypted_sek = ?, payment_status = ?, completion_source = ?, verification_timestamp = ?, processed_status = ? WHERE department_id = ?";
        int updated = jdbcTemplate.update(updateQuery, authToken, decryptedSek, paymentStatus, completionSource, verificationTimestamp, processedStatus, departmentId);
        if(updated == 0) {
            log.error("Failed to update auth_sek_session_data for department_id: {}", departmentId);
        }
    }

}
