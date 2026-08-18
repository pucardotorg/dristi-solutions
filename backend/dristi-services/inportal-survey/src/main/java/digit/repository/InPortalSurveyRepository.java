package digit.repository;

import digit.repository.querybuilder.SurveyTrackerQueryBuilder;
import digit.repository.rowmapper.SurveyTrackerRowMapper;
import digit.web.models.EligibilityRequest;
import digit.web.models.SurveyTracker;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.SURVEY_TRACKER_SEARCH_EXCEPTION;

@Repository
@Slf4j
public class InPortalSurveyRepository {

    private final JdbcTemplate jdbcTemplate;
    private final SurveyTrackerQueryBuilder queryBuilder;
    private final SurveyTrackerRowMapper rowMapper;

    @Autowired
    public InPortalSurveyRepository(JdbcTemplate jdbcTemplate, SurveyTrackerQueryBuilder queryBuilder, SurveyTrackerRowMapper rowMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.queryBuilder = queryBuilder;
        this.rowMapper = rowMapper;
    }

    public List<SurveyTracker> getSurveyTracker(RequestInfo requestInfo) {

        String userUuid = requestInfo.getUserInfo().getUuid();

        log.info("operation = getSurveyTracker, result = IN_PROGRESS, userUuid : {} ", userUuid);

        try {
            List<Object> preparedStmtList = new ArrayList<>();
            List<Integer> preparedStmtArgList = new ArrayList<>();

            String query = queryBuilder.getSurveyTrackerQuery(userUuid, preparedStmtList, preparedStmtArgList);
            log.info("Survey Tracker query : {} ", query);

            return jdbcTemplate.query(query, preparedStmtList.toArray(), preparedStmtArgList.stream().mapToInt(Integer::intValue).toArray(), rowMapper);

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching survey tracker for userUuid: {}", userUuid, e);
            throw new CustomException(SURVEY_TRACKER_SEARCH_EXCEPTION, "Error occurred while retrieving survey tracker data from the database");
        }
    }

}
