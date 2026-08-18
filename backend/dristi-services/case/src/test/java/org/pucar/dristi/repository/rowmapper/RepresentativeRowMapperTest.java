package org.pucar.dristi.repository.rowmapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.web.models.AdvocateMapping;

@ExtendWith(MockitoExtension.class)
class RepresentativeRowMapperTest {

    @Mock
    private ResultSet mockResultSet;

    private RepresentativeRowMapper rowMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        rowMapper = new RepresentativeRowMapper();
    }

    @Test
    void testExtractData_Success() throws Exception {
        when(mockResultSet.next()).thenReturn(true, false);
        when(mockResultSet.getString("case_id")).thenReturn("123e4567-e89b-12d3-a456-426614174000");
        when(mockResultSet.getString("id")).thenReturn("rep-123");
        when(mockResultSet.getString("advocateid")).thenReturn("adv-123");
        when(mockResultSet.getString("tenantid")).thenReturn("default");
        when(mockResultSet.getBoolean("isactive")).thenReturn(true);
        when(mockResultSet.getBoolean("hassigned")).thenReturn(false);
        when(mockResultSet.getString("advocate_filing_status")).thenReturn("caseOwner");
        when(mockResultSet.getString("createdby")).thenReturn("user1");
        when(mockResultSet.getString("lastmodifiedby")).thenReturn("user1");
        when(mockResultSet.getLong("createdtime")).thenReturn(1643600000000L);
        when(mockResultSet.getLong("lastmodifiedtime")).thenReturn(1643600000000L);
        when(mockResultSet.getObject("additionalDetails")).thenReturn(null);

        Map<UUID, List<AdvocateMapping>> result = rowMapper.extractData(mockResultSet);

        assertNotNull(result);
        assertTrue(result.containsKey(UUID.fromString("123e4567-e89b-12d3-a456-426614174000")));
        assertEquals(1, result.size());
        AdvocateMapping advocate = result.get(UUID.fromString("123e4567-e89b-12d3-a456-426614174000")).get(0);
        assertEquals("caseOwner", advocate.getAdvocateFilingStatus());
        assertEquals("rep-123", advocate.getId());
        assertEquals("adv-123", advocate.getAdvocateId());
        assertEquals("default", advocate.getTenantId());
        assertTrue(advocate.getIsActive());
        assertFalse(advocate.getHasSigned());
        assertNotNull(advocate.getAuditDetails());
        assertEquals("user1", advocate.getAuditDetails().getCreatedBy());
        assertEquals("user1", advocate.getAuditDetails().getLastModifiedBy());
        assertEquals(1643600000000L, advocate.getAuditDetails().getCreatedTime());
        assertEquals(1643600000000L, advocate.getAuditDetails().getLastModifiedTime());
    }

    @Test
    void testExtractData_Exception() throws Exception {
        when(mockResultSet.next()).thenThrow(new SQLException("Database error"));

        assertThrows(Exception.class, () -> rowMapper.extractData(mockResultSet));
    }

    @Test
    void testExtractData_CustomException() throws Exception {
        when(mockResultSet.next()).thenThrow(new CustomException());

        assertThrows(CustomException.class, () -> rowMapper.extractData(mockResultSet));
    }
}

