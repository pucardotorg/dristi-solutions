package digit.repository.rowmapper;

import digit.web.models.SurveyTracker;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.ROW_MAPPER_EXCEPTION;

@Component
@Slf4j
public class SurveyTrackerRowMapper implements ResultSetExtractor<List<SurveyTracker>> {

    @Override
    public List<SurveyTracker> extractData(ResultSet rs) {
        List<SurveyTracker> surveyTrackers = new ArrayList<>();

        try {
            while (rs.next()) {
                Boolean remindMeLater = null;
                if (rs.getObject("remind_me_later") != null) {
                    remindMeLater = rs.getBoolean("remind_me_later");
                }

                SurveyTracker surveyTracker = SurveyTracker.builder()
                        .userUuid(rs.getString("user_uuid"))
                        .userType(rs.getString("user_type"))
                        .tenantId(rs.getString("tenant_id"))
                        .remindMeLater(remindMeLater)
                        .lastTriggeredDate(rs.getLong("last_triggered_date") == 0 ? null : rs.getLong("last_triggered_date"))
                        .attempts(rs.getInt("attempts"))
                        .auditDetails(AuditDetails.builder()
                                .createdBy(rs.getString("created_by"))
                                .lastModifiedBy(rs.getString("last_modified_by"))
                                .createdTime(rs.getLong("created_time"))
                                .lastModifiedTime(rs.getLong("last_modified_time"))
                                .build())
                        .build();
                surveyTrackers.add(surveyTracker);
            }
            return surveyTrackers;

        } catch (Exception e) {
            log.error("Error occurred while processing SurveyTracker ResultSet: {}", e.getMessage());
            throw new CustomException(ROW_MAPPER_EXCEPTION, "Error occurred while processing SurveyTracker ResultSet: " + e.getMessage());
        }
    }
}
