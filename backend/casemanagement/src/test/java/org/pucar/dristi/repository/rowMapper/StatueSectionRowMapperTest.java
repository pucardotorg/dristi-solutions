package org.pucar.dristi.repository.rowMapper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.web.models.StatuteSection;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.postgresql.util.PGobject;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StatuteSectionRowMapperTest {

    private StatuteSectionRowMapper statuteSectionRowMapper;
    private ResultSet resultSet;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        objectMapper = new ObjectMapper();
        statuteSectionRowMapper = new StatuteSectionRowMapper(objectMapper);
        resultSet = mock(ResultSet.class);
    }

    @Test
    void testExtractData_success() throws Exception {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false); // Simulate one row of data
        when(resultSet.getString("case_id")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("id")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("tenantid")).thenReturn("tenant1");
        when(resultSet.getString("sections")).thenReturn("section1,section2");
        when(resultSet.getString("subsections")).thenReturn("sub1,sub2");
        when(resultSet.getString("statutes")).thenReturn("statute1");
        when(resultSet.getString("createdby")).thenReturn("user1");
        when(resultSet.getLong("createdtime")).thenReturn(1627893600000L);
        when(resultSet.getString("lastmodifiedby")).thenReturn("user2");
        when(resultSet.getLong("lastmodifiedtime")).thenReturn(1627893600000L);

        // Simulating the PGObject for additionalDetails
        PGobject pgObject = new PGobject();
        pgObject.setValue("{\"key\":\"value\"}");
        when(resultSet.getObject("additionalDetails")).thenReturn(pgObject);

        // Act
        List<StatuteSection> statuteSections = statuteSectionRowMapper.extractData(resultSet);

        // Assert
        assertNotNull(statuteSections);
        assertEquals(1, statuteSections.size());

        StatuteSection statuteSection = statuteSections.get(0);
        assertEquals("tenant1", statuteSection.getTenantId());
        assertEquals(List.of("section1", "section2"), statuteSection.getSections());
        assertEquals(List.of("sub1", "sub2"), statuteSection.getSubsections());
        assertEquals("statute1", statuteSection.getStatute());

        // Assert the AuditDetails
        AuditDetails auditDetails = statuteSection.getAuditdetails();
        assertEquals("user1", auditDetails.getCreatedBy());
        assertEquals(1627893600000L, auditDetails.getCreatedTime());
        assertEquals("user2", auditDetails.getLastModifiedBy());
        assertEquals(1627893600000L, auditDetails.getLastModifiedTime());

        // Assert the additional details
        JsonNode additionalDetails = (JsonNode) statuteSection.getAdditionalDetails();
        assertNotNull(additionalDetails);
        assertEquals("value", additionalDetails.get("key").asText());
    }

    @Test
    void testExtractData_nullAdditionalDetails() throws Exception {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false); // Simulate one row of data
        when(resultSet.getString("case_id")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("id")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("tenantid")).thenReturn("tenant1");
        when(resultSet.getString("sections")).thenReturn("section1,section2");
        when(resultSet.getString("subsections")).thenReturn("sub1,sub2");
        when(resultSet.getString("statutes")).thenReturn("statute1");
        when(resultSet.getString("createdby")).thenReturn("user1");
        when(resultSet.getLong("createdtime")).thenReturn(1627893600000L);
        when(resultSet.getString("lastmodifiedby")).thenReturn("user2");
        when(resultSet.getLong("lastmodifiedtime")).thenReturn(1627893600000L);

        when(resultSet.getObject("additionalDetails")).thenReturn(null); // No additional details

        // Act
        List<StatuteSection> statuteSections = statuteSectionRowMapper.extractData(resultSet);

        // Assert
        assertNotNull(statuteSections);
        assertEquals(1, statuteSections.size());

        StatuteSection statuteSection = statuteSections.get(0);
        assertNull(statuteSection.getAdditionalDetails()); // Additional details should be null
    }

    @Test
    void testExtractData_failure() throws Exception {
        // Arrange
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("id")).thenThrow(new SQLException("Error in resultSet"));

        // Act and Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            statuteSectionRowMapper.extractData(resultSet);
        });

        // Verify the exception message and code
        assertEquals("ROW_MAPPER_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("Error in resultSet"));
    }

    @Test
    void testStringToList_success() {
        // Act
        List<String> result = statuteSectionRowMapper.stringToList("item1,item2,item3");

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(List.of("item1", "item2", "item3"), result);
    }

    @Test
    void testStringToList_nullInput() {
        // Act
        List<String> result = statuteSectionRowMapper.stringToList(null);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size()); // Expecting an empty list when input is null
    }

    @Test
    void testStringToList_emptyInput() {
        // Act
        List<String> result = statuteSectionRowMapper.stringToList("");

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size()); // Expecting an empty list when input is an empty string
    }
}

