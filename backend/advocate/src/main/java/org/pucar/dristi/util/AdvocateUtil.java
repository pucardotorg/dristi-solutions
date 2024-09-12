package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.repository.AdvocateClerkRepository;
import org.pucar.dristi.repository.AdvocateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.UUID;


@Component
@Slf4j
public class AdvocateUtil {
    private static final String CHARACTERS = "0123456789";
    private static final SecureRandom random = new SecureRandom();

    @Autowired
    private AdvocateRepository advocateRepository;

    @Autowired
    private AdvocateClerkRepository advocateClerkRepository;

    public String generateAdvocateApplicationNumber(String tenantId, String userID, String seqLabel) {
        //Searching last inserted filing seq number
        String seqNum = advocateRepository.searchSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting filing number seq to 000001 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 000001 for 1st entry in the table for filing number.");
            newSqNum = "000001";
            advocateRepository.insertSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            //Incrementing the existing filing seq by 1 and inserting the 6 digit padded seq in the table
            log.info("Incrementing the existing filing seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            newSqNum = String.format("%06d", Integer.parseInt(newSqNum));
            advocateRepository.insertSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        return STATE + "-" + newSqNum + "-" + LocalDate.now().getYear();
    }

    public String generateClerkApplicationNumber(String tenantId, String userID, String seqLabel) {
        //Searching last inserted cmp seq num
        String seqNum = advocateClerkRepository.searchSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting cmp seq number to 1 if no sequence number is present in the table
        if(seqNum == null){

            log.info("Inserting 1 for 1st entry in the table for cmp number.");
            newSqNum = "1";
            advocateClerkRepository.insertSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            log.info("Incrementing the existing cmp seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            advocateClerkRepository.insertSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        return CMP + "/" + newSqNum + "/" + LocalDate.now().getYear();
    }
}