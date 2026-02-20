package digit.repository;


import digit.repository.querybuilder.RescheduleRequestOptOutQueryBuilder;
import digit.repository.rowmapper.RescheduleRequestOptOutRowMapper;
import digit.web.models.OptOut;
import digit.web.models.OptOutSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@Slf4j
public class RescheduleRequestOptOutRepository {

    private final RescheduleRequestOptOutRowMapper rescheduleRequestOptOutRowMapper;
    private final RescheduleRequestOptOutQueryBuilder optOutQueryBuilder;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public RescheduleRequestOptOutRepository(RescheduleRequestOptOutRowMapper rescheduleRequestOptOutRowMapper, RescheduleRequestOptOutQueryBuilder optOutQueryBuilder, JdbcTemplate jdbcTemplate) {
        this.rescheduleRequestOptOutRowMapper = rescheduleRequestOptOutRowMapper;
        this.optOutQueryBuilder = optOutQueryBuilder;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OptOut> getOptOut(OptOutSearchCriteria optOutSearchCriteria, Integer limit, Integer offset) {

        List<Object> preparedStmtList = new ArrayList<>();
        String query = optOutQueryBuilder.getOptOutQuery(optOutSearchCriteria, preparedStmtList, limit, offset);
        log.debug("Final query: " + query);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), rescheduleRequestOptOutRowMapper);
    }
}
