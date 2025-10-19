package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.InterimOrder;
import org.springframework.jdbc.core.RowMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

public class InterimOrderRowMapper implements RowMapper<InterimOrder> {

    @Override
    public InterimOrder mapRow(ResultSet rs, int rowNum) throws SQLException {
        InterimOrder interimOrder = new InterimOrder();
        interimOrder.setId(rs.getInt("id"));
        interimOrder.setCino(rs.getString("cino"));
        interimOrder.setSrNo(rs.getInt("sr_no"));

        java.sql.Date orderDate = rs.getDate("order_date");
        interimOrder.setOrderDate(orderDate != null ? orderDate.toLocalDate() : LocalDate.parse(""));

        interimOrder.setOrderNo(rs.getString("order_no"));
        interimOrder.setOrderDetails(rs.getBytes("order_details"));

        return interimOrder;
    }
}
