package org.pucar.dristi.repository.rowMapper;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.web.models.CaseSummary;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CaseSummaryRowMapperTest {

    private CaseSummaryRowMapper caseSummaryRowMapper;
    private ResultSet resultSet;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        caseSummaryRowMapper = new CaseSummaryRowMapper();
        resultSet = mock(ResultSet.class);
    }

    @Test
    void testExtractData_success() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false); // Simulate one row of data
        when(resultSet.getString("resolutionmechanism")).thenReturn("Arbitration");
        when(resultSet.getString("casetitle")).thenReturn("Case Title");
        when(resultSet.getString("casedescription")).thenReturn("Case Description");
        when(resultSet.getString("filingnumber")).thenReturn("123");
        when(resultSet.getString("courtcasenumber")).thenReturn("COURT123");
        when(resultSet.getString("cnrnumber")).thenReturn("CNR123");
        when(resultSet.getDate("filingdate")).thenReturn(Date.valueOf(LocalDate.of(2022, 1, 1)));
        when(resultSet.getDate("registrationdate")).thenReturn(Date.valueOf(LocalDate.of(2022, 1, 2)));
        when(resultSet.getString("casedetails")).thenReturn("Details of the case");
        when(resultSet.getString("casecategory")).thenReturn("Civil");
        when(resultSet.getString("status")).thenReturn("Open");
        when(resultSet.getString("remarks")).thenReturn("No remarks");
        when(resultSet.getString("orderid")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("tenantid")).thenReturn("tenant1");
        when(resultSet.getString("cnrnumber")).thenReturn("CNR123");
        when(resultSet.getString("applicationnumber")).thenReturn("APP1,APP2");
        when(resultSet.getString("hearingnumber")).thenReturn("HEARING123");
        when(resultSet.getString("ordernumber")).thenReturn("ORDER123");
        when(resultSet.getString("linkedordernumber")).thenReturn("LINKEDORDER123");
        when(resultSet.getLong("createddate")).thenReturn(1627893600000L); // Some timestamp
        when(resultSet.getString("ordertype")).thenReturn("Final");
        when(resultSet.getString("ordercategory")).thenReturn("Civil");
        when(resultSet.getString("comments")).thenReturn("This is a comment");
        when(resultSet.getBoolean("isactive")).thenReturn(true);
        when(resultSet.getString("additionaldetails")).thenReturn("Additional details");
        when(resultSet.getString("statue_id")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("section_id")).thenReturn("SECTION123");
        when(resultSet.getString("statue_name")).thenReturn("Statue Name");
        when(resultSet.getString("section_name")).thenReturn("Section Name");

        // Act
        List<CaseSummary> caseSummaries = caseSummaryRowMapper.extractData(resultSet);

        // Assert
        assertNotNull(caseSummaries);
        assertEquals(1, caseSummaries.size());

        CaseSummary caseSummary = caseSummaries.get(0);
        assertEquals("Arbitration", caseSummary.getResolutionMechanism());
        assertEquals("Case Title", caseSummary.getCaseTitle());
        assertEquals("Case Description", caseSummary.getCaseDescription());
        assertEquals("123", caseSummary.getFilingNumber());
        assertEquals("COURT123", caseSummary.getCourCaseNumber());
        assertEquals("CNR123", caseSummary.getCnrNumber());
        assertEquals("Details of the case", caseSummary.getCaseDetails());
        assertEquals("Civil", caseSummary.getCaseCategory());
        assertEquals("Open", caseSummary.getStatus());
        assertEquals("No remarks", caseSummary.getRemarks());
    }

    @Test
    void testExtractData_emptyResultSet() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(false);

        // Act
        List<CaseSummary> caseSummaries = caseSummaryRowMapper.extractData(resultSet);

        // Assert
        assertNotNull(caseSummaries);
        assertTrue(caseSummaries.isEmpty());
    }

    @Test
    void testExtractData_failure() throws SQLException {

        when(resultSet.next()).thenReturn(true); // Simulate that we are trying to process one row
        when(resultSet.getString("resolutionmechanism")).thenThrow(new SQLException("Invalid column name")); // Simulate an exception

        CustomException exception = assertThrows(CustomException.class, () -> {
            caseSummaryRowMapper.extractData(resultSet);
        });

        assertEquals("ROW_MAPPER_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("Exception occurred while processing CaseSummary ResultSet: Invalid column name"));
        assertTrue(exception.getMessage().contains("Invalid column name"));
    }

    @Test
    void testExtractData_success_without_statutes() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false); // Simulate one row of data
        when(resultSet.getString("resolutionmechanism")).thenReturn("Arbitration");
        when(resultSet.getString("casetitle")).thenReturn("Case Title");
        when(resultSet.getString("casedescription")).thenReturn("Case Description");
        when(resultSet.getString("filingnumber")).thenReturn("123");
        when(resultSet.getString("courtcasenumber")).thenReturn("COURT123");
        when(resultSet.getString("cnrnumber")).thenReturn("CNR123");
        when(resultSet.getDate("filingdate")).thenReturn(Date.valueOf(LocalDate.of(2022, 1, 1)));
        when(resultSet.getDate("registrationdate")).thenReturn(Date.valueOf(LocalDate.of(2022, 1, 2)));
        when(resultSet.getString("casedetails")).thenReturn("Details of the case");
        when(resultSet.getString("casecategory")).thenReturn("Civil");
        when(resultSet.getString("status")).thenReturn("Open");
        when(resultSet.getString("remarks")).thenReturn("No remarks");
        when(resultSet.getString("orderid")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("tenantid")).thenReturn("tenant1");
        when(resultSet.getString("cnrnumber")).thenReturn("CNR123");
        when(resultSet.getString("applicationnumber")).thenReturn("APP1,APP2");
        when(resultSet.getString("hearingnumber")).thenReturn("HEARING123");
        when(resultSet.getString("ordernumber")).thenReturn("ORDER123");
        when(resultSet.getString("linkedordernumber")).thenReturn("LINKEDORDER123");
        when(resultSet.getLong("createddate")).thenReturn(1627893600000L); // Some timestamp
        when(resultSet.getString("ordertype")).thenReturn("Final");
        when(resultSet.getString("ordercategory")).thenReturn("Civil");
        when(resultSet.getString("comments")).thenReturn("This is a comment");
        when(resultSet.getBoolean("isactive")).thenReturn(true);
        when(resultSet.getString("additionaldetails")).thenReturn("Additional details");

        // Act
        List<CaseSummary> caseSummaries = caseSummaryRowMapper.extractData(resultSet);

        // Assert
        assertNotNull(caseSummaries);
        assertEquals(1, caseSummaries.size());

        CaseSummary caseSummary = caseSummaries.get(0);
        assertEquals("Arbitration", caseSummary.getResolutionMechanism());
        assertEquals("Case Title", caseSummary.getCaseTitle());
        assertEquals("Case Description", caseSummary.getCaseDescription());
        assertEquals("123", caseSummary.getFilingNumber());
        assertEquals("COURT123", caseSummary.getCourCaseNumber());
        assertEquals("CNR123", caseSummary.getCnrNumber());
        assertEquals("Details of the case", caseSummary.getCaseDetails());
        assertEquals("Civil", caseSummary.getCaseCategory());
        assertEquals("Open", caseSummary.getStatus());
        assertEquals("No remarks", caseSummary.getRemarks());
    }
}
