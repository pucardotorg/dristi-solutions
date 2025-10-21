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
            "jo_code as jo_code, " +
            "desg_code as desg_code " +
            "FROM case_hearings ";

    public String getHearingQuery(String cino){
        return HEARING_QUERY + " WHERE cino = ? ORDER BY hearing_date ASC";
    }

    public String getHearingInsertQuery() {
        return "INSERT INTO case_hearings (id, cino, sr_no, desg_name, hearing_date, next_date, purpose_of_listing, judge_code, jo_code, desg_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    }

    public String getHearingPurposeQuery() {
        return "SELECT purpose_code FROM purpose_code WHERE court_purpose_code = ?";
    }
}
