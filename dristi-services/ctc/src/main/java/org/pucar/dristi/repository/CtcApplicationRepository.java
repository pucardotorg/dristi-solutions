package org.pucar.dristi.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.querybuilder.CtcApplicationQueryBuilder;
import org.pucar.dristi.repository.rowmapper.*;
import org.pucar.dristi.web.models.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.*;


@Slf4j
@Repository
public class CtcApplicationRepository {

    private final CtcApplicationQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final CtcApplicationRowMapper rowMapper;
    private final ObjectMapper objectMapper;

    public CtcApplicationRepository(CtcApplicationQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate, CtcApplicationRowMapper rowMapper, ObjectMapper objectMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
        this.objectMapper = objectMapper;
    }

    public List<CtcApplication> getCtcApplication(CtcApplicationSearchRequest ctcApplicationSearchRequest) {

        try {
            CtcApplicationSearchCriteria searchCriteria = ctcApplicationSearchRequest.getCriteria();

            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String ctcQuery = "";
            ctcQuery = queryBuilder.getCtcApplicationsQuery(searchCriteria, preparedStmtList, preparedStmtArgList);
            ctcQuery = queryBuilder.addOrderByQuery(ctcQuery, ctcApplicationSearchRequest.getPagination());
            if (ctcApplicationSearchRequest.getPagination() != null) {
                Integer totalRecords = getTotalCount(ctcQuery, preparedStmtList);
                ctcApplicationSearchRequest.getPagination().setTotalCount(Double.valueOf(totalRecords));
                ctcQuery = queryBuilder.addPaginationQuery(ctcQuery, preparedStmtList, ctcApplicationSearchRequest.getPagination(), preparedStmtArgList);
            }
            if (preparedStmtList.size() != preparedStmtArgList.size()) {
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(), preparedStmtArgList.size());
                throw new CustomException("CTC_SEARCH_QUERY_EXCEPTION", "Arg and ArgType size mismatch ");
            }
            log.info("Final ctc application query :: {}", ctcQuery);

            List<CtcApplication> ctcApplications = jdbcTemplate.query(ctcQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);
            if (ctcApplications != null && !ctcApplications.isEmpty()) {
                log.info("Case list size :: {}", ctcApplications.size());
            } else {
                return new ArrayList<>();
            }

            return ctcApplications;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching ctc application list :: {}", e.toString());
            throw new CustomException("SEARCH_CTC_ERR", "Exception while fetching ctc application list: " + e.getMessage());
        }
    }

    public Integer getTotalCount(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, preparedStmtList.toArray(), Integer.class);
    }
}
