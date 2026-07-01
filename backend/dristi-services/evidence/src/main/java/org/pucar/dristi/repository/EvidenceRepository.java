package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.querybuilder.EvidenceQueryBuilder;
import org.pucar.dristi.repository.rowmapper.*;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.EvidenceSearchCriteria;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.EVIDENCE_SEARCH_QUERY_EXCEPTION;
import static org.pucar.dristi.config.ServiceConstants.PENDING_E_SIGN;

@Slf4j
@Repository
public class    EvidenceRepository {

    private final EvidenceQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final EvidenceRowMapper evidenceRowMapper;

    @Autowired
    public EvidenceRepository(
            EvidenceQueryBuilder queryBuilder,
            JdbcTemplate jdbcTemplate,
            EvidenceRowMapper evidenceRowMapper

    ) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.evidenceRowMapper = evidenceRowMapper;
    }

    public List<Artifact> getArtifacts(EvidenceSearchCriteria evidenceSearchCriteria, Pagination pagination) {
        try {
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            // Artifact query building
            String artifactQuery = queryBuilder.getArtifactSearchQuery(preparedStmtList,preparedStmtArgList,evidenceSearchCriteria);
            if(evidenceSearchCriteria.getIsCourtEmployee()){
                List<String> statusList = List.of(PENDING_E_SIGN);
                String courtEmployeeQuery = queryBuilder.getEmployeeQuery(statusList, evidenceSearchCriteria, preparedStmtList, preparedStmtArgList);
                artifactQuery += courtEmployeeQuery;
            }
            if(evidenceSearchCriteria.getIsCitizen()){
                List<String> statusList = List.of(PENDING_E_SIGN);
                String citizenQuery = queryBuilder.getCitizenQuery(statusList, evidenceSearchCriteria, preparedStmtList, preparedStmtArgList);
                artifactQuery += citizenQuery;
            }
            artifactQuery = queryBuilder.addOrderByQuery(artifactQuery, pagination);
            log.info("Final artifact query: {}", artifactQuery);

            if (pagination != null) {
                Integer totalRecords = getTotalCountArtifact(artifactQuery, preparedStmtList);
                log.info("Total count without pagination :: {}", totalRecords);
                pagination.setTotalCount(Double.valueOf(totalRecords));
                artifactQuery = queryBuilder.addPaginationQuery(artifactQuery, pagination, preparedStmtList,preparedStmtArgList);
            }

            if(preparedStmtList.size()!=preparedStmtArgList.size()){
                log.info("Arg size :: {}, and ArgType size :: {}", preparedStmtList.size(),preparedStmtArgList.size());
                throw new CustomException(EVIDENCE_SEARCH_QUERY_EXCEPTION, "Arg and ArgType size mismatch");
            }
            List<Artifact> artifactList = jdbcTemplate.query(artifactQuery, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(),evidenceRowMapper);
            log.info("DB artifact list :: {}", artifactList);

            // Fetch associated comments
            List<String> artifactIds = new ArrayList<>();
            for (Artifact artifact : artifactList) {
                artifactIds.add(artifact.getId().toString());
            }
            if (artifactIds.isEmpty()) {
                return artifactList;
            }

            return artifactList;
        } catch (CustomException e) {
            log.error("Custom Exception while fetching artifact list");
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching artifact list");
            throw new CustomException("ARTIFACT_SEARCH_EXCEPTION", "Error while fetching artifact list: " + e.toString());
        }
    }


    public Integer getTotalCountArtifact(String baseQuery, List<Object> preparedStmtList) {
        String countQuery = queryBuilder.getTotalCountQuery(baseQuery);
        log.info("Final count query :: {}", countQuery);
        return jdbcTemplate.queryForObject(countQuery, Integer.class, preparedStmtList.toArray());
    }

    /**
     * Fetches the next sequence value for the given sequence name without incrementing it.
     * This method gets the next value without consuming/incrementing the sequence.
     * 
     * @param sequenceName the name of the sequence
     * @return the next sequence value or 1 if sequence doesn't exist
     */
    public Integer getNextValForSequence(String sequenceName) {
        try {
            log.info("Getting next sequence value for sequence: {}", sequenceName);
            
            String sql = "SELECT last_value + 1 FROM " + sequenceName;
            Integer nextValue = jdbcTemplate.queryForObject(sql, Integer.class);
            log.info("Next sequence value for {}: {}", sequenceName, nextValue);
            return nextValue;

        } catch (Exception e) {
            log.error("Error getting sequence value for {}: {}", sequenceName, e.getMessage());
            log.warn("Returning default value 1 due to error or sequence not found");
            return 1;
        }
    }
}
