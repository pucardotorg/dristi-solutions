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
                    "sr_no AS srNo, " +
                    "order_date AS orderDate, " +
                    "order_no AS orderNo, " +
                    "order_details AS orderDetails " +
                    "FROM interim_order";

    public String getInterimOrderQuery(){
        return ORDER_QUERY + " WHERE cino = ?  ORDER BY order_no DESC";
    }

    public String getInsertInterimOrderQuery() {
        return "INSERT INTO interim_order (id, cino, sr_no, order_date, order_no, order_details) VALUES (?, ?, ?, ?, ?, ?)";
    }
}
