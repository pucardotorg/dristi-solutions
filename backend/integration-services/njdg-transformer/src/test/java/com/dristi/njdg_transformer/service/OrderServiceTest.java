package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.OrderRepository;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.dristi.njdg_transformer.utils.MdmsUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;


    @Mock
    private Producer producer;

    @Mock
    private TransformerProperties properties;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private JsonUtil jsonUtil;

    @InjectMocks
    private OrderService orderService;

    private Order order;
    private RequestInfo requestInfo;
    private JudgeDetails judgeDetails;
    private NJDGTransformRecord njdgRecord;
    private DesignationMaster designationMaster;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setOrderNumber("ORD-001");
        order.setStatus("PUBLISHED");
        order.setOrderCategory("INTERMEDIATE");
        order.setOrderType("JUDGEMENT");
        order.setCnrNumber("CNR-001");
        order.setTenantId("kl.kollam");
        order.setCreatedDate(System.currentTimeMillis());
        order.setDocuments(Collections.emptyList());

        requestInfo = RequestInfo.builder().build();

        judgeDetails = new JudgeDetails();
        judgeDetails.setJudgeCode(1);
        judgeDetails.setJocode("JO-001");
        judgeDetails.setCourtNo(1);
        judgeDetails.setDesgCode(1);

        njdgRecord = new NJDGTransformRecord();
        njdgRecord.setCino("CNR-001");
        njdgRecord.setCaseType(1);

        designationMaster = new DesignationMaster();
        designationMaster.setDesgCode(1);
        designationMaster.setDesgName("JUDICIAL_MAGISTRATE");
    }

    @Test
    void testProcessAndUpdateOrder_Success() {
        lenient().when(orderRepository.getInterimOrderByCino("CNR-001")).thenReturn(Collections.emptyList());
        lenient().when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        lenient().when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        lenient().when(properties.getJudgementOrderType()).thenReturn("JUDGEMENT");
        lenient().when(properties.getJudgementOrderDocumentType()).thenReturn(3);
        lenient().when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        InterimOrder result = orderService.processAndUpdateOrder(order, requestInfo);

        assertNotNull(result);
        verify(producer).push(eq("save-order-details"), any(InterimOrder.class));
    }

    @Test
    void testProcessAndUpdateOrder_WithExistingOrders() {
        InterimOrder existingOrder = new InterimOrder();
        existingOrder.setCino("CNR-001");
        existingOrder.setSrNo(1);
        existingOrder.setOrderNo(1);

        lenient().when(orderRepository.getInterimOrderByCino("CNR-001"))
                .thenReturn(Collections.singletonList(existingOrder));
        lenient().when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        lenient().when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        lenient().when(properties.getJudgementOrderType()).thenReturn("JUDGEMENT");
        lenient().when(properties.getJudgementOrderDocumentType()).thenReturn(3);
        lenient().when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        InterimOrder result = orderService.processAndUpdateOrder(order, requestInfo);

        assertNotNull(result);
    }

    @Test
    void testProcessAndUpdateOrder_NoJudgeDetails() {
        lenient().when(orderRepository.getInterimOrderByCino("CNR-001")).thenReturn(Collections.emptyList());
        lenient().when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        lenient().when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.emptyList());
        lenient().when(properties.getJudgementOrderType()).thenReturn("JUDGEMENT");
        lenient().when(properties.getJudgementOrderDocumentType()).thenReturn(3);
        lenient().when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        InterimOrder result = orderService.processAndUpdateOrder(order, requestInfo);

        assertNotNull(result);
        assertEquals(0, result.getCourtNo());
    }

    @Test
    void testProcessOrderRequest_Success() {
        lenient().when(orderRepository.getInterimOrderByCino("CNR-001")).thenReturn(Collections.emptyList());
        lenient().when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        lenient().when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        lenient().when(properties.getJudgementOrderType()).thenReturn("JUDGEMENT");
        lenient().when(properties.getJudgementOrderDocumentType()).thenReturn(3);
        lenient().when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        ResponseEntity<InterimOrder> response = orderService.processOrderRequest(order, requestInfo);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testProcessOrderRequest_Exception() {
        lenient().when(orderRepository.getInterimOrderByCino(anyString()))
                .thenThrow(new RuntimeException("Database error"));

        ResponseEntity<InterimOrder> response = orderService.processOrderRequest(order, requestInfo);

        assertNotNull(response);
    }

}
