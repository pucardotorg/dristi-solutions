package digit.config;

import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component
@Data
@Import({TracerConfiguration.class})
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Configuration {

    @Value("${create.survey.tracker.topic}")
    private String createSurveyTrackerTopic;

    @Value("${update.survey.tracker.topic}")
    private String updateSurveyTrackerTopic;

    @Value("${update.expiry.date.topic}")
    private String updateExpiryDateTopic;

    @Value("${create.feed.back.topic}")
    private String createFeedBackTopic;

    @Value("${max.no.of.attempts}")
    private Integer maxNoOfAttempts;

    @Value("${no.of.days.for.remind.me.later}")
    private Long noOfDaysForRemindMeLater;

    @Value("${no.of.days.for.expiry.after.feed.back}")
    private Long noOfDaysForExpiryAfterFeedBack;

}
