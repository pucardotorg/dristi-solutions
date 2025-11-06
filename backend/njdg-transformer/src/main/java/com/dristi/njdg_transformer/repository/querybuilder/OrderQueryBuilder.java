package com.dristi.njdg_transformer.repository.querybuilder;


import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OrderQueryBuilder {

    public static final String ORDER_QUERY =
            "SELECT " +
                    "id AS id, " +
                    "cino AS cino, " +
                    "sr_no AS sr_no, " +
                    "order_date AS order_date, " +
                    "order_no AS order_no, " +
                    "order_details AS order_details " +
                    "FROM interim_orders ";

    public String getInterimOrderQuery(){
        return ORDER_QUERY + " WHERE cino = ?  ORDER BY order_no ASC";
    }

    public String getInsertInterimOrderQuery() {
        return "INSERT INTO interim_orders (id, cino, sr_no, order_date, order_no, order_details, court_order_number, order_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    }
}
