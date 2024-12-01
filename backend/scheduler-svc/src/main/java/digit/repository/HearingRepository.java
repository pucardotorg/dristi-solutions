package digit.repository;


import digit.repository.querybuilder.HearingQueryBuilder;
import digit.repository.rowmapper.AvailabilityRowMapper;
import digit.repository.rowmapper.HearingRowMapper;
import digit.repository.rowmapper.RowMapperHearing;
import digit.util.DateUtil;
import digit.web.models.AvailabilityDTO;
import digit.web.models.HearingCauseList;
import digit.web.models.ScheduleHearingSearchCriteria;
import digit.web.models.ScheduleHearing;
import digit.web.models.hearing.Hearing;
import digit.web.models.hearing.HearingSearchCriteria;
import lombok.extern.slf4j.Slf4j;
import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Repository
public class HearingRepository {
    @Autowired
    private HearingQueryBuilder queryBuilder;

    @Autowired
    private HearingRowMapper rowMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AvailabilityRowMapper availabilityRowMapper;

    @Autowired
    private RowMapperHearing hearingRowMapper;

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
        return jdbcTemplate.query(query, preparedStmtList.toArray(),availabilityRowMapper);

    }

    public List<HearingCauseList> getHearingsFromHearingTable(HearingSearchCriteria hearingSearchCriteria){
        List<Object> preparedStmtList = new ArrayList<>();
        List<Integer> preparedStmtArgsList = new ArrayList<>();
        String query = queryBuilder.getHearingsQuery(hearingSearchCriteria, preparedStmtList, preparedStmtArgsList);
        log.debug("Final query: " + query);
        return jdbcTemplate.query(query, preparedStmtList.toArray(), preparedStmtArgsList.stream().mapToInt(Integer::intValue).toArray(), hearingRowMapper);
    }
}
