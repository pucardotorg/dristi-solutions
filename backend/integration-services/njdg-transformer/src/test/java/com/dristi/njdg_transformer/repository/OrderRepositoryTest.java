package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.repository.querybuilder.OrderQueryBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderRepositoryTest {

    @Mock
    private OrderQueryBuilder orderQueryBuilder;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private OrderRepository orderRepository;

    private InterimOrder interimOrder;

    @BeforeEach
    void setUp() {
        interimOrder = new InterimOrder();
        interimOrder.setCino("CNR-001");
        interimOrder.setSrNo(1);
        interimOrder.setOrderDate(LocalDate.now());
        interimOrder.setOrderNo(1);
        interimOrder.setOrderDetails(new byte[]{1, 2, 3});
        interimOrder.setCourtOrderNumber("ORD-001");
        interimOrder.setOrderType("JUDGEMENT");
        interimOrder.setDocType(3);
        interimOrder.setJoCode("JO-001");
        interimOrder.setDispReason(10);
        interimOrder.setCourtNo(1);
        interimOrder.setJudgeCode(1);
        interimOrder.setDesigCode(1);
    }

    @Test
    void testGetInterimOrderByCino_Success() {
        when(orderQueryBuilder.getInterimOrderQuery()).thenReturn("SELECT * FROM interim_orders WHERE cino = ?");
        doReturn(Collections.singletonList(interimOrder))
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<InterimOrder> result = orderRepository.getInterimOrderByCino("CNR-001");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("CNR-001", result.get(0).getCino());
    }

    @Test
    void testGetInterimOrderByCino_Empty() {
        when(orderQueryBuilder.getInterimOrderQuery()).thenReturn("SELECT * FROM interim_orders WHERE cino = ?");
        doReturn(Collections.emptyList())
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<InterimOrder> result = orderRepository.getInterimOrderByCino("CNR-001");

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetInterimOrderByCino_MultipleRecords() {
        InterimOrder order1 = new InterimOrder();
        order1.setCino("CNR-001");
        order1.setSrNo(1);

        InterimOrder order2 = new InterimOrder();
        order2.setCino("CNR-001");
        order2.setSrNo(2);

        when(orderQueryBuilder.getInterimOrderQuery()).thenReturn("SELECT * FROM interim_orders WHERE cino = ?");
        doReturn(List.of(order1, order2))
                .when(jdbcTemplate).query(anyString(), any(Object[].class), any(int[].class), any(org.springframework.jdbc.core.RowMapper.class));

        List<InterimOrder> result = orderRepository.getInterimOrderByCino("CNR-001");

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    void testInsertInterimOrder_Success() {
        when(orderQueryBuilder.getInsertInterimOrderQuery()).thenReturn("INSERT INTO interim_orders VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> orderRepository.insertInterimOrder(interimOrder));
        verify(jdbcTemplate).update(anyString(), any(Object[].class), any(int[].class));
    }

    @Test
    void testInsertInterimOrder_WithAllFields() {
        interimOrder.setOrderDetails(new byte[]{1, 2, 3, 4, 5});
        interimOrder.setDocType(5);

        when(orderQueryBuilder.getInsertInterimOrderQuery()).thenReturn("INSERT INTO interim_orders VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> orderRepository.insertInterimOrder(interimOrder));
    }

    @Test
    void testInsertInterimOrder_WithNullOrderDetails() {
        interimOrder.setOrderDetails(null);

        when(orderQueryBuilder.getInsertInterimOrderQuery()).thenReturn("INSERT INTO interim_orders VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> orderRepository.insertInterimOrder(interimOrder));
    }

    @Test
    void testInsertInterimOrder_WithEmptyOrderDetails() {
        interimOrder.setOrderDetails(new byte[0]);

        when(orderQueryBuilder.getInsertInterimOrderQuery()).thenReturn("INSERT INTO interim_orders VALUES (...)");
        when(jdbcTemplate.update(anyString(), any(Object[].class), any(int[].class))).thenReturn(1);

        assertDoesNotThrow(() -> orderRepository.insertInterimOrder(interimOrder));
    }
}
