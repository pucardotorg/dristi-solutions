package digit.repository;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import digit.repository.querybuilder.DigitalizedDocumentQueryBuilder;
import digit.repository.rowmapper.DigitalizedDocumentRowMapper;
import digit.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
public class DigitalizedDocumentRepository {

    private final DigitalizedDocumentQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;
    private final DigitalizedDocumentRowMapper rowMapper;

    @Autowired
    public DigitalizedDocumentRepository(DigitalizedDocumentQueryBuilder queryBuilder,
                                         JdbcTemplate jdbcTemplate,
                                         DigitalizedDocumentRowMapper rowMapper) {
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
        this.rowMapper = rowMapper;
    }

    public List<DigitalizedDocument> getDigitalizedDocuments(DigitalizedDocumentSearchCriteria criteria, Pagination pagination) {
        List<Object> preparedStatementList = new ArrayList<>();
        List<Integer> preparedStatementArgList = new ArrayList<>();

        String query = queryBuilder.getDigitalizedDocumentSearchQuery(criteria, preparedStatementList, preparedStatementArgList);

        query = queryBuilder.addOrderByQuery(query, pagination);

        if (pagination != null) {
            Integer totalCount = getDigitalizedDocumentCount(query, preparedStatementList);
            pagination.setTotalCount(Double.valueOf(totalCount));
            query = queryBuilder.addPaginationQuery(query, pagination, preparedStatementList, preparedStatementArgList);
        }
        log.info("Final query: {}", query);
        log.info("Prepared statement list: {}", preparedStatementList);

        try {
            return jdbcTemplate.query(query, preparedStatementList.toArray(), rowMapper);
        } catch (Exception e) {
            log.error("Error while executing digitalized document search query", e);
            throw new CustomException("DIGITALIZED_DOCUMENT_SEARCH_ERROR", "Error while searching digitalized documents: " + e.getMessage());
        }
    }

    public DigitalizedDocument getDigitalizedDocumentByDocumentNumber(String documentNumber, String tenantId) {
        DigitalizedDocumentSearchCriteria criteria = DigitalizedDocumentSearchCriteria.builder()
                .documentNumber(documentNumber)
                .tenantId(tenantId)
                .build();
        
        Pagination pagination = Pagination.builder()
                .limit(1.0)
                .offSet(0.0)
                .build();

        List<DigitalizedDocument> documents = getDigitalizedDocuments(criteria, pagination);
        
        if (documents.isEmpty()) {
            throw new CustomException("DIGITALIZED_DOCUMENT_NOT_FOUND", 
                    "No digitalized document found for documentNumber: " + documentNumber + " and tenantId: " + tenantId);
        }
        
        return documents.get(0);
    }

    public Integer getDigitalizedDocumentCount(String baseQuery, List<Object> preparedStmtList) {

        String query = queryBuilder.getTotalCountQuery(baseQuery);
        try {
            Integer count = jdbcTemplate.queryForObject(query, preparedStmtList.toArray(), Integer.class);
            log.info("Digitalized document count: {}", count);
            return count;
        } catch (Exception e) {
            log.error("Error while executing digitalized document count query", e);
            throw new CustomException("DIGITALIZED_DOCUMENT_COUNT_ERROR", "Error while counting digitalized documents: " + e.getMessage());
        }
    }
}
