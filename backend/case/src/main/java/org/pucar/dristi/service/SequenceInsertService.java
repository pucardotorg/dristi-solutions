package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.repository.CaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
public class SequenceInsertService {

    @Autowired
    private CaseRepository caseRepository;

    // Cron job to insert sequence 0 at midnight on 31st December every year
    @Scheduled(cron = "0 0 0 31 12 *")
    @Transactional
    public void insertNewYearSequence() {
        String newSeqNum = "000000";
        caseRepository.insertSeqNum(UUID.randomUUID(), "", "", newSeqNum, "");
        log.info("Inserted sequence 0 for the new year.");
    }
}
