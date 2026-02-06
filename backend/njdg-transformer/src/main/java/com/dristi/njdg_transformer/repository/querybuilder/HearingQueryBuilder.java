package com.dristi.njdg_transformer.repository.querybuilder;

import org.springframework.stereotype.Component;

@Component
public class HearingQueryBuilder {

    public static final String HEARING_QUERY = "SELECT " +
            "id as id," +
            "cino as cino," +
            "sr_no as sr_no," +
            "desg_name as desg_name," +
            "hearing_date as hearing_date," +
            "next_date as next_date," +
            "purpose_of_listing as purpose_of_listing," +
            "judge_code as judge_code, " +
            "jocode as jocode, " +
            "desg_code as desg_code, " +
            "hearing_id as hearing_id, " +
            "business as business, " +
            "court_no as court_no, " +
            "order_id as order_id " +
            "FROM case_hearings ";

    public String getHearingQuery(){
        return HEARING_QUERY + " WHERE cino = ? ORDER BY hearing_date ASC";
    }

    public String getHearingInsertQuery() {
        return "INSERT INTO case_hearings (cino, sr_no, desg_name, hearing_date, next_date, purpose_of_listing, judge_code, jocode, desg_code, hearing_id, business, court_no, order_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    }

    public String getHearingPurposeQuery() {
        return "SELECT purpose_code FROM purpose_code WHERE court_purpose_code = ?";
    }

    public String getHearingUpdateQuery() {
        return "UPDATE case_hearings SET desg_name = ?, hearing_date = ?, next_date = ?, purpose_of_listing = ?, judge_code = ?, jocode = ?, desg_code = ?, business = ?, court_no = ? WHERE cino = ? AND sr_no = ? ";
    }

    public String getHearingByOrderIdQuery() {
        return HEARING_QUERY + " WHERE order_id = ?";
    }
}
