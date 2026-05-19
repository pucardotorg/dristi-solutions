package org.pucar.dristi.kafka;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.service.CaseBundleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class Consumer {

    private final CaseBundleService caseBundleService;
    private final Configuration configuration;

    @Autowired
    public Consumer(CaseBundleService caseBundleService, Configuration configuration) {
        this.caseBundleService = caseBundleService;
        this.configuration = configuration;
    }

    @KafkaListener(topics = {"${mdms.kafka.save.topic}", "${mdms.kafka.update.topic}"})
    public void listenMdmsDataEvents(final HashMap<String, Object> record) {
        try {
            Object mdmsObj = record.get("Mdms");
            if (!(mdmsObj instanceof Map)) {
                return;
            }
            String schemaCode = (String) ((Map<?, ?>) mdmsObj).get("schemaCode");
            if (configuration.getStateMasterSchema().equals(schemaCode)
                    || configuration.getCaseBundleSectionOrderSchema().equals(schemaCode)) {
                log.info("MDMS data change detected for schemaCode: {}. Updating contentLastModified for all case bundles.", schemaCode);
                caseBundleService.updateContentLastModifiedForAllBundles();
            }
        } catch (Exception e) {
            log.error("Error processing MDMS data event for case bundle invalidation", e);
        }
    }
}
