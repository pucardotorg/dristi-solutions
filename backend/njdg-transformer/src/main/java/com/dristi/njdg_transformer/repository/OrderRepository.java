package com.dristi.njdg_transformer.repository;

import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.repository.querybuilder.OrderQueryBuilder;
import com.dristi.njdg_transformer.repository.rowmapper.InterimOrderRowMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
@RequiredArgsConstructor
public class OrderRepository {


    private final OrderQueryBuilder orderQueryBuilder;
    private final JdbcTemplate jdbcTemplate;

    public List<InterimOrder> getInterimOrderByCino(String cino){
        String orderSearchQuery = orderQueryBuilder.getInterimOrderQuery();
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgsList = new ArrayList<>();
        preparedStmtList.add(cino);
        preparedStmtArgsList.add(Types.VARCHAR);
        return jdbcTemplate.query(orderSearchQuery, preparedStmtList.toArray(), preparedStmtArgsList.stream().mapToInt(Integer::intValue).toArray(), new InterimOrderRowMapper());
    }

    public void insertInterimOrder(InterimOrder interimOrder) {
        String insertQuery = orderQueryBuilder.getInsertInterimOrderQuery();
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgsList = new ArrayList<>();
        preparedStmtList.add(interimOrder.getId());
        preparedStmtList.add(interimOrder.getCino());
        preparedStmtList.add(interimOrder.getSrNo());
        preparedStmtList.add(interimOrder.getOrderDate());
        preparedStmtList.add(interimOrder.getOrderNo());
        preparedStmtList.add(interimOrder.getOrderDetails());
        preparedStmtList.add(interimOrder.getCourtOrderNumber());
        preparedStmtList.add(interimOrder.getOrderType());
        preparedStmtArgsList.add(Types.INTEGER);
        preparedStmtArgsList.add(Types.VARCHAR);
        preparedStmtArgsList.add(Types.INTEGER);
        preparedStmtArgsList.add(Types.DATE);
        preparedStmtArgsList.add(Types.INTEGER);
        preparedStmtArgsList.add(Types.BINARY);
        preparedStmtArgsList.add(Types.VARCHAR);
        preparedStmtArgsList.add(Types.VARCHAR);
        jdbcTemplate.update(insertQuery, preparedStmtList.toArray(), preparedStmtArgsList.stream().mapToInt(Integer::intValue).toArray());
    }
}
