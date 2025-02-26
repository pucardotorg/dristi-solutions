package digit.repository;


import digit.repository.querybuilder.HearingQueryBuilder;
import digit.repository.rowmapper.AvailabilityRowMapper;
import digit.repository.rowmapper.HearingRowMapper;
import digit.web.models.AvailabilityDTO;
import digit.web.models.ScheduleHearing;
import digit.web.models.ScheduleHearingSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class HearingRepository {

    private final HearingQueryBuilder queryBuilder;
    private final HearingRowMapper rowMapper;
    private final JdbcTemplate jdbcTemplate;
    private final AvailabilityRowMapper availabilityRowMapper;

    @Autowired
    public HearingRepository(HearingQueryBuilder queryBuilder, HearingRowMapper rowMapper, JdbcTemplate jdbcTemplate, AvailabilityRowMapper availabilityRowMapper) {
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.availabilityRowMapper = availabilityRowMapper;
    }

    public List<ScheduleHearing> getHearings(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria, Integer limit, Integer offset) {

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getHearingQuery(scheduleHearingSearchCriteria, preparedStmtList, limit, offset);
        log.debug("Final query: " + query);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);

    }

    public List<AvailabilityDTO> getAvailableDatesOfJudges(ScheduleHearingSearchCriteria scheduleHearingSearchCriteria) {

        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getJudgeAvailableDatesQuery(scheduleHearingSearchCriteria, preparedStmtList);
        log.debug("Final query: " + query);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), availabilityRowMapper);

    }


}
