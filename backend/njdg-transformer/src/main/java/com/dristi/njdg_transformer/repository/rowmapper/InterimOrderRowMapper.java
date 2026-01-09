package com.dristi.njdg_transformer.repository.rowmapper;

import com.dristi.njdg_transformer.model.InterimOrder;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

@Component
public class InterimOrderRowMapper implements RowMapper<InterimOrder> {

    @Override
    public InterimOrder mapRow(ResultSet rs, int rowNum) throws SQLException {
        InterimOrder interimOrder = new InterimOrder();
        interimOrder.setId(rs.getInt("id"));
        interimOrder.setCino(rs.getString("cino"));
        interimOrder.setSrNo(rs.getInt("sr_no"));

        java.sql.Date orderDate = rs.getDate("order_date");
        interimOrder.setOrderDate(orderDate != null ? orderDate.toLocalDate() : LocalDate.parse(""));

        interimOrder.setOrderNo(rs.getInt("order_no"));
        interimOrder.setOrderDetails(rs.getBytes("order_details"));
        interimOrder.setOrderType(rs.getString("order_type"));
        interimOrder.setDocType(rs.getInt("doc_type"));
        interimOrder.setJoCode(rs.getString("jocode"));
        interimOrder.setDispReason(rs.getInt("disp_reason"));
        interimOrder.setCourtNo(rs.getInt("court_no"));
        interimOrder.setJudgeCode(rs.getInt("judge_code"));
        interimOrder.setDesigCode(rs.getInt("desig_code"));
        interimOrder.setCourtOrderNumber(rs.getString("order_number"));
        return interimOrder;
    }
}
