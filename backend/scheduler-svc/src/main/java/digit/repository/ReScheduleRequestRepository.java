package digit.repository;

import digit.repository.querybuilder.ReScheduleHearingQueryBuilder;
import digit.repository.rowmapper.ReScheduleHearingRowMapper;
import digit.web.models.ReScheduleHearing;
import digit.web.models.ReScheduleHearingReqSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class ReScheduleRequestRepository {

    private final ReScheduleHearingRowMapper rowMapper;
    private final ReScheduleHearingQueryBuilder queryBuilder;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ReScheduleRequestRepository(ReScheduleHearingRowMapper rowMapper, ReScheduleHearingQueryBuilder queryBuilder, JdbcTemplate jdbcTemplate) {
        this.rowMapper = rowMapper;
        this.queryBuilder = queryBuilder;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ReScheduleHearing> getReScheduleRequest(ReScheduleHearingReqSearchCriteria criteria, Integer limit, Integer offset) {

        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgList = new ArrayList<>();
        String query = queryBuilder.getReScheduleRequestQuery(criteria, preparedStmtList, preparedStmtArgList, limit, offset);
        log.debug("Final query for reScheduleRequest: " + query);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);


    }
}
