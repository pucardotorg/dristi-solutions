package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.queryBuilder.CaseManagerQueryBuilder;
import org.pucar.dristi.repository.rowMapper.CaseSummaryRowMapper;
import org.pucar.dristi.repository.rowMapper.JudgementRowMapper;
import org.pucar.dristi.repository.rowMapper.StatuteSectionRowMapper;
import org.pucar.dristi.web.models.CaseRequest;
import org.pucar.dristi.web.models.CaseSummary;
import org.pucar.dristi.web.models.Order;
import org.pucar.dristi.web.models.StatuteSection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Repository
public class CaseSummaryRepository {

    private final CaseManagerQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final CaseSummaryRowMapper rowMapper;

    public CaseSummaryRepository(CaseManagerQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, CaseSummaryRowMapper rowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
    }

    public List<CaseSummary> getCaseSummary(CaseRequest caseRequest) {
        try {
            List<CaseSummary> caseSummaryList = new ArrayList<>();
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();
            String caseSummaryQuery = queryBuilder.getCaseSummaryQuery(caseRequest, preparedStmtList, preparedStmtArgList);
            caseSummaryQuery = queryBuilder.addOrderByQuery(caseSummaryQuery, caseRequest.getPagination());
            log.info("Final case summary query: {}", caseSummaryQuery);
            if (caseRequest.getPagination() != null) {
                Integer totalRecords = getTotalCountCaseSummary(caseSummaryQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                caseRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                caseSummaryQuery = queryBuilder.addPaginationQuery(caseSummaryQuery, caseRequest.getPagination(), preparedStmtList, preparedStmtArgList);
            }
            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException(CASE_SUMMARY_QUERY_EXCEPTION, ARGS_MISMATCH);
            }

            List<CaseSummary> list = jdbcTemplate.query(caseSummaryQuery, preparedStmtList.toArray(),preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),rowMapper);
            log.info("DB application list :: {}", list);
            if (list != null) {
                caseSummaryList.addAll(list);
            }

            return caseSummaryList;
        } catch (Exception e) {
            log.error(CASE_SUMMARY_FETCH_ERROR, e);
            throw new CustomException(CASE_SUMMARY_QUERY_EXCEPTION, CASE_SUMMARY_FETCH_ERROR);
        }
    }

    public Integer getTotalCountCaseSummary(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }
}
