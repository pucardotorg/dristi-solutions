package org.egov.eTreasury.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.sql.ResultSet;
import java.sql.SQLException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.eTreasury.model.AuthSek;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthSekRowMapperTest {

    private final AuthSekRowMapper rowMapper = new AuthSekRowMapper();

    @Test
    void testMapRow() throws SQLException {
        // Create a mock ResultSet
        ResultSet rs = mock(ResultSet.class);

        // Set up mock behavior
        when(rs.getString("auth_token")).thenReturn("testAuthToken");
        when(rs.getString("decrypted_sek")).thenReturn("testDecryptedSek");
        when(rs.getString("bill_id")).thenReturn("testBillId");
        when(rs.getString("business_service")).thenReturn("testBusinessService");
        when(rs.getString("service_number")).thenReturn("testServiceNumber");
        when(rs.getDouble("total_due")).thenReturn(100.0);
        when(rs.getString("mobile_number")).thenReturn("1234567890");
        when(rs.getString("paid_by")).thenReturn("testPaidBy");
        when(rs.getLong("session_time")).thenReturn(123456789L);
        when(rs.getString("department_id")).thenReturn("testDepartmentId");
        when(rs.getString("request_blob")).thenReturn("{\"key\":\"value\",\"number\":123}");

        // Execute the method to test
        AuthSek authSek = rowMapper.mapRow(rs, 1);

        // Verify the results
        assertThat(authSek.getAuthToken()).isEqualTo("testAuthToken");
        assertThat(authSek.getDecryptedSek()).isEqualTo("testDecryptedSek");
        assertThat(authSek.getBillId()).isEqualTo("testBillId");
        assertThat(authSek.getBusinessService()).isEqualTo("testBusinessService");
        assertThat(authSek.getServiceNumber()).isEqualTo("testServiceNumber");
        assertThat(authSek.getTotalDue()).isEqualTo(100.0);
        assertThat(authSek.getMobileNumber()).isEqualTo("1234567890");
        assertThat(authSek.getPaidBy()).isEqualTo("testPaidBy");
        assertThat(authSek.getSessionTime()).isEqualTo(123456789L);
        assertThat(authSek.getDepartmentId()).isEqualTo("testDepartmentId");
        
        // Verify request_blob is parsed as JsonNode
        assertThat(authSek.getRequestBlob()).isInstanceOf(JsonNode.class);
        JsonNode requestBlob = (JsonNode) authSek.getRequestBlob();
        assertThat(requestBlob.get("key").asText()).isEqualTo("value");
        assertThat(requestBlob.get("number").asInt()).isEqualTo(123);
    }

    @Test
    void testMapRowWithNullRequestBlob() throws SQLException {
        // Create a mock ResultSet
        ResultSet rs = mock(ResultSet.class);

        // Set up mock behavior with null request_blob
        when(rs.getString("auth_token")).thenReturn("testAuthToken");
        when(rs.getString("decrypted_sek")).thenReturn("testDecryptedSek");
        when(rs.getString("bill_id")).thenReturn("testBillId");
        when(rs.getString("business_service")).thenReturn("testBusinessService");
        when(rs.getString("service_number")).thenReturn("testServiceNumber");
        when(rs.getDouble("total_due")).thenReturn(100.0);
        when(rs.getString("mobile_number")).thenReturn("1234567890");
        when(rs.getString("paid_by")).thenReturn("testPaidBy");
        when(rs.getLong("session_time")).thenReturn(123456789L);
        when(rs.getString("department_id")).thenReturn("testDepartmentId");
        when(rs.getString("request_blob")).thenReturn(null);

        // Execute the method to test
        AuthSek authSek = rowMapper.mapRow(rs, 1);

        // Verify the results
        assertThat(authSek.getRequestBlob()).isNull();
    }

    @Test
    void testMapRowWithEmptyRequestBlob() throws SQLException {
        // Create a mock ResultSet
        ResultSet rs = mock(ResultSet.class);

        // Set up mock behavior with empty request_blob
        when(rs.getString("auth_token")).thenReturn("testAuthToken");
        when(rs.getString("decrypted_sek")).thenReturn("testDecryptedSek");
        when(rs.getString("bill_id")).thenReturn("testBillId");
        when(rs.getString("business_service")).thenReturn("testBusinessService");
        when(rs.getString("service_number")).thenReturn("testServiceNumber");
        when(rs.getDouble("total_due")).thenReturn(100.0);
        when(rs.getString("mobile_number")).thenReturn("1234567890");
        when(rs.getString("paid_by")).thenReturn("testPaidBy");
        when(rs.getLong("session_time")).thenReturn(123456789L);
        when(rs.getString("department_id")).thenReturn("testDepartmentId");
        when(rs.getString("request_blob")).thenReturn("");

        // Execute the method to test
        AuthSek authSek = rowMapper.mapRow(rs, 1);

        // Verify the results
        assertThat(authSek.getRequestBlob()).isNull();
    }

    @Test
    void testMapRowWithInvalidJsonRequestBlob() throws SQLException {
        // Create a mock ResultSet
        ResultSet rs = mock(ResultSet.class);

        // Set up mock behavior with invalid JSON
        when(rs.getString("auth_token")).thenReturn("testAuthToken");
        when(rs.getString("decrypted_sek")).thenReturn("testDecryptedSek");
        when(rs.getString("bill_id")).thenReturn("testBillId");
        when(rs.getString("business_service")).thenReturn("testBusinessService");
        when(rs.getString("service_number")).thenReturn("testServiceNumber");
        when(rs.getDouble("total_due")).thenReturn(100.0);
        when(rs.getString("mobile_number")).thenReturn("1234567890");
        when(rs.getString("paid_by")).thenReturn("testPaidBy");
        when(rs.getLong("session_time")).thenReturn(123456789L);
        when(rs.getString("department_id")).thenReturn("testDepartmentId");
        when(rs.getString("request_blob")).thenReturn("invalid json string");

        // Execute the method to test
        AuthSek authSek = rowMapper.mapRow(rs, 1);

        // Verify the results - should fallback to raw string
        assertThat(authSek.getRequestBlob()).isInstanceOf(String.class);
        assertThat(authSek.getRequestBlob()).isEqualTo("invalid json string");
    }
}
