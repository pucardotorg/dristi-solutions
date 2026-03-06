package org.pucar.dristi.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.Order;
import org.pucar.dristi.web.models.OrderRequest;
import org.pucar.dristi.web.models.StatuteSection;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OrderRegistrationEnrichmentTest {

    @Mock
    private IdgenUtil idgenUtil;

    @Mock
    private Configuration configuration;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CaseUtil caseUtil;

    @InjectMocks
    private OrderRegistrationEnrichment orderRegistrationEnrichment;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    private OrderRequest createMockOrderRequest() {
        OrderRequest orderRequest = new OrderRequest();
        Order order = new Order();
        order.setStatuteSection(new StatuteSection());
        order.setFilingNumber("tenant-123");
        orderRequest.setOrder(order);
        orderRequest.setRequestInfo(new RequestInfo());
        orderRequest.getRequestInfo().setUserInfo(new User());
        orderRequest.getRequestInfo().getUserInfo().setUuid(UUID.randomUUID().toString());

        return orderRequest;
    }

    @Test
    void testEnrichOrderRegistration_Success() {
        // Given
        OrderRequest orderRequest = createMockOrderRequest();
        String mockTenantId = "tenant123";
        String mockOrderId = "ORDER123";
        String mockOrderNumber = "tenant-123" + "-" + mockOrderId;

        // Prepare mock courtId node
        JsonNode mockedCaseDetails = mock(JsonNode.class);
        JsonNode courtIdNode = mock(JsonNode.class);

        when(courtIdNode.isNull()).thenReturn(false);
        when(courtIdNode.textValue()).thenReturn("COURT123");

        when(configuration.getOrderConfig()).thenReturn("orderConfigValue");
        when(configuration.getOrderFormat()).thenReturn("orderFormatValue");
        when(idgenUtil.getIdList(any(), eq("tenant123"), any(), any(), eq(1), eq(false)))
                .thenReturn(Collections.singletonList(mockOrderId));

        when(caseUtil.searchCaseDetails(any())).thenReturn(mockedCaseDetails);
        when(mockedCaseDetails.get("courtId")).thenReturn(courtIdNode);

        // When
        orderRegistrationEnrichment.enrichOrderRegistration(orderRequest);

        // Then
        assertNotNull(orderRequest.getOrder().getAuditDetails());
        assertNotNull(orderRequest.getOrder().getId());
        assertEquals(mockOrderNumber, orderRequest.getOrder().getOrderNumber());
        assertNotNull(orderRequest.getOrder().getStatuteSection().getId());
        assertEquals("COURT123", orderRequest.getOrder().getCourtId());

        // Verify ID generation
        verify(idgenUtil).getIdList(any(), eq("tenant123"), any(), any(), eq(1), eq(false));
    }



    @Test
    void testEnrichOrderRegistration_WithoutUserInfo_ShouldDoNothing() {
        // Given
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setRequestInfo(new RequestInfo());
        // When
        orderRegistrationEnrichment.enrichOrderRegistration(orderRequest);

        // Then
        verify(idgenUtil, never()).getIdList(any(), any(), any(), any(), anyInt(), anyBoolean());
    }

    @Test
    void testEnrichOrderRegistration_ThrowsCustomException() {
        // Given
        OrderRequest orderRequest = createMockOrderRequest();

        when(configuration.getOrderConfig()).thenReturn("orderConfig");
        when(configuration.getOrderFormat()).thenReturn("orderFormat");
        when(idgenUtil.getIdList(any(), anyString(), anyString(), anyString(), eq(1), eq(false)))
                .thenThrow(new CustomException("IDGEN_ERROR", "Error generating ID"));

        // When & Then
        CustomException exception = assertThrows(CustomException.class, () -> {
            orderRegistrationEnrichment.enrichOrderRegistration(orderRequest);
        });
        assertEquals("IDGEN_ERROR", exception.getCode());
        assertEquals("Error generating ID", exception.getMessage());
    }

    @Test
    void testEnrichOrderRegistrationUponUpdate_Success() {
        // Given
        OrderRequest orderRequest = createMockOrderRequest();
        orderRequest.getOrder().setAuditDetails(new org.egov.common.contract.models.AuditDetails());

        // When
        orderRegistrationEnrichment.enrichOrderRegistrationUponUpdate(orderRequest);

        // Then
        assertNotNull(orderRequest.getOrder().getAuditDetails().getLastModifiedTime());
        assertNotNull(orderRequest.getOrder().getAuditDetails().getLastModifiedBy());
    }

    @Test
    void testEnrichOrderRegistrationUponUpdate_ThrowsCustomException() {
        // Given
        OrderRequest orderRequest = new OrderRequest();  // Missing required data

        // When & Then
        CustomException exception = assertThrows(CustomException.class, () -> {
            orderRegistrationEnrichment.enrichOrderRegistrationUponUpdate(orderRequest);
        });
        assertEquals("ENRICHMENT_EXCEPTION", exception.getCode());
    }

    @Test
    void testEnrichCompositeOrderItemIdOnAddItem_Success() {
        OrderRequest orderRequest = createMockOrderRequest();
        ArrayNode compositeItems = new ObjectMapper().createArrayNode();
        compositeItems.add(new ObjectMapper().createObjectNode());
        orderRequest.getOrder().setCompositeItems(compositeItems);
        orderRequest.getOrder().setOrderCategory("COMPOSITE");

        ObjectNode realObjectNode = new ObjectMapper().createObjectNode();
        ArrayNode realArrayNode = new ObjectMapper().createArrayNode();
        realArrayNode.add(realObjectNode);

        when(objectMapper.convertValue(any(), eq(ArrayNode.class))).thenReturn(realArrayNode);

        orderRegistrationEnrichment.enrichCompositeOrderItemIdOnAddItem(orderRequest);

        assertTrue(realObjectNode.has("id"));
        assertNotNull(realObjectNode.get("id").asText());
    }


    @Test
    void testEnrichCompositeOrderItemIdOnAddItem_ThrowsCustomException() {
        OrderRequest orderRequest = new OrderRequest();

        CustomException exception = assertThrows(CustomException.class, () -> {
            orderRegistrationEnrichment.enrichCompositeOrderItemIdOnAddItem(orderRequest);
        });
        assertEquals("ENRICHMENT_EXCEPTION", exception.getCode());
    }
}
