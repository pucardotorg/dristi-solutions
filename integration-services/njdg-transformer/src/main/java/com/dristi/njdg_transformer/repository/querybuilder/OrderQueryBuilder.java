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
                    "order_details AS order_details, " +
                    "order_type AS order_type, " +
                    "doc_type AS doc_type, " +
                    "jocode AS jocode, " +
                    "disp_reason AS disp_reason, " +
                    "court_no AS court_no, " +
                    "judge_code AS judge_code, " +
                    "desig_code AS desig_code, " +
                    "order_number AS order_number " +
                    "FROM interim_orders";

    public String getInterimOrderQuery(){
        return ORDER_QUERY + " WHERE cino = ?  ORDER BY order_no ASC";
    }

    public String getInsertInterimOrderQuery() {
        return "INSERT INTO interim_orders (" +
                "cino, " +
                "sr_no, " +
                "order_date, " +
                "order_no, " +
                "order_details, " +
                "order_number, " +
                "order_type, " +
                "doc_type, " +
                "jocode, " +
                "disp_reason, " +
                "court_no, " +
                "judge_code, " +
                "desig_code" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    }
}
