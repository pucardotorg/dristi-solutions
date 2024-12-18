package org.pucar.dristi.evidence_enrichment.config;

import lombok.Getter;
import lombok.Setter;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component
@Import({ TracerConfiguration.class })
@Setter
@Getter
public class Configuration {

    @Value("${evidence.host}")
    private String evidenceHost;

    @Value("${evidence.search.endpoint}")
    private String evidenceSearchEndpoint;

    @Value("${evidence.kafka.update.withoutWorkflow.topic}")
    private String evidenceKafkaUpdateWithoutWorkflowTopic;
}
