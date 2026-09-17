package org.pucar.dristi.util;

import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.POAHolder;
import org.pucar.dristi.web.models.Party;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class CaseUtil {
    private static final String CHARACTERS = "0123456789";
    private static final SecureRandom random = new SecureRandom();

    public static String generateAccessCode(int length) {
        StringBuilder sb = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            int randomIndex = random.nextInt(CHARACTERS.length());
            char randomChar = CHARACTERS.charAt(randomIndex);
            sb.append(randomChar);
        }

        return sb.toString();
    }

    public String getCNRNumber(String fillingNumber, String state, String district, String establishmentCode) {
        String cnrNumber;
        String[] resp = fillingNumber.split("-");
        String sequenceNumber = resp[resp.length - 1];
        String year = resp[resp.length - 2];
        cnrNumber = state + district + establishmentCode + "-" + sequenceNumber + "-" + year;

        return cnrNumber;
    }

    public Long getCurrentTimeMil() {
        return System.currentTimeMillis();
    }


    public Map<String, List<POAHolder>> getLitigantPoaMapping(CourtCase cases) {
        List<String> litigantIds = Optional.ofNullable(cases.getLitigants()).orElse(Collections.emptyList()).stream().filter(Party::getIsActive).map(Party::getIndividualId).filter(Objects::nonNull).toList();
        Map<String, List<POAHolder>> litigantPoaMapping = Optional.ofNullable(cases.getPoaHolders())
                .orElse(Collections.emptyList())
                .stream()
                .filter(POAHolder::getIsActive)
                .flatMap(poa -> {
                    // Create pairs of (litigantId, poa) for each litigant this POA represents
                    return poa.getRepresentingLitigants().stream()
                            .filter(party -> party.getIndividualId() != null)
                            .map(party -> new AbstractMap.SimpleEntry<>(party.getIndividualId(), poa));
                })
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,  // Group by litigant ID
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                ));

        for (String id : litigantIds) {
            litigantPoaMapping.putIfAbsent(id, new ArrayList<>()); // fill in missing ones with empty list
        }
        return litigantPoaMapping;
    }
}