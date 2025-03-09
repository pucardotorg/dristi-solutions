package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.model.EPostResponse;
import org.pucar.dristi.model.EPostTracker;
import org.pucar.dristi.model.EPostTrackerSearchCriteria;
import org.pucar.dristi.model.Pagination;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
public class EPostRepository {

    private final JdbcTemplate jdbcTemplate;

    private final EPostQueryBuilder queryBuilder;

    private final EPostRowMapper rowMapper;

    private final EPostConfiguration configuration;

    @Autowired
    public EPostRepository(JdbcTemplate jdbcTemplate, EPostQueryBuilder queryBuilder, EPostRowMapper rowMapper, EPostConfiguration configuration) {
        this.jdbcTemplate = jdbcTemplate;
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
        this.configuration = configuration;
    }

    public EPostResponse getEPostTrackerResponse(EPostTrackerSearchCriteria searchCriteria,int limit, int offset){
        List<EPostTracker> ePostTrackerList = new ArrayList<>();
        Pagination pagination = searchCriteria.getPagination();
        pagination.setTotalCount(0);
        // used to update
        boolean isScriptToUpdatePostalHub = configuration.isScriptToUpdatePostalHub();
        if (searchCriteria.getPostalHub() != null || isScriptToUpdatePostalHub) {
            List<EPostTracker> ePostTrackers = getEPostTrackerList(searchCriteria, limit, offset);
            ePostTrackerList.addAll(ePostTrackers);
            Integer totalRecords = getTotalCountQuery(searchCriteria);
            pagination.setTotalCount(totalRecords);
        }
        return EPostResponse.builder().ePostTrackers(ePostTrackerList).pagination(pagination).build();
    }

    public List<EPostTracker> getEPostTrackerList(EPostTrackerSearchCriteria searchCriteria,int limit, int offset){
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getEPostTrackerSearchQuery(searchCriteria, preparedStmtList);
        query = queryBuilder.addPaginationQuery(query, preparedStmtList, searchCriteria.getPagination(),limit,offset);
        log.info("Final query: " + query);
        return jdbcTemplate.query(query,rowMapper,preparedStmtList.toArray());
    }

    public Integer getTotalCountQuery(EPostTrackerSearchCriteria searchCriteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getEPostTrackerSearchQuery(searchCriteria, preparedStmtList);
        String countQuery = queryBuilder.getTotalCountQuery(query);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }
}
