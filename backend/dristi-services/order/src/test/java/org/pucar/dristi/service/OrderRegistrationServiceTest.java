package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.OrderRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.OrderRepository;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.validators.OrderRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(SpringExtension.class)
 class OrderRegistrationServiceTest {

    @InjectMocks
    private OrderRegistrationService orderRegistrationService;

    @Mock
    private OrderRegistrationValidator validator;

    @Mock
    private OrderRegistrationEnrichment enrichmentUtil;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private WorkflowUtil workflowUtil;

    @Mock
    private Configuration config;

    @Mock
    private Producer producer;

   @Mock
   private ObjectMapper objectMapper;

   @Mock
   private FileStoreUtil fileStoreUtil;

    @BeforeEach
     void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
     void testCreateOrder_success() {
        OrderRequest orderRequest = new OrderRequest();
        Order order = new Order();
        order.setOrderCategory("other");
        order.setOrderType("other");
        orderRequest.setOrder(order);

        doNothing().when(validator).validateOrderRegistration(any(OrderRequest.class));
        doNothing().when(enrichmentUtil).enrichOrderRegistration(any(OrderRequest.class));
        when(workflowUtil.updateWorkflowStatus(any(RequestInfo.class),anyString(),anyString(),anyString(),any(WorkflowObject.class),anyString())).thenReturn("APPROVED");
        doNothing().when(producer).push(anyString(), any(OrderRequest.class));

        Order result = orderRegistrationService.createOrder(orderRequest);

        assertNotNull(result);
        verify(validator, times(1)).validateOrderRegistration(orderRequest);
        verify(enrichmentUtil, times(1)).enrichOrderRegistration(orderRequest);
    }

    @Test
     void testCreateOrder_customException() {
        OrderRequest orderRequest = new OrderRequest();

        doThrow(new CustomException("TEST_EXCEPTION", "Test exception"))
                .when(validator).validateOrderRegistration(any(OrderRequest.class));

        CustomException exception = assertThrows(CustomException.class, () ->
                orderRegistrationService.createOrder(orderRequest));

        assertTrue(exception.getMessage().contains("Test exception"));
        verify(validator, times(1)).validateOrderRegistration(orderRequest);
    }

    @Test
     void testSearchOrder_success() {
        List<Order> mockOrderList = new ArrayList<>();
        Order order = new Order();
        order.setTenantId("tenantId");
        order.setCnrNumber("CNR123");
        order.setFilingNumber("Filing123");
        order.setStatus("status");
        order.setOrderNumber("order");
        order.setApplicationNumber(Collections.singletonList(""));
        order.setId(UUID.fromString("3244d158-c5cb-4769-801f-a0f94f383679"));
        order.setStatuteSection(new StatuteSection());
        mockOrderList.add(order);

        when(orderRepository.getOrders(any(),any())).thenReturn(mockOrderList);

        OrderSearchRequest orderSearchRequest = new OrderSearchRequest();
        orderSearchRequest.setCriteria(new OrderCriteria());
        List<Order> result = orderRegistrationService.searchOrder(orderSearchRequest);

        assertNotNull(result);
        verify(orderRepository, times(1)).getOrders(orderSearchRequest.getCriteria(),orderSearchRequest.getPagination());
    }

    @Test
     void testSearchOrder_Exception() {
        assertThrows(CustomException.class, () ->
                orderRegistrationService.searchOrder(null));
    }

    @Test
     void testUpdateOrder_success() {
        OrderRequest orderRequest = new OrderRequest();
        Order order = new Order();
        order.setWorkflow(new WorkflowObject());
        order.setOrderCategory("other");
        order.setOrderType("other");
        order.setDocuments(List.of(new Document()));
        orderRequest.setOrder(order);

        Order existingOrder = new Order();
        existingOrder.setId(UUID.randomUUID());

        when(validator.validateApplicationExistence(any(OrderRequest.class))).thenReturn(true);
        doNothing().when(enrichmentUtil).enrichOrderRegistrationUponUpdate(any(OrderRequest.class));
        doNothing().when(producer).push(anyString(), any(OrderRequest.class));

        Order result = orderRegistrationService.updateOrder(orderRequest);

        assertNotNull(result);
        verify(validator, times(1)).validateApplicationExistence(orderRequest);
        verify(enrichmentUtil, times(1)).enrichOrderRegistrationUponUpdate(orderRequest);
    }

    @Test
     void testUpdateOrder_customException() {
        OrderRequest orderRequest = new OrderRequest();

        when(validator.validateApplicationExistence(any(OrderRequest.class))).thenReturn(true);

       assertThrows(CustomException.class, () ->
                orderRegistrationService.updateOrder(orderRequest));
    }

    @Test
     void testExistsOrder_success() {
        OrderExistsRequest orderExistsRequest = new OrderExistsRequest();
        OrderExists orderExists = new OrderExists();
        orderExists.setApplicationNumber("appNum");
        orderExists.setFilingNumber("filingNum");
        orderExists.setCnrNumber("cnrNum");
        orderExistsRequest.setOrder(List.of(orderExists));
        User user = User.builder().uuid(UUID.randomUUID().toString()).build();
        RequestInfo requestInfo = RequestInfo.builder().userInfo(user).build();
        orderExistsRequest.setRequestInfo(requestInfo);

        List<Order> mockOrderList = new ArrayList<>();
        Order mockOrder = new Order();
        mockOrder.setFilingNumber("filingNum");
        mockOrder.setCnrNumber("cnrNum");
        mockOrder.setApplicationNumber(List.of("cnrNum"));
        mockOrder.setTenantId("pg");
        mockOrderList.add(mockOrder);

        when(orderRepository.getOrders(any(),any()))
                .thenReturn(mockOrderList);

        List<OrderExists> result = orderRegistrationService.existsOrder(orderExistsRequest);

        assertNotNull(result);
    }

    @Test
     void testExistOrder_customException() {

      assertThrows(CustomException.class, () ->
              orderRegistrationService.existsOrder(null));
   }

   // New tests for addItem method
   @Test
   void testAddItem_success() {
      // Setup
      OrderRequest orderRequest = new OrderRequest();
      Order order = new Order();
      order.setOrderNumber("TEST-ORDER-123");
      order.setTenantId("test-tenant");
      order.setWorkflow(new WorkflowObject());
      orderRequest.setOrder(order);
      RequestInfo requestInfo = new RequestInfo();
      orderRequest.setRequestInfo(requestInfo);

      // Mocks
      when(validator.validateApplicationExistence(any(OrderRequest.class))).thenReturn(true);
      doNothing().when(validator).validateAddItem(any(OrderRequest.class));
      doNothing().when(enrichmentUtil).enrichOrderRegistrationUponUpdate(any(OrderRequest.class));
      doNothing().when(enrichmentUtil).enrichCompositeOrderItemIdOnAddItem(any(OrderRequest.class));
      doNothing().when(producer).push(anyString(), any(OrderRequest.class));
      when(config.getUpdateOrderKafkaTopic()).thenReturn("update-order-topic");

      // Method call
      Order result = orderRegistrationService.addItem(orderRequest);

      // Assertions
      assertNotNull(result);
      assertEquals(order, result);
      verify(validator).validateApplicationExistence(orderRequest);
      verify(validator).validateAddItem(orderRequest);
      verify(enrichmentUtil).enrichOrderRegistrationUponUpdate(orderRequest);
      verify(enrichmentUtil).enrichCompositeOrderItemIdOnAddItem(orderRequest);
      verify(producer).push("update-order-topic", orderRequest);
   }

   @Test
   void testAddItem_orderDoesNotExist() {
      // Setup
      OrderRequest orderRequest = new OrderRequest();
      Order order = new Order();
      orderRequest.setOrder(order);

      // Mocks
      when(validator.validateApplicationExistence(any(OrderRequest.class))).thenReturn(false);

      // Method call and assertions
      CustomException exception = assertThrows(CustomException.class, () ->
              orderRegistrationService.addItem(orderRequest));

      assertEquals("ORDER_UPDATE_EXCEPTION", exception.getCode());
      assertEquals("Order doesn't exist", exception.getMessage());
      verify(validator).validateApplicationExistence(orderRequest);
      verify(validator, never()).validateAddItem(any(OrderRequest.class));
   }

   @Test
   void testAddItem_validationException() {
      // Setup
      OrderRequest orderRequest = new OrderRequest();
      Order order = new Order();
      orderRequest.setOrder(order);

      // Mocks
      when(validator.validateApplicationExistence(any(OrderRequest.class))).thenReturn(true);
      doThrow(new CustomException("VALIDATION_ERROR", "Invalid item data"))
              .when(validator).validateAddItem(any(OrderRequest.class));

      // Method call and assertions
      CustomException exception = assertThrows(CustomException.class, () ->
              orderRegistrationService.addItem(orderRequest));

      assertEquals("VALIDATION_ERROR", exception.getCode());
      assertEquals("Invalid item data", exception.getMessage());
      verify(validator).validateApplicationExistence(orderRequest);
      verify(validator).validateAddItem(orderRequest);
   }

   @Test
   void testAddItem_genericException() {
      // Setup
      OrderRequest orderRequest = new OrderRequest();
      Order order = new Order();
      orderRequest.setOrder(order);

      // Mocks
      when(validator.validateApplicationExistence(any(OrderRequest.class))).thenReturn(true);
      doNothing().when(validator).validateAddItem(any(OrderRequest.class));
      doThrow(new RuntimeException("Unexpected error"))
              .when(enrichmentUtil).enrichOrderRegistrationUponUpdate(any(OrderRequest.class));

      // Method call and assertions
      CustomException exception = assertThrows(CustomException.class, () ->
              orderRegistrationService.addItem(orderRequest));

      assertEquals("ORDER_UPDATE_EXCEPTION", exception.getCode());
      assertTrue(exception.getMessage().contains("Error occurred while adding item/order"));
      verify(validator).validateApplicationExistence(orderRequest);
      verify(validator).validateAddItem(orderRequest);
   }

   // New tests for removeItem method
   @Test
   void testRemoveItem_success() {
      // Setup
      RemoveItemRequest removeItemRequest = new RemoveItemRequest();
      RemoveItem removeItem = new RemoveItem();
      removeItem.setOrderNumber("TEST-ORDER-123");
      removeItem.setTenantId("test-tenant");
      removeItem.setItemID("item-123");
      removeItemRequest.setOrder(removeItem);
      RequestInfo requestInfo = new RequestInfo();
      removeItemRequest.setRequestInfo(requestInfo);

      Order existingOrder = new Order();
      existingOrder.setOrderNumber("TEST-ORDER-123");
      existingOrder.setTenantId("test-tenant");

      ArrayNode mockArrayNode = mock(ArrayNode.class);
      ObjectNode mockObjectNode = mock(ObjectNode.class);

      // Mocks
      when(orderRepository.getOrders(any(OrderCriteria.class), any()))
              .thenReturn(Collections.singletonList(existingOrder));
      when(objectMapper.convertValue(any(), eq(ArrayNode.class))).thenReturn(mockArrayNode);
      when(mockArrayNode.isEmpty()).thenReturn(false);
      when(mockArrayNode.size()).thenReturn(1);
      when(mockArrayNode.get(0)).thenReturn(mockObjectNode);
      when(mockObjectNode.path("id")).thenReturn(mockObjectNode);
      when(mockObjectNode.asText()).thenReturn("item-123");
      doNothing().when(enrichmentUtil).enrichAuditDetails(any(OrderRequest.class));
      when(config.getUpdateOrderKafkaTopic()).thenReturn("update-order-topic");
      doNothing().when(producer).push(anyString(), any(OrderRequest.class));

      // Method call
      Order result = orderRegistrationService.removeItem(removeItemRequest);

      // Assertions
      assertNotNull(result);
      assertEquals(existingOrder, result);
      verify(orderRepository).getOrders(any(OrderCriteria.class), any());
      verify(objectMapper).convertValue(any(), eq(ArrayNode.class));
      verify(enrichmentUtil).enrichAuditDetails(any(OrderRequest.class));
      verify(producer).push(anyString(), any(OrderRequest.class));
   }

   @Test
   void testRemoveItem_orderNotFound() {
      // Setup
      RemoveItemRequest removeItemRequest = new RemoveItemRequest();
      RemoveItem removeItem = new RemoveItem();
      removeItem.setOrderNumber("NON-EXISTENT-ORDER");
      removeItem.setTenantId("test-tenant");
      removeItemRequest.setOrder(removeItem);

      // Mocks
      when(orderRepository.getOrders(any(OrderCriteria.class), isNull()))
              .thenReturn(Collections.emptyList());

      // Method call and assertions
      CustomException exception = assertThrows(CustomException.class, () ->
              orderRegistrationService.removeItem(removeItemRequest));

      assertEquals("ORDER_UPDATE_EXCEPTION", exception.getCode());
      assertEquals("Order doesn't exist", exception.getMessage());
      verify(orderRepository).getOrders(any(OrderCriteria.class), isNull());
   }

   @Test
   void testRemoveItem_genericException() {
      // Setup
      RemoveItemRequest removeItemRequest = new RemoveItemRequest();
      RemoveItem removeItem = new RemoveItem();
      removeItem.setOrderNumber("TEST-ORDER-123");
      removeItem.setTenantId("test-tenant");
      removeItemRequest.setOrder(removeItem);

      // Mocks
      when(orderRepository.getOrders(any(OrderCriteria.class), isNull()))
              .thenThrow(new RuntimeException("Database error"));

      // Method call and assertions
      CustomException exception = assertThrows(CustomException.class, () ->
              orderRegistrationService.removeItem(removeItemRequest));

      assertEquals("ORDER_UPDATE_EXCEPTION", exception.getCode());
      assertTrue(exception.getMessage().contains("Error occurred while removing item/order"));
      verify(orderRepository).getOrders(any(OrderCriteria.class), isNull());
   }

    @Test
    void testUpdateOrder_filtersInactiveDocuments() {
        // Setup
        OrderRequest orderRequest = new OrderRequest();
        Order order = new Order();
        order.setWorkflow(new WorkflowObject());
        order.setOrderCategory("other");
        order.setOrderType("other");

        // One active and one inactive document
        Document activeDoc = new Document();
        activeDoc.setIsActive(true);

        Document inactiveDoc = new Document();
        inactiveDoc.setIsActive(false);

        order.setDocuments(List.of(activeDoc, inactiveDoc));
        orderRequest.setOrder(order);

        // Mocks
        when(validator.validateApplicationExistence(any(OrderRequest.class))).thenReturn(true);
        doNothing().when(enrichmentUtil).enrichOrderRegistrationUponUpdate(any(OrderRequest.class));
        doNothing().when(enrichmentUtil).enrichCompositeOrderItemIdOnAddItem(any(OrderRequest.class));
        doNothing().when(producer).push(anyString(), any(OrderRequest.class));
        when(config.getUpdateOrderKafkaTopic()).thenReturn("update-order-topic");

        // Method call
        Order result = orderRegistrationService.updateOrder(orderRequest);

        // Assertions
        assertNotNull(result);
        assertNotNull(result.getDocuments());
        assertEquals(1, result.getDocuments().size());
        assertTrue(result.getDocuments().get(0).getIsActive()); // Only active doc retained

        // Verifications
        verify(validator).validateApplicationExistence(orderRequest);
        verify(enrichmentUtil).enrichOrderRegistrationUponUpdate(orderRequest);
        verify(enrichmentUtil).enrichCompositeOrderItemIdOnAddItem(orderRequest);
        verify(producer).push("update-order-topic", orderRequest);
    }

}