package org.egov.eTreasury.repository;

import java.sql.ResultSet;
import java.sql.SQLException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.eTreasury.model.AuthSek;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthSekRowMapper implements RowMapper<AuthSek> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AuthSek mapRow(ResultSet rs, int rowNum) throws SQLException {
        AuthSek authSek = new AuthSek();
        authSek.setAuthToken(rs.getString("auth_token"));
        authSek.setDecryptedSek(rs.getString("decrypted_sek"));
        authSek.setBillId(rs.getString("bill_id"));
        authSek.setBusinessService(rs.getString("business_service"));
        authSek.setServiceNumber(rs.getString("service_number"));
        authSek.setTotalDue(rs.getDouble("total_due"));
        authSek.setMobileNumber(rs.getString("mobile_number"));
        authSek.setPaidBy(rs.getString("paid_by"));
        authSek.setSessionTime(rs.getLong("session_time"));
        authSek.setDepartmentId(rs.getString("department_id"));

        String requestBlobJson = rs.getString("request_blob");
        if (requestBlobJson != null && !requestBlobJson.trim().isEmpty()) {
            try {
                JsonNode jsonNode = objectMapper.readTree(requestBlobJson);
                authSek.setRequestBlob(jsonNode);
                log.debug("Successfully parsed request_blob JSON for auth_token: {}", authSek.getAuthToken());
            } catch (Exception e) {
                log.warn("Failed to parse request_blob JSON for auth_token: {}, setting as raw string. Error: {}", 
                        authSek.getAuthToken(), e.getMessage());
                authSek.setRequestBlob(requestBlobJson);
            }
        } else {
            log.debug("request_blob is null or empty for auth_token: {}", authSek.getAuthToken());
        }
        return authSek;
    }
}
