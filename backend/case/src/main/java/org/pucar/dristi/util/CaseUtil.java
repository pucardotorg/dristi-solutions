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
        //TODO: Atul. The courtID is the field from the case - Case.CourtID and not a hard coded value inside this method
        String seqNum = caseRepository.searchCNRSeqNum(tenantId, COURTID);
        String newSqNum;

        //setting cnr_seq_number to 000001 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 000001 for 1st entry in the table");
            newSqNum = "000001";
            caseRepository.insertCNRSeqNum(UUID.randomUUID(), tenantId, COURTID, newSqNum, userID);
        }else {
            //TODO:Atul: This is wrong. The query for Seq number in the DB, incrementing it and storing the updated value should all happen as part of a transaction
            //Incrementing the existing cnr seq number by 1 and inserting the 6 digit padded seq in the table
            log.info("Incrementing the existing seq number and inserting in the table");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            //TODO: Atul. Same comment as Filing Number. Padded number is only for display i.e. return with padding. But the number stored in DB will be simple integer
            newSqNum = String.format("%06d", Integer.parseInt(newSqNum));
            caseRepository.insertCNRSeqNum(UUID.randomUUID(), tenantId, COURTID, newSqNum, userID);
        }
        return COURTID + newSqNum + LocalDate.now().getYear();
    }

    public String generateFilingNumber(String tenantId, String userID, String seqLabel) {
        //TODO: Atul start - include the following comment
        //Filing Number format - [STATE]-[XXXXXX]-[cy:YYYY] where STATE comes from the TenantID
        //      XXXXXX is a 6 digit padded sequence number and YYYY is calendar year in YYYY format
        //      Eg. for Kerala, Kollam, ON Courts, state is KL. The number will be KL-000001-2024
        //TODO: Atul end
        //Searching last inserted filing seq number
        String seqNum = caseRepository.searchCaseSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting filing number seq to 000001 if no sequence number is present in the table
        if(seqNum == null){
            //TODO: Atul. Only filing and CNR numbers are padded. CMP and CC/ST numbers are not padded
            log.info("Inserting 000001 for 1st entry in the table for filing number.");
            //TODO: Atul. This should be initialized to 1
            newSqNum = "000001";
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            //TODO:Atul: This is wrong. The query for Seq number in the DB, incrementing it and storing the updated value should all happen as part of a transaction
            //Incrementing the existing filing seq by 1 and inserting the 6 digit padded seq in the table
            log.info("Incrementing the existing filing seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            //TODO: Atul: Padding is to be done only when showing on the UI. Store the simple integer in DB
            newSqNum = String.format("%06d", Integer.parseInt(newSqNum));
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        //TODO: Atul: the tenantId input field is the state. Why are we hard coding STATE in the number generation here
        // suggest to write the code like this
        //              String[] replacements = {tenantId, newSqNum, LocalDate.now().getYear()};
        //              return String.join("-", replacements);
        return STATE + "-" + newSqNum + "-" + LocalDate.now().getYear();
    }

    public String generateCMPNumber(String tenantId, String userID, String seqLabel) {
        //Searching last inserted cmp seq num
        //TODO: Atul. This number is specific to a state-district-establishment i.e. the courtID. Need to search using that and not tenantId
        String seqNum = caseRepository.searchCaseSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting cmp seq number to 1 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 1 for 1st entry in the table for cmp number.");
            newSqNum = "1";
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            //TODO:Atul: This is wrong. The query for Seq number in the DB, incrementing it and storing the updated value should all happen as part of a transaction
            log.info("Incrementing the existing cmp seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        //TODO: Atul: suggest to write the code like this
        //              String[] replacements = {"CMP", newSqNum, LocalDate.now().getYear()};
        //              return String.join("/", replacements);
        return CMP + "/" + newSqNum + "/" + LocalDate.now().getYear();
    }

    public String generateCourtCaseNumber(String tenantId, String userID, String seqLabel) {
        //Searching last inserted cmp seq num
        //TODO: Atul. This number is specific to a state-district-establishment i.e. the courtID. Need to search using that and not tenantId
        String seqNum = caseRepository.searchCaseSeqNum(tenantId, seqLabel);
        String newSqNum;

        //setting cmp seq number to 1 if no sequence number is present in the table
        if(seqNum == null){
            log.info("Inserting 1 for 1st entry in the table for court case number.");
            newSqNum = "1";
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }else {
            //TODO:Atul: This is wrong. The query for Seq number in the DB, incrementing it and storing the updated value should all happen as part of a transaction
            log.info("Incrementing the existing court case seq number and inserting in the table.");
            newSqNum = String.valueOf(Integer.parseInt(seqNum) + 1);
            caseRepository.insertCaseSeqNum(UUID.randomUUID(), tenantId, newSqNum, userID,seqLabel);
        }
        //TODO: Atul. Court Case Number or CCST number has prefix if CC or ST, which will ideally come from MDMS based on the case type i.e. status section. For NIA 138 cases, this is ST, So for now using ST, but need to replace this with MDMS code logic
        return STNumberPrefix + "/" + newSqNum + "/" + LocalDate.now().getYear();
    }
}