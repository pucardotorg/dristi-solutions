package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class AdvocateOfficeCaseMemberRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public AdvocateOfficeCaseMemberRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<String> getCaseIdsByAdvocateId(String advocateId) {
        String query = "SELECT DISTINCT case_id FROM dristi_case_representatives WHERE advocateId = ? AND isactive = true";

        try {
            return jdbcTemplate.queryForList(query, String.class, advocateId);
        } catch (Exception e) {
            log.error("Error fetching case IDs for advocate: {}", advocateId, e);
            return new ArrayList<>();
        }
    }

}
