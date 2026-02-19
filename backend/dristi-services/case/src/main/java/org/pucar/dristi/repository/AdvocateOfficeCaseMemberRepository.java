package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.repository.querybuilder.AdvocateOfficeCaseMemberQueryBuilder;
import org.pucar.dristi.repository.rowmapper.CaseMemberInfoRowMapper;
import org.pucar.dristi.web.models.AdvocateCaseInfo;
import org.pucar.dristi.web.models.Pagination;
import org.pucar.dristi.web.models.advocateofficemember.CaseMemberInfo;
import org.pucar.dristi.web.models.advocateofficemember.CaseMemberSearchCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class AdvocateOfficeCaseMemberRepository {

    private final JdbcTemplate jdbcTemplate;
    private final AdvocateOfficeCaseMemberQueryBuilder queryBuilder;
    private final CaseMemberInfoRowMapper caseMemberInfoRowMapper;

    @Autowired
    public AdvocateOfficeCaseMemberRepository(JdbcTemplate jdbcTemplate,
                                              AdvocateOfficeCaseMemberQueryBuilder queryBuilder,
                                              CaseMemberInfoRowMapper caseMemberInfoRowMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.queryBuilder = queryBuilder;
        this.caseMemberInfoRowMapper = caseMemberInfoRowMapper;
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

    public List<String> getAdvocateUuidsByMemberAndCase(String memberUserUuid, String caseId) {
        String query = "SELECT DISTINCT office_advocate_user_uuid " +
                       "FROM dristi_advocate_office_case_member " +
                       "WHERE member_user_uuid = ? AND case_id = ? AND is_active = true " +
                       "AND office_advocate_user_uuid IS NOT NULL";

        try {
            return jdbcTemplate.queryForList(query, String.class, memberUserUuid, caseId);
        } catch (Exception e) {
            log.error("Error fetching advocate UUIDs for member: {} and case: {}", memberUserUuid, caseId, e);
            return new ArrayList<>();
        }
    }

    public List<CaseMemberInfo> searchCaseMembers(CaseMemberSearchCriteria criteria,
                                                  Pagination pagination) {
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        try {
            String query = queryBuilder.getCaseMembersSearchQuery(criteria, preparedStmtList, preparedStmtArgList);
            query = queryBuilder.addOrderByQuery(query, pagination);

            if (pagination != null) {
                query = queryBuilder.addPaginationQuery(query, preparedStmtList, pagination, preparedStmtArgList);
            }

            return jdbcTemplate.query(query,
                    preparedStmtList.toArray(),
                    preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),
                    caseMemberInfoRowMapper);
        } catch (Exception e) {
            log.error("Error searching case members for officeAdvocateUserUuid: {} and memberUserUuid: {}",
                    criteria.getOfficeAdvocateUserUuid(), criteria.getMemberUserUuid(), e);
            return new ArrayList<>();
        }
    }

    public Integer getCaseMembersTotalCount(CaseMemberSearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();

        try {
            String baseQuery = queryBuilder.getCaseMembersSearchQuery(criteria, preparedStmtList, preparedStmtArgList);
            String countQuery = queryBuilder.getTotalCountQuery(baseQuery);

            return jdbcTemplate.queryForObject(countQuery,
                    preparedStmtList.toArray(),
                    preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),
                    Integer.class);
        } catch (Exception e) {
            log.error("Error getting total count for officeAdvocateUserUuid: {} and memberUserUuid: {}",
                    criteria.getOfficeAdvocateUserUuid(), criteria.getMemberUserUuid(), e);
            return 0;
        }
    }

}
