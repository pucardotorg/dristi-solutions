package digit.repository;

import digit.web.models.Pagination;
import digit.web.models.SampleEntity;
import digit.web.models.SampleEntitySearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
@Slf4j
public class SampleEntityRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public SampleEntityRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SampleEntity> getSampleEntities(SampleEntitySearchCriteria criteria, Pagination pagination) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = buildSearchQuery(criteria, preparedStmtList, pagination);
        
        log.info("Final search query: {}", query);
        
        return jdbcTemplate.query(query, preparedStmtList.toArray(), new SampleEntityRowMapper());
    }

    private String buildSearchQuery(SampleEntitySearchCriteria criteria, List<Object> preparedStmtList, Pagination pagination) {
        StringBuilder query = new StringBuilder("SELECT id, test_uuid FROM eg_sample_entity");
        
        List<String> whereConditions = new ArrayList<>();

        if (criteria.getId() != null) {
            whereConditions.add("id = ?");
            preparedStmtList.add(criteria.getId());
        }

        if (!CollectionUtils.isEmpty(criteria.getIds())) {
            String placeholders = String.join(",", criteria.getIds().stream().map(id -> "?").toList());
            whereConditions.add("id IN (" + placeholders + ")");
            preparedStmtList.addAll(criteria.getIds());
        }

        if (criteria.getTestUuid() != null) {
            whereConditions.add("test_uuid = ?");
            preparedStmtList.add(criteria.getTestUuid());
        }

        if (!whereConditions.isEmpty()) {
            query.append(" WHERE ").append(String.join(" AND ", whereConditions));
        }

        // Add pagination
        if (pagination != null) {
            if (pagination.getLimit() != null && pagination.getLimit() > 0) {
                query.append(" LIMIT ?");
                preparedStmtList.add(pagination.getLimit());
            }

            if (pagination.getOffSet() != null) {
                query.append(" OFFSET ?");
                preparedStmtList.add(pagination.getOffSet());
            }
        }

        return query.toString();
    }

    public Integer getCount(SampleEntitySearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        StringBuilder query = new StringBuilder("SELECT COUNT(*) FROM eg_sample_entity");
        
        List<String> whereConditions = new ArrayList<>();

        if (criteria.getId() != null) {
            whereConditions.add("id = ?");
            preparedStmtList.add(criteria.getId());
        }

        if (!CollectionUtils.isEmpty(criteria.getIds())) {
            String placeholders = String.join(",", criteria.getIds().stream().map(id -> "?").toList());
            whereConditions.add("id IN (" + placeholders + ")");
            preparedStmtList.addAll(criteria.getIds());
        }

        if (criteria.getTestUuid() != null) {
            whereConditions.add("test_uuid = ?");
            preparedStmtList.add(criteria.getTestUuid());
        }

        if (!whereConditions.isEmpty()) {
            query.append(" WHERE ").append(String.join(" AND ", whereConditions));
        }

        return jdbcTemplate.queryForObject(query.toString(), preparedStmtList.toArray(), Integer.class);
    }

    private static class SampleEntityRowMapper implements RowMapper<SampleEntity> {
        @Override
        public SampleEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
            return SampleEntity.builder()
                    .id((UUID) rs.getObject("id"))
                    .testUuid((UUID) rs.getObject("test_uuid"))
                    .build();
        }
    }
}
