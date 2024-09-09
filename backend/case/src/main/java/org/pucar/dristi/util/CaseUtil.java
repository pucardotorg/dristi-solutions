package org.pucar.dristi.util;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

import org.pucar.dristi.repository.CaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import static org.pucar.dristi.config.ServiceConstants.COURTID;
import static org.pucar.dristi.config.ServiceConstants.ZONE_ID;

@Component
public class CaseUtil {
    private static final String CHARACTERS = "0123456789";
    private static final SecureRandom random = new SecureRandom();

    @Autowired
    private CaseRepository caseRepository;

    public String getCNRNumber(String fillingNumber, String state, String district, String establishmentCode) {
        String cnrNumber;
        String[] resp = fillingNumber.split("-");
        String sequenceNumber = resp[resp.length - 1];
        String year = resp[resp.length - 2];
        cnrNumber = state + district + establishmentCode + "-" + sequenceNumber + "-" + year;

        return cnrNumber;
    }

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
        Map<String,Object> resultMap = caseRepository.searchSeqNum("pg", COURTID);
        String newSqNumb = "";

        if(resultMap!=null) {
            String seqNum = resultMap.get("cnr_seq_num").toString();
            String createdTime = resultMap.get("created_time").toString();

            long currentTimeMillis = System.currentTimeMillis();
            LocalDateTime currentDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(currentTimeMillis), ZoneId.of(ZONE_ID));

            LocalDateTime lastInsertedDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(Long.parseLong(createdTime)), ZoneId.of(ZONE_ID));

            int currentYear = currentDateTime.getYear();
            int lastInsertedYear = lastInsertedDateTime.getYear();

            if (currentYear != lastInsertedYear) {
                newSqNumb = "000001";
                caseRepository.insertSeqNum(UUID.randomUUID(), tenantId, COURTID, newSqNumb,userID);
            } else {
                newSqNumb = String.valueOf(Integer.parseInt(seqNum) + 1);
                caseRepository.insertSeqNum(UUID.randomUUID(), tenantId, COURTID, String.format("%06d", Integer.parseInt(newSqNumb)), userID);
            }
        }else {
                newSqNumb = "000001";
                caseRepository.insertSeqNum(UUID.randomUUID(), tenantId, COURTID, newSqNumb,userID);
        }
        return COURTID + "-" + String.format("%06d", Integer.parseInt(newSqNumb)) + "-" + LocalDate.now().getYear();
    }
}