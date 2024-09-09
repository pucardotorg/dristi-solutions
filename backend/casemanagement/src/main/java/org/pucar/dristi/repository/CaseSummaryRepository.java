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
import java.util.Map;
import java.util.UUID;

@Slf4j
@Repository
public class CaseSummaryRepository {

    private final CaseManagerQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final CaseSummaryRowMapper rowMapper;
    private final JudgementRowMapper judgementRowMapper;
    private final StatuteSectionRowMapper statuteSectionRowMapper;

    public CaseSummaryRepository(CaseManagerQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, CaseSummaryRowMapper rowMapper, JudgementRowMapper judgementRowMapper, StatuteSectionRowMapper statuteSectionRowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
        this.judgementRowMapper = judgementRowMapper;
        this.statuteSectionRowMapper = statuteSectionRowMapper;
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
                throw new CustomException("CASE_SUMMARY_QUERY_EXCEPTION", "Arg and ArgType size mismatch");
            }

            List<CaseSummary> list = jdbcTemplate.query(caseSummaryQuery, preparedStmtList.toArray(),preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),rowMapper);
            log.info("DB application list :: {}", list);
            if (list != null) {
                caseSummaryList.addAll(list);
            }

            String filingNumber = caseRequest.getFilingNumber();
            setJudgement(caseSummaryList,filingNumber);
            String caseId = caseRequest.getCaseId();
            setStatuteAndSections(caseSummaryList,caseId);
            return caseSummaryList;
        } catch (Exception e) {
            log.error("Error occurred while fetching case summary {}", e.getMessage());
            throw new CustomException("CASE_SUMMARY_QUERY_EXCEPTION", "Error occurred while fetching case summary");
        }
    }

    public Integer getTotalCountCaseSummary(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

    private void setJudgement(List<CaseSummary> caseSummaryList, String filingNumber) {
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String judgementQuery = queryBuilder.getJudgementQuery(filingNumber, preparedStmtList, preparedStmtArgList);
        log.info("Final judgement query: {}", judgementQuery);
        List<Order> orderList = jdbcTemplate.query(judgementQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),judgementRowMapper);
        log.info("Judgement list :: {}", orderList);
        if (orderList != null) {
            caseSummaryList.forEach(caseSummary -> {
                caseSummary.setJudgement(orderList.get(0));
            });
        }
    }

    private void setStatuteAndSections(List<CaseSummary> caseSummaryList,String caseId) {
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String statuteSectionQuery = queryBuilder.getStatuteSectionQuery(caseId, preparedStmtList, preparedStmtArgList);
        log.info("Final statute section query: {}", statuteSectionQuery);
        List<StatuteSection> statuteSectionMap = jdbcTemplate.query(statuteSectionQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),statuteSectionRowMapper);
        if (statuteSectionMap != null) {
            caseSummaryList.forEach(caseSummary -> {
                caseSummary.setStatutesAndSections(statuteSectionMap);
            });
        }
    }
}
