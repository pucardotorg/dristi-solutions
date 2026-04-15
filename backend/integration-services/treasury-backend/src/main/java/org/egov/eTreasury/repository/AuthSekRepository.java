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

    public void updateAuthSekStatus(String authToken, String paymentStatus, String completionSource, Long verificationTimestamp) {
        String updateQuery = "UPDATE auth_sek_session_data SET payment_status = ?, completion_source = ?, verification_timestamp = ? WHERE auth_token = ?";
        int updated = jdbcTemplate.update(updateQuery, paymentStatus, completionSource, verificationTimestamp, authToken);
        if(updated != 1) {
            throw new RuntimeException("Failed to update auth_sek_session_data for auth_token: " + authToken);
        }
    }

    public void updateAuthTokenAndStatusByDepartmentId(String departmentId, String authToken, String decryptedSek, String paymentStatus, String completionSource, Long verificationTimestamp) {
        String updateQuery = "UPDATE auth_sek_session_data SET auth_token = ?, decrypted_sek = ?, payment_status = ?, completion_source = ?, verification_timestamp = ? WHERE department_id = ?";
        int updated = jdbcTemplate.update(updateQuery, authToken, decryptedSek, paymentStatus, completionSource, verificationTimestamp, departmentId);
        if(updated == 0) {
            log.error("Failed to update auth_sek_session_data for department_id: {}", departmentId);
        }
    }
}
