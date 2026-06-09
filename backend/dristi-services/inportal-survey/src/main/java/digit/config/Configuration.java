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

    // MDMS Configuration
    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;

    @Value("${egov.mdms.survey.module.name}")
    private String mdmsSurveyModuleName;

    @Value("${egov.mdms.survey.master.name}")
    private String mdmsSurveyMasterName;

}
