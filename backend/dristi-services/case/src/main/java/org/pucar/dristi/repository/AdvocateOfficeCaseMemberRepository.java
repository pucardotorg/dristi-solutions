package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.AdvocateCaseInfo;
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

    public List<AdvocateCaseInfo> getCasesByAdvocateId(String advocateId) {
        String query = "SELECT DISTINCT c.id as case_id, c.filingnumber as filing_number " +
                       "FROM dristi_cases c " +
                       "INNER JOIN dristi_case_representatives dcr ON c.id = dcr.case_id " +
                       "WHERE dcr.advocateId = ? AND dcr.isactive = true";

        try {
            return jdbcTemplate.query(query, (rs, rowNum) -> 
                AdvocateCaseInfo.builder()
                    .caseId(rs.getString("case_id"))
                    .filingNumber(rs.getString("filing_number"))
                    .build(),
                advocateId
            );
        } catch (Exception e) {
            log.error("Error fetching case info for advocate: {}", advocateId, e);
            return new ArrayList<>();
        }
    }

}
