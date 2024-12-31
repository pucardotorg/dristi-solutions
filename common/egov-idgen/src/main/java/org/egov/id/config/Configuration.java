package org.egov.id.config;

import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
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

    @Value("${dristi.kollam.court.id}")
    private String kollamCourtId;

    @Value("${sequence.advocate}")
    private String advocateSequence;

    @Value("${sequence.clerk}")
    private String clerkSequence;

    @Value("${sequence.filing}")
    private String filingSequence;

    @Value("${sequence.cnr}")
    private String cnrSequence;

    @Value("${sequence.court-case}")
    private String courtCaseSequence;

    @Value("${sequence.cmp}")
    private String cmpSequence;

    @Value("${schedule.cron.expression}")
    private String cronExpression;

    @Bean
    public String scheduleCronExpression() {
        return cronExpression;
    }
}
