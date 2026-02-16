package org.pucar.dristi.config;

import lombok.Getter;
import lombok.Setter;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component
@Import({TracerConfiguration.class})
@Setter
@Getter
public class Configuration {

    @Value("${egov.kafka.template.save.topic}")
    private String saveTemplateConfigurationKafkaTopic;

    @Value("${egov.kafka.template.update.topic}")
    private String updateTemplateConfigurationKafkaTopic;

}
