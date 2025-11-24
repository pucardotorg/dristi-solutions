package digit.repository.querybuilder;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class SurveyTrackerQueryBuilder {

    private static final String BASE_QUERY = "SELECT user_uuid, user_type, tenant_id, remind_me_later, last_triggered_date, attempts, created_by, last_modified_by, created_time, last_modified_time ";

    public static final String FROM_INPORTAL_SURVEY_TRACKER_TABLE = "FROM inportal_survey_tracker";

    public String getSurveyTrackerQuery(String userUuid, List<Object> preparedStmtList, List<Integer> preparedStmtArgList) {
        StringBuilder query = new StringBuilder(BASE_QUERY);
        query.append(FROM_INPORTAL_SURVEY_TRACKER_TABLE);

        if (userUuid != null && !userUuid.isEmpty()) {
            query.append(" WHERE user_uuid = ?");
            preparedStmtList.add(userUuid);
            preparedStmtArgList.add(1);
        }

        log.info("Survey Tracker Query: {}", query);
        return query.toString();
    }
}
