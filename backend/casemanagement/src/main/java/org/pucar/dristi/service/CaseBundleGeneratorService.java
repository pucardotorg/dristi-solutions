package org.pucar.dristi.service;


import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.HashMap;

@Service
public class CaseBundleGeneratorService {

    @KafkaListener(topics = {"casemanagement.kafka.bundle.create.topic"})
    public void listen(final HashMap<String, Object> record) {

        //TODO

    }

}
