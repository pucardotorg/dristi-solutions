package org.pucar.dristi.repository.rowMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.web.models.Order;
import org.egov.tracer.model.CustomException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JudgementRowMapperTest {

    private JudgementRowMapper judgementRowMapper;
    private ResultSet resultSet;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        judgementRowMapper = new JudgementRowMapper();
        resultSet = mock(ResultSet.class);
    }

    @Test
    void testExtractData_success() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true).thenReturn(false); // Simulate one row of data
        when(resultSet.getString("id")).thenReturn(UUID.randomUUID().toString());
        when(resultSet.getString("tenantid")).thenReturn("tenant1");
        when(resultSet.getString("filingnumber")).thenReturn("FILING123");
        when(resultSet.getString("cnrnumber")).thenReturn("CNR123");
        when(resultSet.getString("applicationnumber")).thenReturn("APP1,APP2");
        when(resultSet.getString("hearingnumber")).thenReturn("HEARING123");
        when(resultSet.getString("ordernumber")).thenReturn("ORDER123");
        when(resultSet.getString("linkedordernumber")).thenReturn("LINKEDORDER123");
        when(resultSet.getLong("createddate")).thenReturn(1627893600000L); // Some timestamp
        when(resultSet.getString("ordertype")).thenReturn("Final");
        when(resultSet.getString("ordercategory")).thenReturn("Civil");
        when(resultSet.getString("status")).thenReturn("Active");
        when(resultSet.getString("comments")).thenReturn("This is a comment");
        when(resultSet.getBoolean("isactive")).thenReturn(true);
        when(resultSet.getString("additionaldetails")).thenReturn("Additional details");

        // Act
        List<Order> orders = judgementRowMapper.extractData(resultSet);

        // Assert
        assertNotNull(orders);
        assertEquals(1, orders.size());

        Order order = orders.get(0);
        assertEquals("tenant1", order.getTenantId());
        assertEquals("FILING123", order.getFilingNumber());
        assertEquals("CNR123", order.getCnrNumber());
        assertEquals(List.of("APP1", "APP2"), order.getApplicationNumber());
        assertEquals("HEARING123", order.getHearingNumber());
        assertEquals("ORDER123", order.getOrderNumber());
        assertEquals("LINKEDORDER123", order.getLinkedOrderNumber());
        assertEquals(1627893600000L, order.getCreatedDate());
        assertEquals("Final", order.getOrderType());
        assertEquals("Civil", order.getOrderCategory());
        assertEquals("Active", order.getStatus());
        assertEquals("This is a comment", order.getComments());
        assertTrue(order.getIsActive());
        assertEquals("Additional details", order.getAdditionalDetails());
    }

    @Test
    void testExtractData_failure() throws SQLException {
        // Arrange
        when(resultSet.next()).thenReturn(true); // Simulate one row of data
        when(resultSet.getString("id")).thenThrow(new SQLException("Error in resultSet"));

        // Act and Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            judgementRowMapper.extractData(resultSet);
        });

        // Verify the exception message and code
        assertEquals("ROW_MAPPER_EXCEPTION", exception.getCode());
        assertTrue(exception.getMessage().contains("Error in resultSet"));
    }

    @Test
    void testStringToList_success() {
        // Act
        List<String> result = judgementRowMapper.stringToList("item1,item2,item3");

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(List.of("item1", "item2", "item3"), result);
    }

    @Test
    void testStringToList_nullInput() {
        // Act
        List<String> result = judgementRowMapper.stringToList(null);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size()); // Expecting an empty list when input is null
    }

    @Test
    void testStringToList_emptyInput() {
        // Act
        List<String> result = judgementRowMapper.stringToList("");

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size()); // Expecting an empty list when input is an empty string
    }
}

