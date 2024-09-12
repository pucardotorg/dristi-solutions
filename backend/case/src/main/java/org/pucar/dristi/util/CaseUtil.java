package org.pucar.dristi.util;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.repository.CaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class CaseUtil {
    private static final String CHARACTERS = "0123456789";
    private static final SecureRandom random = new SecureRandom();

    @Autowired
    private CaseRepository caseRepository;

    public static String generateAccessCode(int length) {
        StringBuilder sb = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            int randomIndex = random.nextInt(CHARACTERS.length());
            char randomChar = CHARACTERS.charAt(randomIndex);
            sb.append(randomChar);
        }

        return sb.toString();
    }

    public Long getCurrentTimeMil() {
        return System.currentTimeMillis();
    }

    public String generateCNRNumber(String tenantId, String userID) {
        //Searching last inserted cnr seq number
        String seqNum = caseRepository.searchCNRSeqNum(tenantId, COURTID);
        String newSqNum;

        //setting cnr_seq_number to 000001 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 000001 for 1st entry in the table");
            newSqNum = "000001";
            caseRepository.insertCNRSeqNum(UUID.randomUUID(), tenantId, COURTID, newSqNum, userID);
        }else {
            //Incrementing the existing cnr seq number by 1 and inserting the 6 digit padded seq in the table
            log.info("Incrementing the existing seq number and inserting in the table");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            newSqNum = String.format("%06d", Integer.parseInt(newSqNum));
            caseRepository.insertCNRSeqNum(UUID.randomUUID(), tenantId, COURTID, newSqNum, userID);
        }
        return COURTID + newSqNum + LocalDate.now().getYear();
    }

    public String generateFilingNumber(String tenantId, String userID, String seqLabel) {
        //Searching last inserted filing seq number
        String seqNum = caseRepository.searchCaseSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting filing number seq to 000001 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 000001 for 1st entry in the table for filing number.");
            newSqNum = "000001";
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            //Incrementing the existing filing seq by 1 and inserting the 6 digit padded seq in the table
            log.info("Incrementing the existing filing seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            newSqNum = String.format("%06d", Integer.parseInt(newSqNum));
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        return STATE + "-" + newSqNum + "-" + LocalDate.now().getYear();
    }

    public String generateCMPNumber(String tenantId, String userID, String seqLabel) {
        //Searching last inserted cmp seq num
        String seqNum = caseRepository.searchCaseSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting cmp seq number to 1 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 1 for 1st entry in the table for cmp number.");
            newSqNum = "1";
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            log.info("Incrementing the existing cmp seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        return CMP + "/" + newSqNum + "/" + LocalDate.now().getYear();
    }

    public String generateCourtCaseNumber(String tenantId, String userID, String seqLabel) {
        //Searching last inserted cmp seq num
        String seqNum = caseRepository.searchCaseSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting cmp seq number to 1 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 1 for 1st entry in the table for court case number.");
            newSqNum = "1";
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            log.info("Incrementing the existing court case seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        return CMP + "/" + newSqNum + "/" + LocalDate.now().getYear();
    }
}